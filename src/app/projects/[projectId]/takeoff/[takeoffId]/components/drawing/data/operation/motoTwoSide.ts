import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export class MotoTwoSide extends BaseOperation {
  constructor(params: IOperationParams) {
    super({
      ...params,
      type: OperationType.MOTO_TWO_SIDE
    });
    
  }
} 