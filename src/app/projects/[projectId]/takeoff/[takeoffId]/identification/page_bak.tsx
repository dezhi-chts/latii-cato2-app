"use client";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  ConfigProvider,
  Divider,
  message,
  Modal,
  Popover,
  Select,
  Spin,
} from "antd";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getTakeOffById } from "@/services/takeOffService";
import { useUser } from "@/context/UserContext";

import { FileOperationType, FileStatus } from "../types/evidence";

import LoadingScreen from "@/components/loading-screen";
import Header from "./components/Header";
import BuildingBackground, {
  BuildLoadingStep,
} from "./components/BuildingBackground";
import PreAnalysisMdal from "./components/PreAnalysisMdal";
import IdentIndex from "./drawing-index/page";
import IdentSummary from "./index-summary/page";
import IdentLabel from "./page-label/page";
import ManualMerge from "../manual-merge/page";
import {
  useTakeoff,
  TakeoffProvider,
  FileViewStep,
} from "@/context/TakeoffContext";
import { analyzeItemByGeminiSdk } from "@/services/DrawingAiService";
import { notify } from "@/utils/notify";

const { confirm } = Modal;

export enum ButtonText {
  NextFile = "Next File",
  Complete = "Complete",
  Analysis = "Analysis",
  NextStep = "Next Step",
  FileMerge = "File Merge",
  CreateTakeoff = "Create Takeoff",
}

