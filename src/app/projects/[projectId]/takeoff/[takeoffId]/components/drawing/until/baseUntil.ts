import { BaseFrame, ILine } from "../data/baseFrame";
import { IPointPostion, IZone, OperationType } from "../datas";
import lineUntil from "./lineUntil";
import { BaseData, IVertualFrame } from "../data/baseData";
import { GroupFrame } from "../data/groupFrame";
import zoneUntil from "./zoneUntil";
import { BaseOperation } from "../data/operation/baseOperation";

interface IOverlapLine {
  line1: ILine | any;
  line2: ILine | any;
}

class BaseUntil {
  // 查找所有重合的边
  findOverlappingLines(elements: BaseFrame[]): IOverlapLine[] {
    const overlappingLines: IOverlapLine[] = [];
    const baseFrames = elements.filter((ele) => ele instanceof BaseFrame);

    const isPointOnLine = (point: IPointPostion, line: ILine): boolean => {
      if (!line.startPoint || !line.endPoint) return false;

      if (line.radius) {
        return false;
      }

      const dx = line.endPoint.x - line.startPoint.x;
      const dy = line.endPoint.y - line.startPoint.y;

      if (Math.abs(dy) < 0.001) {
        if (Math.abs(point.y - line.startPoint.y) < 0.001) {
          const minX = Math.min(line.startPoint.x, line.endPoint.x);
          const maxX = Math.max(line.startPoint.x, line.endPoint.x);
          return point.x >= minX && point.x <= maxX;
        }
        return false;
      }

      if (Math.abs(dx) < 0.001) {
        if (Math.abs(point.x - line.startPoint.x) < 0.001) {
          const minY = Math.min(line.startPoint.y, line.endPoint.y);
          const maxY = Math.max(line.startPoint.y, line.endPoint.y);
          return point.y >= minY && point.y <= maxY;
        }
        return false;
      }

      const length = Math.sqrt(dx * dx + dy * dy);
      const crossProduct = Math.abs(
        (point.x - line.startPoint.x) * dy - (point.y - line.startPoint.y) * dx
      );
      const distance = crossProduct / length;

      if (distance < 0.001) {
        const dotProduct =
          ((point.x - line.startPoint.x) * dx +
            (point.y - line.startPoint.y) * dy) /
          (dx * dx + dy * dy);
        return dotProduct >= 0 && dotProduct <= 1;
      }

      return false;
    };

    const arePartiallyOverlapping = (line1: ILine, line2: ILine): boolean => {
      if (
        (this.isSamePoint(line1.startPoint, line2.startPoint) &&
          !lineUntil.isPointOnLineSegment(
            line1.startPoint,
            line1.endPoint,
            line2.endPoint
          ) &&
          !lineUntil.isPointOnLineSegment(
            line2.startPoint,
            line2.endPoint,
            line1.endPoint
          )) ||
        (this.isSamePoint(line1.startPoint, line2.endPoint) &&
          !lineUntil.isPointOnLineSegment(
            line1.startPoint,
            line1.endPoint,
            line2.startPoint
          ) &&
          !lineUntil.isPointOnLineSegment(
            line2.startPoint,
            line2.endPoint,
            line1.endPoint
          )) ||
        (this.isSamePoint(line1.endPoint, line2.startPoint) &&
          !lineUntil.isPointOnLineSegment(
            line1.startPoint,
            line1.endPoint,
            line2.endPoint
          ) &&
          !lineUntil.isPointOnLineSegment(
            line2.startPoint,
            line2.endPoint,
            line1.startPoint
          )) ||
        (this.isSamePoint(line1.endPoint, line2.endPoint) &&
          !lineUntil.isPointOnLineSegment(
            line1.startPoint,
            line1.endPoint,
            line2.startPoint
          ) &&
          !lineUntil.isPointOnLineSegment(
            line2.startPoint,
            line2.endPoint,
            line1.startPoint
          ))
      ) {
        return false;
      }
      if (
        !line1.startPoint ||
        !line1.endPoint ||
        !line2.startPoint ||
        !line2.endPoint
      )
        return false;

      const isHorizontal1 =
        Math.abs(line1.startPoint.y - line1.endPoint.y) < 0.001;
      const isHorizontal2 =
        Math.abs(line2.startPoint.y - line2.endPoint.y) < 0.001;

      const isVertical1 =
        Math.abs(line1.startPoint.x - line1.endPoint.x) < 0.001;
      const isVertical2 =
        Math.abs(line2.startPoint.x - line2.endPoint.x) < 0.001;
      if (isHorizontal1 && isHorizontal2) {
        // && (lineUntil.isPointOnLineSegment(line1.startPoint, line1.endPoint, line2.s))

        if (Math.abs(line1.startPoint.y - line2.startPoint.y) < 0.001) {
          const minX1 = Math.min(line1.startPoint.x, line1.endPoint.x);
          const maxX1 = Math.max(line1.startPoint.x, line1.endPoint.x);
          const minX2 = Math.min(line2.startPoint.x, line2.endPoint.x);
          const maxX2 = Math.max(line2.startPoint.x, line2.endPoint.x);

          return (
            (minX1 <= maxX2 && maxX1 >= minX2) ||
            isPointOnLine(line1.startPoint, line2) ||
            isPointOnLine(line1.endPoint, line2) ||
            isPointOnLine(line2.startPoint, line1) ||
            isPointOnLine(line2.endPoint, line1)
          );
        }
      }

      if (isVertical1 && isVertical2) {
        if (Math.abs(line1.startPoint.x - line2.startPoint.x) < 0.001) {
          const minY1 = Math.min(line1.startPoint.y, line1.endPoint.y);
          const maxY1 = Math.max(line1.startPoint.y, line1.endPoint.y);
          const minY2 = Math.min(line2.startPoint.y, line2.endPoint.y);
          const maxY2 = Math.max(line2.startPoint.y, line2.endPoint.y);

          return (
            (minY1 <= maxY2 && maxY1 >= minY2) ||
            isPointOnLine(line1.startPoint, line2) ||
            isPointOnLine(line1.endPoint, line2) ||
            isPointOnLine(line2.startPoint, line1) ||
            isPointOnLine(line2.endPoint, line1)
          );
        }
      }

      return false;
    };

    for (let i = 0; i < baseFrames.length; i++) {
      const element1 = baseFrames[i];
      if (!element1.lines) continue;

      for (let j = i + 1; j < baseFrames.length; j++) {
        const element2 = baseFrames[j];
        if (!element2.lines) continue;

        // 检查两个元素的所有边
        for (const line1 of element1.lines) {
          if (line1.isCut || !line1?.startPoint || !line1?.endPoint) continue;

          for (const line2 of element2.lines) {
            if (line2.isCut || !line2?.startPoint || !line2?.endPoint) continue;
            // if ((!line1.radius && line2.radius) || (line1.radius && !line2.radius)) continue;
            if (line1.radius || line2.radius) continue;
            if (this.areLinesOverlapping(line1, line2)) {
              overlappingLines.push({
                line1: {
                  ...line1,
                  elementId: element1.id,
                },
                line2: {
                  ...line2,
                  elementId: element2.id,
                },
              });
            } else if (arePartiallyOverlapping(line1, line2)) {
              overlappingLines.push({
                line1: {
                  ...line1,
                  elementId: element1.id,
                },
                line2: {
                  ...line2,
                  elementId: element2.id,
                },
              });
            }
          }
        }
      }
    }
    return overlappingLines;
  }

