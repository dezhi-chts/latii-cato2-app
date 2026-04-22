import React, { useState } from "react";
import { Dropdown, Popconfirm } from "antd";
import { DownOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import Image from "next/image";

// 系统默认类型，不允许修改名称和删除
const SYSTEM_DEFAULT_TYPES = ["Item", "Table", "Context Information", "Key Notes"];

const BoxTypesSelect = ({
  typeList,
  onChangeType,
  onEditType,
  onDeleteType,
}: {
  typeList: any[];
  onChangeType: (type: string) => void;
  onEditType?: (item: any) => void;
  onDeleteType?: (item: any) => void;
}) => {
  const [visible, setVisible] = useState(false);

  const isSystemDefault = (name: string) => {
    console.log("isSystemDefault", name);
    return SYSTEM_DEFAULT_TYPES.includes(name);
  };

  const LabelItem = ({ item, isChild }: { item: any; isChild?: boolean }) => {
    const isDefault = item.is_system_default === 1 || item.is_system_default === true;  //isSystemDefault(item.name);

    return (
      <div
        className={`flex flex-row items-center justify-between hover:text-forumBlue-normal ${isChild ? "ml-2" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
          onChangeType && onChangeType(item.name);
        }}
      >
        <div className="flex flex-row items-center">
          <span
            className="w-[10px] h-[10px] rounded-full"
            style={{ backgroundColor: item.color || '#717171' }}
          ></span>
          <span className="ml-2 text-xs">{item.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {!isDefault &&
            <EditOutlined
              className="text-xs text-grey-normal hover:text-forumBlue-normal"
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
                onEditType?.(item);
              }}
            />
          }
          {!isDefault && (
            <Popconfirm
              title="Delete Logic Box"
              description={`Are you sure you want to delete "${item.name}"?`}
              onConfirm={(e) => {
                e?.stopPropagation();
                onDeleteType?.(item);
              }}
              onCancel={(e) => {
                e?.stopPropagation();
              }}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <DeleteOutlined
                className="text-xs text-grey-normal hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            </Popconfirm>
          )}
        </div>
      </div>
    );
  };

  const items = typeList.map((item) => {
    let dropdownItem: any = {};
    dropdownItem.key = item.name;
    dropdownItem.label = <LabelItem item={item} />;
    return dropdownItem;
  });

  // 添加底部的 Customize 按钮
  items.push({
    key: "customize",
    label: (
      <div
        className="flex flex-row items-center justify-between text-forumBlue-normal hover:text-forumBlue-dark-active"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
          onChangeType && onChangeType("customize");
        }}
      >
        <span className="text-xs">Customize</span>
        <span className="text-base">+</span>
      </div>
    ),
  });

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
        <div className="w-[78px] !h-[24px] text-xxs text-forumBlue-dark-active bg-forumBlue-light-active rounded-md flex flex-row justify-center items-center gap-1">
          <Image
            src="/assets/icons/add-box.svg"
            alt="add box"
            width={8}
            height={8}
          ></Image>
          Add Box
        </div>
      </Dropdown>
    </div>
  );
};

export default BoxTypesSelect;
