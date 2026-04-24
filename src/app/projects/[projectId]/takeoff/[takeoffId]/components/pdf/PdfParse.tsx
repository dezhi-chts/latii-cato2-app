import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import http from "@/lib/http";
import Image from "next/image";
import { Button } from "antd";
import { useRouter } from "next/navigation";
import { notify } from "@/utils/notify";

enum ConnectionStatus {
  READY = "ready",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
  CANCEL = "cancel",
  DISCONNECTED = "disconnected",
}

const PdfParse = ({
  data,
  handleNext,
  handleCancel,
}: {
  data: any;
  handleNext: (type: "takeoffModal" | "pageIndex") => void;
  handleCancel: () => void;
}) => {
  const router = useRouter();
  // ===== 状态管理 =====
  const [fileList, setFileList] = useState<any>([]);
  const [selectedFileId, setSelectedFileId] = useState<number>(-1);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.READY,
  );
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [logs, setLogs] = useState<
    Array<{ time: string; message: string; type: "info" | "success" | "error" }>
  >([]);
  const [taskInfo, setTaskInfo] = useState<{
    requestId: string;
    sseUrl: string;
  } | null>(null);
  const [results, setResults] = useState<Record<string, number>>({});

  // 用 useRef 保存 EventSource 实例
  const eventSourceRef = useRef<EventSource | null>(null);
  // 用 useRef 保存日志列表元素，用于自动滚动
  const logsRef = useRef<HTMLDivElement>(null);
  // 用 useRef 保存最新的 handleMessage 函数引用，解决闭包问题
  const handleMessageRef = useRef<any>(null);

  // 定义文件状态类型
  enum FileStatus {
    NOT_STARTED = "not_started",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
  }

  // 定义文件项类型
  type FileItem = {
    id: string | number;
    name: string;
    status: FileStatus;
    [key: string]: any;
  };

  useEffect(() => {
    if (data?.project_id && data?.files?.length > 0) {
      const list = data?.files?.map((item: any) => ({
        id: item.id,
        name: item.file_name,
        status: FileStatus.NOT_STARTED,
      }));
      setFileList(list);
      if (list.length > 0) {
        setSelectedFileId(list[0].id);
        // 开始解析第一个文件
        handleFileClassification(list[0].id);
      }
      // let list = [{
      //   id: 1,
      //   name: 'test1',
      //   status: FileStatus.NOT_STARTED,
      // }, {
      //   id: 2,
      //   name: 'test2',
      //   status: FileStatus.PROCESSING,
      // }, {
      //   id: 3,
      //   name: 'test3',
      //   status: FileStatus.COMPLETED,
      // }, {
      //   id: 4,
      //   name: 'test4',
      //   status: FileStatus.FAILED,
      // }]
      // setFileList(list);
      // setSelectedFileId(list[0].id);
      // 从第一个文件开始解析
      //handleFileClassification(list[0].id);
    }
  }, [data]);

  // ===== 组件卸载时清理 =====
  useEffect(() => {
    // 处理热重载时的清理
    if ((module as any).hot) {
      const cleanup = () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      };
      (module as any).hot.dispose(cleanup);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // ===== 设置状态 =====
  const apiBaseUrl = process.env.NEXT_PUBLIC_PROJECTS_API;
  const modelName = "unit_detect_11x_v1"; //'unit_detect_8l_v1';
  const confidenceThreshold = 0.35;
  const iouThreshold = 0.45;
  const dpi = 100;
  const maxConcurrentBatches = 6;
  const enableAiClassification = true;

  // ===== API 配置 =====
  const API_CONFIG = {
    baseUrl: apiBaseUrl,
    endpoints: {
      init: "/sse/classify-pages-sse-init",
      initFromProjectFile: "/sse/classify-pages-from-project-file-init",
      sse: "/sse/classify-status"
    },
  };

  // 辅助函数：构建完整URL
  const buildUrl = (endpoint: string, path: string = "") => {
    return `${API_CONFIG.baseUrl}${endpoint}${path}`;
  };

  // ===== 添加日志 =====
  const addLog = (
    message: string,
    type: "info" | "success" | "error" = "info",
  ) => {
    let time = `[${new Date().toLocaleTimeString()}]`;
    setLogs((prev) => [...prev, { time, message, type }]);
    // 在下一次渲染后滚动到日志列表底部
    setTimeout(() => {
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    }, 0);
  };

  // ===== 更新连接状态 =====
  const updateConnectionStatus = (status: ConnectionStatus) => {
    setConnectionStatus(status);
  };

  // ===== 初始化任务（从项目文件） =====
  const initializeTask = async (fileId: number) => {
    const axiosParams = {
      project_file_id: fileId,
      model_name: modelName,
      confidence_threshold: confidenceThreshold,
      iou_threshold: iouThreshold,
      dpi: dpi,
      enable_ai_classification: enableAiClassification,
      max_concurrent_batches: maxConcurrentBatches,
    };

    try {
      const response: any = await http.post(
        buildUrl(API_CONFIG.endpoints.initFromProjectFile),
        null,
        { params: axiosParams },
      );
      if (response) {
        return response;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      throw new Error(`Failed to initialize task: ${(error as Error).message}`);
    }
  };

  const handleMessage = useCallback(
    (data: any) => {
      console.log("[SSE] Event type:", data.type);
      switch (data.type) {
        case "CONNECTED":
          {
            addLog("✅ Connection confirmed by server", "success");
            let newFileList = fileList.map((file: FileItem) => {
              if (file.id === selectedFileId) {
                return { ...file, status: FileStatus.PROCESSING };
              }
              return file;
            });
            setFileList(newFileList);
          }
          break;

        case "PROGRESS":
          {
            updateProgress(data.progress, data.message);
            addLog(data.message, data.level?.toLowerCase() || "info");
            let fileInfo = fileList.find(
              (file: FileItem) => file.id === selectedFileId,
            );
            if (fileInfo && fileInfo.status !== FileStatus.PROCESSING) {
              let newFileList = fileList.map((file: FileItem) => {
                if (file.id === selectedFileId) {
                  return { ...file, status: FileStatus.PROCESSING };
                }
                return file;
              });
              setFileList(newFileList);
            }
          }
          break;

        case "COMPLETED":
          {
            updateProgress(data.progress, "✅ Classification completed!");
            addLog("✅ Classification completed!", "success");
            updateConnectionStatus(ConnectionStatus.DISCONNECTED);
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }

            // 完成当前文件后，查找还有其他未解析的文件吗，如果存在，则直接解析下一个，否则设置状态为完成
            let newFileList = fileList.map((file: FileItem) => {
              if (file.id === selectedFileId) {
                return { ...file, status: FileStatus.COMPLETED };
              }
              return file;
            });
            setFileList(newFileList);

            // 获取当前完成的文件名并显示通知
            const completedFile = fileList.find(
              (file: FileItem) => file.id === selectedFileId,
            );
            if (completedFile) {
              notify.success({
                title: "Success",
                description: `File "${completedFile.name}" has been parsed successfully!`,
              });
            }

            const nextFile = newFileList.find(
              (file: FileItem) => file.status === FileStatus.NOT_STARTED,
            );
            if (nextFile) {
              // 有下一个文件未解析，直接解析下一个
              setSelectedFileId(nextFile.id);
              handleFileClassification(nextFile.id);
            } else {
              // 已经解析完所有的文件，显示下一步按钮
            }
          }
          break;
        case "DONE":
          addLog("ℹ️ Stream ended normally", "info");
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
          break;

        case "ERROR":
          {
            addLog("❌ Server error: " + data.message, "error");
            updateConnectionStatus(ConnectionStatus.ERROR);
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            let newFileList = fileList.map((file: FileItem) => {
              if (file.id === selectedFileId) {
                return { ...file, status: FileStatus.FAILED };
              }
              return file;
            });
            setFileList(newFileList);
          }
          break;

        case "CANCELLED":
          {
            addLog("⚠️ Task cancelled by server", "info");
            updateConnectionStatus(ConnectionStatus.CANCEL);
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            let newFileList = fileList.map((file: FileItem) => {
              if (file.id === selectedFileId) {
                return { ...file, status: FileStatus.FAILED };
              }
              return file;
            });
            setFileList(newFileList);
          }
          break;
        default: {
          console.warn("[SSE] Unknown event type:", data.type);
          addLog(`⚠️ Unknown event type: ${data.type}`, "info");
          let newFileList = fileList.map((file: FileItem) => {
            if (file.id === selectedFileId) {
              return { ...file, status: FileStatus.FAILED };
            }
            return file;
          });
          setFileList(newFileList);
        }
      }
    },
    [fileList, selectedFileId],
  );

  // 在useEffect中更新handleMessageRef，确保它始终指向最新的handleMessage函数
  useEffect(() => {
    handleMessageRef.current = handleMessage;
  }, [handleMessage]);

  // ===== 连接SSE =====
  const connectSSE = (requestId: string) => {
    // 先关闭现有的SSE连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const sseUrl = buildUrl(API_CONFIG.endpoints.sse, `/${requestId}`);
    eventSourceRef.current = new EventSource(sseUrl);

    let lastEventTime = Date.now();
    let heartbeatTimer: any = null;

    // Cleanup function to clear the heartbeat timer
    const cleanup = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    // 心跳检测
    heartbeatTimer = setInterval(() => {
      const elapsed = Date.now() - lastEventTime;
      if (elapsed > 60000) {
        // 60秒没有收到消息
        addLog("⚠️ No data received for 60s, connection may be stale", "info");
        cleanup(); // Stop checking after warning
      }
    }, 10000);

    eventSourceRef.current.onopen = () => {
      updateConnectionStatus(ConnectionStatus.CONNECTED);
      addLog("✅ SSE connection established", "success");
      addLog(
        `ℹ️ ReadyState: ${eventSourceRef.current?.readyState} (OPEN)`,
        "info",
      );
      lastEventTime = Date.now();
    };

    eventSourceRef.current.onmessage = (event) => {
      lastEventTime = Date.now();

      // 调试：打印原始数据
      console.log("[SSE] Received:", event.data);
      try {
        const data = JSON.parse(event.data);
        // 使用handleMessageRef.current调用最新的handleMessage函数
        handleMessageRef.current(data);
      } catch (error) {
        console.error("Failed to parse SSE data:", event.data);
        addLog(
          "⚠️ Failed to parse event data: " +
          (error instanceof Error ? error.message : String(error)),
          "error",
        );
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error("[SSE] Error event:", error);
      console.error("[SSE] ReadyState:", eventSourceRef.current?.readyState);
      console.error("[SSE] URL:", eventSourceRef.current?.url);

      cleanup();

      // ReadyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
      const stateNames = ["CONNECTING", "OPEN", "CLOSED"];
      const currentState =
        stateNames[eventSourceRef.current?.readyState ?? 0] || "UNKNOWN";

      addLog("❌ SSE connection error", "error");

      if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
        addLog(`⚠️ SSE connection closed (State: ${currentState})`, "error");
        addLog("ℹ️ Possible causes:", "info");
        addLog("  1. Task completed (check if you received results)", "info");
        addLog("  2. Backend error (check server logs)", "info");
        addLog("  3. Network timeout", "info");
        addLog("  4. CORS issue", "info");

        eventSourceRef.current?.close();
        updateConnectionStatus(ConnectionStatus.ERROR);
      } else if (
        eventSourceRef.current?.readyState === EventSource.CONNECTING
      ) {
        addLog("🔄 SSE reconnecting...", "info");
        updateConnectionStatus(ConnectionStatus.CONNECTING);
      }
    };
  };

  // 更新进度
  const updateProgress = (progress: number, message: string) => {
    const percentage = Math.round(progress * 100);
    setProcessingProgress(percentage);
  };

  // ===== 处理项目文件分类 =====
  const handleFileClassification = async (fileId: number) => {
    const id = fileId;
    if (!id || id < 1) return;

    console.log("Starting classification for project file:", id);

    updateConnectionStatus(ConnectionStatus.CONNECTING);

    try {
      // 初始化任务
      addLog(`🗂️ Initializing task for project file ID: ${id}...`, "info");
      const initResult = await initializeTask(id);

      console.log("###### initResult", initResult);
      // 显示任务信息
      setTaskInfo({
        requestId: initResult.request_id,
        sseUrl: initResult.sse_url,
      });

      addLog(`✅ Task created: ${initResult.request_id}`, "success");
      if (initResult.filename) {
        addLog(`📄 File: ${initResult.filename}`, "info");
      }
      if (initResult.project_file_id) {
        addLog(`🆔 Project File ID: ${initResult.project_file_id}`, "info");
      }

      // 重置进度条
      setProcessingProgress(0);

      // 订阅SSE流
      connectSSE(initResult.request_id);
    } catch (error) {
      console.error("Error:", error);
      addLog(`❌ Error: ${(error as Error).message}`, "error");
      updateConnectionStatus(ConnectionStatus.ERROR);
    }
  };

  const totalFileStatus = useMemo(() => {
    // 确保fileList不为空且长度大于0，才进行状态判断
    if (!fileList || fileList.length === 0) {
      return null;
    }

    let existFailedFile = fileList.some(
      (file: any) => file.status === FileStatus.FAILED,
    );
    if (existFailedFile) {
      // 存在失败的文件，则判断是否存在已完成的文件，只要有一个已完成的文件，则返回已完成
      let existCompletedFile = fileList.some(
        (file: any) => file.status === FileStatus.COMPLETED,
      );
      if (existCompletedFile) {
        return FileStatus.COMPLETED;
      }
      return FileStatus.FAILED;
    }

    let allFileCompleted = fileList.every(
      (file: any) => file.status === FileStatus.COMPLETED,
    );
    if (allFileCompleted) {
      return FileStatus.COMPLETED;
    }

    return null;
  }, [fileList]);

  // 监听totalFileStatus的变化，触发相应的通知
  useEffect(() => {
    if (totalFileStatus === FileStatus.FAILED) {
      notify.error({
        title: "Error",
        description: "One or more files failed to process.",
      });
    }
  }, [totalFileStatus]);

  return (
    <div className="w-full h-full p-4 overflow-hidden font-nunito">
      <div className="h-full flex flex-col bg-white rounded-xl">
        <h1 className="text-lg text-forumBlue-normal mb-3 flex items-center gap-2">
          PDF Classification System
          <span className="bg-forumBlue-normal text-white px-2 py-0.5 rounded-full text-xxs">
            SSE
          </span>
        </h1>

        <div className="px-3 h-[28px] rounded-md text-xs flex items-center gap-2 bg-grey-light text-grey-normal border border-primaryN30">
          SSE Connection Status: <span className="text-forumBlue-normal">{connectionStatus}</span>
        </div>

        {/** 文件列表  */}
        {fileList.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-row gap-3 flex-wrap">
              {fileList.map((file: any, index: number) => {
                const getCardStyle = () => {
                  switch (file.status) {
                    case FileStatus.NOT_STARTED:
                      return "bg-grey-light border-primaryN30 opacity-60";
                    case FileStatus.PROCESSING:
                      return "bg-forumBlue-light/10 border-forumBlue-normal";
                    case FileStatus.COMPLETED:
                      return "bg-green-normal/10 border-green-normal";
                    case FileStatus.FAILED:
                      return "bg-red-50 border-red-400";
                    default:
                      return "bg-grey-light border-primaryN30";
                  }
                };

                const getStatusIcon = () => {
                  switch (file.status) {
                    case FileStatus.NOT_STARTED:
                      return (
                        <div className="w-4 h-4 border-2 border-primaryN30 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-grey-normal">−</span>
                        </div>
                      );
                    case FileStatus.PROCESSING:
                      return (
                        <div className="w-4 h-4 bg-forumBlue-normal rounded-full flex items-center justify-center animate-pulse">
                          <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      );
                    case FileStatus.COMPLETED:
                      return (
                        <div className="w-4 h-4 bg-green-normal rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px]">✓</span>
                        </div>
                      );
                    case FileStatus.FAILED:
                      return (
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px]">!</span>
                        </div>
                      );
                  }
                };

                const getStatusText = () => {
                  switch (file.status) {
                    case FileStatus.NOT_STARTED:
                      return "Pending";
                    case FileStatus.PROCESSING:
                      return "Processing";
                    case FileStatus.COMPLETED:
                      return "Completed";
                    case FileStatus.FAILED:
                      return "Failed";
                  }
                };

                const getTextColor = () => {
                  switch (file.status) {
                    case FileStatus.NOT_STARTED:
                      return "text-grey-normal";
                    case FileStatus.PROCESSING:
                      return "text-forumBlue-normal";
                    case FileStatus.COMPLETED:
                      return "text-green-normal";
                    case FileStatus.FAILED:
                      return "text-red-500";
                  }
                };

                return (
                  <div
                    key={index}
                    className={`w-28 rounded-md border-2 flex flex-col p-2 relative transition-all duration-300 ${getCardStyle()}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon()}
                      <span className={`text-[10px] ${getTextColor()}`}>
                        {getStatusText()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Image
                        className="w-4 h-4 flex-shrink-0"
                        src="/assets/icons/extensions/pdf.svg"
                        alt="pdf"
                        width={16}
                        height={16}
                      />
                      <span className="text-grey-normal text-xxs truncate">
                        {file.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Task Information */}
        <div className="mt-3 bg-grey-light border border-primaryN30 p-3 rounded-md mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-grey-normal">Task ID:</span>
            <span className="font-mono text-forumBlue-normal text-xs truncate max-w-[70%]">
              {taskInfo?.requestId || ""}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-grey-normal">SSE URL:</span>
            <span className="font-mono text-forumBlue-normal text-xs truncate max-w-[70%]">
              {taskInfo?.sseUrl || ""}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-grey-light rounded-md p-3 mb-3 overflow-hidden border border-primaryN30">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs text-grey-normal">Processing Progress</h3>
            <span className="text-forumBlue-normal text-sm">
              {processingProgress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mb-3 border border-primaryN30">
            <div
              className="h-full bg-forumBlue-normal"
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          <div className="flex-1 flex flex-col bg-white rounded-md p-2 overflow-hidden border border-primaryN30">
            <div className="overflow-y-auto" ref={logsRef}>
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 mb-1 rounded text-xxs ${log.type === "error" ? "bg-red-50 text-red-600" : log.type === "success" ? "bg-green-50 text-green-600" : "text-grey-normal"}`}
                >
                  <span className="font-mono">
                    {log.time} <span className="ml-1">{log.message}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          {/** 所有文件都已经解析完成 */}
          {totalFileStatus === FileStatus.COMPLETED && (
            <div>
              <Button
                className="custom-primary-btn"
                onClick={() => handleNext("takeoffModal")}
              >
                Next
              </Button>
            </div>
          )}
          {totalFileStatus === FileStatus.FAILED && (
            <div>
              <Button
                className="custom-primary-btn"
                onClick={() => handleNext("pageIndex")}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfParse;