  filterOverlappingLines(
    elements: BaseFrame[],
    elementSegments: any,
    intersectionPoints: any
  ): IOverlapLine[] {
    const overlappingLines = baseUntil.findOverlappingLines(elements);
    const segmentsToRemove = new Set<string>();
    const newSegments: any[] = [];
    const arePointsEqual = (p1: IPointPostion, p2: IPointPostion): boolean => {
      return Math.abs(p1.x - p2.x) < 0.001 && Math.abs(p1.y - p2.y) < 0.001;
    };

    const addUniquePoint = (
      points: any[],
      newPoint: IPointPostion,
      info: any = {}
    ): void => {
      if (!points.some((p) => arePointsEqual(p.point, newPoint))) {
        points.push({ point: newPoint, ...info });
      }
    };

    overlappingLines.forEach((overlap) => {
      const line1Points = intersectionPoints.get(overlap.line1.id) || [];
      const line2Points = intersectionPoints.get(overlap.line2.id) || [];

      const allPoints: any[] = [];

      addUniquePoint(allPoints, overlap.line1.startPoint, {
        isEndpoint: true,
        lineId: overlap.line1.id,
      });
      addUniquePoint(allPoints, overlap.line1.endPoint, {
        isEndpoint: true,
        lineId: overlap.line1.id,
      });
      addUniquePoint(allPoints, overlap.line2.startPoint, {
        isEndpoint: true,
        lineId: overlap.line2.id,
      });
      addUniquePoint(allPoints, overlap.line2.endPoint, {
        isEndpoint: true,
        lineId: overlap.line2.id,
      });

      line1Points.forEach((point: any) => {
        addUniquePoint(allPoints, point.point, {
          ...point,
          lineId: overlap.line1.id,
        });
      });

      line2Points.forEach((point: any) => {
        addUniquePoint(allPoints, point.point, {
          ...point,
          lineId: overlap.line2.id,
        });
      });

      const isHorizontal =
        Math.abs(overlap.line1.startPoint.y - overlap.line1.endPoint.y) < 0.001;

      allPoints.sort((a, b) =>
        isHorizontal ? a.point.x - b.point.x : a.point.y - b.point.y
      );

      // 生成新的线段
      for (let i = 0; i < allPoints.length - 1; i++) {
        const newSegment = {
          id: `${overlap.line1.id}-merged-${overlap.line2.id}-${i + 1}`,
          elementId: overlap.line1.elementId,
          startPoint: allPoints[i].point,
          endPoint: allPoints[i + 1].point,
          weight: overlap.line1.weight,
        };
        newSegments.push(newSegment);
      }

      segmentsToRemove.add(overlap.line1.id);
      segmentsToRemove.add(overlap.line2.id);
    });
    const finalSegments = [
      ...elementSegments.filter(
        (segment: any) =>
          !Array.from(segmentsToRemove).some((prefix) =>
            segment.id?.startsWith(prefix)
          )
      ),
      ...newSegments,
    ];

    return finalSegments;
  }

