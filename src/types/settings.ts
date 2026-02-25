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
  uuid: string;
  label: string;
  type: number;
  required: boolean;
  is_fixed: boolean;
  has_hint_text?: boolean;
  hint?: string;
  metadata: String[];
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
  onDelete: (uuid: string) => void;
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
