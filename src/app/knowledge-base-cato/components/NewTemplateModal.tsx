"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Input, Checkbox, message } from "antd";
import { createTemplate, getTemplateById } from "@/services/templateService";
import { useUser } from "@/context/UserContext";
import LoadingScreen from "@/components/loading-screen";
import { PlusOutlined } from "@ant-design/icons";


interface StandardField {
  id: string;
  name: string;
  notes: string;
  field_type: string;
}

interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (template: any) => void;
  onAddPrompt: () => void;
}

export const NewTemplateModal = ({
  isOpen,
  onClose,
  onSuccess,
  onAddPrompt,
}: NewTemplateModalProps) => {
  const [templateName, setTemplateName] = useState("");
  const [standardTemplateInfo, setStandardTemplateInfo] = useState<any>(null);
  const [standardFields, setStandardFields] = useState<StandardField[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateNameError, setTemplateNameError] = useState("");

  const { company_id } = useUser();

  // 获取标准模版的 fields
  useEffect(() => {
    if (isOpen) {
      fetchStandardFields();
    }
  }, [isOpen]);

  // 重置表单
  useEffect(() => {
    if (!isOpen) {
      setTemplateName("");
      setSelectedFieldIds([]);
      setTemplateNameError("");
    }
  }, [isOpen]);

  // 当用户输入时清除错误信息
  useEffect(() => {
    if (templateName.trim() && templateNameError) {
      setTemplateNameError("");
    }
  }, [templateName, templateNameError]);

  const fetchStandardFields = async () => {
    setLoading(true);
    // 标准模版 ID 为 1
    const res = await getTemplateById(1);
    if (res.status === "success") {
      setStandardTemplateInfo(res.data);
      if (res.data?.fields) {
        setStandardFields(res.data.fields);
      }
      // 默认全选
      setSelectedFieldIds(res.data.fields.map((f: StandardField) => f.id));
    } else {
      message.error(res?.data?.detail || "Failed to fetch standard template");
    }
    setLoading(false);
  };

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    if (checked) {
      setSelectedFieldIds([...selectedFieldIds, fieldId]);
    } else {
      setSelectedFieldIds(selectedFieldIds.filter((id) => id !== fieldId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFieldIds(standardFields.map((f) => f.id));
    } else {
      setSelectedFieldIds([]);
    }
  };

  const handleCreate = async () => {
    if (!templateName.trim()) {
      setTemplateNameError("Template name is required");
      return;
    }

    if (selectedFieldIds.length === 0) {
      setTemplateNameError("At least one field is required");
      return;
    }

    setLoading(true);
    try {
      // 构建选中的 fields 数据
      const selectedFields = standardFields
        .filter((f) => selectedFieldIds.includes(f.id))
        .map((f) => ({
          name: f.name,
          notes: f.notes,
          field_type: f.field_type,
          config_json: f.config_json || "",
        }));

      // 构建提交数据
      const payload = {
        company_id: company_id,
        name: templateName.trim(),
        fields: selectedFields,
        analysis_ai_prompt: standardTemplateInfo?.analysis_ai_prompt || "",
      };

      const res = await createTemplate(payload);
      if (res.status === "success") {
        message.success("Template created successfully");
        onSuccess(res.data);
        onClose();
      } else {
        message.error(res?.data?.detail || "Failed to create template");
      }
    } catch (error) {
      console.error("Error creating template:", error);
      message.error("An error occurred while creating template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      title={null}
      centered={true}
      width={700}
      footer={null}
      onCancel={onClose}
    >
      <div className="px-4 h-[700px] flex flex-col gap-6 py-4 font-nunito">
        <div>
          <div className="pt-2 pb-1 text-forumBlue-normal text-base">New Template</div>
          <div className="text-grey-normal text-xs">Create a new template for CATO to create your takeoff lists.</div>
        </div>
        {/* Template Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm">Template Name <span className="text-red-500">*</span></label>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className={`h-[28px] rounded-md text-xs ${templateNameError ? 'border-red-500' : 'border-primaryN30'}`}
            placeholder="Template Name"
            status={templateNameError ? "error" : undefined}
            required
          />
          {templateNameError && (
            <span className="text-xs text-red-500">{templateNameError}</span>
          )}
        </div>

        {/* Standard Fields Section */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-grey-normal">
              Include this Standard Prompt Fields:
            </span>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="text-xs"
            >
              Select All
            </Checkbox>
          </div> */}

          {/* Fields Grid - Two Columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 overflow-y-auto py-2">
            {standardFields.map((field) => (
              <Checkbox
                key={field.id}
                checked={selectedFieldIds.includes(field.id)}
                onChange={(e) => handleFieldToggle(field.id, e.target.checked)}
                className="custom-checkbox text-xs text-grey-normal"
                disabled={
                  field.name === 'Label' ||
                  field.name === 'Sub Label' ||
                  field.name === 'Product' ||
                  field.name === 'Quantity'
                }
              >
                <span className="text-sm">{field.name}</span>
              </Checkbox>
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between gap-3 pt-2 border-t border-primaryN30">
          <div>
            {/* <button
              className={`w-[80px] h-[26px] flex items-center justify-center rounded-lg text-xs transition-colors bg-forumBlue-light-hover text-forumBlue-dark-active`}
              onClick={() => onAddPrompt()}
            >
              <PlusOutlined className="text-xs" />
              <span>Prompt</span>
            </button> */}
          </div>
          <div>
            <Button className="custom-default-btn" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="ml-2 custom-primary-btn !w-[60px]"
              onClick={handleCreate}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
      {loading && <LoadingScreen isLoading={loading} />}
    </Modal>
  );
};
