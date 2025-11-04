import { BaseFrame } from "../baseFrame";
import { arcUntil } from "../../until/arcUntil";
import {HorizontalLineWindow, VerticalLineWindow} from "./line";

export class TopSemiCircleWindow extends BaseFrame {
    // circleCenter: IPointPostion;
    // arcAngle: number = 180;
    lineElements: Array<HorizontalLineWindow | VerticalLineWindow> = [];
    // private childrenRelations: Map<string, ChildRelation> = new Map();

    constructor(lineWidth: number, params: any) {
        super(lineWidth, { ...params, ...params.virtualFrame });
        this.type = "Arch-h"
        this.updateFrameByVertex(true);
    }

    getPath(): any {
        const outerStart = this.points[0];
        const outerMid = this.points[2];
        const outerEnd = this.points[1];

        const outerArc = arcUntil.calculateArc(
            outerStart.x,
            outerStart.y,
            outerMid.x,
            outerMid.y,
            outerEnd.x,
            outerEnd.y
        );

        if (!outerArc) {
            return '';
        }

        const outerArcPath = arcUntil.generateArcPath(
            outerStart,
            outerMid,
            outerEnd
        );

        return {
            outerArcPath,
            outPath: `${outerArcPath} L ${outerStart.x} ${outerStart.y} Z`,
        }
    }

    updateFrameByVertex(init?: boolean) {
        if (this.flipY) {
            this.points = [
                { x: this.virtualFrame.x, y: this.virtualFrame.y },
                { x: this.virtualFrame.x + this.virtualFrame.width, y: this.virtualFrame.y },
                { x: this.virtualFrame.x + this.virtualFrame.width/2, y: this.virtualFrame.y+ this.virtualFrame.height  }
            ];
        } else {
            this.points = [
                { x: this.virtualFrame.x, y: this.virtualFrame.y + this.virtualFrame.height },
                { x: this.virtualFrame.x + this.virtualFrame.width, y: this.virtualFrame.y + this.virtualFrame.height },
                { x: this.virtualFrame.x + this.virtualFrame.width/2, y: this.virtualFrame.y }
            ];
        }

        const maxHeight = this.virtualFrame.width / 2;
        if(this.virtualFrame.height > maxHeight) {
            this.points[2].y = this.flipY ? this.points[2].y -  (this.virtualFrame.height - maxHeight) : this.points[2].y + (this.virtualFrame.height - maxHeight);
        }

        this.updateLines(init);
    }

    move(dx: number, dy: number) {
        super.move(dx, dy);
        this.updateFrameByVertex();
    }

    update(params: any) {
        if (params.x !== undefined) this.virtualFrame.x = params.x;
        if (params.y !== undefined) this.virtualFrame.y = params.y;
        if (params.width !== undefined) {
            this.virtualFrame.width = params.width;
            // const maxHeight = this.virtualFrame.width / 2;
            // if (this.virtualFrame.height > maxHeight) {
            //     this.virtualFrame.height = maxHeight;
            // }
        }
        if (params.height !== undefined) {
            // const maxHeight = (this.virtualFrame.width || params.width) / 2;
            // if (params.height > maxHeight) {
            //     this.virtualFrame.height = maxHeight;
            // } else {
                this.virtualFrame.height = params.height;
            // }
        }
        // if (params.flipX !== undefined) this.flipX = params.flipX;
        this.flipX = false;
        if (params.flipY !== undefined) this.flipY = params.flipY;
        this.updateFrameByVertex();
        // this.updateChildrenBasedOnRelations()
    }

