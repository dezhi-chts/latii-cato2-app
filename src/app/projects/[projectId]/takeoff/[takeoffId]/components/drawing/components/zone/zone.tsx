'use client';

import React, { useMemo } from 'react';
import {Group, Line, Path, Shape, Text} from 'react-konva';
import {IPointPostion, IZone} from '../../datas';
import {useSetting} from "../../context/settingContext";
import {arcUntil} from "../../until/arcUntil";
import zoneUntil from "../../until/zoneUntil";

interface ISashConfig {
  type: 'parallel' | 'overlap-left' | 'overlap-right';
  ratio: number;
}

interface SashPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  points: IPointPostion[];
  segments: Array<{
    start: IPointPostion;
    end: IPointPostion;
    isArc?: boolean;
    center?: IPointPostion;
    radius?: number;
  }>;
}

interface ZoneProps {
    zone: IZone
    index: number;
    elements?: any[];
}

export const Zone: React.FC<ZoneProps> = ({ zone, index, elements }) => {
    const { value } = useSetting();

    const { centerX, centerY } = useMemo(() => {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        zone.segments?.forEach(segment => {
            [segment.start, segment.end].forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            });

            if (segment.isArc && segment.center && segment.radius) {
                const startAngle = Math.atan2(
                    segment.start.y - segment.center.y,
                    segment.start.x - segment.center.x
                );
                const endAngle = Math.atan2(
                    segment.end.y - segment.center.y,
                    segment.end.x - segment.center.x
                );

                let angle = endAngle - startAngle;
                if (angle < 0) angle += 2 * Math.PI;

                const angles = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];
                angles.forEach(testAngle => {
                    // 检查这个角度是否在圆弧范围内
                    let normalizedTestAngle = testAngle - startAngle;
                    if (normalizedTestAngle < 0) normalizedTestAngle += 2 * Math.PI;

                    if (normalizedTestAngle <= angle) {
                        const pointX = segment.center.x + segment.radius * Math.cos(testAngle);
                        const pointY = segment.center.y + segment.radius * Math.sin(testAngle);

                        minX = Math.min(minX, pointX);
                        maxX = Math.max(maxX, pointX);
                        minY = Math.min(minY, pointY);
                        maxY = Math.max(maxY, pointY);
                    }
                });
            }
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const isPointInPath = (x: number, y: number): boolean => {
            let inside = false;
            const pathData = [...zone.segments];

            for (let i = 0, j = pathData.length - 1; i < pathData.length; j = i++) {
                const segment = pathData[i];
                const prevSegment = pathData[j];

                if (segment.isArc && segment.center && segment.radius) {
                    // 对于圆弧，使用更复杂的点包含检测
                    const dx = x - segment.center.x;
                    const dy = y - segment.center.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (Math.abs(distance - segment.radius) < 0.001) {
                        inside = true;
                        break;
                    }
                } else {
                    // 对于直线段，使用射线法
                    const xi = segment.start.x;
                    const yi = segment.start.y;
                    const xj = segment.end.x;
                    const yj = segment.end.y;

                    if (((yi > y) !== (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                        inside = !inside;
                    }
                }
            }

            return inside;
        };

        // 如果计算出的中心点不在区域内，尝试调整
        if (!isPointInPath(centerX, centerY)) {
            // 在包围盒内采样多个点，找到一个在区域内的点
            const GRID_SIZE = 5;
            const stepX = (maxX - minX) / GRID_SIZE;
            const stepY = (maxY - minY) / GRID_SIZE;

            for (let i = 1; i < GRID_SIZE; i++) {
                for (let j = 1; j < GRID_SIZE; j++) {
                    const testX = minX + stepX * i;
                    const testY = minY + stepY * j;
                    if (isPointInPath(testX, testY)) {
                        return { centerX: testX, centerY: testY };
                    }
                }
            }
        }

        return { centerX, centerY };
    }, [zone.segments]);

    // const pathData = useMemo(() => {
    //     const segments = [...zone.segments];
    //     const orderedSegments = [];
    //     let currentSegment = segments[0];
    //     let currentPoint = currentSegment.end;
    //
    //     let renderSegment = {
    //         ...currentSegment,
    //         renderStart: currentSegment.start,
    //         renderEnd: currentSegment.end
    //     };
    //
    //     if (Math.abs(currentSegment.start.x - segments[1]?.start.x) < 0.001
    //         && Math.abs(currentSegment.start.y - segments[1]?.start.y) < 0.001
    //         || Math.abs(currentSegment.start.x - segments[1]?.end.x) < 0.001
    //         && Math.abs(currentSegment.start.y - segments[1]?.end.y) < 0.001) {
    //         currentPoint = currentSegment.start;
    //         renderSegment = {
    //             ...currentSegment,
    //             renderStart: currentSegment.end,
    //             renderEnd: currentSegment.start
    //         };
    //     }
    //
    //     orderedSegments.push(renderSegment);
    //     segments.splice(0, 1);
    //
    //     while (segments.length > 0) {
    //         const nextSegmentIndex = segments.findIndex(seg => {
    //             const startMatches = Math.abs(seg.start.x - currentPoint.x) < 0.001
    //                 && Math.abs(seg.start.y - currentPoint.y) < 0.001;
    //             const endMatches = Math.abs(seg.end.x - currentPoint.x) < 0.001
    //                 && Math.abs(seg.end.y - currentPoint.y) < 0.001;
    //             return startMatches || endMatches;
    //         });
    //
    //         if (nextSegmentIndex === -1) break;
    //
    //         currentSegment = segments[nextSegmentIndex];
    //         segments.splice(nextSegmentIndex, 1);
    //
    //         const connectToStart = Math.abs(currentSegment.start.x - currentPoint.x) < 0.001
    //             && Math.abs(currentSegment.start.y - currentPoint.y) < 0.001;
    //
    //         renderSegment = {
    //             ...currentSegment,
    //             renderStart: connectToStart ? currentSegment.start : currentSegment.end,
    //             renderEnd: connectToStart ? currentSegment.end : currentSegment.start
    //         };
    //
    //         currentPoint = renderSegment.renderEnd;
    //
    //         orderedSegments.push(renderSegment);
    //     }
    //
    //     return orderedSegments;
    // }, [zone.segments]);

    // const renderSashDividers = (sash: SashPosition) => {
    //     if (sash.type !== 'overlap-left' && sash.type !== 'overlap-right') {
    //         return null;
    //     }
    //
    //     const leftX = sash.x;
    //     const rightX = sash.x + sash.width;
    //     const centerX = (leftX + rightX) / 2;
    //
    //     return (
    //         <Line
    //             points={[centerX, sash.y, centerX, sash.y + sash.height]}
    //             stroke="#333"
    //             strokeWidth={1}
    //             dash={sash.type === 'overlap-left' ? [5, 2] : undefined}
    //         />
    //     );
    // };

    // const renderSash = (sash: SashPosition, index: number) => {
    //     return (
    //         <Group key={`sash-${index}`}>
    //             <Shape
    //                 sceneFunc={(context, shape) => {
    //                     context.beginPath();
    //                     const segments = sash.segments;
    //
    //                     if (segments.length > 0) {
    //                         context.moveTo(segments[0].start.x, segments[0].start.y);
    //
    //                         segments.forEach(segment => {
    //                             if (segment.isArc && segment.center && segment.radius) {
    //                                 const startAngle = Math.atan2(
    //                                     segment.start.y - segment.center.y,
    //                                     segment.start.x - segment.center.x
    //                                 );
    //                                 const endAngle = Math.atan2(
    //                                     segment.end.y - segment.center.y,
    //                                     segment.end.x - segment.center.x
    //                                 );
    //
    //                                 let angle = endAngle - startAngle;
    //                                 if (angle < 0) angle += 2 * Math.PI;
    //
    //                                 context.arc(
    //                                     segment.center.x,
    //                                     segment.center.y,
    //                                     segment.radius,
    //                                     startAngle,
    //                                     endAngle,
    //                                     false
    //                                 );
    //                             } else {
    //                                 // 绘制直线
    //                                 context.lineTo(segment.end.x, segment.end.y);
    //                             }
    //                         });
    //                     }
    //
    //                     context.closePath();
    //                     context.fillStrokeShape(shape);
    //                 }}
    //                 fill={zone.color}
    //                 stroke="#333"
    //                 strokeWidth={1}
    //             />
    //
    //             {/*{renderSashDividers(sash)}*/}
    //
    //             <Text
    //                 x={sash.x + sash.width / 2}
    //                 y={sash.y + sash.height / 2}
    //                 text={sash.type.includes('parallel') ? 'P' : (sash.type.includes('left') ? 'L' : 'R')}
    //                 fontSize={12}
    //                 fontStyle="bold"
    //                 fill="#555"
    //                 align="center"
    //                 verticalAlign="middle"
    //             />
    //         </Group>
    //     );
    // };

    // const generateCompletePath = () => {
    //     if (!zone.points || zone.points.length === 0) return '';
    //
    //     let pathData = `M ${zone.points[0].x} ${data.points[0].y}`;
    //
    //     // 遍历所有线段
    //     data.lines?.forEach((line, index) => {
    //         if (line.isArc) {
    //             // 生成弧线路径
    //             let sweep = line.is_clockwise  ? 0 : 1
    //             if((line.start.x - line.end.x) > 0.1 || (line.start.y - line.end.y) > 0.1) {
    //                 sweep = sweep == 0 ? 1: 0
    //             }
    //             const arcPath = arcUntil.generateArcSegmentPath(
    //                 line.start,
    //                 line.end,
    //                 { r: line.radius },
    //                 sweep
    //                 // line.is_clockwise ? 0 : 1
    //                 // line.start.x == line.end.x ? (line.is_clockwise ? 1 : 0) : (line.is_clockwise ? 0 : 1),
    //             );
    //             pathData += ' ' + arcPath.replace(/^M\s*[\d.-]+\s+[\d.-]+\s*/, '');
    //         } else {
    //             // 直线路径
    //             pathData += ` L ${line.end.x} ${line.end.y}`;
    //         }
    //     });
    //
    //     // 闭合路径
    //     pathData += ' Z';
    //     return pathData;
    // };

    const generateCompletePath = () => {
        if (!zone.points || zone.points.length === 0) return '';

        let pathData = `M ${zone.points[0].x} ${zone.points[0].y}`;

        // 遍历所有线段
        zoneUntil.orderSegments(zone.segments)?.forEach((line, index) => {
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

    if(value.from == 'quote' && !zone.color) return null;
    return (
        <Group>
            <Path
                data={generateCompletePath()}
                fill={zone.color}
                // stroke={frameSettings.frameColor || '#333'}
                // strokeWidth={frameSettings.frameBorder / value.sizeMultiples}
            />
            {/*<Shape*/}
            {/*    sceneFunc={(context, shape) => {*/}
            {/*        context.beginPath();*/}
            {/*        const firstSeg = pathData[0];*/}
            {/*        context.moveTo(firstSeg.renderStart.x, firstSeg.renderStart.y);*/}
            {/*        pathData.forEach(segment => {*/}
            {/*            if (segment.isArc && segment.center && segment.radius) {*/}
            {/*                // 计算弧线的角度*/}
            {/*                const startAngle = Math.atan2(*/}
            {/*                    segment.renderStart.y - segment.center.y,*/}
            {/*                    segment.renderStart.x - segment.center.x*/}
            {/*                );*/}
            {/*                const endAngle = Math.atan2(*/}
            {/*                    segment.renderEnd.y - segment.center.y,*/}
            {/*                    segment.renderEnd.x - segment.center.x*/}
            {/*                );*/}
            {/*                let angle = endAngle - startAngle;*/}
            {/*                if (angle < 0) angle += 2 * Math.PI;*/}

            {/*                // let sweep = segment.is_clockwise  ? 1 : 0*/}
            {/*                // const isH = segment.start.y == segment.end.y*/}
            {/*                // if( (isH && (segment.start.x - segment.end.x) < 0) || (!isH &&  (segment.start.y - segment.end.y) < 0)) {*/}
            {/*                //     console.log(segment, 'segement================')*/}
            {/*                //     console.log(isH, (segment.start.x - segment.end.x) < 0)*/}
            {/*                //     console.log(!isH,(segment.start.y - segment.end.y) < 0)*/}
            {/*                //     sweep = sweep == 1 ? 0 : 1*/}
            {/*                //     console.log(segment.start, segment.end);*/}
            {/*                // }*/}

            {/*                context.arc(*/}
            {/*                    segment.center.x,*/}
            {/*                    segment.center.y,*/}
            {/*                    segment.radius,*/}
            {/*                    startAngle,*/}
            {/*                    startAngle + angle,*/}
            {/*                    segment.is_clockwise*/}
            {/*                );*/}
            {/*            } else {*/}
            {/*                context.lineTo(segment.renderEnd.x, segment.renderEnd.y);*/}
            {/*            }*/}
            {/*        });*/}

            {/*        context.closePath();*/}
            {/*        context.fillStrokeShape(shape);*/}
            {/*    }}*/}
            {/*    fill={ zone.color }*/}
            {/*    // opacity={0.1}*/}
            {/*    stroke="#eee"*/}
            {/*    strokeWidth={0}*/}
            {/*/>*/}
            {
                zone.segments.map(segment => {
                    if(segment.weight == 1.2 || segment.weight == 0.3 || segment.weight == 1.1 || segment.weight == 1) return null;
                    let pathData = '';

                    if (segment.isArc && segment.center && segment.radius) {
                        const startAngle = Math.atan2(
                            segment.start.y - segment.center.y,
                            segment.start.x - segment.center.x
                        );
                        const endAngle = Math.atan2(
                            segment.end.y - segment.center.y,
                            segment.end.x - segment.center.x
                        );

                        let angle = endAngle - startAngle;
                        if (angle < 0) angle += 2 * Math.PI;

                        pathData = `M ${segment.start.x},${segment.start.y} `;


                        pathData += `A ${segment.radius},${segment.radius} 0 ${0},${segment.is_clockwise ? 0 : 1} ${segment.end.x},${segment.end.y}`;
                    } else {
                        pathData = `M ${segment.start.x},${segment.start.y} L ${segment.end.x},${segment.end.y}`;
                    }

                    let strokeColor = '#333';
                    let strokeWidth = 1;

                    return (
                        <Path
                            key={zone.show_id + segment.id}
                            data={pathData}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            listening={false}
                        />
                    );
                })
            }

            {/* 渲染区域标签和面积 */}
            {
                !value.noRenderBase && <Group x={zone.centroid?.[0] || centerX} y={zone.centroid?.[1] || centerY}>
                    <Text
                        text={zone.show_id}
                        fontSize={14}
                        fontStyle="bold"
                        fill="#333"
                        align="center"
                        verticalAlign="middle"
                        offsetX={0}
                        offsetY={12}
                    />
                    <Text
                        text={`${(zone.area).toFixed(2)}`}
                        fontSize={10}
                        fill="#555"
                        align="center"
                        verticalAlign="middle"
                        offsetX={15}
                        offsetY={-2}
                    />
                </Group>
            }

            
            {/*/!* 渲染窗户 *!/*/}
            {/*{zone.sashPositions && zone.sashPositions.map((sash, i) => */}
            {/*    renderSash(sash, i)*/}
            {/*)}*/}
        </Group>
    );
}; 