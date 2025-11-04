import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export class Motorized extends BaseOperation {
  constructor(params: IOperationParams) {
    super({
      ...params,
      type: OperationType.MOTORIZED
    });
    
  }
} 