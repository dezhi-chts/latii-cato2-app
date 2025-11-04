import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export class Outswing extends BaseOperation {
  constructor(params: IOperationParams) {
    super({
      ...params,
      type: OperationType.OUTSWING
    });
    
  }
} 