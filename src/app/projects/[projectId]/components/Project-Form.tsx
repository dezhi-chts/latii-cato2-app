"use client";

import Checkbox from "@/components/fields/Check";
import DateInput from "@/components/fields/DateInput";
import Weblink from "@/components/fields/Link";
import LongText from "@/components/fields/LongText";
import Numbers from "@/components/fields/Numbers";
import Radio from "@/components/fields/Radio";
import Selector from "@/components/fields/Selector";
import ShortText from "@/components/fields/ShortText";
import Switch from "@/components/fields/Switch";
import { useCompany } from "@/context/CompanyContext";
import React, { useEffect, useState } from "react";

export const FIELD_COMPONENTS_BY_NUMBER: Record<
  number,
  (props: any) => React.ReactNode
> = {
  0: (props) => <ShortText {...props} />,
  1: (props) => <LongText {...props} />,
  2: (props) => <Numbers {...props} />,
  3: (props) => <Selector {...props} />,
  4: (props) => <Checkbox {...props} />,
  5: (props) => <Radio {...props} />,
  6: (props) => <Switch {...props} />,
  7: (props) => <DateInput {...props} />,
  8: (props) => <Weblink {...props} />,
};

export const COMMIT_ON_BLUR = new Set([0, 1, 2, 8]);

type ProjectFormProps = {
  form: Record<string, any>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, any>>>;
};

const ProjectForm = ({ form, setForm }: ProjectFormProps) => {
  const { company } = useCompany();
  const attributes = company?.project_attributes ?? [];

  const getFieldKey = (label: string) =>
    label.toLowerCase().replaceAll(" ", "_");

  const commit = (label: string) => (value: any) => {
    setForm((prev) => ({
      ...prev,
      [getFieldKey(label)]: value,
    }));
  };

  useEffect(() => {
    console.log(form);
  }, [form]);

  function formatOptions(options: string[]) {
    if (!Array.isArray(options) || !options?.length) return [];
    const formatted = options.map((option: string) => ({
      value: option,
      label: option,
    }));
    return formatted;
  }

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const attr of attributes) {
        if (!attr?.label || attr.type !== 5) continue;

        const key = getFieldKey(attr.label);
        const options = formatOptions(attr?.metadata ?? []);
        const firstValue = options[0]?.value;

        if (prev[key] === undefined && firstValue !== undefined) {
          next[key] = firstValue;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [attributes]);

  return (
    <div className="flex flex-col gap-3">
      <ShortText
        name="Project Name"
        hint_text="Input a recognizable name for you"
        required
        onChange={
          ((e: any) => commit("project_name")(e?.target?.value ?? "")) as any
        }
      />
      {attributes.map((attr) => {
        if (!attr?.label) return null;

        const Component = FIELD_COMPONENTS_BY_NUMBER[attr.type];
        if (!Component) return null;

        const isBlur = COMMIT_ON_BLUR.has(attr.type);

        const metadata = attr?.metadata ?? [];

        const hasOptions = metadata.length > 0;

        const options = hasOptions ? JSON.parse(metadata[0]) : [];

        const isMultiple = metadata.length > 1 && metadata[1] === "multiple";

        const isRadio = attr.type === 5;

        return (
          <Component
            key={attr.uuid}
            name={attr.label}
            required={attr.required}
            hint_text={attr.has_hint_text ? attr.hint : undefined}
            options={options}
            is_multiple={isMultiple}
            {...(isBlur
              ? {
                  onBlur: (e: any) =>
                    commit(attr.label)(e?.target?.value ?? ""),
                }
              : {
                  value: form[getFieldKey(attr.label)],
                  onChange: (v: any) =>
                    commit(attr.label)(isRadio ? v.target.value : v),
                })}
          />
        );
      })}
    </div>
  );
};

export default ProjectForm;

const parseOptions = (metadata?: string[]) => {
  if (!metadata?.length) return [];

  try {
    if (metadata.length === 1 && metadata[0].startsWith("[")) {
      return JSON.parse(metadata[0]);
    }

    return metadata.map((m) => JSON.parse(m));
  } catch {
    return [];
  }
};
