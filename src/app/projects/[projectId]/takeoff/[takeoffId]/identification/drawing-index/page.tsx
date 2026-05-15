"use client";
import { useParams, useRouter } from "next/navigation";
import {
  Popover,
  Radio,
  Select,
  Spin,
  Modal,
} from "antd";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, useImperativeHandle } from "react";
import Image from "next/image";
import debounce from "lodash/debounce";

import {
  deleteEvidenceById,
  evidenceBatchDelete,
  generateEvidenceByFileId,
  getEvidenceByFileId,
} from "@/services/evidenceService";
import { getTakeOffById } from "@/services/takeOffService";
import {
  deleteDrawingIndex,
  getDrawingIndexInfoById,
  getDrawingIndexTypeList,
  recognizeDrawingIndex,
} from "@/services/drawingIndexService";

import {
  EvidenceResult,
  EvidenceType,
  FileOperationType,
  FileStatus,
  GroupType,
  PdfWrapperRefMethods,
} from "../../types/evidence";

import LoadingScreen from "@/components/loading-screen";
import PdfWrapper from "../../components/pdf/PdfWrapper";
import Thumbnail from "../../components/pdf/Thumbnail";
import {
  ZoomControls,
  SelectPagesControls,
  ThumbnailControls,
} from "../../components/pdf/Pdf-Controls";
import BuildingBackground, { BuildLoadingStep } from "../components/BuildingBackground";
import IndexRectView from "./components/IndexRectView";
import SkipTipModal from "./components/SkipTipModal";
import Header from "../components/Header";

import { useTakeoff, FileViewStep } from "@/context/TakeoffContext";
import { ButtonText } from "../page";
import { notify } from "@/utils/notify";

const confirm = Modal.confirm;

export interface IdentIndexRef {
}

const IdentIndex = forwardRef<IdentIndexRef, {
}>((any, ref) => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;
  const pdfRef = useRef<PdfWrapperRefMethods | null>(null);
  const thumbnailRef = useRef<any>(null);

  const {
    fileList,
    setFileList,
    selectedFileId,
    setSelectedFileId,
    takeOff,
    setTakeOff,
    setIndexBoxCount,
    setFileViewStep
  } = useTakeoff();

  useImperativeHandle(ref, () => ({
    recognizeDrawingIndexData
  }));

  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [thumbnailList, setThumbnailList] = useState<any>([]);
  const [showThumbnail, setShowThumbnail] = useState<boolean>(false);
  const [showSkipModal, setShowSkipModal] = useState<boolean>(false);
  const [fullLoading, setFullLoading] = useState<boolean>(false);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);
  const [indexBoxList, setIndexBoxList] = useState<any>([]);
  const [labelList, setLabelList] = useState<any>([]);

  const [cropsCount, setCropsCount] = useState<number>(0);
  const [fileEvidence, setFileEvidence] = useState<any>([]);

  const skipType = useRef<any>(null);
  const evidenceIsLoaded = useRef<boolean>(false);

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

  useEffect(() => {
    // 获取takeOff详情
  }, [takeOffId]);

  // 获取当前文件的evidence，并按照type进行分类
  const getFileEvidences = useCallback(async () => {
    if (selectedFileId === -1 || !takeOff) return;

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
    }
    return;
  }, [selectedFileId]);

  useEffect(() => {
    let indexList: any = fileEvidence.filter((item: any) => {
      return item.type === GroupType.DrawingIndex;
    });
    let titleList: any = fileEvidence.filter((item: any) => {
      return item.type === GroupType.TitleInfo;
    });
    // 进行分类
    setIndexBoxList(indexList);
    setLabelList(titleList);
    // 设置索引框数量
    setIndexBoxCount(indexList.length + titleList.length);
  }, [fileEvidence]);

  const recognizeDrawingIndexData = async () => {
    setBuildLoading(true);

    let res: any = await recognizeDrawingIndex(
      projectId as string,
      selectedFileId as number,
    );
    setBuildLoading(false);

    if (res.status === "success") {
      notify.success({
        title: "Success",
        description: "Drawing index recognized successfully",
      });
      // 识别成功后跳转到summary页面
      router.replace(`/projects/${projectId}/takeoff/${takeOffId}/identification/index-summary`);
    } else {
      notify.error({
        title: "Error",
        description: "Failed to recognize drawing index",
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
      notify.error({
        title: "Error",
        description: "Failed to delete source",
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

  const handleChangeFile = async (fileId: number) => {
    if (selectedFileId === fileId) return;
    // 切换文件, 判断当前是否有未保存的crop，如果有则显示提示框并且保存
    const unsaved = await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
    if (!pdfRef.current || unsaved) {
      // 判断fileId的文件是否是已完成状态，已完成的文件才可以点击，未完成的文件不允许点击
      const file = fileList.find((file: any) => file.id === fileId);
      if (file?.status === FileStatus.Completed) {
        handleFileStatus(selectedFileId, fileId);
      }
    }
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
  const handleNext = async (buttonInfo: { text: string }) => {
    if (buttonInfo.text === ButtonText.Analysis) {
      // 调用手动分析接口
      recognizeDrawingIndexData();
    }
  };

  const fileOperationType = useMemo(() => {
    if (!fileList.length) return "";
    let file = fileList.find((file: any) => file.id === selectedFileId);
    return file?.operation_type || "";
  }, [fileList, selectedFileId]);

  // 处理返回按钮的点击事件
  const handleBack = useCallback(() => {
    // 返回summary页面
    router.replace(`/projects/${projectId}/takeoff/${takeOffId}/identification/index-summary`);
  }, [router]);

  // 右上角按钮的相关信息
  const nextButtonInfo = useMemo(() => {
    const hasUnsavedCrops = indexBoxList.length === 0 && labelList.length === 0;
    return {
      text: ButtonText.Analysis,
      disabled: hasUnsavedCrops,
    };

  }, [fileList, selectedFileId, indexBoxList, labelList]);

  return (
    <div
      className={`w-full h-[100vh] flex flex-col relative overflow-hidden`}
    >
      <div className="h-[110px]">
        <Header
          onChangeFile={(fileId: number) => handleChangeFile(fileId)}
          nextButtonInfo={nextButtonInfo}
          handleNext={handleNext}
          onHandleBack={handleBack}
        >
        </Header>
      </div>
      <div className={`flex-1 pr-14 h-full flex flex-row overflow-hidden relative`}>
        <div
          className="flex flex-col border-r border-primaryN30"
          style={{ width: "340px" }}
        >
          <IndexRectView
            indexBoxList={indexBoxList}
            labelList={labelList}
            cropsCount={cropsCount}
            handleAddRectBox={handleAddRectBox}
            handleDeleteEvidence={deleteEvidence}
          ></IndexRectView>
        </div>
        <div className={`flex-1 flex flex-col pl-6 pt-4 overflow-hidden`}>
          <div className="h-[60px] flex flex-row justify-between items-center">
            <div className="flex items-center gap-2">
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
      {buildLoading && <BuildingBackground step={BuildLoadingStep.PageLabel} />}
    </div>
  );
});

IdentIndex.displayName = "IdentIndex";

// 为自定义 Select 选项添加必要的全局样式
export default IdentIndex;
