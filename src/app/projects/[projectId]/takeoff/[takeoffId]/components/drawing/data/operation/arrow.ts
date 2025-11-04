import { BaseData } from "../baseData";
import { IVirtualFrame } from "../../datas";
import { BaseOperation } from "./baseOperation";

export class ArrowData extends BaseOperation {
  constructor(params: { id: string; virtualFrame: IVirtualFrame } & any) {
    super(params.virtualFrame);
    this.id = params.id;
    this.type = params.type;
    // this.direction = params.direction;
  }
}
