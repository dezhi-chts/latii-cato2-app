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
  Modal
} from "antd";
import {
  ArrowDownOutlined,
  ClearOutlined,
  DownOutlined,
  CloseOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import debounce from "lodash/debounce";

import {
  deleteEvidenceById,
  evidenceBatchDelete,
  generateEvidenceByFileId,
  getEvidenceByFileId,
} from "@/services/evidenceService";
import { getTakeOffById } from "@/services/takeOffService";
import { deleteDrawingIndex, getDrawingIndexInfoById, getDrawingIndexTypeList, recognizeDrawingIndex } from "@/services/drawingIndexService";

import { EvidenceType, FileOperationType, FileStatus, GroupType, PdfWrapperRefMethods } from "../types/evidence";

import PdfWrapper from "../components/pdf/PdfWrapper";
import Header from "./components/Header";
import Thumbnail from "../components/pdf/Thumbnail";
import {
  ZoomControls,
  AddRectBoxControls,
  PageControls,
  SelectPagesControls,
  ThumbnailControls,
} from "../components/pdf/Pdf-Controls";
import BuildingBackground from "./components/BuildingBackground";
import IndexRectView from "./components/IndexRectView";
import ContentView from "./components/ContentView";
import SkipTipModal from "./components/SkipTipModal";

import { ArchDrawingSummaryPageTypes } from "../types/evidence";

const confirm = Modal.confirm;


export enum BuildLoadingStep {
  PageAnalysis = 'page-analyze',
  PageLabel = 'page-label',
  PageIndex = 'page-index',
}

export enum ButtonText {
  Analysis = 'Analysis',
  NextFile = 'Next File',
  Complete = 'Complete',
  RestartIndex = 'Restart Index',
  UnKnown = 'Unknown',
}

const IdentificationIndex = () => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;
  const pdfRef = useRef<PdfWrapperRefMethods | null>(null);
  const thumbnailRef = useRef<any>(null);

  const [selectedFileId, setSelectedFileId] = useState<number>(-1);
  const [takeOff, setTakeOff] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [fileList, setFileList] = useState<any>([]);
  const [fileEvidence, setFileEvidence] = useState<any>([]);
  const [thumbnailList, setThumbnailList] = useState<any>([]);
  const [showThumbnail, setShowThumbnail] = useState<boolean>(false);
  const [showSkipModal, setShowSkipModal] = useState<boolean>(false);
  const [fullLoading, setFullLoading] = useState<boolean>(false);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);
  const [buildLoadingStep, setBuildLoadingStep] = useState<string>(BuildLoadingStep.PageIndex);
  const [showContentView, setShowContentView] = useState<boolean>(true);
  const [contentData, setContentData] = useState<any>([]);
  const [indexBoxList, setIndexBoxList] = useState<any>([]);
  const [drawingTypeList, setDrawingTypeList] = useState<any>(ArchDrawingSummaryPageTypes);
  const [labelList, setLabelList] = useState<any>([]);
  const [cropsCount, setCropsCount] = useState<number>(0);
  const [isEmptyContent, setIsEmptyContent] = useState<boolean>(false);

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
    getTakeOffDetails();
    //getTypeList();
  }, [takeOffId]);

  const getTakeOffDetails = async () => {
    setFullLoading(true);
    let res: any = await getTakeOffById(takeOffId as any);
    if (res.status === 'success') {
      let project_files = res?.data?.project_files ?? [];
      setTakeOff(res?.data ?? {});
      if (project_files?.length > 0) {
        setFileList(project_files);
        setSelectedFileId(project_files[0].id); // 设置默认选中文件ID
      } else {
        notification.error({
          message: "Error",
          description: "No files found in this take off",
        });
      }
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get take off",
      });
    }
    setFullLoading(false);
  };

  // 获取当前文件的evidence，并按照type进行分类
  const getFileEvidences = useCallback(async () => {
    if (selectedFileId === -1 || !takeOff) return;

    evidenceIsLoaded.current = false;
    const response = await getEvidenceByFileId(projectId as string, selectedFileId, { filter_type: GroupType.DrawingIndex });
    if (response.status === "success") {
      evidenceIsLoaded.current = true;
      const evidenceList = response?.data ?? [];
      setFileEvidence(evidenceList);
    } else {
      evidenceIsLoaded.current = false;
      notification.error({
        message: "Error",
        description: "Failed to get file evidence",
      })
    }
  }, [selectedFileId, takeOff]);

  const getTypeList = async () => {
    let res: any = await getDrawingIndexTypeList();
    if (res.status === 'success') {
      let list = res?.data?.fixed_index_types ?? [];
      setDrawingTypeList(list);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get drawing index type list",
      })
    }
  }


  useEffect(() => {
    if (selectedFileId === -1 || fileList.length === 0) return;
    pdfRef?.current?.checkAndHandleUnsavedCrops?.().then((unsaved) => {
      if (unsaved) {
        // 没有crop需要保存
        pdfRef?.current?.resetAllInfo();

        // 重置 file evidence
        setFileEvidence([]);

        //reset page
        setPage(1);
        setTotalPage(1);

        setThumbnailList((prev: any) => []);

        //设置新的url
        let file = fileList.find((file: any) => file.id === selectedFileId);
        if (file) {
          let newPdfUrl = file?.parse_detail?.uploaded_file_url ?? '';
          setPdfUrl(newPdfUrl);
          // 设置新的缩略图数据
          setThumbnailList(() =>
            file?.parse_detail?.image_page_infos ?? [],
          );
          //获取file evidence
          getFileEvidences();

          // 显示目录内容
          setShowContentView(true);
          getDrawingIndexData();
        }
        return;
      }
    });
  }, [selectedFileId]);

  useEffect(() => {
    // 进行分类
    setIndexBoxList(fileEvidence.filter((item: any) => {
      return item.type === GroupType.DrawingIndex;
    }));
    setLabelList(fileEvidence.filter((item: any) => {
      return item.type === GroupType.TitleInfo
    }));
  }, [fileEvidence]);


  const recognizeDrawingIndexData = async () => {
    setBuildLoadingStep(BuildLoadingStep.PageIndex);
    setBuildLoading(true);

    let res: any = await recognizeDrawingIndex(projectId as string, selectedFileId as number);
    setBuildLoading(false);

    if (res.status === 'success') {
      notification.success({
        message: "Success",
        description: "Drawing index recognized successfully",
      })
      // 识别成功后重新获取drawing index数据
      setShowContentView(true);
      getDrawingIndexData();
    } else {
      notification.error({
        message: "Error",
        description: "Failed to recognize drawing index",
      })
    }
  }

  const getDrawingIndexData = async () => {
    setContentData([]);
    setFullLoading(true);
    setIsEmptyContent(false);

    let res: any = await getDrawingIndexInfoById(projectId as string, selectedFileId as number);

    setFullLoading(false);

    if (res.status === 'success') {
      let drawingData = res?.data?.drawings ?? [];
      setContentData(drawingData);

      if (drawingData.length > 0) {
        // 设置文件状态为已完成
        updateFileStatus(selectedFileId, FileStatus.Completed)
      } else {
        // 设置文件状态为未完成
        updateFileStatus(selectedFileId, FileStatus.Processing)
        setIsEmptyContent(true);
      }
      // 如果发现drawingTypeList为空，则再次调用getTypeList
      // if (drawingTypeList.length === 0) {
      //   getTypeList();
      // }
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

  const handleSafeZoomChange = (value: number) => {
    message.warning(
      `The current scale may affect browser performance, and the previous scale will be set soon`,
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


  const handleAppendEvidence = (
    (evidenceList: EvidenceType[]) => {
      // 如果evidence 数据还未加载完成，则不允许手动追加，需要先加载完成，否则会导致数据不一致
      if (!evidenceIsLoaded.current) {
        getFileEvidences();
        return;
      }
      if (!evidenceList?.length) return;
      setFileEvidence([...fileEvidence, ...evidenceList]);
    }
  );

  const handleDeleteEvidence = (
    (deleteIds: number[]) => {
      // 如果evidence 数据还未加载完成，则不允许手动删除，需要先加载完成，否则会导致数据不一致
      if (!evidenceIsLoaded.current) {
        getFileEvidences();
        return;
      }
      if (!deleteIds?.length) return;
      setFileEvidence((prev: any) => {
        return prev.filter(
          (item: EvidenceType) => !deleteIds.includes(item.id)
        )
      });
    }
  );

  const deleteEvidence = async (deleteIds: number[]) => {
    setFullLoading(true);
    let res: any = await evidenceBatchDelete(deleteIds);
    console.log('######### res', res);
    if (res.status === 'success') {
      handleDeleteEvidence(deleteIds);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to delete evidence",
      })
    }
    setFullLoading(false);
  }

  const handleUpdateEvidence = (
    (evidenceList: EvidenceType[]) => {
      // 如果evidence 数据还未加载完成，则不允许手动更新，需要先加载完成，否则会导致数据不一致
      if (!evidenceIsLoaded.current) {
        getFileEvidences();
        return;
      }
      if (!evidenceList?.length) return;
      setFileEvidence(
        fileEvidence.map((item: EvidenceType) => {
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
    }
  );

  const handleAddRectBox = (type: string) => {
    if (pdfRef.current && pdfRef.current?.addingRect) {
      pdfRef.current?.addingRect({ type: type });
    }
  };

  const handleCropsCount = (count: number) => {
    // 如果当前页面有未处理的crop
    setCropsCount(count);
  }

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
  }

  const handleRestartIndex = () => {
    setShowContentView(false);
    // 设置当前文件状态为processing
    updateFileStatus(selectedFileId, FileStatus.Processing)
  }

  const handleDeleteIndex = (item: { id: number }) => {
    confirm({
      title: "Are you sure to delete this index?",
      icon: <ExclamationCircleOutlined />,
      onOk() {
        handleDeleteIndexById(item?.id);
      },
      onCancel() { },
    });
  }

  const handleDeleteIndexById = async (id: number) => {
    let res = await deleteDrawingIndex(id);
    if (res.status === 'success') {
      notification.success({
        message: "Success",
        description: "Deleted successfully",
      });
      setContentData((prev: any) => {
        return prev.filter((item: any) => item.id !== id);
      });
    } else {
      notification.error({
        message: "Error",
        description: "Failed to delete evidence",
      });
    }
  }

  const handleNext = useCallback((btnInfo: { text: string }) => {
    // 处理右上角的next按钮
    if (btnInfo.text === ButtonText.RestartIndex) {
      setShowContentView(false);
    } else if (btnInfo.text === ButtonText.Analysis) {
      if (indexBoxList.length > 0 && labelList.length > 0) {
        recognizeDrawingIndexData();
      } else {
        if (indexBoxList.length === 0) {
          skipType.current = 'index';
        } else {
          skipType.current = 'label';
        }
        setShowSkipModal(true);
      }
    } else if (btnInfo.text === ButtonText.NextFile) {
      // 当前在目录页面，检查当前文件列表中是否有未处理过的文件，如果有未处理过的，则进行下个文件的处理
      const findNextFile = fileList.find((item: any) => {
        return item.operation_type !== FileOperationType.Quote && item.status !== FileStatus.Completed;
      });
      if (findNextFile) {
        // 如果存在未处理的文件，需要提示用户，检测到有未处理的文件，即将切换到下个未处理的文件
        setSelectedFileId(findNextFile.id);
      }
    } else if (btnInfo.text === ButtonText.Complete) {
      // 检测到所有文件都已经处理，即将进入page label界面
      router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification`);
    }
  }, [fileList, indexBoxList, labelList]);


  // 右上角按钮的相关信息
  const nextButtonInfo = useMemo(() => {
    // 判断当前的文件状态
    const currentFile = fileList.find((file: any) => file.id === selectedFileId);

    let buttonText = '';
    let buttonDisabled = false;

    if (currentFile?.status === FileStatus.Processing) {
      if (showContentView && contentData.length === 0) {
        // 如果文件在处理状态，且contentData没有内容数据,则按钮更改为Restart Index
        buttonText = ButtonText.RestartIndex;
      } else {
        // 如果文件在处理状态，且没有index框和label框，则禁用分析按钮
        buttonText = ButtonText.Analysis;
        if (indexBoxList.length === 0 && labelList.length === 0) {
          buttonDisabled = true;
        }
      }
    } else if (currentFile?.status === FileStatus.Completed) {
      // 当前文件的状态为已完成，则判断是否有别的文件未处理
      const hasUnprocessedFiles = fileList.some((file: any) => file.operation_type !== FileOperationType.Quote && (file.status === FileStatus.Processing || file.status === FileStatus.Uploaded));
      if (hasUnprocessedFiles) {
        buttonText = ButtonText.NextFile;
      } else {
        buttonText = ButtonText.Complete;
      }
    }

    return {
      text: buttonText,
      disabled: buttonDisabled,
    }
  }, [fileList, selectedFileId, indexBoxList, labelList, contentData, showContentView]);

  // 处理返回按钮的点击事件
  const handleBack = useCallback(() => {
    if (nextButtonInfo?.text === ButtonText.Analysis) {
      setShowContentView(true);
      if (contentData.length > 0) {
        // 如果有内容数据，则需要更新文件状态为processing
        updateFileStatus(selectedFileId, FileStatus.Completed)
      }
    } else {
      router.push(`/home`);
    }
  }, [nextButtonInfo, contentData]);


  return (
    <div className="w-full h-[100vh] flex flex-col relative">
      <Header
        pdfRef={pdfRef}
        fileList={fileList}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
        nextButtonInfo={nextButtonInfo}
        handleNext={handleNext}
        handleBack={handleBack}
      />

      <div className={`pr-14 flex-1 flex flex-row overflow-hidden relative`}>
        <div
          className="flex flex-col border-r border-primaryN30"
          style={{ width: showContentView ? "500px" : "340px" }}
        >
          {
            showContentView ? (
              <ContentView
                contentData={contentData}
                setContentData={setContentData}
                drawingTypeList={drawingTypeList}
                isEmptyContent={isEmptyContent}
                pdfTotalPages={totalPage}
                handlePageChange={handlePageChange}
                handleDeleteIndex={handleDeleteIndex}
              />
            ) : (
              <IndexRectView
                indexBoxList={indexBoxList}
                labelList={labelList}
                cropsCount={cropsCount}
                handleAddRectBox={handleAddRectBox}
                handleDeleteEvidence={deleteEvidence}
              ></IndexRectView>
            )
          }
        </div>
        <div className={`flex-1 flex flex-col pl-6 pt-4 overflow-hidden`}>
          <div className="h-[60px] flex flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              {showContentView &&
                <div className="w-[122px] h-[28px] flex flex-row justify-center items-center bg-primaryN20 rounded-md cursor-pointer"
                  onClick={handleRestartIndex}
                >
                  <span className="text-baseGray text-xs">Restart Index</span>
                </div>
              }
              <SelectPagesControls
                page={page}
                totalPages={totalPage}
                handlePageChange={handlePageChange}
              />
              <ThumbnailControls
                showThumbnail={showThumbnail}
                setShowThumbnail={setShowThumbnail}
                onClick={() => { setShowThumbnail(!showThumbnail) }}
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
              onRefreshEvidence={() => {
                getFileEvidences();
              }}
              onTotalPages={setTotalPage}
              onAppendEvidence={handleAppendEvidence}
              onDeleteEvidence={handleDeleteEvidence}
              onUpdateEvidence={handleUpdateEvidence}
              onUpdateSafeZoom={handleSafeZoomChange}
              onCropSectionsCount={handleCropsCount}
            ></PdfWrapper>
          </div>
        </div>
        <div ref={thumbnailRef} className="h-full absolute right-0 top-0 z-9999">
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
      {showSkipModal && <SkipTipModal
        isOpen={showSkipModal}
        closeModal={() => { setShowSkipModal(false) }}
        skipType={skipType.current}
        handleAddRectBox={(type: string) => {
          setShowSkipModal(false);
          cropsCount === 0 && handleAddRectBox(type);
        }}
        handleSkip={() => {
          setShowSkipModal(false);
          recognizeDrawingIndexData();
        }}
      />}
      {fullLoading && <Spin fullscreen />}
      {buildLoading && <BuildingBackground
        step={buildLoadingStep}
      />}
    </div>
  );
};

// 为自定义 Select 选项添加必要的全局样式
export default IdentificationIndex;

