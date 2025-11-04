import { IPointPostion } from "../datas";
import lineUntil from "./lineUntil";

class TriangleUntil {

    /**
     * 计算三角形内部顶点
     * Calculate inner vertices of triangle with line width offset
     */
    calculateTriangleInnerVertices(
        vertices: IPointPostion[],
        lineWidth: number,
        flip: boolean,
    ): IPointPostion[] {
        if (vertices.length !== 3) {
            throw new Error("Invalid vertices count for triangle");
        }

        const centroid = {
            x: (vertices[0].x + vertices[1].x + vertices[2].x) / 3,
            y: (vertices[0].y + vertices[1].y + vertices[2].y) / 3
        };

        // 计算向内偏移的平行线
        const getParallelLineTowardsInterior = (start: IPointPostion, end: IPointPostion, distance: number) => {
            // 计算边的向量
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            
            // 计算单位法向量
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length === 0) return { start, end }; // 防止除以零
            
            let normalX = -dy / length;
            let normalY = dx / length;
            
            // 计算法向量指向内部还是外部
            // 向量 (normalX, normalY) 与向量 (中心 - 边中点) 点积为正，表示指向内部
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            const toCentroidX = centroid.x - midX;
            const toCentroidY = centroid.y - midY;
            
            const dotProduct = normalX * toCentroidX + normalY * toCentroidY;
            
            // 如果点积为负，法向量指向外部，需要反转
            if (dotProduct < 0) {
                normalX = -normalX;
                normalY = -normalY;
            }
            
            // 应用flip参数来反转偏移方向（如果需要）
            const offsetMultiplier = flip ? -1 : 1;
            
            return {
                start: {
                    x: start.x + normalX * distance * offsetMultiplier,
                    y: start.y + normalY * distance * offsetMultiplier
                },
                end: {
                    x: end.x + normalX * distance * offsetMultiplier,
                    y: end.y + normalY * distance * offsetMultiplier
                }
            };
        };

        // 为三角形的每条边计算平行线
        const parallelLines = [
            getParallelLineTowardsInterior(vertices[0], vertices[1], lineWidth),
            getParallelLineTowardsInterior(vertices[1], vertices[2], lineWidth),
            getParallelLineTowardsInterior(vertices[2], vertices[0], lineWidth)
        ];

        // 计算平行线的交点
        const innerVertices = [];
        for (let i = 0; i < 3; i++) {
            const preIndex = i - 1 < 0 ? 2 : i - 1
            // const nextIndex = (i + 1) % 3;
            const line1 = parallelLines[preIndex];
            const line2 = parallelLines[i];
            const intersection = lineUntil.lineIntersection(
                line1.start,
                line1.end,
                line2.start,
                line2.end
            );
            if (intersection) {
                innerVertices.push(intersection);
            }
        }

