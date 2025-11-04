import { BaseOperation, IOperationParams } from "./baseOperation";

export class Hardware extends BaseOperation {
  constructor(params: IOperationParams) {
    super({
      ...params,
      type: params.type
    });
    
  }
} 