    updateLines(init?: boolean) {
        const outerStart = this.points[0];
        const outerMid = this.points[2];
        const outerEnd = this.points[1];

        const outerArc = arcUntil.calculateArc(
            outerStart.x,
            outerStart.y,
            outerMid.x,
            outerMid.y,
            outerEnd.x,
            outerEnd.y
        );

        if (!outerArc) return;

        const startAngle = Math.atan2(outerStart.y - outerArc.cy, outerStart.x - outerArc.cx) * 180 / Math.PI;
        const endAngle = Math.atan2(outerEnd.y - outerArc.cy, outerEnd.x - outerArc.cx) * 180 / Math.PI;
        let angle = endAngle - startAngle;
        if (angle < 0) angle += 360;

        if (init || !this.lines) {
            this.lines = [
                {
                    id: `${this.id}-line-1`,
                    startPoint: outerStart,
                    endPoint: outerEnd,
                    weight: -1,
                },
                {
                    id: `${this.id}-line-2`,
                    startPoint: outerEnd,
                    endPoint: outerStart,
                    center: {
                        x: outerArc.cx,
                        y: outerArc.cy
                    },
                    radius: outerArc.r,
                    angle: angle,
                    weight: -1,
                }
            ];
        } else {
            this.lines = this.lines.map((line, index) => {
                if (index === 0) {
                    return {
                        ...line,
                        startPoint: outerStart,
                        endPoint: outerEnd
                    };
                } else {
                    return {
                        ...line,
                        startPoint: outerEnd,
                        endPoint: outerStart,
                        center: {
                            x: outerArc.cx,
                            y: outerArc.cy
                        },
                        radius: outerArc.r,
                        angle: angle
                    };
                }
            });
        }
    }

    updateLineEle(line:any, remove: boolean = false) {
        const index = this.lineElements.findIndex((elem: any) => elem.id === line.id);

        if(remove) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            index > -1 && this.lineElements.splice(index, 1);
            return;
        }
        if (index >= 0) {
            this.lineElements[index] = line
        } else {
            this.lineElements.push(line);
        }
        // this.calculateChildrenRelations()
    }

    // calculateChildrenRelations() {
    //     const parentFrame = this.virtualFrame;
    //
    //     // 清空现有关系
    //     this.childrenRelations?.clear();
    //
    //     // 如果当前框架没有尺寸，则无法计算比例
    //     if (!parentFrame || parentFrame.width === 0 || parentFrame.height === 0) {
    //       return;
    //     }
    //
    //     // 对于每个线条元素，计算其相对位置和尺寸
    //     for (const lineElement of this.lineElements) {
    //       const childFrame = lineElement.virtualFrame;
    //
    //       // 计算相对位置和尺寸比例
    //       const relation: ChildRelation = {
    //         childId: lineElement.id,
    //         // x、y相对于父框架的比例
    //         xRatio: (childFrame.x - parentFrame.x) / parentFrame.width,
    //         yRatio: (childFrame.y - parentFrame.y) / parentFrame.height,
    //         // 宽高相对于父框架的比例
    //         widthRatio: childFrame.width / parentFrame.width,
    //         heightRatio: childFrame.height / parentFrame.height
    //       };
    //
    //       // 存储计算出的关系
    //       this.childrenRelations.set(lineElement.id, relation);
    //     }
    // }

    // updateChildrenBasedOnRelations() {
    //     const parentFrame = this.virtualFrame;
    //
    //     if (!parentFrame || parentFrame.width === 0 || parentFrame.height === 0) {
    //       return;
    //     }
    //
    //     this.lineElements?.forEach((line) => {
    //       const relation = this.childrenRelations.get(line.id);
    //       if (!relation) return;
    //
    //       const newParams: any = {
    //         x: parentFrame.x + (relation.xRatio * parentFrame.width),
    //       };
    //
    //       // 当flipY为true时，从底边开始计算y坐标
    //       if (this.flipY) {
    //         // 翻转时，y坐标需要从底边往上计算
    //         newParams.y = parentFrame.y + parentFrame.height - (relation.yRatio * parentFrame.height) - line.virtualFrame.height;
    //       } else {
    //         newParams.y = parentFrame.y + (relation.yRatio * parentFrame.height);
    //       }
    //
    //       if (line.type === 'Line-h') {
    //         newParams.width = relation.widthRatio * parentFrame.width;
    //       } else if (line.type === 'Line-v') {
    //         newParams.height = relation.heightRatio * parentFrame.height;
    //       }
    //
    //       line.update(newParams);
    //
    //     });
    // }

}

