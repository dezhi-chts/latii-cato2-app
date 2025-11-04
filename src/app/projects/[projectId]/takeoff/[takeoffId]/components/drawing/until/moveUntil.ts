import { BaseFrame } from "../data/baseFrame";
import lineUntil from "./lineUntil";
import {IPointPostion, TBaseFrameOutLine} from "../datas";
import { arcUntil } from "./arcUntil";
import {HorizontalLineWindow, VerticalLineWindow} from "../data/shape/line";
import {
  SDLHorizontal,
  SDLVertical,
  TDLHorizontal,
  TDLVertical
} from "../data/divider/divider";
import {RenderData} from "../data/render/renderData";
import {GroupFrame} from "../data/groupFrame";
import {BaseData} from "../data/baseData";

// 在文件开头定义交点信息接口
interface IIntersectionInfo {
  point: IPointPostion;
  elementId: string;
  element?: any;
  lineEleId: string;
  lineIndex?: number;
  lineId?: string;
  lineInfo?: any;
  overlapInfo?: any;
}

class MoveUntil {
  handleLineMove = (frame: HorizontalLineWindow | VerticalLineWindow, elements: any[], isClear: boolean = true) => {
    let newX = frame.virtualFrame.x;
    let newY = frame.virtualFrame.y;
    let targetFrames: BaseFrame[] = [];
    // 清理现有的渲染点
    isClear && this.clearFrameRenderInfo(frame, elements);

    if((frame.type == 'Line-h' && (frame.points[0].x > frame.points[1].x)) || (frame.type == 'Line-v' && (frame.points[0].y > frame.points[1].y))) {
      let temp = frame.points[0];
      frame.points[0] = frame.points[1];
      frame.points[1] = temp;
    }
    let lineStart = frame.points[0], lineEnd = frame.points[1];

    // 检查线条是否在多个框架内部
    for (const element of elements) {
      if (element.id === frame.id || 
          !(element instanceof BaseFrame) || 
          element.type.startsWith('Line')) continue;

      // 获取所有需要检查的点（原始点和等分点）
      const checkPoints = lineUntil.getDividedPoints(frame);
      let isInside = false;
      
      for (const point of checkPoints) {
        if (
          point.x > element.virtualFrame.x &&
          point.x < element.virtualFrame.x + element.virtualFrame.width &&
          point.y > element.virtualFrame.y &&
          point.y < element.virtualFrame.y + element.virtualFrame.height
        ) {
          isInside = true;
          break;
        }
      }

      if (isInside) {
        targetFrames.push(element);
      }
    }
    if (!targetFrames.length) {
      return { newX, newY, updated: false };
    }

    let intersectionPoints: Array<{
      point: IPointPostion;
      info: IIntersectionInfo;
    }> = [];

    const lineDirection = {
      x: lineEnd.x - lineStart.x,
      y: lineEnd.y - lineStart.y
    };

    const extensionFactor = 10000;

    const extendedLineStart = {
      x: lineStart.x - lineDirection.x * extensionFactor,
      y: lineStart.y - lineDirection.y * extensionFactor
    };

    const extendedLineEnd = {
      x: lineEnd.x + lineDirection.x * extensionFactor,
      y: lineEnd.y + lineDirection.y * extensionFactor
    };

    // 记录被当前线条覆盖的线条ID
    const overlappedLineIds = new Set<string>();

    // 首先检测当前线条是否覆盖了其他线条
    let skipElements = new Set<string>();
    let lineElements: Array<VerticalLineWindow | HorizontalLineWindow> = elements.filter(ele => ele.type.startsWith('Line') && ele.id != frame.id)
    for (const element of lineElements) {
      // 获取线条的主线
      let otherLineStart, otherLineEnd;

      if (frame.type != 'Line-h') {
        otherLineStart = {
          x: element.virtualFrame.x,
          y: element.virtualFrame.y
        };
        otherLineEnd = {
          x: element.virtualFrame.x + element.virtualFrame.width,
          y: element.virtualFrame.y
        };
      } else if (element.type === 'Line-v') {
        otherLineStart = {
          x: element.virtualFrame.x,
          y: element.virtualFrame.y
        };
        otherLineEnd = {
          x: element.virtualFrame.x,
          y: element.virtualFrame.y + element.virtualFrame.height
        };
      }

      if (otherLineStart && otherLineEnd) {
        // 检查两条线是否相交（不是延长线，而是线条本体）
        const lineStartX = frame.type == "Line-v" ? lineStart.x : lineStart.x + 10
        const lineStartY = frame.type == "Line-v" ? lineStart.y + 10 : lineStart.y
        const lineEndX = frame.type == "Line-v" ? lineEnd.x : lineEnd.x - 10
        const lineEndY = frame.type == "Line-v" ? lineEnd.y - 10 : lineEnd.y

        const isIntersecting = lineUntil.doLinesIntersect(
          lineStartX, lineStartY, lineEndX, lineEndY,
          otherLineStart.x, otherLineStart.y, otherLineEnd.x, otherLineEnd.y
        );
        // const isIntersecting = lineUntil.doLinesIntersect(
        //   lineStart.x, lineStart.y, lineEnd.x, lineEnd.y,
        //   otherLineStart.x, otherLineStart.y, otherLineEnd.x, otherLineEnd.y
        // );

        if (isIntersecting) {
          // 如果线条相交，将该元素添加到跳过列表中
          skipElements.add(element.id);
        }
      }
    }
    // 检查线条是否与所有元素的边有交点
    for (const element of elements) {
      if (element.id === frame.id || skipElements.has(element.id)) continue;
      if (!(element instanceof BaseFrame)) continue;
      if(element instanceof GroupFrame) continue;
      const edges:any[] = [];

      if (element.type === "Triangle") {
        const innerPoints = element.points;
        if (innerPoints && innerPoints.length === 3) {
          for (let i = 0; i < 3; i++) {
            const nextIndex = (i + 1) % 3;
            if(element.lines[i].isCut) {
              edges.push({})
              continue;
            }
            edges.push({
              startPoint: innerPoints[i],
              endPoint: innerPoints[nextIndex]
            });
          }
        }
      }
      else if (element.type === "Arch-h" || element.type === "Arch-v") {
        const innerPoints = element.points;

        if (innerPoints && innerPoints.length >= 2) {
          if(element.lines[0].isCut) {
            edges.push({})
          }else edges.push({
            startPoint: innerPoints[0],
            endPoint: innerPoints[1]
          });
        }

        if (element.lines && element.lines.length > 0) {
          for (const line of element.lines) {
            if (!line.isCut && line.center && line.radius) {
              const arcLine = {
                isArc: true,
                center: line.center,
                radius: line.radius,
                startPoint: innerPoints[0],
                endPoint: innerPoints[1],
                angle: line.angle,
                isFlip: element.flipY || element.flipX,
              };
              edges.push(arcLine);
            }
          }
        }
      }
      else if (element.type.startsWith('Line')) {
        edges.push(element.lines[0]);
      }
      // 处理普通多边形
      else if (element.points && element.points.length > 0) {
        const innerPoints = element.points;
        if (innerPoints && innerPoints.length > 0) {
          for (let i = 0; i < innerPoints.length; i++) {
            const nextIndex = (i + 1) % innerPoints.length;
            if(element.lines[i].isCut) {
              edges.push({})
              continue;
            }
            edges.push({
              startPoint: innerPoints[i],
              endPoint: innerPoints[nextIndex]
            });
          }
        }
      }
      for (const edge of edges) {
        if(!edge.startPoint) continue;
        if (edge.isArc) {
          const circle = {
            center: edge.center,
            radius: edge.radius
          };

          const line = {
            start: extendedLineStart,
            end: extendedLineEnd
          };

          const intersections = lineUntil.getCircleLineIntersection(circle, line,);
          if (intersections && intersections.length > 0) {
            for (const intersection of intersections) {
              const isInArcRange = arcUntil.isPointInArcRange(
                intersection,
                edge.center,
                edge.startPoint,
                edge.endPoint,
                edge.angle,
                edge.isFlip,
              );
              if (isInArcRange) {
                const intersectionInfo: IIntersectionInfo = {
                  point: { ...intersection },
                  elementId: element.id,
                  element: element,
                  lineIndex: edges.indexOf(edge),
                  lineId: element.lines[edges.indexOf(edge)]?.id,
                  lineInfo: edge,
                  lineEleId: frame.id,
                  overlapInfo: edge.overlapInfo
                };

                intersectionPoints.push({
                  point: intersection,
                  info: intersectionInfo
                });
              }
            }
          }
        } else {
          // 普通线段的交点计算
          const intersection = lineUntil.lineIntersection(
            extendedLineStart,
            extendedLineEnd,
            edge.startPoint,
            edge.endPoint
          );
          if (intersection) {
            const lineIndex = edges.indexOf(edge);
            const nextIndex = (lineIndex + 1) % (element.type === 'Triangle' ? 3 : element.type.startsWith('Line') ? 2: 4);

            const lineInfo = {
              startPoint: element.points[lineIndex],
              endPoint: element.points[nextIndex],
            };

            const intersectionInfo: IIntersectionInfo = {
              point: { ...intersection },
              elementId: element.id,
              element: element,
              lineEleId: frame.id,
              lineIndex: lineIndex,
              lineId: element.lines[lineIndex]?.id,
              lineInfo,
              overlapInfo: edge.overlapInfo
            };

            // 存储交点信息
            intersectionPoints.push({
              point: intersection,
              info: intersectionInfo
            });
          }
        }
      }
      // 处理线条元素的主线
      if (element.type.startsWith('Line') && !overlappedLineIds.has(element.id)) {
        // 获取线条的主线
        let lineSegment = null;

        if (element.type === 'Line-h') {
          lineSegment = {
            startPoint: { x: element.virtualFrame.x, y: element.virtualFrame.y },
            endPoint: { x: element.virtualFrame.x + element.virtualFrame.width, y: element.virtualFrame.y }
          };
        } else if (element.type === 'Line-v') {
          lineSegment = {
            startPoint: { x: element.virtualFrame.x, y: element.virtualFrame.y },
            endPoint: { x: element.virtualFrame.x, y: element.virtualFrame.y + element.virtualFrame.height }
          };
        }

        if (lineSegment) {
          // 计算延长线与线条的交点
          const intersection = lineUntil.lineIntersection(
            extendedLineStart,
            extendedLineEnd,
            lineSegment.startPoint,
            lineSegment.endPoint
          );

          if (intersection) {
            const intersectionInfo: IIntersectionInfo = {
              point: { ...intersection },
              elementId: element.id,
              element: element,
              lineIndex: 0,
              lineId: element.lines[0]?.id,
              lineInfo: element.lines[0],
              lineEleId: frame.id,
            };

            // 存储交点信息
            intersectionPoints.push({
              point: intersection,
              info: intersectionInfo
            });
          }
        }
      }

      if ((element as any).lineElements && (element as any).lineElements.length > 0) {
        for (const lineEle of (element as any).lineElements) {
          if (lineEle.id === frame.id || skipElements.has(lineEle.id)) continue;
          // 获取线条的起点和终点
          let lineStart, lineEnd;

          if (lineEle.type === 'Line-h') {
            // 水平线
            lineStart = {
              x: lineEle.virtualFrame.x,
              y: lineEle.virtualFrame.y
            };
            lineEnd = {
              x: lineEle.virtualFrame.x + lineEle.virtualFrame.width,
              y: lineEle.virtualFrame.y
            };
          } else if (lineEle.type === 'Line-v') {
            // 垂直线
            lineStart = {
              x: lineEle.virtualFrame.x,
              y: lineEle.virtualFrame.y
            };
            lineEnd = {
              x: lineEle.virtualFrame.x,
              y: lineEle.virtualFrame.y + lineEle.virtualFrame.height
            };
          } else {
            continue; // 跳过非线条元素
          }

          // 计算当前线条与lineEle的交点
          const intersection = lineUntil.lineIntersection(
            extendedLineStart,
            extendedLineEnd,
            lineStart,
            lineEnd
          );
          if (intersection) {
            // 调整交点坐标（对于水平线和垂直线）
            if (frame.type === 'Line-h' && lineEle.type === 'Line-v') {
              intersection.y = lineEle.virtualFrame.y;
            } else if (frame.type === 'Line-v' && lineEle.type === 'Line-h') {
              intersection.x = lineEle.virtualFrame.x;
            }

            // 检查交点是否在线段上而不仅是延长线上
            const isOnLineEle = lineUntil.isPointOnLineSegment(lineStart, lineEnd, intersection);
            if (isOnLineEle) {
              const intersectionInfo: IIntersectionInfo = {
                point: { ...intersection },
                elementId: lineEle.id,
                element: lineEle,
                lineEleId: frame.id,
                lineIndex: 0,
                lineId: lineEle.lines[0]?.id,
                lineInfo: {
                  startPoint: lineStart,
                  endPoint: lineEnd
                }
              };

              // 存储交点信息
              intersectionPoints.push({
                point: intersection,
                info: intersectionInfo
              });
            }
          }
        }
      }
    }
    let actualIntersections:any[] = [];
    let extendedIntersections:any[] = [];

    // 遍历所有已收集的交点
    for (const intersection of intersectionPoints) {
      if (!intersection.info.element.lines?.length) {
        continue;
      }

      // 检查交点是否在原始线段上
      const isOnOriginalLine = lineUntil.isPointOnLineSegment(
        lineStart,
        lineEnd,
        intersection.point
      );

      // 将交点分到对应的数组中
      if (isOnOriginalLine) {
        actualIntersections.push(intersection);
      } else {
        extendedIntersections.push(intersection);
      }
    }
    // 排序
    actualIntersections.sort((a, b) => {
      if (frame.type === 'Line-h') {
        // 先按x坐标从小到大排序
        if (a.point.x !== b.point.x) {
          return a.point.x - b.point.x;
        }
        // x坐标相同时，按y坐标排序
        if (a.point.y !== b.point.y) {
          return a.point.y - b.point.y;
        }
        // xy都相同时，按elementId排序
        return a.info.elementId.localeCompare(b.info.elementId);
      } else {
        // 先按y坐标从小到大排序
        if (a.point.y !== b.point.y) {
          return a.point.y - b.point.y;
        }
        // y坐标相同时，按x坐标排序
        if (a.point.x !== b.point.x) {
          return a.point.x - b.point.x;
        }
        // xy都相同时，按elementId排序
        return a.info.elementId.localeCompare(b.info.elementId);
      }
    });
    extendedIntersections.sort((a, b) => {
      if (frame.type === 'Line-h') {
        // 先按x坐标从小到大排序
        if (a.point.x !== b.point.x) {
          return a.point.x - b.point.x;
        }
        // x坐标相同时，按y坐标排序
        if (a.point.y !== b.point.y) {
          return a.point.y - b.point.y;
        }
        // xy都相同时，按elementId排序
        return a.info.elementId.localeCompare(b.info.elementId);
      } else {
        // 先按y坐标从小到大排序
        if (a.point.y !== b.point.y) {
          return a.point.y - b.point.y;
        }
        // y坐标相同时，按x坐标排序
        if (a.point.x !== b.point.x) {
          return a.point.x - b.point.x;
        }
        // xy都相同时，按elementId排序
        return a.info.elementId.localeCompare(b.info.elementId);
      }
    });
    // 添加交点验证逻辑
    const validateIntersectionPair = (start: any, end: any) => {
      // 检查两个交点是否在同一条线上
      if ((start.info.elementId === end.info.elementId &&
          start.info.lineId === end.info.lineId && start.info.element.type.startsWith('Line')) ||
          this.isSamePoint(start.info.point, end.info.point)
      ) {
        return false;
      }
      return true;
    };

    // 修改交点选择逻辑
    let startIntersection:any = null;
    let endIntersection :any= null;
    let startIntersectionInfo:any = null;
    let endIntersectionInfo :any= null;
    let actualOnePoint = actualIntersections.length == 2 && !this.isSamePoint(actualIntersections[0].point, actualIntersections[1].point)
    // 1. 处理实际交点
    if (actualIntersections.length > 2 || actualOnePoint) {
      // 寻找有效的交点对
      for (let i = 0; i < actualIntersections.length - 1; i++) {
        // for (let j = i + 1; j < actualIntersections.length; j++) {
          if (validateIntersectionPair(actualIntersections[i], actualIntersections[i+1])) {
            startIntersection = actualIntersections[i].point;
            startIntersectionInfo = actualIntersections[i].info;
            endIntersection = actualIntersections[i+1].point;
            endIntersectionInfo = actualIntersections[i+1].info;
            break;
          }
        // }
        if (startIntersection && endIntersection) break;
      }
    }
    // 2. 如果actualIntersections真实交点相同，取另一边最近的延长交点
    else if (actualIntersections.length == 2 && this.isSamePoint(actualIntersections[0].point, actualIntersections[1].point) && extendedIntersections.length > 0) {
      const actualPoint = actualIntersections[0].point;

      // 判断真实交点是作为起点还是终点
      let isActualPointStart = true;
      if (frame.type === 'Line-h') {
        const midX = (lineStart.x + lineEnd.x) / 2;
        isActualPointStart = actualPoint.x <= midX;
      } else {
        const midY = (lineStart.y + lineEnd.y) / 2;
        isActualPointStart = actualPoint.y <= midY;
      }
      // 计算每个延长线交点到对应端点的距离
      const distances = extendedIntersections.map((intersection, index) => {
        let distance;
        if (isActualPointStart) {
          // 如果实际点是起点，计算到终点的距离
          const dx = intersection.point.x - lineEnd.x;
          const dy = intersection.point.y - lineEnd.y;
          distance = Math.sqrt(dx * dx + dy * dy);
        } else {
          // 如果实际点是终点，计算到起点的距离
          const dx = intersection.point.x - lineStart.x;
          const dy = intersection.point.y - lineStart.y;
          distance = Math.sqrt(dx * dx + dy * dy);
        }
        return { index, distance };
      });

      // 找到最近的延长线交点
      distances.sort((a, b) => a.distance - b.distance);
      const nearestExtendedIntersection = extendedIntersections[distances[0].index];

      // 根据延长线交点的elementId选择对应的真实交点信息
      const matchingActualIntersection = actualIntersections.find(intersection => {
        if(intersection.info.elementId === nearestExtendedIntersection.info.elementId) return true;
        if(intersection.info.element.lineElements) {
          if(intersection.info.element.lineElements.find((line:any) => line.id === nearestExtendedIntersection.info.elementId)) {
            return true;
          }
        }
        return false;
      }) || actualIntersections[0];

      if (isActualPointStart) {
        startIntersection = actualPoint;
        startIntersectionInfo = matchingActualIntersection.info;
        endIntersection = nearestExtendedIntersection.point;
        endIntersectionInfo = nearestExtendedIntersection.info;
      } else {
        startIntersection = nearestExtendedIntersection.point;
        startIntersectionInfo = nearestExtendedIntersection.info;
        endIntersection = actualPoint;
        endIntersectionInfo = matchingActualIntersection.info;
      }
    }
    // 3. 如果actualIntersections有一个交点，判断其与extendedIntersections的关系
    else if ((actualIntersections.length == 1 && extendedIntersections.length > 0)) {
      const actualPoint = actualIntersections[0].point;
      const actualElement = actualIntersections[0].info;

      let isActualPointStart = true;
      if (frame.type === 'Line-h') {
        // 对于水平线，比较x坐标
        // 如果actualPoint的x更接近lineStart，则认为它是起点
        const midX = (lineStart.x + lineEnd.x) / 2;
        isActualPointStart = actualPoint.x <= midX;
      } else {
        // 对于垂直线，比较y坐标
        // 如果actualPoint的y更接近lineStart，则认为它是起点
        const midY = (lineStart.y + lineEnd.y) / 2;
        isActualPointStart = actualPoint.y <= midY;
      }
      const distances = extendedIntersections.map((intersection, index) => {
        let distance;
        if (isActualPointStart) {
          // 如果实际点是起点，计算到终点的距离
          const dx = intersection.point.x - lineEnd.x;
          const dy = intersection.point.y - lineEnd.y;
          distance = Math.sqrt(dx * dx + dy * dy);
        } else {
          // 如果实际点是终点，计算到起点的距离
          const dx = intersection.point.x - lineStart.x;
          const dy = intersection.point.y - lineStart.y;
          distance = Math.sqrt(dx * dx + dy * dy);
        }
        return { index, distance };
      });

      distances.sort((a, b) => {
        if (Math.abs(a.distance - b.distance) < 0.001) {
          if (extendedIntersections[a.index].info.elementId === actualElement.elementId) return -1;
          if (extendedIntersections[b.index].info.elementId === actualElement.elementId) return 1;
          // 都不同时按elementId字母顺序排序
          return extendedIntersections[a.index].info.elementId.localeCompare(extendedIntersections[b.index].info.elementId);
        }
        return a.distance - b.distance;
      });
      // 获取最近的延长线交点
      const nearestExtendedIntersection = extendedIntersections[distances[0].index];

      if (isActualPointStart) {
        endIntersection = actualPoint;
        endIntersectionInfo = actualElement;
        startIntersection = nearestExtendedIntersection.point;
        startIntersectionInfo = nearestExtendedIntersection.info;
      } else {
        endIntersection = nearestExtendedIntersection.point;
        endIntersectionInfo = nearestExtendedIntersection.info;
        startIntersection = actualPoint;
        startIntersectionInfo = actualElement;
      }
    }
    // 4. 如果actualIntersections为空，找出延长线交点只有两个
    else if (actualIntersections.length === 0 && extendedIntersections.length == 2) {
      startIntersection = extendedIntersections[0].point;
      startIntersectionInfo = extendedIntersections[0].info;
      endIntersection = extendedIntersections[1].point;
      endIntersectionInfo = extendedIntersections[1].info;
    }
    // 5. 如果actualIntersections为空，找出延长线两个方向上最近的交点
    else if (actualIntersections.length === 0 && extendedIntersections.length >= 2) {
      let calcInterSections = extendedIntersections.filter(intersection => {
        return intersection.info.elementId.startsWith('Line') || targetFrames.find(frame => intersection.info.elementId == frame.id)
      })
      // 计算每个交点到线段起点和终点的距离
      const distanceToStart:Map<number, number> = new Map();
      const distanceToEnd:Map<number, number> = new Map();

      calcInterSections.forEach((intersection, index) => {
        if(frame.type == 'Line-h' && intersection.point.x > lineStart.x || frame.type == 'Line-v' &&  intersection.point.y > lineStart.y) {
          // 计算到起点的距离
          const dxStart = intersection.point.x - lineStart.x;
          const dyStart = intersection.point.y - lineStart.y;
          distanceToStart.set(index, Math.sqrt(dxStart * dxStart + dyStart * dyStart))
        }

        if(frame.type == 'Line-h' && intersection.point.x < lineEnd.x || frame.type == 'Line-v' && intersection.point.y < lineEnd.y) {
          // 计算到终点的距离
          const dxEnd = intersection.point.x - lineEnd.x;
          const dyEnd = intersection.point.y - lineEnd.y;
          distanceToEnd.set(index, Math.sqrt(dxEnd * dxEnd + dyEnd * dyEnd))
        }
      });
      // 找出距离起点最近的交点索引
      let nearestToStartIndex = 0;
      let minDistanceToStart = 800;
      // for (let i = 1; i < extendedIntersections.length; i++) {
      //   if ((distanceToStart[i]|| 0) < minDistanceToStart) {
      //     minDistanceToStart = distanceToStart[i];
      //     nearestToStartIndex = i;
      //   }
      // }
      distanceToStart?.forEach((value, index) => {
        if(value < minDistanceToStart) {
            minDistanceToStart = value;
            nearestToStartIndex = index;
        }
      })

      // 找出距离终点最近的交点索引
      let nearestToEndIndex = 0;
      let minDistanceToEnd = 800;
      distanceToEnd?.forEach((value, index) => {
        if(value < minDistanceToEnd) {
          minDistanceToEnd = value;
          nearestToEndIndex = index;
        }
      })

      // 根据线条类型确定起点和终点
      if (frame.type === 'Line-h') {
        if (calcInterSections[nearestToStartIndex].point.x > calcInterSections[nearestToEndIndex].point.x) {
          let temp = nearestToStartIndex;
          nearestToStartIndex = nearestToEndIndex;
          nearestToEndIndex = temp;
        }
      } else { // Line-v
        if (calcInterSections[nearestToStartIndex].point.y > calcInterSections[nearestToEndIndex].point.y) {
          let temp = nearestToStartIndex;
          nearestToStartIndex = nearestToEndIndex;
          nearestToEndIndex = temp;
        }
      }

      startIntersection = calcInterSections[nearestToStartIndex].point;
      startIntersectionInfo = calcInterSections[nearestToStartIndex].info;
      endIntersection = calcInterSections[nearestToEndIndex].point;
      endIntersectionInfo = calcInterSections[nearestToEndIndex].info;
    }
    // 如果只有一个交点，则无法确定起始点
    else if (extendedIntersections.length === 1) {
      // 无法确定两个交点，不更新
      return { newX, newY, updated: false };
    }

    if (startIntersection && endIntersection) {
        const transfer = (frame.type === 'Line-h' && startIntersection.x > endIntersection.x) ||
        (frame.type === 'Line-v' && startIntersection.y > endIntersection.y)

        if (frame.type === 'Line-h') {
          if (transfer) {
            let temp = startIntersection;
            startIntersection = endIntersection;
            endIntersection = temp;
            temp = startIntersectionInfo;
            startIntersectionInfo = endIntersectionInfo
            endIntersectionInfo = temp
          }
          newX = startIntersection.x;
          // newY = startIntersection.y;
          const newWidth = endIntersection.x - startIntersection.x;
          // if(newWidth < 1) return;
          frame.virtualFrame.width = newWidth;
          frame.points[0].x = newX;
          frame.points[1].x = newX + newWidth;

          frame.updateParams({ x: frame.points[0].x, y: frame.points[0].y, width:newWidth });
        }
        else if (frame.type === 'Line-v') {
          if (transfer) {
            let temp = startIntersection;
            startIntersection = endIntersection;
            endIntersection = temp;
            temp = startIntersectionInfo;
            startIntersectionInfo = endIntersectionInfo
            endIntersectionInfo = temp
          }
          newX = startIntersection.x;
          newY = startIntersection.y;
          const newHeight = endIntersection.y - startIntersection.y;
          frame.points[0].y = newY;
          frame.points[1].y = newY + newHeight;
          frame.updateParams({ x: frame.points[0].x, y: frame.points[0].y, height:newHeight });
        }

        const startLine = [{ ...frame.points[0] }];
        const endLine = [{ ...frame.points[1] }];

        if(!startIntersectionInfo.lineId) {
          const overElement = elements.find(elem => elem.id === startIntersectionInfo.overlapInfo.elementId);
          overElement.savePoints(startIntersectionInfo.overlapInfo, startIntersection,frame.id, true)
        } else
        startIntersectionInfo.element?.addRenderPoints(startIntersectionInfo.lineId, frame.id, startLine);
        const isClear = startIntersectionInfo.elementId != endIntersectionInfo.elementId;
        if(!endIntersectionInfo.lineId) {
          const overElement = elements.find(elem => elem.id === endIntersectionInfo.overlapInfo.elementId);
          overElement.savePoints(endIntersectionInfo.overlapInfo,endIntersection,frame.id, isClear)
        } else
          endIntersectionInfo.element?.addRenderPoints(endIntersectionInfo.lineId,frame.id,endLine, isClear);

        targetFrames = []
        for (const element of elements) {
          if (element.id === frame.id ||
            !(element instanceof BaseFrame) ||
            element.type.startsWith('Line')) continue;

          // 获取所有需要检查的点（原始点和等分点）

          const checkPoints = lineUntil.getDividedPoints(frame);
          let isInside = false;

          for (const point of checkPoints) {
            if (
              point.x > element.virtualFrame.x &&
              point.x < element.virtualFrame.x + element.virtualFrame.width &&
              point.y > element.virtualFrame.y &&
              point.y < element.virtualFrame.y + element.virtualFrame.height
            ) {
              isInside = true;
              break;
            }
          }

          if (isInside) {
            targetFrames.push(element);
          }
        }
        if (!targetFrames.length) {
          return { newX, newY, updated: false };
        }

        // 更新所有目标框架
        for (const targetFrame of targetFrames) {
          (targetFrame as any).updateLineEle(frame);
          this.calculateCrossIntersections(targetFrame as any, elements);
        }
        return { newX, newY, updated: true, targetFrames };
    }

    return { newX, newY, updated: false };
  }

