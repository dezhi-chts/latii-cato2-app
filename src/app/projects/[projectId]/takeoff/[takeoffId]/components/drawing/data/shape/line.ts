import { BaseFrame } from "../baseFrame";
import {IPointPostion, IVirtualFrame} from "../../datas";

export class HorizontalLineWindow extends BaseFrame {
    centerPoints: IPointPostion[] = [];

    constructor(lineWidth: number, params: {
        id: string;
        virtualFrame: IVirtualFrame;
    }) {
        params.virtualFrame.height = lineWidth
        super(lineWidth,  { ...params, ...params.virtualFrame });
        this.updateFrameByVertex(true);
        this.type = "Line-h";
    }

    updateFrameByVertex(init?: boolean) {
        this.points = [
            { x: this.virtualFrame.x, y: this.virtualFrame.y },
            { x: this.virtualFrame.x + this.virtualFrame.width, y: this.virtualFrame.y },
        ];
        this.updateLines(init);
    }

    updateVirtualFrameByPoints(points: IPointPostion[]) {
        if (!points) {
            points = this.points;
        }

        const startPoint = points[0];
        const endPoint = points[1];

        const leftPoint = startPoint.x <= endPoint.x ? startPoint : endPoint;
        const rightPoint = startPoint.x > endPoint.x ? startPoint : endPoint;

        this.virtualFrame.x = leftPoint.x;
        this.virtualFrame.y = leftPoint.y;
        this.virtualFrame.width = rightPoint.x - leftPoint.x;

        this.updateLines()
    }

    override move(dx: number, dy: number) {
        super.move(dx, dy);
        this.centerPoints = []
        this.updateLines(false);
    }

    update(params: any) {
        super.update(params);
        console.log('??update?????')
        this.updateFrameByVertex();
    }

    updateParams(params: any) {
        super.update(params);
    }

    getPath(): string {
        return `M ${this.virtualFrame.x} ${this.virtualFrame.y} 
                L ${this.virtualFrame.x + this.virtualFrame.width} ${this.virtualFrame.y}`;
    }

    updateLines(init?: boolean) {
        if(init) this.lines = [{
            id: this.id + '-line-' + 0,
            startPoint: this.points[0],
            endPoint: this.points[1],
            weight: 1,
        } ]
        if(!this.lines) this.lines = [];
        this.lines = [{
            ...this.lines[0],
            // id: this.id + '-line-' + 0,
            startPoint: this.points[0],
            endPoint: this.points[1]
        }]
    }

    clearCenterPoints() {
        // 更新中心点数组，只保留与中心线端点匹配的点
        if (this.centerPoints && this.centerPoints.length > 0) {
            const { startPoint, endPoint } = this.lines[0];
            this.centerPoints = this.centerPoints.filter(point => {
                // 检查点是否与中心线的端点匹配
                const matchesStart = Math.abs(point.x - startPoint.x) < 0.00001 && 
                                     Math.abs(point.y - startPoint.y) < 0.00001;
                const matchesEnd = Math.abs(point.x - endPoint.x) < 0.00001 && 
                                   Math.abs(point.y - endPoint.y) < 0.00001;
                return matchesStart || matchesEnd;
            });
        }
    }

    clearRenderPoints() {
        super.clearRenderPoints();
        this.centerPoints = [];
    }

}

// 竖线
export class VerticalLineWindow extends BaseFrame {
    renderLines: Array<{startPoint: IPointPostion, endPoint: IPointPostion}> = [];
    centerPoints: IPointPostion[] = [];

    constructor(lineWidth: number, params: {
        id: string;
        virtualFrame: IVirtualFrame;
    }) {
        params.virtualFrame.width = lineWidth
        super(lineWidth, { ...params, ...params.virtualFrame });
        this.updateFrameByVertex(true);
        this.type = "Line-v";
    }

    updateFrameByVertex(init?: boolean) {
        this.points = [
            { x: this.virtualFrame.x, y: this.virtualFrame.y},
            { x: this.virtualFrame.x, y: this.virtualFrame.y + this.virtualFrame.height  },
        ];

        this.updateLines(init);
    }

    addCenterPoints(point: IPointPostion) {
        // 检查是否已经存在相同坐标的点（比较前6位小数）
        const isDuplicate = this.centerPoints.some(existingPoint => {
            const xEqual = Math.abs(existingPoint.x - point.x) < 0.00001;
            const yEqual = Math.abs(existingPoint.y - point.y) < 0.00001;
            return xEqual && yEqual;
        });
        
        // 只有当点不是重复的时才添加
        if (!isDuplicate) {
            this.centerPoints.push(point);
        }
    }

    override move(dx: number, dy: number) {
        super.move(dx, dy);
        // 更新中位线位置
        this.centerPoints = []
        this.updateLines(false);
    }

    update(params: any) {
        super.update(params);
        this.updateFrameByVertex();
    }

