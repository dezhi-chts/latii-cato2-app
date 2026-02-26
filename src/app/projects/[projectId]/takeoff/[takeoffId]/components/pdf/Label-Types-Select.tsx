import React, { useState } from "react";
import { Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
const LabelTypesSelect = ({
  typeList,
  selectedType,
  onChangeType,
}: {
  typeList: any[];
  selectedType: string;
  onChangeType: (type: string) => void;
}) => {
  const [visible, setVisible] = useState(false);

  const LabelGroup = ({ item }: { item: any }) => {
    return (
      <div className="flex flex-row items-center">
        <span
          className="w-[6px] h-[6px] rounded-[3px]"
          style={{ backgroundColor: "transparent" }}
        ></span>
        <span className="ml-2 text-xs">{item.type}</span>
      </div>
    );
  };
  const LabelItem = ({ item, isChild }: { item: any; isChild?: boolean }) => {
    return (
      <div
        className={`flex flex-row items-center hover:text-forumBlue-normal ${isChild ? "ml-2" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
          onChangeType && onChangeType(item.type);
        }}
      >
        <span
          className="w-[6px] h-[6px] rounded-[3px]"
          style={{ backgroundColor: item.color }}
        ></span>
        <span className="ml-2 text-xs">{item.type}</span>
      </div>
    );
  };

  const getCategoryInfo = () => {
    // 将typeList进行扁平化处理
    const flatTypeList = typeList.flatMap((item) => {
      return item?.children?.length > 0 ? item.children : [item];
    });
    const selectInfo = flatTypeList.find((item) => item.type === selectedType);
    let icon = selectInfo?.icon || "";
    let bgColor = selectInfo?.color || "#717171";

    let items = typeList.map((item) => {
      let dropdownItem: any = {};
      if (item?.children && item?.children?.length > 0) {
        dropdownItem.key = item.type;
        dropdownItem.type = "group";
        dropdownItem.label = <LabelGroup item={item} />;
        dropdownItem.children = item.children.map((child: any) => {
          return {
            label: <LabelItem item={child} isChild={true} />,
            key: child.type,
          };
        });
      } else {
        dropdownItem.key = item.type;
        dropdownItem.label = <LabelItem item={item} />;
      }
      return dropdownItem;
    });
    return {
      icon,
      bgColor,
      items,
    };
  };

  const { icon, bgColor, items } = getCategoryInfo();
  return (
    <div>
      <Dropdown
        className="cursor-pointer"
        menu={{ items }}
        trigger={["click"]}
        open={visible}
        onOpenChange={(visible) => {
          if (visible) {
            setVisible(true);
          } else {
            setVisible(false);
          }
        }}
      >
        <div
          className="w-[42px] h-[18px] flex items-center justify-center rounded text-xxs text-white"
          style={{ backgroundColor: bgColor }}
        >
          <span className="ml-1">{icon}</span>
          <DownOutlined
            className="ml-2"
            style={{ color: "white", fontSize: "10px" }}
          />
        </div>
      </Dropdown>
    </div>
  );
};

export default LabelTypesSelect;
