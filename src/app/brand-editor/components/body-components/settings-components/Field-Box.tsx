"use client";

import { FIELD_TYPE_MAP, formatLabel } from "@/lib/functions";
import {
  PROJECT_INPUT_TYPES_OPTIONS,
  ProjectFieldBoxProps,
} from "@/types/settings";
import { Checkbox, Input, Select, Switch } from "antd";
import Image from "next/image";

export const FieldBox = (field: ProjectFieldBoxProps) => {
  const {
    id,
    label,
    type,
    required,
    has_hint_text,
    hint_text,
    metadata,
    onChange,
    onDuplicate,
    onDelete,
  } = field;

  const formatLabel = (label: string) =>
    label
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());

  const inputTypeOptions = Object.entries(FIELD_TYPE_MAP).map(
    ([value, label]) => ({
      value: Number(value),
      label: (
        <div className="flex items-center gap-2">
          <img
            src={`/assets/icons/fields/${label.toLowerCase()}.svg`}
            alt={label}
            className="w-4 h-4"
          />
          <span>{formatLabel(label)}</span>
        </div>
      ),
    })
  );

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white">
      {/* Row 1 */}
      <div className="flex items-center gap-3 bg-baseLight p-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs text-basicGray">
          {id + 1}
        </div>

        <Input
          value={label}
          onChange={(e) => onChange?.({ label: e.target.value })}
          placeholder="Project Name"
          className="rounded-md px-3 h-8 w-60 font-normal"
        />

        <Select
          value={type}
          onChange={(value) => onChange?.({ type: value })}
          options={inputTypeOptions}
          className="w-52 rounded-md h-8 font-normal"
          placeholder="Select Type"
        />

        <div className="ml-auto flex items-center gap-3 mr-3">
          <button
            type="button"
            onClick={onDelete}
            className="items-center justify-center"
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
            className="items-center justify-center"
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

      <div className="border border-t-0 border-baseLightHover rounded-b-xl p-3">
        {/* Row 2 */}
        <div className="flex items-center justify-between px-4 py-3 ">
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
    </div>
  );
};
