import { IResizableFrame } from "../../components/shape/resizable-frame";
import lineUntil from "../../until/lineUntil";
import { BaseFrame } from "../baseFrame";
import { bool } from "prop-types";
import { HorizontalLineWindow, VerticalLineWindow } from "./line";

export interface IVertexAngle {
  x: number;
  y: number;
  angle: number;
}

interface ChildRelation {
  childId: string;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}

interface IPointPostion {
  x: number;
  y: number;
}

export interface IDimension {
  position: IPointPostion;
  direction: "horizontal" | "vertical";
  length: number;
}

export class Frame extends BaseFrame {
  id!: string;
  lineElements: Array<HorizontalLineWindow | VerticalLineWindow> = [];

  // private childrenRelations: Map<string, ChildRelation> = new Map();

  constructor(lineWidth: number = 30, params?: any) {
    super(lineWidth, params);
    this.type = "Rectangle";
    this.update(params.virtualFrame, true);
  }

  // calculateChildrenRelations() {
  //   // 遍历所有子元素，计算它们与当前框架的比例关系
  //   const parentFrame = this.virtualFrame;
  //
  //   // 清空现有关系
  //   this.childrenRelations?.clear();
  //
  //   // 如果当前框架没有尺寸，则无法计算比例
  //   if (!parentFrame || parentFrame.width === 0 || parentFrame.height === 0) {
  //     return;
  //   }
  //
  //   // 对于每个线条元素，计算其相对位置和尺寸
  //   for (const lineElement of this.lineElements) {
  //     const childFrame = lineElement.virtualFrame;
  //
  //     // 计算相对位置和尺寸比例
  //     const relation: ChildRelation = {
  //       childId: lineElement.id,
  //       // x、y相对于父框架的比例
  //       xRatio: (childFrame.x - parentFrame.x) / parentFrame.width,
  //       yRatio: (childFrame.y - parentFrame.y) / parentFrame.height,
  //       // 宽高相对于父框架的比例
  //       widthRatio: childFrame.width / parentFrame.width,
  //       heightRatio: childFrame.height / parentFrame.height
  //     };
  //
  //     // 存储计算出的关系
  //     this.childrenRelations.set(lineElement.id, relation);
  //   }
  // }

  move(dx: number, dy: number) {
    super.move(dx, dy);
    this.updateLines();
  }

  update(
    data: {
      x?: number;
      y?: number;
      height?: number;
      width?: number;
    },
    init?: boolean
  ) {
    super.update(data);
    this.points = lineUntil.getVertexPosition(
      this.virtualFrame.x,
      this.virtualFrame.y,
      this.virtualFrame.width,
      this.virtualFrame.height
    );

    this.updateLines(init);
  }

  updateLines(init?: boolean) {
    if (!this.lines) {
      this.lines = new Array(4).fill(null);
    }
    if (init) {
      this.lines = [
        {
          id: `${this.id}-line-0`,
          startPoint: this.points[0],
          endPoint: this.points[1],
          weight: -1,
        },
        {
          id: `${this.id}-line-1`,
          startPoint: this.points[1],
          endPoint: this.points[2],
          weight: -1,
        },
        {
          id: `${this.id}-line-2`,
          startPoint: this.points[2],
          endPoint: this.points[3],
          weight: -1,
        },
        {
          id: `${this.id}-line-3`,
          startPoint: this.points[3],
          endPoint: this.points[0],
          weight: -1,
        },
      ];
      return;
    }
    this.lines = this.lines.map((line, index) => {
      return {
        ...line,
        startPoint: this.points[index],
        endPoint: this.points[(index + 1) % 4],
      };
    });
  }

  updateFrameByVertex() {
    const bounds = this.points.reduce(
      (acc, vertex) => ({
        minX: Math.min(acc.minX, vertex.x),
        maxX: Math.max(acc.maxX, vertex.x),
        minY: Math.min(acc.minY, vertex.y),
        maxY: Math.max(acc.maxY, vertex.y),
      }),
      {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
      }
    );

    this.virtualFrame.x = bounds.minX;
    this.virtualFrame.y = bounds.minY;
    this.virtualFrame.width = bounds.maxX - bounds.minX;
    this.virtualFrame.height = bounds.maxY - bounds.minY;
  }

  updateLineEle(line: any, remove: boolean = false) {
    const index = this.lineElements.findIndex(
      (elem: any) => elem.id === line.id
    );
    if (remove) {
      index > -1 && this.lineElements.splice(index, 1);
      return;
    }
    if (index >= 0) {
      this.lineElements[index] = line;
    } else {
      this.lineElements.push(line);
    }
    // this.calculateChildrenRelations()
  }

  getPath(): string {
    return `M ${this.points[0].x} ${this.points[0].y} 
            L ${this.points[1].x} ${this.points[1].y} 
            L ${this.points[2].x} ${this.points[2].y} 
            L ${this.points[3].x} ${this.points[3].y} Z`;
  }

  setAppearanceType() {}
}
