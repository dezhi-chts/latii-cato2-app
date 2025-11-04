import { BaseOperation, IOperationParams } from "./baseOperation";

export class MotoSideData extends BaseOperation {
  constructor(params: IOperationParams) {
    super({
      ...params,
    });
    
  }
} 