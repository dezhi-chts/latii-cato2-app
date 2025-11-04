import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export class Passive extends BaseOperation {
  constructor(params: IOperationParams) {
    super({
      ...params,
      type: OperationType.PASSIVE
    });
    
  }
} 