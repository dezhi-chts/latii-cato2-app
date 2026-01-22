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
import { ZoomControls, AddRectBoxControls } from "../components/pdf/Pdf-Controls";
import StepProgress from "./components/StepProgress";

type AddingType = "Item" | "Table";
export type Adding = {
  isAdding: boolean;
  type: AddingType | null;
};

const LabelTypeList = [{
  label: "Floor Plan", // 平面图
  value: "Floor Plan"
}, {
  label: "Elevation",  // 立面图
  value: "Elevation"
}, {
  label: "Schedule", // 表格页
  value: "Schedule"
}, {
  label: "General Notes", // 一般备注
  value: "General Notes"
}, {
  label: "Mix", // 混合图
  value: "Mix"
}]

const IdentificationIndex = () => {
  const projectId = 1; //useParams().projectId;
  const takeOffId = 1; //useParams().takeoffId;
  const pdfRef = useRef<PdfWrapperRefMethods | null>(null);

  const [selectedFileId, setSelectedFileId] = useState<number>(1);
  const [takeOff, setTakeOff] = useState<any>();
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const { fileEvidence, setFileEvidence, fileEvidenceRef } =
    useFileEvidenceState();
  const [project, setProject] = useState<any>({});
  const [thumbnailList, setThumbnailList] = useState<any>([]);
  const [showThumbnail, setShowThumbnail] = useState<boolean>(true);
  const [fullLoading, setFullLoading] = useState<boolean>(false);
  const [showContentView, setShowContentView] = useState<boolean>(false);
  const [contentData, setContentData] = useState<any>({});

  const fileList = [
    {
      id: 1,
      file_name: 'Architectural-example.pdf',
      upload_status: 'done',
      url: 'https://latii-automation-dev.s3.amazonaws.com/s3_evidences/original/6a0f8d76ba474ddcae31e942e9c3cbb2_24_6004.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260121%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260121T062920Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=a5dbd176be9ca1a3a68968a225545686f103dfa79d78d71adc26fc1bb18eaa2f'
    },
    {
      id: 2,
      file_name: 'Quote-example.pdf',
      upload_status: 'done',
      url: 'https://latii-automation-dev.s3.amazonaws.com/s3_evidences/original/935d889f8e954ad29fd0f7205dab5bd8_1107_114353.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260121%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260121T063110Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=15e3a5d67fd627179a8abae980b2becb38fe4f897c886b96b090f1af61496f96',
    },
  ];

  useEffect(() => {

  }, [takeOff]);


  const getFileEvidences = () => {

  }

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

        setThumbnailList((prev: any) => []);

        //设置新的url
        let file = fileList.find(
          (file: any) => file.id === selectedFileId
        );
        if (file) {
          let newPdfUrl = file?.url;

          setPdfUrl(newPdfUrl);
          //获取file evidence
          getFileEvidences();
        }
        return;
      }
    });
  }, [selectedFileId]);

  useEffect(() => {
    if (takeOffId) {

    }
  }, [takeOffId]);

  useEffect(() => {
    if (pdfUrl && totalPage > 0) {
      let list = [];
      // 构造假的缩略图列表
      for (let i = 0; i < totalPage; i++) {
        list.push({
          id: i + 1,
          file_name: 'fake_thumbnail.png',
          s3_key: `${projectId}_${selectedFileId}_${i + 1}`,
          s3_url: '/assets/placeholder-images/example_2.png'
        });
      }
      setThumbnailList(list);
    }
  }, [totalPage]);


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

  const handleThumbnail = () => {
    setShowThumbnail(!showThumbnail);
  };

  const handleClearAllCrop = () => {
    pdfRef?.current?.clearCropSections?.();
  };

  const handleAppendEvidence = (uploadData: any) => {
    let newUploadData = uploadData.map((item: any) => ({
      ...item,
      viewportPolygons: item.polygons || [],
    }));
    // 保存evidence成功, 更新fileEvidence
    setFileEvidence((prev: any) => [...prev, ...newUploadData]);
    // 清空当前页面的crop区域
    pdfRef?.current?.clearCropSections?.();
  }

  const handleDeleteEvidence = (deleteIds: number[]) => {
  };

  const handleAddRectBox = () => {
    if (pdfRef.current && pdfRef.current?.addingRect) {
      pdfRef.current?.addingRect({ type: 'Table' });
    }
  };

  const handleAIContent = async () => {
    setFullLoading(true);
    // 模拟请求
    setTimeout(() => {
      let list: any = [];
      // 模拟假数据
      for (let i = 0; i < 30; i++) {
        let data = {
          id: i,
          name: `A${i + 1}: Floor Plan`,
          content: 'This is a content',
          type: 'text',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
        };
        list.push(data);
      }
      setContentData(list);
      // 获取到content数据
      setShowContentView(true);
      // 切换到第一页
      setPage(1);
      setFullLoading(false);
    }, 3000);
  }

  return (
    <div className="w-full h-[100vh] flex flex-col">
      <Header
        pdfRef={pdfRef}
        project={project}
        takeOff={takeOff}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
        showContentView={showContentView}
      />

      <div className={`flex-1 flex flex-row overflow-hidden`}>
        <div className="pl-4 flex flex-col border-r border-primaryN30"
          style={{ width: showContentView ? '500px' : '300px' }}
        >
          {
            showContentView ? <ContentView contentData={contentData} setContentData={setContentData} /> : (
              <Thumbnail
                pdfRef={pdfRef}
                showThumbnail={showThumbnail}
                setShowThumbnail={setShowThumbnail}
                data={thumbnailList}
                page={page}
                setPage={setPage}
              ></Thumbnail>
            )
          }
        </div>
        <div className={`flex-1 flex flex-col px-6 pt-4 overflow-hidden`}>
          <div className="h-[60px] flex flex-row justify-between items-center">
            {!showContentView ? <div className="flex items-center gap-2">
              <AddRectBoxControls
                handleAddRectBox={handleAddRectBox} />
              <Button
                className="w-[76px] h-[28px] bg-primaryN30 rounded-md"
                onClick={() => { }}
              >
                Skip
              </Button>
              <Button
                className="w-[86px] h-[28px] bg-primaryN30 rounded-md"
                onClick={handleAIContent}
              >
                AI-Content
              </Button>
            </div> : <div className="flex-1"></div>}
            <div>
              <ZoomControls
                zoom={zoom}
                handleZoomChange={handleZoomChange}
              />
            </div>
          </div>
          <div className="flex-1 flex overflow-hidden border border-primaryN30 rounded-md">
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
              onUpdateSafeZoom={handleSafeZoomChange}
            ></PdfWrapper>
          </div>
        </div>
      </div>
      <div className="h-[130px] border-t border-primaryN30 flex items-center justify-center">
        <StepProgress currentStep={1} />
      </div>
      {fullLoading && <Spin fullscreen />}
    </div>
  );
};

