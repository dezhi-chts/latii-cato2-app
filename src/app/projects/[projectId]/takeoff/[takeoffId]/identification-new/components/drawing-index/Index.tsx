"use client";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Checkbox,
  ConfigProvider,
  Divider,
  message,
  notification,
  Popover,
  Radio,
  Select,
  Spin,
  Modal,
} from "antd";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import Image from "next/image";
import debounce from "lodash/debounce";

import {
  deleteEvidenceById,
  evidenceBatchDelete,
  generateEvidenceByFileId,
  getEvidenceByFileId,
} from "@/services/evidenceService";
import {
  deleteDrawingIndex,
  getDrawingIndexInfoById,
  getDrawingIndexTypeList,
  recognizeDrawingIndex,
} from "@/services/drawingIndexService";

import LoadingScreen from "@/components/loading-screen";
import PdfWrapper from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/PdfWrapper";
import Thumbnail from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/Thumbnail";
import {
  ZoomControls,
  SelectPagesControls,
  ThumbnailControls,
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/Pdf-Controls";
import IndexRectView from "./IndexRectView";
import ContentView from "./ContentView";
import SkipTipModal from "./SkipTipModal";

import {
  EvidenceResult,
  EvidenceType,
  FileOperationType,
  FileStatus,
  GroupType,
  PdfWrapperRefMethods, ArchDrawingSummaryPageTypes
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";

import BuildingBackground from "../BuildingBackground";

const confirm = Modal.confirm;

export interface IdentificationIndexRef {
  recognizeDrawingIndexData: () => Promise<void>;
}

const IdentificationIndex = forwardRef<IdentificationIndexRef, {
  fileList: any[];
  setFileList: (fileList: any[] | ((prev: any[]) => any[])) => void;
  selectedFileId: number;
  showContentView: boolean;
  setShowContentView: (show: boolean) => void;
  onChangeIndexBox: (indexBoxList: any[], labelList: any[]) => void;
}>(({
  fileList,
  setFileList,
  selectedFileId,
  showContentView,
  setShowContentView,
  onChangeIndexBox,
}, ref) => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;
  const pdfRef = useRef<PdfWrapperRefMethods | null>(null);
  const thumbnailRef = useRef<any>(null);

  const [takeOff, setTakeOff] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [fileEvidence, setFileEvidence] = useState<any>([]);
  const [thumbnailList, setThumbnailList] = useState<any>([]);
  const [showThumbnail, setShowThumbnail] = useState<boolean>(false);
  const [showSkipModal, setShowSkipModal] = useState<boolean>(false);
  const [fullLoading, setFullLoading] = useState<boolean>(false);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);
  const [contentData, setContentData] = useState<any>([]);
  const [indexBoxList, setIndexBoxList] = useState<any>([]);
  const [drawingTypeList, setDrawingTypeList] = useState<any>(
    ArchDrawingSummaryPageTypes,
  );
  const [labelList, setLabelList] = useState<any>([]);
  const [cropsCount, setCropsCount] = useState<number>(0);
  const [isEmptyContent, setIsEmptyContent] = useState<boolean>(false);

  const skipType = useRef<any>(null);
  const evidenceIsLoaded = useRef<boolean>(false);
  const onChangeIndexBoxRef = useRef(onChangeIndexBox);

  useEffect(() => {
    onChangeIndexBoxRef.current = onChangeIndexBox;
  }, [onChangeIndexBox]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (thumbnailRef.current && thumbnailRef.current.contains(target)) return;
      setShowThumbnail(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    recognizeDrawingIndexData,
  }));

  // 获取当前文件的evidence，并按照type进行分类
  const getFileEvidences = useCallback(async () => {
    if (selectedFileId === -1) return;

    evidenceIsLoaded.current = false;
    const response = await getEvidenceByFileId(
      projectId as string,
      selectedFileId,
      { filter_type: "DrawingIndex" },
    );
    if (response.status === "success") {
      evidenceIsLoaded.current = true;
      const evidenceList = response?.data ?? [];
      setFileEvidence(evidenceList);
    } else {
      evidenceIsLoaded.current = false;
      notification.error({
        message: "Error",
        description: "Failed to get file evidence",
      });
    }
  }, [selectedFileId, takeOff]);

  useEffect(() => {
    if (selectedFileId === -1 || fileList.length === 0) return;
    // 重置pdf数据
    pdfRef?.current?.resetAllInfo();

    // 重置 file evidence
    setFileEvidence([]);

    //reset page
    setPage(1);
    setTotalPage(1);
    if (zoom !== 1.0) {
      setZoom(1.0);
    }
    // 重置缩略图数据
    setThumbnailList((prev: any) => []);

    //设置新的url
    let file = fileList.find((file: any) => file.id === selectedFileId);
    if (file) {
      let newPdfUrl = file?.parse_detail?.uploaded_file_url ?? "";
      setPdfUrl(newPdfUrl);
      // 设置新的缩略图数据
      setThumbnailList(() => file?.parse_detail?.image_page_infos ?? []);
      //获取file evidence
      getFileEvidences();

      // 显示目录内容
      setShowContentView(true);
      getDrawingIndexData();
    }
    return;
  }, [selectedFileId]);

  useEffect(() => {
    // 进行分类
    setIndexBoxList(
      fileEvidence.filter((item: any) => {
        return item.type === GroupType.DrawingIndex;
      }),
    );
    setLabelList(
      fileEvidence.filter((item: any) => {
        return item.type === GroupType.TitleInfo;
      }),
    );
  }, [fileEvidence]);

  useEffect(() => {
    onChangeIndexBoxRef.current(indexBoxList, labelList);
  }, [indexBoxList, labelList]);

  const recognizeDrawingIndexData = async () => {
    setBuildLoading(true);

    let res: any = await recognizeDrawingIndex(
      projectId as string,
      selectedFileId as number,
    );
    setBuildLoading(false);

    if (res.status === "success") {
      notification.success({
        message: "Success",
        description: "Drawing index recognized successfully",
      });
      // 识别成功后重新获取drawing index数据
      setShowContentView(true);
      getDrawingIndexData();
    } else {
      notification.error({
        message: "Error",
        description: "Failed to recognize drawing index",
      });
    }
  };

  const getDrawingIndexData = async () => {
    setContentData([]);
    setFullLoading(true);
    setIsEmptyContent(false);

    let res: any = await getDrawingIndexInfoById(
      projectId as string,
      selectedFileId as number,
    );

    setFullLoading(false);

    if (res.status === "success") {
      let drawingData = res?.data?.drawings ?? [];
      setContentData(drawingData);

      if (drawingData.length > 0) {
      } else {
        setIsEmptyContent(true);
      }
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get drawing index",
      });
    }
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
      },
    ),
    [zoom],
  );

  const handleZoomChange = (value: number) => {
    debouncedZoomChange(value);
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

  const handleAppendEvidence = (evidenceResult: EvidenceResult) => {
    // 如果evidence 数据还未加载完成，则不允许手动追加，需要先加载完成，否则会导致数据不一致
    const { evidences } = evidenceResult;
    const evidenceList = evidences || [];
    if (!evidenceIsLoaded.current) {
      getFileEvidences();
      return;
    }
    if (!evidenceList?.length) return;
    setFileEvidence([...fileEvidence, ...evidenceList]);
  };

  const handleDeleteEvidence = (evidenceResult: EvidenceResult) => {
    // 如果evidence 数据还未加载完成，则不允许手动删除，需要先加载完成，否则会导致数据不一致
    const { deleteIds = [] } = evidenceResult;
    if (!evidenceIsLoaded.current) {
      getFileEvidences();
      return;
    }
    if (!deleteIds?.length) return;
    setFileEvidence((prev: any) => {
      return prev.filter((item: EvidenceType) => !deleteIds.includes(item.id));
    });
  };

  const deleteEvidence = async (deleteIds: number[]) => {
    setFullLoading(true);
    let res: any = await evidenceBatchDelete(deleteIds);
    if (res.status === "success") {
      handleDeleteEvidence({ deleteIds } as any);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to delete evidence",
      });
    }
    setFullLoading(false);
  };

  const handleUpdateEvidence = (evidenceResult: EvidenceResult) => {
    // 如果evidence 数据还未加载完成，则不允许手动更新，需要先加载完成，否则会导致数据不一致
    const { evidences } = evidenceResult;
    const evidenceList = evidences || [];

    if (!evidenceIsLoaded.current) {
      getFileEvidences();
      return;
    }
    if (!evidenceList?.length) return;
    setFileEvidence(
      fileEvidence.map((item: EvidenceType) => {
        // 找到需要更新的item
        let updateItem = evidenceList.find(
          (evid: EvidenceType) => evid.id === item.id,
        );
        if (updateItem) {
          return { ...updateItem };
        }
        return item;
      }),
    );
  };

  const handleAddRectBox = (type: string) => {
    if (pdfRef.current && pdfRef.current?.addingRect) {
      pdfRef.current?.addingRect({ type: type });
    }
  };

  const handleCropsCount = (count: number) => {
    // 如果当前页面有未处理的crop
    setCropsCount(count);
  };

  const updateFileStatus = (fileId: number, status: FileStatus) => {
    // 设置当前文件状态未undo
    setFileList((prev: any) => {
      return prev.map((item: any) => {
        if (item.id === fileId) {
          return {
            ...item,
            status: status,
          };
        }
        return item;
      });
    });
  };

  const handleRestartIndex = () => {
    setShowContentView(false);
    // 设置当前文件状态为processing
    updateFileStatus(selectedFileId, FileStatus.Processing);
  };

  return (
    <div className={`w-full flex flex-col relative h-[100vh]}`}>

      <div className={`pr-14 flex-1 flex flex-row overflow-hidden relative`}>
        <div
          className="flex flex-col border-r border-primaryN30"
          style={{ width: showContentView ? "500px" : "340px" }}
        >
          {showContentView ? (
            <ContentView
              contentData={contentData}
              setContentData={setContentData}
              drawingTypeList={drawingTypeList}
              isEmptyContent={isEmptyContent}
              pdfTotalPages={totalPage}
              handlePageChange={handlePageChange}
            />
          ) : (
            <IndexRectView
              indexBoxList={indexBoxList}
              labelList={labelList}
              cropsCount={cropsCount}
              handleAddRectBox={handleAddRectBox}
              handleDeleteEvidence={deleteEvidence}
            ></IndexRectView>
          )}
        </div>
        <div className={`flex-1 flex flex-col pl-6 pt-4 overflow-hidden`}>
          <div className="h-[60px] flex flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              {showContentView && (
                <div
                  className="w-[122px] h-[28px] flex flex-row justify-center items-center bg-primaryN20 rounded-md cursor-pointer"
                  onClick={handleRestartIndex}
                >
                  <span className="text-grey-light-strong text-xs">
                    Restart Index
                  </span>
                </div>
              )}
              <SelectPagesControls
                page={page}
                totalPages={totalPage}
                handlePageChange={handlePageChange}
              />
              <ThumbnailControls
                showThumbnail={showThumbnail}
                setShowThumbnail={setShowThumbnail}
                onClick={() => {
                  setShowThumbnail(!showThumbnail);
                }}
              />
            </div>
            <div className="flex flex-row gap-2">
              <ZoomControls zoom={zoom} handleZoomChange={handleZoomChange} />
            </div>
          </div>
          <div className="flex-1 flex overflow-hidden border border-primaryN30 rounded-md relative">
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
              onTotalPages={setTotalPage}
              onAppendEvidence={handleAppendEvidence}
              onDeleteEvidence={handleDeleteEvidence}
              onUpdateEvidence={handleUpdateEvidence}
              onCropSectionsCount={handleCropsCount}
            ></PdfWrapper>
          </div>
        </div>
        <div
          ref={thumbnailRef}
          className="h-full absolute right-0 top-0 z-9999"
        >
          <Thumbnail
            pdfRef={pdfRef}
            showThumbnail={showThumbnail}
            setShowThumbnail={setShowThumbnail}
            data={thumbnailList}
            page={page}
            fixed={false}
            setPage={setPage}
          ></Thumbnail>
        </div>
      </div>
      {showSkipModal && (
        <SkipTipModal
          isOpen={showSkipModal}
          closeModal={() => {
            setShowSkipModal(false);
          }}
          skipType={skipType.current}
          handleAddRectBox={(type: string) => {
            setShowSkipModal(false);
            cropsCount === 0 && handleAddRectBox(type);
          }}
          handleSkip={() => {
            setShowSkipModal(false);
            recognizeDrawingIndexData();
          }}
        />
      )}
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
      {buildLoading && <BuildingBackground step={'page-label'} />}
    </div>
  );
});

IdentificationIndex.displayName = "IdentificationIndex";

// 为自定义 Select 选项添加必要的全局样式
export default IdentificationIndex;
