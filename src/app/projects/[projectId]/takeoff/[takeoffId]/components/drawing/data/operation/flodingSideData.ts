import { BaseOperation, IOperationParams } from "./baseOperation";

export class FlodingSideData extends BaseOperation {
    constructor(params: IOperationParams) {
        super({
            ...params,
        });

    }
}