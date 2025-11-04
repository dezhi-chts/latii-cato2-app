import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export class PocketWall extends BaseOperation {
  constructor(params: IOperationParams) {
    super({
      ...params,
      type: OperationType.POCKET_WALL
    });
    
  }
} 