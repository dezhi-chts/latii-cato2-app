//type结构
export interface TypeItem {
  id: number;
  name: string;
  description: string;
}

//坐标点
export type Point = { x: number; y: number };
//多边形拖拽点
export type CirclePoint = { type: string; x: number; y: number };

//矩形/多边形框的边界
export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

/** 形状类型 */
export enum GroupShapeType {
  Rectangle = "rectangle",
  Polygon = "polygon",
}

// 页面类型
export enum PageType {
  ActivePages = "Active Pages",
  FloorPlan = "Floor Plan",
  Elevation = "Elevation",
  Schedule = "Schedule",
  KeyNotes = "Key Notes",
  Mix = "Mix",
  NotUsed = "Not Used",
  All = "All",
  Unknown = "Unknown",
  Item = "Item",
  Information = "Information",
  Description = "Description",
}

/** 框所代表的label类型 */
export enum GroupType {
  OCR = "OCR", // OCR框
  Label = "Label", // Label框

  TitleInfo = "Title Info", // 标题信息框
  DrawingIndex = "Drawing Index", // 绘图索引框

  Item = "Item", // 项目项框
  LayerInfo = "Information", // 图层信息框
  Description = "Description", // 描述框
  WindowDoorUnitList = "window_door_unit_list", // 窗门单元列表框

  FloorPlan = PageType.FloorPlan, // 平面框
  Elevation = PageType.Elevation, // 立面框
  WindowDoorUnit = "Window Door Unit", // 窗口门单元框
  Table = "Table", // 表格框
  KeyNotes = PageType.KeyNotes, // 注释框
}

export enum itemBoxType {
  FloorPlanItem = "Floor Plan Item",
  ElevationItem = "Elevation Item",
  WindowDoorUnitItem = "Window Door Unit Item",
  TableItem = "Table Item",
  WindowDoorUnitListItem = "window Door Unit list Item",
}

// 所有页面类型, 包含所有页面类型和图标
export const allPageTypes = {
  [PageType.ActivePages]: {
    type: PageType.ActivePages,
    color: "#717171",
  },
  [PageType.FloorPlan]: {
    type: PageType.FloorPlan,
    icon: "F",
    color: "#D868D8",
  },
  [PageType.Elevation]: {
    type: PageType.Elevation,
    icon: "E",
    color: "#0BC6BE",
  },
  [PageType.Schedule]: {
    type: PageType.Schedule,
    icon: "S",
    color: "#5859D6",
  },
  [PageType.KeyNotes]: {
    type: PageType.KeyNotes,
    icon: "K",
    color: "#00798A",
  },
  [PageType.Mix]: {
    type: PageType.Mix,
    icon: "M",
    color: "#F5C00B",
  },
  [PageType.NotUsed]: {
    type: PageType.NotUsed,
    icon: "N",
    color: "#A3A3A3",
  },
  [PageType.All]: {
    type: PageType.All,
    color: "#717171",
  },
  [PageType.Item]: {
    type: PageType.Item,
    icon: "I",
    color: "#427CCE",
  },
  [PageType.Information]: {
    type: PageType.Information,
    icon: "L",
    color: "#008080",
  },
  [PageType.Description]: {
    type: PageType.Description,
    icon: "D",
    color: "#2A5773",
  },
  [PageType.Unknown]: {
    type: PageType.Unknown,
    icon: "N",
    color: "#A3A3A3",
  },
  [GroupType.WindowDoorUnit]: {
    type: GroupType.WindowDoorUnit,
    icon: "W",
    color: "#5859D6",
  },
  [GroupType.Table]: {
    type: GroupType.Table,
    icon: "T",
    color: "#9400D3",
  },
};
// identification-index summary页面类型
export const ArchDrawingSummaryPageTypes = [
  allPageTypes[PageType.FloorPlan],
  allPageTypes[PageType.Elevation],
  allPageTypes[PageType.Schedule],
  allPageTypes[PageType.KeyNotes],
  allPageTypes[PageType.Mix],
  // allPageTypes[PageType.Unknown],
];

// identification 所有标签类型
export const ArchDrawingAllPageTags = [
  allPageTypes[PageType.ActivePages],
  allPageTypes[PageType.FloorPlan],
  allPageTypes[PageType.Elevation],
  allPageTypes[PageType.Schedule],
  allPageTypes[PageType.KeyNotes],
  allPageTypes[PageType.Mix],
  allPageTypes[PageType.NotUsed],
  allPageTypes[PageType.All],
];

// identification Arch Drawing文件 页面下拉类型
export const ArchDrawingPageTypes = [
  allPageTypes[PageType.FloorPlan],
  allPageTypes[PageType.Elevation],
  allPageTypes[PageType.Schedule],
  allPageTypes[PageType.KeyNotes],
  allPageTypes[PageType.Mix],
  allPageTypes[PageType.NotUsed],
];

export const ArchDrawingLabelTypes = [
  allPageTypes[PageType.FloorPlan],
  allPageTypes[PageType.Elevation],
  {
    ...allPageTypes[PageType.Schedule],
    children: [
      allPageTypes[GroupType.WindowDoorUnit],
      allPageTypes[GroupType.Table],
    ],
  },
  allPageTypes[PageType.KeyNotes],
];

export const ArchDrawingItemLabelTypes = [
  {
    type: itemBoxType.WindowDoorUnitItem,
    icon: "W",
    color: "#5859D6",
  },
  {
    type: itemBoxType.TableItem,
    icon: "T",
    color: "#9400D3",
  },
];

// identification Quote文件 页面下拉类型
export const QuotePageTypes = [
  allPageTypes[PageType.Item],
  allPageTypes[PageType.Information],
  allPageTypes[PageType.Description],
  allPageTypes[PageType.Mix],
  allPageTypes[PageType.NotUsed],
];

