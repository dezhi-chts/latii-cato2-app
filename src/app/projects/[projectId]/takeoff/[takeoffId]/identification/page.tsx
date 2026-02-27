"use client";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  ConfigProvider,
  Divider,
  message,
  Modal,
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
  FieldBinaryOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import debounce from "lodash/debounce";

import { getEvidenceByFileId } from "@/services/evidenceService";
import { getTakeOffById } from "@/services/takeOffService";
import {
  getDrawingIndexTypeList,
  getPdfAnalysePages,
  getPdfAnalyseSummary,
  updatePageType,
} from "@/services/drawingIndexService";

import {
  EvidenceType,
  FileOperationType,
  FileStatus,
  GroupType,
  PdfWrapperRefMethods,
  QuotePageTypes,
} from "../types/evidence";

import LoadingScreen from "@/components/loading-screen";
import PdfWrapper from "../components/pdf/PdfWrapper";
import Header from "./components/Header";
import Thumbnail from "../components/pdf/Thumbnail";
import {
  AddRectBoxControls,
  ZoomControls,
  SelectPagesControls,
  ClearAllControls,
} from "../components/pdf/Pdf-Controls";
import DrawingTagsView from "./components/DrawingTagsView";
import BuildingBackground from "../identification-index/components/BuildingBackground";
import PreAnalysisMdal from "./components/PreAnalysisMdal";

import {
  PageType,
  EvidenceResult,
  ArchDrawingAllPageTags,
  ArchDrawingPageTypes,
  ArchDrawingLabelTypes,
} from "../types/evidence";

const { confirm } = Modal;

enum BuildLoadingStep {
  PageAnalysis = "page-analyze",
  PageLabel = "page-label",
  PageIndex = "page-index",
}

const validPageType = [
  PageType.FloorPlan,
  PageType.Elevation,
  PageType.Schedule,
  PageType.KeyNotes,
  PageType.Mix,

  PageType.Item,
  PageType.Information,
  PageType.Description,
];

export enum ButtonText {
  NextFile = "Next File",
  Complete = "Complete",
}

