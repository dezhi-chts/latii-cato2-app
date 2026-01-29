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

import {
  generateEvidenceByFileId,
  getEvidenceByFileId,
} from "@/services/evidenceService";
import { getTakeOffById } from "@/services/takeOffService";
import { getDrawingIndexTypeList } from "@/services/drawingIndexService";

import PdfWrapper from "../components/pdf/PdfWrapper";
import Header from "./components/Header";
import Thumbnail from "../components/pdf/Thumbnail";
import { EvidenceType, PdfWrapperRefMethods } from "../types/evidence";
import debounce from "lodash/debounce";
import {
  AddRectBoxControls,
  ZoomControls,
  SelectPagesControls,
  ClearAllControls,
} from "../components/pdf/Pdf-Controls";
import DrawingTagsView from "./components/DrawingTagsView";

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

const Identification = () => {
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;
  const pdfRef = useRef<PdfWrapperRefMethods | null>(null);

  const [selectedFileId, setSelectedFileId] = useState<number>(1);
  const [takeOff, setTakeOff] = useState<any>();
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [fileEvidence, setFileEvidence] = useState<any>([]);
  const [thumbnailList, setThumbnailList] = useState<any>([]);
  const [showThumbnail, setShowThumbnail] = useState<boolean>(true);
  const [fullLoading, setFullLoading] = useState<boolean>(false);

  const [cropsCount, setCropsCount] = useState<number>(0);
  const [drawingTypeList, setDrawingTypeList] = useState<any>([]);
  const [currentType, setCurrentType] = useState<string>("All");

  const thumbnailListRef = useRef<any>([]);

  const getFileEvidences = () => { };

  useEffect(() => {
    // 获取takeOff详情
    getTakeOffDetails();
    getTypeList();
  }, [takeOffId]);

  useEffect(() => {
    setThumbnailList((prev: any) => {
      if (currentType === "All") {
        return thumbnailListRef.current.map((item: any) => ({ ...item }));
      } else {
        return thumbnailListRef.current.filter(
          (item: any) => item.type === currentType,
        );
      }
    });
  }, [currentType])

  const getTakeOffDetails = async () => {
    let res: any = await getTakeOffById(takeOffId as any);
    if (res.status === 'success') {
      let project_files = res?.data?.project_files ?? [];
      setTakeOff(res?.data ?? {});
      if (project_files?.length > 0) {
        setSelectedFileId(project_files[0].id); // 设置默认选中文件ID
        setPdfUrl(project_files[0].parse_detail.uploaded_file_url); // 设置默认选中文件的PDF URL
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

  useEffect(() => {
    if (selectedFileId === -1 || !takeOff) return;
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

        const fileList = takeOff?.project_files ?? [];

        //设置新的url
        let file = fileList.find((file: any) => file.id === selectedFileId);
        if (file) {
          let newPdfUrl = file?.url;

          setPdfUrl(newPdfUrl);
          let list = file?.parse_detail?.image_page_infos ?? [];
          list = list.map((item: any) => {
            let type = "";
            const number = Math.floor(Math.random() * 6) + 1;
            if (number > 0 && number < 7) {
              type = defaultPageCategory[number].type;
            }
            return { ...item, type }
          })
          thumbnailListRef.current = list;
          // 设置新的缩略图数据
          setThumbnailList(() => [...list]);
          // 更新pageCategory中每一种类型的数量
          setDrawingTypeList((prev: any) => {
            let newList = prev.map((item: any) => {
              const count = list.filter(
                (file: any) => file.type === item.type,
              ).length;
              return {
                ...item,
                count: item.type === "All" ? list.length : count,
              };
            });
            return [...newList];
          });
          //获取file evidence
          getFileEvidences();
        }
        return;
      }
    });
  }, [selectedFileId, takeOff]);

  const getTypeList = async () => {
    let res: any = await getDrawingIndexTypeList();
    if (res.status === 'success') {
      let list = res?.data?.fixed_types ?? [];
      list.unshift({
        type: "All",
        color: "#717171",
        icon: 'A'
      });
      setDrawingTypeList(list);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get drawing index type list",
      })
    }
  }

  const handlePageTypeChange = (page: number, type: string) => {
    const newThumbnailList = thumbnailList.map((item: any) => {
      let itemPageNum: number = 0;
      if (typeof item.file_name === 'string') {
        let pageArr = item.file_name?.split(".")[0];
        itemPageNum = parseInt(pageArr) + 1;
      }
      if (item.page === page) {
        return {
          ...item,
          type: type,
        };
      }
      return item;
    });
    setThumbnailList((prev: any) => [...newThumbnailList]);
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
    pdfRef?.current?.clearCropSections?.();
  };

  const handleAppendEvidence = () => { };

  const handleDeleteEvidence = () => { };

  const handleAddRectBox = () => {
    if (pdfRef.current && pdfRef.current?.addingRect) {
      pdfRef.current?.addingRect({ type: "Item" });
    }
  };


  return (
    <div className="w-full h-[100vh] flex flex-col">
      <Header
        pdfRef={pdfRef}
        takeOff={takeOff}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
      />
      <DrawingTagsView
        drawingTypeList={drawingTypeList}
        currentType={currentType}
        setCurrentType={setCurrentType}
      ></DrawingTagsView>

      <div className={`pr-14 flex-1 flex flex-row overflow-hidden`}>
        <div
          className="pl-4 flex flex-col border-r border-primaryN30"
          style={{ width: "300px" }}
        >
          <Thumbnail
            pdfRef={pdfRef}
            showThumbnail={showThumbnail}
            setShowThumbnail={setShowThumbnail}
            data={thumbnailList}
            page={page}
            setPage={setPage}
            showCategory={true}
            categoryList={drawingTypeList}
            onChangePageType={handlePageTypeChange}
          ></Thumbnail>
        </div>
        <div className={`flex-1 flex flex-col px-6 overflow-hidden`}>
          <div className="h-[60px] flex flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              <AddRectBoxControls handleAddRectBox={handleAddRectBox} />
              <ClearAllControls />
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
              typeList={drawingTypeList}
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
              onUpdateSafeZoom={handleSafeZoomChange}
            ></PdfWrapper>
          </div>
        </div>
      </div>
      {fullLoading && <Spin fullscreen />}
    </div>
  );
};

// 为自定义 Select 选项添加必要的全局样式
export default Identification;