    updateVirtualFrameByPoints(points: IPointPostion[]) {
        if (!points) {
            points = this.points;
        }

        const startPoint = points[0];
        const endPoint = points[1];

        const topPoint = startPoint.y <= endPoint.y ? startPoint : endPoint;
        const bottomPoint = startPoint.y > endPoint.y ? startPoint : endPoint;

        this.virtualFrame.x = topPoint.x;
        this.virtualFrame.y = topPoint.y;
        this.virtualFrame.height = bottomPoint.y - topPoint.y;

        this.updateLines()
    }

    updateParams(params: any) {
        super.update(params);
    }

    getPath(): string {
        return `M ${this.virtualFrame.x} ${this.virtualFrame.y} 
                L ${this.virtualFrame.x} ${this.virtualFrame.y + this.virtualFrame.height}`;
    }

    updateLines(init?: boolean) {
        if(init)  this.lines = [{
            id: this.id + '-line-' + 0,
            startPoint: this.points[0],
            endPoint: this.points[1],
            weight: 1,
        }]
        if(!this.lines) this.lines = [];
        this.lines = [{
            ...this.lines[0],
            startPoint: this.points[0],
            endPoint: this.points[1]
        }]
    }
    
    // 添加四条边的渲染线
    updateRenderLines() {
        this.renderLines = [
            // 上边
            {
                startPoint: this.points[0],
                endPoint: this.points[1]
            },
            // 右边
            {
                startPoint: this.points[1],
                endPoint: this.points[2]
            },
            // 下边
            {
                startPoint: this.points[2],
                endPoint: this.points[3]
            },
            // 左边
            {
                startPoint: this.points[3],
                endPoint: this.points[0]
            }
        ];
    }

    getCenterLine(): {startPoint: IPointPostion, endPoint: IPointPostion} {

        return this.lines[0]

        // const centerX = this.virtualFrame.x + this.virtualFrame.width / 2;
        // console.log(this)
        // console.log(this.centerPoints)
        // this.centerLine = {
        //     startPoint: { x: centerX, y: this.virtualFrame.y },
        //     endPoint: { x: centerX, y: this.virtualFrame.y + this.virtualFrame.height }
        // };
        //
        // // 如果没有中心点，返回默认中心线
        // if (!this.centerPoints || this.centerPoints.length === 0) {
        //     const centerX = this.virtualFrame.x + this.virtualFrame.width / 2;
        //     return this.centerLine || {
        //         startPoint: { x: centerX, y: this.virtualFrame.y },
        //         endPoint: { x: centerX, y: this.virtualFrame.y + this.virtualFrame.height }
        //     };
        // }
        //
        // // 如果只有一个中心点
        // if (this.centerPoints.length === 1 && this.centerPoints[0]) {
        //     const point = this.centerPoints[0];
        //     const midY = (this.centerLine.startPoint.y + this.centerLine.endPoint.y) / 2;
        //
        //     // 判断点的位置，替换对应的端点
        //     if (point.y <= midY) {
        //         // 如果点在中点上方或正好在中点，替换起点
        //         return {
        //             startPoint: { x: this.centerLine.startPoint.x, y: point.y },
        //             endPoint: { ...this.centerLine.endPoint }
        //         };
        //     } else {
        //         // 如果点在中点下方，替换终点
        //         return {
        //             startPoint: { ...this.centerLine.startPoint },
        //             endPoint: { x: this.centerLine.endPoint.x, y: point.y }
        //         };
        //     }
        // }
        //
        // // 如果有多个中心点，找出最上和最下的点
        // let minY = Infinity;
        // let maxY = -Infinity;
        // let minPoint: IPointPostion = null;
        // let maxPoint: IPointPostion = null;
        //
        // for (const point of this.centerPoints) {
        //     if (point.y < minY) {
        //         minY = point.y;
        //         minPoint = point;
        //     }
        //     if (point.y > maxY) {
        //         maxY = point.y;
        //         maxPoint = point;
        //     }
        // }
        //
        // return {
        //     startPoint: { x: centerX, y: minPoint.y },
        //     endPoint: { x: centerX, y: maxPoint.y }
        // };
    }

    clearCenterPoints() {
        // 更新中心点数组，只保留与中心线端点匹配的点
        // if (this.centerPoints && this.centerPoints.length > 0) {
        //     this.centerPoints = this.centerPoints.filter(point => {
        //         // 检查点是否与中心线的端点匹配
        //         const matchesStart = Math.abs(point.x - startPoint.x) < 0.00001 &&
        //                              Math.abs(point.y - startPoint.y) < 0.00001;
        //         const matchesEnd = Math.abs(point.x - endPoint.x) < 0.00001 &&
        //                            Math.abs(point.y - endPoint.y) < 0.00001;
        //         return matchesStart || matchesEnd;
        //     });
        // }
    }

    clearRenderPoints() {
        super.clearRenderPoints();
        this.centerPoints = [];
    }


}
