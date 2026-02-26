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
