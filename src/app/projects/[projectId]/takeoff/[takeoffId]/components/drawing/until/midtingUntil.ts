import { Frame } from "../data/shape/frame";

class MidtingUntil {
  // 查找 Frame 下所有的 midting
  // findAllMidtings(frame: Frame): MidtingLine[] {
  //   const allMidtings: MidtingLine[] = [];
  //
  //   // 递归遍历区域树
  //   const traverseRegion = (region: RegionDivison) => {
  //     // 收集当前区域的 midtings
  //     if (region.midtings) {
  //       allMidtings.push(...region.midtings);
  //     }
  //
  //     // 递归遍历子区域
  //     if (region.regionDivisions) {
  //       region.regionDivisions.forEach(subRegion => {
  //         traverseRegion(subRegion);
  //       });
  //     }
  //   };
  //
  //   // 从 frame 的根区域开始遍历
  //   if (frame.regionDivision) {
  //     traverseRegion(frame.regionDivision);
  //   }
  //
  //   return allMidtings;
  // }
}

const midtingUntil = new MidtingUntil();
export default midtingUntil; 