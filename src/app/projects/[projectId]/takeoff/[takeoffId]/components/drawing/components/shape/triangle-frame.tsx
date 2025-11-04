import {Circle, Group, Line, Path, Rect, Text} from "react-konva";
import {TriangleWindow} from "../../data/shape/triangle";
import React, {useEffect, useState} from "react";
import {useSetting} from "../../context/settingContext";
import {useSelection} from "../../context/selectContext";
import {SelectionBox} from "../select/selection-box";
import triangleUntil from "../../until/triangleUntil";
import lineUntil from "../../until/lineUntil";
import next from "next-auth/src";
import zoneUntil from "../../until/zoneUntil";
import {ILine} from "../../data/baseFrame";
import {LineSegment} from "../../datas";

interface TriangleWindowProps {
    data: TriangleWindow;
    drag: boolean;
    isGroupChild: boolean;
    isSelected?: boolean;
    onClick?: (e: any) => void;
    onDragMove?: (e: any) => void;
    onDragEnd?: (e: any) => void;
    onMouseDown?: (e: any) => void;
    onChange?: (e: any) => void;
    onLineRemove?: (line: any) => void;
    onSelect?: (e: any) => void;
    onPointMove?: (e: any, index: number) => void;
    onPointMoveEnd?: (e: any, index: number) => void;
    onUpdateCircle?: (e: any) => void;
}