const PageLabeling = ({ showHeader = true }: { showHeader?: boolean }) => {
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;
  const pdfRef = useRef<PdfWrapperRefMethods | null>(null);

  const [selectedFileId, setSelectedFileId] = useState<number>(-1);
  const [takeOff, setTakeOff] = useState<any>();
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [fileList, setFileList] = useState<any>([]);
  const [fileEvidence, setFileEvidence] = useState<any>([]);
  const [thumbnailList, setThumbnailList] = useState<any>([]);
  const [showThumbnail, setShowThumbnail] = useState<boolean>(true);
  const [fullLoading, setFullLoading] = useState<boolean>(false);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);

  const [cropsCount, setCropsCount] = useState<number>(0);
  const [pageTypeList, setPageTypeList] = useState<any>(ArchDrawingAllPageTags);
  const [labelTypeList, setLabelTypeList] = useState<any>(
    ArchDrawingLabelTypes,
  );
  const [currentType, setCurrentType] = useState<string>(
    ArchDrawingAllPageTags[0].type,
  );
  const [summaryData, setSummaryData] = useState<any>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);

  const evidenceIsLoaded = useRef<boolean>(false);
  const lastSelectedFileId = useRef<number>(-1);
  const unSavedCropsCount = useRef<number>(0);

  useEffect(() => {
    if (takeOffId) {
      initPageData();
    }
  }, [takeOffId]);

  const initPageData = async () => {
    setFullLoading(true);

    //await getTypeList();
    // 获取takeOff详情
    await getTakeOffDetails();

    setFullLoading(false);
  };

  // 使用summary初始化pageTypeList
  const initPageTypeWidthSummary = useCallback(
    async (summaryData: any) => {
      if (!summaryData) return;
      const page_classification = summaryData.page_classification ?? {};

      setPageTypeList((prev: any) => {
        let newPageTypeList = prev.map((item: any) => {
          if (item.type === PageType.All) {
            return {
              ...item,
              count: summaryData.total_pages,
            };
          } else if (item.type === PageType.ActivePages) {
            // 把page_classification中所有不是invalidPageType的type的count加起来
            let totalCount: any = [];
            for (let key in page_classification) {
              if (validPageType.includes(key)) {
                totalCount.push(page_classification[key] ?? 0);
              }
            }
            let count = totalCount.reduce((a: any, b: any) => a + b, 0);
            return {
              ...item,
              count: count,
            };
          } else {
            return {
              ...item,
              count: page_classification[item.type] ?? 0,
            };
          }
        });
        return newPageTypeList;
      });
    },
    [pageTypeList],
  );

  // 使用summary初始化thumbnailList
  const initThumbnailWidthSummary = useCallback(
    async (summaryData: any) => {
      if (!summaryData) return;

      setThumbnailList((prev: any) => {
        return prev.map((item: any) => {
          let itemPageNum: number = 0;
          if (typeof item.file_name === "string") {
            let pageArr = item.file_name?.split(".")[0];
            itemPageNum = parseInt(pageArr) + 1;
          }
          const summaryPages = summaryData?.pages ?? [];
          // 从 summaryPages 中查找对应的类型
          let itemType =
            summaryPages.find((item: any) => item.page_number === itemPageNum)
              ?.page_type ?? "";
          return {
            ...item,
            type: itemType,
          };
        });
      });
    },
    [thumbnailList],
  );

  const getTakeOffDetails = async () => {
    let res: any = await getTakeOffById(takeOffId as any);
    if (res.status === "success") {
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
  };

  // 获取当前文件的evidence，并按照type进行分类
  const getFileEvidences = useCallback(async () => {
    if (selectedFileId === -1) return;
    const file = fileList.find((file: any) => file.id === selectedFileId);
    let filterType = "QuoteLabel";
    if (file && file.operation_type === FileOperationType.ArchitectureDrawing) {
      filterType = "ArchDrawingLabel";
    }

    evidenceIsLoaded.current = false;
    const response = await getEvidenceByFileId(
      projectId as string,
      selectedFileId,
      { filter_type: filterType },
    );
    if (response.status === "success") {
      evidenceIsLoaded.current = true;
      const evidenceList = response?.data ?? [];
      setFileEvidence(
        evidenceList.filter(
          (item: any) =>
            item.type !== GroupType.DrawingIndex &&
            item.type !== GroupType.TitleInfo,
        ),
      );
    } else {
      evidenceIsLoaded.current = false;
      notification.error({
        message: "Error",
        description: "Failed to get file evidence",
      });
    }
  }, [selectedFileId]);

  const getPdfSummary = async () => {
    setFullLoading(true);
    let res: any = await getPdfAnalyseSummary(selectedFileId as any);
    setFullLoading(false);
    if (res.status === "success") {
      //  setSummaryData(res?.data?.data ?? null);
      initPageTypeWidthSummary(res?.data?.data ?? null);
      initThumbnailWidthSummary(res?.data?.data ?? null);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get pdf analyse pages",
      });
    }
  };

  const getTypeList = async () => {
    let res: any = await getDrawingIndexTypeList();
    if (res.status === "success") {
      let pageList = res?.data?.fixed_page_types ?? [];
      let labelList = res?.data?.fixed_label_types ?? [];
      let first = pageTypeList[0];
      if (pageList.length > 0) {
        //pageList.push(fixed_page_type[1]);
      }
      setPageTypeList([first, ...pageList]);
      setLabelTypeList(labelList);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get drawing index type list",
      });
    }
  };

  useEffect(() => {
    if (selectedFileId === -1) return;

    if (
      lastSelectedFileId.current !== -1 &&
      lastSelectedFileId.current !== selectedFileId
    ) {
      // 设置上个文件的状态为完成
      updateFileStatus(lastSelectedFileId.current, FileStatus.Completed);
    }

    // 设置当前文件的状态为完成
    updateFileStatus(selectedFileId, FileStatus.Completed);

    lastSelectedFileId.current = selectedFileId;

    // 没有crop需要保存
    pdfRef?.current?.resetAllInfo();

    // 重置 file evidence
    setFileEvidence([]);

    //reset page
    setPage(1);
    setTotalPage(1);
    if (zoom !== 1.0) {
      setZoom(1.0);
    }

    setThumbnailList((prev: any) => []);

    //设置新的url
    let file = fileList.find((file: any) => file.id === selectedFileId);
    if (file) {
      let newPdfUrl = file?.parse_detail?.uploaded_file_url;
      setPdfUrl(newPdfUrl);
      let list = file?.parse_detail?.image_page_infos ?? [];

      // 设置新的缩略图数据
      setThumbnailList(() => [...list]);

      //获取pdf analyse summary
      getPdfSummary();

      //获取file evidence
      getFileEvidences();
    }
  }, [selectedFileId]);

  const filterThumbnailList = useMemo(() => {
    const file = fileList.find((file: any) => file.id === selectedFileId);
    if (!file) return [];

    if (file && file.operation_type === FileOperationType.Quote)
      return [...thumbnailList];

    if (currentType === PageType.All) return [...thumbnailList];
    if (currentType === PageType.ActivePages)
      return [...thumbnailList].filter(
        (item: any) => item.type && validPageType.includes(item.type),
      );
    return [...thumbnailList].filter((item: any) => item.type === currentType);
  }, [selectedFileId, fileList, currentType, thumbnailList]);

  const getItemPage = (item: any, index: number) => {
    if (typeof item.file_name === "string") {
      let pageArr = item.file_name?.split(".")[0];
      return parseInt(pageArr) + 1;
    }
    return index + 1;
  };

  const updateThumbnailPageType = (page: number, type: string) => {
    setThumbnailList((prev: any) => {
      return prev.map((item: any, index: number) => {
        let itemPageNum = getItemPage(item, index);
        if (itemPageNum === page) {
          return {
            ...item,
            type: type,
          };
        }
        return item;
      });
    });
  };

  const handleUpdatePageType = useCallback(
    (pageTypes: any) => {
      const page_types = pageTypes || [];
      let findCurrentPageType = page_types.find(
        (item: any) => item.page_number === page,
      );
      if (!findCurrentPageType) {
        return;
      }

      let newType = findCurrentPageType.page_type || "";
      if (!newType) return;
      newType = validPageType.includes(newType) ? newType : PageType.NotUsed;

      // 获取当前页旧的type
      let oldType =
        thumbnailList.find((item: any, index: number) => {
          let itemPageNum = getItemPage(item, index);
          return itemPageNum === page;
        })?.type || "";

      console.log("######## newType", newType, "oldType", oldType);

      if (oldType === newType) return;

      // 更新当前页的type
      updateThumbnailPageType(page, newType);

      // 如果是quote文件类型，则不执行后面更新tags的操作
      if (fileOperationType === FileOperationType.Quote) return;

      // 更新tags中的数据
      setPageTypeList((prev: any) => {
        let list = [...prev];
        let oldTypeItem = list.find((item: any) => item.type === oldType);
        let newTypeItem = list.find((item: any) => item.type === newType);
        let activePagesItem = list.find(
          (item: any) => item.type === PageType.ActivePages,
        );
        // 页面旧类型集合数量减1
        oldTypeItem.count =
          (oldTypeItem?.count || 0) - 1 < 0 ? 0 : (oldTypeItem?.count || 0) - 1;
        // 页面新类型集合数量加1
        newTypeItem.count = (newTypeItem?.count || 0) + 1;

        let activePages = list.filter((item: any) =>
          validPageType.includes(item.type),
        );
        // 计算所有有效类型的计数之和
        activePagesItem.count = activePages.reduce(
          (total: number, item: any) => total + (item.count || 0),
          0,
        );

        return [...list];
      });
    },
    [page, thumbnailList],
  );

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

  const handlePageChange = async (value: number) => {
    // 需要判断当前pdf页面上是否有裁剪区域未提交
    let unsaved = await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
    if (!pdfRef.current || unsaved) {
      if (value < 1) return;
      if (value > totalPage) return;
      if (value === page) return;
      setPage(value);
      return;
    }
  };
  const handleRotate = () => {
    pdfRef?.current?.rotatePDF?.();
  };

  const handleClearAllCrop = () => {
    if (!pdfRef.current) return;

    // 调用删除接口
    pdfRef?.current?.handleBatchDelete();
  };

  const handleAppendEvidence = (evidenceResult: EvidenceResult) => {
    // 如果evidence 数据还未加载完成，则不允许手动追加，需要先加载完成，否则会导致数据不一致
    const { evidences, page_types = [] } = evidenceResult;
    const evidenceList = evidences || [];
    if (!evidenceIsLoaded.current) {
      getFileEvidences();
      return;
    }
    if (!evidenceList?.length) return;
    setFileEvidence([...fileEvidence, ...evidenceList]);

    handleUpdatePageType(page_types);
  };

  const handleDeleteEvidence = (evidenceResult: EvidenceResult) => {
    // 如果evidence 数据还未加载完成，则不允许手动删除，需要先加载完成，否则会导致数据不一致
    const { deleteIds = [], page_types = [] } = evidenceResult;
    if (!evidenceIsLoaded.current) {
      getFileEvidences();
      return;
    }
    if (!deleteIds?.length) return;
    setFileEvidence(
      fileEvidence.filter((item: EvidenceType) => !deleteIds.includes(item.id)),
    );
    handleUpdatePageType(page_types);
  };

  const handleUpdateEvidence = (evidenceResult: EvidenceResult) => {
    // 如果evidence 数据还未加载完成，则不允许手动更新，需要先加载完成，否则会导致数据不一致
    const { evidences, page_types = [] } = evidenceResult;
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
    handleUpdatePageType(page_types);
  };

  const handleAddRectBox = (type: GroupType) => {
    if (pdfRef.current && pdfRef.current?.addingRect) {
      pdfRef.current?.addingRect({ type, isSaveEvidence: true });
    }
  };

  const updateFileStatus = (fileId: number, fileStatus: FileStatus) => {
    setFileList((prev: any) => {
      return prev.map((file: any) => {
        if (file.id === fileId) {
          return {
            ...file,
            status: fileStatus,
          };
        }
        return file;
      });
    });
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
        const unsaved = await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
        if (!pdfRef?.current || unsaved) {
          // 没有未保存的crop，切换文件
          setSelectedFileId(nextFile.id);
        }
      }
    } else {
      // 没有其他文件需要处理，则进行下一步
      // 进行分析步骤时，判断是否有未保存的crop
      const unsaved = await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
      if (!pdfRef?.current || unsaved) {
        // 没有未保存的crop，进入分析流程
        setShowAnalysisModal(true);
      }
    }
  };

  const handleAnalysis = async () => {
    setBuildLoading(true);
    setTimeout(() => {
      setBuildLoading(false);
    }, 5000);
  };

  const handleCropsCount = (count: number) => {
    unSavedCropsCount.current = count;
  };

  // 右上角按钮的相关信息
  const nextButtonInfo = useMemo(() => {
    // 判断当前的文件状态
    const allComplete = fileList.every(
      (file: any) => file.status === FileStatus.Completed,
    );

    let buttonText = "";
    if (allComplete) {
      buttonText = ButtonText.Complete;
    } else {
      if (fileList.length > 1) {
        buttonText = ButtonText.NextFile;
      }
    }
    return {
      text: buttonText,
    };
  }, [fileList, selectedFileId]);

  const fileOperationType = useMemo(() => {
    if (!fileList.length) return "";
    let file = fileList.find((file: any) => file.id === selectedFileId);
    return file.operation_type || "";
  }, [fileList, selectedFileId]);

  return (
    <div
      className={`w-full flex flex-col relative ${showHeader ? "h-[100vh]" : "h-full"}`}
    >
      {showHeader && (
        <Header
          pdfRef={pdfRef}
          fileList={fileList}
          selectedFileId={selectedFileId}
          setSelectedFileId={setSelectedFileId}
          nextButtonInfo={nextButtonInfo}
          handleNext={handleNext}
        />
      )}
      {fileOperationType === FileOperationType.ArchitectureDrawing && (
        <DrawingTagsView
          pageTypeTags={pageTypeList}
          currentType={currentType}
          setCurrentType={setCurrentType}
        ></DrawingTagsView>
      )}

      <div className={`pr-14 flex-1 flex flex-row overflow-hidden`}>
        <div
          className="pl-4 flex flex-col border-r border-primaryN30"
          style={{ width: "270px" }}
        >
          <div className="py-4 pl-10 flex flex-row ">
            <p className="mr-2 text-sm text-grey-light-strong">Page Labeling</p>
            <Popover
              placement="rightBottom"
              title={
                <div className="text-xxs font-medium">About Page Labeling</div>
              }
              content={
                <div className="w-[300px] text-xxs text-grey-light-strong">
                  Review and analyze the sections identified by CATO. You can
                  verify existing results or add new labels manually. Ensuring
                  every section is correctly labeled guarantees the most
                  accurate analysis from CATO.
                </div>
              }
              trigger="hover"
              className="cursor-pointer"
            >
              <Image
                src="/assets/icons/info.svg"
                alt="info circle icon"
                width={14}
                height={14}
              ></Image>
            </Popover>
          </div>
          <Thumbnail
            pdfRef={pdfRef}
            showThumbnail={showThumbnail}
            setShowThumbnail={setShowThumbnail}
            data={filterThumbnailList}
            page={page}
            setPage={setPage}
            showCategory={true}
            showShadow={false}
            size={
              fileOperationType === FileOperationType.Quote
                ? "larger"
                : "default"
            }
            categoryList={
              fileOperationType === FileOperationType.ArchitectureDrawing
                ? ArchDrawingPageTypes
                : fileOperationType === FileOperationType.Quote
                  ? QuotePageTypes
                  : []
            }
          ></Thumbnail>
        </div>
        <div className={`flex-1 flex flex-col px-6 overflow-hidden`}>
          <div className="h-[60px] flex flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              {fileOperationType === FileOperationType.ArchitectureDrawing ? (
                <>
                  <AddRectBoxControls
                    handleAddRectBox={() =>
                      handleAddRectBox(GroupType.FloorPlan)
                    }
                  />
                </>
              ) : fileOperationType === FileOperationType.Quote ? (
                <>
                  <AddRectBoxControls
                    theme="default"
                    text="Add Item"
                    handleAddRectBox={() => handleAddRectBox(GroupType.Item)}
                  />
                  <AddRectBoxControls
                    theme="default"
                    text="Layer Information"
                    handleAddRectBox={() =>
                      handleAddRectBox(GroupType.LayerInfo)
                    }
                  />
                  <AddRectBoxControls
                    theme="default"
                    text="Add Description"
                    handleAddRectBox={() =>
                      handleAddRectBox(GroupType.Description)
                    }
                  />
                </>
              ) : null}
              <ClearAllControls handleClearAll={handleClearAllCrop} />
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
          <div className="flex-1 flex overflow-hidden border border-primaryN30 rounded-md">
            <PdfWrapper
              ref={pdfRef}
              operationMode={"edit"}
              mode="edit"
              typeList={labelTypeList}
              pdfUrl={pdfUrl as string}
              project_id={projectId as any}
              project_file_id={selectedFileId}
              zoom={zoom}
              page={page}
              allEvidence={fileEvidence}
              onChangePage={setPage}
              onTotalPages={setTotalPage}
              onAppendEvidence={handleAppendEvidence}
              onDeleteEvidence={handleDeleteEvidence}
              onUpdateEvidence={handleUpdateEvidence}
              onCropSectionsCount={handleCropsCount}
            ></PdfWrapper>
          </div>
        </div>
      </div>
      {showAnalysisModal && (
        <PreAnalysisMdal
          isOpen={showAnalysisModal}
          closeModal={() => setShowAnalysisModal(false)}
          handleAnalysis={() => {
            setShowAnalysisModal(false);
            handleAnalysis();
          }}
        ></PreAnalysisMdal>
      )}

      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
      {buildLoading && (
        <BuildingBackground step={BuildLoadingStep.PageAnalysis} />
      )}
    </div>
  );
};

export default PageLabeling;
