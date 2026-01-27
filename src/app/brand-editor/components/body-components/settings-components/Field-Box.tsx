"use client";

import {
  PROJECT_INPUT_TYPES_OPTIONS,
  ProjectFieldBoxProps,
  ProjectInputTypesOptions,
} from "@/types/settings";
import { Input, Select } from "antd";

export const FieldBox = (field: ProjectFieldBoxProps) => {
  const {
    id,
    name,
    type,
    required,
    has_hint_text,
    hint_text,
    onChange,
    onDuplicate,
    onDelete,
  } = field;

  const formatLabel = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const inputTypeOptions = PROJECT_INPUT_TYPES_OPTIONS.map((type) => ({
    value: type,
    label: formatLabel(type),
  }));

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 w-full bg-basicLightGray">
        <div className="w-6 text-sm text-neutral-600">{id}</div>

        <div className="flex-1 min-w-0">
          <Input
            value={name}
            onChange={(e) => onChange?.({ name: e.target.value })}
            placeholder="Project Name"
          />
        </div>

        <div className="shrink-0">
          <Select
            value={type}
            onChange={(value: ProjectInputTypesOptions) =>
              onChange?.({ type: value })
            }
            options={inputTypeOptions}
            style={{ width: 220 }} // <- importante con AntD
          />
        </div>
      </div>
    </div>
  );
};
