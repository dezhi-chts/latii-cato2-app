import { BaseData } from "./baseData";
import { ShapeType } from "../datas";
import {
  IPointPostion,
  LineSegment,
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/drawing/datas";

export interface ILine {
  id?: string;
  startPoint: IPointPostion;
  endPoint: IPointPostion;
  weight?: number;
  oldWeight?: number;
  center?: IPointPostion;
  angle?: number;
  radius?: number;
  hidden?: boolean;
  isCut?: boolean;
  intersectionPoints?: Array<{
    point: IPointPostion;
    lineId: string;
    lineIndex?: number;
  }>;
  hiddenSegment?: Array<LineSegment>;
  // color?: string;
}

export interface IAreas {
  lines: ILine[];
  elementId: string;
}

export class BaseFrame extends BaseData {
  points: Array<IPointPostion> = [];
  flipX: boolean = false;
  flipY: boolean = false;
  lines: Array<ILine> = [];
  isBaseArea: boolean = true;

  constructor(lineWidth: number, params?: Partial<BaseFrame>) {
    super(params);
    this.flipX = params?.flipX || false;
    this.flipY = params?.flipY || false;
  }

  override move(dx: number, dy: number) {
    super.move(dx, dy);
    this.moveVertexByDiff(dx, dy);
  }

  update(params: any, init?: boolean) {
    super.update(params);
    if (params.flipX !== undefined) this.flipX = params.flipX;
    if (params.flipY !== undefined) this.flipY = params.flipY;

    // 获取位置变化信息
    // const oldX = this.virtualFrame.x;
    // const oldY = this.virtualFrame.y;
    // const oldWidth = this.virtualFrame.width;
    // const oldHeight = this.virtualFrame.height;

    // 计算变化量
    // const dx = (params.x !== undefined) ? params.x - oldX : 0;
    // const dy = (params.y !== undefined) ? params.y - oldY : 0;
    // const scaleX = (params.width !== undefined && oldWidth !== 0) ? params.width / oldWidth : 1;
    // const scaleY = (params.height !== undefined && oldHeight !== 0) ? params.height / oldHeight : 1;

    // 如果位置或大小发生变化，更新交点信息
    // if (dx !== 0 || dy !== 0 || scaleX !== 1 || scaleY !== 1) {
    //     this.updateIntersectionPoints(dx, dy, scaleX, scaleY);
    // }
  }

  // updateIntersectionPoints(dx: number, dy: number, scaleX: number = 1, scaleY: number = 1) {
  //     this.lines.forEach((line) => {
  //         if (!line.intersectionPoints) return;
  //
  //         line.intersectionPoints.forEach((intersection) => {
  //             if (!intersection || !intersection.point) return;
  //
  //             // 计算点相对于元素的位置
  //             const relX = intersection.point.x - this.virtualFrame.x;
  //             const relY = intersection.point.y - this.virtualFrame.y;
  //
  //             // 根据缩放和移动更新点的位置
  //             intersection.point.x = this.virtualFrame.x + relX * scaleX + dx;
  //             intersection.point.y = this.virtualFrame.y + relY * scaleY + dy;
  //         });
  //     });
  // }

  moveVertexByDiff(dx: number, dy: number) {
    this.points = this.points.map((vertex) => ({
      x: vertex.x + dx,
      y: vertex.y + dy,
    }));

    this.lines.forEach((line, index) => {
      if (line.startPoint) {
        line.startPoint.x = line.startPoint.x + dx;
        line.startPoint.y = line.startPoint.y + dy;
      }

      if (line.endPoint) {
        line.endPoint.x = line.endPoint.x + dx;
        line.endPoint.y = line.endPoint.y + dy;
      }

      if (line?.intersectionPoints?.length) {
        line.intersectionPoints.forEach((intersection) => {
          intersection.point.x = intersection.point.x + dx;
          intersection.point.y = intersection.point.y + dy;
        });
      }
      if (line.hiddenSegment?.length) {
        line.hiddenSegment.forEach((hiddenSegment) => {
          hiddenSegment.startPoint.x = hiddenSegment.startPoint.x + dx;
          hiddenSegment.startPoint.y = hiddenSegment.startPoint.y + dy;
          hiddenSegment.endPoint.x = hiddenSegment.endPoint.x + dx;
          hiddenSegment.endPoint.y = hiddenSegment.endPoint.y + dy;
        });
      }
    });
  }

  getLines(): { x1: number; y1: number; x2: number; y2: number }[] {
    const vertices = this.points;
    if (!vertices || vertices.length < 2) return [];

    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < vertices.length; i++) {
      const current = vertices[i];
      const next = vertices[(i + 1) % vertices.length];
      lines.push({
        x1: current.x,
        y1: current.y,
        x2: next.x,
        y2: next.y,
      });
    }
    return lines;
  }

  addRenderPoints(
    lineId: string,
    frameId: string,
    points: IPointPostion[],
    clear: boolean = true
  ) {
    if (clear) {
      for (const line of this.lines) {
        if (!line) continue;
        if (!line.intersectionPoints) {
          line.intersectionPoints = [];
        } else {
          line.intersectionPoints = line.intersectionPoints.filter(
            (ip: any) => ip.lineId !== frameId
          );
        }
      }
    }
    const targetLine = this.lines.find((line: any) => line?.id === lineId);

    if (!targetLine) return;
    if (!targetLine.intersectionPoints) {
      targetLine.intersectionPoints = [];
    }

    points.forEach((point: any) => {
      targetLine.intersectionPoints?.push({
        lineId: frameId,
        point,
      });
    });
  }

  extendsPoints: any[] = [];
  savePoints(
    lineInfo: any,
    point: IPointPostion,
    frameId: string,
    clear: boolean = true
  ) {
    if (clear) {
      this.extendsPoints.filter(
        (info) => info.id !== lineInfo.id && info.frameId !== frameId
      );
      // return;
    }
    this.extendsPoints.push({
      point,
      lineId: frameId,
      selfLineId: lineInfo.id,
    });
  }

  clearRenderPoints() {
    this.lines.forEach((line: any) => {
      line.intersectionPoints = [];
    });
  }

  // getPath(): string {
  //   return '';
  // }

  /**
   * 检查线段的切断状态，如果只有一个未切断的线段，则更新virtualFrame为该线段的大小
   * @returns boolean 返回是否进行了更新
   */
  updateFrameBasedOnCutLines(): boolean {
    if (this.type == ShapeType.LineH || this.type == ShapeType.LineV)
      return false;

    // 过滤出未切断的线段
    const unCutLines = this.lines.filter((line) => !line.isCut);
    if (unCutLines.length == 1 && unCutLines[0].angle) {
      return false;
    }
    // 如果只有一个未切断的线段
    if (unCutLines.length === 1) {
      const activeLine = unCutLines[0];

      // 确保线段有起点和终点
      if (activeLine.startPoint && activeLine.endPoint) {
        // 计算线段的边界框
        const minX = Math.min(activeLine.startPoint.x, activeLine.endPoint.x);
        const minY = Math.min(activeLine.startPoint.y, activeLine.endPoint.y);
        const maxX = Math.max(activeLine.startPoint.x, activeLine.endPoint.x);
        const maxY = Math.max(activeLine.startPoint.y, activeLine.endPoint.y);

        // 计算新的宽度和高度
        const newWidth = maxX - minX;
        const newHeight = maxY - minY;

        // 更新virtualFrame
        this.virtualFrame = {
          x: minX,
          y: minY,
          width: newWidth || 1,
          height: newHeight || 1,
        };

        if (this.type === "Line-h") {
          this.virtualFrame.height = 1;
        } else if (this.type === "Line-v") {
          this.virtualFrame.width = 1;
        }

        if (this.points.length >= 2) {
          if (!this.flipX && !this.flipY) {
            this.points[0] = { x: minX, y: minY };
            this.points[1] = { x: maxX, y: maxY };
          } else if (this.flipX && !this.flipY) {
            this.points[0] = { x: maxX, y: minY };
            this.points[1] = { x: minX, y: maxY };
          } else if (!this.flipX && this.flipY) {
            this.points[0] = { x: minX, y: maxY };
            this.points[1] = { x: maxX, y: minY };
          } else {
            this.points[0] = { x: maxX, y: maxY };
            this.points[1] = { x: minX, y: minY };
          }
        }

        return true;
      }
    }

    // 没有进行更新
    return false;
  }

  /**
   * 检查所有线段的切断状态并更新virtualFrame
   * 可以在线段的isCut属性变化后调用此方法
   */
  checkAndUpdateFrameBasedOnCutLines(): void {
    // 检查是否有更新
    const updated = this.updateFrameBasedOnCutLines();
  }
}
