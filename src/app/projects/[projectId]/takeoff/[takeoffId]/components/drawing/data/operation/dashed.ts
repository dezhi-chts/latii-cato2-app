import { BaseOperation, IOperationParams } from "./baseOperation";

export interface IDashedParams extends IOperationParams {
    direction?: 'h' | 'v';
}

export class Dashed extends BaseOperation {
    direction: 'h' | 'v';

    constructor(params: IDashedParams) {
        super({
            ...params,
            type: params.type
        });
        this.direction = params.direction || 'h';
        this.style.color.border = '#666';
    }

    getPath(): { path: string; strokeDasharray: string } {
        const { width, height } = this.virtualFrame;
        let path = '';

        if (this.direction === 'h') {
            // 水平虚线
            const y = height / 2;
            path = `M0,0 L${width},0`;
        } else {
            // 垂直虚线
            const x = width / 2;
            path = `M0,0 L0,${height}`;
        }

        return {
            path,
            strokeDasharray: '5,5'
        };
    }
} 