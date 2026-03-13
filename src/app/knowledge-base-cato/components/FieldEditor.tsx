"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, message, Tag } from "antd";

import { updateField, createField } from "@/services/templateService";
import LoadingScreen from "@/components/loading-screen";
import { PlusOutlined } from "@ant-design/icons";
import Image from "next/image";
import dynamic from "next/dynamic";

// 动态引入ReactQuill防止SSR错误
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';
import { FieldEvent } from "../page";

interface FieldData {
  id: string;
  name: string;
  notes: string;
  field_type: string;
  config_json: {
    available_values: string[];
    extraction_rules: string[];
  };
}

interface FieldEditorProps {
  templateId: number;
  field: FieldData;
  mode?: "create" | "edit"; // 创建模式 或 编辑模式
  onClose?: () => void;
  onUpdateField?: (eventName: FieldEvent, data: any) => void;
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
  onClose,
  onUpdateField
}: FieldEditorProps) => {
  const [formData, setFormData] = useState<FieldData>({
    id: "",
    name: "",
    notes: "",
    field_type: "",
    config_json: {
      available_values: [],
      extraction_rules: [],
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (field) setFormData(field);
  }, [field]);

  const handleFieldChange = (key: keyof FieldData, value: any) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = useCallback(() => {
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
      onUpdateField?.(FieldEvent.Create, { templateId });
    } else {
      message.error(res?.data?.detail || "Failed to create field");
    }
    setLoading(false);
  };

  const handleAddValue = () => {
    const newValues = [...values, "Please input value"];
    setFormData({
      ...formData,
      config_json: {
        ...formData.config_json,
        available_values: newValues,
      },
    });
  };

  const rulesString = useMemo(() => {
    if (!formData?.config_json?.extraction_rules) return "";
    return formData?.config_json?.extraction_rules?.join(", ") || "";
  }, [formData]);

  const values = useMemo(() => {
    return formData?.config_json?.available_values || [];
  }, [formData]);

  const disabelEdit = templateId === 1;

  return (
    <div className="w-full h-full flex flex-col gap-6 border border-primaryN30 rounded-xl overflow-hidden">
      <div className="flex-1 flex flex-row overflow-y-auto">
        {/* Form Fields */}
        <div className={`${mode === 'create' ? 'w-[40%]' : 'w-[500px]'} px-10 py-5 flex flex-col gap-10`}>
          {/* Label */}
          <div className="flex flex-col gap-2">
            <label className={`text-sm`}>Label</label>
            <p className="text-xs text-grey-normal">This will be the name of your columns in your takeoff list.</p>
            <div className="w-full mt-2">
              <Input
                value={formData?.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className="w-full h-[28px] border-primaryN30 rounded-md text-xs"
                placeholder="Enter field name"
                disabled={disabelEdit}
              />
            </div>
          </div>

          {/* Type */}
          {
            formData?.name !== 'Generations' &&
            <div className="flex flex-col gap-2">
              <label className={`text-sm`}>Type of Prompt</label>
              <div className="flex-1 flex gap-2">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`w-[100px] h-[26px] flex items-center justify-center rounded-lg text-xs transition-colors ${formData?.field_type === option.value
                      ? "bg-forumBlue-light-hover text-forumBlue-dark-active"
                      : "bg-grey-light text-grey-light-strong"
                      }`}
                    onClick={() => handleFieldChange("field_type", option.value)}
                    disabled={disabelEdit}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          }

          {/* Available Values */}
          {formData?.field_type === 'string' && <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div>
                <label className={`text-sm`}>Values Options</label>
                <p className="mt-1 text-xs text-grey-normal">Create value options to improve recognition.</p>
              </div>
              <div>
                <button
                  className={`w-[80px] h-[26px] flex items-center justify-center rounded-lg text-xs transition-colors bg-forumBlue-light-hover text-forumBlue-dark-active`}
                  onClick={() => handleAddValue()}
                  disabled={disabelEdit}
                >
                  <PlusOutlined className="text-xs" />
                  <span className="ml-1">Value</span>
                </button>
              </div>
            </div>
            <div className="flex-1 mt-2">
              <div className={`flex flex-col gap-2 rounded-lg ${values.length > 0 ? "border border-primaryN30 " : ""}`}>
                {values.map(((item, index) => (
                  <div
                    key={index}
                    className="h-[44px] px-4 flex items-center justify-between border-b border-primaryN30"
                  >
                    <button className="text-grey-normal hover:text-red-500"
                      disabled={disabelEdit}
                    >
                      <Image src="/assets/icons/delete.svg" alt="plus icon" width={15} height={15} />
                    </button>
                    <input
                      className="ml-4 mr-1 flex-1 text-sm"
                      value={item}
                      onChange={(e) => {
                        const newValues = [...values];
                        newValues[index] = e.target.value;
                        setFormData({
                          ...formData,
                          config_json: {
                            ...formData.config_json,
                            available_values: newValues,
                          },
                        });
                      }}
                      disabled={disabelEdit}
                    />
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-3 py-0.5 rounded-lg cursor-pointer ${item.isDefault ? "text-[#5856D7] bg-[#5856D733]" : "bg-grey-light-hover text-grey-light-strong"
                          }`}
                      >
                        Default
                      </span>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          </div>}

          {/* Notes */}
          <div className="flex flex-col items-start gap-2">
            <label className={`text-sm`}>Notes</label>
            <p className="text-xs text-grey-normal">Add notes if needed for your team to visualize.</p>
            <div className="w-full mt-2">
              <Input.TextArea
                size="small"
                value={formData?.notes || ""}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                className="w-full border-primaryN30 rounded-md text-xs"
                placeholder="For Example: All Our Glass is Tempered."
                rows={4}
                disabled={disabelEdit}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 flex px-10 py-5">
          {/* Rules */}
          <div className="mb-2 flex-1 flex flex-col gap-2">
            <label className={`text-sm`}>Rules</label>
            <div className="flex-1 flex flex-col gap-3">
              <ReactQuill
                theme="snow"
                value={rulesString}
                onChange={(value) => {
                  if (value?.trim().length > 0) {
                    setFormData({
                      ...formData,
                      config_json: {
                        ...formData.config_json,
                        extraction_rules: [value],
                      },
                    });
                  }
                }}
                className="h-[calc(100%-50px)]"
                readOnly={disabelEdit}
              >
              </ReactQuill>
            </div>
          </div>
        </div>
      </div>
      <div className="mb-2 mr-10 flex justify-end">
        {
          !disabelEdit && (
            <Button
              className="custom-primary-btn"
              onClick={handleSubmit}
            >
              Save
            </Button>
          )
        }
      </div>
      {loading && <LoadingScreen isLoading={loading} />}
    </div>
  );
};
