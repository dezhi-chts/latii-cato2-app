import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export class Active extends BaseOperation {
  constructor(params: IOperationParams) {
    super({
      ...params,
      type: OperationType.ACTIVE
    });
    
  }
} 