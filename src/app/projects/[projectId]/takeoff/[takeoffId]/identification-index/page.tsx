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
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";
const { confirm } = Modal;

import {
  deleteEvidenceById,
  evidenceBatchDelete,
  generateEvidenceByFileId,
  getEvidenceByFileId,
} from "@/services/evidenceService";
import { getTakeOffById } from "@/services/takeOffService";

import PdfWrapper from "../components/pdf/PdfWrapper";
import Header from "./components/Header";
import Thumbnail from "../components/pdf/Thumbnail";
import { EvidenceType, FileStatus, GroupType, PdfWrapperRefMethods } from "../types/evidence";
import debounce from "lodash/debounce";
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
import { getDrawingIndexInfoById, getDrawingIndexTypeList, getPdfMatchPages, recognizeDrawingIndex } from "@/services/drawingIndexService";


enum BuildLoadingStep {
  PageAnalysis = 'page-analyze',
  PageLabel = 'page-label',
  PageIndex = 'page-index',
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
  const [showContentView, setShowContentView] = useState<boolean>(false);
  const [contentData, setContentData] = useState<any>([]);
  const [indexBoxList, setIndexBoxList] = useState<any>([]);
  const [drawingTypeList, setDrawingTypeList] = useState<any>([]);
  const [labelList, setLabelList] = useState<any>([]);
  const [cropsCount, setCropsCount] = useState<number>(0);
  const [matchPages, setMatchPages] = useState<any>([]);