  removeDuplicateSegments(segments: any[]) {
    const uniqueSegmentsMap = new Map();
    const segmentInfoMap = new Map();

    segments.forEach((segment) => {
      let startPoint = { ...segment.startPoint };
      let endPoint = { ...segment.endPoint };

      let shouldSwap = false;
      if (Math.abs(startPoint.x - endPoint.x) < 0.001) {
        shouldSwap = startPoint.y > endPoint.y;
      } else {
        shouldSwap = startPoint.x > endPoint.x;
      }

      if (shouldSwap) {
        const temp = startPoint;
        startPoint = endPoint;
        endPoint = temp;
      }
      if (!segment.startPoint) return;
      let pointsKey = `${startPoint.x.toFixed(2)},${startPoint.y.toFixed(
        2
      )}_${endPoint.x.toFixed(2)},${endPoint.y.toFixed(2)}_${
        segment.center?.x
      },${segment.center?.y}`;

      const isArc = !!segment.isArc;
      if (segment.middle_point && segment.middle_point?.x) {
        pointsKey += `_${segment.middle_point.x.toFixed(
          2
        )},${segment.middle_point.y.toFixed(2)}`;
      }
      if (segmentInfoMap.has(pointsKey)) {
        // const existingSegmentInfo = segmentInfoMap.get(pointsKey);

        return;
      }

      segmentInfoMap.set(pointsKey, {
        id: segment.id,
        isArc: isArc,
      });

      const key = `${segment.id}_${isArc ? "arc" : "line"}_${pointsKey}`;
      if (!uniqueSegmentsMap.has(key)) {
        const sortedSegment = {
          ...segment,
          startPoint,
          endPoint,
          weight: segment.weight,
        };

        uniqueSegmentsMap.set(key, sortedSegment);
      }
    });

    return Array.from(uniqueSegmentsMap.values());
  }

