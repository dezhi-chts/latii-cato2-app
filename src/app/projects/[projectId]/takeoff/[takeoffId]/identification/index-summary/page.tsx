"use client";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Checkbox,
  ConfigProvider,
  Divider,
  message,
  Popover,
  Radio,
  Select,
  Spin,
  Modal,
} from "antd";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ZOOM_MIN,
  ZOOM_MAX,
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/Pdf-Controls";
import ContentView from "./components/ContentView";
import Header from "../components/Header";

import {
  EvidenceResult,
  EvidenceType,
  FileOperationType,
  FileStatus,
  GroupType,
  PdfWrapperRefMethods, ArchDrawingSummaryPageTypes
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";

import BuildingBackground, { BuildLoadingStep } from "../components/BuildingBackground";
import { useTakeoff } from "@/context/TakeoffContext";
import { ButtonText } from "../page";
import { notify } from "@/utils/notify";

const confirm = Modal.confirm;

const IdentSummary = () => {
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
  const [labelList, setLabelList] = useState<any>([]);
  const [drawingTypeList, setDrawingTypeList] = useState<any>(
    ArchDrawingSummaryPageTypes,
  );
  const [cropsCount, setCropsCount] = useState<number>(0);
  const [isEmptyContent, setIsEmptyContent] = useState<boolean>(false);

  const evidenceIsLoaded = useRef<boolean>(false);

  const {
    fileList,
    setFileList,
    selectedFileId,
    setSelectedFileId,
    clearStorage
  } = useTakeoff();

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
      notify.error({
        title: "Error",
        description: "Failed to get file source",
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
      let drawingData = res?.data?.pages ?? [];
      setContentData(drawingData);

      if (drawingData.length > 0) {
      } else {
        setIsEmptyContent(true);
      }
    } else {
      notify.error({
        title: "Error",
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
    const clampedValue = Math.max(ZOOM_MIN, Math.min(value, ZOOM_MAX));
    setZoom(clampedValue);
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

  const handleCropsCount = (count: number) => {
    // 如果当前页面有未处理的crop
    setCropsCount(count);
  };

  const handleRestartIndex = () => {
    // 跳转到index drawing页面，重新绘制index drawing
    router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification/drawing-index`);
  };

  const handleFileStatus = (oldFileId: number, newFileId: number) => {
    setSelectedFileId(newFileId);
    setFileList((prev) => {
      return prev.map((file: any) => {
        if (file.id === oldFileId) {
          // 在summary页面的时候，切换新文件，则旧文件更新为未完成状态，新文件设置为处理状态中
          return { ...file, status: FileStatus.Uploaded };
        } else if (file.id === newFileId) {
          return { ...file, status: FileStatus.Processing };
        }
        return file;
      });
    });
  }

  const handleChangeFile = async (fileId: number) => {
    if (selectedFileId === fileId) return;
    // 判断fileId的文件是否是已完成状态，已完成的文件才可以点击，未完成的文件不允许点击
    const file = fileList.find((file: any) => file.id === fileId);
    if (file?.status === FileStatus.Completed) {
      handleFileStatus(selectedFileId, fileId);
      router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification/page-label`);
    }
  };

  const handleNext = async (buttonInfo: { text: string }) => {
    // 需要确认所有页面类型已确认，否则不允许跳转
    let isAllPageTypeConfirmed = contentData.every((item: any) => item.type !== "" && item.type !== null && item.type !== undefined);

    if (!isAllPageTypeConfirmed) {
      notify.error({
        title: "Error",
        description: "Please confirm all page types first",
      });
      return;
    }
    // 在summary页面的时候，点击Next Step跳转到label页面
    router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification/page-label`);
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

        if (prevFile.status === FileStatus.Completed) {
          setSelectedFileId(prevFile.id);
          // 跳转到label页面
          router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification/page-label`);
        } else if (
          prevFile.operation_type === FileOperationType.ArchitectureDrawing
        ) {
          setSelectedFileId(prevFile.id);
          // 跳转到summary页面
          router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification/index-summary`);
        }
      } else {
        // 如果前面没有文件可以返回了，则直接返回home
        // 清除sessionStorage中的数据
        clearStorage();
        router.replace('/home');
      }
    };

    handleBackToPreviousFile();
  }, [selectedFileId, fileList, fileOperationType, router]);

  // 右上角按钮的相关信息
  const nextButtonInfo = useMemo(() => {
    return {
      text: ButtonText.NextStep,
      disabled: false,
    };
  }, [fileList, selectedFileId,]);

  return (
    <div className={`w-full h-[100vh] flex flex-col relative overflow-hidden`}>
      <Header
        onChangeFile={(fileId: number) => handleChangeFile(fileId)}
        nextButtonInfo={nextButtonInfo}
        handleNext={handleNext}
        onHandleBack={handleBack}
      >
      </Header>
      <div className={`pr-14 flex-1 flex flex-row overflow-hidden relative`}>
        <div
          className="flex flex-col border-r border-primaryN30"
        >
          <ContentView
            fileId={selectedFileId}
            contentData={contentData}
            setContentData={setContentData}
            drawingTypeList={drawingTypeList}
            isEmptyContent={isEmptyContent}
            currentPage={page}
            pdfTotalPages={totalPage}
            handlePageChange={handlePageChange}
          />
        </div>
        <div className={`flex-1 flex flex-col pl-12 pt-4 overflow-hidden`}>
          <div className="h-[60px] flex flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-[180px] h-[28px] flex flex-row justify-center items-center bg-grey-light rounded-md cursor-pointer"
                onClick={handleRestartIndex}
              >
                <span className="text-grey-dark text-xs">
                  Reset to Manual Selection
                </span>
              </div>
              <ThumbnailControls
                showThumbnail={showThumbnail}
                setShowThumbnail={setShowThumbnail}
                onClick={() => {
                  setShowThumbnail(!showThumbnail);
                }}
              />
            </div>
            <div className="flex flex-row gap-2">
              <SelectPagesControls
                page={page}
                totalPages={totalPage}
                handlePageChange={handlePageChange}
              />
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
              onCropSectionsCount={handleCropsCount}
              onChangeZoom={handleZoomChange}
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
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
      {buildLoading && <BuildingBackground step={'page-label'} />}
    </div>
  );
};

export default IdentSummary;