// 为自定义 Select 选项添加必要的全局样式
export default IdentificationIndex;

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

const ContentView = ({
  contentData,
  setContentData
}: any) => {

  const handleChecked = (item: any, value: boolean) => {
    setContentData((prev: any) => prev.map((i: any) => ({
      ...i,
      checked: i.id === item.id ? value : i.checked,
    })));
  }
  const contentItem = (item: any) => {
    return (
      <div className="pl-2 my-2 min-h-[28px] flex flex-row items-center text-xs">
        <div className="w-[20px]"><Checkbox className="rounded-lg" checked={item.checked} onChange={(e) => handleChecked(item, e.target.checked)}></Checkbox></div>
        <div className={`mx-1 w-[60%] text-xs ${item.checked ? 'text-forumBlue' : 'text-black'}`}>{item.name}</div>
        <div className="w-[40%] text-center">
          <Select className="w-[150px] h-[28px] text-xxs" placeholder="Floor Plan,etc.">
            {
              LabelTypeList.map((item: any) => (
                <Select.Option key={item.value} value={item.value}>{item.label}</Select.Option>
              ))
            }
          </Select>
        </div>
      </div>
    )
  }
  return (
    <div className="pl-2 pr-6 w-full h-full flex flex-col">
      <div className="mt-8 mb-2 text-xs text-baseGray">Select Pages and respective type of content.</div>
      <div className="h-[28px] flex flex-row items-center bg-forumBlueLight text-xs text-forumBlue rounded-tl-md rounded-tr-md">
        <div className="w-[50%] text-center">Index</div>
        <div className="w-[50%] text-center">Type</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {contentData?.map((item: any) => contentItem(item))}
      </div>
    </div>
  )
} 
