"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Input, Checkbox, message } from "antd";
import { createTemplate, getTemplateById } from "@/services/templateService";
import { useUser } from "@/context/UserContext";
import LoadingScreen from "@/components/loading-screen";


interface StandardField {
  id: string;
  name: string;
  notes: string;
  field_type: string;
}

interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewTemplateModal = ({
  isOpen,
  onClose,
  onSuccess,
}: NewTemplateModalProps) => {
  const [templateName, setTemplateName] = useState("");
  const [standardTemplateInfo, setStandardTemplateInfo] = useState<any>(null);
  const [standardFields, setStandardFields] = useState<StandardField[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
    }
  }, [isOpen]);

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
      message.error("Please enter template name");
      return;
    }

    if (selectedFieldIds.length === 0) {
      message.error("Please select at least one field");
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
        onSuccess();
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

  const allSelected =
    standardFields.length > 0 &&
    selectedFieldIds.length === standardFields.length;
  const someSelected =
    selectedFieldIds.length > 0 &&
    selectedFieldIds.length < standardFields.length;

  return (
    <Modal
      open={isOpen}
      title={null}
      centered={true}
      width={700}
      footer={null}
      onCancel={onClose}
    >
      <div className="h-[700px] flex flex-col gap-5 py-4 font-nunito">
        <div className="py-2 text-forumBlue-normal text-lg">New Template</div>
        {/* Template Name */}
        <div className="flex items-center gap-4">
          <label className="w-[60px] text-xs text-grey-normal">Name</label>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="border-primaryN30 rounded-md text-xs"
            placeholder="Template Name"
          />
        </div>

        {/* Standard Fields Section */}
        <div className="flex-1 flex flex-col">
          <div className="mb-2 flex items-center justify-between">
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
          </div>

          {/* Fields Grid - Two Columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 overflow-y-auto py-2">
            {standardFields.map((field) => (
              <Checkbox
                key={field.id}
                checked={selectedFieldIds.includes(field.id)}
                onChange={(e) => handleFieldToggle(field.id, e.target.checked)}
                className="text-xs text-grey-normal"
              >
                {field.name}
              </Checkbox>
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-primaryN30">
          <Button className="custom-default-btn" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="custom-primary-btn"
            onClick={handleCreate}
            disabled={!templateName.trim() || selectedFieldIds.length === 0}
          >
            Create
          </Button>
        </div>
      </div>
      {loading && <LoadingScreen isLoading={loading} />}
    </Modal>
  );
};