  private areLinesOverlapping(line1: any, line2: any): boolean {
    return (
      (this.isSamePoint(line1.startPoint, line2.startPoint) &&
        this.isSamePoint(line1.endPoint, line2.endPoint)) ||
      (this.isSamePoint(line1.startPoint, line2.endPoint) &&
        this.isSamePoint(line1.endPoint, line2.startPoint))
    );
  }

  private isSamePoint(point1: IPointPostion, point2: IPointPostion): boolean {
    return (
      Math.abs(point1.x - point2.x) < 0.001 &&
      Math.abs(point1.y - point2.y) < 0.001
    );
  }

  findCoincideElements(elements: BaseData[], zones: IZone[]) {
    let frameEle = elements.filter((el) => el instanceof BaseFrame);

    // let lines = this.findOverlappingLines(frameEle)
  }

  updateTemplateCode(elements: BaseData[], zones: IZone[]) {
    elements.forEach((element: any) => {
      if (!(element instanceof BaseFrame)) return;

      if (element instanceof GroupFrame) {
        return;
      }

      let innerZones = zoneUntil.findZonesInGroup(element, zones);

      innerZones.sort((a, b) => {
        return (a.centroid?.[0] ?? 0) - (b.centroid?.[0] ?? 0);
      });

      let orderedOperations: Array<{
        type: string;
        index: number;
      }> = [];

      innerZones.forEach((zone, index) => {
        if (!zone.operations?.length) return;

        zone.operations.forEach((operation) => {
          orderedOperations.push({
            type: operation.type,
            index: index,
          });
        });
      });

      const activeIndex = orderedOperations.find(
        (op) => op.type === OperationType.ACTIVE
      )?.index;
      const passiveIndex = orderedOperations.find(
        (op) => op.type === OperationType.PASSIVE
      )?.index;

      const operationTypes = orderedOperations.map((op) => op.type);

      const templateCode = this.getTemplateCode(operationTypes, {
        isLeftActive:
          activeIndex !== undefined &&
          passiveIndex !== undefined &&
          activeIndex < passiveIndex,
      });

      if (templateCode) {
        element.code = `window-${templateCode.category}-${templateCode.type}-${templateCode.open}`;
      }
    });
  }

  getUnitsData(elements: BaseData[], zones: IZone[], sizeMu: number) {
    let groups = JSON.parse(
      JSON.stringify(elements.filter((el) => el instanceof GroupFrame))
    );
    let data = groups.map((group: any) => {
      let groupZs: any[] = [];
      group.zones?.forEach((zone: any) => {
        let z = zones.find((z) => z.elementId == zone.elementId);
        //gn：使用运算符进行深拷贝，避免可能因为浅拷贝，更改group中zone的divder信息时影响groupZs的数据
        if(z) groupZs.push({...z})
      });

      // let groupZs = JSON.parse(JSON.stringify(group.zones));
      let dividers: any[] = [];
      group.zones?.forEach((zone: any) => {
        zone.dividers?.forEach((d: any) => {
          if (dividers.find((el) => el.id == d.id)) return;
          let div = elements.find((el) => el.id == d.id);
          if (div) dividers.push(div);
        });
      });

      return {
        canvas_data: JSON.stringify({
          components: [...group.children, ...dividers].map((child) => {
            return this.convertElementData(child, true, sizeMu);
          }),
          zones: groupZs.map((zone) => {
            if (!zone.dividers) zone.dividers = [];

            zone.dividers =
              zone.dividers?.map((divider: any) => {
                return {
                  ...divider,
                  length: divider.length * sizeMu,
                };
              }) || [];
            return zoneUntil.updateZoneLines(zone);
          }),
        }),
        unitId: group.unitId,
        virtualFrame: {
          x: group.virtualFrame.x * sizeMu,
          y: group.virtualFrame.y * sizeMu,
          width: group.virtualFrame.width * sizeMu,
          height: group.virtualFrame.height * sizeMu,
        },
      };
    });
    return data;
  }

