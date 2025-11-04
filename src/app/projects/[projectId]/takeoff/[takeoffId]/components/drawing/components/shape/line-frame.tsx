import {Group, Path, Rect} from "react-konva";
import {useSelection} from "../../context/selectContext";
import {useSetting} from "../../context/settingContext";
import {HorizontalLineWindow, VerticalLineWindow} from "../../data/shape/line";
import React, {useState} from "react";
import {LineSegment, ShapeType} from "../../datas";
import zoneUntil from "../../until/zoneUntil";

interface LineProps {
  data: HorizontalLineWindow | VerticalLineWindow;
  onClick?: (e: any) => void;
  onDragMove?: (e: any) => void;
  onDragEnd?: (e: any) => void;
  drag: boolean;
  isGroupChild: boolean;
  onMouseDown?: (e: any) => void;
  onUpdate?: (e: any) => void;
  onLineElementCut?: (e: any) => void;
  onLineRemove?: (line: any, e: any, a?: boolean) => void;
}

export const LineFrame: React.FC<LineProps> = ({
                                                 data,
                                                 onClick,
                                                 onDragMove,
                                                 onDragEnd,
                                                 drag,
                                                 isGroupChild,
                                                 onMouseDown,
                                                 onUpdate,
                                                 onLineRemove,
                                                 onLineElementCut
                                               }) => {
  const {value} = useSetting();
  const {clearSelection} = useSelection();

  const handleClick = (e: any) => {
    if (isGroupChild) {
      e.cancelBubble = true;
      return;
    }
    // toggleSelection(data);
    onClick?.(data);
    if (value.dragMode == 'removeLine' && !getCutLines().length) {
      onLineRemove?.(data.lines[0], e)
    }
  };


  const getCutLines = () => {
    const line = data.lines[0]
    let semts = zoneUntil.splitLineByIntersections(
      line.intersectionPoints,
      line.startPoint,
      line.endPoint
    )
    return semts
  }

  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  const onDrag = (e: any) => {
    e.cancelBubble = true;

    const stage = e.target.getStage();
    const {x: pointerX, y: pointerY} = stage.getPointerPosition();

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
    data.clearRenderPoints()
    onDragMove?.({dx, dy});
  };

  const onDragStart = (e: any) => {
    e.cancelBubble = true;

    const stage = e.target.getStage();
    const {x: pointerX, y: pointerY} = stage.getPointerPosition();

    setLastPos({
      x: (pointerX - value.stagePos.x) / value.scale,
      y: (pointerY - value.stagePos.y) / value.scale,
    });
  };

  const isDraggable = drag && !isGroupChild && value.dragMode !== 'removeLine';

  const handleLineRemove = (e: any, segment: LineSegment, index: number) => {
    if (value.dragMode !== 'removeLine') {
      return;
    }

    onLineElementCut?.({cut: segment, all: getCutLines()})
  };

  const handleContextMenu = (e: any,) => {
    clearSelection()
    e.cancelBubble = true;
    e.evt.preventDefault();

    onLineRemove?.(data.lines[0], e, true)
  }

  const cutVerticalSegment = (longStart: any, longHeight: any, shortStart: any, shortHeight: any) => {
    const [x1, y1] = longStart; // 长线段的起始坐标
    const [x2, y2] = shortStart; // 短线段的起始坐标

    const longEndY = y1 + longHeight; // 长线段的结束Y坐标
    const shortEndY = y2 + shortHeight; // 短线段的结束Y坐标

    // 如果短线段完全不在长线段内，直接返回长线段
    if (y2 >= longEndY || shortEndY <= y1) {
      return [[x1, y1, longHeight]];
    }

    let result = [];

    // 上半部分：如果短线段的起点高于长线段的起点
    if (y2 > y1) {
      result.push([x1, y1, y2 - y1]); // 上部分线段
    }

    // 下半部分：如果短线段的结束点低于长线段的结束点
    if (shortEndY < longEndY) {
      result.push([x1, shortEndY, longEndY - shortEndY]); // 下部分线段
    }

    return result;
  }

  return (
    <Group
      onMouseDown={onMouseDown}
      onClick={handleClick}
      draggable={isDraggable}
      dragBoundFunc={() => ({x: value.stagePos.x, y: value.stagePos.y})}
      onDragMove={onDrag}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
    >
      <Rect
        width={data.type == ShapeType.LineV ? data.virtualFrame.width * 5 : data.virtualFrame.width}
        height={data.type == ShapeType.LineH ? data.virtualFrame.height * 5 : data.virtualFrame.height}
        //   fill='red'
        stroke="none"
        strokeWidth={0}
        offsetX={data.type == ShapeType.LineV ? data.virtualFrame.width * 2.5 : 0}
        offsetY={data.type == ShapeType.LineH ? data.virtualFrame.height * 2.5 : 0}
        x={data.virtualFrame.x}
        y={data.virtualFrame.y}

      />
      <Path
        key={data.lines[0].id}
        data={`M ${data.lines[0].startPoint.x} ${data.lines[0].startPoint.y} L ${data.lines[0].endPoint.x} ${data.lines[0].endPoint.y}`}
        // fill={hasSelectedItem(data.id) ? '#7ba2cf' : data.style.color.border}
        stroke={data.style.color.border}
        hitStrokeWidth={20}
        onContextMenu={(e) => handleContextMenu(e)}
        strokeWidth={value.noRenderBase ? 0 : 2}
      />

      {
        value.dragMode === 'removeLine' && getCutLines()?.map((segment, index) => {
          return (
            <Path
              key={data.lines[0].id + '-' + index}
              onClick={(e) => handleLineRemove(e, segment, index)}
              data={` M ${segment.startPoint.x} ${segment.startPoint.y} L ${segment.endPoint.x} ${segment.endPoint.y} `}
              stroke="#ff000033"
              strokeWidth={10}
            >
            </Path>
          )
        })
      }
    </Group>
  );
}; 