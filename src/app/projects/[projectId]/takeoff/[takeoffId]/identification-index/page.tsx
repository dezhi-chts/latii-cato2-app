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

import {
  generateEvidenceByFileId,
  getEvidenceByFileId,
} from "@/services/evidenceService";
import { getTakeOffById } from "@/services/takeOffService";

import PdfWrapper from "../components/pdf/PdfWrapper";
import Header from "./components/Header";
import Thumbnail from "../components/pdf/Thumbnail";
import { EvidenceType, GroupType, PdfWrapperRefMethods } from "../types/evidence";
import debounce from "lodash/debounce";
import {
  ZoomControls,
  AddRectBoxControls,
  PageControls,
  SelectPagesControls,
  ThumbnailControls,
} from "../components/pdf/Pdf-Controls";
import StepProgress from "./components/StepProgress";

type AddingType = "Item" | "Table";
export type Adding = {
  isAdding: boolean;
  type: AddingType | null;
};

const LabelTypeList = [
  {
    label: "Floor Plan", // 平面图
    value: "Floor Plan",
  },
  {
    label: "Elevation", // 立面图
    value: "Elevation",
  },
  {
    label: "Schedule", // 表格页
    value: "Schedule",
  },
  {
    label: "General Notes", // 一般备注
    value: "General Notes",
  },
  {
    label: "Mix", // 混合图
    value: "Mix",
  },
];

const IdentificationIndex = () => {
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;
  const pdfRef = useRef<PdfWrapperRefMethods | null>(null);

  const [selectedFileId, setSelectedFileId] = useState<number>(-1);
  const [takeOff, setTakeOff] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [fileEvidence, setFileEvidence] = useState<any>([]);
  const [thumbnailList, setThumbnailList] = useState<any>([]);
  const [showThumbnail, setShowThumbnail] = useState<boolean>(false);
  const [fullLoading, setFullLoading] = useState<boolean>(false);
  const [showContentView, setShowContentView] = useState<boolean>(false);
  const [contentData, setContentData] = useState<any>({});
  const [indexBoxList, setIndexBoxList] = useState<any>([]);
  const [labelList, setLabelList] = useState<any>([]);

  useEffect(() => {
    // 获取takeOff详情
    getTakeOffDetails();
  }, [takeOffId]);

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

  // 获取当前文件的evidence，并按照type进行分类
  const getFileEvidences = useCallback(async () => {
    if (selectedFileId === -1 || !takeOff) return;
    const response = await getEvidenceByFileId(projectId as string, selectedFileId);
    if (response.status === "success") {
      const evidenceList = response?.data ?? [];
      setFileEvidence(evidenceList);
      // 进行分类
      setIndexBoxList(evidenceList.filter((item: any) => {
        try {
          let type = JSON.parse(item.type).name;
          return type === GroupType.Table;
        } catch (e) {
          console.log(e);
        }
        return false;
      }));
      setLabelList(evidenceList.filter((item: any) => {
        try {
          let type = JSON.parse(item.type).name;
          return type === GroupType.Item;
        } catch (e) {
          console.log(e);
        }
        return false;
      }));

    } else {
      notification.error({
        message: "Error",
        description: "Failed to get file evidence",
      })
    }
  }, [selectedFileId, takeOff]);

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
          // 设置新的缩略图数据
          setThumbnailList(() =>
            file?.parse_detail?.image_page_infos ?? [],
          );
          //获取file evidence
          getFileEvidences();
        }
        return;
      }
    });
  }, [selectedFileId, takeOff]);

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

    getFileEvidences();

    // 获取当前文件的evidence，并按照type进行分类
    pdfRef?.current?.clearCropSections?.();
  };

  const handleDeleteEvidence = (deleteIds: number[]) => { };

  const handleAddRectBox = (type: string) => {
    if (pdfRef.current && pdfRef.current?.addingRect) {
      pdfRef.current?.addingRect({ type: type });
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
          content: "This is a content",
          type: "text",
          created_at: "2023-01-01",
          updated_at: "2023-01-01",
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
  };

  return (
    <div className="w-full h-[100vh] flex flex-col">
      <Header
        pdfRef={pdfRef}
        takeOff={takeOff}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
      />

      <div className={`pr-14 flex-1 flex flex-row overflow-hidden`}>
        <div
          className="flex flex-col border-r border-primaryN30"
          style={{ width: showContentView ? "500px" : "340px" }}
        >
          {
            showContentView ? (
              <ContentView
                contentData={contentData}
                setContentData={setContentData}
              />
            ) : (
              <IndexRectView
                indexBoxList={indexBoxList}
                labelList={labelList}
                handleAddRectBox={handleAddRectBox}
                handleAIContent={handleAIContent}
              ></IndexRectView>
            )
          }
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
              onUpdateSafeZoom={handleSafeZoomChange}
            ></PdfWrapper>
            {
              <Thumbnail
                pdfRef={pdfRef}
                showThumbnail={showThumbnail}
                setShowThumbnail={setShowThumbnail}
                data={thumbnailList}
                page={page}
                fixed={true}
                setPage={setPage}
              ></Thumbnail>
            }
          </div>
        </div>
      </div>
      {fullLoading && <Spin fullscreen />}
    </div>
  );
};

// 为自定义 Select 选项添加必要的全局样式
export default IdentificationIndex;