        return innerVertices;
    }

    private normalizeVector(vector: { x: number; y: number }) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        return {
            x: vector.x / length,
            y: vector.y / length
        };
    }

    /**
     * 计算单个内部顶点
     * Calculate single inner point for a triangle vertex
     */
    calculateInnerPoint(
        currentVertex: IPointPostion,
        nextVertex: IPointPostion,
        prevVertex: IPointPostion,
        lineWidth: number
    ): IPointPostion {
        // 计算当前顶点相邻的两条边的平行线
        const getParallelLinePoints = (start: IPointPostion, end: IPointPostion, distance: number) => {
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            
            const length = Math.sqrt(dx * dx + dy * dy);
            const normalX = -dy / length;
            const normalY = dx / length;
            
            return {
                start: {
                    x: start.x + normalX * distance,
                    y: start.y + normalY * distance
                },
                end: {
                    x: end.x + normalX * distance,
                    y: end.y + normalY * distance
                }
            };
        };

        // 计算两条相邻边的平行线
        const nextEdgeParallel = getParallelLinePoints(currentVertex, nextVertex, lineWidth);
        const prevEdgeParallel = getParallelLinePoints(prevVertex, currentVertex, lineWidth);

        // 计算平行线的交点，即为内部顶点
        const intersection = lineUntil.lineIntersection(
            prevEdgeParallel.start,
            prevEdgeParallel.end,
            nextEdgeParallel.start,
            nextEdgeParallel.end
        );

        return intersection || {
            x: currentVertex.x,
            y: currentVertex.y
        };
    }

    calculateRemoveLineHighlightArea(
        outerVertices: IPointPostion[],
        innerVertices: IPointPostion[],
        edgeIndex: number
    ): IPointPostion[] {
        if (outerVertices.length !== 3 || innerVertices.length !== 3) {
            throw new Error("Invalid vertices count for triangle");
        }
        const currentIndex = edgeIndex;
        const nextIndex = (edgeIndex + 1) % 3;
        const oppositeIndex = (edgeIndex + 2) % 3;
        const outerStart = outerVertices[currentIndex];
        const outerEnd = outerVertices[nextIndex];

        const innerStart = innerVertices[currentIndex];
        const innerEnd = innerVertices[nextIndex];

        const oppositeInner = innerVertices[oppositeIndex];

        const getExtendedPoint = (from: IPointPostion, to: IPointPostion, factor: number = 100): IPointPostion => {
            // 计算方向向量
            const dirX = to.x - from.x;
            const dirY = to.y - from.y;
            
            return {
                x: from.x + dirX * factor, 
                y: from.y + dirY * factor
            };
        };

        const lineCA = {
            start: oppositeInner,
            end: getExtendedPoint(oppositeInner, innerStart, 100)
        };
        
        const lineCB = {
            start: oppositeInner,
            end: getExtendedPoint(oppositeInner, innerEnd, 100)
        };
        // 计算交点
        const intersectionCA = lineUntil.getIntersectionPoint(
            lineCA.start, 
            lineCA.end,
            outerStart, 
            outerEnd
        );

        const intersectionCB = lineUntil.getIntersectionPoint(
            lineCB.start, 
            lineCB.end,
            outerStart, 
            outerEnd
        );
        if (!intersectionCA || !intersectionCB) {
            return [
                outerStart,
                outerEnd,
                innerEnd,
                innerStart
            ];
        }

        return [
            intersectionCA,
            intersectionCB,
            innerEnd,
            innerStart
        ];
    }

    calculateAllRemoveLineHighlightAreas(
        outerVertices: IPointPostion[],
        innerVertices: IPointPostion[]
    ): Array<Array<IPointPostion>> {
        const highlightAreas = [];

        for (let i = 0; i < 3; i++) {
            highlightAreas.push(
                this.calculateRemoveLineHighlightArea(outerVertices, innerVertices, i)
            );
        }

        return highlightAreas;
    }

    pointsToPath(points: IPointPostion[]): string {
        if (!points || points.length < 3) return "";

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
        }

        path += " Z";

        return path;
    }

    calculateTriangleAngles(vertices: IPointPostion[]): number[] {
        if (vertices.length !== 3) {
            throw new Error("Invalid vertices count for triangle");
        }

        const angles = [];
        
        for (let i = 0; i < 3; i++) {
            const current = vertices[i];
            const next = vertices[(i + 1) % 3];
            const prev = vertices[(i + 2) % 3];
            
            // 计算两条边的向量
            const vector1 = {
                x: next.x - current.x,
                y: next.y - current.y
            };
            
            const vector2 = {
                x: prev.x - current.x,
                y: prev.y - current.y
            };
            
            // 计算向量的长度
            const length1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
            const length2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
            
            // 计算点积
            const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
            
            // 使用点积公式计算角度：cos(θ) = (a·b)/(|a|·|b|)
            const cosAngle = dotProduct / (length1 * length2);
            
            const angleInDegrees = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
            
            angles.push(Number(angleInDegrees.toFixed(2)));
        }
        
        return angles;
    }

    /**
     * 计算重叠空边的内顶点交点
     * Calculate intersection points for overlapping empty edges between two elements
     */
    calculateOverlappingEdgeIntersection(
        elementA: any,
        elementB: any,
        edgeIndexA: number,
        edgeIndexB: number,
        threshold: number = 1
    ): { pointAIntersection: IPointPostion | null, pointBIntersection: IPointPostion | null } {
        // 获取三角形或矩形的点信息
        const getElementInfo = (element: any, edgeIndex: number) => {
            const isTriangle = element.type === "Triangle";
            const isRectangle = element.type === "Rectangle" || element.virtualFrame && element.points.length === 4;
            
            if (!isTriangle && !isRectangle) {
                return null;
            }
            
            const outerPoints = element.points;
            // 对于三角形使用 contentPoints，对于矩形使用 innerPoints
            const innerPoints = element.contentPoints || element.innerPoints;
            
            if (!outerPoints || !innerPoints) {
                return null;
            }
            
            const pointCount = outerPoints.length;
            
            // 当前边的起点和终点的索引
            const startIndex = edgeIndex;
            const endIndex = (edgeIndex + 1) % pointCount;
            
            // 当前边的外部顶点
            const outerStart = outerPoints[startIndex];
            const outerEnd = outerPoints[endIndex];
            
            // 当前边的内部顶点
            const innerStart = innerPoints[startIndex];
            const innerEnd = innerPoints[endIndex];
            
            // 根据图形类型获取不同的对应点
            if (isTriangle) {
                // 三角形对应的是对边的点
                const oppositeIndex = (edgeIndex + 2) % 3;
                const innerOpposite = innerPoints[oppositeIndex];
                
                return {
                    isTriangle,
                    outerStart,
                    outerEnd,
                    innerStart,
                    innerEnd,
                    innerOpposite,
                    startIndex,
                    endIndex
                };
            } else {
                // 矩形对应的是相邻的点
                const prevIndex = (startIndex - 1 + pointCount) % pointCount;
                const nextIndex = (endIndex + 1) % pointCount;
                
                const innerPrev = innerPoints[prevIndex];
                const innerNext = innerPoints[nextIndex];
                
                return {
                    isTriangle: false,
                    isRectangle: true,
                    outerStart,
                    outerEnd,
                    innerStart,
                    innerEnd,
                    innerPrev,
                    innerNext,
                    startIndex,
                    endIndex
                };
            }
        };
        
        // 获取两个元素的信息
        const infoA = getElementInfo(elementA, edgeIndexA);
        const infoB = getElementInfo(elementB, edgeIndexB);
        
        if (!infoA || !infoB) {
            return { pointAIntersection: null, pointBIntersection: null };
        }
        
        // 检查顶点距离差值
        const checkDistanceDifference = () => {
            // 计算内外点距离
            const distA1 = this.getDistance(infoA.outerStart, infoA.innerStart);
            const distA2 = this.getDistance(infoA.outerEnd, infoA.innerEnd);
            const distB1 = this.getDistance(infoB.outerStart, infoB.innerStart);
            const distB2 = this.getDistance(infoB.outerEnd, infoB.innerEnd);
            
            // 计算差值比例
            const diffRatio1 = Math.abs(distA1 - distB1) / Math.max(distA1, distB1, 0.0001);
            const diffRatio2 = Math.abs(distA2 - distB2) / Math.max(distA2, distB2, 0.0001);
            
            // 如果差值在阈值范围内，则不需要重新计算
            return diffRatio1 <= threshold && diffRatio2 <= threshold;
        };
        
        // 如果顶点距离差值在阈值范围内，不进行重新计算
        if (checkDistanceDifference()) {
            return { pointAIntersection: null, pointBIntersection: null };
        }

        // 计算第一个点的交点
        let pointAIntersection = null;
        let pointBIntersection = null;
        
        // 为三角形和矩形计算边的延长线
        const getExtendedLines = (info: any, isStart: boolean) => {
            if (info.isTriangle) {
                // 三角形：从内部对边点到当前边内部点的线
                const innerPoint = isStart ? info.innerStart : info.innerEnd;
                return {
                    start: info.innerOpposite,
                    end: innerPoint
                };
            } else {
                // 矩形：相邻点到当前点的线
                if (isStart) {
                    return {
                        start: info.innerPrev,
                        end: info.innerStart
                    };
                } else {
                    return {
                        start: info.innerNext,
                        end: info.innerEnd
                    };
                }
            }
        };
        
        // 获取延长线
        const lineA1 = getExtendedLines(infoA, true);  // 对应点A与X重合
        const lineB1 = getExtendedLines(infoB, true);
        
        const lineA2 = getExtendedLines(infoA, false); // 对应点B与Y重合
        const lineB2 = getExtendedLines(infoB, false);
        
        // 添加判断点是否在多边形内部的辅助函数
        const isPointInPolygon = (point: IPointPostion, vertices: IPointPostion[]): boolean => {
            let inside = false;
            for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
                const xi = vertices[i].x, yi = vertices[i].y;
                const xj = vertices[j].x, yj = vertices[j].y;
                
                const intersect = ((yi > point.y) !== (yj > point.y))
                    && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        };

        // 修改计算延长线交点的函数
        const calculateExtendedIntersection = (lineFrom: any, lineTo: any) => {
            // 获取两个元素的内部点集合
            const innerPointsA = infoA.isTriangle ? 
                elementA.contentPoints : 
                elementA.innerPoints || elementA.contentPoints;
            
            const innerPointsB = infoB.isTriangle ? 
                elementB.contentPoints : 
                elementB.innerPoints || elementB.contentPoints;

            // 尝试找到第一个交点
            const extendedFrom = this.getExtendedLine(lineFrom.start, lineFrom.end, 1000);
            let intersection = lineUntil.getIntersectionPoint(
                extendedFrom.start,
                extendedFrom.end,
                lineTo.start,
                lineTo.end
            );
            
            // 如果找到第一个交点，检查是否在任一元素内部
            if (intersection) {
                const isInsideA = isPointInPolygon(intersection, elementA.points);
                const isInsideB = isPointInPolygon(intersection, elementB.points);
                
                if (isInsideA || isInsideB) {
                    return intersection;
                }
            }
            
            // 如果第一个交点不在内部，尝试找第二个交点
            const extendedTo = this.getExtendedLine(lineTo.start, lineTo.end, 1000);
            intersection = lineUntil.getIntersectionPoint(
                lineFrom.start,
                lineFrom.end,
                extendedTo.start,
                extendedTo.end
            );
            
            // 如果找到第二个交点，检查是否在任一元素内部
            if (intersection) {
                const isInsideA = isPointInPolygon(intersection, innerPointsA);
                const isInsideB = isPointInPolygon(intersection, innerPointsB);
                
                if (isInsideA || isInsideB) {
                    return intersection;
                }
            }
            
            // 如果都不在内部，返回null
            return null;
        };
        
        // 计算两个交点
        pointAIntersection = calculateExtendedIntersection(lineA1, lineB1);
        pointBIntersection = calculateExtendedIntersection(lineA2, lineB2);

        return { pointAIntersection, pointBIntersection };
    }
    
    /**
     * 计算两点之间的距离
     * Calculate distance between two points
     */
    getDistance(point1: IPointPostion, point2: IPointPostion): number {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 获取线段的延长线
     * Get extended line from a segment
     */
    getExtendedLine(start: IPointPostion, end: IPointPostion, extendFactor: number): {
        start: IPointPostion;
        end: IPointPostion;
    } {
        // 计算方向向量
        const dirX = end.x - start.x;
        const dirY = end.y - start.y;
        
        // 计算延长后的终点
        const extendedEnd = {
            x: end.x + dirX * extendFactor,
            y: end.y + dirY * extendFactor
        };
        
        return {
            start: start,
            end: extendedEnd
        };
    }

    /**
     * 计算三点形成的角度（在P点的角度）
     * @param {IPointPostion} P 顶点
     * @param {IPointPostion} Q 相邻点1
     * @param {IPointPostion} R 相邻点2
     * @returns {number} 角度（度）
     */
    calculateAngle(P:IPointPostion, Q:IPointPostion, R:IPointPostion): number {
        // 向量PQ和PR
        const pqx = Q.x - P.x;
        const pqy = Q.y - P.y;
        const prx = R.x - P.x;
        const pry = R.y - P.y;
        
        // 点积和模长
        const dotProduct = pqx * prx + pqy * pry;
        const lenPQ = Math.sqrt(pqx * pqx + pqy * pqy);
        const lenPR = Math.sqrt(prx * prx + pry * pry);
        
        // 计算夹角（弧度转度）
        const cosAngle = Math.max(-1, Math.min(1, dotProduct / (lenPQ * lenPR || 0.001)));
        return Number((Math.acos(cosAngle) * 180 / Math.PI).toFixed(2));
    }

    /**
     * 计算三角形面积（海伦公式）
     * @param {IPointPostion} P 点1
     * @param {IPointPostion} Q 点2
     * @param {IPointPostion} R 点3
     * @returns {number} 面积
     */
    calculateTriangleArea(P:IPointPostion, Q:IPointPostion, R:IPointPostion):number {
        const a = this.getDistance(Q, R);
        const b = this.getDistance(P, R);
        const c = this.getDistance(P, Q);
        const s = (a + b + c) / 2; // 半周长
        return Math.sqrt(s * (s - a) * (s - b) * (s - c)); // 海伦公式
    }

    /**
     * 第三点关于基准边的镜像（确保同侧）
     * @param {IPointPostion} targetV 目标顶点
     * @param {IPointPostion} baseAdj 基准边的一个端点
     * @param {IPointPostion} thirdPoint 第三点
     * @returns {IPointPostion} 镜像点坐标
     */
    mirrorOverBaseEdge(targetV:IPointPostion, baseAdj:IPointPostion, thirdPoint:IPointPostion):IPointPostion {
        const baseVec = { x: baseAdj.x - targetV.x, y: baseAdj.y - targetV.y };
        const thirdVec = { x: thirdPoint.x - targetV.x, y: thirdPoint.y - targetV.y };
        // 计算第三点在基准边上的投影
        const t = (thirdVec.x * baseVec.x + thirdVec.y * baseVec.y) / (baseVec.x * baseVec.x  + baseVec.y * baseVec.y  + 1e-6);
        const projection = {
            x: targetV.x + t * baseVec.x,
            y: targetV.y + t * baseVec.y
        };
        // 镜像点 = 2*投影 - 原始点（对称于基准边）
        return {
            x: 2 * projection.x - thirdPoint.x,
            y: 2 * projection.y - thirdPoint.y
        };
    }

    /**
     * 计算第三点的目标角度位置（基于基准边方向）
     * @param {IPointPostion} targetV 目标顶点
     * @param {IPointPostion} baseAdj 基准边的一个端点
     * @param {IPointPostion} thirdPoint 第三点
     * @param {number} targetAngle 目标角度（度）
     * @returns {IPointPostion} 新的第三点坐标
     */
    calculateTargetPosition(targetV:IPointPostion, baseAdj:IPointPostion, thirdPoint:IPointPostion, targetAngle:number):IPointPostion {
        const targetRad = targetAngle * Math.PI / 180;
        // 基准边单位向量
        const baseVec = { x: baseAdj.x - targetV.x, y: baseAdj.y - targetV.y };
        const baseLen = Math.hypot(baseVec.x, baseVec.y) || 1e-3; // 避免除以0
        const unitBase = { x: baseVec.x / baseLen, y: baseVec.y / baseLen };
        // 垂直于基准边的单位向量（逆时针）
        const unitPerp = { x: -unitBase.y, y: unitBase.x };
        // 保持第三点到目标顶点的原始距离（先不考虑面积）
        const thirdLen = Math.hypot(thirdPoint.x - targetV.x, thirdPoint.y - targetV.y);
        // 计算新坐标（极坐标转笛卡尔坐标）
        return {
            x: targetV.x + thirdLen * (unitBase.x * Math.cos(targetRad) - unitPerp.x * Math.sin(targetRad)),
            y: targetV.y + thirdLen * (unitBase.y * Math.cos(targetRad) - unitPerp.y * Math.sin(targetRad))
        };
    }

     /**
     * 微调角度至精确值（迭代修正）
     * 微调第三点位置使得角度接近目标值
     * @param {IPointPostion} targetV 目标顶点
     * @param {IPointPostion} baseAdj 基准边的一个端点
     * @param {IPointPostion} thirdPoint 第三点
     * @param {number} targetAngle 目标角度（度）
     * @returns {IPointPostion} 调整后的第三点坐标
     */
    fineTuneAngle(targetV:IPointPostion, baseAdj:IPointPostion, thirdPoint:IPointPostion, targetAngle:number):IPointPostion {
        let current = { ...thirdPoint };
        const maxIter = 5; // 最多5次迭代
        for (let i = 0; i < maxIter; i++) {
            const currentAngle = this.calculateAngle(targetV, baseAdj, current);
            const diff = targetAngle - currentAngle;
            if (Math.abs(diff) <= 0.05) break; // 误差≤0.05°即停止
            // 计算修正旋转角度（按偏差的80%修正，避免超调）
            const rotateRad = diff * Math.PI / 180 * 0.8;
            // 旋转第三点向量（围绕目标顶点）
            const vec = { x: current.x - targetV.x, y: current.y - targetV.y };
            const len = Math.hypot(vec.x, vec.y) || 1e-3;
            const angle = Math.atan2(vec.y, vec.x) + rotateRad;
            current = {
                x: targetV.x + len * Math.cos(angle),
                y: targetV.y + len * Math.sin(angle)
            };
        }
        return current;
    }

    /**
     * 面积补偿（仅缩放第三点距离，不改变方向）
     * 补偿第三点位置以保持三角形面积接近原始值
     * @param {IPointPostion} targetV 目标顶点
     * @param {IPointPostion} baseAdj 基准边的一个端点
     * @param {IPointPostion} thirdPoint 第三点
     * @param {number} originalArea 原始三角形面积
     * @param {number} stability 稳定性系数（0-1，0.5为中性）
     * @returns {Object} 调整后的第三点坐标
     */
    compensateArea(targetV:IPointPostion, baseAdj:IPointPostion, thirdPoint:IPointPostion, originalArea:number, stability:number):IPointPostion {
        const currentArea = this.calculateTriangleArea(targetV, baseAdj, thirdPoint);
        if (currentArea < 1e-6) return thirdPoint; // 避免除以0
        // 面积比例（原始/当前），缩放因子为平方根（面积∝边长²）
        const scale = 1 + (Math.sqrt(originalArea / currentArea) - 1) * stability;
        // 限制缩放范围（避免极端值）
        const safeScale = Math.max(0.3, Math.min(3, scale));
        // 缩放第三点向量（保持方向，仅改变长度）
        const vec = { x: thirdPoint.x - targetV.x, y: thirdPoint.y - targetV.y };
        return {
            x: targetV.x + vec.x * safeScale,
            y: targetV.y + vec.y * safeScale
        };
    }

    /**
     * 面积补偿（保持A3在基准边上的投影比例，仅调整高）
     * @param {IPointPostion} targetV 目标顶点
     * @param {IPointPostion} baseAdj 基准边的一个端点
     * @param {IPointPostion} thirdPoint 第三点
     * @param {number} originalArea 原始三角形面积
     * @returns {IPointPostion} 调整后的第三点坐标
     */
    compensateAreaByHeight(
        targetV: IPointPostion,
        baseAdj: IPointPostion,
        thirdPoint: IPointPostion,
        originalArea: number
    ): IPointPostion {
        // 基准边向量
        const baseVec = { x: baseAdj.x - targetV.x, y: baseAdj.y - targetV.y };
        const baseLen = Math.hypot(baseVec.x, baseVec.y) || 1e-6;
        // 单位向量
        const unitBase = { x: baseVec.x / baseLen, y: baseVec.y / baseLen };
        // 单位法向量（逆时针）
        const unitPerp = { x: -unitBase.y, y: unitBase.x };

        // 计算第三点到targetV的向量
        const thirdVec = { x: thirdPoint.x - targetV.x, y: thirdPoint.y - targetV.y };
        // 在基准边上的投影比例t
        const t = (thirdVec.x * unitBase.x + thirdVec.y * unitBase.y) / baseLen;
        // 在法向量方向上的符号
        const sign = Math.sign(thirdVec.x * unitPerp.x + thirdVec.y * unitPerp.y) || 1;

        // 目标高
        const targetHeight = (2 * originalArea) / baseLen;

        // 新第三点 = targetV + baseVec * t + unitPerp * targetHeight * sign
        return {
            x: targetV.x + baseVec.x * t + unitPerp.x * targetHeight * sign,
            y: targetV.y + baseVec.y * t + unitPerp.y * targetHeight * sign
        };
    }
}

const triangleUntil: TriangleUntil = new TriangleUntil();
export default triangleUntil;
