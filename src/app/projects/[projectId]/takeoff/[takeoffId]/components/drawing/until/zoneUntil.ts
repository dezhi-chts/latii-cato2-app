import {BaseFrame, ILine} from "../data/baseFrame";
import {IPointPostion, ISashConfig, ISegment, IZone, LineSegment, OperationType, ShapeType } from "../datas";
import lineUntil from "./lineUntil";
import {arcUntil} from "./arcUntil";
import {SDLHorizontal, SDLVertical, TDLHorizontal, TDLVertical} from "../data/divider/divider";
import { BaseOperation } from "../data/operation/baseOperation";
import { BaseData } from "../data/baseData";

type ArcSegment = {
    startPoint: IPointPostion,
    endPoint: IPointPostion,
    isArc: boolean,
    center: IPointPostion,
    radius: number,
    angle: number,
    id: string
};

interface ISashSegment {
    id: string;
    start: IPointPostion;
    end: IPointPostion;
    isArc?: boolean;
    center?: IPointPostion;
    radius?: number;
    angle?: number;
}

class ZoneUntil {

    /**
     * 计算元素与线条的交点和分割区域
     */
    calculateLineIntersections(elements: BaseFrame[]): {
        elementSegments: ILine[],
        intersectionPoints: Map<string, Array<{
            point: IPointPostion;
            lineId: string;
            lineIndex?: number;
        }>>
    } {
        const elementSegments: ILine[] = [];
        const intersectionPoints = new Map<string, Array<{
            point: IPointPostion;
            lineId: string;
            lineIndex?: number;
        }>>();

        // 遍历所有元素
        elements.forEach(element => {
            if (!element.isBaseArea) return;
            // 遍历每个元素的线段
            element.lines.forEach(line => {
                if (line.isCut || !line.startPoint || !line.endPoint) return;

                if (!line.intersectionPoints || line.intersectionPoints.length === 0) {
                    elementSegments.push({
                        id: line.id || '',
                        startPoint: line.startPoint,
                        endPoint: line.endPoint,
                        weight: line.weight,
                        hidden: line.hidden,
                        center: line.center,
                        angle: line.angle,
                        radius: line.radius,
                        // @ts-ignore
                        middle_point: line.radius ? element.points[2] : null
                    });
                    return;
                }

                // 存储交点信息
                if (line.intersectionPoints?.length > 0) {
                    intersectionPoints.set(line.id || '', line.intersectionPoints);
                }

                // 根据交点分割线段
                const segments = line.radius ?
                    this.splitArcByIntersections(line as any, line.intersectionPoints)
                    : this.splitLineByIntersections(
                        line.intersectionPoints,
                        line.startPoint,
                        line.endPoint
                    )
                segments.forEach((segment, index) => {
                    if (line.hiddenSegment?.find(s =>
                        s.startPoint.x == segment.startPoint.x && s.startPoint.y == segment.startPoint.y &&
                        s.endPoint.x == segment.endPoint.x && s.endPoint.y == segment.endPoint.y
                    )) {
                        return;
                    }
                    elementSegments.push({
                        id: `${line.id || ''}-${index + 1}`,
                        startPoint: segment.startPoint,
                        endPoint: segment.endPoint,
                        hidden: line.hidden,
                        weight: line.weight,
                        center: line.center,
                        angle: line.angle,
                        radius: line.radius
                    });
                });
            });
        });

        return {elementSegments, intersectionPoints};
    }

    /**
     * 延长线段
     */
    private extendLine(
        start: IPointPostion,
        end: IPointPostion,
        factor: number
    ): { start: IPointPostion, end: IPointPostion } {
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        return {
            start: {
                x: start.x - dx * factor,
                y: start.y - dy * factor
            },
            end: {
                x: end.x + dx * factor,
                y: end.y + dy * factor
            }
        };
    }

    /**
     * 根据交点分割线条
     */
    splitLineByIntersections(
        intersections: Array<{ point: IPointPostion; lineId: string; lineIndex?: number; }>,
        lineStart: IPointPostion,
        lineEnd: IPointPostion
    ): Array<LineSegment> {
        const segments: Array<LineSegment> = [];
        if (!intersections) return []
        const allPoints = [
            {...lineStart, isIntersection: false},
            ...intersections?.map(intersection => ({
                ...intersection.point,
                isIntersection: true
            })),
            {...lineEnd, isIntersection: false}
        ];

        const isHorizontalLine = Math.abs(lineStart.y - lineEnd.y) < 0.001;
        const isVerticalLine = Math.abs(lineStart.x - lineEnd.x) < 0.001;

        if (isHorizontalLine) {
            allPoints.sort((a, b) => a.x - b.x);
        } else if (isVerticalLine) {
            allPoints.sort((a, b) => a.y - b.y);
        } else {
            allPoints.sort((a, b) => {
                const distA = Math.sqrt(
                    Math.pow(a.x - lineStart.x, 2) +
                    Math.pow(a.y - lineStart.y, 2)
                );
                const distB = Math.sqrt(
                    Math.pow(b.x - lineStart.x, 2) +
                    Math.pow(b.y - lineStart.y, 2)
                );
                return distA - distB;
            });
        }

        for (let i = 0; i < allPoints.length - 1; i++) {
            const distance = Math.sqrt(
                Math.pow(allPoints[i].x - allPoints[i + 1].x, 2) +
                Math.pow(allPoints[i].y - allPoints[i + 1].y, 2)
            );

            if (distance > 0.001) {
                segments.push({
                    startPoint: {x: allPoints[i].x, y: allPoints[i].y},
                    endPoint: {x: allPoints[i + 1].x, y: allPoints[i + 1].y}
                });
            }
        }

        return segments;
    }

    /**
     * 根据交点分割弧线
     */
    private splitArcByIntersections(
        arc: {
            startPoint: IPointPostion,
            endPoint: IPointPostion,
            center: IPointPostion,
            radius: number,
            angle: number,
            id: string
        },
        intersections: Array<{
            point: IPointPostion;
            lineId: string;
            lineIndex?: number;
        }>
    ): Array<ArcSegment> {
        // 如果没有交点，返回整个弧线
        if (intersections.length === 0) {
            return [{
                startPoint: arc.startPoint,
                endPoint: arc.endPoint,
                isArc: true,
                center: arc.center,
                radius: arc.radius,
                angle: arc.angle,
                id: arc.id
            }];
        }

        // 创建包含所有点的数组（起点、终点和所有交点）
        const allPoints = [
            {point: arc.startPoint, isStart: true, isEnd: false, isIntersection: false},
            ...intersections.map(intersection => ({
                point: intersection.point,
                isStart: false,
                isEnd: false,
                isIntersection: true
            })),
            {point: arc.endPoint, isStart: false, isEnd: true, isIntersection: false}
        ];

        // 对点进行去重（基于xy坐标）
        const uniquePoints = [];
        const pointMap = new Map();

        for (const point of allPoints) {
            // 创建坐标键（保留小数点后6位以处理浮点精度问题）
            const key = `${point.point.x.toFixed(4)},${point.point.y.toFixed(4)}`;

            // 如果该点坐标未见过，添加到唯一点列表
            if (!pointMap.has(key)) {
                pointMap.set(key, point);
                uniquePoints.push(point);
            } else {
                // 如果坐标已存在但当前点是起点或终点，更新已存在的点信息
                const existingPoint = pointMap.get(key);
                if (point.isStart) existingPoint.isStart = true;
                if (point.isEnd) existingPoint.isEnd = true;
                if (point.isIntersection) {
                    existingPoint.isIntersection = true;
                }
            }
        }

        // 判断是横向圆弧还是竖向圆弧
        const isHorizontalArc = arc.id.startsWith('Arch-H');

        // 根据圆弧类型进行排序
        if (isHorizontalArc) {
            // 横向圆弧，按X坐标排序
            uniquePoints.sort((a, b) => a.point.x - b.point.x);
        } else {
            // 竖向圆弧，按Y坐标排序
            uniquePoints.sort((a, b) => a.point.y - b.point.y);
        }

        // 分割成弧段
        const segments: Array<ArcSegment> = [];

        // 创建相邻点之间的弧段
        for (let i = 0; i < uniquePoints.length - 1; i++) {
            const currentPoint = uniquePoints[i].point;
            const nextPoint = uniquePoints[i + 1].point;

            // 检查两点是否重合（允许微小误差）
            const distance = Math.sqrt(
                Math.pow(currentPoint.x - nextPoint.x, 2) +
                Math.pow(currentPoint.y - nextPoint.y, 2)
            );

            if (distance > 0.001) { // 忽略非常接近的点，避免创建极短弧段
                segments.push({
                    startPoint: currentPoint,
                    endPoint: nextPoint,
                    isArc: true,
                    center: arc.center,
                    radius: arc.radius,
                    angle: this.calculateArcAngle(arc.center, currentPoint, nextPoint),
                    id: `${arc.id}-${i + 1}`,
                });
            }
        }

        return segments;
    }

    /**
     * 计算弧线角度
     */
    private calculateArcAngle(
        center: IPointPostion,
        startPoint: IPointPostion,
        endPoint: IPointPostion
    ): number {
        // 计算起点和终点与圆心的角度
        const startAngle = Math.atan2(
            startPoint.y - center.y,
            startPoint.x - center.x
        );

        const endAngle = Math.atan2(
            endPoint.y - center.y,
            endPoint.x - center.x
        );

        // 计算角度差（考虑跨越0度的情况）
        let angleDiff = endAngle - startAngle;

        // 确保角度在0到2π之间
        if (angleDiff < 0) {
            angleDiff += 2 * Math.PI;
        }

        // 如果角度大于π，可能需要走短弧
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }

