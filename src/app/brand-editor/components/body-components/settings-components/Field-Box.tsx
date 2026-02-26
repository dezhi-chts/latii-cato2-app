"use client";

import React, { useEffect, useState } from "react";
import { FIELD_TYPE_MAP } from "@/lib/functions";
import { ProjectFieldBoxProps } from "@/types/settings";
import { Checkbox, Input, Select, Switch } from "antd";
import Image from "next/image";
import Button from "@/components/Button";

const formatLabel = (label: string) =>
  label
    ?.replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

export const FieldBox = (field: ProjectFieldBoxProps) => {
  const {
    id,
    uuid,
    label,
    type,
    required,
    has_hint_text,
    hint,
    is_fixed,
    metadata,
    onChange,
    onDuplicate,
    onDelete,
  } = field;

  const hasOptions = type === 3 || type === 4 || type === 5;

  // ✅ Local states
  const [localLabel, setLocalLabel] = useState(label ?? "");
  const [localHint, setLocalHint] = useState(hint ?? "");
  const [localOptions, setLocalOptions] = useState<string[]>(metadata ?? []);

  // ✅ Sync when backend refreshes
  useEffect(() => {
    setLocalLabel(label ?? "");
  }, [label]);

  useEffect(() => {
    setLocalHint(hint ?? "");
  }, [hint]);

  useEffect(() => {
    setLocalOptions(metadata ?? []);
  }, [metadata]);

  // ✅ Commit helpers
  const commitLabel = () => {
    if (localLabel !== (label ?? "")) {
      onChange?.({ label: localLabel });
    }
  };

  const commitHint = () => {
    if (localHint !== (hint ?? "")) {
      onChange?.({ hint: localHint });
    }
  };

  const commitOptions = (next: string[]) => {
    onChange?.({ metadata: next });
  };

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
      {/* HEADER */}
      <div className="flex items-center gap-3 bg-baseLight p-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs text-basicGray">
          {id + 1}
        </div>

        {/* LABEL */}
        <Input
          value={localLabel}
          disabled={!!is_fixed}
          onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={commitLabel}
          placeholder="Project Name"
          className="rounded-md px-3 h-8 w-60 font-normal"
        />

        {/* TYPE */}
        <Select
          value={type}
          disabled={!!is_fixed}
          onChange={(value) => onChange?.({ type: value })}
          options={inputTypeOptions}
          className="w-52 rounded-md h-8 font-normal"
        />

        {/* ACTIONS */}
        {!is_fixed && (
          <div className="ml-auto flex items-center gap-3 mr-3">
            <button
              type="button"
              disabled={!uuid}
              onClick={() => uuid && onDelete(uuid)}
              className="disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Image
                src="/assets/icons/delete.svg"
                alt="Delete"
                width={16}
                height={16}
              />
            </button>

            <button type="button" onClick={onDuplicate}>
              <Image
                src="/assets/icons/duplicate.svg"
                alt="Duplicate"
                width={16}
                height={16}
              />
            </button>
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="border border-t-0 border-baseLightHover rounded-b-xl p-3">
        {/* OPTIONS (Dropdown / Radio / Checkbox) */}
        {hasOptions && (
          <div className="px-4 pb-4">
            <p className="text-xs text-basicGray mb-2">Options</p>

            <div className="flex flex-col gap-2">
              {localOptions.map((opt, idx) => (
                <div key={`opt-${idx}`} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    disabled={!!is_fixed}
                    onChange={(e) => {
                      const next = [...localOptions];
                      next[idx] = e.target.value;
                      setLocalOptions(next);
                    }}
                    onBlur={() => commitOptions([...localOptions])}
                    placeholder={`Option ${idx + 1}`}
                    className="h-9"
                  />

                  <button
                    type="button"
                    disabled={!!is_fixed}
                    onClick={() => {
                      const next = localOptions.filter((_, i) => i !== idx);
                      setLocalOptions(next);
                      commitOptions(next);
                    }}
                    className="px-2 text-basicGray disabled:opacity-40"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <Button
              backgroundColor="forumBlue"
              className="mt-3 rounded-md !px-3 !py-1"
              disabled={!!is_fixed}
              onClick={() => {
                const next = [
                  ...localOptions,
                  `Option ${localOptions.length + 1}`,
                ];
                setLocalOptions(next);
                commitOptions(next);
              }}
            >
              + Add option
            </Button>
          </div>
        )}
        {/* HINT + REQUIRED */}
        <div className="flex items-center justify-between px-4 py-3">
          <Checkbox
            checked={!!has_hint_text}
            disabled={!!is_fixed}
            onChange={(e) => onChange?.({ has_hint_text: e.target.checked })}
          >
            Hint Text
          </Checkbox>

          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-700">Required</span>

            <Switch
              checked={!!required}
              disabled={!!is_fixed}
              onChange={(checked) => onChange?.({ required: checked })}
            />
          </div>
        </div>

        {/* HINT INPUT */}
        {has_hint_text && (
          <div className="px-4 pb-4">
            <Input
              size="small"
              value={localHint}
              disabled={!!is_fixed}
              onChange={(e) => setLocalHint(e.target.value)}
              onBlur={commitHint}
              placeholder="Hint text..."
            />
          </div>
        )}
      </div>
    </div>
  );
};
