import { BaseFrame } from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/drawing/data/baseFrame";
import { Frame } from "./data/shape/frame";
import {
  RightSemiCircleWindow,
  TopSemiCircleWindow,
} from "./data/shape/semicircle";
import { TriangleWindow } from "./data/shape/triangle";
import { BaseOperation } from "./data/operation/baseOperation";
import { BaseData } from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/drawing/data/baseData";

export type TBaseFrameOutLine =
  | Frame
  | TopSemiCircleWindow
  | RightSemiCircleWindow
  | TriangleWindow;
export type winType =
  | "frame"
  | "midting"
  | "operableSash"
  | "slidingSash"
  | "multipOperableSash"
  | "pivotSash"
  | "slideCornerWindow"
  | "foldingCornerWindow"
  | "";
export interface INewRectangle {
  x: number;
  y: number;
  x2: number;
  y2: number;
}
export interface ICircle {
  cx?: number;
  cy?: number;
  r: number;
}

export interface ISashConfig {
  type: "parallel" | "overlap-left" | "overlap-right";
  ratio: number;
}

export interface IZone {
  points: IPointPostion[];
  label: number;
  area: number;
  centroid: number[];
  segments: Array<ISegment>;
  color?: string;
  border?: any;
  show_id?: number;
  sashConfigs?: ISashConfig[];
  sashPositions: any[];
  operations?: BaseOperation[];
  dividers?: Array<
    BaseData & {
      length: number;
      start_point: any;
      end_point: any;
    } & any
  >;
  elementId?: string;
  is_clockwise?: boolean;
  lines?: ISegment[];
  inner?: {
    points: IPointPostion[];
    segments: ISegment[];
  };
}
export interface ISegment {
  id: string;
  start: IPointPostion;
  end: IPointPostion;
  isArc?: boolean;
  center?: IPointPostion;
  radius?: number;
  weight?: number;
  is_clockwise?: any;
  start_angle?: any;
  end_angle?: any;
  middle_point?: any;
}
export interface IPointPostion {
  x: number;
  y: number;
}

interface IVirtualFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}
export type LineSegment = {
  startPoint: IPointPostion;
  endPoint: IPointPostion;
};
export interface OverlapLineInfo {
  element: BaseFrame;
  lineIndex: number;
}
// type ElementType = 'frame' | 'cornerWindow' | 'foldingCornerWindow' | 'none';
export type ChangeType = "divider" | "change";
//
//  interface IElement {
//     id: string;
//     type: ElementType;
//     x: number;
//     y: number;
//     width: number;
//     height: number;
// }

export interface WinDrawerContentProps {
  initialData?: Array<IElementWrapper>;
  onDrop?: (data: any) => void;
  loading?: () => void;
  onChange?: (data: Array<IElementWrapper> | any, type: ChangeType) => void;
  onSelectChange?: (elements: any[]) => void;
  getGroupZones?: (value: any) => void;
  onChangeUnit?: (value: any[]) => void;
  from?: "quote" | "design";
}

export interface IImageData {
  dataURL?: string;
  width?: number;
  height?: number;
}

export type ElementData = Frame;
// | SlideCornerWindow | FoldingCornerWindow

export interface IElementWrapper {
  id: string;
  line?: number;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  category: number;
  type: number;
  open?: string;
  elementData?: string;
  element: ElementData;
  isMerged?: boolean;
}

export interface IMergableElement extends IElementWrapper {
  // mergeId?: string;
  element: Frame;
  originalElements?: IElementWrapper[];
}

export interface StageDrag {
  isDragging: boolean;
  lastX: number;
  lastY: number;
  stageX?: number;
  stageY?: number;
}

export enum ShapeType {
  Rectangle = "Rectangle",
  LineH = "Line-h",
  LineV = "Line-v",
  ArchH = "Arch-h",
  ArchV = "Arch-v",
  Triangle = "Triangle",
  Group = "Group",
}

