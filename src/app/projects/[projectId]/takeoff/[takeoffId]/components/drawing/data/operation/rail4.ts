import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export interface IRail4Params extends IOperationParams {
  // 四轨道特定参数
}

export class Rail4 extends BaseOperation {
  constructor(params: IRail4Params) {
    super({
      ...params,
      type: OperationType.RAIL_4
    });
    
  }
} 