  convertElementData(data: any, isEnlarge: boolean, sizeMultiples: number) {
    const converted = { ...data };
    const factor = isEnlarge ? sizeMultiples : 1 / sizeMultiples;

    const propsToConvert = ["x", "y", "width", "height", "lineWidth"];
    propsToConvert.forEach((prop) => {
      if (converted[prop] !== undefined) {
        converted[prop] *= factor;
      }
    });

    if (converted.virtualFrame) {
      converted.virtualFrame = {
        ...converted.virtualFrame,
        x: converted.virtualFrame.x * factor,
        y: converted.virtualFrame.y * factor,
        width: converted.virtualFrame.width * factor,
        height: converted.virtualFrame.height * factor,
      };
    }

    if (Array.isArray(converted.points)) {
      converted.points = converted.points.map((point: any) => ({
        ...point,
        x: point.x * factor,
        y: point.y * factor,
      }));
    }

    if (Array.isArray(converted.contentPoints)) {
      converted.contentPoints = converted.contentPoints.map((point: any) => ({
        ...point,
        x: point.x * factor,
        y: point.y * factor,
      }));
    }

    if (Array.isArray(converted.lines)) {
      converted.lines = converted.lines.map((line: any) => {
        if (!line) return line;
        return {
          ...line,
          startPoint: line.startPoint
            ? {
                ...line.startPoint,
                x: line.startPoint.x * factor,
                y: line.startPoint.y * factor,
              }
            : undefined,
          endPoint: line.endPoint
            ? {
                ...line.endPoint,
                x: line.endPoint.x * factor,
                y: line.endPoint.y * factor,
              }
            : undefined,
          center: line.center
            ? {
                ...line.center,
                x: line.center.x * factor,
                y: line.center.y * factor,
              }
            : undefined,
          radius: line.radius !== undefined ? line.radius * factor : undefined,
        };
      });
    }

    if (Array.isArray(converted.children)) {
      converted.children = converted.children.map((child: any) =>
        this.convertElementData(child, isEnlarge, sizeMultiples)
      );
    }
    return converted;
  }

