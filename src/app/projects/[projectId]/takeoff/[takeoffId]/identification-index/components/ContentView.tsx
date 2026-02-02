import { updateDrawingIndexType } from "@/services/drawingIndexService";
import { Checkbox, Select, notification } from "antd";


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
const ContentView = ({
  contentData,
  setContentData,
  drawingTypeList
}: any) => {
  const handleChecked = async (item: any, value: boolean) => {
    if (item.type === value) return;

    setContentData((prev: any) =>
      prev.map((i: any) => ({
        ...i,
        checked: i.id === item.id ? value : i.checked,
      })),
    );

  };

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

  const contentItem = (item: any) => {
    return (
      <div key={item.id} className="pl-2 my-2 min-h-[28px] flex flex-row items-center text-xs">
        <div className="w-[20px]">
          <div className={`w-[15px] h-[15px] rounded-full cursor-pointer flex items-center justify-center ${item.checked ? 'bg-forumBlue' : 'border border-primaryN30'}`}
            onClick={() => handleChecked(item, !item.checked)}
          >
            {item.checked && <div className=" text-white text-xxs font-sans">{'✓'}</div>}
          </div>
        </div>
        <div
          className={`mx-1 w-[60%] text-xs ${item.checked ? "text-forumBlue" : ""}`}
        >
          {item.sheet_id ?? ''}
          {item.title ?? ''}
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
  console.log('######### contentData', contentData);
  return (
    <div className="pl-14 pr-6 w-full h-full flex flex-col">
      <div className="mt-8 mb-2 text-xs text-basicGray">
        Select Pages and respective type of content.
      </div>
      <div className="h-[28px] flex flex-row items-center bg-forumBlueLight text-xs text-forumBlue rounded-tl-md rounded-tr-md">
        <div className="w-[50%] text-center">Index</div>
        <div className="w-[50%] text-center">Type</div>
      </div>
      <div className="pr-2 flex-1 overflow-y-auto">
        {contentData?.map((item: any) => contentItem(item))}
      </div>
    </div>
  );
};

export default ContentView;