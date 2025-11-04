export type Template = {
  analysis_ai_prompt: string;
  company_id: number;
  create_time: string;
  create_user: string;
  description: string;
  fields_count?: number;
  fields?: ApiField[];
  id: number;
  name: string;
  update_time: string;
  update_user: string;
};

type ApiField = {
  config_json: ConfigJson;
  create_time: string;
  create_user: string;
  field_type: string;
  id: number;
  name: string;
  update_time: string;
  update_user: string;
};

export type ConfigJson = {
  extraction_rules?: string[];
  available_values?: string[];
  unit?: string;
};

export type Field = {
  name: string;
  field_type: "string" | "number";
  config_json?: ConfigJson;
};
