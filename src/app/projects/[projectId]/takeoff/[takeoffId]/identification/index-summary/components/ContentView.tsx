import { updatePageType } from "@/services/drawingIndexService";
import { Button, Checkbox, Select, notification, Modal } from "antd";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
const { confirm } = Modal;
import { PageType } from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";
import LoadingScreen from "@/components/loading-screen";
import { notify } from "@/utils/notify";

const selectOptions = [
  {
    value: "All",
    label: "All Pages",
  },
  {
    value: "Active",
    label: "Active Pages",
  },
  {
    value: "Inactive",
    label: "Inactive Pages",
  },
]

const ContentView = ({
  fileId,
  contentData,
  setContentData,
  drawingTypeList,
  currentPage,
  pdfTotalPages,
  isEmptyContent, // 是否数据为空
  handlePageChange, // 切换页面
}: any) => {
  // 是否需要过滤
  const [filterType, setFilterType] = useState("");
  const [fullLoading, setFullLoading] = useState(false);

  const handleChangeType = async (item: any, oldType: string, value: string) => {
    if (item.type === value) return;
    setContentData((prev: any) => {
      return prev.map((i: any) => ({
        ...i,
        type: i.page_number === item.page_number ? value : i.type,
      }))
    });

    if (value.length === 0) {
      setFullLoading(true);
    }
    // 本地更改完后，同步服务端
    let res = await updatePageType({
      fileId: fileId,
      pageNum: item.page_number,
      newType: value,
    });
    setFullLoading(false);
    if (res.status === "success") {
      notify.success({
        title: "Success",
        description: "Drawing index type updated successfully",
      });
      if (value.length === 0) {
        // 代表需要更新当前页面的类型
        res.data?.page_type && setContentData((prev: any) => {
          return prev.map((i: any) => ({
            ...i,
            type: i.page_number === item.page_number ? res.data?.page_type : i.type,
          }))
        });
      }
    } else if (res.status === "error") {
      notify.error({
        title: "Error",
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

  const handleActiveChange = async (item: any, value: string) => {
    let checked =
      item.type !== "Unknown" && item.type !== "" && item.type !== null;
    if (checked) {
      // 当前是启用状态，提示用户切换到禁用状态，会清除当页的相关数据
      // confirm({
      //   title: "Warning",
      //   content: "Switching to the disabled state will clear the information of the current page. Are you sure?",
      //   okText: "OK",
      //   cancelText: "Cancel",
      //   onOk: async () => {
      //     // 切换页面类型为UNKNOWN
      //     handleChangeType(item, item.type, PageType.Unknown);
      //   }
      // })
      // 切换页面类型为UNKNOWN
      handleChangeType(item, item.type, PageType.Unknown);
    } else {
      // 当前是禁用状态，提示用户切换到启用状态会重新检测当页的相关数据，如果检测到的类型您认为不符合预期，请手动修改类型
      // confirm({
      //   title: "Warning",
      //   content: "Switching to the enabled state will re-detect the information of the current page. Are you sure?",
      //   okText: "OK",
      //   cancelText: "Cancel",
      //   onOk: async () => {
      //     // 重新检测页面类型
      //     handleChangeType(item, item.type, '');
      //   }
      // })
      // 重新检测页面类型
      handleChangeType(item, item.type, '');
    }
  };

  const filteredData = useMemo(() => {
    if (contentData?.length === 0) return [];
    if (filterType === "All" || filterType === "") return contentData;
    if (filterType === 'Active') {
      return contentData.filter(
        (item: any) =>
          item.type !== "Unknown" && item.type !== "" && item.type !== null,
      )
    } else if (filterType === 'Inactive') {
      return contentData.filter(
        (item: any) =>
          item.type === "Unknown" || item.type === "" || item.type === null,
      )
    }
  }, [filterType, contentData]);

  const contentItem = (item: any) => {
    let checked =
      item.type !== "Unknown" && item.type !== "" && item.type !== null;

    let shadow = '';
    let isSelectedPage = currentPage === item.page_number;
    if (isSelectedPage) {
      shadow = 'shadow-[0_0_6px_rgba(66,124,206,0.5)] rounded-md';
    }
    return (
      <div
        key={item.page_number + '_' + item.index}
        className={`w-full px-[2px] my-2 min-h-[28px] text-xs`}
      >
        <div className={`py-[2px] flex flex-row items-center ${shadow} ${checked ? "text-forumBlue-normal" : ""}`}>
          <div className="w-[30px] flex items-center justify-center">
            <div className={`w-[15px] h-[15px] rounded-full ${checked ? "bg-forumBlue-normal" : "bg-grey-light-strong"} cursor-pointer`}
              onClick={() => handleActiveChange(item, item.type)}
            >
              {checked ? <span className="ml-[2px] text-white font-sans">✓</span> : ""}
            </div>
          </div>
          <div className="flex-1 flex flex-row" onClick={() => handleMatchPage(item)}>
            <div className={`mx-1 w-[40px] text-center text-xs cursor-pointer`}>
              <span>{item.page_number ?? ""}</span>
            </div>
            <div className={`flex-1 text-xs cursor-pointer text-center`}>
              <span className="">{item.index ?? ""}</span>
            </div>
            <div
              className={`flex-1 text-xs cursor-pointer text-center`}
            >
              <span className="">{item.title ?? ""}</span>
            </div>
          </div>

          <div className="w-[180px] flex items-center justify-center">
            <div>
              <Select
                className="w-[160px] h-[28px] text-xs"
                placeholder="Floor Plan,etc."
                value={!item.type ? null : item.type}
                onFocus={(e) => e.stopPropagation()}
                onChange={(value) => {
                  handleChangeType(item, item.type, value)
                }}
                disabled={!checked}
              >
                {drawingTypeList.map((item: any, index: number) => (
                  <Select.Option key={item.type + "_" + index} value={item.type}>
                    {item.type}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="pl-14 pr-6 w-full h-full flex flex-col">
      <div className="mt-8 mb-4 flex flex-row justify-between items-end">
        <div className="flex flex-row gap-4 text-xs text-grey-normal">
          <div className="mt-1 w-[18px] h-[18px] rounded-full bg-[#C4D6F0] text-xs text-forumBlue-normal-active flex items-center justify-center">A</div>
          <div>
            <p className="text-base text-forumBlue-normal">Page Index Summary</p>
            <p className="mt-1 text-xs text-grey-normal">Review analyzed index.</p>
          </div>
        </div>
        <div>
          <Select
            className="w-[150px] h-[28px] text-xs"
            placeholder="Select"
            onChange={(value) => setFilterType(value)}
          >
            {selectOptions.map((item: any, index: number) => (
              <Select.Option key={item.value + "_" + index} value={item.value}>
                {item.label}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      {!isEmptyContent ? (
        <div className="w-[500px] h-[calc(100%-110px)]">
          <div className="px-[2px] w-full h-[28px] flex flex-row items-center bg-forumBlue-light text-xs text-forumBlue-normal rounded-tl-md rounded-tr-md">
            <div className="w-[34px] text-center"></div>
            <div className="w-[40px] text-center">Page</div>
            <div className="flex-1 text-center">Index</div>
            <div className="flex-1 text-center">Title</div>
            <div className="w-[180px] text-center">Type</div>
          </div>
          <div className="flex-1 max-h-[calc(100%-20px)] overflow-y-auto">
            {filteredData?.map((item: any) => contentItem(item))}
          </div>
        </div>
      ) : (
        <div className="mt-8 text-xs">
          Sorry, we were unable to categorize the pages automatically, please
          click “Reset to Manual Selection” button to manually label the content for AI to
          analyze
        </div>
      )}
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
    </div>
  );
};

export default ContentView;
