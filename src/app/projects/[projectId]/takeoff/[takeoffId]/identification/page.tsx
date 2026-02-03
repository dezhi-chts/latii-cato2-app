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

import {
  generateEvidenceByFileId,
  getEvidenceByFileId,
} from "@/services/evidenceService";
import { getTakeOffById } from "@/services/takeOffService";
import { getDrawingIndexTypeList, getPdfAnalysePages, getPdfAnalyseSummary } from "@/services/drawingIndexService";

import PdfWrapper from "../components/pdf/PdfWrapper";
import Header from "./components/Header";
import Thumbnail from "../components/pdf/Thumbnail";
import { EvidenceType, FileStatus, GroupType, PdfWrapperRefMethods } from "../types/evidence";
import debounce from "lodash/debounce";
import {
  AddRectBoxControls,
  ZoomControls,
  SelectPagesControls,
  ClearAllControls,
} from "../components/pdf/Pdf-Controls";
import DrawingTagsView from "./components/DrawingTagsView";
import BuildingBackground from "../identification-index/components/BuildingBackground";

const { confirm } = Modal;

const defaultPageCategory = [
  {
    type: "All",
    primaryColor: "#717171",
    count: 0,
  },
  {
    type: "Floor Plan",
    primaryColor: "#D868D8",
    count: 0,
  },
  {
    type: "Elevation",
    primaryColor: "#0BC6BE",
    count: 0,
  },
  {
    type: "Schedule",
    primaryColor: "#5859D6",
    count: 0,
  },
  {
    type: "Mixed",
    primaryColor: "#F5C00B",
    count: 0,
  },
  {
    type: "Generalities",
    primaryColor: "#00798A",
    count: 0,
  },
  {
    type: "Not Used",
    primaryColor: "#A3A3A3",
    count: 0,
  },
];

enum BuildLoadingStep {
  PageAnalysis = 'page-analyze',
  PageLabel = 'page-label',
  PageIndex = 'page-index',
}

const fixed_page_type = [
  {
    type: "Active Pages",
    color: "#717171",
    count: 0,
  }, {
    type: "All",
    color: "#717171",
    count: 0,
  }]

