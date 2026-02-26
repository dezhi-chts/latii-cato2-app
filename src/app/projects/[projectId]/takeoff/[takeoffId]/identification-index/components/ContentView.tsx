import { updateDrawingIndexType } from "@/services/drawingIndexService";
import { Button, Checkbox, Select, notification } from "antd";
import { useEffect, useState } from "react";
import Image from "next/image";

const ContentView = ({
  contentData,
  setContentData,
  drawingTypeList,
  pdfTotalPages,
  isEmptyContent, // 是否数据为空
  handlePageChange, // 切换页面
}: any) => {
  // 是否需要过滤
  const [isFiltered, setIsFiltered] = useState(false);

  const [filteredContentData, setFilteredContentData] = useState(contentData);

  useEffect(() => {
    if (contentData?.length === 0) return;
    if (isFiltered) {
      setFilteredContentData(
        contentData.filter(
          (item: any) =>
            item.type !== "Unknown" && item.type !== "" && item.type !== null,
        ),
      );
    } else {
      setFilteredContentData(contentData);
    }
  }, [isFiltered, contentData]);
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
    if (res.status === "error") {
      notification.error({
        message: "Error",
        description: "Failed to update drawing index type",
      });
    }
  };

  const handleMatchPage = (item: any) => {
    let pageNum = item.page_number;
    if (pageNum && pageNum > 0 && pageNum <= pdfTotalPages) {
      handlePageChange && handlePageChange(pageNum);
    }
  };

  const contentItem = (item: any) => {
    let checked =
      item.type !== "Unknown" && item.type !== "" && item.type !== null;
    return (
      <div
        key={item.id}
        className="pl-2 my-2 min-h-[28px] flex flex-row items-center text-xs"
      >
        <div className="w-[20px]">
          <div
            className={`w-[15px] h-[15px] rounded-full flex items-center justify-center ${checked ? "bg-forumBlue-normal" : "border border-primaryN30"}`}
          >
            {checked && (
              <div className=" text-white text-xxs font-sans">{"✓"}</div>
            )}
          </div>
        </div>
        <div
          className={`mx-1 w-[60%] text-xs cursor-pointer ${checked ? "text-forumBlue-normal" : ""}`}
          onClick={() => handleMatchPage(item)}
        >
          {item.sheet_id ?? ""}
          <span className="ml-2">{item.title ?? ""}</span>
        </div>
        <div className="w-[40%] text-center">
          <Select
            className="w-[150px] h-[28px] text-xs"
            placeholder="Floor Plan,etc."
            value={item.type === "Unknown" || !item.type ? null : item.type}
            onChange={(value) => handleChangeType(item, value)}
          >
            {drawingTypeList.map((item: any, index: number) => (
              <Select.Option key={item.type + "_" + index} value={item.type}>
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
      <div className="mt-8 mb-2 flex flex-row justify-between items-center">
        <div className="text-xs text-grey-normal">
          Select Pages and respective type of content.
        </div>
        <div>
          <Button
            className={`!w-[100px] ${isFiltered ? "custom-primary-btn" : "custom-default-btn"}`}
            onClick={() => setIsFiltered(!isFiltered)}
          >
            Active Pages
          </Button>
        </div>
      </div>
      {!isEmptyContent ? (
        <>
          <div className="h-[28px] flex flex-row items-center bg-forumBlue-light text-xs text-forumBlue-normal rounded-tl-md rounded-tr-md">
            <div className="w-[50%] text-center">Index</div>
            <div className="w-[50%] text-center">Type</div>
          </div>
          <div className="pr-2 flex-1 overflow-y-auto">
            {filteredContentData?.map((item: any) => contentItem(item))}
          </div>
        </>
      ) : (
        <div className="mt-8 text-xs">
          Sorry, we were unable to categorize the pages automatically, please
          click “Restart Index” button to manually label the content for AI to
          analyze
        </div>
      )}
    </div>
  );
};

export default ContentView;