const PageLabelingContent = () => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;

  //const [selectedFileId, setSelectedFileId] = useState<number>(-1);
  //const [takeOff, setTakeOff] = useState<any>();

  //const [fileList, setFileList] = useState<any>([]);
  const [fullLoading, setFullLoading] = useState<boolean>(false);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);
  //const [fileViewStep, setFileViewStep] = useState<FileViewStep | ''>('');
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const { company_id } = useUser();

  const {
    selectedFileId,
    setSelectedFileId,
    fileList,
    setFileList,
    takeOff,
    setTakeOff,
    fileViewStep,
    setFileViewStep,
    indexBoxCount,
    loadFromStorage,
    clearStorage,
    mergeFileStatus,
  } = useTakeoff();

  const drawingIndexRef = useRef<any>(null);
  const drawingSummaryRef = useRef<any>(null);
  const drawingLabelRef = useRef<any>(null);
  const buildingStep = useRef("");

  useEffect(() => {
    if (takeOffId && company_id) {
      getTakeOffDetails();
    }
  }, [takeOffId, company_id]);

  const [isPageRefresh, setIsPageRefresh] = useState(false);
  const [isClearStorage, setIsClearStorage] = useState(true);

  useEffect(() => {
    const navigationEntries = performance.getEntriesByType('navigation');
    console.log('navigationEntries', navigationEntries);
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0] as PerformanceNavigationTiming;

      console.log('导航类型:', navEntry.type);
      // 可能的值: "navigate" | "reload" | "back_forward" | "prerender"

      if (navEntry.type === 'reload') {
        return 'refresh'; // 页面刷新 (F5 / Ctrl+R)
      }

      if (navEntry.type === 'back_forward') {
        return 'back_forward'; // 前进/后退按钮
      }

      if (navEntry.type === 'navigate') {
        return 'navigate'; // 正常导航（点击链接、地址栏输入等）
      }
    }
    // 步骤1：监听页面卸载前的事件（刷新/关闭标签页都会触发）
    const handleBeforeUnload = () => {
      // 存入sessionStorage，标记"页面即将刷新"
      sessionStorage.setItem("isRefreshing", "true");
      // 注：sessionStorage 仅在当前标签页有效，关闭标签页后会清空，适合区分刷新
    };

    // 步骤2：页面加载时校验标记
    const checkRefresh = () => {
      const isRefreshing = sessionStorage.getItem("isRefreshing");
      console.log("isRefreshing", isRefreshing);
      if (isRefreshing === "true") {
        // 说明是刷新行为
        setIsPageRefresh(true);
        // 清空标记，避免下次加载误判
        sessionStorage.removeItem("isRefreshing");
      } else {
        // 首次加载/路由跳转
        setIsPageRefresh(false);
      }
    };

    // 绑定事件
    window.addEventListener("beforeunload", handleBeforeUnload);
    // 页面加载完成后校验
    checkRefresh();

    // 组件卸载时解绑事件（避免内存泄漏）
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (isClearStorage) {
        // 组件卸载时清除sessionStorage标记
        clearStorage();
      }
    };
  }, []);

  const getTakeOffDetails = async () => {
    setFullLoading(true);
    let res: any = await getTakeOffById(takeOffId as any);
    if (res.status === "success") {
      let project_files = res?.data?.project_files ?? [];
      setTakeOff(res?.data ?? {});
      if (project_files?.length > 0) {
        let loadedFiles = loadFromStorage();
        if (loadedFiles?.fileList?.length > 0) {
          // 将本地保存的文件状态同步到项目文件状态
          let list = mergeFileStatus(project_files);
          setFileList(list);

          // 检查是否所有文件都已完成
          const allCompleted = list.every(
            (file: any) => file.status === FileStatus.Completed,
          );
          if (allCompleted) {
            // 如果所有文件都已完成，不设置选中文件id，设置为合并页面
            setSelectedFileId(-1);
            setFileViewStep(FileViewStep.FileMerge);
          } else {
            // 检查是否只有一个文件为处理中
            const processFiles = list.filter(
              (file: any) => file.status === FileStatus.Processing,
            );
            if (processFiles.length === 1) {
              // 如果只有一个处理中的文件，设置为选中文件
              const processFile = processFiles[0];
              setSelectedFileId(processFile.id);
              setFileViewStep(
                processFile.operation_type ===
                  FileOperationType.ArchitectureDrawing
                  ? FileViewStep.IndexSummary
                  : FileViewStep.Second,
              );
            } else {
              // 其他情况默认设置第一个文件为当前操作文件
              setSelectedFileId(project_files[0].id);
              setFileViewStep(
                project_files[0].operation_type ===
                  FileOperationType.ArchitectureDrawing
                  ? FileViewStep.IndexSummary
                  : FileViewStep.Second,
              );
            }
          }
        } else {
          // 如果loadedFiles?.fileList为空，取第一个文件的设置逻辑
          const updatedFiles = project_files.map((file: any, index: number) =>
            index === 0 ? { ...file, status: FileStatus.Processing } : file,
          );
          setFileList(updatedFiles);
          setSelectedFileId(project_files[0].id);
          setFileViewStep(
            project_files[0].operation_type ===
              FileOperationType.ArchitectureDrawing
              ? FileViewStep.IndexSummary
              : FileViewStep.Second,
          );
        }
      } else {
        notify.error({
          title: "Error",
          description: "No files found in this take off",
        });
      }
    } else {
      notify.error({
        title: "Error",
        description: "Failed to get take off",
      });
    }
    setFullLoading(false);
  };

  const handleChangeFile = async (fileId: number) => {
    if (selectedFileId === fileId) return;
    // 切换文件, 判断当前是否有未保存的crop，如果有则显示提示框并且保存
    const unsaved = await drawingLabelRef?.current?.getUnsavedCrops?.();
    if (!drawingLabelRef.current || unsaved) {
      // 判断fileId的文件是否是已完成状态，已完成的文件才可以点击，未完成的文件不允许点击
      const file = fileList.find((file: any) => file.id === fileId);
      if (file?.status === FileStatus.Completed) {
        handleFileStatus(selectedFileId, fileId);
      }
    }
  };

  const handleAnaylize = async () => {
    const response = await analyzeItemByGeminiSdk(takeOffId as string, 1);
    console.log(response);
  };

  const handleFileStatus = (oldFileId: number, newFileId: number) => {
    setSelectedFileId(newFileId);
    setFileList((prev) => {
      return prev.map((file: any) => {
        if (file.id === oldFileId) {
          if (
            file.operation_type === FileOperationType.ArchitectureDrawing &&
            fileViewStep === FileViewStep.Second
          ) {
            return { ...file, status: FileStatus.Completed };
          } else if (
            file.operation_type === FileOperationType.Quote &&
            fileViewStep === FileViewStep.Second
          ) {
            return { ...file, status: FileStatus.Completed };
          }
          return { ...file, status: FileStatus.Uploaded };
        } else if (file.id === newFileId) {
          return { ...file, status: FileStatus.Processing };
        }
        return file;
      });
    });

    let fileInfo = fileList.find((file: any) => file.id === newFileId);
    if (fileInfo?.operation_type === FileOperationType.ArchitectureDrawing) {
      setFileViewStep(
        fileInfo.status === FileStatus.Completed
          ? FileViewStep.Second
          : FileViewStep.IndexSummary,
      );
    } else if (fileInfo?.operation_type === FileOperationType.Quote) {
      setFileViewStep(FileViewStep.Second);
    }
  };

  const handleNext = async (buttonInfo: { text: string }) => {
    if (buttonInfo.text === ButtonText.NextFile) {
      let filterFiles = fileList.filter(
        (file: any) => file.id !== selectedFileId,
      );
      let nextFile = filterFiles.find(
        (file: any) => file.status !== FileStatus.Completed,
      );
      if (nextFile) {
        // 切换下一个文件时，先判断是否有未保存的crop
        const unsaved = await drawingLabelRef?.current?.getUnsavedCrops();
        if (!drawingLabelRef?.current || unsaved) {
          // 没有未保存的crop，切换文件
          handleFileStatus(selectedFileId, nextFile.id);
        }
      }
    } else if (buttonInfo.text === ButtonText.Analysis) {
      // 调用手动分析接口
      drawingIndexRef?.current?.recognizeDrawingIndexData();
    } else if (buttonInfo.text === ButtonText.NextStep) {
      // 跳转到完成页面
      if (fileViewStep === FileViewStep.IndexSummary) {
        setFileViewStep(FileViewStep.Second);
      }
    } else if (buttonInfo.text === ButtonText.FileMerge) {
      // 切换到合并页面的时候，判断是否有未保存的crop
      const unsaved = await drawingLabelRef?.current?.getUnsavedCrops();
      if (!drawingLabelRef?.current || unsaved) {
        // 先将当前文件状态标记为 Completed
        setFileList((prev: any[]) => {
          return prev.map((file: any) => {
            if (file.id === selectedFileId) {
              return { ...file, status: FileStatus.Completed };
            }
            return file;
          });
        });

        buildingStep.current = BuildLoadingStep.PageMerge;
        setBuildLoading(true);
        setTimeout(() => {
          setBuildLoading(false);
          setSelectedFileId(-1);
          setFileViewStep(FileViewStep.FileMerge);
        }, 5000);
      }
    } else if (buttonInfo.text === ButtonText.CreateTakeoff) {
      buildingStep.current = BuildLoadingStep.PageTakeOff;
      setBuildLoading(true);
      await handleAnaylize();
      setBuildLoading(false);
    }
  };

  const fileOperationType = useMemo(() => {
    if (!fileList.length) return "";
    let file = fileList.find((file: any) => file.id === selectedFileId);
    return file?.operation_type || "";
  }, [fileList, selectedFileId]);

  // 处理返回按钮的点击事件
  const handleBack = useCallback(() => {
    // 处理返回上一个文件的逻辑
    const handleBackToPreviousFile = () => {
      console.log("fileList", fileList);
      let findIndex = fileList.findIndex(
        (file: any) => file.id === selectedFileId,
      );
      console.log("findIndex", findIndex);
      if (findIndex > 0) {
        let prevFile = fileList[findIndex - 1];
        if (prevFile.status === FileStatus.Completed) {
          setSelectedFileId(prevFile.id);
          setFileViewStep(FileViewStep.Second);
        } else if (
          prevFile.operation_type === FileOperationType.ArchitectureDrawing
        ) {
          setSelectedFileId(prevFile.id);
          setFileViewStep(FileViewStep.IndexSummary);
        }
        // 更新文件状态为processing
        setFileList((prev: any[]) => {
          return prev.map((file: any) => {
            if (file.id === prevFile.id) {
              // 下一个文件状态更改为操作中
              return { ...file, status: FileStatus.Processing };
            } else if (file.id === selectedFileId) {
              // 上一个文件状态更改为未完成
              return { ...file, status: FileStatus.Uploaded };
            }
            return file;
          });
        });
      } else {
        // 如果前面没有文件可以返回了，则直接执行goBack
        router.back();
      }
    };

    if (fileViewStep === FileViewStep.IndexDrawing) {
      // 如果是index视图，则返回到summary视图
      setFileViewStep(FileViewStep.IndexSummary);
    } else if (fileViewStep === FileViewStep.Second) {
      if (fileOperationType === FileOperationType.ArchitectureDrawing) {
        // 如果是label视图，则返回到summary视图
        setFileViewStep(FileViewStep.IndexSummary);
      } else {
        handleBackToPreviousFile();
      }
    } else if (fileViewStep === FileViewStep.IndexSummary) {
      handleBackToPreviousFile();
    } else if (fileViewStep === FileViewStep.FileMerge) {
      // 如果是合并视图，返回的时候，返回最后一个文件
      let lastFile = fileList[fileList.length - 1];
      setSelectedFileId(lastFile.id);
      setFileViewStep(
        lastFile.status === FileStatus.Completed
          ? FileViewStep.Second
          : FileViewStep.IndexSummary,
      );
      // 更新文件状态为processing
      setFileList((prev: any[]) => {
        return prev.map((file: any) => {
          if (file.id === lastFile.id) {
            return { ...file, status: FileStatus.Processing };
          }
          return file;
        });
      });
    } else {
      // 其他情况执行 goBack
      router.back();
    }
  }, [fileViewStep, selectedFileId, fileList, fileOperationType, router]);

  // 右上角按钮的相关信息
  const nextButtonInfo = useMemo(() => {
    const hasMultipleFiles = fileList.length > 1;
    const allFilesCompleted = fileList.every(
      (file: any) => file.status === FileStatus.Completed,
    );
    const otherFilesComplete = fileList
      .filter((file: any) => file.id !== selectedFileId)
      .every((file: any) => file.status === FileStatus.Completed);
    const hasUnsavedCrops = indexBoxCount === 0;

    // FileMerge 步骤：显示 Create Takeoff
    if (fileViewStep === FileViewStep.FileMerge) {
      return {
        text: ButtonText.CreateTakeoff,
        disabled: false,
      };
    }

    // IndexDrawing 步骤：公共逻辑
    if (fileViewStep === FileViewStep.IndexDrawing) {
      return {
        text: ButtonText.Analysis,
        disabled: hasUnsavedCrops,
      };
    }

    // IndexSummary 步骤：公共逻辑
    if (fileViewStep === FileViewStep.IndexSummary) {
      return {
        text: ButtonText.NextStep,
        disabled: false,
      };
    }

    // Second 步骤：根据文件数量区分逻辑
    if (fileViewStep === FileViewStep.Second) {
      if (hasMultipleFiles) {
        // 关键逻辑：如果其他文件都已完成（无论当前文件状态如何），则进入合并步骤
        if (otherFilesComplete) {
          return {
            text: ButtonText.FileMerge, // 进入 File Merge
            disabled: false,
          };
        } else {
          // 还有其他未完成的文件
          return {
            text: ButtonText.NextFile,
            disabled: false,
          };
        }
      } else {
        // 单个文件完成
        return {
          text: ButtonText.CreateTakeoff,
          disabled: false,
        };
      }
    }

    return { text: ButtonText.NextStep, disabled: false };
  }, [fileList, selectedFileId, fileViewStep, indexBoxCount]);

  return (
    <div className={`w-full flex flex-col relative h-[100vh]`}>
      <Header
        fileList={fileList}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
        onChangeFile={(fileId: number) => handleChangeFile(fileId)}
        nextButtonInfo={nextButtonInfo}
        handleNext={handleNext}
        onHandleBack={handleBack}
        fileViewStep={fileViewStep}
      />
      <div className="flex-1 flex overflow-hidden">
        {fileViewStep === FileViewStep.IndexDrawing && (
          <IdentIndex ref={drawingIndexRef} />
        )}
        {fileViewStep === FileViewStep.IndexSummary && (
          <IdentSummary ref={drawingSummaryRef} />
        )}
        {fileViewStep === FileViewStep.Second && (
          <IdentLabel ref={drawingLabelRef} />
        )}
        {fileViewStep === FileViewStep.FileMerge && <ManualMerge></ManualMerge>}
      </div>
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
      {buildLoading && <BuildingBackground step={buildingStep.current} />}
      {showAnalysisModal && (
        <PreAnalysisMdal
          isOpen={showAnalysisModal}
          closeModal={() => setShowAnalysisModal(false)}
          handleAnalysis={() => {
            setShowAnalysisModal(false);
          }}
        ></PreAnalysisMdal>
      )}
    </div>
  );
};

const PageLabeling = () => {
  return <PageLabelingContent />;
};
export default PageLabeling;