export const TriangleFrame: React.FC<TriangleWindowProps> = ({
                                                                 data,
                                                                 onClick,
                                                                 onDragMove,
                                                                 onDragEnd,
                                                                 drag,
                                                                 isGroupChild,
                                                                 onMouseDown,
                                                                 onChange, onSelect,
                                                                 onLineRemove,
                                                                 onPointMove,
                                                                 onPointMoveEnd,
                                                                 onUpdateCircle,
                                                             }) => {
    const {value} = useSetting();
    const {hasSelectedItem,clearSelection, toggleSelection} = useSelection();
    const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

    const handleClick = (e: any) => {
        if (isGroupChild) {
            e.cancelBubble = true;
            return;
        }
        // toggleSelection(data);
        // onSelect?.({})
        onClick && onClick(data);
    };

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

    const handleLineRemove = (e: any, index: number) => {
        if (value.dragMode !== 'removeLine') return;
        e.cancelBubble = true;
        // const newLines = [...data.lines];
        // newLines[index].isCut = true;
        // data.lines = newLines;
        // data.update({});
        // data.updateFrameBasedOnCutLines()
        onLineRemove?.(data.lines[index], e);
    };

    const handleLineSegmentRemove = (e: any, line: ILine, segment: LineSegment, index: number) => {
        e.cancelBubble = true;
        if (!line.hiddenSegment) {
            line.hiddenSegment = []
        }
        if (!line.hiddenSegment?.find(s =>
            s.startPoint.x == segment.startPoint.x && s.startPoint.y == segment.startPoint.y &&
            s.endPoint.x == segment.endPoint.x && s.endPoint.y == segment.endPoint.y
        )) line.hiddenSegment.push(segment)
        // if(line.hiddenSegment?.length >= getCutLines(line).length) {
        //     line.isCut = true;
        // }
    }

    const isDraggable = drag && !isGroupChild && value.dragMode !== 'removeLine';

    const handlePointMove = (e: any, index: number) => {
        e.cancelBubble = true;

        const stage = e.target.getStage();
        const pointerPos = stage.getPointerPosition();

        const actualX = (pointerPos.x - value.stagePos.x) / value.scale;
        const actualY = (pointerPos.y - value.stagePos.y) / value.scale;

        data.updateSingleVertex(index, {
            x: actualX,
            y: actualY
        });
        onChange?.(e);
        onMouseDown?.(e)
        onPointMove?.(e, index)
    };

    const handlePointMoveEnd = (e: any, index: number) => {
        onPointMoveEnd?.(e, index);
        onUpdateCircle?.(e)
    }

    const getCutLines = (line: ILine) => {

        let semts = zoneUntil.splitLineByIntersections(
            line.intersectionPoints,
            line.startPoint,
            line.endPoint
        )
        return semts
    }

    const renderControlPoints = () => {
        if (!hasSelectedItem(data.id)) return null;

        return (
            <Group>
                {data.points.map((point, index) => (
                    <Circle
                        key={`${data.id}-control-${index}`}
                        x={point.x}
                        y={point.y}
                        radius={4}
                        fill="#fff"
                        stroke="#00F"
                        strokeWidth={1}
                        draggable
                        onDragMove={(e) => handlePointMove(e, index)}
                        onDragEnd={(e) => handlePointMoveEnd(e, index)}
                        dragBoundFunc={(pos) => ({
                            x: point.x * value.scale + value.stagePos.x,
                            y: point.y * value.scale + value.stagePos.y
                        })}
                        onMouseDown={onMouseDown}
                    />
                ))}
            </Group>
        );
    };

    const renderAngleLabels = () => {
        if (!hasSelectedItem(data.id)) return null;

        return (
            <Group>
                {data.points.map((point, index) => {

                    const prev = data.points[(index + 2) % 3];
                    const next = data.points[(index + 1) % 3];

                    const vector1 = {
                        x: prev.x - point.x,
                        y: prev.y - point.y
                    };
                    const vector2 = {
                        x: next.x - point.x,
                        y: next.y - point.y
                    };

                    const length1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
                    const length2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

                    const unit1 = {
                        x: vector1.x / length1,
                        y: vector1.y / length1
                    };
                    const unit2 = {
                        x: vector2.x / length2,
                        y: vector2.y / length2
                    };

                    const bisector = {
                        x: (unit1.x + unit2.x) / 2,
                        y: (unit1.y + unit2.y) / 2
                    };

                    const bisectorLength = Math.sqrt(bisector.x * bisector.x + bisector.y * bisector.y);
                    const normalizedBisector = {
                        x: bisector.x / bisectorLength,
                        y: bisector.y / bisectorLength
                    };

                    const labelOffset = 20 / value.scale;
                    const labelPosition = {
                        x: point.x - normalizedBisector.x * labelOffset,
                        y: point.y - normalizedBisector.y * labelOffset
                    };

                    return (
                        <Group key={`angle-label-${index}`}>
                            <Text
                                x={labelPosition.x}
                                y={labelPosition.y}
                                text={`A${index+1} ${data.angles[index]}°`}
                                fontSize={12}
                                fill="#000"
                                align="center"
                                verticalAlign="middle"
                                offsetX={12 / value.scale}
                                offsetY={6 / value.scale}
                            />
                        </Group>
                    );
                })}
            </Group>
        );
    };
    const generateOuterPath = () => {
        return data.lines.map((line, index) => {
            if (line.isCut) return '';
            const nextIndex = (index + 1) % 3;
            if (line.intersectionPoints?.length) {
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
                M ${data.points[index].x} ${data.points[index].y}
                L ${data.points[nextIndex].x} ${data.points[nextIndex].y}
            `;

        }).filter(path => path).join(' ');
    };

    const renderPath = () => {

        return data.lines.map((line, index) => {
            if (line.isCut) return '';
            const nextIndex = (index + 1) % 3;
            let path = ``
            const color = line.weight == 1 ? 'red' : line.weight == 2 ? 'green' : data.style.color.border;
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
                M ${data.points[index].x} ${data.points[index].y}
                L ${data.points[nextIndex].x} ${data.points[nextIndex].y}
            `;
            return (
                <Group
                    key={`${line}-${index}`}
                >
                    <Path
                        data={path}
                        stroke="transparent"
                        strokeWidth={20}
                        listening={true}
                        onContextMenu={(e) => handleContextMenu(e, line)}
                    />
                    <Path
                        onContextMenu={(e) => handleContextMenu(e, line)}
                        data={path}
                        fill="transparent"
                        stroke={hasSelectedItem(data.id) ? '#7ba2cf' : color}
                        strokeWidth={value.noRenderBase ? 0 : 2}
                    />
                </Group>
            )
        })
    }

    const handleContextMenu = (e:any, line: ILine) => {
        clearSelection()

        e.cancelBubble = true;
        e.evt.preventDefault();

        onLineRemove?.(line, e, true)
    }

    const generateFillPath = () => {
        let path = `M ${data.points[0].x} ${data.points[0].y}`;
        data.points.forEach((point, index) => {
            const nextIndex = (index + 1) % 3;
            path += `L ${data.points[nextIndex].x} ${data.points[nextIndex].y}`;
        })
        path += ' Z'
        return path;
    }


    return (
        <Group
            onMouseDown={(e) => {
                if(e.evt.button == 2) {
                    e.cancelBubble = true;
                    return;
                }
                onMouseDown?.(e)
            }}
            onClick={handleClick}
            draggable={isDraggable}
            dragBoundFunc={() => ({x: value.stagePos.x, y: value.stagePos.y})}
            onDragMove={onDrag}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
        >
            <Path
                data={`
                ${generateFillPath()}
              `}
                fill={data.style.color.fill}
                stroke="none"
                strokeWidth={0}
            />

            {/*<Path*/}
            {/*  data={`*/}
            {/*    ${generateOuterPath()}*/}
            {/*  `}*/}
            {/*  fill="transparent"*/}
            {/*  stroke={hasSelectedItem(data.id) ? '#7ba2cf' : data.style.color.border}*/}
            {/*  strokeWidth={2}*/}
            {/*/>*/}
            { renderPath() }

            {renderControlPoints()}
            {renderAngleLabels()}
            {/* removeLine 模式下的高亮区域 */}
            {value.dragMode === 'removeLine' && data.lines.map((line, index) => {
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
                } else {
                    return (
                        <Path
                            key={`remove-line-${index}`}
                            onClick={(e) => handleLineRemove(e, index)}
                            data={` M ${line.startPoint.x} ${line.startPoint.y} L ${line.endPoint.x} ${line.endPoint.y} `}
                            stroke="#ff000033"
                            strokeWidth={10}
                        />
                    );
                }
            })}
        </Group>
    );
};