  private getTemplateCode(
    operations: string[],
    orderInfo: { isLeftActive: boolean }
  ): { category: string; type: string; open: string } | null {
    if (operations.length === 0) {
      return {
        category: "Window",
        type: "Direct",
        open: "",
      };
    }

    const ops = new Set(operations);

    if (ops.has(OperationType.Fixed_W) || ops.has(OperationType.Fixed_D)) {
      return {
        category: "Window",
        type: "Direct",
        open: "",
      };
    }

    if (ops.has(OperationType.PIVOT_V)) {
      return {
        category: "Window",
        type: "Pivot",
        open: "Vertical",
      };
    }

    if (ops.has(OperationType.PIVOT_H)) {
      return {
        category: "Window",
        type: "Pivot",
        open: "Horizontal",
      };
    }

    if (ops.size <= 2) {
      if (ops.has(OperationType.INSWING)) {
        if (ops.has(OperationType.ANGLE_LEFT)) {
          return {
            category: "Window",
            type: "casement single",
            open: "single_l_hinge_inswing",
          };
        }
        if (ops.has(OperationType.ANGLE_RIGHT)) {
          return {
            category: "window",
            type: "casement single",
            open: "single_r_hinge_inswing",
          };
        }
      }

      if (ops.has(OperationType.OUTSWING)) {
        if (ops.has(OperationType.ANGLE_LEFT)) {
          return {
            category: "window",
            type: "casement single",
            open: "single_l_hinge_outswing",
          };
        }
        if (ops.has(OperationType.ANGLE_RIGHT)) {
          return {
            category: "window",
            type: "casement single",
            open: "single_r_hinge_outswing",
          };
        }
        if (ops.has(OperationType.ANGLE_UP)) {
          return {
            category: "window",
            type: "Awning",
            open: "outswing_open",
          };
        }
      }
    }

    if (ops.has(OperationType.INSWING) && ops.has(OperationType.ANGLE_DOWN)) {
      if (ops.has(OperationType.ANGLE_LEFT)) {
        return {
          category: "window",
          type: "Tilt & Turn",
          open: "b_l_hinger_inswing",
        };
      }
      if (ops.has(OperationType.ANGLE_RIGHT)) {
        return {
          category: "window",
          type: "Tilt & Turn",
          open: "b_r_hinger_inswing",
        };
      }
      return {
        category: "window",
        type: "Hopper",
        open: "inswing_open",
      };
    }

    if (
      ops.has(OperationType.ANGLE_LEFT) &&
      ops.has(OperationType.ANGLE_RIGHT)
    ) {
      if (ops.has(OperationType.INSWING)) {
        if (ops.has(OperationType.ACTIVE) && ops.has(OperationType.PASSIVE)) {
          return {
            category: "window",
            type: "Casement Double",
            open: orderInfo.isLeftActive
              ? "double_l_active_in_r_fixed"
              : "double_l_fixed_r_active_in",
          };
        }
        return {
          category: "window",
          type: "Casement Double",
          open: "double_lr_inswing",
        };
      }

      if (ops.has(OperationType.OUTSWING)) {
        if (ops.has(OperationType.ACTIVE) && ops.has(OperationType.PASSIVE)) {
          return {
            category: "window",
            type: "Casement Double",
            open: orderInfo.isLeftActive
              ? "double_l_active_out_r_fixed"
              : "double_l_fixed_r_active_out",
          };
        }
        return {
          category: "window",
          type: "Casement Double",
          open: "double_lr_outswing",
        };
      }
    }

    return null;
  }

