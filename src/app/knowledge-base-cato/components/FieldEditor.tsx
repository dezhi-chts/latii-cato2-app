"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, message, Tag, Modal } from "antd";

import { updateField, createField } from "@/services/templateService";
import LoadingScreen from "@/components/loading-screen";
import { PlusOutlined } from "@ant-design/icons";
import Image from "next/image";

// 动态引入ReactQuill防止SSR错误
import { FieldEvent } from "../page";
import { notify } from "@/utils/notify";

const { confirm } = Modal;

interface FieldData {
  id: string;
  name: string;
  notes: string;
  field_type: string;
  config_json: {
    available_values: string[];
    extraction_rules: string[];
    default_value: string;
  };
}

interface FieldEditorProps {
  templateId: number;
  templateInfo: any;
  field: FieldData;
  mode?: "create" | "edit"; // 创建模式 或 编辑模式
  onClose?: () => void;
  onUpdateField?: (eventName: FieldEvent, data: any) => void;
}

const typeOptions = [
  { value: "string", label: "Text Value" },
  { value: "number", label: "Numeric Value" },
];

export const FieldEditor = ({
  templateId,
  templateInfo,
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
      default_value: '',
    },
  });
  const [loading, setLoading] = useState(false);
  // 用于区分 ReactQuill 的初始化触发和用户输入
  const isQuillInitializedRef = useRef(false);

  useEffect(() => {
    if (field) {
      setFormData(field);
      // 重置 ReactQuill 初始化标志
      isQuillInitializedRef.current = false;
    }
  }, [field]);

  const handleFieldChange = (key: keyof FieldData, value: any) => {
    let newFormData = { ...formData, [key]: value };
    setFormData(() => newFormData);
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
      handleCreateField();
      return;
    }

    const targetFieldId = field?.id || formData?.id;
    if (!targetFieldId) {
      message.error("Failed to save field: missing field id");
      return;
    }

    onUpdateField?.(FieldEvent.Update, {
      template_id: templateId,
      field_id: targetFieldId,
      fieldData: formData,
    });
  }, [formData, mode, field?.id, templateId, onUpdateField]);

  const handleCreateField = async () => {
    setLoading(true);
    const res = await createField(
      templateId,
      formData as any,
    );
    if (res.status === "success") {
      setLoading(false);
      notify.success({
        title: "Success",
        description: res?.data?.detail || "Field created successfully",
      });
      onClose?.();
      onUpdateField?.(FieldEvent.Create, { template_id: templateId, fieldData: formData });
    } else {
      setLoading(false);
      notify.error({
        title: "Error",
        description: res?.data?.detail || "Failed to create field",
      });
    }
  }

  const handleAddValue = () => {
    const newValues = [...values, "Please input value"];
    let configJSON = {
      ...formData?.config_json,
      available_values: newValues,
    };
    handleFieldChange("config_json", configJSON);
  };

  const handleValuesDefault = (defaultValue: string) => {
    let configJSON = {
      ...formData?.config_json,
      default_value: defaultValue,
    };
    handleFieldChange("config_json", configJSON);
  }

  const handleRemoveValue = (index: number) => {
    confirm({
      title: "Are you sure you want to delete this value?",
      okText: "Yes",
      okType: "danger",
      onOk: () => {
        let configJSON = {
          ...formData?.config_json,
          available_values: [...values],
        };
        configJSON.available_values.splice(index, 1);
        handleFieldChange("config_json", configJSON);
      },
    })
  }



  const rulesString = useMemo(() => {
    if (!formData?.config_json?.extraction_rules) return "";
    return formData?.config_json?.extraction_rules?.join(", ") || "";
  }, [formData]);

  const values = useMemo(() => {
    return formData?.config_json?.available_values || [];
  }, [formData]);

  const disbaleFileName = ['Label', 'Sub Label', 'Product', 'Quantity', 'coordinates.x1', 'coordinates.y1', 'coordinates.x2', 'coordinates.y2'];

  const disabelEdit = templateId === 1 || field?.name === 'Generations' || templateInfo?.is_edit === false;

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex-1 flex flex-row overflow-y-auto">
        {/* Form Fields */}
        <div className={`${mode === 'create' ? 'w-[40%]' : 'w-[500px]'} flex flex-col gap-10`}>
          {/* Label */}
          <div className="flex flex-col gap-2">
            <label className={`text-sm`}>Label</label>
            <p className="text-xs text-grey-normal">This will be the name of your columns in your takeoff list.</p>
            <div className="w-full mt-2">
              <Input
                value={formData?.name}
                onChange={(e) => {
                  handleFieldChange("name", e.target.value);
                }}
                className="w-full h-[28px] border-primaryN30 rounded-md text-xs"
                placeholder="Enter field name"
                disabled={disabelEdit
                  || disbaleFileName.includes(formData?.name)}
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
                    onClick={() => {
                      if (formData?.field_type === option.value) return;
                      handleFieldChange("field_type", option.value)
                    }
                    }
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
                  className={`w-[80px] h-[26px] flex items-center justify-center rounded-lg text-xs transition-colors ${disabelEdit ? 'bg-forumBlue-light-hover' : 'bg-grey-light'} text-forumBlue-dark-active`}
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
                      onClick={() => handleRemoveValue(index)}
                    >
                      <Image src="/assets/icons/delete.svg" alt="plus icon" width={15} height={15} />
                    </button>
                    <input
                      className="ml-4 mr-1 flex-1 text-sm"
                      value={item}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          config_json: {
                            ...formData?.config_json,
                            available_values: values.map((v, i) => i === index ? e.target.value : v),
                          },
                        })
                      }}
                      disabled={disabelEdit}
                    />
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-3 py-0.5 rounded-lg cursor-pointer ${formData?.config_json?.default_value === item ? "text-[#5856D7] bg-[#5856D733]" : "bg-grey-light-hover text-grey-light-strong"
                          }`}
                        onClick={(e) => {
                          if (disabelEdit) return;
                          handleValuesDefault(item);
                        }}
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
            <label className={`text-sm`}>Internal Notes</label>
            <p className="text-xs text-grey-normal">Add specific context or reminders for your team to visualize.</p>
            <div className="w-full mt-2">
              <Input.TextArea
                size="small"
                value={formData?.notes || ""}
                onChange={(e) => {
                  handleFieldChange("notes", e.target.value);
                }}
                className="w-full border-primaryN30 rounded-md text-xs"
                placeholder="Add team notes here..."
                rows={4}
                disabled={disabelEdit}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 flex px-10">
          {/* Rules */}
          <div className="mb-2 flex-1 flex flex-col gap-2">
            <label className={`text-sm`}>Rules</label>
            <p className="text-xs text-grey-normal">Define what CATO should look for and the logic it should use to analyze your files.</p>
            <div className="mt-2 flex-1 flex flex-col gap-3">
              <Input.TextArea
                size="small"
                value={rulesString}
                onChange={(e) => {
                  handleFieldChange("config_json", {
                    ...formData.config_json,
                    extraction_rules: [e.target.value],
                  });
                }}
                className="w-full border-primaryN30 rounded-md text-xs"
                style={{ height: 'calc(100%)', }}
                placeholder="Add team notes here..."
                disabled={disabelEdit}
              />
            </div>
          </div>
        </div>
      </div>
      {
        mode === 'create' ? (
          <div className="mb-2 mr-10 flex justify-end gap-3">
            <Button
              className="custom-default-btn"
              onClick={() => {
                onClose?.();
              }}
            >
              Back
            </Button>
            <Button
              className="custom-primary-btn !w-[96px]"
              onClick={handleSubmit}
            >
              Add
            </Button>
          </div>
        ) : (
          <div>
            {!disabelEdit && (
              <div className="flex justify-end gap-3">
                <Button
                  className="custom-primary-btn !w-[96px]"
                  onClick={handleSubmit}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        )
      }

      {loading && <LoadingScreen isLoading={loading} />}
    </div>
  );
};
