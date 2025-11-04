import { BaseFrame, ILine } from "./baseFrame";
import {
  BaseData,
  IVertualFrame,
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/drawing/data/baseData";
import lineUntil from "../until/lineUntil";
import zoneUntil from "../until/zoneUntil";
import moveUntil from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/drawing/until/moveUntil";
import { BaseOperation } from "./operation/baseOperation";
import { IZone, OperationType, ShapeType } from "../datas";

interface ChildRelation {
  childId: string;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
  points?: Array<{ xRatio: number; yRatio: number }>;
  lines?: Array<{
    id?: string;
    startPointRatio: { xRatio: number; yRatio: number };
    endPointRatio: { xRatio: number; yRatio: number };
    weight?: number;
    oldWeight?: number;
    centerRatio?: { xRatio: number; yRatio: number };
    angle?: number;
    radiusRatio?: number;
    hidden?: boolean;
    isCut?: boolean;
    intersectionPoints?: Array<{
      pointRatio: { xRatio: number; yRatio: number };
      lineId: string;
      lineIndex?: number;
    }>;
    hiddenSegment?: Array<{
      startPointRatio: { xRatio: number; yRatio: number };
      endPointRatio: { xRatio: number; yRatio: number };
    }>;
  }>;
  //gn:新加，初始计算比例时，判断元素在中线的方位，目前仅支持左右，且只在OperationType.HARDWARE_HL || OperationType.HARDWARE_HR会用到
  centerDirection?: "left" | "right";
}

export class GroupFrame extends BaseFrame {
  children: BaseData[] = [];
  id: string;
  private childrenRelations: Map<string, ChildRelation> = new Map();
  zones: IZone[] = [];
  render: boolean = false;
  code: string = "";
  unitId: string = "";
  dividerEles: any[] = [];
  unitIndex: string = "";
  //gn：存储divider的比例关系，类似childrenRelations
  private dividerRelations: Map<string, ChildRelation> = new Map();

  constructor(elements: BaseData[] = [], unitId?: string) {
    super(0, {});
    this.children = elements;
    this.type = "Group";
    this.id = "group_" + new Date().getTime();
    if (unitId) this.id = this.id + "_" + unitId;
    this.updateBounds();

    this.calculateChildrenRelations();
  }

  calculateChildrenRelations() {
    if (!this.children?.length) return;

    this.childrenRelations.clear();

    this.children.forEach((child) => {
      if (child.type == "render") {
        return;
      }
      const relation: ChildRelation = {
        childId: child.id,
        xRatio:
          (child.virtualFrame.x - this.virtualFrame.x) /
          this.virtualFrame.width,
        yRatio:
          (child.virtualFrame.y - this.virtualFrame.y) /
          this.virtualFrame.height,
        widthRatio: child.virtualFrame.width / this.virtualFrame.width,
        heightRatio: child.virtualFrame.height / this.virtualFrame.height,
      };

      if (child.type === ShapeType.Triangle && (child as any).points) {
        const points = (child as any).points;
        relation.points = points.map((point: any) => ({
          xRatio: (point.x - this.virtualFrame.x) / this.virtualFrame.width,
          yRatio: (point.y - this.virtualFrame.y) / this.virtualFrame.height,
        }));
      }

      if ((child as any).lines && Array.isArray((child as any).lines)) {
        relation.lines = (child as any).lines.map((line: ILine) => {
          const startPointRatio = {
            xRatio:
              (line.startPoint.x - this.virtualFrame.x) /
              this.virtualFrame.width,
            yRatio:
              (line.startPoint.y - this.virtualFrame.y) /
              this.virtualFrame.height,
          };

          const endPointRatio = {
            xRatio:
              (line.endPoint.x - this.virtualFrame.x) / this.virtualFrame.width,
            yRatio:
              (line.endPoint.y - this.virtualFrame.y) /
              this.virtualFrame.height,
          };

          const lineRelation: any = {
            id: line.id,
            startPointRatio,
            endPointRatio,
            weight: line.weight,
            oldWeight: line.oldWeight,
            angle: line.angle,
            hidden: line.hidden,
            isCut: line.isCut,
          };

          if (line.center) {
            lineRelation.centerRatio = {
              xRatio:
                (line.center.x - this.virtualFrame.x) / this.virtualFrame.width,
              yRatio:
                (line.center.y - this.virtualFrame.y) /
                this.virtualFrame.height,
            };
          }

          if (line.radius) {
            lineRelation.radiusRatio =
              line.radius /
              Math.max(this.virtualFrame.width, this.virtualFrame.height);
          }

          if (line.intersectionPoints && line.intersectionPoints.length > 0) {
            lineRelation.intersectionPoints = line.intersectionPoints.map(
              (intersection) => ({
                pointRatio: {
                  xRatio:
                    (intersection.point.x - this.virtualFrame.x) /
                    this.virtualFrame.width,
                  yRatio:
                    (intersection.point.y - this.virtualFrame.y) /
                    this.virtualFrame.height,
                },
                lineId: intersection.lineId,
                lineIndex: intersection.lineIndex,
              })
            );
          }

          if (line.hiddenSegment && line.hiddenSegment.length > 0) {
            lineRelation.hiddenSegment = line.hiddenSegment.map((segment) => ({
              startPointRatio: {
                xRatio:
                  (segment.startPoint.x - this.virtualFrame.x) /
                  this.virtualFrame.width,
                yRatio:
                  (segment.startPoint.y - this.virtualFrame.y) /
                  this.virtualFrame.height,
              },
              endPointRatio: {
                xRatio:
                  (segment.endPoint.x - this.virtualFrame.x) /
                  this.virtualFrame.width,
                yRatio:
                  (segment.endPoint.y - this.virtualFrame.y) /
                  this.virtualFrame.height,
              },
            }));
          }

          return lineRelation;
        });
      }

      this.childrenRelations.set(child.id, relation);
    });

    //gn: 计算垂直中线
    const centerLineV = this.children.find((child) => {
      let ratio = this.childrenRelations.get(child.id);
      if (ratio?.xRatio) {
        return (
          child.type === ShapeType.LineV &&
          Math.abs(ratio.xRatio - 0.5) < 0.000001
        );
      }
      return false;
    });

    if (centerLineV) {
      const centerX = this.virtualFrame.x + this.virtualFrame.width / 2;
      for (const child of this.children) {
        if (
          child.type === OperationType.HARDWARE_HL ||
          child.type === OperationType.HARDWARE_HR
        ) {
          const relation = this.childrenRelations.get(child.id);
          if (!relation) continue;

          //gn:特殊处理中线两边的左右门把手,记录门把手在中线的方位，目前是打补丁的方式去处理缩放过程中左右门把手的bug，后续可能会考虑缩放过程中operation元素按区域进行相对定位，而不是按group元素进行相对定位
          if (
            child.virtualFrame.x <= centerX &&
            child.virtualFrame.x + child.virtualFrame.width >= centerX
          ) {
            const leftLen = Math.abs(centerX - child.virtualFrame.x);
            const rightLen = Math.abs(
              centerX - (child.virtualFrame.x + child.virtualFrame.width)
            );
            relation.centerDirection = leftLen < rightLen ? "right" : "left";
          }
        }
      }
    }

    console.log(
      "######## calculateChildrenRelations ",
      Array.from(this.childrenRelations.values())
    );
  }

  updateBounds() {
    const bounds =
      this.children
        .filter(
          // child => child.type !== OperationType.Dimension
          (child) =>
            !Object.values(OperationType).includes(child.type as OperationType)
        )
        ?.reduce(
          (acc, element) => ({
            minX: Math.min(acc.minX, element.virtualFrame.x),
            maxX: Math.max(
              acc.maxX,
              element.virtualFrame.x + element.virtualFrame.width
            ),
            minY: Math.min(acc.minY, element.virtualFrame.y),
            maxY: Math.max(
              acc.maxY,
              element.virtualFrame.y + element.virtualFrame.height
            ),
          }),
          {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity,
          }
        ) || {};

    this.virtualFrame.x = bounds.minX;
    this.virtualFrame.y = bounds.minY;
    this.virtualFrame.width = bounds.maxX - bounds.minX;
    this.virtualFrame.height = bounds.maxY - bounds.minY;

    this.updatePoints();
    this.calculateChildrenRelations();
  }

  updatePoints() {
    this.points = lineUntil.getVertexPosition(
      this.virtualFrame.x,
      this.virtualFrame.y,
      this.virtualFrame.width,
      this.virtualFrame.height
    );
  }

  move(dx: number, dy: number) {
    super.move(dx, dy);
    this.updatePoints();
    this.children.forEach((child) => {
      child.move(dx, dy);
    });
    this.dividerEles.forEach((divider) => {
      if (divider?.move) divider?.move(dx, dy);
    });
    this.zones = this.zones.map((zone) => {
      return zoneUntil.moveZone(zone, dx, dy);
    });
  }

  override update(params: IVertualFrame) {
    super.update(params);
    this.updatePoints();
    this.updateChildrenBasedOnRelations();

    //gn：更新 dividerEles 元素
    this.updateDividerElements();
  }

  updateChildrenBasedOnRelations() {
    if (!this.children?.length) return;
    let needUpdateLineElements: any[] = [];
    const archElements = this.children.filter(
      (child) => child.type === "Arch-h" || child.type === "Arch-v"
    );

    if (archElements.length > 0) {
      for (const archElement of archElements) {
        const relation = this.childrenRelations.get(archElement.id);
        if (!relation) continue;

        const expectedParams = this.calculateExpectedParams(relation);

        archElement.update(expectedParams);

        const actualParams = {
          width: archElement.virtualFrame.width,
          height: archElement.virtualFrame.height,
          x: archElement.virtualFrame.x,
          y: archElement.virtualFrame.y,
        };

        const widthRatio = actualParams.width / expectedParams.width;
        const heightRatio = actualParams.height / expectedParams.height;

        if (archElement.lines) {
          for (const line of archElement.lines) {
            if (line.intersectionPoints && line.intersectionPoints.length > 0) {
              const affectedLineIds = new Set<string>();
              for (const intersection of line.intersectionPoints) {
                if (intersection.lineId) {
                  affectedLineIds.add(intersection.lineId);
                }
              }

              for (const lineId of affectedLineIds) {
                const lineElement = this.children.find(
                  (child) =>
                    child.id === lineId ||
                    (child.lines &&
                      child.lines.some((l: any) => l.id === lineId))
                );

                if (
                  lineElement &&
                  !needUpdateLineElements.find(
                    (ele) => ele.id === lineElement?.id
                  )
                ) {
                  needUpdateLineElements.push(lineElement);
                }
              }
            }
          }
        }

        if (widthRatio !== 1 || heightRatio !== 1) {
          this.adjustOtherElementsForArchConstraint(
            archElement,
            expectedParams,
            actualParams
          );
        }
      }
    }

    this.updateNonArchElements();
    needUpdateLineElements.forEach((lineElement) => {
      if (
        lineElement &&
        (lineElement.type === "Line-h" || lineElement.type === "Line-v")
      ) {
        moveUntil.handleLineMove(lineElement, this.children, false);
      }
    });
    //  todo 暂时不用
    // const linesWithIntersections = this.children.filter(child =>
    //     child.type === 'Line-h' || child.type === 'Line-v'
    // );
    //
    // for (const lineElement of linesWithIntersections) {
    //     if (lineElement.lines) {
    //         let hasIntersections = false;
    //         for (const line of lineElement.lines) {
    //             if (line.intersectionPoints && line.intersectionPoints.length > 0) {
    //                 hasIntersections = true;
    //                 break;
    //             }
    //         }
    //
    //         if (hasIntersections) {
    //             console.log(lineElement, '??????????????')
    //             moveUntil.handleLineMove(lineElement, this.children, false);
    //         }
    //     }
    // }
  }

  updateGroupChildLines() {
    let needUpdateLineElements: any[] = [];
    this.children.forEach((child) => {
      if (child.type != "Arch-h" || child.type != "Arch-v") return;
      if (!child.lines) return;

      for (const line of child.lines) {
        if (line.intersectionPoints && line.intersectionPoints.length > 0) {
          const affectedLineIds = new Set<string>();
          for (const intersection of line.intersectionPoints) {
            if (intersection.lineId) {
              affectedLineIds.add(intersection.lineId);
            }
          }

          for (const lineId of affectedLineIds) {
            const lineElement = this.children.find(
              (child) =>
                child.id === lineId ||
                (child.lines && child.lines.some((l: any) => l.id === lineId))
            );

            if (
              lineElement &&
              !needUpdateLineElements.find((ele) => ele.id == lineElement?.id)
            ) {
              needUpdateLineElements.push(lineElement);
            }
          }
        }
      }
    });
    needUpdateLineElements.forEach((lineElement) => {
      if (
        lineElement &&
        (lineElement.type === "Line-h" || lineElement.type === "Line-v")
      ) {
        let newValue = moveUntil.handleLineMove(
          lineElement,
          this.children,
          false
        );
      }
    });
    const archElements = this.children.filter(
      (child) => child.type === "Arch-h" || child.type === "Arch-v"
    );
    if (archElements.length > 0) {
      for (const archElement of archElements) {
        for (const line of archElement.lines) {
          if (line.intersectionPoints && line.intersectionPoints.length > 0) {
            for (const intersection of line.intersectionPoints) {
              const lineElement: any = this.children.find(
                (child) =>
                  child.id === intersection.lineId ||
                  (child.lines &&
                    child.lines.some((l) => l.id === intersection.lineId))
              );
              lineElement?.points?.forEach((point) => {
                if (Math.abs(intersection.point.x - point.x) < 1) {
                  point.x = intersection.point.x;
                }
                if (Math.abs(intersection.point.y - point.y) < 1) {
                  point.y = intersection.point.y;
                }
              });
              lineElement.updateVirtualFrameByPoints();
            }
          }
        }
      }
    }
  }

  calculateExpectedParams(relation) {
    return {
      x: this.virtualFrame.x + relation.xRatio * this.virtualFrame.width,
      y: this.virtualFrame.y + relation.yRatio * this.virtualFrame.height,
      width: relation.widthRatio * this.virtualFrame.width,
      height: relation.heightRatio * this.virtualFrame.height,
    };
  }

  adjustOtherElementsForArchConstraint(
    archElement,
    expectedParams,
    actualParams
  ) {
    const widthDiff = actualParams.width - expectedParams.width;
    const heightDiff = actualParams.height - expectedParams.height;

    const isHorizontalArch = archElement.type === "Arch-h";
    const isVerticalArch = archElement.type === "Arch-v";

    for (const child of this.children) {
      if (child.id === archElement.id || child instanceof BaseOperation)
        continue;

      const childRelation = this.childrenRelations.get(child.id);
      if (!childRelation) continue;

      let adjustedParams = this.calculateExpectedParams(childRelation);

      if (isHorizontalArch) {
        if (
          child.virtualFrame.y >
          archElement.virtualFrame.y + archElement.virtualFrame.height / 2
        ) {
          adjustedParams.y += heightDiff;
        } else if (
          child.virtualFrame.y + child.virtualFrame.height >
            archElement.virtualFrame.y &&
          child.virtualFrame.y <
            archElement.virtualFrame.y + archElement.virtualFrame.height
        ) {
          const overlapRatio = this.calculateVerticalOverlapRatio(
            child,
            archElement
          );
          adjustedParams.height -= heightDiff * overlapRatio;
        }
      } else if (isVerticalArch) {
        if (
          child.virtualFrame.x >
          archElement.virtualFrame.x + archElement.virtualFrame.width / 2
        ) {
          adjustedParams.x += widthDiff;
        } else if (
          child.virtualFrame.x + child.virtualFrame.width >
            archElement.virtualFrame.x &&
          child.virtualFrame.x <
            archElement.virtualFrame.x + archElement.virtualFrame.width
        ) {
          const overlapRatio = this.calculateHorizontalOverlapRatio(
            child,
            archElement
          );
          adjustedParams.width -= widthDiff * overlapRatio;
        }
      }

      if (child.type === ShapeType.LineH) {
        delete adjustedParams.height;
      } else if (child.type === ShapeType.LineV) {
        delete adjustedParams.width;
      }

      child.update(adjustedParams);

      if (child.type === ShapeType.Triangle && childRelation.points) {
        this.updateTrianglePoints(child, childRelation);
      }

      if (childRelation.lines && (child as any).lines) {
        this.updateLinesWithConstraints(
          child,
          childRelation,
          isHorizontalArch,
          isVerticalArch,
          widthDiff,
          heightDiff
        );
      }
    }
  }

  calculateVerticalOverlapRatio(element1, element2) {
    const e1Top = element1.virtualFrame.y;
    const e1Bottom = element1.virtualFrame.y + element1.virtualFrame.height;
    const e2Top = element2.virtualFrame.y;
    const e2Bottom = element2.virtualFrame.y + element2.virtualFrame.height;

    const overlapStart = Math.max(e1Top, e2Top);
    const overlapEnd = Math.min(e1Bottom, e2Bottom);
    const overlapHeight = Math.max(0, overlapEnd - overlapStart);

    return overlapHeight / element1.virtualFrame.height;
  }

  calculateHorizontalOverlapRatio(element1, element2) {
    const e1Left = element1.virtualFrame.x;
    const e1Right = element1.virtualFrame.x + element1.virtualFrame.width;
    const e2Left = element2.virtualFrame.x;
    const e2Right = element2.virtualFrame.x + element2.virtualFrame.width;

    const overlapStart = Math.max(e1Left, e2Left);
    const overlapEnd = Math.min(e1Right, e2Right);
    const overlapWidth = Math.max(0, overlapEnd - overlapStart);

    return overlapWidth / element1.virtualFrame.width;
  }

  updateTrianglePoints(triangleChild, relation) {
    const newPoints = relation.points.map((pointRatio) => ({
      x: this.virtualFrame.x + pointRatio.xRatio * this.virtualFrame.width,
      y: this.virtualFrame.y + pointRatio.yRatio * this.virtualFrame.height,
    }));

    (triangleChild as any).updateVertex(newPoints);
  }

  updateLinesWithConstraints(
    child,
    relation,
    isHorizontalArch,
    isVerticalArch,
    widthDiff,
    heightDiff
  ) {
    (child as any).lines = relation.lines.map((lineRelation: any) => {
      const startPoint = {
        x:
          this.virtualFrame.x +
          lineRelation.startPointRatio.xRatio * this.virtualFrame.width,
        y:
          this.virtualFrame.y +
          lineRelation.startPointRatio.yRatio * this.virtualFrame.height,
      };

      const endPoint = {
        x:
          this.virtualFrame.x +
          lineRelation.endPointRatio.xRatio * this.virtualFrame.width,
        y:
          this.virtualFrame.y +
          lineRelation.endPointRatio.yRatio * this.virtualFrame.height,
      };

      if (
        isHorizontalArch &&
        startPoint.y > this.virtualFrame.y + this.virtualFrame.height / 2
      ) {
        startPoint.y += heightDiff;
      }
      if (
        isHorizontalArch &&
        endPoint.y > this.virtualFrame.y + this.virtualFrame.height / 2
      ) {
        endPoint.y += heightDiff;
      }

      if (
        isVerticalArch &&
        startPoint.x > this.virtualFrame.x + this.virtualFrame.width / 2
      ) {
        startPoint.x += widthDiff;
      }
      if (
        isVerticalArch &&
        endPoint.x > this.virtualFrame.x + this.virtualFrame.width / 2
      ) {
        endPoint.x += widthDiff;
      }

      // todo intersectionPoints

      const newLine: ILine = {
        id: lineRelation.id,
        startPoint,
        endPoint,
        weight: lineRelation.weight,
        oldWeight: lineRelation.oldWeight,
        angle: lineRelation.angle,
        hidden: lineRelation.hidden,
        isCut: lineRelation.isCut,
      };

      // 更新圆弧中心点
      if (lineRelation.centerRatio) {
        newLine.center = {
          x:
            this.virtualFrame.x +
            lineRelation.centerRatio.xRatio * this.virtualFrame.width,
          y:
            this.virtualFrame.y +
            lineRelation.centerRatio.yRatio * this.virtualFrame.height,
        };

        // 如果是水平圆弧且中心点在下半部分，调整Y坐标
        if (
          isHorizontalArch &&
          newLine.center.y > this.virtualFrame.y + this.virtualFrame.height / 2
        ) {
          newLine.center.y += heightDiff;
        }

        // 如果是垂直圆弧且中心点在右半部分，调整X坐标
        if (
          isVerticalArch &&
          newLine.center.x > this.virtualFrame.x + this.virtualFrame.width / 2
        ) {
          newLine.center.x += widthDiff;
        }
      }

      if (lineRelation.radiusRatio) {
        newLine.radius =
          lineRelation.radiusRatio *
          Math.max(this.virtualFrame.width, this.virtualFrame.height);
      }

      if (lineRelation.intersectionPoints) {
        newLine.intersectionPoints = lineRelation.intersectionPoints.map(
          (intersection: any) => {
            const point = {
              x:
                this.virtualFrame.x +
                intersection.pointRatio.xRatio * this.virtualFrame.width,
              y:
                this.virtualFrame.y +
                intersection.pointRatio.yRatio * this.virtualFrame.height,
            };

            if (
              isHorizontalArch &&
              point.y > this.virtualFrame.y + this.virtualFrame.height / 2
            ) {
              point.y += heightDiff;
            }

            if (
              isVerticalArch &&
              point.x > this.virtualFrame.x + this.virtualFrame.width / 2
            ) {
              point.x += widthDiff;
            }
            return {
              point,
              lineId: intersection.lineId,
              lineIndex: intersection.lineIndex,
            };
          }
        );
      }

      if (lineRelation.hiddenSegment) {
        newLine.hiddenSegment = lineRelation.hiddenSegment.map(
          (segment: any) => {
            const startPoint = {
              x:
                this.virtualFrame.x +
                segment.startPointRatio.xRatio * this.virtualFrame.width,
              y:
                this.virtualFrame.y +
                segment.startPointRatio.yRatio * this.virtualFrame.height,
            };

            const endPoint = {
              x:
                this.virtualFrame.x +
                segment.endPointRatio.xRatio * this.virtualFrame.width,
              y:
                this.virtualFrame.y +
                segment.endPointRatio.yRatio * this.virtualFrame.height,
            };

            // 如果是水平圆弧，调整Y坐标
            if (isHorizontalArch) {
              if (
                startPoint.y >
                this.virtualFrame.y + this.virtualFrame.height / 2
              ) {
                startPoint.y += heightDiff;
              }
              if (
                endPoint.y >
                this.virtualFrame.y + this.virtualFrame.height / 2
              ) {
                endPoint.y += heightDiff;
              }
            }

            // 如果是垂直圆弧，调整X坐标
            if (isVerticalArch) {
              if (
                startPoint.x >
                this.virtualFrame.x + this.virtualFrame.width / 2
              ) {
                startPoint.x += widthDiff;
              }
              if (
                endPoint.x >
                this.virtualFrame.x + this.virtualFrame.width / 2
              ) {
                endPoint.x += widthDiff;
              }
            }

            return {
              startPoint,
              endPoint,
            };
          }
        );
      }

      return newLine;
    });
  }

  updateNonArchElements() {
    this.children.forEach((child) => {
      if (child.type === "Arch-h" || child.type === "Arch-v") return;

      const relation = this.childrenRelations.get(child.id);
      if (!relation) return;
      let childParams = this.calculateExpectedParams(relation);
      if (
        child.type === OperationType.HARDWARE_HL ||
        child.type === OperationType.HARDWARE_HR
      ) {
        //gn:特殊处理左右门把手
        const hardwareX = this.adjustHardwareLR(child, childParams, relation);
        childParams.x = hardwareX;
      }

      if (child.type === ShapeType.LineH) {
        delete childParams.height;
      } else if (child.type === ShapeType.LineV) {
        delete childParams.width;
      }
      if (
        child instanceof BaseOperation &&
        !child.type.startsWith("angle-") &&
        !(child.type == OperationType.POCKET_WALL)
      ) {
        delete childParams.height;
        delete childParams.width;
      }

      child.update(childParams);

      if (child.type === ShapeType.Triangle && relation.points) {
        this.updateTrianglePoints(child, relation);
      }

      if (relation.lines && (child as any).lines) {
        (child as any).lines = relation.lines.map((lineRelation: any) => {
          const startPoint = {
            x:
              this.virtualFrame.x +
              lineRelation.startPointRatio.xRatio * this.virtualFrame.width,
            y:
              this.virtualFrame.y +
              lineRelation.startPointRatio.yRatio * this.virtualFrame.height,
          };

          const endPoint = {
            x:
              this.virtualFrame.x +
              lineRelation.endPointRatio.xRatio * this.virtualFrame.width,
            y:
              this.virtualFrame.y +
              lineRelation.endPointRatio.yRatio * this.virtualFrame.height,
          };

          const newLine: ILine = {
            id: lineRelation.id,
            startPoint,
            endPoint,
            weight: lineRelation.weight,
            oldWeight: lineRelation.oldWeight,
            angle: lineRelation.angle,
            hidden: lineRelation.hidden,
            isCut: lineRelation.isCut,
          };

          if (lineRelation.centerRatio) {
            newLine.center = {
              x:
                this.virtualFrame.x +
                lineRelation.centerRatio.xRatio * this.virtualFrame.width,
              y:
                this.virtualFrame.y +
                lineRelation.centerRatio.yRatio * this.virtualFrame.height,
            };
          }

          if (lineRelation.radiusRatio) {
            newLine.radius =
              lineRelation.radiusRatio *
              Math.max(this.virtualFrame.width, this.virtualFrame.height);
          }

          if (lineRelation.intersectionPoints) {
            newLine.intersectionPoints = lineRelation.intersectionPoints.map(
              (intersection: any) => ({
                point: {
                  x:
                    this.virtualFrame.x +
                    intersection.pointRatio.xRatio * this.virtualFrame.width,
                  y:
                    this.virtualFrame.y +
                    intersection.pointRatio.yRatio * this.virtualFrame.height,
                },
                lineId: intersection.lineId,
                lineIndex: intersection.lineIndex,
              })
            );
          }

          if (lineRelation.hiddenSegment) {
            newLine.hiddenSegment = lineRelation.hiddenSegment.map(
              (segment: any) => ({
                startPoint: {
                  x:
                    this.virtualFrame.x +
                    segment.startPointRatio.xRatio * this.virtualFrame.width,
                  y:
                    this.virtualFrame.y +
                    segment.startPointRatio.yRatio * this.virtualFrame.height,
                },
                endPoint: {
                  x:
                    this.virtualFrame.x +
                    segment.endPointRatio.xRatio * this.virtualFrame.width,
                  y:
                    this.virtualFrame.y +
                    segment.endPointRatio.yRatio * this.virtualFrame.height,
                },
              })
            );
          }

          return newLine;
        });
      }
    });
  }

  adjustHardwareLR(child: any, childParams: any, relation: ChildRelation) {
    //gn:特殊处理门把手
    let positionX = childParams.x;
    if (relation.centerDirection) {
      //gn:如果在初始比例计算数据中，有centerDirection方向定位，则按照方向定位进行调整，
      const hardWareWidth = child.virtualFrame.width;
      let centerX = this.virtualFrame.x + this.virtualFrame.width / 2;
      if (relation.centerDirection === "left") {
        //gn:如果初始方位在中线左侧， 且child的最右侧大于centerX，则将x坐标调到centexX - hardWareWidth的位置
        if (childParams.x + hardWareWidth > centerX) {
          positionX = centerX - hardWareWidth;
        } else if (positionX < this.virtualFrame.x) {
          //gn:如果x坐标小于this.virtualFrame.x，则将x坐标调到this.virtualFrame.x的位置
          positionX = this.virtualFrame.x;
        }
      } else if (relation.centerDirection === "right") {
        //gn:如果初始方位在中线右侧， 且child的最左侧小于centerX，则将x坐标调到centexX的位置
        if (childParams.x < centerX) {
          positionX = centerX;
        }
      }
    }

    return positionX;
  }

  // gn：计算并存储divider的比例关系
  calculateDividerRatio(divider: any) {
    return {
      childId: divider.id,
      xRatio:
        (divider.virtualFrame.x - this.virtualFrame.x) /
        this.virtualFrame.width,
      yRatio:
        (divider.virtualFrame.y - this.virtualFrame.y) /
        this.virtualFrame.height,
      widthRatio: divider.virtualFrame.width / this.virtualFrame.width,
      heightRatio: divider.virtualFrame.height / this.virtualFrame.height,
    };
  }

  // gn：更新divider的比例关系（当divider位置发生变化时调用）
  updateDividerRelation(divider: any) {
    try {
      const relation = this.calculateDividerRatio(divider);
      this.dividerRelations?.set(divider.id, relation);
    } catch (error) {
      console.log("######## updateDividerRelation error:", error);
    }
  }

  //gn:移除divider比例关系
  removeDividerRelation(dividerId: string) {
    try {
      if (this.dividerRelations?.get(dividerId)) {
        this.dividerRelations?.delete(dividerId);
      }
    } catch (error) {
      console.log("######## removeDividerRelation error:", error);
    }
  }

  //gn：更新GroupFrame中的SDL或TDL元素，虽然在elements中GroupFrame和SDL是两个独立的元素，但是界面视觉效果上，SDL是GroupFrame的子元素，可以通过GroupFrame的dividerEles属性来确认要更新的element组件元素，并返回需要更新的element组件的参数
  updateDividerElements() {
    if (!this.dividerEles || this.dividerEles.length === 0) return;

    for (const divider of this.dividerEles) {
      // 使用存储的比例关系，类似child元素
      try {
        let relation = this.dividerRelations.get(divider.id);
        if (!relation) {
          // 如果没有存储的比例关系，计算并存储
          relation = this.calculateDividerRatio(divider);
          this.dividerRelations.set(divider.id, relation);
          // 首次计算时不需要更新，因为位置已经是正确的
          continue;
        }

        // 使用与child元素相同的更新逻辑 - calculateExpectedParams
        const expectedParams = this.calculateExpectedParams(relation);

        // 根据divider类型进行特殊处理
        let adjustedParams = { ...expectedParams };

        // 水平分割线：保持距离左边界距离不变
        if (divider.type && divider.type.includes("-h")) {
          // 保持原始高度不变
          adjustedParams.height = divider.virtualFrame.height;
        }
        // 垂直分割线：保持距离上边界距离不变
        else if (divider.type && !divider.type.includes("-h")) {
          // 保持原始宽度不变
          adjustedParams.width = divider.virtualFrame.width;
        }

        // 更新divider元素
        if (Object.keys(adjustedParams).length > 0) {
          if (divider.update) {
            divider.update(adjustedParams);
            //gn:清空divider和pocketwall的重叠数据
            divider?.clearPocketWallOverlap();
          }
        }
      } catch (error) {
        console.error("######## updateDividerElements error", error);
      }
    }
  }

  updateChild(index: number, newChild: BaseFrame) {
    if (index >= 0 && index < this.children.length) {
      const oldChildId = this.children[index].id;
      this.children[index] = newChild;

      if (oldChildId !== newChild.id) {
        this.childrenRelations.delete(oldChildId);
      }

      this.updateBounds();
    }
  }

  addChild(child: BaseData) {
    this.children.push(child);
    this.updateBounds();
  }

  removeChild(childId: string) {
    this.children = this.children.filter((child) => child.id !== childId);
    this.childrenRelations.delete(childId);
    this.updateBounds();
  }
}