  calculateCrossIntersections = (frame: TBaseFrameOutLine, elements:any[], isClear: boolean = true) => {
    if (!frame.lineElements || frame.lineElements.length < 2) {
      return;
    }

    const processedIntersections = new Set();
    
    for (let i = 0; i < frame.lineElements.length; i++) {
      let line1 = frame.lineElements[i];
      if (!line1 || !line1.lines || !line1.points) continue;

      let line1Start = line1.points[0], line1End = line1.points[1];
      
      for (let j = i + 1; j < frame.lineElements.length; j++) {
        let line2 = frame.lineElements[j];
        if (!line2 || !line2.lines || !line2.points) continue;
        
        let line2Start = line2.points[0], line2End = line2.points[1];
        if(line2Start.x == line1Start.x || line2Start.y == line1Start.y) continue;
        if(line2End.x == line1Start.x || line2End.y == line1Start.y) continue;
        if(line2Start.x == line1End.x || line2Start.y == line1End.y) continue;
        if(line2End.x == line1End.x || line2End.y == line1End.y) continue;


        const hasCommonEndpoint =
          (Math.abs(line1Start.x - line2Start.x) < 1 && Math.abs(line1Start.y - line2Start.y) < 1) ||
          (Math.abs(line1Start.x - line2End.x) < 1 && Math.abs(line1Start.y - line2End.y) < 1) ||
          (Math.abs(line1End.x - line2Start.x) < 1 && Math.abs(line1End.y - line2Start.y) < 1) ||
          (Math.abs(line1End.x - line2End.x) < 1 && Math.abs(line1End.y - line2End.y) < 1);
        
        if (hasCommonEndpoint) {
          continue;
        }
        
        const intersection = lineUntil.lineIntersection(
          line1Start,
          line1End,
          line2Start,
          line2End
        );
        
        if (intersection) {

          const intersectionKey = `${Math.round(intersection.x)},${Math.round(intersection.y)},${line1.id},${line2.id}`;
          if (processedIntersections.has(intersectionKey)) {
            continue; // 跳过已处理的交点
          }
          processedIntersections.add(intersectionKey);

          if (line1.lines && line1.lines.length > 0 && line2.lines && line2.lines.length > 0) {
            const line1MainLineId = line1.lines[0]?.id;
            const line2MainLineId = line2.lines[0]?.id;
            
            if (line1MainLineId && line2MainLineId) {
              if(!line1.addRenderPoints) {
                line1 = elements.find(ele => ele.id === line1.id);
              }
              if(!line2.addRenderPoints) {
                line2 = elements.find(ele => ele.id === line2.id);
              }
              line1.addRenderPoints(line1MainLineId, line2.id, [{ ...intersection }], isClear);
              line2.addRenderPoints(line2MainLineId, line1.id, [{ ...intersection }], isClear);
            }
          }
        }
      }
    }
  }

