import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export interface IPivotHParams extends IOperationParams {
  // 水平轴心特定参数
}

export class PivotH extends BaseOperation {
  constructor(params: IPivotHParams) {
    super({
      ...params,
      type: OperationType.PIVOT_H
    });
    
  }
} 