  const skipType = useRef<any>(null);

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
    getTypeList();
  }, [takeOffId]);

  const getTakeOffDetails = async () => {
    setFullLoading(true);
    let res: any = await getTakeOffById(takeOffId as any);
    if (res.status === 'success') {
      let project_files = res?.data?.project_files ?? [];
      setTakeOff(res?.data ?? {});
      if (project_files?.length > 0) {
        // 临时测试数据
        let tempFileList = project_files.map((item: any, index: number) => {
          if (index === 0) {
            return {
              ...item,
              status: FileStatus.Completed,
            }
          }
          return item;
        })
        //setFileList(project_files);
        setFileList(tempFileList);
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
    const response = await getEvidenceByFileId(projectId as string, selectedFileId, { filter_type: GroupType.DrawingIndex });
    if (response.status === "success") {
      const evidenceList = response?.data ?? [];
      setFileEvidence(evidenceList);
      // 进行分类
      setIndexBoxList(evidenceList.filter((item: any) => {
        return item.type === GroupType.DrawingIndex;
      }));
      setLabelList(evidenceList.filter((item: any) => {
        return item.type === GroupType.TitleInfo
      }));

    } else {
      notification.error({
        message: "Error",
        description: "Failed to get file evidence",
      })
    }
  }, [selectedFileId, takeOff]);

  const getTypeList = async () => {
    let res: any = await getDrawingIndexTypeList();
    if (res.status === 'success') {
      let list = res?.data?.fixed_page_types ?? [];
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

          // 判断当前文件的状态，如果状态为complete，则显示contentView
          if (file.status === FileStatus.Completed) {
            setShowContentView(true);
            getDrawingIndexData();
          } else {
            // 获取evidence显示
            setShowContentView(false);
          }
        }
        return;
      }
    });
  }, [selectedFileId]);

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
      getDrawingIndexData();
    } else {
      notification.error({
        message: "Error",
        description: "Failed to recognize drawing index",
      })
    }
  }

  const getDrawingIndexData = async () => {
    setFullLoading(true)

    let res: any = await getDrawingIndexInfoById(projectId as string, selectedFileId as number);

    setFullLoading(false);

    if (res.status === 'success') {
      setContentData(res?.data?.drawings ?? []);
      // 获取到content数据
      setShowContentView(true);

      // 设置当前文件状态为complete
      updateFileStatus(selectedFileId, FileStatus.Completed)

      // 如果发现drawingTypeList为空，则再次调用getTypeList
      if (drawingTypeList.length === 0) {
        getTypeList();
      }

      //获取pdf match pages信息
      getPdfMatchPagesInfo();
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get drawing index",
      });
    }
  };

  const getPdfMatchPagesInfo = async () => {
    setMatchPages([]);
    let res: any = await getPdfMatchPages(selectedFileId as any);
    if (res.status === 'success') {
      setMatchPages(res?.data?.data?.drawings ?? []);
    }
  }

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


  const handleAppendEvidence = (uploadData: any) => {
    let newUploadData = uploadData.map((item: any) => ({
      ...item,
      viewportPolygons: item.polygons || [],
    }));

    getFileEvidences();

    // 获取当前文件的evidence，并按照type进行分类
    pdfRef?.current?.clearCropSections?.();
  };

  const handleDeleteEvidence = async (deleteIds: number[]) => {
    setFullLoading(true);
    let res: any = await evidenceBatchDelete(deleteIds);
    if (res.status === 'success') {
      // 重新获取evidence
      getFileEvidences();
    } else {
      notification.error({
        message: "Error",
        description: "Failed to delete evidence",
      })
    }
    setFullLoading(false);
  }

  const handleUpdateEvidence = (updateData: any) => {
    // 刷新当前文件的evidence
    getFileEvidences();
  };

  const handleAddRectBox = (type: string) => {
    if (pdfRef.current && pdfRef.current?.addingRect) {
      pdfRef.current?.addingRect({ type: type });
    }
  };

  const handleCropsCount = (count: number) => {
    // 如果当前页面有未处理的crop
    setCropsCount(count);
  }

  const handleNext = (btnText: 'Next Step' | 'Next File' | 'Complete') => {
    // 处理右上角的next按钮
    if (btnText === 'Next Step') {
      // 当前在画框页面， 判断两种框是否都绘制了，如果都绘制了，则直接到content页面，其他情况，则给个提示
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
    } else if (btnText === 'Next File') {
      // 当前在目录页面，检查当前文件列表中是否有未处理过的文件，如果有未处理过的，则进行下个文件的处理
      const findNextFile = fileList.find((item: any) => {
        return item.status !== FileStatus.Completed;
      });
      if (findNextFile) {
        // 如果存在未处理的文件，需要提示用户，检测到有未处理的文件，即将切换到下个未处理的文件
        setSelectedFileId(findNextFile.id);
      }
    } else if (btnText === 'Complete') {
      // 检测到所有文件都已经处理，则即将跳转下一个页面,提示用户，即将进入分析界面
      // confirm({
      //   title: null,
      //   content: `All files have been processed. Do you want to continue to the analysis step?`,
      //   okText: "OK",
      //   cancelText: "Cancel",
      //   onOk: () => {
      //     // 进行分析请求，请求成功，则跳转
      //     handleAnalysis();
      //   }
      // })
      router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification`);
    }
  }

  const handleAnalysis = async () => {
    setBuildLoadingStep(BuildLoadingStep.PageLabel);
    setBuildLoading(true);
    setTimeout(() => {
      router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification`);
    }, 3000);
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
    // 设置当前文件状态未undo
    updateFileStatus(selectedFileId, FileStatus.Processing)
  }

  return (
    <div className="w-full h-[100vh] flex flex-col relative">
      <Header
        pdfRef={pdfRef}
        fileList={fileList}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
        handleNext={handleNext}
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
                matchPages={matchPages}
                pdfTotalPages={totalPage}
                handlePageChange={handlePageChange}
              />
            ) : (
              <IndexRectView
                indexBoxList={indexBoxList}
                labelList={labelList}
                cropsCount={cropsCount}
                handleAddRectBox={handleAddRectBox}
                handleDeleteEvidence={handleDeleteEvidence}
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
        <div ref={thumbnailRef} className="absolute right-0 top-0 z-9999">
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

