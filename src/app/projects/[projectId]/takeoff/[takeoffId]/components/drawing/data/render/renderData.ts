import { BaseData } from "../baseData";
import { IPointPostion, ISegment } from "../../datas";
import { ILine } from "@/app/demo/components/drawing/data";

export class RenderData extends BaseData {
  points: IPointPostion[] = [];
  lines: ISegment[] = [];
  renderSettings: any = {};
  renderType: string = "";

  constructor(id: string, params: any, renderType: string) {
    super({
      id: id,
      ...params,
    });
    this.type = "render";
    this.renderType = renderType;
  }

  updateInfo(
    points: IPointPostion[],
    segments: Array<ISegment>,
    fillColor: string
  ) {
    this.points = points;
    this.lines = segments;
    this.style.color.fill = fillColor;
    this.updateDimensions();
    return this;
  }

  // private updateDimensions() {
  //     if (!this.points || this.points.length === 0) {
  //         return;
  //     }
  //
  //     let minX = Number.MAX_VALUE;
  //     let minY = Number.MAX_VALUE;
  //     let maxX = Number.MIN_VALUE;
  //     let maxY = Number.MIN_VALUE;
  //
  //     this.points.forEach(point => {
  //         minX = Math.min(minX, point.x);
  //         minY = Math.min(minY, point.y);
  //         maxX = Math.max(maxX, point.x);
  //         maxY = Math.max(maxY, point.y);
  //     });
  //
  //     const width = maxX - minX;
  //     const height = maxY - minY;
  //     this.update({
  //         x: minX,
  //         y: minY,
  //         width: width,
  //         height: height
  //     });
  //
  //     console.log(`Updated glass dimensions: ${width}x${height} at (${minX}, ${minY})`);
  // }

  private updateDimensions() {
    if (!this.points || this.points.length === 0) {
      return;
    }

    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    // 先检查所有点
    this.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    if (this.lines && this.lines.length > 0) {
      for (const segment of this.lines) {
        if (segment.start && segment.end) {
          minX = Math.min(minX, segment.start.x, segment.end.x);
          minY = Math.min(minY, segment.start.y, segment.end.y);
          maxX = Math.max(maxX, segment.start.x, segment.end.x);
          maxY = Math.max(maxY, segment.start.y, segment.end.y);
        }
        // if (segment.isArc && segment.center && segment.radius) {
        //
        //     const startAngle = Math.atan2(segment.start.y - segment.center.y, segment.start.x - segment.center.x);
        //     const endAngle = Math.atan2(segment.end.y - segment.center.y, segment.end.x - segment.center.x);
        //
        //     const isClockwise = segment.is_clockwise !== false;
        //
        //     const angles = [0, Math.PI/2, Math.PI, Math.PI*3/2]; // 0°, 90°, 180°, 270°
        //
        //     for (const angle of angles) {
        //         let angleInRange = false;
        //
        //         if (isClockwise) {
        //             if (startAngle > endAngle) {
        //                 angleInRange = angle <= startAngle && angle >= endAngle;
        //             } else {
        //                 angleInRange = angle <= startAngle || angle >= endAngle;
        //             }
        //         } else {
        //             if (startAngle < endAngle) {
        //                 angleInRange = angle >= startAngle && angle <= endAngle;
        //             } else {
        //                 angleInRange = angle >= startAngle || angle <= endAngle;
        //             }
        //         }
        //
        //         if (angleInRange) {
        //             const x = segment.center.x + segment.radius * Math.cos(angle);
        //             const y = segment.center.y + segment.radius * Math.sin(angle);
        //
        //             minX = Math.min(minX, x);
        //             minY = Math.min(minY, y);
        //             maxX = Math.max(maxX, x);
        //             maxY = Math.max(maxY, y);
        //         }
        //     }
        // }
        // if(segment.)
        // if (segment.isArc && segment.center && segment.radius && segment.sweep_angle == 180) {
        //     const startAngle = segment.start_angle !== undefined ? segment.start_angle :
        //         (segment.start ? Math.atan2(segment.start.y - segment.center.y, segment.start.x - segment.center.x) : 0);
        //
        //     const endAngle = segment.end_angle !== undefined ? segment.end_angle :
        //         (segment.end ? Math.atan2(segment.end.y - segment.center.y, segment.end.x - segment.center.x) : 0);
        //
        //     const keyAngles = [0, Math.PI/2, Math.PI, Math.PI*3/2]; // 0°, 90°, 180°, 270°
        //
        //     let angleInArc: (angle: number) => boolean;
        //
        //     if (segment.is_clockwise) {
        //         angleInArc = (angle: number): boolean => {
        //             const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        //             const normalizedStartAngle = ((startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        //             const normalizedEndAngle = ((endAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        //
        //             if (normalizedStartAngle >= normalizedEndAngle) {
        //                 return normalizedAngle <= normalizedStartAngle && normalizedAngle >= normalizedEndAngle;
        //             } else {
        //                 return normalizedAngle <= normalizedStartAngle || normalizedAngle >= normalizedEndAngle;
        //             }
        //         };
        //     } else {
        //         angleInArc = (angle: number): boolean => {
        //             const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        //             const normalizedStartAngle = ((startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        //             const normalizedEndAngle = ((endAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        //
        //             if (normalizedStartAngle <= normalizedEndAngle) {
        //                 return normalizedAngle >= normalizedStartAngle && normalizedAngle <= normalizedEndAngle;
        //             } else {
        //                 return normalizedAngle >= normalizedStartAngle || normalizedAngle <= normalizedEndAngle;
        //             }
        //         };
        //     }
        //
        //     for (const angle of keyAngles) {
        //         if (angleInArc(angle)) {
        //             const arcX = segment.center.x + segment.radius * Math.cos(angle);
        //             const arcY = segment.center.y + segment.radius * Math.sin(angle);
        //
        //             minX = Math.min(minX, arcX);
        //             minY = Math.min(minY, arcY);
        //             maxX = Math.max(maxX, arcX);
        //             maxY = Math.max(maxY, arcY);
        //         }
        //     }
        //
        //     const precision = 12;
        //     for (let i = 0; i <= precision; i++) {
        //         const angle = (i / precision) * 2 * Math.PI;
        //         if (angleInArc(angle)) {
        //             const arcX = segment.center.x + segment.radius * Math.cos(angle);
        //             const arcY = segment.center.y + segment.radius * Math.sin(angle);
        //
        //             minX = Math.min(minX, arcX);
        //             minY = Math.min(minY, arcY);
        //             maxX = Math.max(maxX, arcX);
        //             maxY = Math.max(maxY, arcY);
        //         }
        //     }
        // }
      }
    }

    const width = maxX - minX;
    const height = maxY - minY;
    this.update({
      x: minX,
      y: minY,
      width: width,
      height: height,
    });
  }

  move(dx: number, dy: number) {
    if (this.points) {
      this.points = this.points.map((point) => ({
        x: point.x + dx,
        y: point.y + dy,
      }));
    }

    if (this.lines) {
      this.lines = this.lines.map((segment) => {
        const movedSegment = {
          ...segment,
          start: {
            x: segment.start.x + dx,
            y: segment.start.y + dy,
          },
          end: {
            x: segment.end.x + dx,
            y: segment.end.y + dy,
          },
        };

        if (segment.isArc && segment.center) {
          movedSegment.center = {
            x: segment.center.x + dx,
            y: segment.center.y + dy,
          };
        }

        return movedSegment;
      });
    }
  }
}
