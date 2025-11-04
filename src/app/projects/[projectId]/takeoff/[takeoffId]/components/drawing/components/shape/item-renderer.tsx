// Import all necessary components and types
import React, { useState } from "react";
import { TriangleFrame } from "./triangle-frame";
import { SemiCircleFrame } from "./semicircle-frame";
import { LineFrame } from "./line-frame";
import ResizableFrame from "./resizable-frame";
import { TriangleWindow } from "../../data/shape/triangle";
import {
  TopSemiCircleWindow,
  RightSemiCircleWindow,
} from "../../data/shape/semicircle";
import {
  HorizontalLineWindow,
  VerticalLineWindow,
} from "../../data/shape/line";
import { BaseFrame, ILine } from "../../data/baseFrame";
import { IResizableFrame } from "./resizable-frame";
import { GroupFrame } from "../../data/groupFrame";
import { Group, Line, Rect, Circle } from "react-konva";
import { useSelection } from "../../context/selectContext";
import { useSetting } from "../../context/settingContext";
import { AngleArrow } from "../operation/angle-arrow";
import { ArrowData } from "../../data/operation/arrow";
import { AngleData } from "../../data/operation/angle";
import { Frame } from "../../data/shape/frame";
import {
  SDLHorizontal,
  SDLVertical,
  TDLHorizontal,
  TDLVertical,
} from "../../data/divider/divider";
import { DividerFrame } from "./divider-frame";
import { BaseOperation } from "../../data/operation/baseOperation";
import { SvgOperation } from "../operation/svg-operation";
import { Glasses } from "../../data/operation/glasses";
import { GlassesRenderer } from "../operation/glasses";
import { Dashed } from "../../data/operation/dashed";
import { MenuItem, MenuPopover } from "../popover/MenuPopover";
import { RenderData } from "../../data/render/renderData";
import { RenderDataRenderer } from "../zone/renderer";
import { RenderSettingsPopover } from "../popover/RenderSettingsPopover";
import { FixedData } from "../../data/operation/fixed";
import IndexShower from "../info/index-shower";
import zoneUntil from "../../until/zoneUntil";

interface FrameRendererProps {
  element: any;
  drag?: boolean;
  isGroupChild?: boolean;
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
  onRegisterGlobalClick?: (callback: () => void) => void;
  onChange?: (newAttrs: IResizableFrame) => void;
  registerPopoverSetter?: (setter: (info: any) => void) => void;
  onSelect?: (elements: any[]) => void;
  onLineRemove?: (line: any, e: any, noCut?: boolean) => void;
  onPointMove?: (e: any, index: number) => void;
  onPointMoveEnd?: (e: any, index: number) => void;
  onUpdateCircle?: (e: any, item: any) => void;
  onLineElementCut?: (e: any) => void;
  onCopyClick?: (e: any) => void;
  onRenderClick?: (e: any) => void;
  onRemoveElement?: (e: any) => void;
  text?: number | string;
}

