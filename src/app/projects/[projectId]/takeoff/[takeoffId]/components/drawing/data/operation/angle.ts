import { BaseData } from "../baseData";
import { IVirtualFrame } from "../../datas";
import { BaseOperation } from "./baseOperation";

export class AngleData extends BaseOperation {
  direction: "left" | "right" | "up" | "down";
  renderType: "solid" | "dashed";

  constructor(params: {
    id: string;
    direction: "left" | "right" | "up" | "down";
    type: string;
    virtualFrame: IVirtualFrame;
  }) {
    super(params);
    this.id = params.id;
    this.direction = params.direction;
    this.renderType = "dashed";
    this.style.color.select = "#00b300";
  }

  getPath(): { path: string; strokeDasharray?: string } {
    const { width, height } = this.virtualFrame;
    let path = "";

    switch (this.direction) {
      case "left": {
        // 右上角点
        const topX = width;
        const topY = 0;
        // 顶点（左边中点）
        const peakX = 0;
        const peakY = height / 2;
        // 右下角点
        const bottomX = width;
        const bottomY = height;

        path = `M ${topX},${topY} 
                        L ${peakX},${peakY} 
                        L ${bottomX},${bottomY}`;
        break;
      }
      case "right": {
        // 左上角点
        const topX = 0;
        const topY = 0;
        // 顶点（右边中点）
        const peakX = width;
        const peakY = height / 2;
        // 左下角点
        const bottomX = 0;
        const bottomY = height;

        path = `M ${topX},${topY} 
                        L ${peakX},${peakY} 
                        L ${bottomX},${bottomY}`;
        break;
      }
      case "up": {
        // 左下角点
        const leftX = 0;
        const leftY = height;
        // 顶点（上边中点）
        const peakX = width / 2;
        const peakY = 0;
        // 右下角点
        const rightX = width;
        const rightY = height;

        path = `M ${leftX},${leftY} 
                        L ${peakX},${peakY} 
                        L ${rightX},${rightY}`;
        break;
      }
      case "down": {
        // 左上角点
        const leftX = 0;
        const leftY = 0;
        // 顶点（下边中点）
        const peakX = width / 2;
        const peakY = height;
        // 右上角点
        const rightX = width;
        const rightY = 0;

        path = `M ${leftX},${leftY} 
                        L ${peakX},${peakY} 
                        L ${rightX},${rightY}`;
        break;
      }
    }
    return {
      path,
      strokeDasharray: this.renderType === "dashed" ? "5,5" : undefined,
    };
  }
}