export const frameShapes = [
  {
    type: ShapeType.ArchH,
    value: "",
    name: "Arch",
    path: "M 0,75 A 50,50 0 0,1 100,75 L 0,75 Z",
  },
  {
    type: ShapeType.ArchV,
    value: "",
    name: "Side Arch",
    path: "M 25,0 A 50,50 0 0,1 25,100 L 25,0 Z",
  },
  {
    type: ShapeType.Rectangle,
    value: "",
    name: "Rectangle",
    path: "M 10,10 L 90,10 L 90,90 L 10,90 Z",
  },
  {
    type: ShapeType.Triangle,
    value: "",
    name: "Triangle",
    path: "M 50,25 L 100,75 L 0,75 Z",
  },
  {
    type: ShapeType.LineH,
    value: "",
    name: "Horizontal Line",
    path: "M 0,50 L 100,50",
  },
  {
    type: ShapeType.LineV,
    value: "",
    name: "Vertical Line",
    path: "M 50,0 L 50,100",
  },
];

export interface IFrameShape {
  type: ShapeType;
  value: string;
  name: string;
  path: string;
}

export enum OperationType {
  Fixed_W = "fixed_w",
  Fixed_D = "fixed_d",
  ARROW_LEFT = "arrow-left",
  ARROW_RIGHT = "arrow-right",
  ARROW_UP = "arrow-up",
  ARROW_DOWN = "arrow-down",
  ARROW_LR = "arrow-lr",
  ARROW_TD = "arrow-td",
  MOTO_LEFT = "moto-left",
  MOTO_RIGHT = "moto-right",
  MOTO_UP = "moto-up",
  MOTO_DOWN = "moto-down",
  MOTO_LR = "moto-lr",
  MOTO_TD = "moto-td",
  Folding_LEFT = "folding-left",
  Folding_RIGHT = "folding-right",
  Folding_UP = "folding-up",
  Folding_DOWN = "folding-down",
  Folding_LR = "folding-lr",
  Folding_TD = "folding-td",
  ANGLE_LEFT = "angle-left",
  ANGLE_RIGHT = "angle-right",
  ANGLE_UP = "angle-up",
  ANGLE_DOWN = "angle-down",
  DashedLineH = "dashedLine-h",
  DashedLineV = "dashedLine-v",
  Angle = "Angle",
  Arrow = "Arrow",
  Dimension = "Dimension",
  HARDWARE_HL = "hardware-hl",
  HARDWARE_HR = "hardware-hr",
  HARDWARE_V = "hardware-v",
  MOTORIZED = "motorized",
  POCKET_WALL = "pocket-wall",
  FOLDING = "folding",
  PIVOT_V = "pivot-v",
  PIVOT_H = "pivot-h",
  RAIL_2 = "rail-2",
  RAIL_4 = "rail-4",
  ACTIVE = "active",
  INSWING = "inswing",
  OUTSWING = "outswing",
  PASSIVE = "passive",
  Glasses = "glasses",
}

export const CanSizeChangeOperationType = [
  OperationType.ANGLE_LEFT,
  OperationType.ANGLE_RIGHT,
  OperationType.ANGLE_DOWN,
  OperationType.ANGLE_UP,
  OperationType.DashedLineV,
  OperationType.DashedLineH,
  OperationType.POCKET_WALL,
  OperationType.Glasses,
];

export enum SashType {
  PARALLEL = "parallel",
  OVERLAP_LEFT = "overlap-left",
  OVERLAP_RIGHT = "overlap-right",
}

