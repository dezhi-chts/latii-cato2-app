"use client";

import { formatLabel } from "@/lib/functions";
import {
  PROJECT_INPUT_TYPES_OPTIONS,
  ProjectFieldBoxProps,
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
    text,
    is_ranged_date,
    is_multiselect,
    onChange,
    onDuplicate,
    onDelete,
  } = field;

  const inputTypeOptions = PROJECT_INPUT_TYPES_OPTIONS.map((t) => ({
    value: t,
    label: (
      <div className="flex items-center gap-2">
        <img
          src={`/assets/icons/fields/${t}.svg`}
          alt={t}
          className="w-4 h-4"
        />
        <span>{formatLabel(t)}</span>
      </div>
    ),
  }));

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white">
      {/* Row 1 */}
      <div className="flex items-center gap-3 bg-grey-light p-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs text-grey-normal">
          {id}
        </div>

        <Input
          value={name}
          onChange={(e) => onChange?.({ name: e.target.value })}
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

      <div className="border border-t-0 border-grey-light-hover rounded-b-xl p-3">
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
