export type ProjectStatus = "Take Off" | "Uploaded";

export type ProjectRow = {
  key: string;
  project_name: string;
  last_edit: string;
  update_time: string;
  status: ProjectStatus;
  notes: string;
  is_favorite: boolean;
  [key: string]: unknown;
};

export type Attribute = {
  uuid: string;
  type: number;
  hint: string;
  has_hint_text: boolean;
  required: boolean;
  label: string;
  metadata: string[];
};

/**
 * take off 文件状态
 */
export enum TakeOffFileStatus {
  'STATUS_UNPROCESSED' = "未处理",
  'STATUS_ELEVATION_FLOOR_REVIEWING' ="立面图平面图复核中",
  'STATUS_ELEVATION_FLOOR_REVIEWED' ="立面图平面图已经复核完",
  'STATUS_SCHEDULE_REVIEWING' ="schedule复核中",
  'STATUS_SCHEDULE_REVIEWED' ="schedule已经复核完",
  'STATUS_MERGED' ="合并完",
}