const ContentView = ({ contentData, setContentData }: any) => {
  const handleChecked = (item: any, value: boolean) => {
    setContentData((prev: any) =>
      prev.map((i: any) => ({
        ...i,
        checked: i.id === item.id ? value : i.checked,
      })),
    );
  };
  const contentItem = (item: any) => {
    return (
      <div className="pl-2 my-2 min-h-[28px] flex flex-row items-center text-xs">
        <div className="w-[20px]">
          <Checkbox
            className="rounded-lg"
            checked={item.checked}
            onChange={(e) => handleChecked(item, e.target.checked)}
          ></Checkbox>
        </div>
        <div
          className={`mx-1 w-[60%] text-xs ${item.checked ? "text-forumBlue" : "text-black"}`}
        >
          {item.name}
        </div>
        <div className="w-[40%] text-center">
          <Select
            className="w-[150px] h-[28px] text-xxs"
            placeholder="Floor Plan,etc."
          >
            {LabelTypeList.map((item: any) => (
              <Select.Option key={item.value} value={item.value}>
                {item.label}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    );
  };
  return (
    <div className="pl-2 pr-6 w-full h-full flex flex-col">
      <div className="mt-8 mb-2 text-xs text-baseGray">
        Select Pages and respective type of content.
      </div>
      <div className="h-[28px] flex flex-row items-center bg-forumBlueLight text-xs text-forumBlue rounded-tl-md rounded-tr-md">
        <div className="w-[50%] text-center">Index</div>
        <div className="w-[50%] text-center">Type</div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {contentData?.map((item: any) => contentItem(item))}
      </div>
    </div>
  );
};

export const IndexRectView = ({ indexBoxList = [], labelList = [], handleAddRectBox, handleAIContent }: any) => {
  const [selectedIndexId, setSelectedIndexId] = useState<number>(-1);
  const [selectedLabelId, setSelectedLabelId] = useState<number>(-1);

  const handleSelectIndex = (indexId: number) => {
    if (indexId !== selectedIndexId) {
      setSelectedIndexId(indexId);
    } else {
      setSelectedIndexId(-1);
    }
    setSelectedLabelId(-1);
  };

  const handleSelectLabel = (labelId: number) => {
    if (labelId !== selectedLabelId) {
      setSelectedLabelId(labelId);
    } else {
      setSelectedLabelId(-1);
    }
    setSelectedIndexId(-1);
  };


  return (
    <div className="pl-14 pr-6 pt-6">
      <div className="text-sm text-forumBlue">Index Identification</div>
      <div className="mt-4 text-xs text-basicGray">Select the Page Index and label examples to improve CATO’s accuracy.</div>
      <div>
        <div className="mt-6 flex flex-row justify-between items-center">
          <div className="flex flex-row"><span className="w-[14px] h-[14px] rounded-[7px] bg-baseGray text-white text-xxs block text-center">1</span><span className="ml-2 text-xs text-basicGray">Define Index Area</span></div>
          <div className="underline text-baseGray text-xs">Learn More</div>
        </div>
        <div className="mt-2 flex flex-row"><span className="ml-5 text-xs">Add a box around the entire Index or Table of Contents.</span></div>
        {/** index rect box  */}
        <div className="my-2 mx-4 flex flex-col gap-4">
          {indexBoxList.map((item: any) => {
            return <div key={item.id} className={`border-2 border-solid rounded-md ${selectedIndexId === item.id ? 'border-forumBlue' : 'border-transparent'}`} onClick={() => handleSelectIndex(item.id)}>
              <Image
                src={'/assets/placeholder-images/example_2.png'}
                alt={''}
                width={100}
                height={50}
                style={{
                  width: "100%",
                  height: "auto",
                }}
              />
            </div>
          })}
        </div>
        <div className="mx-4 my-2 flex flex-row justify-center">
          <AddRectBoxControls
            theme="primary"
            fullWidth={true}
            handleAddRectBox={() => handleAddRectBox('Table')}
          />
        </div>
      </div>
      <div>
        <div className="mt-6 flex flex-row justify-between items-center">
          <div className="flex flex-row"><span className="w-[14px] h-[14px] rounded-[7px] bg-baseGray text-white text-xxs block text-center">2</span><span className="ml-2 text-xs text-basicGray">Identify label Format</span></div>
        </div>
        {
          true &&
          (<>
            <div className="mt-2 flex flex-row"><span className="ml-5 text-xs">Add a box around the entire Index or Table of Contents.</span></div>
            {/** index rect box  */}
            <div className="my-2 mx-4">
              {labelList.map((item: any) => {
                return <div key={item.id} className={`border-2 border-solid rounded-md ${selectedLabelId === item.id ? 'border-forumBlue' : 'border-transparent'}`} onClick={() => handleSelectLabel(item.id)}>
                  <Image
                    src={'/assets/placeholder-images/example_2.png'}
                    alt={''}
                    width={100}
                    height={50}
                    style={{
                      width: "100%",
                      height: "auto",
                    }}
                  />
                </div>
              })}
            </div>
            <div className="my-2 mx-4 flex flex-row justify-center">
              <AddRectBoxControls
                theme="primary"
                text="Label"
                fullWidth={true}
                handleAddRectBox={() => handleAddRectBox('Item')}
              />
            </div>
          </>)
        }
      </div>
      {
        (indexBoxList.length > 0 || labelList.length > 0) &&
        <div className="mt-6 mx-4 flex flex-row justify-center" onClick={handleAIContent}>
          <Button type="primary" style={{ width: '100%' }}>Analyze</Button>
        </div>
      }

    </div>
  );
}
