import React, {useEffect, useState} from "react";
import {Circle, Group, Path, Rect, Text} from "react-konva";
import {useSelection} from "../../context/selectContext";
import {useSetting} from "../../context/settingContext";
import {SelectionBox} from "../select/selection-box";
import {Frame} from "../../data/shape/frame";
import lineUntil from "../../until/lineUntil";
import {ILine} from "../../data/baseFrame";
import zoneUntil from "../../until/zoneUntil";
import {LineSegment} from "../../datas";

export interface IResizableFrame {
    x: number;
    y: number;
    id?: string;
    width: number;
    height: number;
    children?: Array<any>;
    registerPopoverSetter?: any;
    drag: boolean;
    isGroupChild: boolean;
    // [key: string]: any;
}

const ResizableFrame = ({
                            registerPopoverSetter,
                            rect,
                            onRegisterGlobalClick,
                            onDragEnd,
                            onDragMove,
                            drag,
                            isGroupChild,
                            onMouseDown,
                            onLineRemove,
                        }: { rect: Frame, [key: string]: any }) => {

    useEffect(() => {
        if (registerPopoverSetter) {
            return registerPopoverSetter(setPopoverInfo);
        }
    }, [registerPopoverSetter]);

    const {value,} = useSetting();

    const {hasSelectedItem, clearSelection, toggleSelection} = useSelection();

    const [popoverInfo, setPopoverInfo] = useState<{
        x: number;
        y: number;
        lineIndex: number;
        type: any;
    } | null>(null);

    useEffect(() => {
        if (popoverInfo) {
            onRegisterGlobalClick(() => {
                setPopoverInfo(null);
                // setMergePopoverInfo(null);
            });
        }
    }, [popoverInfo]);

    const onFrameClick = (e: any) => {
        if (isGroupChild) {
            e.cancelBubble = true;
            return;
        }
        // toggleSelection(rect);
    };

    const [lastPos, setLastPos] = useState<{ x: number; y: number } | any>(null);

    const onDrag = (e: any) => {
        e.cancelBubble = true;

        const stage = e.target.getStage();
        const {x: pointerX, y: pointerY} = stage.getPointerPosition();

        const currentX = (pointerX - value.stagePos.x) / value.scale;
        const currentY = (pointerY - value.stagePos.y) / value.scale;

        let dx = currentX - lastPos.x;
        let dy = currentY - lastPos.y;

        const newX = rect.virtualFrame.x + dx;
        const newY = rect.virtualFrame.y + dy;
        if (newX < 0) dx = 0;
        if (newY < 0) dy = 0;

        setLastPos({
            x: currentX,
            y: currentY,
        });

        rect.move(dx, dy);
        onDragMove({dx, dy});
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

    const generateOuterPath = () => {
        return rect.lines.map((line, index) => {
            if (line.isCut) return '';
            const nextIndex = (index + 1) % 4;

            if (line.intersectionPoints) {
                let path = ``
                getCutLines(line).forEach(segment => {
                    if (line.hiddenSegment?.find(s =>
                        s.startPoint.x == segment.startPoint.x && s.startPoint.y == segment.startPoint.y &&
                        s.endPoint.x == segment.endPoint.x && s.endPoint.y == segment.endPoint.y
                    )) return;
                    path += `
              M ${segment.startPoint.x} ${segment.startPoint.y} 
              L ${segment.endPoint.x} ${segment.endPoint.y}
          `;
                })
                return path;
            }

            return `
        M ${rect.points[index].x} ${rect.points[index].y}
        L ${rect.points[nextIndex].x} ${rect.points[nextIndex].y}
      `;
        }).filter(path => path).join(' ');
    };

    const renderPath = () => {

        return rect.lines.map((line, index) => {
            if (line.isCut) return '';
            const nextIndex = (index + 1) % 4;
            let path = ``
            const color = line.weight == 1 ? 'red' : line.weight == 2 ? 'green' : rect.style.color.border;
            if (line.intersectionPoints) {
                getCutLines(line).forEach(segment => {
                    if (line.hiddenSegment?.find(s =>
                        s.startPoint.x == segment.startPoint.x && s.startPoint.y == segment.startPoint.y &&
                        s.endPoint.x == segment.endPoint.x && s.endPoint.y == segment.endPoint.y
                    )) return;
                    path += `
              M ${segment.startPoint.x} ${segment.startPoint.y} 
              L ${segment.endPoint.x} ${segment.endPoint.y}
          `;
                })
            } else path = `
        M ${rect.points[index].x} ${rect.points[index].y}
        L ${rect.points[nextIndex].x} ${rect.points[nextIndex].y}
      `;
            return (
                <Group key={line.id + index}>
                    <Path
                        data={path}
                        stroke="transparent"
                        strokeWidth={20}
                        listening={true}
                        onContextMenu={(e) => handleContextMenu(e, line)}
                    />
                    <Path
                        data={path}
                        fill='transparent'
                        onContextMenu={(e) => handleContextMenu(e, line)}
                        stroke={hasSelectedItem(rect.id) ? '#7ba2cf' : color}
                        strokeWidth={value.noRenderBase ? 0 : 2}
                    />
                </Group>

            )
        })
    }

    const handleContextMenu = (e, line: ILine) => {
        clearSelection()
        e.cancelBubble = true;
        e.evt.preventDefault();

        onLineRemove(line, e, true)
    }

    const handleLineRemove = (e: any, line: any, index: number) => {
        if (value.dragMode !== 'removeLine') {
            return;
        }
        e.cancelBubble = true;
        // const newLines = [...rect.lines];
        // newLines[index].isCut = true;
        // rect.lines = newLines;
        // rect.update({});
        // rect.updateFrameBasedOnCutLines()
        onLineRemove?.(line, e);
    };

    const getCutLines = (line: ILine) => {

        let semts = zoneUntil.splitLineByIntersections(
            line.intersectionPoints,
            line.startPoint,
            line.endPoint
        )
        return semts
    }

    const handleLineSegmentRemove = (e: any, line: ILine, segment: LineSegment, index: number) => {
        e.cancelBubble = true;
        if (!line.hiddenSegment) {
            line.hiddenSegment = []
        }
        if (!line.hiddenSegment?.find(s =>
            s.startPoint.x == segment.startPoint.x && s.startPoint.y == segment.startPoint.y &&
            s.endPoint.x == segment.endPoint.x && s.endPoint.y == segment.endPoint.y
        )) line.hiddenSegment.push(segment)

        onDragEnd()
        // if(line.hiddenSegment?.length >= getCutLines(line).length) {
        //   line.isCut = true;
        //   line.hiddenSegment = []
        // }
    }

    const calculateRemoveLinePath = (index: number) => {
        return `
      M ${rect.points[index].x} ${rect.points[index].y}
      L ${rect.points[(index + 1) % 4].x} ${rect.points[(index + 1) % 4].y}
      Z
    `;
    };

    return (
        <Group
            onClick={onFrameClick}
            onMouseDown={(e) => {
                if (e.evt.button == 2) {
                    e.cancelBubble = true;
                    return;
                }
                onMouseDown?.(e)
            }}
            draggable={isDraggable}
            dragBoundFunc={() => ({x: value.stagePos.x, y: value.stagePos.y})}
            onDragMove={onDrag}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
        >
            <Rect
                width={rect.virtualFrame.width}
                height={rect.virtualFrame.height}
                fill={rect.style.color.fill}
                stroke="none"
                strokeWidth={0}
                x={rect.virtualFrame.x}
                y={rect.virtualFrame.y}
            />
            {/*<Path*/}
            {/*  data={generateOuterPath()}*/}
            {/*  fill='transparent'*/}
            {/*  stroke={hasSelectedItem(rect.id) ? '#7ba2cf' : rect.style.color.border}*/}
            {/*  strokeWidth={2}*/}
            {/*/>*/}
            {renderPath()}

            {/* removeLine 模式下的高亮区域 */}
            {value.dragMode === 'removeLine' && rect.lines.map((line, index) => {
                if (line.isCut) return null;
                if (line.intersectionPoints && line.intersectionPoints.length) {
                    return getCutLines(line).map((segment, index) => {
                        if (line.hiddenSegment?.find(s =>
                            s.startPoint.x == segment.startPoint.x && s.startPoint.y == segment.startPoint.y &&
                            s.endPoint.x == segment.endPoint.x && s.endPoint.y == segment.endPoint.y
                        )) return null;
                        return (
                            <Path
                                key={line.id + '-' + index}
                                onClick={(e) => handleLineSegmentRemove(e, line, segment, index)}
                                data={` M ${segment.startPoint.x} ${segment.startPoint.y} L ${segment.endPoint.x} ${segment.endPoint.y} `}
                                stroke="#ff000033"
                                strokeWidth={10}
                            ></Path>
                        )
                    })
                }
                return (
                    <Path
                        onClick={(e) => handleLineRemove(e, line, index)}
                        key={`line-${index}`}
                        data={calculateRemoveLinePath(index)}
                        // fill="#ff000033"
                        stroke="#ff000033"
                        strokeWidth={10 / value.scale}
                    />
                );
            })}
        </Group>
    );
};

export default ResizableFrame;
