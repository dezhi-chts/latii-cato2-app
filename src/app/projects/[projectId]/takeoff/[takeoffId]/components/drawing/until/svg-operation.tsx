'use client';

import React, { useState, useEffect } from 'react';
import { Group, Image, Rect, Text } from 'react-konva';
import { useSetting } from '../context/settingContext';
import { useSelection } from '../context/selectContext';
import { BaseOperation } from '../data/operation/baseOperation';
import { getSvgInfo } from '../components/operation/svgMapping';

interface SvgOperationProps {
  data: BaseOperation;
  isGroupChild?: boolean;
  drag?: boolean;
  onMouseDown: (e: any) => void;
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
}

export const SvgOperation: React.FC<SvgOperationProps> = ({
  data,
  isGroupChild = false,
  drag = true,
  onMouseDown,
  onDragMove,
  onDragEnd
}) => {
  const { value } = useSetting();
  const { hasSelectedItem } = useSelection();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [dragStartState, setDragStartState] = useState<any>(null);
  
  const svgInfo = getSvgInfo(data.type);
  // const [nativeImage] = useImage(svgInfo)

  useEffect(() => {
    if (!svgInfo.path) return;
    console.log(svgInfo)
    const img = new window.Image();
    img.src = svgInfo.path;
    img.onload = () => {
      setImage(img);
    };
  }, [svgInfo.path]);
  
  const isDraggable = drag && !isGroupChild && value.dragMode !== 'removeLine';
  
  const onDragStart = (e: any) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    const { x: pointerX, y: pointerY } = stage.getPointerPosition();
    
    setLastPos({
      x: (pointerX - value.stagePos.x) / value.scale,
      y: (pointerY - value.stagePos.y) / value.scale,
    });
    
    setDragStartState({
      initialFrame: {
        x: data.virtualFrame.x,
        y: data.virtualFrame.y,
        width: data.virtualFrame.width,
        height: data.virtualFrame.height,
      }
    });
  };
  
  const onDrag = (e: any) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    const { x: pointerX, y: pointerY } = stage.getPointerPosition();
    
    const currentX = (pointerX - value.stagePos.x) / value.scale;
    const currentY = (pointerY - value.stagePos.y) / value.scale;
    
    let dx = currentX - (lastPos as any).x;
    let dy = currentY - (lastPos as any).y;
    
    const newX = data.virtualFrame.x + dx;
    const newY = data.virtualFrame.y + dy;
    
    if (newX < 0) dx = 0;
    if (newY < 0) dy = 0;
    
    setLastPos({
      x: currentX,
      y: currentY,
    });
    
    data.move(dx, dy);
    onDragMove({ dx, dy });
  };
  
  const handleDragEnd = (e: any) => {
    onDragEnd(dragStartState);
  };
  const { x, y, width, height } = data.virtualFrame;
  const isSelected = hasSelectedItem(data.id);
  return (
    <Group
      onMouseDown={onMouseDown}
      draggable={isDraggable}
      dragBoundFunc={() => ({ x: value.stagePos.x, y: value.stagePos.y })}
      onDragStart={onDragStart}
      onDragMove={onDrag}
      onDragEnd={handleDragEnd}
    >
      {/* 边框（选中时显示） */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={isSelected ? '#7ba2cf' : 'transparent'}
        strokeWidth={1 / value.scale}
        fill="transparent"
        dash={isSelected ? [5 / value.scale, 5 / value.scale] : undefined}
      />

      {image && (
        <Image
          x={x}
          y={y}
          width={width}
          height={height}
          image={image}
          rotation={svgInfo.transform?.includes('rotate')
            ? parseInt(svgInfo.transform.replace(/[^0-9]/g, ''), 10) || 0
            : 0}
        />
      )}
    </Group>
  );
}; 