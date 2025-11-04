import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export interface IRail2Params extends IOperationParams {
  // 双轨道特定参数
}

export class Rail2 extends BaseOperation {
  constructor(params: IRail2Params) {
    super({
      ...params,
      type: OperationType.RAIL_2
    });
    
  }
} 