export class RightSemiCircleWindow extends BaseFrame {
    lineElements: Array<HorizontalLineWindow | VerticalLineWindow> = []; // 添加保存lineElement的参数
    // private childrenRelations: Map<string, ChildRelation> = new Map();

    constructor(lineWidth: number, params: any) {
        super(lineWidth, { ...params, ...params.virtualFrame });
        this.type = "Arch-v"
        this.updateFrameByVertex(true);
    }

    getPath(): any {
        const outerStart = this.points[0];
        const outerMid = this.points[2];
        const outerEnd = this.points[1];

        const outerArc = arcUntil.calculateArc(
            outerStart.x,
            outerStart.y,
            outerMid.x,
            outerMid.y,
            outerEnd.x,
            outerEnd.y
        );

        if (!outerArc) {
            return '';
        }
        const outerArcPath = arcUntil.generateArcPath(
            outerStart,
            outerMid,
            outerEnd
        );
        return {
            outPath: `${outerArcPath} L ${outerStart.x} ${outerStart.y} Z`,
            outerArcPath,
        }
    }

    move(dx: number, dy: number) {
        super.move(dx, dy);
        this.updateFrameByVertex();

    }

    updateFrameByVertex(init?: boolean) {
        if (this.flipX) {
            this.points = [
                { x: this.virtualFrame.x + this.virtualFrame.width, y: this.virtualFrame.y },
                { x: this.virtualFrame.x + this.virtualFrame.width, y: this.virtualFrame.y + this.virtualFrame.height },
                { x: this.virtualFrame.x, y: this.virtualFrame.y + this.virtualFrame.height/2 }
            ];

        } else {
            this.points = [
                { x: this.virtualFrame.x, y: this.virtualFrame.y },
                { x: this.virtualFrame.x, y: this.virtualFrame.y + this.virtualFrame.height },
                { x: this.virtualFrame.x + this.virtualFrame.width, y: this.virtualFrame.y + this.virtualFrame.height/2 }
            ];

        }


        const maxWidth = this.virtualFrame.height / 2;
        if(this.virtualFrame.width > maxWidth) {
            this.points[2].x = this.flipX ? this.points[2].x +  (this.virtualFrame.width - maxWidth) : this.points[2].x - (this.virtualFrame.width - maxWidth);
        }

        this.updateLines(init);
    }

    update(params: any) {
        if (params.x !== undefined) this.virtualFrame.x = params.x;
        if (params.y !== undefined) this.virtualFrame.y = params.y;
        if (params.height !== undefined) {
            this.virtualFrame.height = params.height;
            // const maxWidth = this.virtualFrame.height / 2;
            // if (this.virtualFrame.width > maxWidth) {
            //     this.virtualFrame.width = maxWidth;
            // }
        }
        if (params.width !== undefined) {
            // const maxWidth = (this.virtualFrame.height || params.height) / 2;
            // if (params.width > maxWidth) {
            //     this.virtualFrame.width = maxWidth;
            // } else {
                this.virtualFrame.width = params.width;
            // }
        }
        if (params.flipX !== undefined) this.flipX = params.flipX;
        this.flipY = false;
        // if (params.flipY !== undefined) this.flipY = params.flipY;
        this.updateFrameByVertex();
        // this.updateChildrenBasedOnRelations()
    }

    updateLines(init?: boolean) {
        const outerStart = this.points[0];
        const outerMid = this.points[2];
        const outerEnd = this.points[1];

        const outerArc = arcUntil.calculateArc(
            outerStart.x,
            outerStart.y,
            outerMid.x,
            outerMid.y,
            outerEnd.x,
            outerEnd.y
        );

        if (!outerArc) return;

        const startAngle = Math.atan2(outerStart.y - outerArc.cy, outerStart.x - outerArc.cx) * 180 / Math.PI;
        const endAngle = Math.atan2(outerEnd.y - outerArc.cy, outerEnd.x - outerArc.cx) * 180 / Math.PI;
        let angle = endAngle - startAngle;
        if (angle < 0) angle += 360;

        if (init || !this.lines) {
            this.lines = [
                {
                    id: `${this.id}-line-1`,
                    startPoint: outerStart,
                    endPoint: outerEnd
                },
                {
                    id: `${this.id}-line-2`,
                    startPoint: outerEnd,
                    endPoint: outerStart,
                    center: {
                        x: outerArc.cx,
                        y: outerArc.cy
                    },
                    radius: outerArc.r,
                    angle: angle
                }
            ];
        } else {
            this.lines = this.lines.map((line, index) => {
                if (index === 0) {
                    return {
                        ...line,
                        startPoint: outerStart,
                        endPoint: outerEnd
                    };
                } else {
                    return {
                        ...line,
                        startPoint: outerEnd,
                        endPoint: outerStart,
                        center: {
                            x: outerArc.cx,
                            y: outerArc.cy
                        },
                        radius: outerArc.r,
                        angle: angle
                    };
                }
            });

        }
    }


