'use client';

import { Group, Layer, Line, Rect, Text, Shape } from "react-konva";
import { Frame } from "../data/shape/frame";
import { useSetting } from "../context/settingContext";
import {useEffect, useState} from "react";
import lineUntil from "../until/lineUntil";

interface MoveControlProps {
  frame: Frame;
  onDragMove: (e: any) => void;
  onDragEnd?: (e: any) => void;
  text?: string | number;
  stageSize: { width: number; height: number };
}
const MoveControl = ({
  frame,
  onDragMove,
  onDragEnd,
  stageSize,
  text = "",
}: MoveControlProps) => {
  const { value } = useSetting();
  const { scale, stagePos } = value;

  const controlWidth = 25 /scale;
  const controlHeight = 15 / scale;

  useEffect(() => {


  const location = (() => {
    if ((frame as Frame)?.lines && (frame as Frame)?.lines?.length > 0) {
      const vertices = (frame as Frame).lines.map((line: any) => ({
        x: line.lineInfo?.x1 || 0,
        y: line.lineInfo?.y1 || 0,
      }));

      const center = lineUntil.getCentroid(vertices);

      return {
        x: center.x - controlWidth / 2,
        y: center.y - controlHeight / 2,
      };
    }
    return {
      x: frame.virtualFrame.x + frame.virtualFrame.width / 2 - controlWidth / 2,
      y: frame.virtualFrame.y + frame.virtualFrame.height / 2 - controlHeight / 2,
    };
  })();

  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  const onDragStart = (e: any) => {
    const stage = e.target.getStage();
    const { x: pointerX, y: pointerY } = stage.getPointerPosition();

    setLastPos({
      x: (pointerX - stagePos.x) / scale,
      y: (pointerY - stagePos.y) / scale,
    });
  };

  const onDrag = (e: any) => {
    if (!lastPos) return;

    const stage = e.target.getStage();
    const { x: pointerX, y: pointerY } = stage.getPointerPosition();

    const currentX = (pointerX - stagePos.x) / scale;
    const currentY = (pointerY - stagePos.y) / scale;

    const dx = currentX - lastPos.x;
    const dy = currentY - lastPos.y;

    setLastPos({
      x: currentX,
      y: currentY,
    });

    frame.move(dx, dy);
    onDragMove({ dx, dy });
  };

  return (
    <Group
      x={location.x}
      y={location.y}
      draggable={true}
      dragBoundFunc={() => ({ x: 0, y: 0 })}
      onDragMove={onDrag}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
    >
      <Rect
        width={controlWidth}
        height={controlHeight}
        fill="#091E42"
        cornerRadius={5 / value.scale}
      />
      <Text
        width={controlWidth}
        height={controlHeight}
        text={String(text)}
        fill="white"
        fontSize={12 / value.scale}
        fontFamily="Arial"
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

export default MoveControl;