//矩形/多边形框
export interface GroupFrame {
  id: string;
  type: GroupType;
  shapeType: GroupShapeType;
  polygons: Point[];
  pdfPolygons: Point[]; //多边形的pdf坐标
  completed: boolean; //绘制是否已经完成
  types?: TypeItem[]; //所选择的type类型
  bounds: Bounds; //边界
  isParentEvidence?: boolean; //是否是父evidence
}

//evidence结构
export interface EvidenceType {
  id: number;
  project_job_id: number;
  project_id: number; //项目ID
  project_file_id: number; //文件ID
  project_file_name: string; //文件名称
  project_file_page_number: number; //截图所在文件页码
  polygon: string; //多边形pdf坐标集合
  sub_text: string; //OCR识别的文本
  is_manual: boolean;
  device_pixel_ratio: number; //设备像素比
  type: string;
  file: File; //截图文件
  file_key: string;
  scale: number; //缩放比例
  page_width_pdf: number; //pdf页面宽度
  page_height_pdf: number; //pdf页面高度

  evidence_url: string; //图片URL
  isParentEvidence?: boolean; //是否是父evidence
}

// 增，删，改 矩形框后返回的所有结构
export interface EvidenceResult {
  evidences: EvidenceType[]; //新增/更新的evidence
  deleted_count: number; // 删除的矩形框数量
  page_types: { page_number: number; page_type: string }[]; //页面分类结果
  deleteIds?: number[]; //删除的矩形框id
}

//pdf viewport
export interface ViewPort {
  width: number;
  height: number;
  scale: number;
  viewBox: number[];
  convertToViewportPoint: (x: number, y: number) => [number, number];
  convertToPdfPoint: (x: number, y: number) => [number, number];
  getTextContent: () => string;
}

//pdf 文本内容
export type TextContent = {
  items: {
    str: string;
    transform: number[];
    width: number;
    height: number;
  }[];
  styles: {
    [key: string]: string;
  };
};

// 文件列表信息
export interface FileItem {
  project_id: number;
  operation_type: string;
  file_key: string;
  file_type: string;
  file_name: string;
  file_url: string;
  create_time: string;
  update_time: string;
  update_user: string;
  create_user: string;
  id: number;
  project_file_id: number;
  total_pages: number;
}

export enum FileOperationType {
  ArchitectureDrawing = "Architecture_drawing",
  Quote = "Quote",
}

// 文件状态
export enum FileStatus {
  Uploaded = "Uploaded",
  Completed = "Completed",
  Processing = "Processing",
  NotApplicable = "Not Applicable",
}

//pdf wrapper props
export interface PdfWrapperProps {
  mode?: string; //模式， full(全屏) half(半屏)
  operationMode: "edit" | "view"; //操作模式， edit(编辑) view(查看)
  project_id: number | string;
  project_file_id: number;
  pdfUrl: string;
  pdfOperationType?: FileOperationType;
  page: number;
  zoom: number;
  allEvidence: EvidenceType[]; //当前文件所有的evidence
  typeList?: any[]; //当前文件所有框的全部类型
  selectedEvidenceIds?: number[]; //当前选中的evidence ids
  evidenceDraggable?: boolean; //是否可拖动evidence
  showAddBtnOnBox?: boolean; //是否在框上显示添加按钮
  onChangePage?: (page: number) => void; // 切换页码时，通知父组件
  onTotalPages?: (total: number) => void; //获取总页数
  onAppendEvidence?: (evidenceResult: EvidenceResult) => void; // 提交成功后，将新生成的evidece添加到allEvidence，进行增量刷新
  onDeleteEvidence?: (evidenceResult: EvidenceResult) => void; // 删除evidence后，刷新evidence列表，进行增量刷新
  onUpdateEvidence?: (evidenceResult: EvidenceResult) => void; // 更新evidence后，刷新evidence列表，进行增量刷新
  onCropSectionsCount?: (count: number) => void; // 截图区域数量变化时，通知父组件
  onUpdateSafeZoom?: (zoom: number) => void; // 更新安全缩放比例
  onSuccessOCRText?: (text: string) => void; // OCR识别成功后，通知父组件
  onItemEvidenceConfirm?: (evidenceInfo: any) => void; // 确认evidence item后，通知父组件
  onChangeSelectedEvidence?: (evidenceIds: number[]) => void; // 选中的evidence ids变化时，通知父组件
  onChangeZoom?: (zoom: number) => void; // 缩放比例变化时，通知父组件
  enableAreaSelection?: boolean; // 是否启用鼠标拖拽区域选择
  onAreaSelectionAction?: (params: {
    action: "edit" | "delete";
    evidenceIds: number[];
  }) => void; // 区域框选上的操作回调
}

export interface PdfWrapperRefMethods {
  resetAllInfo: () => void; //重置所有信息
  getPageAmount: () => number; //获取总页数
  addingRect: (rect: { type: string; isSaveEvidence?: boolean }) => void; //添加矩形框
  rotatePDF: () => void; //旋转PDF
  clearCropSections: () => void; //清除所有裁剪区域
  removeCropSectionByIds: (ids: string[]) => void; //根据id删除裁剪区域
  handleBatchSubmit: () => void; //批量提交
  handleBatchDelete: () => void; //批量删除
  checkAndHandleUnsavedCrops?: () => Promise<boolean>; //检查并处理未保存的裁剪区域
  getRevertCropSectionsData: () => any[]; // 获取转换成API body结构的裁剪区域数据
  clearAreaSelection: () => void; // 清理区域框选相关状态
}
