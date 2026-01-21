"use client";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  ConfigProvider,
  Divider,
  message,
  notification,
  Popover,
  Select,
  Spin,
} from "antd";
import {
  ArrowDownOutlined,
  ClearOutlined,
  DownOutlined,
  CloseOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";

import { generateEvidenceByFileId, getEvidenceByFileId } from "@/services/evidenceService";
import { getTakeOffById } from "@/services/takeOffService";
import { fetchProject } from "@/services/projectService";

import PdfWrapper from "../components/pdf/PdfWrapper";
import Header from "./components/Header";
import Thumbnail from "../components/pdf/Thumbnail";
import { EvidenceType, PdfWrapperRefMethods } from "../types/evidence";
import debounce from "lodash/debounce";

type AddingType = "Item" | "Table";
export type Adding = {
  isAdding: boolean;
  type: AddingType | null;
};

const Identification = () => {
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;
  const pdfRef = useRef<PdfWrapperRefMethods | null>(null);

  const [selectedFileId, setSelectedFileId] = useState<number>(-1);
  const [takeOff, setTakeOff] = useState<any>();
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [adding, setAdding] = useState<Adding>({
    isAdding: false,
    type: "Item",
  });
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const { fileEvidence, setFileEvidence, fileEvidenceRef } =
    useFileEvidenceState();
  const [project, setProject] = useState<any>({});
  const [thumbnailList, setThumbnailList] = useState<any>([]);
  const [showThumbnail, setShowThumbnail] = useState<boolean>(false);
  const [fullLoading, setFullLoading] = useState<boolean>(false);

  const [cropsCount, setCropsCount] = useState<number>(0);
  // evidence 数据是否已经加载完成
  const evidenceIsLoaded = useRef(false);
  const [fileAutoDrawing, setFileAutoDrawing] = useState<
    Array<{
      file_id: number | string;
      page_pdfjs_polygons: any;
    }>
  >([]);

  useEffect(() => {
    if (takeOff) {
      setProject(takeOff.project);
    }
  }, [takeOff]);

  useEffect(() => {
    getProjectInfo();
  }, [projectId]);

  const getFileEvidences = useCallback(
    async (fileId?: number) => {
      // 使用传入的fileId，如果没有传入则使用最新的selectedFileId
      const currentFileId = fileId ?? selectedFileId;

      // 如果fileId无效，直接返回
      if (currentFileId === -1 || !currentFileId) {
        return;
      }

      evidenceIsLoaded.current = false;
      const response = await getEvidenceByFileId(
        projectId as any,
        currentFileId
      );
      if (response.status === "success") {
        // 标记为已加载
        evidenceIsLoaded.current = true;
        setFileEvidence([...(response?.data || [])]);
      } else {
        // 加载失败，则标记为未加载
        evidenceIsLoaded.current = false;
        notification.error({
          message: "Error",
          description: "Failed to get file evidences",
        });
      }
    },
    [selectedFileId]
  );

  const getProjectInfo = async () => {
    let res = await fetchProject(projectId as any);
    if (res) {
      setProject(res);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get project",
      });
    }
  };

  const getTakeOff = useCallback(async () => {
    setFullLoading(true);
    const response = await getTakeOffById(takeOffId as string);
    if (response.status === "success") {
      let res = response.data;
      const isNew = res?.take_off_result?.status === 1;
      if (isNew) {
        setTakeOff(res);
        if (res?.project_files?.length > 0) {
          // 获取到url后立即加载pdfurl，避免页面空白显示较长
          let firstFile = res?.project_files[0];
          setPdfUrl(firstFile?.parse_detail?.uploaded_file_url);
          setThumbnailList((prev: any[]) => [
            ...(firstFile?.parse_detail?.image_page_infos || []),
          ]);

          // 先设置selectedFileId
          setSelectedFileId(firstFile?.id);

          // 然后获取file evidence，使用传入的文件ID而不是依赖selectedFileId状态
          getFileEvidences(firstFile?.id);
        }
      }
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get Takeoff",
      });
    }
    setFullLoading(false);
  }, [takeOffId]);

  useEffect(() => {
    if (selectedFileId === -1) return;
    pdfRef?.current?.checkAndHandleUnsavedCrops?.().then((unsaved) => {
      if (unsaved) {
        // 没有crop需要保存

        pdfRef?.current?.resetAllInfo();

        // 重置 file evidence
        setFileEvidence([]);

        //reset page
        setPage(1);
        setTotalPage(1);
        //reset adding
        resetAdding();

        setThumbnailList((prev: any) => []);

        //设置新的url
        let file = takeOff?.project_files.find(
          (file: any) => file.id === selectedFileId
        );
        if (file) {
          let newPdfUrl = file?.parse_detail?.uploaded_file_url;
          setThumbnailList((prev: any[]) => [
            ...(file?.parse_detail?.image_page_infos || []),
          ]);
          setPdfUrl(newPdfUrl);
          //获取file evidence
          getFileEvidences();
        }
        return;
      }
    });
  }, [selectedFileId]);

  useEffect(() => {
    if (takeOffId) getTakeOff();
  }, [takeOffId]);

  const handleAddingChange = (value: AddingType | null) => {
    let addingOption: any = {};
    if (adding.isAdding && !(value !== adding.type)) {
      addingOption = { isAdding: false, type: null };
    } else {
      addingOption = { isAdding: true, type: value };
    }
    setAdding(addingOption);
    pdfRef?.current?.addingRect?.(addingOption);
  };
  const handleAutoDrawing = async (value: AddingType | null) => {
    const currentFileId = selectedFileId;
    if (!currentFileId) {
      notification.warning({
        message: "Warning",
        description: "Please select a file first.",
      });
      return;
    }

    const drawPolygons = (page_pdfjs_polygons: any[]) => {
      let itemCount = 0;
      let tableCount = 0;
      for (const item of page_pdfjs_polygons) {
        const pdfjs_polygon = item['pdfjs_polygon'];
        const _class = item['_class'];
        if (_class !== 'window_door_unit' && _class !== 'unit_table') continue;

        if (pdfjs_polygon && pdfjs_polygon.length > 0) {
          const addingOption = { isAdding: true, type: _class === 'window_door_unit' ? 'Item' : 'Table' };
          pdfRef?.current?.autoAddRectArea?.(addingOption, pdfjs_polygon);
        }
        if (_class === 'window_door_unit') itemCount++;
        else if (_class === 'unit_table') tableCount++;
      }
      notification.success({
        message: "Auto drawing success",
        description: `Detected ${itemCount} Item(s) and ${tableCount} Table(s).`,
      });
    };

    try {
      // 标记开始加载
      evidenceIsLoaded.current = false;
      const fileData = fileAutoDrawing.find(item => item.file_id === currentFileId);

      if (fileData) {
        const page_pdfjs_polygons = fileData?.page_pdfjs_polygons?.[page];
        if (page_pdfjs_polygons && page_pdfjs_polygons.length > 0) {
          drawPolygons(page_pdfjs_polygons);
        } else {
          notification.success({
            message: "Auto drawing success",
            description: `Detected 0 Item(s) and 0 Table(s).`,
          });
        }
        evidenceIsLoaded.current = true;
        return;
      }
      // 如果缓存没有，则调用接口
      setFullLoading(true);
      const response = await generateEvidenceByFileId(projectId as string, currentFileId);
      if (response?.status !== "success") throw new Error("Auto drawing failed");

      const autoDrawing = {
        file_id: currentFileId,
        page_pdfjs_polygons: response.data
      };
      setFileAutoDrawing(prev => {
        const index = prev.findIndex(item => item.file_id === currentFileId);
        if (index !== -1) {
          const next = [...prev];
          next[index] = autoDrawing;
          return next;
        }
        return [...prev, autoDrawing];
      });

      const newPagePolygons = response.data[page];
      if (newPagePolygons && newPagePolygons.length > 0) {
        drawPolygons(newPagePolygons);
      } else {
        notification.success({
          message: "Auto drawing success",
          description: `Detected 0 Item(s) and 0 Table(s).`,
        });
      }
      evidenceIsLoaded.current = true;
      console.log("Auto drawing success:", response);
      setFullLoading(false);
    } catch (err) {
      evidenceIsLoaded.current = true;
      setFullLoading(false);
      console.error(err);
      notification.error({
        message: "Error",
        description: "Auto drawing failed.",
      });
    }
  };
  const resetAdding = () => {
    setAdding({ isAdding: false, type: null });
  };

  // 使用 lodash 的防抖函数来处理缩放
  const debouncedZoomChange = useCallback(
    debounce(
      (value: number) => {
        if (value === zoom) return;
        if (value < 0.4 || value > 4) return;
        // 四舍五入保留2位小数，避免浮点数精度累积
        const roundedValue = Math.round(value * 100) / 100;
        setZoom(roundedValue);
      },
      500,
      {
        leading: true, // 立即执行第一次调用
        trailing: true, // 也执行 trailing 调用
      }
    ),
    [zoom]
  );

  const handleZoomChange = (value: number) => {
    debouncedZoomChange(value);
  };

  const handleSafeZoomChange = (value: number) => {
    message.warning(
      `The current scale may affect browser performance, and the previous scale will be set soon`
    );
    debouncedZoomChange(value - 0.1);
  };

  const handlePageChange = (value: number) => {
    // 需要判断当前pdf页面上是否有裁剪区域未提交
    pdfRef?.current?.checkAndHandleUnsavedCrops?.().then((unsaved) => {
      if (unsaved) {
        if (value < 1) return;
        if (value > totalPage) return;
        if (value === page) return;
        setPage(value);
        return;
      }
    });
  };
  const handleRotate = () => {
    pdfRef?.current?.rotatePDF?.();
  };

  const handleThumbnail = () => {
    setShowThumbnail(!showThumbnail);
  };

  const handleClearAllCrop = () => {
    pdfRef?.current?.clearCropSections?.();
  };

  const handleAppendEvidence = useCallback(
    (evidenceList: EvidenceType[]) => {
      // 如果evidence 数据还未加载完成，则不允许手动追加，需要先加载完成，否则会导致数据不一致
      if (!evidenceIsLoaded.current) {
        getFileEvidences();
        return;
      }
      if (!evidenceList?.length) return;
      setFileEvidence([...fileEvidenceRef.current, ...evidenceList]);
    },
    [getFileEvidences]
  );

  const handleDeleteEvidence = useCallback(
    (deleteIds: number[]) => {
      // 如果evidence 数据还未加载完成，则不允许手动删除，需要先加载完成，否则会导致数据不一致
      if (!evidenceIsLoaded.current) {
        getFileEvidences();
        return;
      }
      if (!deleteIds?.length) return;
      setFileEvidence(
        fileEvidenceRef.current.filter(
          (item: EvidenceType) => !deleteIds.includes(item.id)
        )
      );
    },
    [getFileEvidences]
  );

  const handleUpdateEvidence = useCallback(
    (evidenceList: EvidenceType[]) => {
      // 如果evidence 数据还未加载完成，则不允许手动更新，需要先加载完成，否则会导致数据不一致
      if (!evidenceIsLoaded.current) {
        getFileEvidences();
        return;
      }
      if (!evidenceList?.length) return;
      setFileEvidence(
        fileEvidenceRef.current.map((item: EvidenceType) => {
          // 找到需要更新的item
          let updateItem = evidenceList.find(
            (evid: EvidenceType) => evid.id === item.id
          );
          if (updateItem) {
            return { ...updateItem };
          }
          return item;
        })
      );
    },
    [getFileEvidences]
  );

  // 批量提交evidence
  const handleBatchSubmit = () => {
    pdfRef?.current?.handleBatchSubmit?.();
  };

  // 批量删除evidence
  const handleBatchDelete = () => {
    pdfRef?.current?.handleBatchDelete?.();
  };

  // 🎯 获取实时evidence数量
  const getCurrentEvidenceCount = () => {
    return fileEvidenceRef.current.length;
  };

  return (
    <div className="w-full h-[100vh] flex flex-col">
      <Header
        pdfRef={pdfRef}
        project={project}
        takeOff={takeOff}
        checkEvidenceCount={getCurrentEvidenceCount}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
      />

      <div className={`flex-1 flex overflow-hidden flex-col`}>
        <div className="w-full flex flex-col">
          <PdfTitle
            adding={adding}
            handleAddingChange={handleAddingChange}
            handleAutoDrawing={handleAutoDrawing}
            zoom={zoom}
            handleZoomChange={handleZoomChange}
            page={page}
            totalPages={totalPage}
            cropsCount={cropsCount}
            fileEvidenceCount={fileEvidence?.length || 0}
            handlePageChange={handlePageChange}
            handleRotate={handleRotate}
            handleThumbnail={handleThumbnail}
            handleClearAllCrop={handleClearAllCrop}
            handleBatchSubmit={handleBatchSubmit}
            handleBatchDelete={handleBatchDelete}
          />
        </div>
        <div className={`flex-1 flex pt-4 overflow-hidden relative`}>
          <PdfWrapper
            ref={pdfRef}
            operationMode={"edit"}
            mode="edit"
            typeList={[]}
            pdfUrl={pdfUrl as string}
            project_id={projectId as any}
            project_file_id={selectedFileId}
            zoom={zoom}
            page={page}
            allEvidence={fileEvidence}
            onRefreshEvidence={() => {
              getFileEvidences();
            }}
            resetAdding={resetAdding}
            onTotalPages={setTotalPage}
            onAppendEvidence={handleAppendEvidence}
            onDeleteEvidence={handleDeleteEvidence}
            onUpdateEvidence={handleUpdateEvidence}
            onCropSectionsCount={setCropsCount}
            onUpdateSafeZoom={handleSafeZoomChange}
          ></PdfWrapper>
          <Thumbnail
            pdfRef={pdfRef}
            showThumbnail={showThumbnail}
            setShowThumbnail={setShowThumbnail}
            data={thumbnailList}
            page={page}
            setPage={setPage}
          ></Thumbnail>
        </div>
      </div>
      {fullLoading && <Spin fullscreen />}
    </div>
  );
};

