//type结构
export interface TypeItem {
    id: number;
    name: string;
    description: string;
}

//坐标点
export type Point = { x: number; y: number };
//多边形拖拽点
export type CirclePoint = { type: string, x: number; y: number };

//矩形/多边形框
export interface GroupFrame {
    id: string;
    type: string,           //rect | polygon
    polygons: Point[];
    pdfPolygons: Point[];   //多边形的pdf坐标
    completed: boolean;     //绘制是否已经完成
    types?: TypeItem[];      //所选择的type类型
}

//evidence结构
export interface EvidenceType {
    id: number,
    project_job_id: number,
    project_id:  number,                //项目ID
    project_file_id: number,            //文件ID
    project_file_name: string,          //文件名称
    project_file_page_number: number,   //截图所在文件页码
    polygon: string,                    //多边形pdf坐标集合
    sub_text: string,                   //OCR识别的文本
    is_manual: boolean,
    device_pixel_ratio: number,         //设备像素比
    type: string,
    file: File,                         //截图文件
    file_key: string,
    scale: number,                      //缩放比例
    page_width_pdf: number,             //pdf页面宽度
    page_height_pdf: number,            //pdf页面高度

    evidence_url: string,               //图片URL
}

//pdf viewport
export interface ViewPort {
    width: number;
    height: number;
    scale: number;
    convertToViewportPoint: (x: number, y: number) => [number, number];
    convertToPdfPoint: (x: number, y: number) => [number, number];
    getTextContent: () => string;
};

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
    project_id : number;
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

//pdf wrapper props
export interface PdfWrapperProps {
    mode?: string;               //模式， full(全屏) half(半屏)
    operationMode: string;      //操作模式， edit(编辑) view(查看)
    project_id: number | string;
    project_file_id: number;
    pdfUrl: string;
    page: number;
    zoom: number;
    allEvidence: EvidenceType[]; //当前文件所有的evidence
    typeList?: TypeItem[];       //当前文件所有的type
    onRefreshEvidence?: () => void;
    resetAdding?: () => void;
}

export interface PdfWrapperRefMethods {
  resetAllInfo: () => void;     //重置所有信息
  getPageAmount: () => number;  //获取总页数
  addingRect: (options?: any) => void; //添加矩形
  rotatePDF: (rotate: number) => void; //旋转PDF
}


