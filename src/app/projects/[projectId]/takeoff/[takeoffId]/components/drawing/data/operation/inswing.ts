import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export class Inswing extends BaseOperation {
  constructor(params: IOperationParams) {
    super({
      ...params,
      type: OperationType.INSWING
    });
    
  }
} 