        return angleDiff;
    }

    processAreaPoints(lines: Array<any>, arcs: Array<any>): {
        points: IPointPostion[];
        segments: Array<ISegment>;
    } {
        const segments: any[] = [];
        const orderedPoints: IPointPostion[] = [];

        // 处理直线段
        lines.forEach(line => {
            const start = {x: line.start_point[0], y: line.start_point[1]};
            const end = {x: line.end_point[0], y: line.end_point[1]};

            segments.push({
                id: line.id,
                start,
                end,
                weight: line.weight
            });

            this.addPointIfNotExists(orderedPoints, start);
            this.addPointIfNotExists(orderedPoints, end);
        });

        // 处理弧线段
        arcs.forEach(arc => {
            const start = {x: arc.start_point[0], y: arc.start_point[1]};
            const end = {x: arc.end_point[0], y: arc.end_point[1]};
            const center = {x: arc.center[0], y: arc.center[1]};

            segments.push({
                ...arc,
                id: arc.id,
                start,
                end,
                weight: arc.weight,
                isArc: true,
                center,
                radius: this.calculateRadius(center, start)
            });

            this.addPointIfNotExists(orderedPoints, start);
            this.addPointIfNotExists(orderedPoints, end);
        });

        return {
            points: orderedPoints,
            segments
        };
    }

    private calculateRadius(center: IPointPostion, point: IPointPostion): number {
        return Math.sqrt(
            Math.pow(point.x - center.x, 2) +
            Math.pow(point.y - center.y, 2)
        );
    }

    private addPointIfNotExists(points: IPointPostion[], newPoint: IPointPostion): void {
        const PRECISION = 0.000001;
        const exists = points.some(p =>
            Math.abs(p.x - newPoint.x) < PRECISION &&
            Math.abs(p.y - newPoint.y) < PRECISION
        );

        if (!exists) {
            points.push(newPoint);
        }
    }

    // 计算点到区域的最小距离
    private getDistanceToZone(x: number, y: number, zone: any): number {
        // 初始化为最大距离
        let minDistance = Infinity;

        // 检查点到区域中每个线段的距离
        for (const segment of zone.segments) {
            let distance;
            if (segment.isArc && segment.center && segment.radius) {
                // 计算点到圆弧的距离
                distance = this.getDistanceToArc(
                    x, y,
                    segment.center,
                    segment.radius,
                    segment.start,
                    segment.end
                );
            } else {
                // 计算点到线段的距离
                distance = lineUntil.getDistanceToLine(
                    {x, y},
                    segment.start,
                    segment.end
                );
            }
            minDistance = Math.min(minDistance, distance);
        }

        return minDistance;
    }

    // 计算点到圆弧的距离
    private getDistanceToArc(
        x: number, y: number,
        center: IPointPostion,
        radius: number,
        arcStart: IPointPostion,
        arcEnd: IPointPostion
    ): number {
        // 计算点到圆心的距离
        const distanceToCenter = Math.sqrt(
            Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
        );

        // 计算点相对于圆心的角度
        const angle = Math.atan2(y - center.y, x - center.x);

        // 计算弧的起始和结束角度
        const startAngle = Math.atan2(arcStart.y - center.y, arcStart.x - center.x);
        const endAngle = Math.atan2(arcEnd.y - center.y, arcEnd.x - center.x);

        // 标准化角度，确保 endAngle > startAngle
        let normalizedEndAngle = endAngle;
        if (normalizedEndAngle < startAngle) {
            normalizedEndAngle += 2 * Math.PI;
        }

        // 标准化点的角度
        let normalizedAngle = angle;
        if (normalizedAngle < startAngle) {
            normalizedAngle += 2 * Math.PI;
        }

        // 检查点的角度是否在弧的角度范围内
        const isInAngleRange = normalizedAngle >= startAngle && normalizedAngle <= normalizedEndAngle;

        if (isInAngleRange) {
            // 如果在角度范围内，距离是点到圆上的距离
            return Math.abs(distanceToCenter - radius);
        } else {
            // 如果不在角度范围内，计算到弧端点的距离
            const distanceToStart = Math.sqrt(
                Math.pow(x - arcStart.x, 2) + Math.pow(y - arcStart.y, 2)
            );
            const distanceToEnd = Math.sqrt(
                Math.pow(x - arcEnd.x, 2) + Math.pow(y - arcEnd.y, 2)
            );
            return Math.min(distanceToStart, distanceToEnd);
        }
    }

    /**
     * 更新分割器与区域的关系
     * @param frame 分割器
     * @param zones 区域集合
     * @param elements 所有元素
     * @returns 更新后的区域集合
     */
    updateZonesDivider(
        frame: SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical,
        zones: any[],
        elements: any[]
    ): any[] {
        if (!zones || zones.length === 0 || !frame) return zones;
        const updatedZones = JSON.parse(JSON.stringify(zones));
        const dividerId = frame.id;

        const lineStart = frame.points[0];
        const lineEnd = frame.points[1];

        for (const zone of updatedZones) {
            // 存储与当前区域的交点
            const zoneIntersections: Array<{
                point: IPointPostion;
                segmentId: string;
            }> = [];

            // 检查区域中的每个线段
            for (const segment of zone.segments) {
                if (segment.isArc) {
                    const element = elements?.find(element => segment.id.includes(element.id));
                    // 处理圆弧段
                    // 1. 首先检查分割器是否正好以这个圆弧段为起点或终点
                    // if (frame.startElement?.lineId === segment.id) {
                    //   zoneIntersections.push({
                    //     point: lineStart,
                    //     segmentId: segment.id
                    //   });
                    // } else if (frame.endElement?.lineId === segment.id) {
                    //   zoneIntersections.push({
                    //     point: lineEnd,
                    //     segmentId: segment.id
                    //   });
                    // } else {
                    // 2. 否则，计算与圆弧的交点

                    // 首先检查线段端点是否在圆弧上
                    const distanceStartToCenter = Math.sqrt(
                        Math.pow(lineStart.x - segment.center.x, 2) +
                        Math.pow(lineStart.y - segment.center.y, 2)
                    );

                    const distanceEndToCenter = Math.sqrt(
                        Math.pow(lineEnd.x - segment.center.x, 2) +
                        Math.pow(lineEnd.y - segment.center.y, 2)
                    );

                    const TOLERANCE = 0.1;
                    const checkParams = element.type.includes('-h') ? 'x' : 'y'
                    if (Math.abs(distanceStartToCenter - segment.radius) < TOLERANCE) {
                        if (segment.start[checkParams] < lineStart[checkParams] && segment.end[checkParams] > lineStart[checkParams]) {
                            zoneIntersections.push({
                                point: lineStart,
                                segmentId: segment.id
                            });
                        }

                        // const isInArcRange = arcUntil.isPointInArcRange(
                        //   lineStart,
                        //   segment.center,
                        //   segment.start,
                        //   segment.end,
                        //   segment.angle
                        // );
                        // console.log(segment)
                        // console.log(lineStart)
                        // const isInArcRange = arcUntil.isPointOnArc(
                        //   [lineStart.x, lineStart.y],
                        //   { ...segment, is_clockwise: true, },
                        // )
                        // console.log(isInArcRange, '?????????????????')
                        // if (isInArcRange) {

                        // }
                    }
                    // 检查终点是否在圆弧上
                    if (Math.abs(distanceEndToCenter - segment.radius) < TOLERANCE) {
                        // const isInArcRange = arcUntil.isPointInArcRange(
                        //   lineEnd,
                        //   segment.center,
                        //   segment.start,
                        //   segment.end,
                        //   segment.angle,
                        //   false
                        // );
                        // const isInArcRange = arcUntil.isPointOnArc(
                        //   [lineStart.x, lineStart.y],
                        //   { ...segment, is_clockwise: true, },
                        // )
                        // console.log(isInArcRange, '?????????????????')
                        // if (isInArcRange) {
                        if (segment.start[checkParams] < lineEnd[checkParams] && segment.end[checkParams] > lineEnd[checkParams]) {
                            zoneIntersections.push({
                                point: lineEnd,
                                segmentId: segment.id
                            });
                        }

                        // console.log(zoneIntersections)
                        // zoneIntersections.push({
                        //   point: lineEnd,
                        //   segmentId: segment.id
                        // });
                        // }
                    }
                    // }
                } else {
                    // 处理直线段
                    const intersection = lineUntil.lineIntersection(
                        lineStart,
                        lineEnd,
                        segment.start,
                        segment.end
                    );

                    if (intersection &&
                        lineUntil.isPointOnLineSegment(lineStart, lineEnd, intersection) &&
                        lineUntil.isPointOnLineSegment(segment.start, segment.end, intersection)) {
                        zoneIntersections.push({
                            point: intersection,
                            segmentId: segment.id
                        });
                    }
                }
            }

            const uniqueIntersections = this.deduplicateIntersections(zoneIntersections);
            // 移除当前区域中的分割器ID
            if (zone.dividers) {
                zone.dividers = zone.dividers.filter((divider: any) =>divider.id !== dividerId);
            }

            if (uniqueIntersections.length >= 2) {
                if (!zone.dividers) {
                    zone.dividers = [];
                }

                if (!zone.dividers.find((divider: any) =>
                    typeof divider === 'string' ? divider === frame.id : divider.id === frame.id)) {
                    let divider: any = {
                        start_point: frame.points[0],
                        end_point: frame.points[1],
                        type: frame.type,
                        id: frame.id,
                    }

                    const sortedIntersections = [...uniqueIntersections].sort((a, b) => {
                        if (frame.type.includes('-h')) {
                            // 水平分割器按 x 坐标排序
                            return a.point.x - b.point.x;
                        } else {
                            // 垂直分割器按 y 坐标排序
                            return a.point.y - b.point.y;
                        }
                    });

                    const startPoint = sortedIntersections[0].point;
                    const endPoint = sortedIntersections[sortedIntersections.length - 1].point;

                    divider.length = Math.sqrt(
                        Math.pow(endPoint.x - startPoint.x, 2) +
                        Math.pow(endPoint.y - startPoint.y, 2)
                    ).toFixed(2);

                    zone.dividers.push(divider);
                }

                zone.intersections = zone.intersections || {};
                zone.intersections[dividerId] = uniqueIntersections;
            }
        }

        return updatedZones;
    }

    /**
     * 查找所有元素中的重合点
     */
    findOverlappingPoints(elements: BaseFrame[]): Array<{
        point: IPointPostion;
        elements: Array<{ elementId: string; pointIndex: number }>;
    }> {
        const pointMap = new Map<string, Array<{ elementId: string; pointIndex: number; point: IPointPostion }>>();

        elements.forEach(element => {
            if (!element.points) return;

            element.points.forEach((point, index) => {
                const key = `${point.x.toFixed(4)},${point.y.toFixed(4)}`;

                if (!pointMap.has(key)) {
                    pointMap.set(key, []);
                }

                pointMap.get(key)?.push({
                    elementId: element.id,
                    pointIndex: index,
                    point
                });
            });
        });

        const overlappingPoints: Array<{
            point: IPointPostion;
            elements: Array<{ elementId: string; pointIndex: number }>;
        }> = [];

        pointMap.forEach((points, key) => {
            if (points.length > 1) {
                overlappingPoints.push({
                    point: points[0].point,
                    elements: points.map(p => ({
                        elementId: p.elementId,
                        pointIndex: p.pointIndex
                    }))
                });
            }
        });

        return overlappingPoints;
    }

    /**
     * 计算线段与元素集合的交点
     * @param lineStart 线段起点
     * @param lineEnd 线段终点
     * @param elements 元素集合
     * @returns 交点信息数组
     */
    calculateLineElementsIntersections(
        lineStart: IPointPostion,
        lineEnd: IPointPostion,
        elements: BaseFrame[]
    ): Array<{ point: IPointPostion; lineId: string; lineIndex?: number; element: BaseFrame }> {
        const intersections: Array<{
            point: IPointPostion;
            lineId: string;
            lineIndex?: number;
            element: BaseFrame
        }> = [];

        // 判断是水平线还是垂直线
        const isHorizontal = Math.abs(lineStart.y - lineEnd.y) < 0.001;
        const isVertical = Math.abs(lineStart.x - lineEnd.x) < 0.001;

        // 遍历所有元素
        for (const element of elements) {
            if (!element.lines || element.lines.length === 0) continue;

            // 遍历元素的所有线段
            for (let lineIndex = 0; lineIndex < element.lines.length; lineIndex++) {
                const line = element.lines[lineIndex];
                if (line.isCut || !line.startPoint || !line.endPoint) continue;

                // 如果是圆弧线
                if (line.radius && line.center) {
                    // 使用圆弧与直线相交的计算方法
                    const circle = {
                        center: line.center,
                        radius: line.radius
                    };

                    const testLine = {
                        start: lineStart,
                        end: lineEnd
                    };

                    // 计算圆与线的交点
                    const arcIntersections = lineUntil.getCircleLineIntersection(circle, testLine);

                    if (arcIntersections && arcIntersections.length > 0) {
                        for (const intersection of arcIntersections) {
                            // 检查交点是否在圆弧范围内
                            const isInArcRange = arcUntil.isPointInArcRange(
                                intersection,
                                line.center,
                                line.startPoint,
                                line.endPoint,
                                line.angle as any,
                                !element.flipY || !element.flipX
                            );
                            if (isInArcRange) {
                                intersections.push({
                                    point: intersection,
                                    lineId: line.id || '',
                                    lineIndex,
                                    element
                                });
                            }
                        }
                    }
                } else {
                    // 普通线段，使用直线相交计算
                    const intersection = lineUntil.lineIntersection(
                        lineStart,
                        lineEnd,
                        line.startPoint,
                        line.endPoint
                    );

                    if (intersection) {
                        // 验证交点是否在线段上
                        const isOnOriginalLine = lineUntil.isPointOnLineSegment(lineStart, lineEnd, intersection) &&
                            lineUntil.isPointOnLineSegment(line.startPoint, line.endPoint, intersection);

                        if (isOnOriginalLine) {
                            intersections.push({
                                point: intersection,
                                lineId: line.id || '',
                                lineIndex,
                                element
                            });
                        }
                    }
                }
            }
        }

        if (isHorizontal) {
            intersections.sort((a, b) => a.point.x - b.point.x);
        } else if (isVertical) {
            intersections.sort((a, b) => a.point.y - b.point.y);
        }

        return intersections;
    }

    /**
     * 检测线段是否在元素内部
     * @param segment 要检测的线段
     * @param elements 元素集合
     * @returns 包含线段的元素集合及相关信息
     */
    isSegmentInsideElements(
        segment: { startPoint: IPointPostion, endPoint: IPointPostion },
        elements: BaseFrame[]
    ): Array<{
        element: BaseFrame,
        isFullyInside: boolean, // 线段是否完全在元素内
        isPartiallyInside: boolean, // 线段是否部分在元素内
        insidePoints: IPointPostion[] // 在元素内部的点
    }> {
        const results: Array<{
            element: BaseFrame,
            isFullyInside: boolean,
            isPartiallyInside: boolean,
            insidePoints: IPointPostion[]
        }> = [];

        // 线段的起点和终点
        const {startPoint, endPoint} = segment;

        // 获取线段上的采样点（分成多个点进行检测）
        const numSamples = 5; // 起点、终点以及中间3个点
        const samplePoints: IPointPostion[] = [];

        for (let i = 0; i <= numSamples - 1; i++) {
            const ratio = i / (numSamples - 1);
            samplePoints.push({
                x: startPoint.x + ratio * (endPoint.x - startPoint.x),
                y: startPoint.y + ratio * (endPoint.y - startPoint.y)
            });
        }

        // 遍历所有元素
        for (const element of elements) {
            if (!(element instanceof BaseFrame)) continue;

            // 跳过线条类型的元素
            if (element.type?.startsWith('Line')) continue;

            // 获取元素的边界框
            const {x, y, width, height} = element.virtualFrame;

            // 记录在元素内部的点
            const insidePoints: IPointPostion[] = [];

            // 检查每个采样点是否在元素内部
            for (const point of samplePoints) {
                let isInside = false;

                if (['Rectangle'].includes(element.type || '')) {
                    isInside = (
                        point.x > x &&
                        point.x < x + width &&
                        point.y > y &&
                        point.y < y + height
                    );
                } else if (element.type == ShapeType.Triangle) {
                    isInside = this.isPointInTriangle(point, element.points);
                } else if (element.type?.includes('Arch')) {
                    // 针对顶部半圆形窗户
                    if (element.type === 'Arch-h' || element.type === 'Arch-H') {
                        // 检查点是否在矩形部分
                        const isInRect = (
                            point.x > x &&
                            point.x < x + width &&
                            point.y > y + height / 2 &&
                            point.y < y + height
                        );

                        // 检查点是否在半圆部分
                        const centerX = x + width / 2;
                        const centerY = y + height / 2;
                        const radius = width / 2;

                        const distanceToCenter = Math.sqrt(
                            Math.pow(point.x - centerX, 2) +
                            Math.pow(point.y - centerY, 2)
                        );

                        const isInSemiCircle = (
                            distanceToCenter < radius &&
                            point.y >= y &&
                            point.y <= y + height / 2
                        );

                        isInside = isInRect || isInSemiCircle;
                    }
                    // 针对右侧半圆形窗户
                    else if (element.type === 'Arch-v' || element.type === 'Arch-V') {
                        // 检查点是否在矩形部分
                        const isInRect = (
                            point.x > x &&
                            point.x < x + width / 2 &&
                            point.y > y &&
                            point.y < y + height
                        );

                        // 检查点是否在半圆部分
                        const centerX = x + width / 2;
                        const centerY = y + height / 2;
                        const radius = height / 2;

                        const distanceToCenter = Math.sqrt(
                            Math.pow(point.x - centerX, 2) +
                            Math.pow(point.y - centerY, 2)
                        );

                        const isInSemiCircle = (
                            distanceToCenter < radius &&
                            point.x >= x + width / 2 &&
                            point.x <= x + width
                        );

                        isInside = isInRect || isInSemiCircle;
                    }
                }

                if (isInside) {
                    insidePoints.push(point);
                }
            }

            // 检查线段的端点是否在元素的边界线上
            let startOnBoundary = false;
            let endOnBoundary = false;

            // 遍历元素的边界线
            if (element.lines && element.lines.length > 0) {
                for (const line of element.lines) {
                    if (!line.startPoint || !line.endPoint) continue;

                    // 检查线段起点是否在边界线上
                    if (line.radius && line.center) {
                        // 对于圆弧
                        const distanceStartToCenter = Math.sqrt(
                            Math.pow(startPoint.x - line.center.x, 2) +
                            Math.pow(startPoint.y - line.center.y, 2)
                        );
                        const distanceEndToCenter = Math.sqrt(
                            Math.pow(endPoint.x - line.center.x, 2) +
                            Math.pow(endPoint.y - line.center.y, 2)
                        );

                        // 判断点是否在圆弧上（距离圆心距离等于半径且角度在弧范围内）
                        if (Math.abs(distanceStartToCenter - line.radius) < 0.5) {
                            const isStartInArcRange = arcUntil.isPointInArcRange(
                                startPoint,
                                line.center,
                                line.startPoint,
                                line.endPoint,
                                line.angle as any
                            );
                            if (isStartInArcRange) {
                                startOnBoundary = true;
                            }
                        }

                        if (Math.abs(distanceEndToCenter - line.radius) < 0.5) {
                            const isEndInArcRange = arcUntil.isPointInArcRange(
                                endPoint,
                                line.center,
                                line.startPoint,
                                line.endPoint,
                                line.angle as any
                            );
                            if (isEndInArcRange) {
                                endOnBoundary = true;
                            }
                        }
                    } else {
                        // 对于直线
                        if (lineUntil.isPointOnLineSegment(line.startPoint, line.endPoint, startPoint)) {
                            startOnBoundary = true;
                        }

                        if (lineUntil.isPointOnLineSegment(line.startPoint, line.endPoint, endPoint)) {
                            endOnBoundary = true;
                        }
                    }
                }
            }

            // 调整采样点数量，不包括在边界上的端点
            const effectiveSamplePoints = numSamples - (startOnBoundary ? 1 : 0) - (endOnBoundary ? 1 : 0);

            // 调整内部点数量，不包括在边界上的端点
            const effectiveInsidePoints = insidePoints.filter(point => {
                // 如果起点在边界上，不计入内部点
                if (startOnBoundary &&
                    Math.abs(point.x - startPoint.x) < 0.001 &&
                    Math.abs(point.y - startPoint.y) < 0.001) {
                    return false;
                }
                // 如果终点在边界上，不计入内部点
                if (endOnBoundary &&
                    Math.abs(point.x - endPoint.x) < 0.001 &&
                    Math.abs(point.y - endPoint.y) < 0.001) {
                    return false;
                }
                return true;
            });

            // 确定线段与元素的关系
            const isFullyInside = effectiveInsidePoints.length === effectiveSamplePoints;

            // 部分内部：有内部点，但不是全内部，且不仅仅是边界点
            const isPartiallyInside = effectiveInsidePoints.length > 0 &&
                effectiveInsidePoints.length < effectiveSamplePoints;

            // 如果线段有任何部分在元素内部，记录结果
            if (isFullyInside || isPartiallyInside) {
                results.push({
                    element,
                    isFullyInside,
                    isPartiallyInside,
                    insidePoints: effectiveInsidePoints
                });
            }
        }

        return results;
    }

    /**
     * 检测点是否在多边形内部
     * @param point 要检测的点
     * @param polygonPoints 多边形的顶点集合
     * @returns 是否在多边形内部
     */
    private isPointInPolygon(point: IPointPostion, polygonPoints: IPointPostion[]): boolean {
        if (polygonPoints.length < 3) return false;

        let inside = false;
        const { x, y } = point;

        for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
            const xi = polygonPoints[i].x, yi = polygonPoints[i].y;
            const xj = polygonPoints[j].x, yj = polygonPoints[j].y;

            const intersect =
                ((yi > y) !== (yj > y)) &&
                (x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-10) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }
    // private isPointInPolygon(point: IPointPostion, polygonPoints: IPointPostion[]): boolean {
    //     if (polygonPoints.length < 3) return false;
    //     console.log(point)
    //     console.log(polygonPoints)
    //     // 使用射线法判断点是否在多边形内
    //     let inside = false;
    //     const x = point.x;
    //     const y = point.y;
    //
    //     for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    //         const xi = polygonPoints[i].x;
    //         const yi = polygonPoints[i].y;
    //         const xj = polygonPoints[j].x;
    //         const yj = polygonPoints[j].y;
    //
    //         const intersect = ((yi > y) !== (yj > y)) &&
    //             (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    //
    //         if (intersect) inside = !inside;
    //     }
    //
    //     return inside;
    // }

    /**
     * 判断点是否在三角形内部
     * @param point 要检测的点
     * @param triangle 三角形的三个顶点
     * @returns 是否在三角形内部
     */
    private isPointInTriangle(point: IPointPostion, triangle: IPointPostion[]): boolean {
        if (triangle.length !== 3) return false;

        const p = point;
        const a = triangle[0];
        const b = triangle[1];
        const c = triangle[2];

        const denominator = ((b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y));

        if (Math.abs(denominator) < 0.0001) return false;

        // 计算重心坐标系中的系数
        const alpha = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / denominator;
        const beta = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / denominator;
        const gamma = 1 - alpha - beta;

        return alpha > 0 && beta > 0 && gamma > 0;
    }

    /**
     * 检测线段是否与矩形相交
     * @param segment 线段
     * @param rect 矩形元素
     * @returns 是否相交
     */
    private isSegmentIntersectRect(
        segment: { startPoint: IPointPostion, endPoint: IPointPostion },
        rect: { x: number, y: number, width: number, height: number }
    ): boolean {
        const {startPoint, endPoint} = segment;
        const {x, y, width, height} = rect;

        // 矩形的四个边
        const rectEdges = [
            {start: {x, y}, end: {x: x + width, y}}, // 上边
            {start: {x: x + width, y}, end: {x: x + width, y: y + height}}, // 右边
            {start: {x: x + width, y: y + height}, end: {x, y: y + height}}, // 下边
            {start: {x, y: y + height}, end: {x, y}} // 左边
        ];

        // 检查线段是否与矩形的任一边相交
        for (const edge of rectEdges) {
            if (lineUntil.doLinesIntersect(
                startPoint.x, startPoint.y, endPoint.x, endPoint.y,
                edge.start.x, edge.start.y, edge.end.x, edge.end.y
            )) {
                return true;
            }
        }

        // 检查线段的端点是否在矩形内
        const isStartInside = (
            startPoint.x > x &&
            startPoint.x < x + width &&
            startPoint.y > y &&
            startPoint.y < y + height
        );

        const isEndInside = (
            endPoint.x > x &&
            endPoint.x < x + width &&
            endPoint.y > y &&
            endPoint.y < y + height
        );

        return isStartInside || isEndInside;
    }

    filterPoints(points: Array<IPointPostion>) {
        let resPoints = new Map()

        points.forEach(point => {

        })

    }

    /**
     * 判断线段与分割器(divider)的交点，将divider分成两段
     * @param line 线段对象
     * @param elements 元素集合
     * @returns 所有被分割的divider信息和原divider信息
     */
    splitDividersByLine(
        line: { startPoint: IPointPostion, endPoint: IPointPostion, id: string },
        elements: any[]
    ): {
        originalDividers: Array<SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical>,
        newDividers: Array<SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical>
    } {
        // 找出所有divider元素
        const dividers = elements.filter(element =>
            element instanceof SDLHorizontal ||
            element instanceof SDLVertical ||
            element instanceof TDLHorizontal ||
            element instanceof TDLVertical
        ) as Array<SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical>;

        const result = {
            originalDividers: [] as Array<SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical>,
            newDividers: [] as Array<SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical>
        };

        // 如果没有divider，直接返回空结果
        if (!dividers.length) return result;

        // 遍历所有divider
        for (const divider of dividers) {
            // 构建divider的线段
            const dividerLine = {
                startPoint: divider.points[0],
                endPoint: divider.points[1]
            };

            // 计算交点
            const intersection = lineUntil.lineIntersection(
                line.startPoint,
                line.endPoint,
                dividerLine.startPoint,
                dividerLine.endPoint
            );

            // 如果有交点，并且交点在两条线段上（不是延长线上的交点）
            if (intersection &&
                lineUntil.isPointOnLineSegment(line.startPoint, line.endPoint, intersection) &&
                lineUntil.isPointOnLineSegment(dividerLine.startPoint, dividerLine.endPoint, intersection)) {

                // 记录原始divider
                result.originalDividers.push(divider);

                // 创建两个新的divider，一个从原始起点到交点，一个从交点到原始终点
                // 需要根据divider类型创建对应的新divider

                // 水平SDL分割器
                if (divider instanceof SDLHorizontal) {
                    // 第一段：从原始起点到交点
                    const divider1 = new SDLHorizontal({
                        id: `${divider.id}-split-1-${Date.now()}`,
                        x: divider.points[0].x,
                        y: divider.points[0].y,
                        width: intersection.x - divider.points[0].x,
                        height: divider.virtualFrame.height
                    });

                    // 第二段：从交点到原始终点
                    const divider2 = new SDLHorizontal({
                        id: `${divider.id}-split-2-${Date.now()}`,
                        x: intersection.x,
                        y: intersection.y,
                        width: divider.points[1].x - intersection.x,
                        height: divider.virtualFrame.height
                    });

                    result.newDividers.push(divider1, divider2);
                }
                // 垂直SDL分割器
                else if (divider instanceof SDLVertical) {
                    // 第一段：从原始起点到交点
                    const divider1 = new SDLVertical({
                        id: `${divider.id}-split-1-${Date.now()}`,
                        x: divider.points[0].x,
                        y: divider.points[0].y,
                        width: divider.virtualFrame.width,
                        height: intersection.y - divider.points[0].y
                    });

                    // 第二段：从交点到原始终点
                    const divider2 = new SDLVertical({
                        id: `${divider.id}-split-2-${Date.now()}`,
                        x: intersection.x,
                        y: intersection.y,
                        width: divider.virtualFrame.width,
                        height: divider.points[1].y - intersection.y
                    });

                    result.newDividers.push(divider1, divider2);
                }
                // 水平TDL分割器
                else if (divider instanceof TDLHorizontal) {
                    // 第一段：从原始起点到交点
                    const divider1 = new TDLHorizontal({
                        id: `${divider.id}-split-1-${Date.now()}`,
                        x: divider.points[0].x,
                        y: divider.points[0].y,
                        width: intersection.x - divider.points[0].x,
                        height: divider.virtualFrame.height
                    });

                    // 第二段：从交点到原始终点
                    const divider2 = new TDLHorizontal({
                        id: `${divider.id}-split-2-${Date.now()}`,
                        x: intersection.x,
                        y: intersection.y,
                        width: divider.points[1].x - intersection.x,
                        height: divider.virtualFrame.height
                    });

                    result.newDividers.push(divider1, divider2);
                }
                // 垂直TDL分割器
                else if (divider instanceof TDLVertical) {
                    // 第一段：从原始起点到交点
                    const divider1 = new TDLVertical({
                        id: `${divider.id}-split-1-${Date.now()}`,
                        x: divider.points[0].x,
                        y: divider.points[0].y,
                        width: divider.virtualFrame.width,
                        height: intersection.y - divider.points[0].y
                    });

                    // 第二段：从交点到原始终点
                    const divider2 = new TDLVertical({
                        id: `${divider.id}-split-2-${Date.now()}`,
                        x: intersection.x,
                        y: intersection.y,
                        width: divider.virtualFrame.width,
                        height: divider.points[1].y - intersection.y
                    });

                    result.newDividers.push(divider1, divider2);
                }
            }
        }

        // 过滤掉太短的分割器（避免创建过小的分段）
        result.newDividers = result.newDividers.filter(divider => {
            if (divider instanceof SDLHorizontal || divider instanceof TDLHorizontal) {
                return divider.virtualFrame.width > 5; // 水平分割器宽度至少5个单位
            } else {
                return divider.virtualFrame.height > 5; // 垂直分割器高度至少5个单位
            }
        });

        return result;
    }

    /**
     * 判断线段是否与多个分割器相交，并返回交点信息
     * @param line 线段对象
     * @param elements 元素集合
     * @returns 交点信息
     */
    findLineDividerIntersections(
        line: { startPoint: IPointPostion, endPoint: IPointPostion },
        elements: any[]
    ): Array<{
        intersection: IPointPostion,
        divider: SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical,
        distanceFromStart: number // 距离线段起点的距离
    }> {
        // 找出所有divider元素
        const dividers = elements.filter(element =>
            element instanceof SDLHorizontal ||
            element instanceof SDLVertical ||
            element instanceof TDLHorizontal ||
            element instanceof TDLVertical
        ) as Array<SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical>;

        const intersections: Array<{
            intersection: IPointPostion,
            divider: SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical,
            distanceFromStart: number
        }> = [];

        // 遍历所有divider
        for (const divider of dividers) {
            // 构建divider的线段
            const dividerLine = {
                startPoint: divider.points[0],
                endPoint: divider.points[1]
            };

            // 计算交点
            const intersection = lineUntil.lineIntersection(
                line.startPoint,
                line.endPoint,
                dividerLine.startPoint,
                dividerLine.endPoint
            );

            // 如果有交点，并且交点在两条线段上
            if (intersection &&
                lineUntil.isPointOnLineSegment(line.startPoint, line.endPoint, intersection) &&
                lineUntil.isPointOnLineSegment(dividerLine.startPoint, dividerLine.endPoint, intersection)) {

                // 计算交点到起点的距离
                const dx = intersection.x - line.startPoint.x;
                const dy = intersection.y - line.startPoint.y;
                const distanceFromStart = Math.sqrt(dx * dx + dy * dy);

                intersections.push({
                    intersection,
                    divider,
                    distanceFromStart
                });
            }
        }

        // 按距离排序
        intersections.sort((a, b) => a.distanceFromStart - b.distanceFromStart);

        return intersections;
    }

    /**
     * 去重交点集合，保留相同位置的唯一交点
     * @param intersections 交点集合
     * @returns 去重后的交点集合
     */
    deduplicateIntersections<T extends { point: IPointPostion }>(intersections: T[]): T[] {
        if (!intersections || intersections.length === 0) {
            return [];
        }

        // 使用Map记录已添加的交点坐标
        const uniqueIntersections: T[] = [];
        const pointMap = new Map<string, boolean>();

        // 处理交点去重
        for (const intersection of intersections) {
            // 创建交点坐标的唯一标识（保留小数点后4位精度）
            const pointKey = `${intersection.point.x.toFixed(4)},${intersection.point.y.toFixed(4)}`;

            // 如果该坐标的交点还未添加，则添加到唯一交点数组中
            if (!pointMap.has(pointKey)) {
                pointMap.set(pointKey, true);
                uniqueIntersections.push(intersection);
            }
        }

        return uniqueIntersections;
    }

    /**
     * 获取operation元素在glass中的最新区域信息
     * @param frame 
     * @param zones 
     * @param zone 
     * @param lineWidth 
     * @returns { 
     *  nearZone: IZone | null,  距离最近的区域，未进行缩进操作
     *  borderWidth?: number,    缩进宽度
     *  bounds?: { minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }, 区域缩进后的坐标点和宽高
     *  zoneIndentSegs: ISegment[] 区域缩进后的线段集合
     * }
     */
    getZoneInfoByGlass(frame: BaseOperation, zones: IZone[], zone?: IZone, lineWidth = 10): 
        {   nearZone: IZone | null, 
            borderWidth?: number,
            bounds?: {
                minX: number, 
                minY: number,
                maxX: number, 
                maxY: number,
                width: number, 
                height: number
            },
            zoneIndentSegs: ISegment[]
        } 
    { 
        if (!zones || zones.length === 0) {
            return {
                nearZone: null,
            };
        }
        // 1. 找到 frame 位置最接近的 zone
        const nearestZone: IZone | any = zone || this.findContainingZone(zones, frame);
        console.log(nearestZone, '====nearestZone=====')
        if(!nearestZone || !nearestZone.segments){
            console.warn("No valid nearest zone found");
            return {
                nearZone: null
            };
        }

        let border = nearestZone.border?.frame + nearestZone.border?.casement || 0
        const {points: intersectionPoints , segments} = this.getIndentedZone(nearestZone, border || lineWidth, zones, false, nearestZone.border?.casement)
        
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;

        intersectionPoints.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });

        //对于arch元素，width和height可能是0
        let width = maxX - minX;
        let height = maxY - minY;

        if (nearestZone.segments.length < 3) {
            //如果是半圆形或者圆形，则重新计算边界框
            let resp = this.calculateZoneDimensions(nearestZone);
    
            let value = {
                width: resp.boundingBox.maxX - resp.boundingBox.minX,
                height: resp.boundingBox.maxY- resp.boundingBox.minY
            }
        
            width = width == 0 ?  value.width - (value.height - height) : width;
            height = height == 0 ?  value.height - (value.width - width) : height;
            
                }
        console.log(`######## getZoneInfoByGlass  minX =`, minX, ' minY =', minY, ' maxX =', maxX, ' maxY =', maxY, ' width =', width, ' height =', height);
        return {
            nearZone: nearestZone,
            borderWidth:border,
            bounds: {
                minX,
                minY,
                maxX,
                maxY,
                width,
                height,
            },
            zoneIndentSegs: segments
        }
    }

    /**
     * gn:根据区域内线段计算angle的坐标信息
     * @param segments 线段集合
     * @param zoneInfo 区域信息
     * @param direction 方向，（备用，目前各个方向的angle处理逻辑一致）
     * @returns angle的坐标信息 {minX: number, minY: number, width: number, height: number}
     */
    calculateAngleInfo(segments: Array<ISegment>,zoneInfo:{minX: number, minY: number, width: number, height: number}, direction: string) : {minX: number, minY: number, width: number, height: number} {
        let verticalLeftSegments:Array<ISegment> = [],verticalRightSegments:Array<ISegment> = [];
        let horizontalTopSegments:Array<ISegment> = [],horizontalBottomSegments:Array<ISegment> = [];
        //垂直线段总个数
        let verticalSegmentsCount:number = 0;
        //水平线段总个数
        let horizontalSegmentsCount:number = 0;

        let minX = Number.MAX_VALUE
        let minY = Number.MAX_VALUE;

        //默认angle的位置坐标
        let postionInfo = {
            minX:zoneInfo.minX,
            minY:zoneInfo.minY,
            width:zoneInfo.width,
            height:zoneInfo.height
        }

        //判断区域的左右边界是否存在垂直线段
        segments.forEach(segment => {
            if(!segment) return false;
            let isVertical = segment.start.x === segment.end.x;
            let isHorizontal = segment.start.y === segment.end.y;
            if (isVertical) {
                verticalSegmentsCount++;
                if( Math.abs(segment.start.x - zoneInfo.minX ) < 0.01 ){
                    //左侧垂直线段
                    verticalLeftSegments.push(segment);
                } else if ( isVertical && Math.abs(segment.start.x - ( zoneInfo.minX + zoneInfo.width) ) < 0.01 ){
                    //右侧垂直线段
                    verticalRightSegments.push(segment);
                }
            } else if (isHorizontal) {
                horizontalSegmentsCount++;
                if( Math.abs(segment.start.y - zoneInfo.minY ) < 0.01 ){
                    //上边水平线段
                    horizontalTopSegments.push(segment);
                } else if ( isHorizontal && Math.abs(segment.start.y - ( zoneInfo.minY + zoneInfo.height) ) < 0.01 ){
                    //下边水平线段
                    horizontalBottomSegments.push(segment);
                }
            }
        });


        if( verticalSegmentsCount >= 2 ){
            //矩形区域,上边梯形区域
            if( verticalLeftSegments.length === 1 ){
                //如果左边只有一条垂直线段，则左边是最短边
                let leftSegmentHeight = 0;
                verticalLeftSegments.forEach(segment => {
                    minX = Math.min(minX, segment.start.x, segment.end.x);
                    minY = Math.min(minY, segment.start.y, segment.end.y);
                    leftSegmentHeight = Math.abs(segment.end.y - segment.start.y);
                });
    
                postionInfo = {
                    minX: minX,
                    minY: minY,
                    width: zoneInfo.width,
                    height: leftSegmentHeight
                }
            } else if( verticalRightSegments.length === 1 ){
                //如果右边只有一条垂直线段，则右边是最短边
                let rightSegmentHeight = 0;
                verticalRightSegments.forEach(segment => {
                    minX = Math.min(minX, segment.start.x, segment.end.x);
                    minY = Math.min(minY, segment.start.y, segment.end.y);
                    rightSegmentHeight = Math.abs(segment.end.y - segment.start.y);
                });
    
                postionInfo = {
                    minX:minX - zoneInfo.width,
                    minY: minY,
                    width: zoneInfo.width,
                    height: rightSegmentHeight
                }
            }
        } else if( horizontalSegmentsCount >= 2 ){
            //矩形区域，直角梯形区域
            if( horizontalTopSegments.length === 1 ){
                //如果上边只有一条水平线段，则上边是最短边
                let topSegmentWidth = 0;
                horizontalTopSegments.forEach(segment => {
                    minX = Math.min(minX, segment.start.x, segment.end.x);
                    minY = Math.min(minY, segment.start.y, segment.end.y);
                    topSegmentWidth = Math.abs(segment.end.x - segment.start.x);
                });
                postionInfo = {
                    minX: minX,
                    minY: minY,
                    width: topSegmentWidth,
                    height: zoneInfo.height
                }
            } else if( horizontalBottomSegments.length === 1 ){
                //如果下边只有一条水平线段，则下边是最短边
                let bottomSegmentWidth = 0;
                horizontalBottomSegments.forEach(segment => {
                    minX = Math.min(minX, segment.start.x, segment.end.x);
                    minY = Math.min(minY, segment.start.y, segment.end.y);
                    bottomSegmentWidth = Math.abs(segment.end.x - segment.start.x);
                });
                postionInfo = {
                    minX: minX,
                    minY: minY-zoneInfo.height,
                    width: bottomSegmentWidth,
                    height: zoneInfo.height
                }
            }

        }

        return postionInfo;
    };


    updateDivider(frame: BaseOperation, zones: IZone[],) {
        if (!zones || zones.length === 0) {
            return;
        }
        const nearestZone: IZone | any = this.findNearZone(zones, frame);

        if (!nearestZone || !nearestZone.segments || nearestZone.segments.length < 3) {
            console.warn("No valid nearest zone found");
            return;
        }

        let border = nearestZone.border?.frame + nearestZone.border?.casement || 0
        const {points: intersectionPoints} = this.getIndentedZone(nearestZone, border, zones, false, nearestZone.border?.casement)

        // if (frame.updatePoints) {
        //     frame.updatePoints(intersectionPoints)
        // } else {
        //
        // }
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;

        intersectionPoints.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });

        const width = maxX - minX;
        const height = maxY - minY;

        const isH = frame.type.includes('-h')

        if (isH) {
            frame.update({width, x: minX})
        } else {
            frame.update({height, y: minY})
        }
    }

    findZonesInGroup(group: BaseFrame, zones: IZone[]): IZone[] {
        if (!group || !zones?.length) {
            return [];
        }

        const groupBounds = {
            left: group.virtualFrame.x,
            right: group.virtualFrame.x + group.virtualFrame.width,
            top: group.virtualFrame.y,
            bottom: group.virtualFrame.y + group.virtualFrame.height
        };

        return zones.filter(zone => {
            // 检查 zone 是否有点
            if (!zone.points?.length) {
                return false;
            }

            // 检查所有点是否在边界内
            const pointsInBounds = zone.points.every(point => {
                return point.x >= groupBounds.left &&
                    point.x <= groupBounds.right &&
                    point.y >= groupBounds.top &&
                    point.y <= groupBounds.bottom;
            });

            if (!pointsInBounds) {
                return false;
            }

            if (zone.segments?.length) {
                return zone.segments.every(segment => {
                    if (segment.isArc && segment.center && segment.radius) {
                        const startAngle = Math.atan2(
                            segment.start.y - segment.center.y,
                            segment.start.x - segment.center.x
                        );
                        const endAngle = Math.atan2(
                            segment.end.y - segment.center.y,
                            segment.end.x - segment.center.x
                        );

                        let midAngle;
                        if (zone.is_clockwise) {
                            midAngle = startAngle > endAngle ?
                                (startAngle + endAngle) / 2 :
                                (startAngle + endAngle + 2 * Math.PI) / 2;
                        } else {
                            midAngle = startAngle < endAngle ?
                                (startAngle + endAngle) / 2 :
                                (startAngle + endAngle - 2 * Math.PI) / 2;
                        }

                        const midPoint = {
                            x: segment.center.x + segment.radius * Math.cos(midAngle),
                            y: segment.center.y + segment.radius * Math.sin(midAngle)
                        };

                        const midPointInBounds = midPoint.x >= groupBounds.left &&
                            midPoint.x <= groupBounds.right &&
                            midPoint.y >= groupBounds.top &&
                            midPoint.y <= groupBounds.bottom;

                        return  midPointInBounds;
                    }
                    return true;
                });
            }

            return true;
        });
    }

    /**
     * 获取向内缩进后的区域点和线段数据
     * @param nearestZone 原始区域
     * @param lineWidth 缩进距离
     * @returns 缩进后的点和线段
     */
    getIndentedZone(nearestZone: IZone, lineWidth: number, zones?: IZone[], weight: boolean = false, frameW = 0): {
        points: IPointPostion[];
        segments: Array<ISegment>;
    } {
        const zone: IZone = nearestZone;
        // 对区域的线段进行排序，确保首尾相连
        const orderedSegments = JSON.parse(JSON.stringify(this.orderSegments(zone.segments)));
        if (!orderedSegments || orderedSegments.length === 0) {
            console.warn("Failed to order segments");
            return {points: [], segments: []};
        }

        const centroid: IPointPostion = {
            x: zone.centroid[0],
            y: zone.centroid[1]
        };

        // 向质心方向平移线段
        // const offsetDistance = lineWidth;
        const offsetSegments = orderedSegments.map((segment:any) => {
            let offset = lineWidth
            if (zones && (segment.weight == 1.1 || segment.weight == 1.2 || segment.weight == 1 || segment.weight == 0.3)) {
                const zone:any = zones.find(zone => {
                    if (zone.show_id == nearestZone.show_id) return false;
                    return zone.segments.findIndex((st:any) => st.id == segment.id) >= 0
                })
                if (segment.weight == 0.3) {
                    offset = 0
                }
                if (segment.weight == 1) {
                    offset = lineWidth / 2
                }
                if (segment.weight == 1.2 && (0.1 < (zone?.centroid[0] - centroid.x) || (zone?.centroid[1] - centroid.y) > 0.1)) {
                    offset = 0
                }
                if (segment.weight == 1.1 && ((centroid.x - zone?.centroid[0]) > 0.1 || 0.1 < (centroid.y - zone?.centroid[1]))) {
                    offset = 0
                }
                if (weight || frameW) {
                    if (segment.weight == 0.3 && frameW) {
                        offset = frameW
                    }
                    if (segment.weight == 1 && frameW) {
                        offset = (lineWidth - frameW) / 2 + frameW
                    }
                    if (segment.weight == 1.2 && ((centroid.x - zone?.centroid[0]) > 0.1 || (centroid.y - zone?.centroid[1]) > 0.1)) {
                        offset = frameW ? lineWidth - frameW : 0
                    }
                    if (segment.weight == 1.1 && ((zone?.centroid[0] - centroid.x) > 0.1 || (zone?.centroid[1] - centroid.y) > 0.1)) {
                        offset = frameW ? lineWidth - frameW : 0
                    }
                }
            }

            return this.offsetSegmentTowardsCentroid(segment, centroid, offset)
        });
        const intersectionPoints: IPointPostion[] = [];
        const newSegments: Array<{
            id: string;
            start: IPointPostion;
            end: IPointPostion;
            isArc?: boolean;
            center?: IPointPostion;
            radius?: number;
        }> = [];

        for (let i = 0; i < offsetSegments.length; i++) {
            const currentSegment = offsetSegments[i];
            const nextSegment = offsetSegments[(i + 1) % offsetSegments.length];

            let intersection;
            if (currentSegment.isArc || nextSegment.isArc) {
                let points = this.calculateArcSegmentIntersection(
                    currentSegment.isArc ? currentSegment : nextSegment,
                    currentSegment.isArc ? nextSegment : currentSegment,
                );
                if (points.length) {
                    if (points.length === 1) {
                        intersection = points[0];
                    } else if (points.length > 1) {
                        const distances = points.map(point => {
                            const dx = point.x - currentSegment.end.x;
                            const dy = point.y - currentSegment.end.y;
                            return {
                                point,
                                distance: Math.sqrt(dx * dx + dy * dy)
                            };
                        });

                        intersection = distances.reduce((closest, current) => {
                            return current.distance < closest.distance ? current : closest;
                        }).point;
                    }
                }

            } else {
                intersection = lineUntil.lineExtendIntersection(
                    currentSegment.start,
                    currentSegment.end,
                    nextSegment.start,
                    nextSegment.end
                );
            }
            if (!intersection) {
                if (this.isSamePoint(currentSegment.start, nextSegment.start) || this.isSamePoint(currentSegment.start, nextSegment.end)) {
                    // currentSegment.
                    intersection = currentSegment.start;
                } else if (this.isSamePoint(currentSegment.end, nextSegment.start) || this.isSamePoint(currentSegment.end, nextSegment.end)) {
                    intersection = currentSegment.end;
                } else throw Error('!!!!!!!, intersection',)
            }
            intersectionPoints.push(intersection);

        }
        for (let i = 0; i < intersectionPoints.length; i++) {
            const startPoint = intersectionPoints[(i - 1 < 0 ? intersectionPoints.length - 1 : i - 1)];
            const endPoint = intersectionPoints[i];

            const originalSegment = offsetSegments[i];

            const newSegment = {
                ...originalSegment,
                id: `${originalSegment.id}-indented-${originalSegment.id}-${i}`,
                start: startPoint,
                end: endPoint,
                isArc: originalSegment.isArc,
                center: originalSegment.center,
                radius: originalSegment.radius
            };

            newSegments.push(newSegment);
        }
        return {
            points: intersectionPoints,
            segments: newSegments
        };
    }

    findNearZone(zones: IZone[], frame: BaseData): IZone | null {
        const framePosition = {
            x: frame.virtualFrame.x + frame.virtualFrame.width / 2,
            y: frame.virtualFrame.y + frame.virtualFrame.height / 2
        };

        let nearestZone: IZone | null = null;
        let minDistance = Infinity;

        zones.forEach(zone => {
            if (!zone.centroid) return;

            const distance = Math.sqrt(
                Math.pow(framePosition.x - zone.centroid[0], 2) +
                Math.pow(framePosition.y - zone.centroid[1], 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearestZone = zone;
            }
        });

        return nearestZone;
    }

    findContainingZone(zones: IZone[], frame: BaseData): IZone | null {
        if (!zones?.length || !frame) {
            return null;
        }
        const size = 3

        const framePoints = [
            { x: frame.virtualFrame.x + size, y: frame.virtualFrame.y + size},
            { x: frame.virtualFrame.x + frame.virtualFrame.width - size, y: frame.virtualFrame.y + size},
            { x: frame.virtualFrame.x + frame.virtualFrame.width - size, y: frame.virtualFrame.y + frame.virtualFrame.height - size },
            { x: frame.virtualFrame.x + size, y: frame.virtualFrame.y + frame.virtualFrame.height - size }
        ];
        const frameCenterPoint = {
            x: frame.virtualFrame.x + frame.virtualFrame.width / 2,
            y: frame.virtualFrame.y + frame.virtualFrame.height / 2
        };
        return zones.find(zone => {
            if (!zone.points?.length) {
                return false;
            }

            if (!zone.segments?.length) {
                const zonePoints = this.segmentsToPolygonPoints(zone.segments)
                return framePoints.every(framePoint => this.isPointInPolygon(framePoint, zonePoints));
            }

            const allPointsInZone = framePoints.every(framePoint =>
                this.isPointInZoneWithArcs(framePoint, zone)
            );

            if (!allPointsInZone) {
                return false;
            }
            const zonePoints = this.segmentsToPolygonPoints(zone.segments)
            return this.isPointInPolygon(frameCenterPoint, zonePoints);

            // const centerInZone = this.isPointInZoneWithArcs(frameCenterPoint, zone);
            //
            // return centerInZone;
        }) || this.findNearZone(zones,frame);
        /* return zones.find(zone => {
            if (!zone.points?.length) {
                return false;
            }

            const zonePoints = this.segmentsToPolygonPoints(zone.segments)
            return framePoints.every(framePoint => this.isPointInPolygon(framePoint, zonePoints));
        }) || null;*/
    }

    private isPointInZoneWithArcs(point: { x: number, y: number }, zone: IZone): boolean {
        if (!zone.segments?.length) {
            return this.isPointInPolygon(point, zone.points);
        }

        const hasArcSegments = zone.segments.some(seg => seg.isArc);

        if (!hasArcSegments) {
            const polygonPoints = this.segmentsToPolygonPoints(zone.segments);
            return this.isPointInPolygon(point, polygonPoints);
        }

        let intersectionCount = 0;

        const rayDirection = { x: 1, y: 0 };

        for (const segment of zone.segments) {
            if (!segment.isArc) {
                const start = segment.start;
                const end = segment.end;

                if ((start.y > point.y) !== (end.y > point.y) &&
                    point.x < ((end.x - start.x) * (point.y - start.y) / (end.y - start.y) + start.x)) {
                    intersectionCount++;
                }
            } else if (segment.center && segment.radius) {
                const center = segment.center;
                const radius = segment.radius;

                const vectorToCenterX = center.x - point.x;
                const vectorToCenterY = center.y - point.y;
                const distanceToCenter = Math.sqrt(vectorToCenterX * vectorToCenterX + vectorToCenterY * vectorToCenterY);

                if (distanceToCenter <= radius) {
                    const angleOfPoint = Math.atan2(point.y - center.y, point.x - center.x);

                    const startAngle = Math.atan2(segment.start.y - center.y, segment.start.x - center.x);
                    const endAngle = Math.atan2(segment.end.y - center.y, segment.end.x - center.x);

                    let angleInRange;
                    if (segment.is_clockwise) {
                        angleInRange = this.isAngleInRangeClockwise(angleOfPoint, startAngle, endAngle);
                    } else {
                        angleInRange = this.isAngleInRangeCounterClockwise(angleOfPoint, startAngle, endAngle);
                    }

                    if (angleInRange) {
                        intersectionCount++;
                    }
                }
            }
        }

        return intersectionCount % 2 === 1;
    }

    private isAngleInRangeClockwise(angle: number, start: number, end: number): boolean {
        const normalizeAngle = (a: number) => (a % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

        angle = normalizeAngle(angle);
        start = normalizeAngle(start);
        end = normalizeAngle(end);

        if (start < end) {
            return angle >= start && angle <= end;
        } else {
            return angle >= start || angle <= end;
        }
    }

    private isAngleInRangeCounterClockwise(angle: number, start: number, end: number): boolean {
        const normalizeAngle = (a: number) => (a % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

        angle = normalizeAngle(angle);
        start = normalizeAngle(start);
        end = normalizeAngle(end);

        if (start > end) {
            return angle >= start && angle <= end + 2 * Math.PI;
        } else {
            return angle >= start && angle <= end;
        }
    }

    segmentsToPolygonPoints(segments: Array<ISegment>[] | any): IPointPostion[] {

        return this.orderSegments(segments).map(segment => segment.start);
    }

    updateZoneLines(zone: IZone): IZone | null {
        zone.lines = zone.segments?.map(seg => {
            let line = JSON.parse(JSON.stringify(seg))
            if(seg.isArc)  line.type = 'arch'
            else if(seg.start.x != seg.end.x && seg.start.y != seg.end.y) line.type = 'oblique'
            else line.type = 'stright'
            return line
        })
        return zone;
    }

    findZonePoints(zone: IZone, point: IPointPostion, isH: boolean): {
        minPoint: IPointPostion | null;
        maxPoint: IPointPostion | null;
    } {
        const extensionFactor = 10000;

        const extendedLineStart = {
            x: isH ? point.x - extensionFactor : point.x,
            y: isH ? point.y : point.y - extensionFactor
        };

        const extendedLineEnd = {
            x: isH ? point.x + extensionFactor : point.x,
            y: isH ? point.y : point.y + extensionFactor
        };

        const intersectionPoints: IPointPostion[] = [];

        zone.segments.forEach(segment => {
            let intersection: IPointPostion | null = null;

            if (segment.isArc && segment.center && segment.radius) {
                const arc = {
                    center: segment.center,
                    radius: segment.radius,
                    startPoint: segment.start,
                    endPoint: segment.end,
                    angle: this.calculateArcAngle(segment.center, segment.start, segment.end)
                };

                const line = {
                    start: extendedLineStart,
                    end: extendedLineEnd
                };

                const arcIntersections = arcUntil.getArcLineIntersections(line, arc);
                intersectionPoints.push(...arcIntersections);
            } else {
                intersection = lineUntil.lineIntersection(
                    extendedLineStart,
                    extendedLineEnd,
                    segment.start,
                    segment.end
                );

                if (intersection && lineUntil.isPointOnLineSegment(
                    segment.start,
                    segment.end,
                    intersection
                )) {
                    intersectionPoints.push(intersection);
                }
            }
        });

        if (intersectionPoints.length === 0) {
            return {
                minPoint: null,
                maxPoint: null
            };
        }

        let minPoint = intersectionPoints[0];
        let maxPoint = intersectionPoints[0];

        intersectionPoints.forEach(point => {
            if (isH) {
                if (point.x < minPoint.x) {
                    minPoint = point;
                }
                if (point.x > maxPoint.x) {
                    maxPoint = point;
                }
            } else {
                if (point.y < minPoint.y) {
                    minPoint = point;
                }
                if (point.y > maxPoint.y) {
                    maxPoint = point;
                }
            }
        });

        const roundPoint = (point: IPointPostion): IPointPostion => ({
            x: Number(point.x.toFixed(4)),
            y: Number(point.y.toFixed(4))
        });

        return {
            minPoint: roundPoint(minPoint),
            maxPoint: roundPoint(maxPoint)
        };
    }

    /**
     * 获取区域的最左上角点
     * @param zone 区域对象
     * @returns 最左上角的点
     */
    findTopLeftPoint(zone: IZone): IPointPostion | null {
        if (!zone || (!zone.points && !zone.segments)) {
            return null;
        }

        let points: IPointPostion[] = [];

        if (zone.points) {
            points = [...zone.points];
        } else if (zone.segments) {
            zone.segments.forEach(segment => {
                points.push(segment.start);
                points.push(segment.end);
            });
        }

        if (points.length === 0) {
            return null;
        }

        let topLeftPoint = points[0];

        points.forEach(point => {
            if (point.x < topLeftPoint.x ||
                (Math.abs(point.x - topLeftPoint.x) < 0.0001 && point.y < topLeftPoint.y)) {
                topLeftPoint = point;
            }
        });

        return {
            x: Number(topLeftPoint.x.toFixed(4)),
            y: Number(topLeftPoint.y.toFixed(4))
        };
    }

    /**
     * 对线段进行排序，确保它们首尾相连
     */
    private orderSegments(segments: Array<{
        id: string;
        start: IPointPostion;
        end: IPointPostion;
        isArc?: boolean;
        center?: IPointPostion;
        radius?: number;
    }>): Array<ISegment> {
        if (!segments || segments.length < 2) {
            return segments;
        }
        const orderedSegments = [segments[0]];
        let currentEnd = segments[0].end;
        let remainingSegments = [...segments.slice(1)];

        while (remainingSegments.length > 0) {
            const nextSegmentIndex = remainingSegments.findIndex(segment =>
                (this.isSamePoint(segment.start, currentEnd) ||
                    this.isSamePoint(segment.end, currentEnd))
            );

            if (nextSegmentIndex === -1) {
                console.warn('Gap found in segments sequence');
                break;
            }

            const nextSegment = remainingSegments[nextSegmentIndex];

            let segmentToAdd;
            if (this.isSamePoint(nextSegment.start, currentEnd)) {
                segmentToAdd = {...nextSegment};
            } else {
                segmentToAdd = {
                    ...nextSegment,
                    start: JSON.parse(JSON.stringify(nextSegment.end)),
                    end: JSON.parse(JSON.stringify(nextSegment.start))
                };
            }

            orderedSegments.push(JSON.parse(JSON.stringify(segmentToAdd)));
            currentEnd = segmentToAdd.end;

            remainingSegments.splice(nextSegmentIndex, 1);
        }

        return orderedSegments;
    }

    /**
     * 判断两个点是否为同一个点（考虑浮点数精度）
     */
    private isSamePoint(p1: IPointPostion, p2: IPointPostion): boolean {
        const epsilon = 0.0001;
        return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;
    }

    /**
     * 将线段向质心方向平移
     */
    private offsetSegmentTowardsCentroid(
        segment: {
            id: string;
            start: IPointPostion;
            end: IPointPostion;
            isArc?: boolean;
            center?: IPointPostion;
            radius?: number;
        },
        centroid: IPointPostion,
        distance: number
    ): {
        id: string;
        start: IPointPostion;
        end: IPointPostion;
        isArc?: boolean;
        center?: IPointPostion;
        radius?: number;
    } {
        if (segment.isArc && segment.center && segment.radius) {
            const newRadius = segment.radius - distance;
            const isH = segment.start.y == segment.end.y
            const isFlip = isH ? (segment.start.x - segment.end.x) > 0.1 : (segment.start.y - segment.end.y) > 0.1
            const offset = isFlip ? -1 : 1


            let startPoint = {
                x: isH ? segment.start.x + distance * offset : segment.start.x,
                y: isH ? segment.start.y : segment.start.y + distance * offset
            };
            let endPoint = {
                x: isH ? segment.end.x - distance * offset : segment.end.x,
                y: isH ? segment.end.y : segment.end.y - distance * offset
            }

            return {
                ...segment,
                id: segment.id,
                start: startPoint,
                end: endPoint,
                // end: this.getOffsetPointForArc(segment.end, segment.center, distance, true),
                isArc: true,
                center: segment.center,
                radius: newRadius
            };
        } else {
            const midPoint = {
                x: (segment.start.x + segment.end.x) / 2,
                y: (segment.start.y + segment.end.y) / 2
            };

            const dx = segment.end.x - segment.start.x;
            const dy = segment.end.y - segment.start.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length === 0) {
                return segment;
            }

            const normalX = -dy / length;
            const normalY = dx / length;

            const toCentroidX = centroid.x - midPoint.x;
            const toCentroidY = centroid.y - midPoint.y;

            const dotProduct = normalX * toCentroidX + normalY * toCentroidY;

            const directionX = dotProduct >= 0 ? normalX : -normalX;
            const directionY = dotProduct >= 0 ? normalY : -normalY;

            const offsetStart = {
                x: segment.start.x + directionX * distance,
                y: segment.start.y + directionY * distance
            };

            const offsetEnd = {
                x: segment.end.x + directionX * distance,
                y: segment.end.y + directionY * distance
            };

            return {
                id: segment.id,
                start: offsetStart,
                end: offsetEnd,
                isArc: false
            };
        }
    }

    /**
     * 获取圆弧上偏移后的点
     */
    private getOffsetPointForArc(
        point: IPointPostion,
        center: IPointPostion,
        distance: number,
        inward: boolean = true
    ): IPointPostion {
        // 计算从圆心到点的方向向量
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return point;
        }

        const unitX = dx / length;
        const unitY = dy / length;

        const directionFactor = inward ? -1 : 1;

        return {
            x: point.x + directionFactor * unitX * distance,
            y: point.y + directionFactor * unitY * distance
        };
    }

    /**
     * 计算两个线段（可能包含圆弧）的交点
     */
    private calculateArcSegmentIntersection(
        arcSeg: {
            start: IPointPostion;
            end: IPointPostion;
            isArc: boolean;
            center: IPointPostion;
            radius: number;
        } & ISegment,
        strightSeg: {
            start: IPointPostion;
            end: IPointPostion;
            isArc?: boolean;
            center?: IPointPostion;
            radius?: number;
        }
    ): IPointPostion[] {
        const circle: any = {
            center: arcSeg.center,
            radius: arcSeg.radius
        };

        let points = []

        const extensionFactor = 10000;

        const dir1 = {
            x: strightSeg.end.x - strightSeg.start.x,
            y: strightSeg.end.y - strightSeg.start.y
        };

        const extendedLineStart = {
            x: strightSeg.start.x - dir1.x * extensionFactor,
            y: strightSeg.start.y - dir1.y * extensionFactor
        };

        const extendedLineEnd = {
            x: strightSeg.end.x + dir1.x * extensionFactor,
            y: strightSeg.end.y + dir1.y * extensionFactor
        };

        const line = {
            start: extendedLineStart,
            end: extendedLineEnd
        };

        const intersections = lineUntil.getCircleLineIntersection(circle, line,);
        if (intersections && intersections.length > 0) {
            for (const intersection of intersections) {
                const isH = arcSeg.start.y == arcSeg.end.y
                const isFlip = isH ? (arcSeg.start.x - arcSeg.end.x) > 0.1 : (arcSeg.start.y - arcSeg.end.y) > 0.1
                // const isInArcRange = arcUntil.isPointInArcRange(
                //     intersection,
                //     arcSeg.center,
                //     arcSeg.start,
                //     arcSeg.end,
                //     // isFlip ? arcSeg.end : arcSeg.start,
                //     // isFlip ? arcSeg.start :arcSeg.end,
                //     arcSeg.sweep_angle,
                //     !arcSeg.is_clockwise,
                // );
                // if(isH) {
                //     if(!isFlip && intersection.x > arcSeg.start.x) {
                //
                //     }
                // }else {
                //
                // }
                // if (isInArcRange) {
                points.push(intersection);

                // }
            }
        }
        return points;
    }

    /**
     * 计算区域 (Zone) 的宽度和高度
     * @param zone 要计算的区域
     * @returns 包含宽度、高度以及边界框信息的对象
     */
    calculateZoneDimensions(zone: IZone): {
        width: number;
        height: number;
        boundingBox: {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number
        }
    } {
        if (!zone || !zone.points || zone.points.length === 0) {
            return {
                width: 0,
                height: 0,
                boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
            };
        }

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const point of zone.points) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }

        if (zone.segments && zone.segments.length > 0) {
            for (const segment of zone.segments) {
                if (segment.isArc && segment.center && segment.radius) {
                    // 使用segment已有的角度数据，如果没有则计算
                    let startAngle = segment.start_angle !== undefined
                        ? segment.start_angle * Math.PI / 180  // 转换为弧度
                        : Math.atan2(segment.start.y - segment.center.y, segment.start.x - segment.center.x);

                    let endAngle = segment.end_angle !== undefined
                        ? segment.end_angle * Math.PI / 180  // 转换为弧度
                        : Math.atan2(segment.end.y - segment.center.y, segment.end.x - segment.center.x);

                    startAngle = (startAngle + 2 * Math.PI) % (2 * Math.PI);
                    endAngle = (endAngle + 2 * Math.PI) % (2 * Math.PI);

                    const isClockwise = segment.is_clockwise !== undefined
                        ? segment.is_clockwise
                        : zone.is_clockwise !== false;

                    const keyAngles = [0, Math.PI/2, Math.PI, Math.PI*3/2];

                    const precision = 12;
                    const step = 2 * Math.PI / precision;
                    const angles = [];

                    for (let i = 0; i < precision; i++) {
                        angles.push(i * step);
                    }

                    for (const angle of angles) {
                        let angleInRange = false;

                        if (isClockwise) {
                            if (startAngle > endAngle) {
                                angleInRange = angle <= startAngle && angle >= endAngle;
                            } else {
                                angleInRange = angle <= startAngle || angle >= endAngle;
                            }
                        } else {
                            if (startAngle < endAngle) {
                                angleInRange = angle >= startAngle && angle <= endAngle;
                            } else {
                                angleInRange = angle >= startAngle || angle <= endAngle;
                            }
                        }

                        if (angleInRange) {
                            const x = segment.center.x + segment.radius * Math.cos(angle);
                            const y = segment.center.y + segment.radius * Math.sin(angle);

                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }

                    minX = Math.min(minX, segment.start.x, segment.end.x);
                    minY = Math.min(minY, segment.start.y, segment.end.y);
                    maxX = Math.max(maxX, segment.start.x, segment.end.x);
                    maxY = Math.max(maxY, segment.start.y, segment.end.y);
                }
            }
        }

        const width = maxX - minX;
        const height = maxY - minY;

        return {
            width,
            height,
            boundingBox: { minX, minY, maxX, maxY }
        };
    }
    // calculateZoneDimensions(zone: IZone): {
    //     width: number;
    //     height: number;
    //     boundingBox: {
    //         minX: number;
    //         minY: number;
    //         maxX: number;
    //         maxY: number
    //     }
    // } {
    //     console.log(zone)
    //     if (!zone || !zone.points || zone.points.length === 0) {
    //         return {
    //             width: 0,
    //             height: 0,
    //             boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
    //         };
    //     }
    //
    //     let minX = Number.POSITIVE_INFINITY;
    //     let minY = Number.POSITIVE_INFINITY;
    //     let maxX = Number.NEGATIVE_INFINITY;
    //     let maxY = Number.NEGATIVE_INFINITY;
    //
    //     for (const point of zone.points) {
    //         minX = Math.min(minX, point.x);
    //         minY = Math.min(minY, point.y);
    //         maxX = Math.max(maxX, point.x);
    //         maxY = Math.max(maxY, point.y);
    //     }
    //
    //     if (zone.segments && zone.segments.length > 0) {
    //         for (const segment of zone.segments) {
    //             if (segment.isArc && segment.center && segment.radius) {
    //
    //                 const startAngle = Math.atan2(segment.start.y - segment.center.y, segment.start.x - segment.center.x);
    //                 const endAngle = Math.atan2(segment.end.y - segment.center.y, segment.end.x - segment.center.x);
    //
    //                 const isClockwise = zone.is_clockwise !== false;
    //
    //                 const angles = [0, Math.PI/2, Math.PI, Math.PI*3/2]; // 0°, 90°, 180°, 270°
    //
    //                 for (const angle of angles) {
    //                     let angleInRange = false;
    //
    //                     if (isClockwise) {
    //                         if (startAngle > endAngle) {
    //                             angleInRange = angle <= startAngle && angle >= endAngle;
    //                         } else {
    //                             angleInRange = angle <= startAngle || angle >= endAngle;
    //                         }
    //                     } else {
    //                         if (startAngle < endAngle) {
    //                             angleInRange = angle >= startAngle && angle <= endAngle;
    //                         } else {
    //                             angleInRange = angle >= startAngle || angle <= endAngle;
    //                         }
    //                     }
    //
    //                     if (angleInRange) {
    //                         const x = segment.center.x + segment.radius * Math.cos(angle);
    //                         const y = segment.center.y + segment.radius * Math.sin(angle);
    //
    //                         minX = Math.min(minX, x);
    //                         minY = Math.min(minY, y);
    //                         maxX = Math.max(maxX, x);
    //                         maxY = Math.max(maxY, y);
    //                     }
    //                 }
    //             }
    //         }
    //     }
    //
    //     const width = maxX - minX;
    //     const height = maxY - minY;
    //
    //     return {
    //         width,
    //         height,
    //         boundingBox: { minX, minY, maxX, maxY }
    //     };
    // }

    // private calculateArcSegmentIntersection(
    //     segment1: {
    //         start: IPointPostion;
    //         end: IPointPostion;
    //         isArc?: boolean;
    //         center?: IPointPostion;
    //         radius?: number;
    //     },
    //     segment2: {
    //         start: IPointPostion;
    //         end: IPointPostion;
    //         isArc?: boolean;
    //         center?: IPointPostion;
    //         radius?: number;
    //     }
    // ): IPointPostion | null {
    //     if (!segment1.isArc && !segment2.isArc) {
    //         // 两个都是直线段，使用标准直线交点计算
    //         return lineUntil.lineIntersection(
    //             segment1.start,
    //             segment1.end,
    //             segment2.start,
    //             segment2.end
    //         );
    //     }
    //
    //     if (segment1.isArc && segment1.center && segment1.radius) {
    //         if (segment2.isArc && segment2.center && segment2.radius) {
    //             const midPoint1 = {
    //                 x: (segment1.start.x + segment1.end.x) / 2,
    //                 y: (segment1.start.y + segment1.end.y) / 2
    //             };
    //
    //             const midPoint2 = {
    //                 x: (segment2.start.x + segment2.end.x) / 2,
    //                 y: (segment2.start.y + segment2.end.y) / 2
    //             };
    //
    //             return lineUntil.lineIntersection(
    //                 segment1.start,
    //                 segment1.end,
    //                 segment2.start,
    //                 segment2.end
    //             );
    //         } else {
    //             const arc = {
    //                 center: segment1.center,
    //                 radius: segment1.radius,
    //                 startPoint: segment1.start,
    //                 endPoint: segment1.end,
    //                 angle: this.calculateArcAngle(segment1.center, segment1.start, segment1.end)
    //             };
    //
    //             const line = {
    //                 start: segment2.start,
    //                 end: segment2.end
    //             };
    //
    //             const intersections = arcUntil.getArcLineIntersections(line, arc);
    //
    //             // todo
    //             return intersections.length > 0 ? intersections[0] : null;
    //         }
    //     } else if (segment2.isArc && segment2.center && segment2.radius) {
    //         // segment2是圆弧，segment1是直线
    //         const arc = {
    //             center: segment2.center,
    //             radius: segment2.radius,
    //             startPoint: segment2.start,
    //             endPoint: segment2.end,
    //             angle: this.calculateArcAngle(segment2.center, segment2.start, segment2.end)
    //         };
    //
    //         const line = {
    //             start: segment1.start,
    //             end: segment1.end
    //         };
    //
    //         const intersections = arcUntil.getArcLineIntersections(line, arc);
    //
    //         // todo
    //         return intersections.length > 0 ? intersections[0] : null;
    //     }
    //
    //     return null;
    // }

    /**
     * 计算圆弧的角度（度数）
     */
    // private calculateArcAngle(
    //     center: IPointPostion,
    //     startPoint: IPointPostion,
    //     endPoint: IPointPostion
    // ): number {
    //     // 计算起点与圆心的角度
    //     const startAngle = Math.atan2(
    //         startPoint.y - center.y,
    //         startPoint.x - center.x
    //     ) * 180 / Math.PI;
    //
    //     // 计算终点与圆心的角度
    //     const endAngle = Math.atan2(
    //         endPoint.y - center.y,
    //         endPoint.x - center.x
    //     ) * 180 / Math.PI;
    //
    //     // 计算圆弧角度
    //     let angle = endAngle - startAngle;
    //
    //     // 确保角度为正
    //     if (angle < 0) {
    //         angle += 360;
    //     }
    //
    //     return angle;
    // }


    /**
     * 计算窗户的位置和尺寸
     * @param zone 区域
     * @param sashConfigs 窗户配置
     * @param frameWidth 窗框宽度
     * @returns 窗户位置和尺寸信息
     */
    calculateSashPositions(
        zone: IZone,
        sashConfigs: ISashConfig[],
        frameWidth: number
    ): Array<{
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
    }> {
        if (!zone || !sashConfigs || sashConfigs.length === 0) return [];

        let totalRatio = 0;
        let overlapCount = 0;

        for (let i = 0; i < sashConfigs.length; i++) {
            totalRatio += sashConfigs[i].ratio;

            if (i < sashConfigs.length - 1) {
                const current = sashConfigs[i];
                const next = sashConfigs[i + 1];
                if ((current.type === 'overlap-left' && next.type === 'overlap-left') ||
                    (current.type === 'overlap-right' && next.type === 'overlap-right')) {
                    overlapCount++;
                }
            }
        }

        const totalWidth = zone.segments.reduce((max, segment) => {
            const width = Math.abs(segment.end.x - segment.start.x);
            return Math.max(max, width);
        }, 0);

        const effectiveWidth = totalWidth - (overlapCount * frameWidth);

        const sashPositions = [];
        let currentX = zone.segments[0].start.x;

        for (let i = 0; i < sashConfigs.length; i++) {
            const config = sashConfigs[i];
            const width = (config.ratio / totalRatio) * effectiveWidth;

            const leftIntersections = this.calculateSashBoundaryPoints(
                zone,
                currentX
            );

            const rightIntersections = this.calculateSashBoundaryPoints(
                zone,
                currentX + width
            );

            if (leftIntersections.length < 2 || rightIntersections.length < 2) {
                continue;
            }

            const points: IPointPostion[] = [];
            points.push(...leftIntersections, ...rightIntersections);

            let segments = [];

            if (leftIntersections.length >= 2) {
                for (let j = 0; j < leftIntersections.length - 1; j++) {
                    segments.push({
                        start: leftIntersections[j],
                        end: leftIntersections[j + 1]
                    });
                }
            }

            if (rightIntersections.length >= 2) {
                for (let j = 0; j < rightIntersections.length - 1; j++) {
                    segments.push({
                        start: rightIntersections[j],
                        end: rightIntersections[j + 1]
                    });
                }
            }

            segments.push({
                start: leftIntersections[0],
                end: rightIntersections[0]
            });

            segments.push({
                start: leftIntersections[leftIntersections.length - 1],
                end: rightIntersections[rightIntersections.length - 1]
            });
            segments = this.orderSegments(segments as any);

            const topPoint = leftIntersections[0].y < leftIntersections[leftIntersections.length - 1].y
                ? leftIntersections[0]
                : leftIntersections[leftIntersections.length - 1];

            const bottomPoint = leftIntersections[0].y > leftIntersections[leftIntersections.length - 1].y
                ? leftIntersections[0]
                : leftIntersections[leftIntersections.length - 1];

            const sashArea = {
                x: currentX,
                y: topPoint.y,
                width: width,
                height: Math.abs(bottomPoint.y - topPoint.y),
                type: config.type,
                points: points,
                segments: segments
            };

            sashPositions.push(sashArea);

            if (i < sashConfigs.length - 1 &&
                ((config.type === 'overlap-left' && sashConfigs[i + 1].type === 'overlap-left') ||
                    (config.type === 'overlap-right' && sashConfigs[i + 1].type === 'overlap-right'))) {
                currentX += width - frameWidth;
            } else {
                currentX += width;
            }
        }

        return sashPositions;
    }

    /**
     * 获取区域的最右上角点
     * @param zone 区域对象
     * @returns 最右上角的点
     */
    findTopRightPoint(zone: IZone): IPointPostion | null {
        if (!zone || (!zone.points && !zone.segments)) {
            return null;
        }

        let points: IPointPostion[] = [];

        if (zone.points && zone.points.length > 0) {
            points = [...zone.points];
        } else if (zone.segments && zone.segments.length > 0) {
            zone.segments.forEach(segment => {
                points.push(segment.start);
                points.push(segment.end);
            });
        }

        if (points.length === 0) {
            return null;
        }

        let topRightPoint = points[0];

        points.forEach(point => {
            if (point.x > topRightPoint.x ||
                (Math.abs(point.x - topRightPoint.x) < 0.0001 && point.y < topRightPoint.y)) {
                topRightPoint = point;
            }
        });

        return {
            x: Number(topRightPoint.x.toFixed(4)),
            y: Number(topRightPoint.y.toFixed(4))
        };
    }

    /**
     * 找到点最靠近的 zone 边，并返回该边向 centroid 方向平移 offset 距离后的新边
     * @param zone 区域对象
     * @param point 测试点
     * @param offset 平移距离
     * @returns 平移后的边
     */
    findNearestSegmentAndOffset(
        zone: IZone,
        point: IPointPostion,
        offset: number
    ): {
        originalSegment: ISegment;
        offsetSegment: ISegment;
        distance: number;
    } | null {
        if (!zone || !zone.segments || zone.segments.length === 0 || !zone.centroid) {
            return null;
        }
        const centroid: IPointPostion = {
            x: zone.centroid[0],
            y: zone.centroid[1]
        };

        let minDistance = Infinity;
        let closestSegment: ISegment | null = null;

        for (const segment of zone.segments) {
            let distance: number;

            if (segment.isArc && segment.center && segment.radius) {
                distance = this.getDistanceToArc(
                    point.x,
                    point.y,
                    segment.center,
                    segment.radius,
                    segment.start,
                    segment.end
                );
            } else {

                if (segment.start.x == segment.end.x) {
                    distance = Math.abs(segment.start.x - point.x);
                } else if (segment.start.y == segment.end.y) {
                    distance = Math.abs(segment.start.y - point.y);
                } else {
                    distance = lineUntil.getDistanceToLine(
                        point,
                        segment.start,
                        segment.end
                    );
                }

            }
            if (distance < minDistance) {
                minDistance = distance;
                closestSegment = segment;
            }
        }

        if (!closestSegment) {
            return null;
        }

        const offsetSegment = this.offsetSegmentTowardsCentroid(
            closestSegment,
            centroid,
            offset
        );

        return {
            originalSegment: closestSegment,
            offsetSegment: offsetSegment,
            distance: minDistance
        };
    }

    /**
     * 计算窗户边界与区域边界的交点
     */
    private calculateSashBoundaryPoints(
        zone: IZone,
        x: number
    ): IPointPostion[] {
        // 创建一个足够长的垂直线
        const extensionFactor = 10000;
        const verticalLine = {
            start: {x, y: zone.centroid[1] - extensionFactor},
            end: {x, y: zone.centroid[1] + extensionFactor}
        };

        // 计算与区域每个边的交点
        const intersections: IPointPostion[] = [];

        zone.segments.forEach(segment => {
            let intersection: IPointPostion | null = null;

            if (segment.isArc && segment.center && segment.radius) {
                // 计算与圆弧的交点
                const arc = {
                    center: segment.center,
                    radius: segment.radius,
                    startPoint: segment.start,
                    endPoint: segment.end,
                    angle: this.calculateArcAngle(segment.center, segment.start, segment.end)
                };

                const arcIntersections = arcUntil.getArcLineIntersections(
                    verticalLine,
                    arc
                );

                // 只添加在圆弧范围内的交点
                arcIntersections.forEach(point => {
                    if (arcUntil.isPointInArcRange(
                        point,
                        arc.center,
                        arc.startPoint,
                        arc.endPoint,
                        arc.angle
                    )) {
                        intersections.push(point);
                    }
                });
            } else {
                // 计算与直线段的交点
                intersection = lineUntil.lineIntersection(
                    verticalLine.start,
                    verticalLine.end,
                    segment.start,
                    segment.end
                );

                if (intersection && lineUntil.isPointOnLineSegment(
                    segment.start,
                    segment.end,
                    intersection
                )) {
                    intersections.push(intersection);
                }
            }
        });

        // 按y坐标排序交点
        return intersections.sort((a, b) => a.y - b.y);
    }

    /**
     * 根据重合点查找相关联的元素分组
     * @param overPoints 重合点列表
     * @param elements 所有元素列表
     * @returns 元素分组数组
     */
    findGroupElements(overPoints: IPointPostion[], elements: BaseFrame[]): BaseFrame[][] {
        if (!overPoints || !elements || elements.length === 0) {
            return [];
        }

        const pointToElementsMap = new Map<string, Set<string>>();
        const elementMap = new Map<string, BaseFrame>();

        overPoints.forEach(point => {
            const pointKey = `${point.x.toFixed(4)},${point.y.toFixed(4)}`;

            if (!pointToElementsMap.has(pointKey)) {
                pointToElementsMap.set(pointKey, new Set<string>());
            }
            elements.forEach(element => {
                if (!element.points) return;
                if (!(element instanceof BaseFrame)) return;
                const foundPoint = element.points.find(p =>
                    Math.abs(p.x - point.x) < 0.0001 &&
                    Math.abs(p.y - point.y) < 0.0001
                );

                if (foundPoint) {
                    pointToElementsMap.get(pointKey)?.add(element.id);
                    elementMap.set(element.id, element);
                }
            });
        });

        const elementGroups: Set<string>[] = [];
        const processedElements = new Set<string>();

        pointToElementsMap.forEach((elementIds) => {
            if (elementIds.size <= 1) return;

            let existingGroupIndex = -1;

            for (let i = 0; i < elementGroups.length; i++) {
                const group = elementGroups[i];

                const hasIntersection = Array.from(elementIds).some(id => group.has(id));
                if (hasIntersection) {
                    existingGroupIndex = i;
                    break;
                }
            }

            if (existingGroupIndex >= 0) {
                elementIds.forEach(id => {
                    elementGroups[existingGroupIndex].add(id);
                    processedElements.add(id);
                });
            } else {
                const newGroup = new Set<string>();
                elementIds.forEach(id => {
                    newGroup.add(id);
                    processedElements.add(id);
                });
                elementGroups.push(newGroup);
            }
        });

        elements.forEach(element => {
            if (!(element instanceof BaseFrame)) return;
            if (!processedElements.has(element.id)) {
                const singleGroup = new Set<string>([element.id]);
                elementGroups.push(singleGroup);
                elementMap.set(element.id, element);
            }
        });

        const result: BaseFrame[][] = [];

        elementGroups.forEach(group => {
            const groupElements: BaseFrame[] = [];

            group.forEach(id => {
                const element = elementMap.get(id);
                if (element) {
                    groupElements.push(element);
                }
            });

            if (groupElements.length > 0) {
                result.push(groupElements);
            }
        });

        return this.mergeRelatedGroups(result);
    }

    /**
     * 合并有关联的元素组
     * @param groups 元素组数组
     * @returns 合并后的元素组数组
     */
    private mergeRelatedGroups(groups: BaseFrame[][]): BaseFrame[][] {
        if (groups.length <= 1) return groups;

        let merged = true;

        while (merged) {
            merged = false;

            for (let i = 0; i < groups.length; i++) {
                for (let j = i + 1; j < groups.length; j++) {
                    // 检查两个组是否有共同元素
                    const hasCommonElement = groups[i].some(el1 =>
                        groups[j].some(el2 => el1.id === el2.id)
                    );

                    if (hasCommonElement) {
                        // 合并两个组
                        groups[i] = [...groups[i], ...groups[j].filter(el =>
                            !groups[i].some(existingEl => existingEl.id === el.id)
                        )];

                        // 移除已合并的组
                        groups.splice(j, 1);
                        merged = true;
                        break;
                    }
                }

                if (merged) break;
            }
        }

        return groups;
    }

    /**
     * 计算由segments组成的区域的中心点
     * @param segments 区域的线段数组
     * @returns 中心点坐标 {x, y}
     */
    calculateSegmentsCentroid(segments: Array<ISegment>): IPointPostion | null {
        if (!segments || segments.length === 0) {
            return null;
        }

        const orderedSegments = this.orderSegments(segments);
        if (!orderedSegments || orderedSegments.length === 0) {
            return null;
        }

        const points: IPointPostion[] = [];
        for (let i = 0; i < orderedSegments.length; i++) {
            const segment = orderedSegments[i];

            if (!segment.isArc) {
                this.addPointIfNotExists(points, segment.start);
                this.addPointIfNotExists(points, segment.end);
            }
        }

        if (points.length === 0) {
            return null;
        }

        let area = 0;
        let cx = 0;
        let cy = 0;

        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            const cross = points[i].x * points[j].y - points[j].x * points[i].y;

            area += cross;
            cx += (points[i].x + points[j].x) * cross;
            cy += (points[i].y + points[j].y) * cross;
        }

        area /= 2;

        if (Math.abs(area) < 0.00001) {
            let sumX = 0;
            let sumY = 0;

            for (const point of points) {
                sumX += point.x;
                sumY += point.y;
            }

            return {
                x: sumX / points.length,
                y: sumY / points.length
            };
        }

        cx = cx / (6 * area);
        cy = cy / (6 * area);

        if (area < 0) {
            cx = -cx;
            cy = -cy;
        }

        return {
            x: cx,
            y: cy
        };
    }

    /**
     * 计算由segments组成的区域的边界框
     * @param segments 区域的线段数组
     * @returns 边界框信息，包含宽度、高度和左上角坐标
     */
    calculateSegmentsBoundingBox(segments: Array<{
        id: string;
        start: IPointPostion;
        end: IPointPostion;
        isArc?: boolean;
        center?: IPointPostion;
        radius?: number;
    }>): {
        width: number;
        height: number;
        x: number;
        y: number;
        boundingBox: {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number
        }
    } | null {
        if (!segments || segments.length === 0) {
            return null;
        }

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const segment of segments) {
            // 处理线段的起点和终点
            minX = Math.min(minX, segment.start.x, segment.end.x);
            minY = Math.min(minY, segment.start.y, segment.end.y);
            maxX = Math.max(maxX, segment.start.x, segment.end.x);
            maxY = Math.max(maxY, segment.start.y, segment.end.y);

        }

        if (minX === Number.POSITIVE_INFINITY ||
            minY === Number.POSITIVE_INFINITY ||
            maxX === Number.NEGATIVE_INFINITY ||
            maxY === Number.NEGATIVE_INFINITY) {
            return null;
        }

        const width = maxX - minX;
        const height = maxY - minY;

        return {
            width,
            height,
            x: minX,
            y: minY,
            boundingBox: {
                minX,
                minY,
                maxX,
                maxY
            }
        };
    }

    /**
     * 计算区域 (Zone) 的宽度和高度，只考虑线段的端点和middle_point
     * @param zone 要计算的区域
     * @returns 包含宽度、高度以及边界框信息的对象
     */
    calculateZoneMaxDimensions(zone: IZone): {
        width: number;
        height: number;
        boundingBox: {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number
        }
    } {
        if (!zone || !zone.segments || zone.segments.length === 0) {
            return {
                width: 0,
                height: 0,
                boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
            };
        }

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const segment of zone.segments) {
            // 处理segments的起点和终点
            minX = Math.min(minX, segment.start.x, segment.end.x);
            minY = Math.min(minY, segment.start.y, segment.end.y);
            maxX = Math.max(maxX, segment.start.x, segment.end.x);
            maxY = Math.max(maxY, segment.start.y, segment.end.y);

            if (segment.middle_point && Array.isArray(segment.middle_point) && segment.middle_point.length >= 2) {
                const middleX = segment.middle_point[0];
                const middleY = segment.middle_point[1];

                minX = Math.min(minX, middleX);
                minY = Math.min(minY, middleY);
                maxX = Math.max(maxX, middleX);
                maxY = Math.max(maxY, middleY);
            }
        }

        if (zone.points && zone.points.length > 0) {
            for (const point of zone.points) {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            }
        }

        const width = maxX - minX;
        const height = maxY - minY;

        return {
            width,
            height,
            boundingBox: { minX, minY, maxX, maxY }
        };
    }

    /**
     * 移动区域内的所有点
     * @param zone 要移动的区域
     * @param dx x轴方向的移动距离
     * @param dy y轴方向的移动距离
     * @returns 移动后的区域
     */
    moveZone(movedZone: IZone, dx: number, dy: number): IZone {
        // const movedZone: IZone = JSON.parse(JSON.stringify(zone));
        if (movedZone.points) {
            movedZone.points = movedZone.points.map(point => ({
                x: point.x + dx,
                y: point.y + dy
            }));
        }

        if (movedZone.segments) {
            movedZone.segments = movedZone.segments.map(segment => {
                const movedSegment = {
                    ...segment,
                    start: {
                        x: segment.start.x + dx,
                        y: segment.start.y + dy
                    },
                    end: {
                        x: segment.end.x + dx,
                        y: segment.end.y + dy
                    }
                };

                if (segment.isArc && segment.center) {
                    movedSegment.center = {
                        x: segment.center.x + dx,
                        y: segment.center.y + dy
                    };
                }

                return movedSegment;
            });
        }

        if (movedZone.centroid) {
            movedZone.centroid = [
                movedZone.centroid[0] + dx,
                movedZone.centroid[1] + dy
            ];
        }

        return movedZone;
    }

    
    /**
     * 更新angle组件在半圆/圆形区域的对齐方式
     * @param oper  angle组件
     * @param zone  最近的区域
     * @param bounds  区域缩进后的边界数据  
     * @param indentSegs  区域缩进后的线段集合
     * @returns 
     */
    updateAngleOperInCircle(oper: any, zone: IZone, bounds: any, indentSegs: ISegment[]){
        const { 
            width: zoneWidth = 0, 
            height: zoneHeight = 0, 
            minX: zoneMinX = 0, 
            minY: zoneMinY = 0, 
            maxX: zoneMaxX = 0, 
            maxY: zoneMaxY = 0 
        } = bounds;
        const offset = 2;

        let seg = zone.segments.find(segment => !segment.isArc);
        //判断圆形直接返回，不做处理
        if (!seg) return;
        
        let arcSeg = indentSegs.find(seg => seg.isArc);

        //判断线段在整个区域的方位，左侧，右侧，上方，下方
        let leftCircle = seg.start.x > zone.centroid[0] && seg.end.x > zone.centroid[0];
        let rightCircle = seg.start.x < zone.centroid[0] && seg.end.x < zone.centroid[0];
        let topCircle = seg.start.y > zone.centroid[1] && seg.end.y > zone.centroid[1];
        let bottomCircle = seg.start.y < zone.centroid[1] && seg.end.y < zone.centroid[1];

        const width_equal_6 = zoneWidth / 6;    // 1/6 区域宽度
        const height_equal_4 = zoneHeight / 4;  // 1/4 区域高度
        const height_equal_6 = zoneHeight / 6;  // 1/6 区域高度
        const width_equal_4 = zoneWidth / 4;    // 1/4 区域宽度

        if (topCircle){
            //上半圆
            let intersections = [];
            if (arcSeg){
                //计算1/2水平线与圆的交点
                const interSection = lineUntil.getCircleLineIntersection(
                    arcSeg,
                    {
                        start:{
                            x: zoneMinX,
                            y: zoneMaxY - zoneHeight / 2
                        },
                        end:{
                            x: zoneMaxX,
                            y: zoneMaxY - zoneHeight / 2
                        }
                    }
                );
                if (interSection && interSection?.length > 0){
                    intersections = interSection;
                }
            }
            
            switch(oper.type){
                case OperationType.ANGLE_DOWN:
                    //zoneMinY和zoneMaxY值一样，最下面水平线
                    oper.update({
                        x: (zoneMinX + width_equal_6) + offset ,        //X为区域宽度的1/6处
                        y: (zoneMaxY - height_equal_4 * 3) + offset,    //Y为区域高度的1/4处
                        width: (width_equal_6 * 4) - offset,            //设置的宽度为区域宽度的4/6
                        height: (height_equal_4 * 3) - offset * 2       //设置高度为区域高度的3/4
                    }); 
                    break;
                case OperationType.ANGLE_UP:
                    oper.update({
                        x: zoneMinX,
                        y: zoneMinY - zoneHeight,
                        width: zoneWidth,
                        height: zoneHeight       
                    });
                    break;
                case OperationType.ANGLE_LEFT:
                case OperationType.ANGLE_RIGHT:
                    {
                        let operX = zoneMinX + width_equal_6;
                        let width = width_equal_6 * 2;
                        if (oper.type == OperationType.ANGLE_LEFT){
                            if (intersections?.length > 0){
                                operX = intersections.map(inter => inter.x).reduce((a, b) => Math.min(a, b));
                                width = zoneMinX + zoneWidth / 2 - operX;
                            }
                        } else {
                            operX = zoneMinX + zoneWidth / 2;
                            if (intersections?.length > 0){
                                let interMaxX = intersections.map(inter => inter.x).reduce((a, b) => Math.max(a, b));
                                width = interMaxX - (zoneMinX + zoneWidth / 2);
                            }
                        }
                        oper.update({
                            x: operX,
                            y: zoneMinY - zoneHeight,
                            width: width,
                            height: zoneHeight
                        });
                    }
                    break;
            }
        } else if (bottomCircle){
            //下半圆
            let intersections = [];
            if (arcSeg){
                //计算1/2水平线与圆的交点
                const interSection = lineUntil.getCircleLineIntersection(
                    arcSeg,
                    {
                        start:{
                            x: zoneMinX,
                            y: zoneMaxY + zoneHeight / 2
                        },
                        end:{
                            x: zoneMaxX,
                            y: zoneMaxY + zoneHeight / 2
                        }
                    }
                );
                if (interSection && interSection?.length > 0){
                    intersections = interSection;
                }
            }
            switch(oper.type){
                case OperationType.ANGLE_DOWN:
                    //zoneMinY和zoneMaxY的值一样，最上面水平线
                    oper.update({
                        x: zoneMinX,
                        y: zoneMinY,
                        width: zoneWidth,
                        height: zoneHeight
                    });
                    break;
                case OperationType.ANGLE_UP:
                    //zoneMinY和zoneMaxY的值一样，最上面水平线
                    oper.update({
                        x: zoneMinX + width_equal_6 + offset,
                        y: zoneMinY + offset,
                        width: (width_equal_6 * 4) - offset,           //设置的宽度为区域宽度的4/6
                        height: (height_equal_4 * 3) - offset * 2      //设置高度为区域高度的3/4    
                    });
                    break;
                case OperationType.ANGLE_LEFT:
                case OperationType.ANGLE_RIGHT:
                    {
                        let operX = zoneMinX + width_equal_6;
                        let width = width_equal_6 * 2;
                        if (oper.type == OperationType.ANGLE_RIGHT){
                            operX = zoneMinX + zoneWidth / 2;
                            if (intersections?.length > 0){
                                let interMaxX = intersections.map(inter => inter.x).reduce((a, b) => Math.max(a, b));
                                width = interMaxX - (zoneMinX + zoneWidth / 2);
                            }
                        } else {
                            if (intersections?.length > 0){
                                operX = intersections.map(inter => inter.x).reduce((a, b) => Math.min(a, b));
                                width = zoneMinX + zoneWidth / 2 - operX;
                            }
                        }
                        oper.update({
                            x: operX,
                            y: zoneMinY,
                            width: width,
                            height: zoneHeight
                        })
                    }
            }
        } else if (leftCircle){
            //左半圆
            let intersections = [];
            if (arcSeg){
                //计算1/2垂直线与圆的交点
                const interSection = lineUntil.getCircleLineIntersection(
                    arcSeg,
                    {
                        start:{
                            x: zoneMinX - zoneWidth / 2,
                            y: zoneMinY
                        },
                        end:{
                            x: zoneMaxX - zoneWidth / 2,
                            y: zoneMaxY
                        }
                    }
                );
                if (interSection && interSection?.length > 0){
                    intersections = interSection;
                }
            }
            switch(oper.type){
                case OperationType.ANGLE_DOWN:
                case OperationType.ANGLE_UP:
                    {
                        let operY = zoneMinY + height_equal_6;
                        let height = height_equal_6 * 2;
                        if (oper.type == OperationType.ANGLE_UP){
                            if (intersections?.length > 0){
                                operY = intersections.map(inter => inter.y).reduce((a, b) => Math.min(a, b));
                                height = zoneMinY + zoneHeight / 2 - operY;
                            }
                        } else {
                            operY = zoneMinY + zoneHeight / 2;
                            if (intersections?.length > 0){
                                let interMaxY = intersections.map(inter => inter.y).reduce((a, b) => Math.max(a, b));
                                height = interMaxY - (zoneMinY + zoneHeight / 2);
                            }
                        }
                        
                        oper.update({
                            x: zoneMinX - zoneWidth,
                            y: operY,
                            width: zoneWidth,
                            height: height        
                        });
                    }
                    break;
                case OperationType.ANGLE_LEFT:
                    oper.update({
                        x: zoneMinX - zoneWidth,
                        y: zoneMinY,
                        width: zoneWidth,
                        height: zoneHeight       
                    });
                    break;
                case OperationType.ANGLE_RIGHT:
                    oper.update({
                        x: zoneMinX - width_equal_4 * 3 + offset ,
                        y: zoneMinY + height_equal_6 + offset,
                        width: width_equal_4 * 3 - offset,
                        height: height_equal_6 * 4 - offset * 2       
                    });
                    break;
            }
        } else if (rightCircle){
            //右半圆
            let intersections = [];
            if (arcSeg){
                //计算1/2垂直线与圆的交点
                const interSection = lineUntil.getCircleLineIntersection(
                    arcSeg,
                    {
                        start:{
                            x: zoneMinX + zoneWidth / 2,
                            y: zoneMinY
                        },
                        end:{
                            x: zoneMaxX + zoneWidth / 2,
                            y: zoneMaxY
                        }
                    }
                );
                if (interSection && interSection?.length > 0){
                    intersections = interSection;
                }
            }
            switch(oper.type){
                case OperationType.ANGLE_DOWN:
                case OperationType.ANGLE_UP:
                    let operY = zoneMinY + height_equal_6;
                    let height = height_equal_6 * 2;

                    if (oper.type == OperationType.ANGLE_DOWN){
                        operY = zoneMinY + zoneHeight / 2;
                        if (intersections?.length > 0){
                            let interMaxY = intersections.map(inter => inter.y).reduce((a, b) => Math.max(a, b));
                            height = interMaxY - (zoneMinY + zoneHeight / 2);
                        }
                    } else {
                        if (intersections?.length > 0){
                            operY = intersections.map(inter => inter.y).reduce((a, b) => Math.min(a, b));
                            height = zoneMinY + zoneHeight / 2 - operY;
                        }
                    }

                    oper.update({
                        x: zoneMinX,
                        y: operY,
                        width: zoneWidth,
                        height: height        
                    });
                    break;
                case OperationType.ANGLE_LEFT:
                    oper.update({
                        x: zoneMinX + offset,
                        y: zoneMinY + height_equal_6 + offset,
                        width: width_equal_4 * 3 - offset * 2,
                        height: height_equal_6 * 4 - offset       
                    });
                    break;
                case OperationType.ANGLE_RIGHT:
                    oper.update({
                        x: zoneMinX,
                        y: zoneMinY,
                        width: zoneWidth,
                        height: zoneHeight       
                    });
                    break;
            }
        }
    }

    /**
     * 更新angle组件在多边形区域的对齐方式
     * @param oper  angle组件
     * @param zone  最近的区域
     * @param bounds  区域缩进后的边界数据  
     * @param indentSegs  区域缩进后的线段集合
     * @returns 
     */
    updateAngleOperInPolygon(oper: any, zone: IZone, bounds: any, indentSegs: ISegment[]){
        const { 
            width: zoneWidth = 0, 
            height: zoneHeight = 0, 
            minX: zoneMinX = 0, 
            minY: zoneMinY = 0, 
            maxX: zoneMaxX = 0, 
            maxY: zoneMaxY = 0 
        } = bounds;
        const zoneSegments = indentSegs;

        //多边形区域，可能是由矩形或者三角形拼接的,计算方法类似于带弧线的四边形区域
        //使用zoneSegments计算，zoneSegments是经过缩进后的线段集合
        //找到所有的垂直线段，左侧垂直，右侧垂直，并计算左侧垂直线段的起点和终点，如果左右两侧的线段由多条拼接而成，则计算拼接后的起点和终点
        let leftVetSegs = zoneSegments.filter((s) => s.start.x == s.end.x && Math.abs(s.start.x - zoneMinX) < 0.001);
        let rightVetSegs = zoneSegments.filter((s) => s.start.x == s.end.x && Math.abs(s.start.x - zoneMaxX) < 0.001);
        let leftVetPos: any = null, rightVetPos: any = null;

        //计算leftVetSegs 和 rightVetSegs 中所有线段中最小的x，最小的y，最大的x，最大的y，并返回一个对象，对象包含start和end两个属性，start和end都是对象，包含x和y两个属性
        //不应该以zoneMinX，zoneMaxX ，zoneMinY  zoneMaxY作为基础坐标，因为有的线段起点和终点不在这些坐标上
        //首先找到每条线段中最小的x，最小的y，最大的x，最大的y， 然后计算所有线段中最小的x，最小的y，最大的x，最大的y
        if (leftVetSegs.length > 0){
            leftVetPos = {
                start: {
                    x: Math.min(...leftVetSegs.map((s) => Math.min(s.start.x, s.end.x))),
                    y: Math.min(...leftVetSegs.map((s) => Math.min(s.start.y, s.end.y)))
                },
                end: {
                    x: Math.max(...leftVetSegs.map((s) => Math.max(s.start.x, s.end.x))),
                    y: Math.max(...leftVetSegs.map((s) => Math.max(s.start.y, s.end.y)))
                }
            }
        }
        if (rightVetSegs.length > 0){
            rightVetPos = {
                start: {
                    x: Math.min(...rightVetSegs.map((s) => Math.min(s.start.x, s.end.x))),
                    y: Math.min(...rightVetSegs.map((s) => Math.min(s.start.y, s.end.y)))
                },
                end: {
                    x: Math.max(...rightVetSegs.map((s) => Math.max(s.start.x, s.end.x))),
                    y: Math.max(...rightVetSegs.map((s) => Math.max(s.start.y, s.end.y)))
                }
            }
        }

        //找到所有的水平线段，上水平，下水平，并计算水平线段的起点和终点，如果上下两侧的线段由多条拼接而成，则计算拼接后的起点和终点
        let topHorSegs = zoneSegments.filter((s) => s.start.y == s.end.y && Math.abs(s.start.y - zoneMinY) < 0.001);
        let bottomHorSegs = zoneSegments.filter((s) => s.start.y == s.end.y && Math.abs(s.start.y - zoneMaxY) < 0.001);
        let topHorPos: any = null, bottomHorPos: any = null;

        if (bottomHorSegs.length > 0){
            bottomHorPos = {
                start: {
                    x: Math.min(...bottomHorSegs.map((s) => Math.min(s.start.x, s.end.x))),
                    y: Math.min(...bottomHorSegs.map((s) => Math.min(s.start.y, s.end.y)))
                },
                end: {
                    x: Math.max(...bottomHorSegs.map((s) => Math.max(s.start.x, s.end.x))),
                    y: Math.max(...bottomHorSegs.map((s) => Math.max(s.start.y, s.end.y)))
                }
            }
        }

        if (topHorSegs.length > 0){
            topHorPos = {
                start: {
                    x: Math.min(...topHorSegs.map((s) => Math.min(s.start.x, s.end.x))),
                    y: Math.min(...topHorSegs.map((s) => Math.min(s.start.y, s.end.y)))
                },
                end: {
                    x: Math.max(...topHorSegs.map((s) => Math.max(s.start.x, s.end.x))),
                    y: Math.max(...topHorSegs.map((s) => Math.max(s.start.y, s.end.y)))
                }
            }
        }
        console.log('######## updateAngleOper leftVetPos ', leftVetPos);
        console.log('######## updateAngleOper rightVetPos ', rightVetPos);
        console.log('######## updateAngleOper topHorPos ', topHorPos);
        console.log('######## updateAngleOper bottomHorPos ', bottomHorPos);


        switch (oper.type){
            case OperationType.ANGLE_LEFT:
                {
                    if (leftVetPos){
                        let width = zoneWidth;
                        let height = zoneHeight;
                        let operY = leftVetPos?.start?.y;
                        if (rightVetPos){
                            height = rightVetPos?.end?.y - rightVetPos?.start?.y;
                            operY = rightVetPos?.start?.y;
                        }
                        if (topHorPos && bottomHorPos){
                            //右侧为斜边,则找最短边作为宽度,
                            if (!rightVetPos){
                                let topHorWidth = topHorPos.end?.x - topHorPos?.start?.x;
                                let bottomHorWidth = bottomHorPos.end?.x - bottomHorPos?.start?.x;
                                let shortWidth = topHorWidth < bottomHorWidth ? topHorWidth : bottomHorWidth;
                                width = shortWidth;
                            }
                        }
                        oper.update({
                            x: leftVetPos?.start?.x,
                            y: operY,
                            width: width,
                            height: height
                        })
                    } else {
                        //左侧没有垂直线段，则找水平线段作为宽度，后续可定制化对齐方式
                        if (topHorPos && bottomHorPos){
                            let operX = topHorPos?.start?.x;
                            let topHorWidth = topHorPos.end?.x - topHorPos?.start?.x;
                            let bottomHorWidth = bottomHorPos.end?.x - bottomHorPos?.start?.x;
                            let width = topHorWidth < bottomHorWidth ? topHorWidth : bottomHorWidth;
                            if (rightVetPos){
                                //左侧为斜线段，右侧为垂线段,则X的坐标要放置在斜线的终点上
                                let offset = Math.abs(topHorPos?.start?.x - bottomHorPos?.start?.x);
                                width = zoneWidth - ( offset / 2);
                                operX = zoneMinX + offset / 2;
                            }
                            oper.update({
                                x: operX,
                                y: topHorPos?.start?.y,
                                width: width,
                                height: zoneHeight
                            })
                        }
                        
                    }
                    
                }
                break;
            case OperationType.ANGLE_RIGHT:
                {
                    if (leftVetPos){
                        let width = zoneWidth;
                        let height = leftVetPos?.end?.y - leftVetPos?.start?.y;
                        let operY = leftVetPos?.start?.y;
                        if (topHorPos && bottomHorPos){
                            //右侧为斜边
                            if (!rightVetPos){
                                let offset = Math.abs(topHorPos?.end?.x - bottomHorPos?.end?.x);
                                width = zoneWidth - ( offset / 2);
                            }
                        }
                        oper.update({
                            x: leftVetPos?.start?.x,
                            y: operY,
                            width: width,
                            height: height
                        })
                    } else {
                        //左侧没有垂直线段，则找水平线段作为宽度，后续可定制化对齐方式
                        if (topHorPos && bottomHorPos){
                            let topHorWidth = topHorPos.end?.x - topHorPos?.start?.x;
                            let bottomHorWidth = bottomHorPos.end?.x - bottomHorPos?.start?.x;
                            let shortWidth = topHorWidth < bottomHorWidth ? topHorWidth : bottomHorWidth;
                            
                            oper.update({
                                x: Math.max(topHorPos?.start?.x, bottomHorPos?.start?.x),
                                y: topHorPos?.start?.y,
                                width: shortWidth,
                                height: zoneHeight
                            })
                        } 
                    }
                }
                break;
            case OperationType.ANGLE_DOWN:
                {
                    if (leftVetPos){
                        let width = zoneWidth;
                        let height = zoneHeight;
                        let operY = leftVetPos?.start?.y;
                        if (rightVetPos){
                            //取左右两条垂直线段中最大的y
                            operY = Math.max(leftVetPos?.start?.y, rightVetPos?.start?.y);
                            height = leftVetPos?.start?.y > rightVetPos?.start?.y ? (leftVetPos?.end?.y - leftVetPos?.start?.y) : (rightVetPos?.end?.y - rightVetPos?.start?.y);
                        }
                        
                        if (topHorPos){
                            width = topHorPos.end?.x - topHorPos?.start?.x;
                        }

                        oper.update({
                            x: leftVetPos?.start?.x,
                            y: operY,
                            width: width,
                            height: height
                        })
                    } else {
                        //左侧没有垂直线段，则找topHorPos水平线段作为宽度，后续可定制化对齐方式
                        if (topHorPos && bottomHorPos){
                            let topHorWidth = topHorPos.end?.x - topHorPos?.start?.x;
                            oper.update({
                                x: topHorPos?.start?.x,
                                y: topHorPos?.start?.y,
                                width: topHorWidth,
                                height: zoneHeight
                            })
                        } 
                    }
                }
                break;
            case OperationType.ANGLE_UP:
                {
                    if (leftVetPos){
                        let width = zoneWidth;
                        let height = zoneHeight;
                        if (rightVetPos){
                            //右侧为垂线段，则判断左右两侧起点x是否相等，如果不想等
                            let offset = Math.abs(leftVetPos?.start?.y - rightVetPos?.start?.y);
                            if (offset > 0){
                                height = zoneHeight - ( offset / 2);
                            }
                        }
                        if (bottomHorPos){
                            width = bottomHorPos.end?.x - bottomHorPos?.start?.x;
                        }
                        oper.update({
                            x: leftVetPos?.start?.x,
                            y: zoneMaxY - height,
                            width: width,
                            height: height
                        })
                    } else {
                        //左侧没有垂直线段，则bottomHorPos水平线段作为宽度，后续可定制化对齐方式
                        if (topHorPos && bottomHorPos){
                            let bottomHorWidth = bottomHorPos.end?.x - bottomHorPos?.start?.x;
                            
                            oper.update({
                                x: bottomHorPos?.start?.x,
                                y: topHorPos?.start?.y,
                                width: bottomHorWidth,
                                height: zoneHeight
                            })
                        } 
                    }
                    
                }
                
                break;
        }
                
    }
}

const zoneUntil = new ZoneUntil();
export default zoneUntil;