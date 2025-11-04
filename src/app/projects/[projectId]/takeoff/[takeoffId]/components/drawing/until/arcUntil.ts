import lineUntil from "./lineUntil";
import { IPointPostion } from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/drawing/datas";
import { ILine } from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/drawing/data/baseFrame";

interface IArcCenter {
  cx: number;
  cy: number;
  r: number;
}

export const arcUntil = {
  calculateArc(
    x1: number,
    y1: number,
    xm: number,
    ym: number,
    x2: number,
    y2: number
  ): IArcCenter | null {
    const ma = (ym - y1) / (xm - x1);
    const mb = (y2 - ym) / (x2 - xm);

    if (ma === mb) {
      return null;
    }

    const cx =
      (ma * mb * (y1 - y2) + mb * (x1 + xm) - ma * (xm + x2)) / (2 * (mb - ma));
    const cy = (-1 / ma) * (cx - (x1 + xm) / 2) + (y1 + ym) / 2;

    const r = Math.sqrt((x1 - cx) ** 2 + (y1 - cy) ** 2);

    return { cx, cy, r };
  },

  generateArcPath(
    startPoint: IPointPostion,
    midPoint: IPointPostion,
    endPoint: IPointPostion,
    isInner: boolean = false,
    lineWidth: number = 0
  ): string {
    const arc = this.calculateArc(
      startPoint.x,
      startPoint.y,
      midPoint.x,
      midPoint.y,
      endPoint.x,
      endPoint.y
    );

    if (!arc) {
      return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
    }

    const sweep =
      (endPoint.x - startPoint.x) * (midPoint.y - startPoint.y) -
        (endPoint.y - startPoint.y) * (midPoint.x - startPoint.x) >
      0
        ? 0
        : 1;

    const radius = isInner ? arc.r - lineWidth : arc.r;

    const dx1 = startPoint.x - arc.cx;
    const dy1 = startPoint.y - arc.cy;
    const dx2 = endPoint.x - arc.cx;
    const dy2 = endPoint.y - arc.cy;
    const angle = Math.atan2(dy2, dx2) - Math.atan2(dy1, dx1);
    return `M ${startPoint.x} ${
      startPoint.y
    } A ${radius} ${radius} 0 ${0} ${sweep} ${endPoint.x} ${endPoint.y}`;
  },

  generateArcSegmentPath(
    startPoint: IPointPostion,
    endPoint: IPointPostion,
    arc: any,
    sweep: number = 1
  ): string {
    const radius = arc.r;
    return `M ${startPoint.x} ${
      startPoint.y
    } A ${radius} ${radius} 0 ${0} ${sweep} ${endPoint.x} ${endPoint.y}`;
  },

  isPointInArcRange(
    intersection: IPointPostion,
    center: IPointPostion,
    startPoint: IPointPostion,
    endPoint: IPointPostion,
    arcAngle: number,
    isFlip: boolean = false
  ): boolean {
    const angle =
      (Math.atan2(intersection.y - center.y, intersection.x - center.x) * 180) /
      Math.PI;

    const startAngle =
      (Math.atan2(startPoint.y - center.y, startPoint.x - center.x) * 180) /
      Math.PI;

    const endAngle =
      (Math.atan2(endPoint.y - center.y, endPoint.x - center.x) * 180) /
      Math.PI;

    const effectiveArcAngle = isFlip ? -arcAngle : arcAngle;

    let isInArcRange = false;

    if (effectiveArcAngle > 0) {
      let adjustedAngle = angle;
      let adjustedStartAngle = startAngle;
      let adjustedEndAngle = endAngle;

      if (adjustedAngle < adjustedStartAngle) {
        adjustedAngle += 360;
      }
      if (adjustedEndAngle < adjustedStartAngle) {
        adjustedEndAngle += 360;
      }

      isInArcRange =
        adjustedAngle >= adjustedStartAngle &&
        adjustedAngle <= adjustedEndAngle;
    } else {
      // 逆时针圆弧
      let adjustedAngle = angle;
      let adjustedStartAngle = startAngle;
      let adjustedEndAngle = endAngle;

      // 确保所有角度都在同一范围内
      if (adjustedAngle > adjustedStartAngle) {
        adjustedAngle -= 360;
      }
      if (adjustedEndAngle > adjustedStartAngle) {
        adjustedEndAngle -= 360;
      }

      isInArcRange =
        adjustedAngle <= adjustedStartAngle &&
        adjustedAngle >= adjustedEndAngle;
    }

    return isInArcRange;
  },

  /**
   * 判断点是否在指定的圆弧上
   *
   * @param point - 需要检查的点 {x, y}
   * @param arcSegment - 圆弧段信息，包含中心点、半径、起始角度、结束角度和方向等
   * @param tolerance - 容差值，默认为1，表示点到圆弧的距离允许的误差范围
   * @returns 如果点在圆弧上则返回true，否则返回false
   */
  isPointOnArcSegment(
    point: IPointPostion,
    arcSegment: {
      center: { x: number; y: number };
      radius: number;
      start_angle: number;
      end_angle: number;
      is_clockwise: boolean;
      start?: { x: number; y: number };
      end?: { x: number; y: number };
    },
    tolerance: number = 1
  ): boolean {
    try {
      const { center, radius, start_angle, end_angle, is_clockwise } =
        arcSegment;

      const distanceToCenter = Math.sqrt(
        Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2)
      );
      if (Math.abs(distanceToCenter - radius) > tolerance) {
        return false;
      }

      let angle =
        Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI);
      angle = ((angle % 360) + 360) % 360;

      let normalizedStartAngle = ((start_angle % 360) + 360) % 360;
      let normalizedEndAngle = ((end_angle % 360) + 360) % 360;

      // 4. 检查点是否在圆弧范围内
      if (!is_clockwise) {
        if (normalizedEndAngle < normalizedStartAngle) {
          return angle >= normalizedStartAngle || angle <= normalizedEndAngle;
        } else {
          return angle >= normalizedStartAngle && angle <= normalizedEndAngle;
        }
      } else {
        if (normalizedEndAngle < normalizedStartAngle) {
          return angle <= normalizedStartAngle && angle >= normalizedEndAngle;
        } else {
          return angle <= normalizedStartAngle || angle >= normalizedEndAngle;
        }
      }
    } catch (error) {
      return false;
    }
  },

  getArcLineIntersections(
    line: { start: IPointPostion; end: IPointPostion },
    arc: {
      center: IPointPostion;
      radius: number;
      startPoint: IPointPostion;
      endPoint: IPointPostion;
      angle: number;
    }
  ): IPointPostion[] {
    // 使用 lineUntil 获取线段与圆的所有交点
    const circle = {
      center: arc.center,
      radius: arc.radius,
    };

    const intersections = lineUntil.getCircleLineIntersection(circle, line);

    // 如果没有交点，返回空数组
    if (!intersections || intersections.length === 0) {
      return [];
    }

    // 筛选出位于圆弧范围内的交点
    const validIntersections = intersections.filter((intersection) => {
      return this.isPointInArcRange(
        intersection,
        arc.center,
        arc.startPoint,
        arc.endPoint,
        arc.angle
      );
    });

    return validIntersections;
  },

  /**
   * 判断一个点是否在圆弧上
   *
   * @param point - 待检查的点坐标 [x, y]
   * @param arc - 圆弧信息，包含center、radius、start_angle、end_angle、is_clockwise等信息
   * @param tolerance - 判断点到圆的距离允许的误差，默认为1e-6
   * @returns 点是否在圆弧上
   */
  isPointOnArc(
    point: [number, number],
    arc: {
      center: [number, number];
      radius: number;
      start_angle: number;
      end_angle: number;
      is_clockwise: boolean;
    },
    tolerance: number = 1
  ): boolean {
    try {
      // 获取圆弧信息
      const center = arc.center;
      const radius = arc.radius;
      const startAngle = arc.start_angle;
      const endAngle = arc.end_angle;
      const isClockwise = !arc.is_clockwise;

      // 1. 检查点到圆心的距离是否等于半径
      const distance = Math.sqrt(
        Math.pow(point[0] - center[0], 2) + Math.pow(point[1] - center[1], 2)
      );

      if (Math.abs(distance - radius) > tolerance) {
        return false;
      }

      // 2. 计算点相对于圆心的角度（度数）
      let angleRad = Math.atan2(point[1] - center[1], point[0] - center[0]);
      let angle = angleRad * (180 / Math.PI);

      // 确保角度为[0, 360)区间内
      angle = angle % 360;
      if (angle < 0) {
        angle += 360;
      }

      // 3. 检查点的角度是否在弧的角度范围内
      if (isClockwise) {
        const sweepAngle = (startAngle - endAngle) % 360;
        if (sweepAngle === 0) {
          // 整圆情况
          return true;
        } else if (startAngle >= endAngle) {
          return startAngle >= angle && angle >= endAngle;
        } else {
          // 跨0度线情况
          return angle >= startAngle || angle <= endAngle;
        }
      } else {
        // 逆时针
        const sweepAngle = (endAngle - startAngle) % 360;
        if (sweepAngle === 0) {
          // 整圆情况
          return true;
        } else if (endAngle >= startAngle) {
          return startAngle <= angle && angle <= endAngle;
        } else {
          // 跨0度线情况
          return angle <= startAngle || angle >= endAngle;
        }
      }
    } catch (e) {
      console.error(`判断点是否在圆弧上时出错: ${e}`);
      return false;
    }
  },

  generateArcPathFromSegments(
    line: ILine,
    segments: Array<{
      startPoint: IPointPostion;
      endPoint: IPointPostion;
    }>,
    midPoint: IPointPostion,
    hiddenSegments?: Array<{
      startPoint: IPointPostion;
      endPoint: IPointPostion;
    }>
  ): string {
    let path = "";
    const { startPoint, endPoint } = line;
    const arc = this.calculateArc(
      startPoint.x,
      startPoint.y,
      midPoint.x,
      midPoint.y,
      endPoint.x,
      endPoint.y
    );

    if (!arc) {
      return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
    }

    let sweep =
      (endPoint.x - startPoint.x) * (midPoint.y - startPoint.y) -
        (endPoint.y - startPoint.y) * (midPoint.x - startPoint.x) >
      0
        ? 1
        : 0;

    segments.forEach((segment) => {
      const isHidden = hiddenSegments?.some((hidden) =>
        this.isSameSegment(hidden, segment)
      );
      if (isHidden) {
        return;
      }
      path += this.generateArcSegmentPath(
        segment.startPoint,
        segment.endPoint,
        arc,
        sweep
      );
    });

    return path;
  },

  isSameSegment(
    segment1: { startPoint: IPointPostion; endPoint: IPointPostion },
    segment2: { startPoint: IPointPostion; endPoint: IPointPostion }
  ): boolean {
    const isSamePoint = (p1: IPointPostion, p2: IPointPostion) => {
      return Math.abs(p1.x - p2.x) < 0.001 && Math.abs(p1.y - p2.y) < 0.001;
    };

    return (
      (isSamePoint(segment1.startPoint, segment2.startPoint) &&
        isSamePoint(segment1.endPoint, segment2.endPoint)) ||
      (isSamePoint(segment1.startPoint, segment2.endPoint) &&
        isSamePoint(segment1.endPoint, segment2.startPoint))
    );
  },
};