export const sashes = [
  {
    type: `${SashType.PARALLEL}-1`,
    value: "",
    name: "Parallel 1",
    path: "M 30,10 L 80,10 L 80,90 L 30,90 Z",
  },
  {
    type: `${SashType.PARALLEL}-2`,
    value: "",
    name: "Parallel 2",
    path: "M 5,10 L 45,10 L 45,90 L 5,90 Z M 55,10 L 95,10 L 95,90 L 55,90 Z",
  },
  {
    type: `${SashType.PARALLEL}-3`,
    value: "",
    name: "Parallel 3",
    path: "M 3,10 L 31,10 L 31,90 L 3,90 Z M 36,10 L 64,10 L 64,90 L 36,90 Z M 69,10 L 97,10 L 97,90 L 69,90 Z",
  },
  {
    type: `${SashType.OVERLAP_RIGHT}-2`,
    value: "",
    name: "Overlap Right 2",
    path: `
            M 55,10 L 95,10 L 95,90 L 55,90 Z
            M 15,20 L 60,20 L 60,80 L 15,80 Z
        `,
  },
  {
    type: `${SashType.OVERLAP_RIGHT}-3`,
    value: "",
    name: "Overlap Right 3",
    path: `
            M 60,10 L 95,10 L 95,90 L 60,90 Z
            M 30,20 L 65,20 L 65,80 L 30,80 Z
            M 5,30 L 35,30 L 35,70 L 5,70 Z
        `,
  },
  {
    type: `${SashType.OVERLAP_LEFT}-2`,
    value: "",
    name: "Overlap Left 2",
    path: `
            M 5,10 L 45,10 L 45,90 L 5,90 Z
            M 40,20 L 85,20 L 85,80 L 40,80 Z
        `,
  },
  {
    type: `${SashType.OVERLAP_LEFT}-3`,
    value: "",
    name: "Overlap Left 3",
    path: `
            M 5,10 L 40,10 L 40,90 L 5,90 Z
            M 35,20 L 70,20 L 70,80 L 35,80 Z
            M 65,30 L 95,30 L 95,70 L 65,70 Z
        `,
  },
];

