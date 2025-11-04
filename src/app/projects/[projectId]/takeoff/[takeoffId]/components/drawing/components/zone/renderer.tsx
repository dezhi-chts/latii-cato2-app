'use client';

import React from 'react';
import {Group, Line, Path, Rect} from 'react-konva';
import { RenderData } from '../../data/render/renderData';
import { useSetting } from '../../context/settingContext';
import { useSelection } from '../../context/selectContext';
import {arcUntil} from "../../until/arcUntil";

interface RenderDataRendererProps {
    data: RenderData;
    isGroupChild?: boolean;
    drag?: boolean;
    onMouseDown?: (e: any) => void;
    onDragMove?: (e: any) => void;
    onDragEnd?: (e: any) => void;
    frameSettings?: {
        frameBorder: number;
        frameColor: string;
        casementBorder: number;
        casementColor: string;
    };
}

export const RenderDataRenderer: React.FC<RenderDataRendererProps> = ({
                                                                          data,
                                                                          isGroupChild = false,
                                                                          drag = true,
                                                                          onMouseDown,
                                                                          onDragMove,
                                                                          onDragEnd,
                                                                      }) => {
    const { value } = useSetting();
    const { hasSelectedItem } = useSelection();

    const flatPoints = data.points.flatMap(point => [point.x, point.y]);

    const generateCompletePath = () => {
        if (!data.points || data.points.length === 0) return '';

        let pathData = `M ${data.lines[0].start.x} ${data.lines[0].start.y}`;

        // 遍历所有线段
        data.lines?.forEach((line, index) => {
            if (line.isArc) {
                // 生成弧线路径
                let sweep = line.is_clockwise  ? 0 : 1
                if((line.start.x - line.end.x) > 0.1 || (line.start.y - line.end.y) > 0.1) {
                    sweep = sweep == 0 ? 1: 0
                }
                const arcPath = arcUntil.generateArcSegmentPath(
                    line.start,
                    line.end,
                    { r: line.radius },
                    sweep
                    // line.is_clockwise ? 0 : 1
                    // line.start.x == line.end.x ? (line.is_clockwise ? 1 : 0) : (line.is_clockwise ? 0 : 1),
                );
                pathData += ' ' + arcPath.replace(/^M\s*[\d.-]+\s+[\d.-]+\s*/, '');
            } else {
                // 直线路径
                pathData += ` L ${line.end.x} ${line.end.y}`;
            }
        });

        // 闭合路径
        pathData += ' Z';
        return pathData;
    };

    return (
        <Group
            // draggable={false}
            // onMouseDown={onMouseDown}
            // onDragMove={onDragMove}
            // onDragEnd={onDragEnd}
            // dragBoundFunc={() => ({ x: value.stagePos.x, y: value.stagePos.y })}
        >
            {/*color*/}
            <Path
                data={generateCompletePath()}
                fill={data.style.color.fill}
                // stroke={frameSettings.frameColor || '#333'}
                // strokeWidth={frameSettings.frameBorder / value.sizeMultiples}
            />

            {data.lines && data.lines.map((line, index) => {
                if(line.isArc) {
                    // console.log(line.id, line.start.x == line.end.x, line.is_clockwise, '??????????????????');
                    // if(line.start.x > line.end.x || line.start.y > line.end.y) {
                    //     const temp = line.end;
                    //     line.end = line.start;
                    //     line.start = temp;
                    // }

                    let sweep = line.is_clockwise  ? 0 : 1
                    if((line.start.x - line.end.x) > 0.1 || (line.start.y - line.end.y) > 0.1) {
                        sweep = sweep == 0 ? 1: 0
                    }
                    const path = arcUntil.generateArcSegmentPath(
                        line.start,
                        line.end,
                        { r: line.radius },
                        sweep
                        // line.is_clockwise ? 0 : 1
                        // line.start.x == line.end.x ? (line.is_clockwise ? 1 : 0) : (line.is_clockwise ? 0 : 1),
                    );
                    return (
                        <Path
                            key={`line-${index}`}
                            data={path}
                            stroke={data.style.color.border}
                            strokeWidth={1}
                        />
                    )
                }
                return (
                    <Line
                        key={`line-${index}`}
                        points={[
                            line.start.x, line.start.y,
                            line.end.x, line.end.y
                        ]}
                        stroke={data.style.color.border}
                        strokeWidth={1}
                    />
                );
                // return null;
            })}
        </Group>
    );
};