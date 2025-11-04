'use client';

import React from 'react';
import {Group, Line, Rect} from 'react-konva';
import { Glasses } from '../../data/operation/glasses';
import { useSetting } from '../../context/settingContext';
import { useSelection } from '../../context/selectContext';

interface GlassesRendererProps {
  data: Glasses;
  isGroupChild?: boolean;
  drag?: boolean;
  onMouseDown?: (e: any) => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (e: any) => void;
}

export const GlassesRenderer: React.FC<GlassesRendererProps> = ({
  data,
  isGroupChild = false,
  drag = true,
  onMouseDown,
  onDragMove,
  onDragEnd
}) => {
  const { value } = useSetting();
  const { hasSelectedItem } = useSelection();

  if (!data.points || data.points.length < 3) {
    return (
        <Rect
            width={data.virtualFrame.width}
            height={data.virtualFrame.height}
            fill={ data.style.color.fill }
            stroke="none"
            strokeWidth={0}
            x={data.virtualFrame.x}
            y={data.virtualFrame.y}
        />
    )
  }

  const flatPoints = data.points.flatMap(point => [point.x, point.y]);

  const isDraggable = drag && !isGroupChild && value.dragMode !== 'removeLine';
  return (
    <Group
      draggable={isDraggable}
      onMouseDown={onMouseDown}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      dragBoundFunc={() => ({ x: value.stagePos.x, y: value.stagePos.y })}
    >
      {/* 绘制玻璃区域的外轮廓 */}
      <Line
        points={flatPoints}
        closed={true}
        fill={ data.style.color.fill }
        stroke={hasSelectedItem(data.id) ? '#7ba2cf' : data.style.color.border}
        strokeWidth={1}
      />

      {data.points.length >= 4 && (
        <>
          <Line
            points={[
              data.points[0].x, data.points[0].y,
              data.points[2].x, data.points[2].y
            ]}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={0.5}
            dash={[5, 5]}
          />
          {data.points.length >= 6 && (
            <Line
              points={[
                data.points[1].x, data.points[1].y,
                data.points[4].x, data.points[4].y
              ]}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={0.5}
              dash={[5, 5]}
            />
          )}
        </>
      )}
    </Group>
  );
};