    updateLineEle(line:any, remove: boolean = false) {
        const index = this.lineElements.findIndex((elem: any) => elem.id === line.id);

        if(remove) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            index > -1 && this.lineElements.splice(index, 1);
            return;
        }
        if (index >= 0) {
            this.lineElements[index] = line
        } else {
            this.lineElements.push(line);
        }
        // this.calculateChildrenRelations()
    }

    // calculateChildrenRelations() {
    //     const parentFrame = this.virtualFrame;
    //
    //     // 清空现有关系
    //     this.childrenRelations.clear();
    //
    //     // 如果当前框架没有尺寸，则无法计算比例
    //     if (!parentFrame || parentFrame.width === 0 || parentFrame.height === 0) {
    //       return;
    //     }
    //
    //     // 对于每个线条元素，计算其相对位置和尺寸
    //     for (const lineElement of this.lineElements) {
    //       const childFrame = lineElement.virtualFrame;
    //
    //       // 计算相对位置和尺寸比例
    //       const relation: ChildRelation = {
    //         childId: lineElement.id,
    //         // x、y相对于父框架的比例
    //         xRatio: (childFrame.x - parentFrame.x) / parentFrame.width,
    //         yRatio: (childFrame.y - parentFrame.y) / parentFrame.height,
    //         // 宽高相对于父框架的比例
    //         widthRatio: childFrame.width / parentFrame.width,
    //         heightRatio: childFrame.height / parentFrame.height
    //       };
    //
    //       // 存储计算出的关系
    //       this.childrenRelations.set(lineElement.id, relation);
    //     }
    // }
    //
    // updateChildrenBasedOnRelations() {
    //     const parentFrame = this.virtualFrame;
    //
    //     if (!parentFrame || parentFrame.width === 0 || parentFrame.height === 0) {
    //       return;
    //     }
    //
    //     this.lineElements?.forEach((line) => {
    //       const relation = this.childrenRelations.get(line.id);
    //       if (!relation) return;
    //
    //       const newParams: any = {
    //         y: parentFrame.y + (relation.yRatio * parentFrame.height),
    //       };
    //
    //       // 当flipX为true时，从右边开始计算x坐标
    //       if (this.flipX) {
    //         // 翻转时，x坐标需要从右边往左计算
    //         newParams.x = parentFrame.x + parentFrame.width - (relation.xRatio * parentFrame.width) - line.virtualFrame.width;
    //       } else {
    //         newParams.x = parentFrame.x + (relation.xRatio * parentFrame.width);
    //       }
    //
    //       if (line.type === 'Line-h') {
    //         newParams.width = relation.widthRatio * parentFrame.width;
    //       } else if (line.type === 'Line-v') {
    //         newParams.height = relation.heightRatio * parentFrame.height;
    //       }
    //
    //       line.update(newParams);
    //
    //       // if (line.type === 'Line-h') {
    //       //   line.points[0] = { x: newParams.x, y: newParams.y };
    //       //   line.points[1] = { x: newParams.x + newParams.width, y: newParams.y };
    //       // } else if (line.type === 'Line-v') {
    //       //   line.points[0] = { x: newParams.x, y: newParams.y };
    //       //   line.points[1] = { x: newParams.x, y: newParams.y + newParams.height };
    //       // }
    //     });
    // }

} 