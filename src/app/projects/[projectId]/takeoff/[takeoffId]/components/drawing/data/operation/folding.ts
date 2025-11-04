import { BaseData } from "../baseData";
import { BaseOperation, IOperationParams } from "./baseOperation";
import { OperationType } from "../../datas";

export interface FoldingOptions {
  id: string;
  virtualFrame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface IFoldingParams extends IOperationParams {

}

export class FoldingData extends BaseData {
  type: string = 'folding';

  constructor(options: FoldingOptions) {
    super(options);
  }

  scale(sx: number, sy: number, center?: IPointPostion) {
    if (center) {
      this.virtualFrame.x = center.x - (center.x - this.virtualFrame.x) * sx;
      this.virtualFrame.y = center.y - (center.y - this.virtualFrame.y) * sy;
    }
    this.virtualFrame.width *= sx;
    this.virtualFrame.height *= sy;
  }
}

export class Folding extends BaseOperation {
  constructor(params: IFoldingParams) {
    super({
      ...params,
      type: OperationType.FOLDING
    });
    
  }
}