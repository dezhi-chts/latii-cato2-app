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

/** 框所代表的label类型 */
export enum GroupType {
  OCR = "OCR", // ocr框
  Label = "Label", // label框
  Item = "Item", // 项目项框
  Table = "Table",
  TitleInfo = "Title Info", // 标题信息框
  DrawingIndex = "Drawing Index", // 绘图索引框
}

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
}

//pdf viewport
export interface ViewPort {
  width: number;
  height: number;
  scale: number;
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

// 文件状态
export enum FileStatus {
  Uploaded = "Uploaded",
  Completed = "Completed",
  Processing = "Processing",
  Unknown = "Unknown",
}

//pdf wrapper props
export interface PdfWrapperProps {
  mode?: string; //模式， full(全屏) half(半屏)
  operationMode: "edit" | "view"; //操作模式， edit(编辑) view(查看)
  project_id: number | string;
  project_file_id: number;
  pdfUrl: string;
  page: number;
  zoom: number;
  allEvidence: EvidenceType[]; //当前文件所有的evidence
  typeList?: any[]; //当前文件所有的type
  selectedEvidenceIds?: number[]; //当前选中的evidence ids
  showEvidenceType?: boolean; //是否显示evidence type
  onRefreshEvidence?: () => void;
  resetAdding?: () => void;
  onTotalPages?: (total: number) => void; //获取总页数
  onAppendEvidence?: (evidenceList: EvidenceType[]) => void; // 提交成功后，将新生成的evidece添加到allEvidence，进行增量刷新
  onDeleteEvidence?: (evidenceIds: number[]) => void; // 删除evidence后，刷新evidence列表，进行增量刷新
  onUpdateEvidence?: (evidenceList: EvidenceType[]) => void; // 更新evidence后，刷新evidence列表，进行增量刷新
  onCropSectionsCount?: (count: number) => void; // 截图区域数量变化时，通知父组件
  onUpdateSafeZoom?: (zoom: number) => void; // 更新安全缩放比例
  onSuccessOCRText?: (text: string) => void; // OCR识别成功后，通知父组件
}

export interface PdfWrapperRefMethods {
  resetAllInfo: () => void; //重置所有信息
  getPageAmount: () => number; //获取总页数
  addingRect: (rect: { type: string; isSaveEvidence?: boolean }) => void; //添加矩形框
  rotatePDF: () => void; //旋转PDF
  clearCropSections: () => void; //清除所有裁剪区域
  handleBatchSubmit: () => void; //批量提交
  handleBatchDelete: () => void; //批量删除
  checkAndHandleUnsavedCrops?: () => Promise<boolean>; //检查并处理未保存的裁剪区域
}
