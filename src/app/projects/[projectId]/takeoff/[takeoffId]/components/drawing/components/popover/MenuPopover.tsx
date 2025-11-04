'use client';

import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { useSetting } from '../../context/settingContext';

export interface MenuItem {
  id: string;
  label: string;
  action: (e: any) => void;
}

interface MenuPopoverProps {
  x: number;
  y: number;
  onClose: () => void;
  menuItems: MenuItem[];
}

export const MenuPopover: React.FC<MenuPopoverProps> = ({
  x,
  y,
  onClose,
  menuItems
}) => {
  const { value } = useSetting();
  const popoverWidth = 120  / value.scale;
  const itemHeight = 28  / value.scale;
  const fontSize = 14  / value.scale;
  const popoverHeight = itemHeight * menuItems.length + (10 / value.scale);


  const handleItemClick = (e: any, item: MenuItem) => {
    e.cancelBubble = true;
    item.action(e);
    onClose();
  };

  React.useEffect(() => {
    const handleGlobalClick = () => {
      onClose();
    };

    window.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [onClose]);

  return (
    <Group
      x={x}
      y={y}
    >
      <Rect
        width={popoverWidth}
        height={popoverHeight}
        fill="white"
        stroke="#ccc"
        strokeWidth={1}
        cornerRadius={3}
        shadowColor="rgba(0,0,0,0.1)"
        shadowBlur={5}
        shadowOffsetX={2}
        shadowOffsetY={2}
      />

      {menuItems.map((item, index) => (
        <Group
          key={item.id}
          y={index * itemHeight}
          // onMouseEnter={(e) => {
          //   const container = e.target.getStage()?.container();
          //
          // }}
          // onMouseLeave={(e) => {
          //   const container = e.target.getStage()?.container();
          //
          // }}
          onClick={(e) => handleItemClick(e, item)}
        >
          <Rect
            width={popoverWidth}
            height={itemHeight}
            fill="transparent"
          />
          <Text
            text={item.label}
            x={10 / value.scale}
            y={itemHeight / 2}
            fontSize={fontSize}
            fill="#333"
            verticalAlign="middle"
          />
          
          {index < menuItems.length - 1 && (
            <Rect
              y={itemHeight + (6 / value.scale)}
              width={popoverWidth}
              height={1}
              fill="#eee"
            />
          )}
        </Group>
      ))}
    </Group>
  );
};