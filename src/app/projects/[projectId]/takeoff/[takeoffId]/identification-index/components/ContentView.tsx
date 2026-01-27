import { Checkbox, Select } from "antd";


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
    <div className="pl-14 pr-6 w-full h-full flex flex-col">
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

export default ContentView;