  clearFrameRenderInfo = (frame: HorizontalLineWindow | VerticalLineWindow, elements:any) => {
    for (const element of elements) {
      if ((element as any) instanceof BaseFrame) {
        element.updateLineEle && element.updateLineEle(frame, true);
        if (element.lines && element.lines.length > 0) {
          for (const line of element.lines) {
            if (line?.id) {
              element.addRenderPoints(line.id, frame.id, [], true);
            }
          }
        }
      }
    }

    if (frame.lines && frame.lines.length > 0) {
      frame.clearRenderPoints();
    }
  }

  handleDividerMove = (frame: SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical, elements: any[]) => {
    let newX = frame.virtualFrame.x;
    let newY = frame.virtualFrame.y;
    const isH = frame.type.includes('h')
    let lineStart = frame.points[0], lineEnd = frame.points[1];

    const lineDirection = {
      x: lineEnd.x - lineStart.x,
      y: lineEnd.y - lineStart.y
    };

    const extensionFactor = 10000;

    const extendedLineStart = {
      x: lineStart.x - lineDirection.x * extensionFactor,
      y: lineStart.y - lineDirection.y * extensionFactor
    };

    const extendedLineEnd = {
      x: lineEnd.x + lineDirection.x * extensionFactor,
      y: lineEnd.y + lineDirection.y * extensionFactor
    };

    let intersectionPoints: Array<{
      point: IPointPostion;
      elementId: string;
      lineId?: string;
      distanceToStart?: number;
      distanceToEnd?: number;
      isActual?: boolean;
    }> = [];

    for (const element of elements) {
      if (element.id === frame.id ) continue;
      if (!(element instanceof BaseFrame)) continue;

      const points = element.points;
      if (!points || points.length === 0) continue;

      if (element.type === "Arch-h" || element.type === "Arch-v") {
        const innerPoints = element.points;

        if (innerPoints && innerPoints.length >= 2) {
          const edge = {
            startPoint: innerPoints[0],
            endPoint: innerPoints[1]
          };

          const intersection = lineUntil.lineIntersection(
            extendedLineStart,
            extendedLineEnd,
            edge.startPoint,
            edge.endPoint
          );

          if (intersection) {
            const lineId = element.lines && element.lines[0] ? element.lines[0].id : `${element.id}-line-0`;

            const isOnOriginalLine = lineUntil.isPointOnLineSegment(
              lineStart,
              lineEnd,
              intersection
            );

            const dxStart = intersection.x - lineStart.x;
            const dyStart = intersection.y - lineStart.y;
            const distanceToStart = Math.sqrt(dxStart * dxStart + dyStart * dyStart);

            const dxEnd = intersection.x - lineEnd.x;
            const dyEnd = intersection.y - lineEnd.y;
            const distanceToEnd = Math.sqrt(dxEnd * dxEnd + dyEnd * dyEnd);

            intersectionPoints.push({
              point: intersection,
              elementId: element.id,
              lineId: lineId,
              distanceToStart,
              distanceToEnd,
              isActual: isOnOriginalLine
            });
          }
        }

        if (element.lines && element.lines.length > 0) {
          for (const line of element.lines) {
            if (!line.isCut && line.center && line.radius) {
              const arcLine = {
                isArc: true,
                center: line.center,
                radius: line.radius,
                startPoint: innerPoints[0],
                endPoint: innerPoints[1],
                angle: line.angle
              };

              const circle = {
                center: arcLine.center,
                radius: arcLine.radius
              };

              const lineObj = {
                start: extendedLineStart,
                end: extendedLineEnd
              };

              // 使用圆与线的交点计算函数
              const intersections = lineUntil.getCircleLineIntersection(circle, lineObj);
              if (intersections && intersections.length > 0) {
                for (const intersection of intersections) {
                  // 检查交点是否在圆弧范围内
                  const isInArcRange = arcUntil.isPointInArcRange(
                    intersection,
                    arcLine.center,
                    arcLine.startPoint,
                    arcLine.endPoint,
                    arcLine.angle as any,
                    element.flipX || element.flipY,
                  );

                  if (isInArcRange) {
                    // 获取线的ID
                    const lineId = line.id || `${element.id}-arc`;

                    // 检查交点是否在原始线段上
                    const isOnOriginalLine = lineUntil.isPointOnLineSegment(
                      lineStart,
                      lineEnd,
                      intersection
                    );

                    // 计算到divider起点和终点的距离
                    const dxStart = intersection.x - lineStart.x;
                    const dyStart = intersection.y - lineStart.y;
                    const distanceToStart = Math.sqrt(dxStart * dxStart + dyStart * dyStart);

                    const dxEnd = intersection.x - lineEnd.x;
                    const dyEnd = intersection.y - lineEnd.y;
                    const distanceToEnd = Math.sqrt(dxEnd * dxEnd + dyEnd * dyEnd);

                    intersectionPoints.push({
                      point: intersection,
                      elementId: element.id,
                      lineId: lineId,
                      distanceToStart,
                      distanceToEnd,
                      isActual: isOnOriginalLine
                    });
                  }
                }
              }
            }
          }
        }
      } else {
        for (let i = 0; i < points.length; i++) {
          const nextIndex = (i + 1) % points.length;
          if(!element.lines[i] || element.lines[i]?.isCut)  continue;
          const edge = {
            startPoint: points[i],
            endPoint: points[nextIndex]
          };

          const intersection = lineUntil.lineIntersection(
            extendedLineStart,
            extendedLineEnd,
            edge.startPoint,
            edge.endPoint
          );

          if (intersection) {
            // 获取线的ID
            const lineId = element.lines && element.lines[i] ? element.lines[i].id : `${element.id}-line-${i}`;

            // 检查交点是否在原始线段上
            const isOnOriginalLine = lineUntil.isPointOnLineSegment(
              lineStart,
              lineEnd,
              intersection
            );

            // 计算到divider起点和终点的距离
            const dxStart = intersection.x - lineStart.x;
            const dyStart = intersection.y - lineStart.y;
            const distanceToStart = Math.sqrt(dxStart * dxStart + dyStart * dyStart);

            const dxEnd = intersection.x - lineEnd.x;
            const dyEnd = intersection.y - lineEnd.y;
            const distanceToEnd = Math.sqrt(dxEnd * dxEnd + dyEnd * dyEnd);

            intersectionPoints.push({
              point: intersection,
              elementId: element.id,
              lineId: lineId,
              distanceToStart,
              distanceToEnd,
              isActual: isOnOriginalLine
            });
          }
        }
      }
    }

    if (intersectionPoints.length < 1) {
      return { newX, newY, updated: false };
    }

    const actualIntersections = intersectionPoints.filter(p => p.isActual);
    const extendedIntersections = intersectionPoints.filter(p => !p.isActual);
    let startExtendIntersections:any[] = []
    let endExtendIntersections:any[] = []
    extendedIntersections.forEach((intersection) => {
      if(isH) {
        if(intersection.point.x < lineStart.x)
          startExtendIntersections.push(intersection);
        if(intersection.point.x > lineEnd.x)
          endExtendIntersections.push(intersection);
      } else {
        if(intersection.point.y < lineStart.y)
          startExtendIntersections.push(intersection);
        if(intersection.point.y > lineEnd.y)
          endExtendIntersections.push(intersection);
      }
    })

    let startPoint:any = null;
    let endPoint:any = null;
    let startLineId:any = null;
    let startElementId:any = null;
    let startLineInfo:any = null;
    let endLineInfo:any = null;
    let actualOnePoint = actualIntersections.length == 2 && !this.isSamePoint(actualIntersections[0].point, actualIntersections[1].point)
    if (actualIntersections.length > 2 || actualOnePoint) {
      const sortedByDistanceToOrigin = [...actualIntersections].sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.point.x - frame.virtualFrame.x, 2) +
          Math.pow(a.point.y - frame.virtualFrame.y, 2));
        const distB = Math.sqrt(Math.pow(b.point.x - frame.virtualFrame.x, 2) +
          Math.pow(b.point.y - frame.virtualFrame.y, 2));
        return distA - distB;
      });

      startPoint = sortedByDistanceToOrigin[0].point;
      startLineInfo = sortedByDistanceToOrigin[0];
      startLineId = sortedByDistanceToOrigin[0].lineId;
      startElementId = sortedByDistanceToOrigin[0].elementId;

      const startElement = elements.find(e => e.id === startElementId);
      const isStartOnLine = startElement && startElement.type && startElement.type.startsWith('Line');

      for (let i = 1; i < sortedByDistanceToOrigin.length; i++) {
        const candidateEndPoint = sortedByDistanceToOrigin[i];

        if (isStartOnLine && candidateEndPoint.elementId === startElementId) {
          startPoint = candidateEndPoint.point;
          startLineInfo = candidateEndPoint
          startLineId = candidateEndPoint.lineId;
          startElementId = candidateEndPoint.elementId;
          continue;
        }

        const hasIntermediatePoints = checkIntermediatePoints(
          startPoint,
          candidateEndPoint.point,
          sortedByDistanceToOrigin.map(i => i.point)
        );

        if (!hasIntermediatePoints) {
          endPoint = candidateEndPoint.point;
          endLineInfo = candidateEndPoint;
          break;
        }
      }

      if (!endPoint && extendedIntersections.length > 0) {
        for (const intersection of extendedIntersections) {
          if (isStartOnLine && intersection.elementId === startElementId) {
            continue;
          }

          const allPoints = [...actualIntersections, ...extendedIntersections].map(i => i.point);
          const hasIntermediatePoints = checkIntermediatePoints(
            startPoint,
            intersection.point,
            allPoints
          );

          if (!hasIntermediatePoints) {
            endPoint = intersection.point;
            endLineInfo = intersection
            break;
          }
        }
      }
    }
    else if (actualIntersections.length >=1 && extendedIntersections.length > 0) {

      if(!startExtendIntersections.length) {
        startPoint = actualIntersections[0].point;
        startLineInfo = actualIntersections[0];
      } else if(!endExtendIntersections.length ) {
        endPoint = actualIntersections[0].point;
        endLineInfo = actualIntersections[0];
      } else if(isH) {
        if(Math.abs(actualIntersections[0].point.x - lineStart.x) < Math.abs(actualIntersections[0].point.x - lineEnd.x)) {
        //   起点
          startPoint = actualIntersections[0].point;
          startLineInfo = actualIntersections[0];
        } else {
        //   终点
          endPoint = actualIntersections[0].point;
          endLineInfo = actualIntersections[0];
        }
      } else {
        if(Math.abs(actualIntersections[0].point.y - lineStart.y) < Math.abs(actualIntersections[0].point.y - lineEnd.y)) {
          //   起点
          startPoint = actualIntersections[0].point;
          startLineInfo = actualIntersections[0];
        } else {
          //   终点
          endPoint = actualIntersections[0].point;
          endLineInfo = actualIntersections[0];
        }
      }

      // const startElement = elements.find(e => e.id === startElementId);
      // const isStartOnLine = startElement && startElement.type && startElement.type.startsWith('Line');
      // 筛选有效的延长点
      const validExtensions = startPoint ?
        endExtendIntersections.filter(ext => ext.elementId !== startElementId) :
        startExtendIntersections.filter(ext => ext.lineId !== startLineId);
      let minValue:any = 1000000
      let minValueIndex = 0;

      validExtensions.forEach((ext, index) => {
        if(isH) {
          const value = Math.abs(ext.point.x - (startPoint ? lineEnd.x : lineStart.x ))
          if(minValue > value) {
            minValue = value
            minValueIndex = index
          }
        }else {
          const value = Math.abs(ext.point.y - (startPoint ? lineEnd.y : lineStart.y ))
          if(minValue > value) {
            minValue = value
            minValueIndex = index
          }
        }
      })

      if(startPoint) {
        endPoint = validExtensions[minValueIndex].point;
        endLineInfo =  validExtensions[minValueIndex];
      }else {
        startPoint = validExtensions[minValueIndex].point;
        startLineInfo =  validExtensions[minValueIndex];
      }
    } else if(startExtendIntersections.length && endExtendIntersections.length ) {
      let startMinValue = 10000000
      let startMinIndex = 0;
      let endMinValue = 10000000
      let endMinIndex = 0;

      startExtendIntersections.forEach((ext, index) => {
        if(isH) {
          const value = Math.abs(ext.point.x - lineStart.x)
          if(startMinValue > value) {
            startMinValue = value
            startMinIndex = index
          }
        }else {
          const value = Math.abs(ext.point.y - lineStart.y)
          if(startMinValue > value) {
            startMinValue = value
            startMinIndex = index
          }
        }
      })
      endExtendIntersections.forEach((ext, index) => {
        if(isH) {
          const value = Math.abs(ext.point.x - lineEnd.x)
          if(endMinValue > value) {
            endMinValue = value
            endMinIndex = index
          }
        }else {
          const value = Math.abs(ext.point.y - lineEnd.y)
          if(endMinValue > value) {
            endMinValue = value
            endMinIndex = index
          }
        }
      })
      startPoint = startExtendIntersections[startMinIndex].point;
      startLineInfo = startExtendIntersections[startMinIndex]
      endPoint = endExtendIntersections[endMinIndex].point;
      endLineInfo = endExtendIntersections[endMinIndex]
    }

    function checkIntermediatePoints(point1:any, point2:any, allPoints:any) {
      if (frame.type.includes('-h')) {
        const left = point1.x < point2.x ? point1 : point2;
        const right = point1.x < point2.x ? point2 : point1;
        
        return allPoints.some((p:any) =>
          p !== left && p !== right && 
          p.x > left.x && p.x < right.x &&
          Math.abs(p.y - left.y) < 1
        );
      } else {
        const top = point1.y < point2.y ? point1 : point2;
        const bottom = point1.y < point2.y ? point2 : point1;
        
        return allPoints.some((p:any) =>
          p !== top && p !== bottom && 
          p.y > top.y && p.y < bottom.y &&
          Math.abs(p.x - top.x) < 1  // 假设在同一垂直线上
        );
      }
    }

    if (!startPoint || !endPoint) {
      return { newX, newY, updated: false };
    }

    if (frame.type.includes('-h')) {
      if (startPoint.x > endPoint.x) {
        const temp = startPoint;
        startPoint = endPoint;
        endPoint = temp;
      }
    } else {
      if (startPoint.y > endPoint.y) {
        const temp = startPoint;
        startPoint = endPoint;
        endPoint = temp;
      }
    }

    if (frame.type.includes('-h')) {
      newX = startPoint.x;
      const newWidth = endPoint.x - startPoint.x;
      frame.virtualFrame.width = newWidth;
      
      frame.points[0].x = newX;
      frame.points[1].x = newX + newWidth;
      // frame.points[2].x = newX + newWidth;
      // frame.points[3].x = newX;

      frame.update({ x: newX, width: newWidth });
    } else {
      newX = startPoint.x;
      newY = startPoint.y;
      const newHeight = endPoint.y - startPoint.y;
      frame.virtualFrame.height = newHeight;

      frame.points[1].y = newY + newHeight;
      frame.points[0].y = newY;
      // frame.points[2].y = newY;
      // frame.points[3].y = newY + newHeight;

      frame.update({ x: newX, y: newY, height: newHeight });
    }
    frame.startElement = startLineInfo
    frame.endElement = endLineInfo
    return { newX, newY, updated: true };
  }

  handleDividerMoveRender = (frame: SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical, elements: any[]) => {
    let newX = frame.virtualFrame.x;
    let newY = frame.virtualFrame.y;
    const isH = frame.type.includes('h')
    let lineStart = frame.points[0], lineEnd = frame.points[1];

    const lineDirection = {
      x: lineEnd.x - lineStart.x,
      y: lineEnd.y - lineStart.y
    };

    const extensionFactor = 10000;

    const extendedLineStart = {
      x: lineStart.x - lineDirection.x * extensionFactor,
      y: lineStart.y - lineDirection.y * extensionFactor
    };

    const extendedLineEnd = {
      x: lineEnd.x + lineDirection.x * extensionFactor,
      y: lineEnd.y + lineDirection.y * extensionFactor
    };

    let intersectionPoints: Array<{
      point: IPointPostion;
      elementId: string;
      lineId?: string;
      distanceToStart?: number;
      distanceToEnd?: number;
      isActual?: boolean;
    }> = [];
    for (const element of elements) {
      if (element.id === frame.id ) continue;
      if (!(element instanceof RenderData)) continue;
      if(element.renderType !== 'glasses') continue;
      const points = element.points;
      if (!points || points.length === 0) continue;
      element.lines.forEach((line) => {
        if(line.isArc) {
          const circle = {
            center: line.center,
            radius: line.radius
          };

          const lineObj = {
            start: extendedLineStart,
            end: extendedLineEnd
          };
          const intersections = lineUntil.getCircleLineIntersection(circle as any, lineObj);

          if (intersections && intersections.length > 0) {
            for (const intersection of intersections) {
              if (arcUntil.isPointOnArcSegment(intersection, line as any)) {
                const lineId = line.id || `${element.id}-arc`;

                const isOnOriginalLine = lineUntil.isPointOnLineSegment(
                    lineStart,
                    lineEnd,
                    intersection
                );

                const dxStart = intersection.x - lineStart.x;
                const dyStart = intersection.y - lineStart.y;
                const distanceToStart = Math.sqrt(dxStart * dxStart + dyStart * dyStart);

                const dxEnd = intersection.x - lineEnd.x;
                const dyEnd = intersection.y - lineEnd.y;
                const distanceToEnd = Math.sqrt(dxEnd * dxEnd + dyEnd * dyEnd);

                intersectionPoints.push({
                  point: intersection,
                  elementId: element.id,
                  lineId: lineId,
                  distanceToStart,
                  distanceToEnd,
                  isActual: isOnOriginalLine
                });
              }
            }
          }
        }
        else {
          const intersection = lineUntil.lineIntersection(
              extendedLineStart,
              extendedLineEnd,
              line.start,
              line.end
          );
          if (intersection) {
            const isOnOriginalLine = lineUntil.isPointOnLineSegment(
                lineStart,
                lineEnd,
                intersection
            );

            const dxStart = intersection.x - lineStart.x;
            const dyStart = intersection.y - lineStart.y;
            const distanceToStart = Math.sqrt(dxStart * dxStart + dyStart * dyStart);

            const dxEnd = intersection.x - lineEnd.x;
            const dyEnd = intersection.y - lineEnd.y;
            const distanceToEnd = Math.sqrt(dxEnd * dxEnd + dyEnd * dyEnd);

            intersectionPoints.push({
              point: intersection,
              elementId: element.id,
              lineId: line.id,
              distanceToStart,
              distanceToEnd,
              isActual: isOnOriginalLine
            });
          }
        }
      })
    }

    if (intersectionPoints.length < 1) {
      return { newX, newY, updated: false };
    }
    const intersectionsByElement = new Map<string, Array<any>>();

    // 分组收集所有交点
    intersectionPoints.forEach(intersection => {
      if (!intersectionsByElement.has(intersection.elementId)) {
        intersectionsByElement.set(intersection.elementId, []);
      }
      intersectionsByElement.get(intersection.elementId)?.push(intersection);
    });
    // 筛选出至少有两个交点的元素
    const elementsWithMultipleIntersections = Array.from(intersectionsByElement.entries())
        .filter(([_, points]) => points.length >= 2);

    if (elementsWithMultipleIntersections.length === 0) {
      return { newX, newY, updated: false };
    }

    const elementsWithDistance = elementsWithMultipleIntersections.map(([elementId, points]) => {
      const element = elements.find(e => e.id === elementId);
      if (!element || !element.virtualFrame) {
        return { elementId, points, distance: Number.MAX_VALUE };
      }

      const elementCenter = {
        x: element.virtualFrame.x + element.virtualFrame.width / 2,
        y: element.virtualFrame.y + element.virtualFrame.height / 2
      };
      const frameCenter = { x: frame.virtualFrame.x + frame.virtualFrame.width / 2, y: elementCenter.y  + frame.virtualFrame.height / 2};
      const dx = elementCenter.x - frameCenter.x;
      const dy = elementCenter.y - frameCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return { elementId, points, distance };
    });

    elementsWithDistance.sort((a, b) => a.distance - b.distance);

    const { elementId, points } = elementsWithDistance[0];

    const sortedPoints = [...points].sort((a, b) => {
      if (isH) {
        return a.point.x - b.point.x;
      } else {
        return a.point.y - b.point.y;
      }
    });

    let startPoint = sortedPoints[0].point;
    let startLineInfo = sortedPoints[0];
    let endPoint = sortedPoints[sortedPoints.length - 1].point;
    let endLineInfo = sortedPoints[sortedPoints.length - 1];

    if (isH && startPoint.x > endPoint.x || !isH && startPoint.y > endPoint.y) {
      const tempPoint = startPoint;
      startPoint = endPoint;
      endPoint = tempPoint;

      const tempInfo = startLineInfo;
      startLineInfo = endLineInfo;
      endLineInfo = tempInfo;
    }

    if (frame.type.includes('-h')) {
      newX = startPoint.x;
      const newWidth = endPoint.x - startPoint.x;
      frame.virtualFrame.width = newWidth;

      frame.points[0].x = newX;
      frame.points[1].x = newX + newWidth;

      frame.update({ x: newX, width: newWidth });
    } else {
      newX = startPoint.x;
      newY = startPoint.y;
      const newHeight = endPoint.y - startPoint.y;
      frame.virtualFrame.height = newHeight;

      frame.points[1].y = newY + newHeight;
      frame.points[0].y = newY;

      frame.update({ x: newX, y: newY, height: newHeight });
    }

    frame.startElement = startLineInfo;
    frame.endElement = endLineInfo;

    return { newX, newY, updated: true };
  }

  private isSamePoint(point1: IPointPostion, point2: IPointPostion): boolean {
    return Math.abs(point1.x - point2.x) < 0.001 && Math.abs(point1.y - point2.y) < 0.001;
  }

  findContainingFrame(element: BaseData, elements: BaseFrame[]): BaseFrame | null {
    if (!elements?.length || !element) {
      return null;
    }

    const elementPoints = [
      { x: element.virtualFrame.x, y: element.virtualFrame.y },
      { x: element.virtualFrame.x + element.virtualFrame.width, y: element.virtualFrame.y },
      { x: element.virtualFrame.x + element.virtualFrame.width, y: element.virtualFrame.y + element.virtualFrame.height },
      { x: element.virtualFrame.x, y: element.virtualFrame.y + element.virtualFrame.height }
    ];

    for (const frame of elements) {
      if (frame.id === element.id) continue;
      if (!(frame instanceof BaseFrame)) continue;

      const frameBounds = {
        left: frame.virtualFrame.x,
        right: frame.virtualFrame.x + frame.virtualFrame.width,
        top: frame.virtualFrame.y,
        bottom: frame.virtualFrame.y + frame.virtualFrame.height
      };

      const isContained = elementPoints.every(point =>
          point.x >= frameBounds.left &&
          point.x <= frameBounds.right &&
          point.y >= frameBounds.top &&
          point.y <= frameBounds.bottom
      );

      if (isContained) {
        return frame;
      }
    }

    return null;
  }

  /**
   * 判断元素是否部分在多个框架内，并返回符合条件的框架数组
   * @param element 要检查的元素
   * @param frames 目标框架数组
   * @param mode 检查模式："any"(任一点在内),"center"(中心点在内),"majority"(大部分点在内)
   * @returns 包含元素的所有框架数组
   */
  isElementPartiallyInFrames(element: BaseData, frames: BaseFrame[], mode: "any" | "center" | "majority" = "any"): BaseFrame[] {
    if (!element || !frames || frames.length === 0) {
      return [];
    }

    const elementPoints = [
      { x: element.virtualFrame.x, y: element.virtualFrame.y },
      { x: element.virtualFrame.x + element.virtualFrame.width, y: element.virtualFrame.y },
      { x: element.virtualFrame.x + element.virtualFrame.width, y: element.virtualFrame.y + element.virtualFrame.height },
      { x: element.virtualFrame.x, y: element.virtualFrame.y + element.virtualFrame.height }
    ];

    const centerPoint = {
      x: element.virtualFrame.x + element.virtualFrame.width / 2,
      y: element.virtualFrame.y + element.virtualFrame.height / 2
    };

    const containingFrames: BaseFrame[] = [];

    for (const frame of frames) {
      if (frame.id === element.id) continue;
      if (!(frame instanceof BaseFrame)) continue;

      const frameBounds = {
        left: frame.virtualFrame.x,
        right: frame.virtualFrame.x + frame.virtualFrame.width,
        top: frame.virtualFrame.y,
        bottom: frame.virtualFrame.y + frame.virtualFrame.height
      };

      const isPointInFrame = (point: IPointPostion) => {
        return point.x >= frameBounds.left &&
            point.x <= frameBounds.right &&
            point.y >= frameBounds.top &&
            point.y <= frameBounds.bottom;
      };

      let isInFrame = false;

      if (mode === "center") {
        isInFrame = isPointInFrame(centerPoint);
      } else if (mode === "any") {
        isInFrame = elementPoints.some(point => isPointInFrame(point));
      } else if (mode === "majority") {
        const pointsInFrame = elementPoints.filter(point => isPointInFrame(point));
        isInFrame = pointsInFrame.length > elementPoints.length / 2;
      }

      if (isInFrame) {
        containingFrames.push(frame);
      }
    }

    return containingFrames;
  }

  hasOverlapFunc = (x1: any, y1: any, x2: any, y2: any, x3: any, y3: any, x4: any, y4: any) => {
    let tempFlag = false
    let overlapStart = null
    let overlapEnd = null
    let overlapLength = null
    // 确保两条线是水平的
    if (y1 !== y2 || y3 !== y4) {
      return {
        flag: tempFlag,
        overlapStart,
        overlapEnd,
        overlapLength
      }
    }

    // 确保两条线在同一水平线上
    if (y1 !== y3) {
      return {
        flag: tempFlag,
        overlapStart,
        overlapEnd,
        overlapLength
      }
    }

    // 计算 x 范围
    let left1 = Math.min(x1, x2);
    let right1 = Math.max(x1, x2);
    let left2 = Math.min(x3, x4);
    let right2 = Math.max(x3, x4);

    // 判断是否有重叠部分
    if (right1 >= left2 && right2 >= left1) {
      tempFlag = true

      overlapStart = Math.max(left1, left2);
      overlapEnd = Math.min(right1, right2);
      overlapLength = overlapEnd - overlapStart;
    } else {
      tempFlag = false
    }
    return {
      flag: tempFlag,
      overlapStart,
      overlapEnd,
      overlapLength
    }
  }

  hasVerticalOverlap = (x1: any, y1: any, x2: any, y2: any, x3: any, y3: any, x4: any, y4: any) => {
    // 确保两条线是垂直的
    let tempFlag = false
    let overlapStart = null
    let overlapEnd = null
    let overlapLength = null
    if (x1 !== x2 || x3 !== x4) {
      return {
        flag: tempFlag,
        overlapStart,
        overlapEnd,
        overlapLength
      }
    }

    // 确保它们的 x 坐标相同（即在同一条垂直线上）
    if (x1 !== x3) {
      return {
        flag: tempFlag,
        overlapStart,
        overlapEnd,
        overlapLength
      }
    }

    // 计算 y 轴范围
    let top1 = Math.max(y1, y2);
    let bottom1 = Math.min(y1, y2);
    let top2 = Math.max(y3, y4);
    let bottom2 = Math.min(y3, y4);

    // 判断是否有交集
    if (top1 >= bottom2 && top2 >= bottom1) {
      tempFlag = true

      overlapStart = Math.max(top1, top2);
      overlapEnd = Math.min(bottom1, bottom2);
      overlapLength = overlapEnd - overlapStart;
    } else {
      tempFlag = false
    }
    return {
      flag: tempFlag,
      overlapStart,
      overlapEnd,
      overlapLength
    }
  };

  getXDistances = (x1: any, y1: any, x2: any, y2: any, x3: any, y3: any, x4: any, y4: any) => {
    let obj = {
      startDistance: 10000,
      endDistance: 10000,
      width: 10000
    }
    if (y1 !== y2 || y3 !== y4) {

    } else {
      obj.startDistance = Math.abs(x1 - x3)
      obj.endDistance = Math.abs(x2 - x4)
    }

    return obj
  };

  getVerticalLineXDistances = (x1: any, y1: any, x2: any, y2: any, x3: any, y3: any, x4: any, y4: any) => {
    // 确保两条线都是垂直的
    let obj = {
      startDistance: 10000,
      endDistance: 10000,
      width: 10000
    }
    if (x1 !== x2 || x3 !== x4) {

    } else {
      // 计算起点和终点的 Y 轴距离
      obj.startDistance = Math.abs(y1 - y3);
      obj.endDistance = Math.abs(y2 - y4);
    }
    return obj
  }

  getVerticalDistance = (x1: any, y1: any, x2: any, y2: any, x3: any, y3: any, x4: any, y4: any) => {
    // 确保两条线都是水平的
    let obj: any = {
      vNum: 10000,
      truthNum: 10000
    }
    if (y1 !== y2 || y3 !== y4) {
      return obj
    } else {
      obj.vNum = Math.abs(y3 - y1);
      obj.truthNum = y3 - y1
    }
    return obj
  };

  getHorizontalDistance = (x1: any, y1: any, x2: any, y2: any, x3: any, y3: any, x4: any, y4: any) => {
    // 确保两条线是垂直的
    let obj: any = {
      hNum: 10000,
      truthNum: 10000
    }
    if (x1 !== x2 || x3 !== x4) {
      return obj
    } else {
      obj.hNum = Math.abs(x3 - x1)
      obj.truthNum = x3 - x1
    }
    return obj
  }

  checkLineType = (x1: any, y1: any, x2: any, y2: any) => {
    let lineType = ""
    if (y1 === y2) {
      lineType = "h"
    } else if (x1 === x2) {
      lineType = "v"
    }
    return lineType
  };

  findPointsWithSameY = (points: any) => {
    let groups: any = {};

    // 遍历所有点，将它们按 y 值分类
    points.forEach((point: any) => {
      if (!groups[point.y]) {
        groups[point.y] = [];
      }
      groups[point.y].push(point);
    });

    // 过滤出有 2 个或以上相同 y 值的组
    return Object.values(groups).filter((group: any) => group.length > 1);
  };

  findPointsWithSameX = (points: any) => {
    let groups: any = {};

    // 遍历所有点，将它们按 y 值分类
    points.forEach((point: any) => {
      if (!groups[point.x]) {
        groups[point.x] = [];
      }
      groups[point.x].push(point);
    });

    // 过滤出有 2 个或以上相同 y 值的组
    return Object.values(groups).filter((group: any) => group.length > 1);
  }

  getRightVerticalLine = (x1: any, y1: any, x2: any, y2: any, x3: any, y3: any, x4: any, y4: any) => {
    // 确保两条线是垂直的
    if (x1 !== x2 || x3 !== x4) {
      return
    }

    // 判断哪条线在右侧
    if (x1 < x3) {
      return {
        x1: x3,
        y1: y3,
        x2: x4,
        y2: y4
      }
    } else if (x1 > x3) {
      return {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
      }
    }
  }

  getLowerHorizontalLine = (x1: any, y1: any, x2: any, y2: any, x3: any, y3: any, x4: any, y4: any) => {
    // 确保两条线是水平的
    if (y1 !== y2 || y3 !== y4) {
      return
    }

    // 判断哪条线在下方
    if (y1 > y3) {
      return {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
      }
    } else if (y1 < y3) {
      return {
        x1: x3,
        y1: y3,
        x2: x4,
        y2: y4
      }
    }
  }

  cutLongerLine = (line1:any, line2:any) => {
    // 计算两条线段的长度
    const length1 = Math.abs(line1.y2 - line1.y1);
    const length2 = Math.abs(line2.y2 - line2.y1);

    // 识别较长的线段
    let longLine, shortLine;
    if (length1 >= length2) {
      longLine = {...line1};
      shortLine = {...line2};
    } else {
      longLine = {...line2};
      shortLine = {...line1};
    }

    // 确保线段方向是从小到大
    if (longLine.y1 > longLine.y2) {
      [longLine.y1, longLine.y2] = [longLine.y2, longLine.y1];
    }
    if (shortLine.y1 > shortLine.y2) {
      [shortLine.y1, shortLine.y2] = [shortLine.y2, shortLine.y1];
    }

    // 截取长线，使其去除与短线重叠的部分
    if (shortLine.y1 <= longLine.y1 && shortLine.y2 >= longLine.y2) {
      return null; // 短线完全覆盖长线，返回空
    } else if (shortLine.y1 <= longLine.y1) {
      return [{y1: shortLine.y2, y2: longLine.y2}]; // 移动起点
    } else if (shortLine.y2 >= longLine.y2) {
      return [{y1: longLine.y1, y2: shortLine.y1}]; // 移动终点
    } else {
      // 短线截断长线中间，返回两条新线段
      return [
        {y1: longLine.y1, y2: shortLine.y1},
        {y1: shortLine.y2, y2: longLine.y2}
      ];
    }
  }

  cutLongerLineX = (line1:any, line2:any) => {
    // 计算两条线段的长度
    const length1 = Math.abs(line1.x2 - line1.x1);
    const length2 = Math.abs(line2.x2 - line2.x1);

    // 识别较长的线段
    let longLine, shortLine;
    if (length1 >= length2) {
      longLine = {...line1};
      shortLine = {...line2};
    } else {
      longLine = {...line2};
      shortLine = {...line1};
    }

    // 确保线段方向是从小到大
    if (longLine.x1 > longLine.x2) {
      [longLine.x1, longLine.x2] = [longLine.x2, longLine.x1];
    }
    if (shortLine.x1 > shortLine.x2) {
      [shortLine.x1, shortLine.x2] = [shortLine.x2, shortLine.x1];
    }

    // 截取长线，使其去除与短线重叠的部分
    if (shortLine.x1 <= longLine.x1 && shortLine.x2 >= longLine.x2) {
      return null; // 短线完全覆盖长线，返回空
    } else if (shortLine.x1 <= longLine.x1) {
      return [{x1: shortLine.x2, x2: longLine.x2}]; // 移动起点
    } else if (shortLine.x2 >= longLine.x2) {
      return [{x1: longLine.x1, x2: shortLine.x1}]; // 移动终点
    } else {
      // 短线截断长线中间，返回两条新线段
      return [
        {x1: longLine.x1, x2: shortLine.x1},
        {x1: shortLine.x2, x2: longLine.x2}
      ];
    }
  };
}

const moveUntil = new MoveUntil()
export default moveUntil;