const Identification = () => {
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
  const [pageTypeList, setPageTypeList] = useState<any>([fixed_page_type[0]]);
  const [labelTypeList, setLabelTypeList] = useState<any>([]);
  const [currentType, setCurrentType] = useState<string>(fixed_page_type[0].type);
  const [summaryData, setSummaryData] = useState<any>(null);

  const thumbnailListRef = useRef<any>([]);
  const evidenceIsLoaded = useRef<boolean>(false);


  useEffect(() => {
    // 获取takeOff详情
    getTakeOffDetails();
    getTypeList();
  }, [takeOffId]);

  const getTakeOffDetails = async () => {
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
  };

  // 获取当前文件的evidence，并按照type进行分类
  const getFileEvidences = useCallback(async () => {
    if (selectedFileId === -1) return;

    evidenceIsLoaded.current = false;
    const response = await getEvidenceByFileId(projectId as string, selectedFileId, { filter_type: GroupType.Label });
    if (response.status === "success") {
      evidenceIsLoaded.current = true;
      const evidenceList = response?.data ?? [];
      setFileEvidence(evidenceList.filter((item: any) => item.type !== GroupType.DrawingIndex && item.type !== GroupType.TitleInfo));
    } else {
      evidenceIsLoaded.current = false;
      notification.error({
        message: "Error",
        description: "Failed to get file evidence",
      })
    }
  }, [selectedFileId]);

  const getPdfSummary = async () => {
    let res: any = await getPdfAnalyseSummary(selectedFileId as any);
    if (res.status === 'success') {
      setSummaryData(res?.data?.data ?? null);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get pdf analyse pages",
      });
    }
  }

  const getTypeList = async () => {
    let res: any = await getDrawingIndexTypeList();
    if (res.status === 'success') {
      let pageList = res?.data?.fixed_page_types ?? [];
      let labelList = res?.data?.fixed_label_types ?? [];
      let first = pageTypeList[0];
      if (pageList.length > 0) {
        pageList.push(fixed_page_type[1]);
      }
      setPageTypeList([first, ...pageList]);
      setLabelTypeList(labelList);
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
          let newPdfUrl = file?.parse_detail?.uploaded_file_url;

          setPdfUrl(newPdfUrl);
          let list = file?.parse_detail?.image_page_infos ?? [];
          thumbnailListRef.current = list;
          // 设置新的缩略图数据
          setThumbnailList(() => [...list]);

          setPageTypeList((prev: any) => {
            return prev.map((item: any) => {
              if (item.type === "All") return {
                ...item,
                count: list.length
              };
              return item;
            })
          })

          //获取file evidence
          getFileEvidences();
          //获取pdf analyse summary
          getPdfSummary();
        }
        return;
      }
    });
  }, [selectedFileId, fileList]);

  useEffect(() => {
    // 获取总页数，从ref中获取完整列表的长度
    if (pageTypeList?.length >= 0 && summaryData) {
      let list = [...pageTypeList];
      const page_classification = summaryData.page_classification ?? {};
      let typeList = list.map((item: any) => {
        if (item.type === "All") return item;
        return {
          ...item,
          count: page_classification[item.type] ?? 0
        }
      });
      setPageTypeList(() => [...typeList]);
    }

    if (thumbnailListRef.current.length > 0 && summaryData) {
      // 初始化数据
      const list = thumbnailListRef.current.map((item: any) => {
        let itemPageNum: number = 0;
        if (typeof item.file_name === 'string') {
          let pageArr = item.file_name?.split(".")[0];
          itemPageNum = parseInt(pageArr) + 1;
        }

        const summaryPages = summaryData?.pages ?? [];
        // 从 summaryPages 中查找对应的类型
        let itemType = summaryPages.find((item: any) => item.page_number === itemPageNum)?.page_type ?? '';
        return {
          ...item,
          type: itemType,
        }
      });

      thumbnailListRef.current = list;
      // 更新 thumbnailList 状态
      setThumbnailList(() => [...list]);
    }
  }, [summaryData])


  useEffect(() => {
    // 当 currentType 变化时，更新 thumbnailList
    if (thumbnailListRef.current.length > 0) {
      // 根据 currentType 过滤
      let list = thumbnailListRef.current.filter((item: any) => item.type === currentType);
      // 更新 thumbnailList 状态
      setThumbnailList(() => {
        if (currentType === "All") return [...thumbnailListRef.current];
        return [...list];
      });
    }
  }, [currentType]);

  const handlePageTypeChange = async (page: number, type: string) => {
    let oldType = '';
    const newThumbnailList = thumbnailList.map((item: any) => {
      let itemPageNum: number = 0;
      if (typeof item.file_name === 'string') {
        let pageArr = item.file_name?.split(".")[0];
        itemPageNum = parseInt(pageArr) + 1;
      }
      if (itemPageNum === page) {
        oldType = item.type;
        return {
          ...item,
          type: type,
        };
      }
      return item;
    });
    setThumbnailList((prev: any) => [...newThumbnailList]);

    // 调用API更改page页的type，如果更新成功，则更改tags的数量，如果更新失败，则回滚到旧的type
    let res = { status: 'success' }
    if (res.status === 'success') {
      // 更改tags的数量
      setPageTypeList((prev: any) => {
        return prev.map((item: any) => {
          if (item.type === type) {
            return {
              ...item,
              count: item.count + 1,
            }
          }
          if (item.type === oldType) {
            return {
              ...item,
              count: item.count - 1,
            }
          }
          return item;
        })
      })
      thumbnailListRef.current = newThumbnailList;
    } else {
      // 回滚到旧的type
      setThumbnailList((prev: any) => [...thumbnailListRef.current]);
      notification.error({
        message: "Error",
        description: "Failed to change page type",
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
  const handleRotate = () => {
    pdfRef?.current?.rotatePDF?.();
  };

  const handleThumbnail = () => {
    setShowThumbnail(!showThumbnail);
  };

  const handleClearAllCrop = () => {
    if (!pdfRef.current) return;

    // 调用删除接口
    pdfRef?.current?.handleBatchDelete();
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
      setFileEvidence(
        fileEvidence.filter(
          (item: EvidenceType) => !deleteIds.includes(item.id)
        )
      );
    }
  );

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

  const handleAddRectBox = () => {
    if (pdfRef.current && pdfRef.current?.addingRect) {
      pdfRef.current?.addingRect({ type: "Item", isSaveEvidence: true });
    }
  };

  const handleNext = () => {
    //判断除当前文件外还有别的文件未处理
    let filterFiles = fileList.filter((file: any) => file.id !== selectedFileId);
    let nextFile = filterFiles.find((file: any) => file.status !== FileStatus.Completed);
    if (nextFile) {
      // 设置当前文件为完成状态
      setFileList((prev: any) => {
        return prev.map((file: any) => {
          if (file.id === selectedFileId) {
            return {
              ...file,
              status: FileStatus.Completed,
            }
          }
          return file;
        })
      });
      setSelectedFileId(nextFile.id);
    } else {
      // 没有其他文件需要处理，则进行下一步
      setBuildLoading(true);
      setTimeout(() => {
        setBuildLoading(false);
      }, 5000);
    }
  }

  return (
    <div className="w-full h-[100vh] flex flex-col">
      <Header
        pdfRef={pdfRef}
        fileList={fileList}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
        handleNext={handleNext}
      />
      <DrawingTagsView
        pageTypeTags={pageTypeList}
        currentType={currentType}
        setCurrentType={setCurrentType}
      ></DrawingTagsView>

      <div className={`pr-14 flex-1 flex flex-row overflow-hidden`}>
        <div
          className="pl-4 flex flex-col border-r border-primaryN30"
          style={{ width: "300px" }}
        >
          <div className="py-4 pl-10 flex flex-row ">
            <p className="mr-2 text-sm text-baseGray">Page Labeling</p>
            <Popover placement="rightBottom"
              title={<div className="text-xxs font-medium">About Page Labeling</div>}
              content={<div className="w-[300px] text-xxs text-baseGray">
                Review and analyze the sections identified by CATO. You can verify existing results or add new labels manually.
                Ensuring every section is correctly labeled guarantees the most accurate analysis from CATO.
              </div>}
              trigger="hover"
            >
              <Image src="/assets/icons/info.svg" alt="info circle icon" width={14} height={14}></Image>
            </Popover>
          </div>
          <Thumbnail
            pdfRef={pdfRef}
            showThumbnail={showThumbnail}
            setShowThumbnail={setShowThumbnail}
            data={thumbnailList}
            page={page}
            setPage={setPage}
            showCategory={true}
            categoryList={pageTypeList.filter((item: any) => item.type !== "All" && item.type !== "Active Pages")}
            onChangePageType={handlePageTypeChange}
          ></Thumbnail>
        </div>
        <div className={`flex-1 flex flex-col px-6 overflow-hidden`}>
          <div className="h-[60px] flex flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              <AddRectBoxControls handleAddRectBox={handleAddRectBox} />
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
              showEvidenceType={true}
              onRefreshEvidence={() => {
                getFileEvidences();
              }}
              onTotalPages={setTotalPage}
              onAppendEvidence={handleAppendEvidence}
              onDeleteEvidence={handleDeleteEvidence}
              onUpdateEvidence={handleUpdateEvidence}
              onUpdateSafeZoom={handleSafeZoomChange}
            ></PdfWrapper>
          </div>
        </div>
      </div>
      {fullLoading && <Spin fullscreen />}
      {buildLoading && <BuildingBackground
        step={BuildLoadingStep.PageAnalysis}
      />}
    </div>
  );
};

export default Identification;