// 为自定义 Select 选项添加必要的全局样式
export default Identification;

// fileEvidence 相关状态管理
const useFileEvidenceState = () => {
  const [fileEvidence, setFileEvidence] = useState<any>([]);
  const fileEvidenceRef = useRef<any>([]);

  // 同步更新函数
  const setFileEvidenceWithSync = useCallback((updater: any) => {
    setFileEvidence((prev: any) => {
      const newState = typeof updater === "function" ? updater(prev) : updater;
      fileEvidenceRef.current = newState;
      return newState;
    });
  }, []);

  return {
    fileEvidence,
    setFileEvidence: setFileEvidenceWithSync,
    fileEvidenceRef,
  };
};

const PdfTitle = ({
  adding,
  handleAddingChange, handleAutoDrawing,
  zoom,
  handleZoomChange,
  page,
  totalPages,
  cropsCount,
  fileEvidenceCount,
  handlePageChange,
  handleRotate,
  handleThumbnail,
  handleClearAllCrop,
  handleBatchSubmit,
  handleBatchDelete,
}: any) => {
  const router = useRouter();
  return (
    <div className="flex justify-between px-14 py-4">
      <div className="flex gap-2 items-center">
        <div className="text-basicGray text-[11px]">Page</div>
        <div className="flex items-center rounded-lg border border-primaryN30 overflow-hidden px-1">
          <div
            className={`h-full py-2 w-3 flex items-center justify-center ${page === 1 ? "cursor-default opacity-50" : "cursor-pointer"
              }`}
            onClick={() => handlePageChange(page - 1)}
          >
            <Image
              src="/assets/icons/arrow-left-gray.svg"
              alt="arrow left icon"
              width={6}
              height={6}
            />
          </div>
          <Select
            value={`${page} / ${totalPages}`}
            style={{ width: 70, height: 24 }}
            variant="borderless"
            //suffixIcon={null}
            rootClassName="custom-select-page"
            className="text-basicGray text-xxs"
            onChange={(value) => handlePageChange(Number(value))}
          >
            {Array.from({ length: totalPages }, (value, index) => (
              <Select.Option key={index + 1} value={index + 1}>
                <div className="h-[20px] text-center text-basicGray text-[11px]">
                  {index + 1}
                </div>
              </Select.Option>
            ))}
          </Select>
          <div
            className={`h-full py-2 w-3 flex items-center justify-center ${page === totalPages
              ? "cursor-default opacity-50"
              : "cursor-pointer"
              }`}
            onClick={() => handlePageChange(page + 1)}
          >
            <Image
              src="/assets/icons/arrow-right-gray.svg"
              alt="arrow right icon"
              width={6}
              height={6}
            />
          </div>
        </div>
        <input
          className="w-[40px] h-[24px] rounded border border-primaryN30 text-center text-basicGray text-xxs focus:outline-primaryN50"
          type="text"
          onBlur={(e) => {
            let targetPage = parseInt(e.target.value);
            // 验证页码范围
            if (
              !isNaN(targetPage) &&
              targetPage >= 1 &&
              targetPage <= totalPages
            ) {
              handlePageChange(targetPage);
            } else {
              // 如果输入无效，恢复当前页码
              e.target.value = page.toString();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              let targetPage = parseInt((e.target as HTMLInputElement).value);
              // 验证页码范围并跳转
              if (
                !isNaN(targetPage) &&
                targetPage >= 1 &&
                targetPage <= totalPages
              ) {
                handlePageChange(targetPage);
              }
            }
          }}
        />
        <div
          className={`rounded pl-3 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 bg-primaryN20 text-basicGray`}
          onClick={() => handleThumbnail()}
        >
          <Image
            src="/assets/icons/thumbnail.jpg"
            alt="thumbnail icon"
            width={18}
            height={18}
          ></Image>
          <DownOutlined
            className="text-basicGray"
            style={{ marginLeft: "5px", fontSize: "10px" }}
          />
        </div>
        <div className="w-[20px] h-full flex justify-center items-center">
          <Divider type="vertical" className="h-[100%]" />
        </div>
        <div
          className={`rounded pl-1 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 ${adding.isAdding && adding.type === "Item"
            ? "text-forumBlue bg-primaryN30"
            : "text-basicGray bg-primaryN20"
            }`}
          onClick={() => handleAddingChange("Item")}
        >
          <p className="text-xs text-center w-20">Add Item</p>
          <Image
            src={`/assets/icons/add-table${adding.isAdding && adding.type === "Item" ? "-blue" : ""
              }.svg`}
            alt="add item icon"
            width={14}
            height={14}
          />
        </div>
        <div
          className={`rounded pl-1 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 ${adding.isAdding && adding.type === "Table"
            ? "text-accentIndigo bg-primaryN30"
            : "text-basicGray bg-primaryN20"
            }`}
          onClick={() => handleAddingChange("Table")}
        >
          <p className="text-xs text-center w-20">Add Table</p>
          <Image
            src={`/assets/icons/add-table${adding.isAdding && adding.type === "Table" ? "-indigo" : ""
              }.svg`}
            alt="add item icon"
            width={14}
            height={14}
          />
        </div>
        <div
          className={`rounded pl-1 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 ${adding.isAdding && adding.type === "Item"
            ? "text-forumBlue bg-primaryN30"
            : "text-basicGray bg-primaryN20"
            }`}
          onClick={() => handleAutoDrawing("Item")}
        >
          <p className="text-xs text-center w-20">Auto Drawing</p>
          <Image
            src={`/assets/icons/add-table${adding.isAdding && adding.type === "Item" ? "-blue" : ""
              }.svg`}
            alt="add item icon"
            width={14}
            height={14}
          />
        </div>
        {/* <div
                    className={`rounded pl-3 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 bg-primaryN20 text-basicGray`}
                    onClick={() => handleRotate()}
                >
                    <p className="text-xs text-center">Rotate</p>
                </div> */}

        <div
          className={`rounded pl-3 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 bg-primaryN20 text-basicGray`}
          onClick={() => handleClearAllCrop()}
        >
          <p className="text-xs text-center">Clear All</p>
          <ClearOutlined style={{ marginLeft: "5px", fontSize: "14px" }} />
        </div>
        {/* <div
                    className={`rounded pl-3 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 bg-primaryN20 text-basicGray`}
                    onClick={() => handleBatchSubmit()}
                >
                    <p className="text-xs text-center">Submit All</p>
                </div> */}
      </div>
      <div className="flex flex-row gap-4">
        <div
          className={`rounded px-2 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 bg-primaryN20 text-basicGray`}
          onClick={() => handleBatchDelete()}
        >
          <p className="text-xs text-center">Delete All</p>
        </div>
        <div className="flex">
          <div
            className="w-7 h-6 flex justify-center items-center rounded-tl-xl rounded-bl-xl bg-primaryGray cursor-pointer text-baseGray"
            onClick={() => {
              handleZoomChange(zoom - 0.1);
            }}
          >
            -
          </div>
          <div
            className="w-7 h-6 flex justify-center items-center rounded-tr-xl rounded-br-xl bg-primaryGray cursor-pointer text-baseGray"
            style={{ marginLeft: 1 }}
            onClick={() => handleZoomChange(zoom + 0.1)}
          >
            +
          </div>
        </div>

        <span
          className="flex items-center justify-center rounded-md text-center text-basicDarkGray text-[10px] border border-solid border-primaryN30"
          style={{
            width: 54,
            height: 24,
          }}
        >
          {(zoom * 100).toFixed(0) + "%"}
        </span>
      </div>
    </div>
  );
};
