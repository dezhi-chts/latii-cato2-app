import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export interface IPivotVParams extends IOperationParams {
  // 垂直轴心特定参数
}

export class PivotV extends BaseOperation {
  constructor(params: IPivotVParams) {
    super({
      ...params,
      type: OperationType.PIVOT_V
    });
    
  }
} 