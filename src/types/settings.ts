export type ProjectInputTypes =
  | "short_text"
  | "long_text"
  | "location"
  | "number"
  | "date"
  | "link"
  | "selector"
  | "switch"
  | "checks"
  | "radios"
  | "upload_files";

export type ProjectField = {
  id: number;
  name: string;
  type: ProjectInputTypes;
  required: boolean;
  has_hint_text?: boolean;
  hint_text?: string;
  options?: string[];
  is_multiselect?: boolean;
  text?: string;
  is_ranged_date?: boolean;
};

export type FormulasBox = {
  label: string;
  on_quote?: boolean;
  formula?: any;
};

export type FormulasBoxProps = FormulasBox & {
  onChange?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
};

export type ProjectFieldBoxProps = ProjectField & {
  onChange?: (patch: Partial<ProjectField>) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
};

export const PROJECT_INPUT_TYPES_OPTIONS = [
  "short_text",
  "long_text",
  "location",
  "numbers",
  "date",
  "link",
  "selector",
  "switch",
  "checks",
  "radios",
  "upload_files",
] as const;

export type ProjectInputTypesOptions =
  (typeof PROJECT_INPUT_TYPES_OPTIONS)[number];
