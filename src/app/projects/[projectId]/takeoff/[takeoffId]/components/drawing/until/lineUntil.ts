import { IPointPostion } from "../datas";
import { ILine } from "../data/baseFrame";
import { HorizontalLineWindow, VerticalLineWindow } from "../data/shape/line";

class LineUntil {
  isVertical(line: ILine): boolean {
    if (!line) return false;

    return line.startPoint.x === line.endPoint.x;
  }

  isHorizontal(line: ILine): boolean {
    if (!line) return false;
    return line.startPoint.y === line.endPoint.y;
  }

  direction(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
  ): number {
    return (x3 - x1) * (y2 - y1) - (x2 - x1) * (y3 - y1);
  }

  onSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    px: number,
    py: number
  ): boolean {
    return (
      px >= Math.min(x1, x2) &&
      px <= Math.max(x1, x2) &&
      py >= Math.min(y1, y2) &&
      py <= Math.max(y1, y2)
    );
  }

  // 判断两条线段是否相交
  doLinesIntersect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ): boolean {
    // 计算方向
    const d1 = this.direction(x3, y3, x4, y4, x1, y1);
    const d2 = this.direction(x3, y3, x4, y4, x2, y2);
    const d3 = this.direction(x1, y1, x2, y2, x3, y3);
    const d4 = this.direction(x1, y1, x2, y2, x4, y4);

    // 如果两线段相交,它们的方向必须相反
    if (
      ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
    ) {
      return true;
    }

    // 检查共线的情况
    if (d1 === 0 && this.onSegment(x3, y3, x4, y4, x1, y1)) return true;
    if (d2 === 0 && this.onSegment(x3, y3, x4, y4, x2, y2)) return true;
    if (d3 === 0 && this.onSegment(x1, y1, x2, y2, x3, y3)) return true;
    if (d4 === 0 && this.onSegment(x1, y1, x2, y2, x4, y4)) return true;

    return false;
  }

  /**
   * 计算线段长度
   */
  calculateLineLength(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * 判断两条线是否平行且等长
   */
  areParallelAndEqual(
    line1: ILine | any,
    line2: ILine | any,
    tolerance: number = 0.1
  ): boolean {
    if (!line1.lineInfo || !line2.lineInfo) return false;

    // 首先判断是否平行
    if (!this.areLinesParallel(line1.lineInfo, line2.lineInfo)) {
      return false;
    }

    // 计算两条线的长度
    const length1 = this.calculateLineLength(
      line1.lineInfo.x1,
      line1.lineInfo.y1,
      line1.lineInfo.x2,
      line1.lineInfo.y2
    );
    const length2 = this.calculateLineLength(
      line2.lineInfo.x1,
      line2.lineInfo.y1,
      line2.lineInfo.x2,
      line2.lineInfo.y2
    );

    // 比较长度是否相等(允许一定误差)
    return Math.abs(length1 - length2) <= tolerance;
  }

  calculateAngleBetweenPoints(
    point1: IPointPostion,
    point2: IPointPostion,
    point3: IPointPostion
  ): number {
    const vector1 = {
      x: point1.x - point2.x,
      y: point1.y - point2.y,
    };
    const vector2 = {
      x: point3.x - point2.x,
      y: point3.y - point2.y,
    };

    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2);
    const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2);

    const angle =
      Math.acos(dotProduct / (magnitude1 * magnitude2)) * (180 / Math.PI);
    return angle;
  }

  areLinesParallel(
    line1: any,
    line2: any
  ): boolean {
    if (!line1 || !line2) return false;
    if (this.isVertical(line1) && this.isVertical(line2)) return true;
    if (this.isHorizontal(line1) && this.isHorizontal(line2)) return true;

    // 通用斜率比较
    const slope1 = (line1.y2 - line1.y1) / (line1.x2 - line1.x1);
    const slope2 = (line2.y2 - line2.y1) / (line2.x2 - line2.x1);

    return slope1 === slope2;
  }

  calculateBounds(vertexs: Array<IPointPostion>) {
    if (!vertexs?.length) {
      throw new Error("containerVertex is empty");
    }

    let maxX = -Infinity;
    let maxY = -Infinity;
    let minX = Infinity;
    let minY = Infinity;

    vertexs.forEach((point) => {
      if (point.x > maxX) maxX = point.x;
      if (point.x < minX) minX = point.x;
      if (point.y > maxY) maxY = point.y;
      if (point.y < minY) minY = point.y;
    });

    return { maxX, maxY, minX, minY };
  }

  getIntersectionPoints(
    containerPoints: Array<IPointPostion>,
    dividingLine: Array<IPointPostion>,
    side: "top" | "bottom"
  ): Array<IPointPostion> {
    const intersections: Array<IPointPostion> = [];
    const result: Array<IPointPostion> = [];

    // 1. 计算分割线与容器每条边的交点
    for (let i = 0; i < containerPoints?.length; i++) {
      const nextIndex = (i + 1) % containerPoints?.length;
      const edgeStart = containerPoints[i];
      const edgeEnd = containerPoints[nextIndex];

      const intersection = this.lineIntersection(
        dividingLine[0],
        dividingLine[1],
        edgeStart,
        edgeEnd
      );

      if (intersection) {
        intersections.push(intersection);
      }
    }

    if (intersections?.length < 2) {
      console.warn("Not enough intersection points found");
      return [];
    }

    // 2. 对交点进行排序（从左到右）
    intersections.sort((a, b) => a.x - b.x);

    // 3. 构建多边形顶点序列
    const [leftIntersection, rightIntersection] = intersections;

    // 根据side确定是使用上部还是下部的容器顶点
    const containerVertices = containerPoints.filter((point) => {
      if (side === "top") {
        return this.isPointAboveLine(point, dividingLine[0], dividingLine[1]);
      } else {
        return !this.isPointAboveLine(point, dividingLine[0], dividingLine[1]);
      }
    });

    // 按照逆时针顺序添加顶点
    if (side === "top") {
      result.push(leftIntersection);
      result.push(rightIntersection);
      result.push(
        ...this.sortPointsClockwise(
          containerVertices,
          this.getCentroid(containerPoints)
        )
      );
    } else {
      result.push(leftIntersection);
      result.push(
        ...this.sortPointsClockwise(
          containerVertices,
          this.getCentroid(containerPoints)
        )
      );
      result.push(rightIntersection);
    }

    return result;
  }

  public isSamePoint = (p1: IPointPostion, p2: IPointPostion) => {
    return Math.abs(p1.x - p2.x) < 0.001 && Math.abs(p1.y - p2.y) < 0.001;
  };

  public isLinesOverlap = (line1: ILine, line2: ILine) => {
    if (!line1.startPoint || !line1.endPoint || !line2.startPoint || !line2.endPoint) {
      return false;
    }

    const normalMatch =
        this.isSamePoint(line1.startPoint, line2.startPoint) &&
        this.isSamePoint(line1.endPoint, line2.endPoint);

    const reverseMatch =
        this.isSamePoint(line1.startPoint, line2.endPoint) &&
        this.isSamePoint(line1.endPoint, line2.startPoint);

    return normalMatch || reverseMatch;
  };

  public lineIntersection(
    p1: IPointPostion,
    p2: IPointPostion,
    p3: IPointPostion,
    p4: IPointPostion
  ): IPointPostion | null {
    const denominator =
      (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

    if (denominator === 0) {
      return null;
    }

    const ua =
      ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
      denominator;
    const ub =
      ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
      denominator;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
      return null;
    }

    return {
      x: Number(Number(p1.x + ua * (p2.x - p1.x)).toFixed(4)),
      y: Number(Number(p1.y + ua * (p2.y - p1.y)).toFixed(4)),
    };
  }

  public lineExtendIntersection(
      p1: IPointPostion,
      p2: IPointPostion,
      p3: IPointPostion,
      p4: IPointPostion
  ): IPointPostion | null {

    const line1Dir = {
      x: p2.x - p1.x,
      y: p2.y - p1.y
    };

    const line2Dir = {
      x: p4.x - p3.x,
      y: p4.y - p3.y
    }

    const extensionFactor = 10000;

    const line1Start = {
      x: p1.x - line1Dir.x * extensionFactor,
      y: p1.y - line1Dir.y * extensionFactor
    };

    const line1End = {
      x: p2.x + line1Dir.x * extensionFactor,
      y: p2.y + line1Dir.y * extensionFactor
    };

    const line2Start = {
      x: p3.x - line2Dir.x * extensionFactor,
      y: p3.y - line2Dir.y * extensionFactor
    };

    const line2End = {
      x: p4.x + line2Dir.x * extensionFactor,
      y: p4.y + line2Dir.y * extensionFactor
    };

    return this.lineIntersection( line1Start, line1End, line2Start, line2End )

  }

  // 判断点是否在线的上方
  private isPointAboveLine(
    point: IPointPostion,
    lineStart: IPointPostion,
    lineEnd: IPointPostion
  ): boolean {
    return (
      (lineEnd.x - lineStart.x) * (point.y - lineStart.y) -
        (lineEnd.y - lineStart.y) * (point.x - lineStart.x) >
      0
    );
  }

  getCentroid(points: Array<IPointPostion>): IPointPostion {
    const len = points?.length;
    let sumX = 0;
    let sumY = 0;

    points.forEach((point) => {
      sumX += point.x;
      sumY += point.y;
    });

    return {
      x: sumX / len,
      y: sumY / len,
    };
  }

  // 按顺时针顺序排序点
  sortPointsClockwise(
    points: Array<IPointPostion>,
    center: IPointPostion
  ): Array<IPointPostion> {
    return points.sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x);
      const angleB = Math.atan2(b.y - center.y, b.x - center.x);
      // 改为从大到小排序，实现顺时针方向
      return angleB - angleA;
    });
  }

  calculateAngleBetweenEdges(
    point1: { x: number; y: number },
    point2: { x: number; y: number },
    point3: { x: number; y: number }
  ) {
    const vector1 = { x: point1.x - point2.x, y: point1.y - point2.y };
    const vector2 = { x: point3.x - point2.x, y: point3.y - point2.y };

    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2);
    const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2);

    const angle =
      Math.acos(dotProduct / (magnitude1 * magnitude2)) * (180 / Math.PI);
    return angle;
  }

  getInnerMidPoint(
    lineInfo: { x1: number; y1: number; x2: number; y2: number },
    centerPoint: { x: number; y: number },
    innerStart: { x: number; y: number },
    innerEnd: { x: number; y: number }
  ): { x: number; y: number } | undefined {
    // 判断centerPoint是否在直线上
    const isPointOnLine = (point: { x: number; y: number }) => {
      const precision = 0.001; // 误差范围
      const d =
        Math.abs(
          (lineInfo.y2 - lineInfo.y1) * point.x -
            (lineInfo.x2 - lineInfo.x1) * point.y +
            lineInfo.x2 * lineInfo.y1 -
            lineInfo.y2 * lineInfo.x1
        ) /
        Math.sqrt(
          Math.pow(lineInfo.y2 - lineInfo.y1, 2) +
            Math.pow(lineInfo.x2 - lineInfo.x1, 2)
        );
      return d < precision;
    };

    if (isPointOnLine(centerPoint)) {
      // 直线情况：计算innerStart和innerEnd的中点
      return {
        x: (innerStart.x + innerEnd.x) / 2,
        y: (innerStart.y + innerEnd.y) / 2,
      };
    } else {
      // 折线情况：计算两条平行线的交点
      // 计算向量1（outerStart到centerPoint）
      const vector1 = {
        x: centerPoint.x - lineInfo.x1,
        y: centerPoint.y - lineInfo.y1,
      };

      // 计算向量2（outerEnd到centerPoint）
      const vector2 = {
        x: centerPoint.x - lineInfo.x2,
        y: centerPoint.y - lineInfo.y2,
      };

      // 通过innerStart点作vector1方向的直线
      const line1 = {
        point: innerStart,
        direction: vector1,
      };

      // 通过innerEnd点作vector2方向的直线
      const line2 = {
        point: innerEnd,
        direction: vector2,
      };

      // 计算两条直线的交点
      const denominator =
        line1.direction.x * line2.direction.y -
        line1.direction.y * line2.direction.x;

      if (Math.abs(denominator) < 0.001) {
        return undefined; // 平行线无交点
      }

      const t =
        ((line2.point.x - line1.point.x) * line2.direction.y -
          (line2.point.y - line1.point.y) * line2.direction.x) /
        denominator;

      return {
        x: line1.point.x + t * line1.direction.x,
        y: line1.point.y + t * line1.direction.y,
      };
    }
  }

  getParallelLineFromPointToCenter(
    lineInfo: { x1: number; y1: number; x2: number; y2: number },
    point: { x: number; y: number },
    centerPoint: { x: number; y: number },
    innerStart: { x: number; y: number },
    outerStart: { x: number; y: number },
    thickness: number
  ) {
    // 计算原始线段的方向向量
    const dx = lineInfo.x2 - lineInfo.x1;
    const dy = lineInfo.y2 - lineInfo.y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    // 单位向量
    const unitDx = dx / length;
    const unitDy = dy / length;

    // 计算垂直向量
    const perpDx = -unitDy;
    const perpDy = unitDx;

    // 计算两个可能的平行点
    const parallelPointA = {
      x: centerPoint.x + perpDx * thickness,
      y: centerPoint.y + perpDy * thickness,
    };
    const parallelPointB = {
      x: centerPoint.x - perpDx * thickness,
      y: centerPoint.y - perpDy * thickness,
    };

    // 确定正确的方向（与getInnerMidPoint使用相同的逻辑）
    const outerToInnerDx = innerStart.x - outerStart.x;
    const outerToInnerDy = innerStart.y - outerStart.y;
    const crossProduct = outerToInnerDx * unitDy - outerToInnerDy * unitDx;

    // 根据叉积选择正确的平行点
    const correctParallelPoint =
      crossProduct < 0 ? parallelPointA : parallelPointB;

    return {
      start: {
        x: point.x + (correctParallelPoint.x - centerPoint.x),
        y: point.y + (correctParallelPoint.y - centerPoint.y),
      },
      end: correctParallelPoint,
    };
  }

  /**
   * 获取更接近指定参考点的直角中点
   * @param pointA 起点
   * @param pointB 终点
   * @param referencePoint 参考点（通常是当前鼠标位置或原中点位置）
   */
  getNearestPerpendicularMidPoint(
    pointA: IPointPostion,
    pointB: IPointPostion,
    referencePoint: IPointPostion
  ): IPointPostion {
    // const { point1, point2 } = this.calculatePerpendicularMidPoints(pointA, pointB);
    const point1 = {
      x: pointA.x,
      y: pointB.y,
    };

    const point2 = {
      x: pointB.x,
      y: pointA.y,
    };
    // 计算两个可能点到参考点的距离
    const dist1 = Math.hypot(
      point1.x - referencePoint.x,
      point1.y - referencePoint.y
    );
    const dist2 = Math.hypot(
      point2.x - referencePoint.x,
      point2.y - referencePoint.y
    );

    // 返回距离参考点更近的那个点
    return dist1 < dist2 ? point1 : point2;
  }

  getVertexPosition(x: number, y: number, width: number, height: number) {
    return [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x + width, y: y + height },
      { x: x, y: y + height },
    ];
  }

  // 计算线段长度
  getLineLength(lineInfo: any): number {
    if (!lineInfo) return 0;
    return Math.sqrt(
      Math.pow(lineInfo.x2 - lineInfo.x1, 2) +
        Math.pow(lineInfo.y2 - lineInfo.y1, 2)
    );
  }

  // 计算弧线长度
  getArcLength(line: ILine | any): number {
    if (!line.arc) return this.getLineLength(line.lineInfo);

    const radius = line.arc.r;
    const angle = this.calculateArcAngle(line);
    return (Math.PI * radius * angle) / 180;
  }

  // 计算弧线角度
  calculateArcAngle(line: ILine | any): number {
    if (!line.arc || !line.lineInfo) return 0;

    const startAngle = Math.atan2(
      line.lineInfo.y1 - line.arc.cy!,
      line.lineInfo.x1 - line.arc.cx!
    );
    const endAngle = Math.atan2(
      line.lineInfo.y2 - line.arc.cy!,
      line.lineInfo.x2 - line.arc.cx!
    );

    let angle = ((endAngle - startAngle) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
  }

  // 获取最大尺寸信息
  getMaxDimensions(lines: ILine[]): {
    maxWidth: number;
    maxHeight: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    horizontalLines: ILine[];
    verticalLines: ILine[];
    needMaxDimension: boolean;
  } {
    const horizontalLines: ILine[] = [];
    const verticalLines: ILine[] = [];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let needMaxDimension = false;

    lines.forEach((line:any) => {
      // 检查 lineInfo 的点
      if (line.lineInfo) {
        minX = Math.min(minX, line.lineInfo.x1, line.lineInfo.x2);
        maxX = Math.max(maxX, line.lineInfo.x1, line.lineInfo.x2);
        minY = Math.min(minY, line.lineInfo.y1, line.lineInfo.y2);
        maxY = Math.max(maxY, line.lineInfo.y1, line.lineInfo.y2);
      }

      // 检查 centerPoint
      if (line.centerPoint) {
        minX = Math.min(minX, line.centerPoint.x);
        maxX = Math.max(maxX, line.centerPoint.x);
        minY = Math.min(minY, line.centerPoint.y);
        maxY = Math.max(maxY, line.centerPoint.y);

        // 检查 centerPoint 是否偏离实际中点
        if (line.lineInfo) {
          const actualMidPoint = {
            x: (line.lineInfo.x1 + line.lineInfo.x2) / 2,
            y: (line.lineInfo.y1 + line.lineInfo.y2) / 2,
          };

          if (
            Math.abs(line.centerPoint.x - actualMidPoint.x) > 0.1 ||
            Math.abs(line.centerPoint.y - actualMidPoint.y) > 0.1
          ) {
            needMaxDimension = true;
          }
        }
      }

      // 收集水平和垂直线
      if (this.isHorizontal(line.lineInfo)) {
        horizontalLines.push(line);
      }
      if (this.isVertical(line.lineInfo)) {
        verticalLines.push(line);
      }
    });

    // 计算最大宽度和高度
    const maxWidth = maxX - minX;
    const maxHeight = maxY - minY;

    return {
      maxWidth,
      maxHeight,
      minX,
      maxX,
      minY,
      maxY,
      horizontalLines,
      verticalLines,
      needMaxDimension,
    };
  }

  // 获取标注位置信息
  getDimensionLabelPosition(
    line: ILine | any,
    offset: number = 30
  ): {
    length: number;
  } {
    const length =
      line.type === "circle"
        ? this.getArcLength(line)
        : this.getLineLength(line.lineInfo);

    return { length };
  }

  // 计算点到线段的垂直距离
  getPerpendicularDistance(line: ILine | any): {
    distance: number;
    perpPoint: { x: number; y: number };
  } | null {
    if (!line.lineInfo || !line.centerPoint) return null;

    const { x1, y1, x2, y2 } = line.lineInfo;
    const { x: cx, y: cy } = line.centerPoint;

    // 对于水平线
    if (this.isHorizontal(line.lineInfo)) {
      return {
        distance: Math.abs(cy - y1),
        perpPoint: { x: cx, y: y1 },
      };
    }

    // 对于垂直线
    if (this.isVertical(line.lineInfo)) {
      return {
        distance: Math.abs(cx - x1),
        perpPoint: { x: x1, y: cy },
      };
    }

    return null;
  }

  // 计算某条线的内侧线
  getParallelLine(start: IPointPostion, end: IPointPostion, distance: number) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // 计算垂直向量
    const perpX = (-dy / length) * distance;
    const perpY = (dx / length) * distance;

    return {
      start: {
        x: start.x + perpX,
        y: start.y + perpY,
      },
      end: {
        x: end.x + perpX,
        y: end.y + perpY,
      },
    };
  }

  calculateDistance = (point1: IPointPostion, point2: IPointPostion): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getIntersectionPoint(
    line1Start: IPointPostion,
    line1End: IPointPostion,
    line2Start: IPointPostion,
    line2End: IPointPostion
  ): IPointPostion {
    // 线段相交点计算
    const x1 = line1Start.x,
      y1 = line1Start.y;
    const x2 = line1End.x,
      y2 = line1End.y;
    const x3 = line2Start.x,
      y3 = line2Start.y;
    const x4 = line2End.x,
      y4 = line2End.y;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    const x =
      ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
      denominator;
    const y =
      ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
      denominator;

    return { x, y };
  }

  getCircleLineIntersection(
    circle: { center: IPointPostion; radius: number },
    line: { start: IPointPostion; end: IPointPostion },
    isFlip?: boolean,
  ) {
    const { center, radius } = circle;
    const { start, end } = line;

    // 线段方向向量
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // 圆心到线段起点的向量
    const fx = start.x - center.x;
    const fy = start.y - center.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return null; // 无交点

    // 计算交点参数
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

    // 返回在线段上的交点
    const points: any[] = [];
    if (t1 >= 0 && t1 <= 1) {
      points.push({
        x: start.x + t1 * dx,
        y: start.y + t1 * dy,
      });
    }
    if (t2 >= 0 && t2 <= 1) {
      points.push({
        x: start.x + t2 * dx,
        y: start.y + t2 * dy,
      });
    }

    return points;
  }

  /**
   * 计算垂直线与直线的交点
   */
  getVerticalIntersection(
    x: number,
    line: { start: IPointPostion; end: IPointPostion }
  ): IPointPostion | null {
    // 如果线段垂直
    if (line.end.x === line.start.x) {
      return { x: line.start.x, y: line.start.y };
    }

    // 计算线段斜率
    const k = (line.end.y - line.start.y) / (line.end.x - line.start.x);
    // 计算y轴截距
    const b = line.start.y - k * line.start.x;
    // 计算交点y坐标
    const y = k * x + b;

    // 检查交点是否在线段范围内
    if (
      x >= Math.min(line.start.x, line.end.x) &&
      x <= Math.max(line.start.x, line.end.x)
    ) {
      return { x, y };
    }
    return null;
  }

  /**
   * 计算垂直线与折线的交点
   */
  getVerticalBrokenLineIntersection(
    x: number,
    line: ILine | any
  ): IPointPostion | null {
    if (line.type !== "straight" || !line.innerMidPoint || !line.lineInfo) {
      return null;
    }

    // 计算折线的两个部分
    const line1 = {
      start: { x: line.lineInfo.x1, y: line.lineInfo.y1 },
      end: line.innerMidPoint,
    };
    const line2 = {
      start: line.innerMidPoint,
      end: { x: line.lineInfo.x2, y: line.lineInfo.y2 },
    };

    // 计算与两段线的交点
    const intersection1 = this.getVerticalIntersection(x, line1);
    const intersection2 = this.getVerticalIntersection(x, line2);

    // 返回有效的交点
    return intersection1 || intersection2;
  }

  /**
   * 计算垂直线与圆弧的交点
   */
  getVerticalArcIntersection(x: number, line: ILine | any): IPointPostion | null {
    if (line.type !== "circle" || !line.arc || !line.innerMidPoint) {
      return null;
    }

    const { r, cx, cy } = line.arc;
    const { innerMidPoint } = line;

    // 创建一个足够长的垂直线段
    const verticalLine = {
      start: { x, y: innerMidPoint.y - r * 2 },
      end: { x, y: innerMidPoint.y + r * 2 },
    };

    // 计算圆与线的交点
    const intersections = this.getCircleLineIntersection(
      { center: { x: cx, y: cy } as any, radius: r },
      verticalLine
    );

    if (!intersections || intersections?.length === 0) {
      return null;
    }
    return intersections[0];
    // 计算圆弧的起始和结束角度
    // const startAngle = Math.atan2(
    //     line.lineInfo!.y1 - innerMidPoint.y,
    //     line.lineInfo!.x1 - innerMidPoint.x
    // );
    // const endAngle = Math.atan2(
    //     line.lineInfo!.y2 - innerMidPoint.y,
    //     line.lineInfo!.x2 - innerMidPoint.x
    // );
    //
    // // 检查交点是否在圆弧范围内
    // for (const point of intersections) {
    //     const pointAngle = Math.atan2(
    //         point.y - innerMidPoint.y,
    //         point.x - innerMidPoint.x
    //     );
    //
    //     let angle = pointAngle;
    //     if (angle < startAngle) {
    //         angle += 2 * Math.PI;
    //     }
    //
    //     let endAng = endAngle;
    //     if (endAng < startAngle) {
    //         endAng += 2 * Math.PI;
    //     }
    //
    //     if (angle >= startAngle && angle <= endAng) {
    //         return point;
    //     }
    // }

    return null;
  }

  areParallelAndOverlapping(line1: ILine | any, line2: ILine | any): boolean {
    if (!line1.lineInfo || !line2.lineInfo) return false;

    if (!this.areLinesParallel(line1.lineInfo, line2.lineInfo)) {
      return false;
    }

    if (this.isVertical(line1.lineInfo)) {
      const x = line1.lineInfo.x1;
      if (Math.abs(x - line2.lineInfo.x1) > 0.1) return false;

      const min1 = Math.min(line1.lineInfo.y1, line1.lineInfo.y2);
      const max1 = Math.max(line1.lineInfo.y1, line1.lineInfo.y2);
      const min2 = Math.min(line2.lineInfo.y1, line2.lineInfo.y2);
      const max2 = Math.max(line2.lineInfo.y1, line2.lineInfo.y2);

      return !(min1 > max2 || min2 > max1);
    }

    if (this.isHorizontal(line1.lineInfo)) {
      const y = line1.lineInfo.y1;
      if (Math.abs(y - line2.lineInfo.y1) > 0.1) return false;

      const min1 = Math.min(line1.lineInfo.x1, line1.lineInfo.x2);
      const max1 = Math.max(line1.lineInfo.x1, line1.lineInfo.x2);
      const min2 = Math.min(line2.lineInfo.x1, line2.lineInfo.x2);
      const max2 = Math.max(line2.lineInfo.x1, line2.lineInfo.x2);

      return !(min1 > max2 || min2 > max1);
    }

    const slope =
      (line1.lineInfo.y2 - line1.lineInfo.y1) /
      (line1.lineInfo.x2 - line1.lineInfo.x1);
    const b1 = line1.lineInfo.y1 - slope * line1.lineInfo.x1;
    const b2 = line2.lineInfo.y1 - slope * line2.lineInfo.x1;

    if (Math.abs(b1 - b2) > 0.1) return false;

    const min1 = Math.min(line1.lineInfo.x1, line1.lineInfo.x2);
    const max1 = Math.max(line1.lineInfo.x1, line1.lineInfo.x2);
    const min2 = Math.min(line2.lineInfo.x1, line2.lineInfo.x2);
    const max2 = Math.max(line2.lineInfo.x1, line2.lineInfo.x2);

    return !(min1 > max2 || min2 > max1);
  }

  getDistance(point1: IPointPostion, point2: IPointPostion): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if two edges are overlapping
   */
  checkEdgesOverlap(
    startA: IPointPostion,
    endA: IPointPostion,
    startB: IPointPostion,
    endB: IPointPostion,
    threshold: number = 1
  ): boolean {
    // 检查线段是否平行且重合
    const isVerticalA = Math.abs(startA.x - endA.x) < threshold;
    const isVerticalB = Math.abs(startB.x - endB.x) < threshold;
    const isHorizontalA = Math.abs(startA.y - endA.y) < threshold;
    const isHorizontalB = Math.abs(startB.y - endB.y) < threshold;

    if (isVerticalA && isVerticalB) {
      if (Math.abs(startA.x - startB.x) < threshold) {
        const minY = Math.min(startA.y, endA.y, startB.y, endB.y);
        const maxY = Math.max(startA.y, endA.y, startB.y, endB.y);
        const lengthA = Math.abs(startA.y - endA.y);
        const lengthB = Math.abs(startB.y - endB.y);

        return (maxY - minY) <= (lengthA + lengthB);
      }
    }

    if (isHorizontalA && isHorizontalB) {
      // 水平线段重合检查
      if (Math.abs(startA.y - startB.y) < threshold) {
        const minX = Math.min(startA.x, endA.x, startB.x, endB.x);
        const maxX = Math.max(startA.x, endA.x, startB.x, endB.x);
        const lengthA = Math.abs(startA.x - endA.x);
        const lengthB = Math.abs(startB.x - endB.x);

        return (maxX - minX) <= (lengthA + lengthB);
      }
    }

    return false;
  }

  /**
   * 计算元素被线条切割后的空白区域
   * @param element 被切割的元素
   * @param lines 切割线条
   * @returns 空白区域数组
   */
  calculateEmptyZones(
    element: any,
    lines: any[]
  ): Array<{elementId: string, points: IPointPostion[]}> {
    // 获取元素的内部区域点
    const elementPoints = element.contentPoints || element.innerPoints || element.points;
    if (!elementPoints || elementPoints.length < 3) {
      return [];
    }

    // 创建多边形表示元素区域
    const polygon = elementPoints.map((point:any) => ({x: point.x, y: point.y}));
    
    // 处理不同形状的元素
    let initialPolygons = [];
    
    if (element.type === "Triangle") {
      // 三角形只有一个区域
      initialPolygons = [polygon];
    } else if (element.type === "Rectangle") {
      // 矩形只有一个区域
      initialPolygons = [polygon];
    } else if (element.type === "Arch-h" || element.type === "Arch-v") {
      // 圆弧需要特殊处理
      initialPolygons = this.handleArchPolygon(element, polygon);
    } else {
      // 其他形状默认为一个区域
      initialPolygons = [polygon];
    }
    
    // 如果没有初始多边形，返回空数组
    if (initialPolygons.length === 0) {
      return [];
    }
    
    // 使用线条切割多边形
    let resultPolygons = [...initialPolygons];
    
    for (const line of lines) {
      const newResultPolygons = [];
      
      for (const poly of resultPolygons) {
        // 获取线条的起点和终点
        let lineStart, lineEnd;
        
        if (line.type === 'Line-h') {
          lineStart = {
            x: line.virtualFrame.x,
            y: line.virtualFrame.y
          };
          lineEnd = {
            x: line.virtualFrame.x + line.virtualFrame.width,
            y: line.virtualFrame.y
          };
        } else if (line.type === 'Line-v') {
          lineStart = {
            x: line.virtualFrame.x,
            y: line.virtualFrame.y
          };
          lineEnd = {
            x: line.virtualFrame.x,
            y: line.virtualFrame.y + line.virtualFrame.height
          };
        } else {
          continue;
        }
        
        // 延长线条以确保完全穿过多边形
        const extendedLine = this.extendLine(lineStart, lineEnd, 10000);
        
        // 切割多边形
        const splitResult = this.splitPolygonByLine(poly, extendedLine.start, extendedLine.end);
        
        // 添加切割结果到新的结果数组
        if (splitResult.length > 0) {
          newResultPolygons.push(...splitResult);
        } else {
          // 如果切割失败，保留原多边形
          newResultPolygons.push(poly);
        }
      }
      
      // 更新结果多边形
      resultPolygons = newResultPolygons;
    }
    
    // 转换结果为所需格式
    return resultPolygons.map(poly => ({
      elementId: element.id,
      points: poly.map((p:any) => ({x: p.x, y: p.y}))
    }));
  }

  /**
   * 处理圆弧元素的多边形
   */
  handleArchPolygon(element: any, polygon: IPointPostion[]): IPointPostion[][] {
    if (element.type === "Arch-h") {
      const arcLine = element.lines.find((line:any) => line && line.center && line.radius);
      if (!arcLine) return [polygon];
      
      return [this.createArchPolygon(polygon, arcLine, true)];
    } else if (element.type === "Arch-v") {
      const arcLine = element.lines.find((line:any) => line && line.center && line.radius);
      if (!arcLine) return [polygon];
      
      return [this.createArchPolygon(polygon, arcLine, false)];
    }
    
    return [polygon];
  }

  /**
   * 创建圆弧多边形
   */
  createArchPolygon(basePolygon: IPointPostion[], arcLine: any, isHorizontal: boolean): IPointPostion[] {
    const result = [...basePolygon];
    
    // 找到圆弧的起点和终点索引
    let startIndex = -1;
    let endIndex = -1;
    
    for (let i = 0; i < basePolygon.length; i++) {
      const point = basePolygon[i];
      const nextPoint = basePolygon[(i + 1) % basePolygon.length];
      
      // 检查这条边是否是圆弧的直线部分
      const isArcEdge = isHorizontal 
        ? Math.abs(point.y - nextPoint.y) < 0.1 && point.y !== arcLine.center.y
        : Math.abs(point.x - nextPoint.x) < 0.1 && point.x !== arcLine.center.x;
      
      if (isArcEdge) {
        startIndex = i;
        endIndex = (i + 1) % basePolygon.length;
        break;
      }
    }
    
    if (startIndex === -1 || endIndex === -1) {
      return basePolygon;
    }
    
    // 计算圆弧上的点
    const arcPoints = this.calculateArcPoints(
      arcLine.center,
      arcLine.radius,
      arcLine.startPoint,
      arcLine.endPoint,
      10 // 圆弧上的点数
    );
    
    // 替换直线边为圆弧
    const newPolygon = [];
    
    for (let i = 0; i < basePolygon.length; i++) {
      if (i === startIndex) {
        // 添加起点
        newPolygon.push(basePolygon[i]);
        
        // 添加圆弧上的点
        newPolygon.push(...arcPoints);
        
        // 跳过终点，因为它会在下一次迭代中添加
      } else if (i !== endIndex) {
        newPolygon.push(basePolygon[i]);
      }
    }
    
    return newPolygon;
  }

  /**
   * 计算圆弧上的点
   */
  calculateArcPoints(
    center: IPointPostion,
    radius: number,
    startPoint: IPointPostion,
    endPoint: IPointPostion,
    numPoints: number
  ): IPointPostion[] {
    const startAngle = Math.atan2(startPoint.y - center.y, startPoint.x - center.x);
    const endAngle = Math.atan2(endPoint.y - center.y, endPoint.x - center.x);
    
    // 确保角度范围正确
    let angleRange = endAngle - startAngle;
    if (angleRange < 0) {
      angleRange += 2 * Math.PI;
    }
    
    const points = [];
    for (let i = 1; i < numPoints; i++) {
      const t = i / numPoints;
      const angle = startAngle + t * angleRange;
      
      points.push({
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      });
    }
    
    return points;
  }

  /**
   * 延长线段
   */
  extendLine(start: IPointPostion, end: IPointPostion, length: number): {start: IPointPostion, end: IPointPostion} {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) return {start, end};
    
    const ux = dx / len;
    const uy = dy / len;
    
    return {
      start: {
        x: start.x - ux * length,
        y: start.y - uy * length
      },
      end: {
        x: end.x + ux * length,
        y: end.y + uy * length
      }
    };
  }

  /**
   * 使用线段切割多边形
   */
  splitPolygonByLine(
    polygon: IPointPostion[],
    lineStart: IPointPostion,
    lineEnd: IPointPostion
  ): IPointPostion[][] {
    // 找到线段与多边形边的交点
    const intersections = [];
    
    for (let i = 0; i < polygon.length; i++) {
      const nextIndex = (i + 1) % polygon.length;
      const edgeStart = polygon[i];
      const edgeEnd = polygon[nextIndex];
      
      const intersection = this.lineIntersection(
        lineStart,
        lineEnd,
        edgeStart,
        edgeEnd
      );
      
      if (intersection) {
        // 计算交点在边上的参数t (0-1)
        const edgeDx = edgeEnd.x - edgeStart.x;
        const edgeDy = edgeEnd.y - edgeStart.y;
        
        let t;
        if (Math.abs(edgeDx) > Math.abs(edgeDy)) {
          t = (intersection.x - edgeStart.x) / edgeDx;
        } else {
          t = (intersection.y - edgeStart.y) / edgeDy;
        }
        
        // 只保留有效的交点 (0 <= t <= 1)
        if (t >= 0 && t <= 1) {
          intersections.push({
            point: intersection,
            edgeIndex: i,
            t: t
          });
        }
      }
    }
    
    // 如果交点少于2个，无法切割
    if (intersections.length < 2) {
      return [];
    }
    
    // 按照边的索引和参数t排序交点
    intersections.sort((a, b) => {
      if (a.edgeIndex !== b.edgeIndex) {
        return a.edgeIndex - b.edgeIndex;
      }
      return a.t - b.t;
    });
    
    // 创建两个新多边形
    const poly1 = [];
    const poly2 = [];
    
    // 第一个交点
    const int1 = intersections[0];
    // 第二个交点
    const int2 = intersections[1];
    
    // 构建第一个多边形
    poly1.push(int1.point);
    
    let i = (int1.edgeIndex + 1) % polygon.length;
    while (i !== (int2.edgeIndex + 1) % polygon.length) {
      poly1.push(polygon[i]);
      i = (i + 1) % polygon.length;
    }
    
    poly1.push(int2.point);
    
    // 构建第二个多边形
    poly2.push(int2.point);
    
    i = (int2.edgeIndex + 1) % polygon.length;
    while (i !== (int1.edgeIndex + 1) % polygon.length) {
      poly2.push(polygon[i]);
      i = (i + 1) % polygon.length;
    }
    
    poly2.push(int1.point);
    
    return [poly1, poly2];
  }

  // 对交点进行排序的方法
  sortIntersectionPoints(contentPoints: IPointPostion[], intersectionPoints: any[], index: number): any[] {
    if (!intersectionPoints || intersectionPoints.length === 0) {
      return [];
    }
    
    const nextIndex = (index + 1) % contentPoints.length;
    const startPoint = contentPoints[index];
    const endPoint = contentPoints[nextIndex];
    
    // 判断线段方向
    const isHorizontalLine = Math.abs(startPoint.y - endPoint.y) < Math.abs(startPoint.x - endPoint.x);
    const isDescending = isHorizontalLine 
      ? startPoint.x > endPoint.x 
      : startPoint.y > endPoint.y;
    
    // 创建排序用的数组副本
    const sortedPoints = [...intersectionPoints];
    
    // 根据线段方向排序
    sortedPoints.sort((a, b) => {
      // 获取点的坐标
      const pointA = a.points ? a.points[0] : a.point;
      const pointB = b.points ? b.points[0] : b.point;
      
      if (!pointA || !pointB) return 0;
      
      // 水平线段按X坐标排序
      if (isHorizontalLine) {
        return isDescending 
          ? pointB.x - pointA.x  // 降序排列 (从大到小)
          : pointA.x - pointB.x; // 升序排列 (从小到大)
      } 
      // 垂直线段按Y坐标排序
      else {
        return isDescending 
          ? pointB.y - pointA.y  // 降序排列 (从大到小)
          : pointA.y - pointB.y; // 升序排列 (从小到大)
      }
    });
    
    return sortedPoints;
  }

  // 判断点是否在线段上
  isPointOnLineSegment(start: IPointPostion, end: IPointPostion, point: IPointPostion): boolean {
    // 考虑浮点数精度问题，使用一个小的容差值
    const epsilon = 0.1;
    
    // 计算线段的长度
    const lineLength = this.calculateDistance(start, end);
    
    // 计算点到线段两端的距离之和
    const d1 = this.calculateDistance(start, point);
    const d2 = this.calculateDistance(end, point);
    
    // 如果点到两端的距离之和等于线段长度(考虑浮点数精度),则点在线段上
    return Math.abs(d1 + d2 - lineLength) < epsilon;
  }

  /**
   * 计算点到线段的最短距离
   * @param point 待计算的点
   * @param lineStart 线段起点
   * @param lineEnd 线段终点
   * @returns 点到线段的最短距离
   */
  getDistanceToLine(
    point: IPointPostion,
    lineStart: IPointPostion,
    lineEnd: IPointPostion
  ): number {
    // 特殊情况处理：线段起点和终点重合
    if (lineStart.x === lineEnd.x && lineStart.y === lineEnd.y) {
      return this.calculateDistance(point, lineStart);
    }
    
    // 计算线段长度的平方
    const lineLength2 = Math.pow(lineEnd.x - lineStart.x, 2) + Math.pow(lineEnd.y - lineStart.y, 2);
    
    // 计算点在线段上的投影位置参数 t
    // 参数 t 表示投影点在线段上的相对位置，t=0 表示起点，t=1 表示终点
    const t = Math.max(0, Math.min(1, (
      (point.x - lineStart.x) * (lineEnd.x - lineStart.x) + 
      (point.y - lineStart.y) * (lineEnd.y - lineStart.y)
    ) / lineLength2));
    
    // 计算投影点坐标
    const projectionPoint = {
      x: lineStart.x + t * (lineEnd.x - lineStart.x),
      y: lineStart.y + t * (lineEnd.y - lineStart.y)
    };
    
    // 计算点到投影点的距离
    return this.calculateDistance(point, projectionPoint);
  }

  getDividedPoints(frame: HorizontalLineWindow | VerticalLineWindow, divisions: number = 10): IPointPostion[] {
    const points: IPointPostion[] = [];
    
    // 添加原始的点
    // points.push(...frame.points);

    // 计算等分点
    if (frame.type === 'Line-h') {
      const startX = frame.points[0].x;
      const endX = frame.points[1].x;
      const y = frame.points[0].y;
      const step = (endX - startX) / divisions;

      // 添加水平线上的等分点
      for (let i = 1; i < divisions; i++) {
        points.push({
          x: startX + step * i,
          y: y
        });
      }
    } else if (frame.type === 'Line-v') {
      const startY = frame.points[1].y;
      const endY = frame.points[0].y;
      const x = frame.points[0].x;
      const step = (endY - startY) / divisions;

      // 添加垂直线上的等分点
      for (let i = 1; i < divisions; i++) {
        points.push({
          x: x,
          y: startY + step * i
        });
      }
    }

    return points;
  }
}

const lineUntil = new LineUntil();
export default lineUntil;
