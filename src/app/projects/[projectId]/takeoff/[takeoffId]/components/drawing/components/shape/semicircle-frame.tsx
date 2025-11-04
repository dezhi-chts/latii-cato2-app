import {Group, Path, Rect} from "react-konva";
import {useSelection} from "../../context/selectContext";
import {useSetting} from "../../context/settingContext";
import {SelectionBox} from "../select/selection-box";
import {TopSemiCircleWindow, RightSemiCircleWindow} from "../../data/shape/semicircle";
import React, {useState} from "react";
import {ILine} from "../../data/baseFrame";
import zoneUntil from "../../until/zoneUntil";
import {arcUntil} from "../../until/arcUntil";
import {LineSegment} from "../../datas";

interface SemiCircleProps {
    data: TopSemiCircleWindow | RightSemiCircleWindow;
    onClick?: (e: any) => void;
    onDragMove?: (e: any) => void;
    onDragEnd?: (e: any) => void;
    onMouseDown?: (e: any) => void;
    drag: boolean;
    isGroupChild: boolean;
    onLineRemove?: (line: any) => void;
}

export const SemiCircleFrame: React.FC<SemiCircleProps> = ({
                                                               data,
                                                               onClick,
                                                               isGroupChild,
                                                               onDragMove,
                                                               onDragEnd,
                                                               drag,
                                                               onMouseDown,
                                                               onLineRemove,
                                                           }) => {
    const {value} = useSetting();
    const {hasSelectedItem,clearSelection, toggleSelection} = useSelection();

    const handleLineRemove = (e: any, index: number) => {
        if (value.dragMode !== 'removeLine') {
            return;
        }
        e.cancelBubble = true;
        // const newLines = [...data.lines];
        // newLines[index].isCut = true;
        // data.lines = newLines;
        // data.update({});
        // data.updateFrameBasedOnCutLines()
        onLineRemove?.(data.lines[index], e);
    };

    const handleClick = (e: any) => {
        if (isGroupChild) {
            e.cancelBubble = true;
            return;
        }
        // toggleSelection(data);
        onClick?.(data);
    };

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

    if (!data) {
        return null;
    }
    const {outPath, outerArcPath} = data?.getPath();

    const getCutLines = (line: ILine) => {
        if(line.radius) {
            return zoneUntil.splitArcByIntersections(
                line, line.intersectionPoints
            )
        }else return zoneUntil.splitLineByIntersections(
            line.intersectionPoints,
            line.startPoint,
            line.endPoint
        )

    }

    const generateOuterPath = () => {
        let path = ''
        if (!data.lines[1].isCut) {
            if(data.lines[1].intersectionPoints?.length) {
                path += arcUntil.generateArcPathFromSegments(
                    data.lines[1],
                    getCutLines(data.lines[1]),
                    data.points[2],
                    data.lines[1].hiddenSegment
                );
            } else path += outerArcPath;
        }
        if (!data.lines[0].isCut) {
            if(data.lines[0].intersectionPoints?.length) {
                getCutLines(data.lines[0]).forEach(segment => {
                    if(data.lines[0].hiddenSegment?.find(s =>
                        s.startPoint.x == segment.startPoint.x && s.startPoint.y == segment.startPoint.y &&
                        s.endPoint.x == segment.endPoint.x && s.endPoint.y == segment.endPoint.y
                    )) return;
                    path += `
                        M ${segment.startPoint.x} ${segment.startPoint.y} 
                        L ${segment.endPoint.x} ${segment.endPoint.y}
                    `;
                })
            } else path +=  `
                M ${data.lines[0].startPoint.x} ${data.lines[0].startPoint.y}
                L ${data.lines[0].endPoint.x} ${data.lines[0].endPoint.y}
            `;
        }

        return path;
        // if(!data.lines[1])
        // let lineCut = lines[0].isCut
        // let arcCut = lines[1].isCut
        // if(lineCut && arcCut){
        //   return ``
        // }else if(lineCut && !arcCut){
        //   return outerArcPath
        // }else if(!lineCut && arcCut){
        //   return `M ${lines[0].startPoint.x} ${lines[0].startPoint.y} L ${lines[0].endPoint.x} ${lines[0].endPoint.y} Z`
        // }else if(!lineCut && !arcCut){
        //   return outPath
        // }
    };

    const renderArcPath = () => {
        let path = ''
        if (!data.lines[1].isCut) {
            if(data.lines[1].intersectionPoints?.length) {
                path += arcUntil.generateArcPathFromSegments(
                    data.lines[1],
                    getCutLines(data.lines[1]),
                    data.points[2],
                    data.lines[1].hiddenSegment
                );
            } else path += outerArcPath;
        }
        return  <Path
            data={path}
            onContextMenu={(e) => handleContextMenu(e, data.lines[1])}
            stroke={hasSelectedItem(data.id) ? '#7ba2cf' : data.style.color.border}
            strokeWidth={value.noRenderBase ? 0 : 2}
        />
    }

    const renderLinePath = () => {
        let path = ''
        const color = data.lines[0].weight == 1 ? 'red' : data.lines[0].weight == 2 ? 'green' : data.style.color.border;

        if (!data.lines[0].isCut) {
            if(data.lines[0].intersectionPoints?.length) {
                getCutLines(data.lines[0]).forEach(segment => {
                    if(data.lines[0].hiddenSegment?.find(s =>
                        s.startPoint.x == segment.startPoint.x && s.startPoint.y == segment.startPoint.y &&
                        s.endPoint.x == segment.endPoint.x && s.endPoint.y == segment.endPoint.y
                    )) return;
                    path += `
                        M ${segment.startPoint.x} ${segment.startPoint.y} 
                        L ${segment.endPoint.x} ${segment.endPoint.y}
                    `;
                })
            } else path +=  `
                M ${data.lines[0].startPoint.x} ${data.lines[0].startPoint.y}
                L ${data.lines[0].endPoint.x} ${data.lines[0].endPoint.y}
            `;
        }

        return  (
            <Group>
                <Path
                    data={path}
                    stroke="transparent"
                    strokeWidth={20}
                    listening={true}
                    onContextMenu={(e) => handleContextMenu(e, data.lines[0])}
                />
                <Path
                    data={path}
                    // data.lines[0].isCut ? outerArcPath : outPath
                    onContextMenu={(e) => handleContextMenu(e, data.lines[0])}
                    stroke={hasSelectedItem(data.id) ? '#7ba2cf' : color}
                    strokeWidth={value.noRenderBase ? 0 : 2}
                />
            </Group>
        )
    }

    const handleContextMenu = (e, line: ILine) => {
        clearSelection()

        e.cancelBubble = true;
        e.evt.preventDefault();

        onLineRemove(line, e, true)
    }

    const handleLineSegmentRemove = (e: any, line: ILine, segment:LineSegment, index: number) => {
        e.cancelBubble = true;
        if(!line.hiddenSegment) {
            line.hiddenSegment = []
        }
        if(!line.hiddenSegment?.find(s =>
            s.startPoint.x == segment.startPoint.x && s.startPoint.y == segment.startPoint.y &&
            s.endPoint.x == segment.endPoint.x && s.endPoint.y == segment.endPoint.y
        )) line.hiddenSegment.push(JSON.parse(JSON.stringify(segment)))

        // if(line.hiddenSegment?.length >= getCutLines(line).length) {
        //     line.isCut = true;
        // }
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
                data={outPath}
                fill={data.style.color.fill}
                stroke="none"
                strokeWidth={0}
            />
            {/*<Path*/}
            {/*    data={*/}
            {/*        generateOuterPath()*/}
            {/*    }*/}
            {/*    // data.lines[0].isCut ? outerArcPath : outPath*/}
            {/*    stroke={hasSelectedItem(data.id) ? '#7ba2cf' : data.style.color.border}*/}
            {/*    strokeWidth={2}*/}
            {/*/>*/}
            { renderArcPath() }
            { renderLinePath() }
            {
                value.dragMode === 'removeLine' && data.lines && data.lines.map((line, i) => {
                    if(i == 0 && !line.isCut) {
                        if(line.intersectionPoints && line.intersectionPoints.length) {
                            return getCutLines(line).map((segment, index) => {
                                if(line.hiddenSegment?.find(s =>
                                    s.startPoint.x == segment.startPoint.x && s.startPoint.y == segment.startPoint.y &&
                                    s.endPoint.x == segment.endPoint.x && s.endPoint.y == segment.endPoint.y
                                )) return null;
                                return (
                                    <Path
                                        key={line.id + '-' + index}
                                        onClick={(e) => handleLineSegmentRemove(e,line, segment, index)}
                                        data={` M ${segment.startPoint.x} ${segment.startPoint.y} L ${segment.endPoint.x} ${segment.endPoint.y} `}
                                        stroke="#ff000033"
                                        strokeWidth={10}
                                    ></Path>
                                )
                            })
                        }else return <Path
                            key={line.id}
                            onClick={(e) => handleLineRemove(e, 0)}
                            data={`M ${data.lines[0].startPoint.x} ${data.lines[0].startPoint.y} L ${data.lines[0].endPoint.x} ${data.lines[0].endPoint.y} Z`}
                            fill="#ff000033"
                            stroke="#ff000033"
                            strokeWidth={10 / value.scale}
                        ></Path>
                    }
                    if(i == 1 && !line.isCut) {
                        if(line.intersectionPoints && line.intersectionPoints.length) {
                            const { startPoint, endPoint } = line;
                            const arc = arcUntil.calculateArc(
                                startPoint.x,
                                startPoint.y,
                                data.points[2].x,
                                data.points[2].y,
                                endPoint.x,
                                endPoint.y
                            );

                            if (!arc) {
                                return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
                            }

                            let sweep = ((endPoint.x - startPoint.x) * (data.points[2].y - startPoint.y) -
                                (endPoint.y - startPoint.y) * (data.points[2].x - startPoint.x)) > 0 ? 1 : 0;

                            return getCutLines(line).map((segment, index) => {
                                if(line.hiddenSegment?.find(s =>
                                    s.startPoint.x == segment.startPoint.x && s.startPoint.y == segment.startPoint.y &&
                                    s.endPoint.x == segment.endPoint.x && s.endPoint.y == segment.endPoint.y
                                )) return null;

                                return (
                                    <Path
                                        key={line.id + '-' + index}
                                        onClick={(e) => handleLineSegmentRemove(e,line, segment, index)}
                                        data={arcUntil.generateArcSegmentPath(
                                                segment.startPoint,
                                                segment.endPoint,
                                                arc,
                                                sweep
                                        )}
                                        stroke="#ff000033"
                                        strokeWidth={10}
                                    ></Path>
                                )
                            })
                        }
                        else
                            return <Path
                            key={line.id}
                            onClick={(e) => handleLineRemove(e, 1)}
                            data={outerArcPath}
                            stroke="#ff000033"
                            strokeWidth={10}
                        ></Path>

                    }
                })
            }

            {/*{*/}
            {/*    // value.dragMode === 'removeLine' && data.lines[0] && !data.lines[0].isCut && ({*/}
            {/*    //     data.lines[0].intersectionPoints && data.lines[0].intersectionPoints.length ?*/}
            {/*    //*/}
            {/*    //     :*/}
            {/*    //*/}
            {/*    // })*/}


                {/*// (*/}
                {/**/}
                {/*// )*/}
            {/*}*/}

            {/*{*/}
            {/*    value.dragMode === 'removeLine' && data.lines[1] && !data.lines[1].isCut*/}
            {/*    && (*/}
            {/*        <Path*/}
            {/*            onClick={(e) => handleLineRemove(e, 1)}*/}
            {/*            data={outerArcPath}*/}
            {/*            // fill="#ff000033"*/}
            {/*            stroke="#ff000033"*/}
            {/*            strokeWidth={10 / value.scale}*/}
            {/*        />*/}
                {/*)*/}
            {/*}*/}

        </Group>
    );
}; 