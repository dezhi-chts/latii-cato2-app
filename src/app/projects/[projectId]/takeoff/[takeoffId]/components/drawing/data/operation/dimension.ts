import {BaseData} from "../baseData";

interface DimensionPoint {
    id: string;
    x: number;
    y: number;
    type: string;
    elementId: string;
}

export class DimensionData extends BaseData {
    points: DimensionPoint[] = [];
    value: number = 0;
    offset: number = 30;
    direction!: 'horizontal' | 'vertical';
    canEdit: boolean = false;

    constructor(params: any, canEdit: boolean = false,) {
        super(params);
        this.type = 'Dimension';
        this.canEdit = canEdit;


        if (params.value != undefined) {
            this.value = params.value;
        }

        if (params.offset != undefined) {
            this.offset = params.offset;
        }

        if (params.direction) {
            this.direction = params.direction;
        }
        if (params.points && Array.isArray(params.points)) {
            this.points = [...params.points];
            this.determineDirection();
            this.calculateDimensions();
        }
    }

    determineDirection() {
        if (this.points.length !== 2) return;

        // If direction is already set manually, don't change it
        if (this.direction) return;

        const p1 = this.points[0];
        const p2 = this.points[1];

        const x1 = p1.x || p1.x;
        const y1 = p1.y || p1.y;
        const x2 = p2.x || p2.x;
        const y2 = p2.y || p2.y;

        this.direction = Math.abs(y2 - y1) < Math.abs(x2 - x1) ? 'horizontal' : 'vertical';
    }

    calculateDimensions() {
        if (this.points.length !== 2) return;

        const p1 = this.points[0];
        const p2 = this.points[1];

        const x1 = p1.x || (p1.x || 0);
        const y1 = p1.y || (p1.y || 0);
        const x2 = p2.x || (p2.x || 0);
        const y2 = p2.y || (p2.y || 0);

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        // 计算宽高
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);

        this.value = this.direction === 'horizontal' ? width : height;
        console.log(this.offset, 'offsetoffsetoffsetoffsetoffsetoffsetoffset')
        const data = {
            x: this.direction === 'horizontal' ? centerX : centerX - this.offset,
            y: this.direction === 'horizontal' ? centerY - this.offset : centerY,
            height,
            width,
        }
        this.update(data)
    }


    update(params: any) {
        super.update(params);
        // todo 概率更新问题
        if (params.points) {
            this.points = [...params.points];
            this.determineDirection();
            this.calculateDimensions();
        }

        if (params.value !== undefined) {
            this.value = params.value;
        }

        if (params.offset !== undefined) {
            this.offset = params.offset;
        }

        if (params.direction) {
            this.direction = params.direction;
        }
    }

    // 重写父类方法 - 根据方向限制移动
    move(dx: number, dy: number) {
        if (this.points && this.points.length === 2) {
            if (this.direction === 'horizontal') {
                this.offset -= dy;
                super.move(0, dy);
            } else if (this.direction === 'vertical') {
                this.offset -= dx;
                super.move(dx, 0);
            }
        }
    }

    // 获取中心点位置和尺寸
    getDimensionProps() {
        if (this.points.length !== 2) return null;

        const p1 = this.points[0];
        const p2 = this.points[1];

        const x1 = p1.x || p1.x;
        const y1 = p1.y || p1.y;
        const x2 = p2.x || p2.x;
        const y2 = p2.y || p2.y;

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);


        // todo offset

        return {
            data: this.virtualFrame,
            centerX,
            centerY,
            width,
            height,
            x1, y1, x2, y2,
            direction: this.direction,
            value: this.value
        };
    }

    render() {
        // 实际渲染由组件实现
        return null;
    }

    // Add toggle direction method
    toggleDirection() {
        if (this.direction === 'horizontal') {
            this.direction = 'vertical';
        } else {
            this.direction = 'horizontal';
        }
        this.calculateDimensions();
    }
} 