import {ILine, IPointPostion, OperationType} from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export class Glasses extends BaseOperation {
    lines: Array<ILine> = []
    points: IPointPostion[] = []

    constructor(params: IOperationParams) {
        super({
            ...params,
            type: OperationType.Glasses
        });
        this.style.color.fill = 'rgba(173, 216, 230, 0.5)'
        this.style.color.border = '#666'
    }

    updatePoints(points: IPointPostion[]) {
        if (!points || points.length < 3) {
            console.warn("Not enough points to form a glass area");
            return;
        }
        
        this.points = points;
        console.log(points);
        
        this.updateDimensions();
    }
    
    /**
     * Calculate and update virtual frame dimensions and positions based on point data
     */
    private updateDimensions() {
        if (!this.points || this.points.length === 0) {
            return;
        }
        
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;
        
        this.points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        console.log(width, height);
        this.update({
            x: minX,
            y: minY,
            width: width,
            height: height
        });
        
        console.log(`Updated glass dimensions: ${width}x${height} at (${minX}, ${minY})`);
    }
    
    /**
     * 当玻璃区域移动时，需要同步移动所有点
     */
    move(dx: number, dy: number) {
        super.move(dx, dy);

        // 同步移动所有点
        if (this.points && this.points.length > 0) {
            this.points = this.points.map(point => ({
                x: point.x + dx,
                y: point.y + dy
            }));
        }
    }
}