export const operationShapes = [
  // {
  //     type: OperationType.ARROW_LEFT,
  //     value: '',
  //     name: 'Arrow-L',
  //     url: '/assets/icons/drawing/Arrow one side.svg',
  //     svgTransform: 'rotate(0)',
  //     path: ''
  // },
  // {
  //     type: OperationType.ARROW_RIGHT,
  //     value: '',
  //     name: 'Arrow-R',
  //     url: '/assets/icons/drawing/Arrow one side.svg',
  //     svgTransform: 'rotate(180deg)',
  //     path: ''
  // },
  // {
  //     type: OperationType.ARROW_UP,
  //     value: '',
  //     name: 'Arrow-T',
  //     url: '/assets/icons/drawing/Arrow one side.svg',
  //     svgTransform: 'rotate(270deg)',
  //     path: ''
  // },
  // {
  //     type: OperationType.ARROW_DOWN,
  //     value: '',
  //     name: 'Arrow-B',
  //     url: '/assets/icons/drawing/Arrow one side.svg',
  //     svgTransform: 'rotate(90deg)',
  //     path: ''
  // },
  {
    type: OperationType.ARROW_LR,
    value: "",
    name: "Arrow-LR",
    url: "/assets/icons/drawing/Arrow two sides.svg",
    path: "",
  },
  {
    type: OperationType.ARROW_TD,
    value: "",
    name: "Arrow-TD",
    url: "/assets/icons/drawing/Arrow two sides.svg",
    path: "",
    svgTransform: "rotate(90deg)",
  },
  {
    type: OperationType.ANGLE_LEFT,
    value: "",
    name: "Hinge-L",
    style: "dashed",
    path: "M 70,20 L 30,50 L 70,80",
  },
  {
    type: OperationType.ANGLE_RIGHT,
    value: "",
    name: "Hinge-R",
    style: "dashed",
    path: "M 30,20 L 70,50 L 30,80",
  },
  {
    type: OperationType.ANGLE_UP,
    value: "",
    name: "Hinge-T",
    style: "dashed",
    path: "M 20,70 L 50,30 L 80,70",
  },
  {
    type: OperationType.ANGLE_DOWN,
    value: "",
    name: "Hinge-B",
    style: "dashed",
    path: "M 20,30 L 50,70 L 80,30",
  },
  {
    type: OperationType.DashedLineH,
    value: "",
    name: "Line-H",
    style: "dashed",
    path: "M 0,50 L 100,50",
  },
  {
    type: OperationType.DashedLineV,
    value: "",
    name: "Line-V",
    style: "dashed",
    path: "M 50,0 L 50,100",
  },
  {
    type: OperationType.PIVOT_V,
    value: "",
    name: "Pivot-V",
    url: "/assets/icons/drawing/Vertical Pivot-114.svg",
    path: "",
  },
  {
    type: OperationType.PIVOT_H,
    value: "",
    name: "Pivot-H",
    url: "/assets/icons/drawing/Horizontal Pivot-115.svg",
    path: "",
  },
  {
    type: OperationType.RAIL_2,
    value: "",
    name: "2 Rail",
    url: "/assets/icons/drawing/2 Rail.svg",
    path: "",
  },
  {
    type: OperationType.RAIL_4,
    value: "",
    name: "4 Rail",
    url: "/assets/icons/drawing/4 Rail.svg",
    path: "",
  },
  {
    type: OperationType.ACTIVE,
    value: "",
    name: "Active",
    url: "/assets/icons/drawing/-_Active.svg",
    path: "",
  },
  {
    type: OperationType.INSWING,
    value: "",
    name: "Inswing",
    url: "/assets/icons/drawing/-_Inswing.svg",
    path: "",
  },
  {
    type: OperationType.OUTSWING,
    value: "",
    name: "Outswing",
    url: "/assets/icons/drawing/-_Outswing.svg",
    path: "",
  },
  {
    type: OperationType.PASSIVE,
    value: "",
    name: "Passive",
    url: "/assets/icons/drawing/-_Passive.svg",
    path: "",
  },
  {
    type: OperationType.POCKET_WALL,
    value: "",
    name: "Wall",
    url: "/assets/icons/drawing/Sliding Pocket Wall.svg",
    path: "",
  },
  {
    type: OperationType.MOTORIZED,
    value: "",
    name: "Motorized",
    url: "/assets/icons/drawing/Motorized Badge.svg",
    path: "",
  },
  {
    type: OperationType.MOTO_LR,
    value: "",
    name: "Moto-LR",
    url: "/assets/icons/drawing/Two Side [MOTORIZED].svg",
    path: "",
  },
  {
    type: OperationType.MOTO_TD,
    value: "",
    name: "Moto-TD",
    url: "/assets/icons/drawing/Two Side [MOTORIZED].svg",
    path: "",
    svgTransform: "rotate(90deg)",
  },
  {
    type: OperationType.FOLDING,
    value: "",
    name: "Folding",
    url: "/assets/icons/drawing/Folding.svg",
    path: "",
  },
  {
    type: OperationType.Folding_LEFT,
    value: "",
    name: "Folding-L",
    url: "/assets/icons/drawing/One side Arrow - Folding.svg",
    svgTransform: "rotate(0)",
    path: "",
  },
  {
    type: OperationType.Folding_RIGHT,
    value: "",
    name: "Folding-R",
    url: "/assets/icons/drawing/One side Arrow - Folding.svg",
    svgTransform: "rotate(180deg)",
    path: "",
  },
  {
    type: OperationType.HARDWARE_HL,
    value: "",
    name: "Hardware-HL",
    url: "/assets/icons/drawing/Hardware [Swing].svg",
    path: "",
  },
  {
    type: OperationType.HARDWARE_HR,
    value: "",
    name: "Hardware-HR",
    url: "/assets/icons/drawing/Hardware [Swing].svg",
    path: "",
    svgTransform: "rotate(180deg)",
  },
  {
    type: OperationType.HARDWARE_V,
    value: "",
    name: "Hardware-V",
    url: "/assets/icons/drawing/verical handle.svg",
    path: "",
  },
  {
    type: OperationType.Fixed_W,
    value: "",
    name: "Fixed-Window",
    url: "",
    style: "dashed",
    path: "M 0,50 L 100,50 M 50,0 L 50,100",
  },
  {
    type: OperationType.Fixed_D,
    value: "",
    name: "Fixed-Door",
    style: "dashed",
    url: "",
    path: "M 0,50 L 100,50 M 50,0 L 50,100",
  },
];

export enum DividerType {
  SDL_H = "sdl-h",
  SDL_V = "sdl-v",
  TDL_H = "tdl-h",
  TDL_V = "tdl-v",
}

export enum DividerType2 {
  SDL_H = "SDL-h",
  SDL_V = "SDL-v",
  TDL_H = "TDL-h",
  TDL_V = "TDL-v",
}