export const FrameRenderer: React.FC<FrameRendererProps> = ({
  element,
  drag = true,
  isGroupChild = false,
  onDragMove,
  onDragEnd,
  onRegisterGlobalClick,
  onChange,
  registerPopoverSetter,
  onSelect,
  onLineRemove,
  onPointMove,
  onPointMoveEnd,
  onUpdateCircle,
  onLineElementCut,
  onCopyClick,
  onRenderClick,
  onRemoveElement,
  text,
}) => {
  const { value } = useSetting();
  const { setSelectedItems } = useSelection();
  const handleMouseDown = (e: any, element: any) => {
    if (value.dragMode === "removeLine") {
      e.cancelBubble = true;
      return;
    }
    console.log(element);
    e.cancelBubble = true;
    setSelectedItems([element]);
    onSelect?.([element]);
    setDragStartState({
      initialFrame: {
        x: element.virtualFrame.x,
        y: element.virtualFrame.y,
        width: element.virtualFrame.width,
        height: element.virtualFrame.height,
      },
    });
  };

  const isDraggable = drag && !isGroupChild && value.dragMode !== "removeLine";

  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  const onDrag = (e: any, data: any) => {
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
  const [dragStartState, setDragStartState] = useState<any>(null);

  const onDragStart = (e: any) => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    const { x: pointerX, y: pointerY } = stage.getPointerPosition();

    setLastPos({
      x: (pointerX - value.stagePos.x) / value.scale,
      y: (pointerY - value.stagePos.y) / value.scale,
    });
  };

  const handleDragEnd = (e: any) => {
    console.log(dragStartState);
    onDragEnd(dragStartState);
  };

  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (e: any) => {
    e.cancelBubble = true;
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();

    setContextMenuPosition({
      x: pointerPos.x,
      y: pointerPos.y,
    });
  };

  const closeContextMenu = () => {
    setContextMenuPosition(null);
  };

  const handleCopy = (e: any) => {
    console.log(e);
    onCopyClick?.(e);
  };

  const handleRender = (e: any) => {
    onRenderClick?.(e);
    closeContextMenu();
  };

  const handleRemove = (e: any) => {
    onRemoveElement?.(e);
  };

  const menuItems: MenuItem[] = [];
  if (value.from == "design") {
    menuItems.push({
      id: "copy",
      label: "Copy",
      action: handleCopy,
    });
  }
  //gn:如果是报价设计模式，则不能增加右键render功能，只能通过左侧ShapeList下的Render按钮执行
  if (value.from !== 'designForUnit'){
    if ((element instanceof GroupFrame)) menuItems.push({
        id: 'render',
        label: 'Render',
        action: handleRender
    })
  }
    
  if (
    (value.from == "quote" || value.from == "designForUnit") &&
    (element instanceof SDLHorizontal ||
      element instanceof SDLVertical ||
      element instanceof TDLVertical ||
      element instanceof TDLHorizontal)
  )
    menuItems.push({
      id: "remove",
      label: "Remove",
      action: handleRemove,
    });

  const sortElementsBySize = (elements: any[]) => {
    const dividerElements = elements.filter(
      (element) =>
        element instanceof SDLHorizontal ||
        element instanceof SDLVertical ||
        element instanceof TDLHorizontal ||
        element instanceof TDLVertical
    );

    const operationElements = elements.filter(
      (element) =>
        element instanceof BaseOperation &&
        !(
          element instanceof SDLHorizontal ||
          element instanceof SDLVertical ||
          element instanceof TDLHorizontal ||
          element instanceof TDLVertical
        )
    );

    const otherElements = elements.filter(
      (element) =>
        !(element instanceof BaseOperation) &&
        !(
          element instanceof SDLHorizontal ||
          element instanceof SDLVertical ||
          element instanceof TDLHorizontal ||
          element instanceof TDLVertical
        )
    );

    const sortedDividerElements = [...dividerElements].sort((a, b) => {
      const areaA = a.virtualFrame.width * a.virtualFrame.height;
      const areaB = b.virtualFrame.width * b.virtualFrame.height;
      return areaB - areaA;
    });

    const sortedOperationElements = [...operationElements].sort((a, b) => {
      const areaA = a.virtualFrame.width * a.virtualFrame.height;
      const areaB = b.virtualFrame.width * b.virtualFrame.height;
      return areaB - areaA;
    });

    const sortedOtherElements = [...otherElements].sort((a, b) => {
      const areaA = a.virtualFrame.width * a.virtualFrame.height;
      const areaB = b.virtualFrame.width * b.virtualFrame.height;
      return areaB - areaA;
    });

    sortedOtherElements.forEach((element, index) => {
      element.zIndex = index;
    });

    const operationBaseIndex = sortedOtherElements.length;
    sortedOperationElements.forEach((element, index) => {
      element.zIndex = operationBaseIndex + index;
    });

    const dividerBaseIndex =
      operationBaseIndex + sortedOperationElements.length;
    sortedDividerElements.forEach((element, index) => {
      element.zIndex = dividerBaseIndex + index;
    });
    return [
      ...sortedOtherElements,
      ...sortedOperationElements,
      ...sortedDividerElements,
    ];
  };

  const renderItem = () => {
    if (element instanceof GroupFrame) {
      const { x, y, width, height } = element.virtualFrame;
      return (
        <Group
          onMouseDown={(e) => handleMouseDown(e, element)}
          // onClick={() => { toggleSelection(element) }}
          draggable={isDraggable}
          dragBoundFunc={() => ({ x: value.stagePos.x, y: value.stagePos.y })}
          onDragMove={(e) => onDrag(e, element)}
          onDragEnd={handleDragEnd}
          onDragStart={onDragStart}
        >
          {sortElementsBySize(element.children).map((child, index) => {
            if (
              element.render &&
              child instanceof BaseFrame &&
              !(child instanceof GroupFrame)
            )
              return null;
            return (
              <Group
                key={`${element.id}-child-${index}`}
                zIndex={Number(child.zIndex)}
              >
                <FrameRenderer
                  element={child}
                  drag={false}
                  isGroupChild={true}
                  onDragMove={onDragMove}
                  onDragEnd={handleDragEnd}
                  onRegisterGlobalClick={onRegisterGlobalClick}
                  onChange={onChange}
                  registerPopoverSetter={registerPopoverSetter}
                  onPointMove={onPointMove}
                  onUpdateCircle={onUpdateCircle}
                  onPointMoveEnd={onPointMove}
                />
              </Group>
            );
          })}
          <Group zIndex={Number(element?.children.length) + 2}>
            <Rect
              width={width}
              height={height}
              stroke="none"
              strokeWidth={0}
              dash={[5, 5]}
              x={x}
              y={y}
            />
          </Group>
          {/*<Line*/}
          {/*    points={[x, y, x + width, y, x + width, y + height, x, y + height]}*/}
          {/*    closed*/}
          {/*    stroke={hasSelectedItem(element.id) ? '#7ba2cf' : 'red'}*/}
          {/*    strokeWidth={1 / value.scale}*/}
          {/*    dash={[5 / value.scale, 5 / value.scale]}*/}
          {/*/>*/}
        </Group>
      );
    }

    if (element instanceof TriangleWindow) {
      return (
        <TriangleFrame
          onMouseDown={(e) => handleMouseDown(e, element)}
          data={element}
          isGroupChild={isGroupChild}
          drag={drag}
          onSelect={onSelect}
          onChange={onChange}
          onPointMove={onPointMove}
          onPointMoveEnd={onPointMoveEnd}
          onLineRemove={onLineRemove}
          onUpdateCircle={() => onUpdateCircle?.({}, element)}
          onDragMove={(e) => onDragMove(e)}
          onDragEnd={(e) => handleDragEnd(e)}
        />
      );
    }

    if (
      element instanceof TopSemiCircleWindow ||
      element instanceof RightSemiCircleWindow
    ) {
      return (
        <SemiCircleFrame
          onMouseDown={(e) => handleMouseDown(e, element)}
          data={element}
          isGroupChild={isGroupChild}
          drag={drag}
          onDragMove={(e) => onDragMove(e)}
          onDragEnd={(e) => handleDragEnd(e)}
          onLineRemove={onLineRemove}
        />
      );
    }
    if (element instanceof Frame) {
      return (
        <ResizableFrame
          key={element.id}
          drag={drag}
          onMouseDown={(e: any) => handleMouseDown(e, element)}
          attrs={{ className: `frame-${element.id}` }}
          className={`frame-${element.id}`}
          onRegisterGlobalClick={onRegisterGlobalClick}
          rect={element}
          onDragMove={(e: any) => onDragMove(e)}
          onDragEnd={(e: any) => handleDragEnd(e)}
          onChange={onChange}
          registerPopoverSetter={registerPopoverSetter}
          onLineRemove={onLineRemove}
        />
      );
    }

    if (
      element instanceof HorizontalLineWindow ||
      element instanceof VerticalLineWindow
    ) {
      return (
        <LineFrame
          onMouseDown={(e) => handleMouseDown(e, element)}
          isGroupChild={isGroupChild}
          data={element}
          onLineElementCut={onLineElementCut}
          onLineRemove={onLineRemove}
          drag={drag}
          onDragMove={(e) => onDragMove(e)}
          onDragEnd={(e) => handleDragEnd(e)}
        />
      );
    }

    if (
      element instanceof AngleData ||
      element instanceof Dashed ||
      element instanceof FixedData
    ) {
      return (
        <AngleArrow
          data={element}
          isGroupChild={isGroupChild}
          drag={drag}
          onMouseDown={(e) => handleMouseDown(e, element)}
          onDragMove={(e) => onDragMove(e)}
          onDragEnd={(e) => handleDragEnd(e)}
        />
      );
    }

    if (
      element instanceof SDLHorizontal ||
      element instanceof SDLVertical ||
      element instanceof TDLHorizontal ||
      element instanceof TDLVertical
    ) {
      return (
        <DividerFrame
          data={element}
          isGroupChild={isGroupChild}
          drag={drag}
          onMouseDown={(e) => handleMouseDown(e, element)}
          onDragMove={(e) => onDragMove(e)}
          onDragEnd={(e) => handleDragEnd(e)}
        />
      );
    }

    // if (element instanceof Glasses) {
    //     return (
    //       <GlassesRenderer
    //         data={element}
    //         isGroupChild={isGroupChild}
    //         drag={drag}
    //         onMouseDown={(e) => handleMouseDown(e, element)}
    //         onDragMove={(e) => onDragMove(e)}
    //         onDragEnd={(e) => handleDragEnd(e)}
    //       />
    //     );
    // }

    if (element instanceof BaseOperation || element instanceof ArrowData) {
      return (
        <SvgOperation
          data={element}
          isGroupChild={isGroupChild}
          drag={drag}
          onMouseDown={(e) => handleMouseDown(e, element)}
          onDragMove={(e) => onDragMove(e)}
          onDragEnd={(e) => handleDragEnd(e)}
        />
      );
    }

    if (element instanceof RenderData) {
      return (
        <RenderDataRenderer
          data={element}
          isGroupChild={isGroupChild}
          drag={drag}
          onMouseDown={(e) => handleMouseDown(e, element)}
          onDragMove={(e) => onDragMove(e)}
          onDragEnd={(e) => handleDragEnd(e)}
          frameSettings={(element as any).renderSettings}
        />
      );
    }
  };
  return (
    <Group onContextMenu={handleContextMenu}>
      {!value.noRenderBase &&
        element.lines?.map((line: ILine, index: number) => {
          if (line.intersectionPoints && line.intersectionPoints.length > 0) {
            return line.intersectionPoints.map((point, pointIndex) => (
              <Circle
                key={`${element.id}-line-${index}-intersection-${pointIndex}`}
                x={point.point.x}
                y={point.point.y}
                radius={3 / value.scale}
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth={2 / value.scale}
              />
            ));
          }
          return null;
        })}
      {renderItem()}

      {contextMenuPosition && (
        <MenuPopover
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          onClose={closeContextMenu}
          menuItems={menuItems}
        />
      )}
    </Group>
  );
};
