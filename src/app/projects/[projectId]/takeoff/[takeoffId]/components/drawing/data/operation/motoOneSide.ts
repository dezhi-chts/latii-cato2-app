import { OperationType } from "../../datas";
import { BaseOperation, IOperationParams } from "./baseOperation";

export interface IMotoOneSideParams extends IOperationParams {
  direction?: 'left' | 'right' | 'up' | 'down';
}

export class MotoOneSide extends BaseOperation {
  direction: 'left' | 'right' | 'up' | 'down' = 'right';
  
  constructor(params: IMotoOneSideParams) {
    super({
      ...params,
      type: OperationType.MOTO_ONE_SIDE
    });
    

    if (params.direction) {
      this.direction = params.direction;
    }
  }
  
  update(params: any, init?: boolean) {
    super.update(params, init);
    
    if (params.direction) {
      this.direction = params.direction;
    }
  }
} 