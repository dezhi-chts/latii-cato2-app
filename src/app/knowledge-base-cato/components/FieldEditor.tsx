"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, message, Tag } from "antd";
import { AvailableValues } from "./AvailableValues";

import { updateField, createField } from "@/services/templateService";
import LoadingScreen from "@/components/loading-screen";

interface ValueItem {
  id: string;
  value: string;
  isDefault?: boolean;
}

interface FieldData {
  id: string;
  name: string;
  notes: string;
  field_type: string;
  config_json: {
    extraction_rules: string[];
  };
}

interface FieldEditorProps {
  templateId: string;
  field: FieldData;
  mode?: "create" | "edit"; // 创建模式 或 编辑模式
  onClose?: () => void;
}

const typeOptions = [
  { value: "string", label: "Text Value" },
  { value: "number", label: "Numeric Value" },
];

const labelWidth = "w-[120px]";

export const FieldEditor = ({
  templateId,
  field,
  mode = "edit",
  onClose
}: FieldEditorProps) => {
  const [formData, setFormData] = useState<FieldData>({
    id: "",
    name: "",
    notes: "",
    field_type: "",
    config_json: {
      extraction_rules: [],
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (field) setFormData(field);
  }, [field]);

  const handleFieldChange = (key: keyof FieldData, value: any) => {
    console.log('######### handleFieldChange', key, value);
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = useCallback(() => {
    console.log('######### handleSubmit', formData);
    // 判断必填项是否填写
    if (!formData?.name) {
      message.error("Please fill in the required field: Label");
      return;
    }
    if (!formData?.field_type) {
      message.error("Please fill in the required field: Type");
      return;
    }
    if (mode === "create") {
      handleCreate();
    } else {
      handleUpdate();
      onClose?.();
    }
  }, [formData]);

  const handleUpdate = async () => {
    setLoading(true);
    const res = await updateField(
      templateId || "",
      field?.id || "",
      formData as any,
    );
    if (res.status === "success") {
      message.success("Field updated successfully");
    } else {
      message.error(res?.data?.detail || "Failed to update field");
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    const res = await createField(
      templateId || "",
      formData as any,
    );
    if (res.status === "success") {
      message.success("Field created successfully");
    } else {
      message.error(res?.data?.detail || "Failed to create field");
    }
    setLoading(false);
  };

  const rulesString = useMemo(() => {
    if (!formData?.config_json?.extraction_rules) return "";
    return formData?.config_json?.extraction_rules?.join(", ") || "";
  }, [formData]);

  return (
    <div className="w-[960px] h-full flex flex-col gap-6 border border-primaryN30 rounded-xl">
      {/* Title with Tags */}
      {mode === "edit" ? <div className="px-10 h-[70px] flex items-center gap-3 border-b border-primaryN30">
        <h2 className="text-2xl font-bold text-grey-normal">{field?.name || ""}</h2>
      </div> : <div className="h-[20px]"></div>}

      {/* Form Fields */}
      <div className="flex-1 px-10 flex flex-col gap-5">
        {/* Label */}
        <div className="flex items-start gap-8">
          <label className={`${labelWidth} text-xs font-bold`}>
            Label <span className="text-red-500">*</span>
          </label>
          <div className="flex-1">
            <Input
              value={formData?.name || ""}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className="border-primaryN30 rounded-md text-xs"
              placeholder="Enter field name"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex items-start gap-8">
          <label className={`${labelWidth} text-xs font-bold`}>
            Notes
          </label>
          <div className="flex-1">
            <Input.TextArea
              size="small"
              value={formData?.notes || ""}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              className="border-primaryN30 rounded-md text-xs"
              placeholder="For Example: All Our Glass is Tempered."
              rows={4}
            />
            <div className="mt-1 text-xxs text-grey-normal">
              This will show on your budgetary File, as a always present note.
            </div>
          </div>
        </div>

        {/* Type */}
        <div className="flex items-start gap-8">
          <label className={`${labelWidth} text-xs font-bold`}>
            Type <span className="text-red-500">*</span>
          </label>
          <div className="flex-1 flex gap-2">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                className={`px-4 py-0.5 rounded-lg text-xxs transition-colors ${formData?.field_type === option.value
                  ? "bg-grey-light-active text-grey-dark"
                  : "bg-grey-light text-grey-light-strong hover:bg-grey-light-active"
                  }`}
                onClick={() => handleFieldChange("field_type", option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Available Values */}
        <div className="flex items-start gap-8">
          <label className={`${labelWidth} text-xs font-bold`}>
            Available Values
          </label>
          <div className="flex-1">
            <AvailableValues
              values={[]}
              onChange={(values) => { }
              }
            />
          </div>
        </div>

        {/* Rules */}
        <div className="flex items-start gap-8">
          <label className={`${labelWidth} text-xs font-bold`}>
            Rules
          </label>
          <div className="flex-1">
            <div className="flex flex-col gap-3">
              <textarea
                value={rulesString}
                onChange={(e) => handleFieldChange("config_json", { ...formData?.config_json, extraction_rules: e.target.value.split("\n") })}
                placeholder="Type the prompt rules you want Cato to use to populate the field and add into the table fields. For example:&#10;1. Perform an exact match with Field Prompt Label name on the drawing.&#10;2. Support fuzzy matching (e.g., 'galv' matches 'Galvanized Steel')"
                className="w-full h-[200px] p-4 border border-primaryN30 rounded-md text-xs resize-none focus:outline-none focus:border-forumBlue-normal"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mb-2 mr-10 flex justify-end">
        <Button
          className="custom-primary-btn"
          onClick={handleSubmit}
        >
          Save
        </Button>
      </div>
      {loading && <LoadingScreen isLoading={loading} />}
    </div>
  );
};
