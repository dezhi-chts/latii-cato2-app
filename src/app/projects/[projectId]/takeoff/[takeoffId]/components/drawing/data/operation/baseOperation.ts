import { BaseData } from "../baseData";

export interface IOperationParams {
  id: string;
  type: string;
  virtualFrame?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    color?: {
      fill?: string;
      border?: string;
    };
  };
  lineWidth?: number;
  svgUrl?: string;
  svgTransform?: string;
}

export class BaseOperation extends BaseData {
  constructor(params: IOperationParams) {
    super({
      ...params.virtualFrame,
      ...params,
    });
    this.type = params.type || "";
  }

  update(params: any, init?: boolean) {
    super.update(params, init);
  }
}
