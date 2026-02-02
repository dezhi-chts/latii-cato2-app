import React, { useState } from 'react';
import { Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
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

  const getCategoryInfo = () => {
    const selectInfo = typeList.find((item) => item.type === selectedType);
    let icon = selectInfo?.icon || "N";
    let bgColor = selectInfo?.color || "#717171";
    let items = typeList.map((item) => {
      return {
        label: <div className="flex flex-row items-center hover:text-forumBlue"
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
            onChangeType && onChangeType(item.type);
          }}>
          <span className="w-[6px] h-[6px] rounded-[3px]" style={{ backgroundColor: item.color }}></span>
          <span className="ml-2 text-xs">{item.type}</span>
        </div>,
        key: item.type,
      };
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
        className='cursor-pointer'
        menu={{ items }}
        trigger={['click']}
        open={visible}
        onOpenChange={(visible) => {
          if (visible) {
            setVisible(true);
          } else {
            setVisible(false);
          }
        }}
      >
        <div className="w-[42px] h-[18px] flex items-center justify-center rounded text-xxs text-white" style={{ backgroundColor: bgColor }}>
          <span className="ml-1">{icon}</span>
          <DownOutlined className="ml-2" style={{ color: "white", fontSize: "10px" }} />
        </div>
      </Dropdown>
    </div>
  )
}

export default LabelTypesSelect;