  /**
   * 查找给定点集中距离目标点最近的点
   * @param targetPoint 目标点坐标
   * @param points 点集数组
   * @returns 包含最近点坐标和索引的对象，如果点集为空则返回null
   */
  findNearestPoint(
    targetPoint: IPointPostion,
    points: IPointPostion[]
  ): { point: IPointPostion; index: number } | null {
    if (!targetPoint || !points || points.length === 0) {
      return null;
    }
    let nearestPoint: IPointPostion | null = null;
    let nearestIndex: number = -1;
    let minDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (!point) continue;

      const dx = point.x - targetPoint.x;
      const dy = point.y - targetPoint.y;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < minDistance) {
        minDistance = distanceSquared;
        nearestPoint = point;
        nearestIndex = i;
      }
    }

    if (nearestPoint === null || nearestIndex === -1) {
      return null;
    }

    return {
      point: nearestPoint,
      index: nearestIndex,
    };
  }

  /**
   * 检查一个元素是否在另一个元素内部
   */
  isFrameInsideElement(
    frame: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
    element: {
      virtualFrame: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      type?: string;
    }
  ): boolean {
    const frameCenter = {
      x: frame.x + frame.width / 2,
      y: frame.y + frame.height / 2,
    };

    const elementBounds = element.virtualFrame;
    if (!element.type?.includes("Arch")) {
      return (
        frameCenter.x >= elementBounds.x &&
        frameCenter.x <= elementBounds.x + elementBounds.width &&
        frameCenter.y >= elementBounds.y &&
        frameCenter.y <= elementBounds.y + elementBounds.height
      );
    }

    if (element.type?.includes("Arch-h")) {
      const isInRectPart =
        frameCenter.x >= elementBounds.x &&
        frameCenter.x <= elementBounds.x + elementBounds.width &&
        frameCenter.y >= elementBounds.y + elementBounds.height / 2 &&
        frameCenter.y <= elementBounds.y + elementBounds.height;

      if (isInRectPart) return true;

      if (frameCenter.y < elementBounds.y + elementBounds.height / 2) {
        const centerX = elementBounds.x + elementBounds.width / 2;
        const centerY = elementBounds.y + elementBounds.height / 2;
        const radius = elementBounds.width / 2;

        const distance = Math.sqrt(
          Math.pow(frameCenter.x - centerX, 2) +
            Math.pow(frameCenter.y - centerY, 2)
        );

        return distance <= radius;
      }
    } else if (element.type?.includes("Arch-v")) {
      const isInRectPart =
        frameCenter.x >= elementBounds.x &&
        frameCenter.x <= elementBounds.x + elementBounds.width / 2 &&
        frameCenter.y >= elementBounds.y &&
        frameCenter.y <= elementBounds.y + elementBounds.height;

      if (isInRectPart) return true;

      if (frameCenter.x > elementBounds.x + elementBounds.width / 2) {
        const centerX = elementBounds.x + elementBounds.width / 2;
        const centerY = elementBounds.y + elementBounds.height / 2;
        const radius = elementBounds.height / 2;

        const distance = Math.sqrt(
          Math.pow(frameCenter.x - centerX, 2) +
            Math.pow(frameCenter.y - centerY, 2)
        );

        return distance <= radius;
      }
    }

    return false;
  }

  /**
   * 获取元素的中心点位置
   * @param element 元素数据或其virtualFrame
   * @returns 中心点坐标 {x, y}
   */
  getElementCenter(element: BaseData | IVertualFrame | any): IPointPostion {
    const frame = element.virtualFrame || element;

    return {
      x: frame.x + frame.width / 2,
      y: frame.y + frame.height / 2,
    };
  }

  /**
   * 根据中心点和虚拟框架尺寸计算新的左上角坐标
   * @param centerPoint 中心点坐标
   * @param frameSize 框架尺寸 {width, height}
   * @returns 新的左上角坐标 {x, y}
   */
  getPositionFromCenter(
    centerPoint: IPointPostion,
    frameSize: { width: number; height: number }
  ): { x: number; y: number } {
    return {
      x: centerPoint.x - frameSize.width / 2,
      y: centerPoint.y - frameSize.height / 2,
    };
  }

  findOverlapOperElements(oper: BaseOperation, zone: IZone) {
    if (!zone.operations || zone.operations.length === 0) {
      return null;
    }

    const operFrame = {
      x: oper.virtualFrame.x,
      y: oper.virtualFrame.y,
      width: oper.virtualFrame.width,
      height: oper.virtualFrame.height,
    };

    for (const existingOper of zone.operations) {
      if (existingOper.id === oper.id) {
        continue;
      }

      const existingFrame = {
        x: existingOper.virtualFrame.x,
        y: existingOper.virtualFrame.y,
        width: existingOper.virtualFrame.width,
        height: existingOper.virtualFrame.height,
      };

      const isOverlapping = !(
        operFrame.x > existingFrame.x + existingFrame.width ||
        operFrame.x + operFrame.width < existingFrame.x ||
        operFrame.y > existingFrame.y + existingFrame.height ||
        operFrame.y + operFrame.height < existingFrame.y
      );

      if (isOverlapping) {
        const padding = -5;
        const newX = existingFrame.x + existingFrame.width + padding;

        const newY = operFrame.y;

        return { x: newX, y: newY };
      }
    }

    return null;
  }

  /**
   * 查找元素集合中的最小x和y坐标
   * @param elements 元素数组
   * @returns 包含最小x和y坐标的对象 {minX, minY}
   */
  findMinimumCoordinates(elements: BaseData[]): { minX: number; minY: number } {
    if (!elements || elements.length === 0) {
      return { minX: 0, minY: 0 };
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;

    elements.forEach((element) => {
      if (element.virtualFrame) {
        minX = Math.min(minX, element.virtualFrame.x);
        minY = Math.min(minY, element.virtualFrame.y);
      }
    });

    if (
      minX === Number.POSITIVE_INFINITY ||
      minY === Number.POSITIVE_INFINITY
    ) {
      return { minX: 0, minY: 0 };
    }

    return { minX, minY };
  }
  
  
    /**
     * 检测divider与pocketwall的重叠区域
     * @param divider divider元素
     * @param pocketWalls pocketwall元素数组
     * @returns 重叠区域数组
     */
    detectDividerPocketWallOverlap(
        divider: any,
        groupFrame: GroupFrame
    ): Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        pocketWallId: string;
    }> {
        const overlaps: Array<{
            x: number;
            y: number;
            width: number;
            height: number;
            pocketWallId: string;
        }> = [];

        const dividerRect = {
            x: divider.virtualFrame.x,
            y: divider.virtualFrame.y,
            width: divider.virtualFrame.width,
            height: divider.virtualFrame.height
        };

        const pocketWalls = groupFrame.children.filter(child => child.type === OperationType.POCKET_WALL);
        
        if(pocketWalls.length === 0) return [];

        pocketWalls.forEach((pocketWall: BaseData) => {
            const wallBorderWidth = 1;
            const pocketRect = {
                x: pocketWall.virtualFrame.x,
                y: pocketWall.virtualFrame.y,
                width: pocketWall.virtualFrame.width,
                height: pocketWall.virtualFrame.height
            };
            const wallInnerRect = {
                x: pocketRect.x + wallBorderWidth,
                y: pocketRect.y + wallBorderWidth,
                width: pocketRect.width - wallBorderWidth * 2,
                height: pocketRect.height - wallBorderWidth * 2
            };

            // 计算重叠区域
            let overlapX = Math.max(dividerRect.x, wallInnerRect.x);
            let overlapY = Math.max(dividerRect.y, wallInnerRect.y);
            let overlapWidth = Math.min(dividerRect.x + dividerRect.width, wallInnerRect.x + wallInnerRect.width) - overlapX;
            let overlapHeight = Math.min(dividerRect.y + dividerRect.height, wallInnerRect.y + wallInnerRect.height) - overlapY;

            const adjust = 1; // 你可以根据实际视觉效果微调

            if (overlapWidth > 0 && overlapHeight > 0) {
                // 判断重叠边,目前暂不处理
                // const isLeft = Math.abs(overlapX - wallInnerRect.x) < 0.5;
                // const isRight = Math.abs((overlapX + overlapWidth) - (wallInnerRect.x + wallInnerRect.width)) < 0.5;
                // const isTop = Math.abs(overlapY - wallInnerRect.y) < 0.5;
                // const isBottom = Math.abs((overlapY + overlapHeight) - (wallInnerRect.y + wallInnerRect.height)) < 0.5;


                // if (isLeft) {
                    
                // } else if (isRight) {
        
                // } else if (isTop) {
                    
                // } else if (isBottom) {
                    
                // }

                
                overlaps.push({
                    x: overlapX,
                    y: overlapY,
                    width: overlapWidth,
                    height: overlapHeight,
                    pocketWallId: pocketWall.id
                });
               
            }
        });

        return overlaps;
    }
}

const baseUntil = new BaseUntil();
export default baseUntil;
