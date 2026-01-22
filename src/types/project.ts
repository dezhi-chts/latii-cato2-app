import { UploadFile } from "antd";

export type ProjectSettings = {
  project_name: string;
  // expected_end_date: string | null;
  project_desc: string | null;
  // priority: string;
  // is_pin: boolean;
  // pin_time: string | null;
  create_user: string;
  // origin: string;
  // status: number;
  // state: string;
  // city: string;
  // postal_code: string;
  // address: string;
  // country: string;
  // creator_type: number;
  dealer_id: number;
  is_favorite: boolean;
  // award_likelihood: string;
  // importance: string;
  // customer: string;
  project_id?: number;
  // quotes_ready_for_process?: number;
  // order?: number;
  [key: string]: any;
};

export const defaultProjectSettings: ProjectSettings = {
  project_name: "",
  // expected_end_date: "",
  project_desc: "",
  // priority: "",
  // is_pin: false,
  // pin_time: null,
  create_user: "",
  // origin: "",
  // status: 1,
  // state: "",
  // city: "",
  // postal_code: "",
  // address: "",
  // country: "",
  // creator_type: 0,
  dealer_id: 0,
  is_favorite: false,
  // award_likelihood: "",
  // importance: "",
  // customer: "",
};

export type CreateProjectModalProps = {
  isOpen: boolean;
  closeModal: () => void;
  onSuccess?: () => void;
  uploadFilesData?: any[];
  onOpenTakeoffModal?: (data: any) => void;
};

export type LocationSelectorProps = {
  onClose: () => void;
  handleInputChange: <K extends keyof ProjectSettings>(
    field: K,
  ) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleDropdownChange: <K extends keyof ProjectSettings>(
    field: K,
  ) => (value: ProjectSettings[K]) => void;
  projectSettings: any;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectorClassName?: string;
  updateProject?: () => void;
  height?: "small" | "medium";
  style: any;
};

export type QuickActionsForm = {
  item_ids: string[];
  frame_brand: string | null;
  frame_brand_text: string | null;
  profile_line: string | null;
  profile_line_text: string | null;
  frame_material: string | null;
  frame_material_text: string | null;
  finish_method: string | null;
  finish_method_text: string | null;
  color: number | null;
  glass_style: string | null;
  glass_style_text: string | null;
  glass_specification: string | null;
  glass_specification_text: string | null;
  glass_air_type: string | null;
  glass_air_type_text: string | null;
  installation_method: string | null;
  installation_method_text: string | null;
  installation_glazed: string | null;
  installation_glazed_text: string | null;
  installation_nailing_fin?: string | string[] | null;
  installation_nailing_fin_text?: string | string[] | null;
};

export type PreviewImage = {
  quote_id: string;
  image_url: string;
  is_open: boolean;
};

export enum FieldType {
  INPUT_TEXT = "input_text",
  TEXTAREA = "textarea",
  INPUT_NUMBER = "input_number",
  DROPDOWN = "dropdown",
  CHECKBOX = "checkbox",
  RADIO = "radio",
  SWITCH = "switch",
  DATE = "date",
  LINK = "link",
  LOCATION = "location",
}

export type CustomField = {
  field_name: string;
  field_type: string;
  required: boolean;
  field_options?: string[];
  Hint_text: string;
  Multiple_selection?: boolean;
  range?: boolean;
};
