import { updateDrawingIndexType } from "@/services/drawingIndexService";
import { Checkbox, Select, notification } from "antd";
import { useEffect, useState } from "react";


// const LabelTypeList = [
//   {
//     label: "Floor Plan", // 平面图
//     value: "Floor Plan",
//   },
//   {
//     label: "Elevation", // 立面图
//     value: "Elevation",
//   },
//   {
//     label: "Schedule", // 表格页
//     value: "Schedule",
//   },
//   {
//     label: "General Notes", // 一般备注
//     value: "General Notes",
//   },
//   {
//     label: "Mix", // 混合图
//     value: "Mix",
//   },
// ];

// 无效的类型
const invalidTypes = ['UNKNOWN', 'OTHER'];

const ContentView = ({
  contentData,
  setContentData,
  drawingTypeList,
  matchPages,
  pdfTotalPages,
  isEmptyContent, // 是否数据为空
  handlePageChange
}: any) => {
  const handleChangeType = async (item: any, value: string) => {
    if (item.type === value) return;
    setContentData((prev: any) =>
      prev.map((i: any) => ({
        ...i,
        type: i.id === item.id ? value : i.type,
      })),
    );
    // 本地更改完后，同步服务端
    let res = await updateDrawingIndexType(item.id, { new_type: value });
    if (res.status === 'error') {
      notification.error({
        message: "Error",
        description: "Failed to update drawing index type",
      })
    }
  };

  const handleMatchPage = (item: any) => {
    if (matchPages.length === 0) return;
    if (item.sheet_id) {
      let findItem = matchPages.find((i: any) => i.sheet_id === item.sheet_id);
      if (findItem) {
        let page = findItem.page_number;
        if (page && page > 0 && page <= pdfTotalPages) {
          handlePageChange && handlePageChange(page);
        }
      }
    }
  };

  const contentItem = (item: any) => {
    let checked = true;
    if (invalidTypes.includes(item.type)) {
      checked = false;
    }
    return (
      <div key={item.id} className="pl-2 my-2 min-h-[28px] flex flex-row items-center text-xs">
        <div className="w-[20px]">
          <div className={`w-[15px] h-[15px] rounded-full flex items-center justify-center ${checked ? 'bg-forumBlue' : 'border border-primaryN30'}`}
          >
            {checked && <div className=" text-white text-xxs font-sans">{'✓'}</div>}
          </div>
        </div>
        <div
          className={`mx-1 w-[60%] text-xs cursor-pointer ${checked ? "text-forumBlue" : ""}`}
          onClick={() => handleMatchPage(item)}
        >
          {item.sheet_id ?? ''}
          <span className="ml-2">{item.title ?? ''}</span>
        </div>
        <div className="w-[40%] text-center">
          <Select
            className="w-[150px] h-[28px] text-xs"
            placeholder="Floor Plan,etc."
            value={item.type}
            onChange={(value) => handleChangeType(item, value)}
          >
            {drawingTypeList.map((item: any) => (
              <Select.Option key={item.type} value={item.type}>
                {item.type}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    );
  };
  return (
    <div className="pl-14 pr-6 w-full h-full flex flex-col">
      <div className="mt-8 mb-2 text-xs text-basicGray">
        Select Pages and respective type of content.
      </div>
      {
        !isEmptyContent ?
          <>
            <div className="h-[28px] flex flex-row items-center bg-forumBlueLight text-xs text-forumBlue rounded-tl-md rounded-tr-md">
              <div className="w-[50%] text-center">Index</div>
              <div className="w-[50%] text-center">Type</div>
            </div>
            <div className="pr-2 flex-1 overflow-y-auto">
              {contentData?.map((item: any) => contentItem(item))}
            </div>
          </> :
          <div className="mt-8 text-xs">
            Sorry, we were unable to categorize the pages automatically, please click “Next Step” button to manually label the content for AI to analyze
          </div>
      }
    </div>
  );
};

export default ContentView;