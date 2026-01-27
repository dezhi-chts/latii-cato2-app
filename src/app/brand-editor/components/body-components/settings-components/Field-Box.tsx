"use client";

import {
  PROJECT_INPUT_TYPES_OPTIONS,
  ProjectFieldBoxProps,
  ProjectInputTypesOptions,
} from "@/types/settings";
import { Checkbox, Input, Select, Switch } from "antd";
import Image from "next/image";

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

  const inputTypeOptions = PROJECT_INPUT_TYPES_OPTIONS.map((t) => ({
    value: t,
    label: formatLabel(t),
  }));

  return (
    <div className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Row 1 */}
      <div className="flex items-center gap-3 bg-basicLightGray px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-white text-xs text-neutral-600">
          {id}
        </div>

        <div className="flex-1 min-w-0">
          <Input
            size="small"
            value={name}
            onChange={(e) => onChange?.({ name: e.target.value })}
            placeholder="Project Name"
          />
        </div>

        <div className="shrink-0">
          <Select
            size="small"
            value={type}
            onChange={(value: ProjectInputTypesOptions) =>
              onChange?.({ type: value })
            }
            options={inputTypeOptions}
            style={{ width: 220 }}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"
          >
            <Image
              src="/assets/icons/delete.svg"
              alt="Delete"
              width={16}
              height={16}
            />
          </button>

          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"
          >
            <Image
              src="/assets/icons/duplicate.svg"
              alt="Duplicate"
              width={16}
              height={16}
            />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-neutral-100" />

      {/* Row 2 */}
      <div className="flex items-center justify-between px-4 py-3">
        <Checkbox
          checked={!!has_hint_text}
          onChange={(e) => onChange?.({ has_hint_text: e.target.checked })}
        >
          Hint Text
        </Checkbox>

        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-700">Required</span>
          <Switch
            checked={!!required}
            onChange={(checked) => onChange?.({ required: checked })}
          />
        </div>
      </div>

      {/* Hint text input (si está activo) */}
      {has_hint_text && (
        <div className="px-4 pb-4">
          <Input
            size="small"
            value={hint_text ?? ""}
            onChange={(e) => onChange?.({ hint_text: e.target.value })}
            placeholder="Hint text..."
          />
        </div>
      )}
    </div>
  );
};
