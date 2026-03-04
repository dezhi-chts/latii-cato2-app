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
import React, { useState } from "react";

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

  const commit = (label: string) => (value: any) => {
    setForm((prev) => ({
      ...prev,
      [label.toLowerCase().replace(" ", "_")]: value,
    }));
  };

  function formatOptions(options: string[]) {
    if (!options.length) return [];
    const formatted = options.map((option: string) => ({
      value: option,
      label: option,
    }));
    return formatted;
  }

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

        const options = attr?.metadata ?? [];
        const formattedOptions = formatOptions(options);

        return (
          <Component
            key={attr.uuid}
            name={attr.label}
            required={attr.required}
            hint_text={attr.has_hint_text ? attr.hint : undefined}
            options={formattedOptions}
            {...(isBlur
              ? {
                  onBlur: (e: any) =>
                    commit(attr.label)(e?.target?.value ?? ""),
                }
              : {
                  value: form[attr.label],
                  onChange: (v: any) => commit(attr.label)(v),
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
