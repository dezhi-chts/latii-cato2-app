import { BaseOperation, IOperationParams } from "./baseOperation";

export class FixedData extends BaseOperation {
    constructor(params: IOperationParams) {
        super({
            ...params,
            type: params.type,
        });
    }

    getPath(): { path: string; strokeDasharray: string } {
        const { width, height } = this.virtualFrame;

        return {
            path: `M0,${height / 2} L${width},${height / 2}  M${width / 2},0 L${width / 2},${height}`,
            strokeDasharray: '5,5'
        };
    }

}