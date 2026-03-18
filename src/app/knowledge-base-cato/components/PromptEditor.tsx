"use client";

import { useCallback, useEffect, useState } from "react";
import { AllPromptsList } from "./AllPromptsList";
import { FieldEditorModal } from "./FieldEditorModal";

import { FieldEditor } from "./FieldEditor";
import { FieldEvent } from "../page";
import { copyField, deleteField } from "@/services/templateService";
import { message } from "antd";

// Field 数据类型
interface PromptField {
  id: string;
  name: string;
}

interface PromptEditorProps {
  templateId: number | null;
  setTemplateId: (id: number | null) => void;
  templateContent: any;
  setLoading: (loading: boolean) => void;
  subFieldName: string | null;
  onUpdateField: (eventName: FieldEvent, data: any) => void;
  onRefreshTemplate?: () => void;
}

export const PromptEditor = ({
  templateId,
  setTemplateId,
  templateContent,
  setLoading,
  subFieldName,
  onUpdateField,
  onRefreshTemplate,
}: PromptEditorProps) => {
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');

  // Modal 状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingField, setEditingField] = useState<any>(null);

  useEffect(() => {
    if (templateContent?.fields) {
      setFields(templateContent.fields);
    }
  }, [templateContent]);

  useEffect(() => {
    if (subFieldName) {
      setSelectedFieldId(subFieldName);
    }
  }, [subFieldName]);

  useEffect(() => {
    if (selectedFieldId) {
      const field = templateContent?.fields.find((f: PromptField) => f.name === selectedFieldId);
      setEditingField(field || { id: '', name: '' });
    }
  }, [selectedFieldId, templateContent]);

  const handleSelectField = (id: string) => {
    setSelectedFieldId(id);
  };

  // 打开新建弹窗
  const handleCreatePrompt = () => {
    setModalMode("create");
    setEditingField(null);
    setIsModalOpen(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingField(null);
  };

  const handleFieldUpdate = useCallback((eventName: FieldEvent, data: any) => {
    // 直接通知父组件更新，由父组件更新 templateContent 后 subTabs 会自动刷新
    onUpdateField(eventName, data);
  }, [onUpdateField]);

  // 复制 field
  const handleCopyField = useCallback(async (fieldId: string) => {
    if (!templateId) return;
    setLoading(true);
    const result = await copyField(templateId, fieldId);
    if (result.status === "success") {
      message.success("Field copied successfully");
      onRefreshTemplate?.();
    } else {
      message.error("Failed to copy field");
    }
    setLoading(false);
  }, [templateId, setLoading, onRefreshTemplate]);

  // 删除 field
  const handleDeleteField = useCallback(async (fieldId: string) => {
    if (!templateId) return;
    setLoading(true);
    const result = await deleteField(templateId.toString(), fieldId);
    if (result.status === "success") {
      message.success("Field deleted successfully");
      // 如果删除的是当前选中的 field，清空选中状态
      const deletedField = fields.find((f) => f.id === fieldId);
      if (deletedField && deletedField.name === selectedFieldId) {
        setSelectedFieldId("");
      }
      onRefreshTemplate?.();
    } else {
      message.error("Failed to delete field");
    }
    setLoading(false);
  }, [templateId, setLoading, onRefreshTemplate, fields, selectedFieldId]);

  return (
    <div className="flex flex-row gap-20 h-full">
      {/* Left Sidebar - All Prompts List */}
      <AllPromptsList
        fields={fields}
        selectedFieldId={selectedFieldId}
        onSelectField={handleSelectField}
        onCreatePrompt={handleCreatePrompt}
        onCopyField={handleCopyField}
        onDeleteField={handleDeleteField}
      />

      {/* Right Content - Field Display */}
      <div className="flex-1 overflow-y-auto border border-primaryN30 rounded-xl px-10 py-5">
        {selectedFieldId !== 'Generations' && <FieldEditor
          templateId={templateId as number}
          field={editingField as any}
          onUpdateField={handleFieldUpdate}
        />}
      </div>

      {/* Field Editor Modal */}
      <FieldEditorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        field={editingField}
        templateId={templateId as number}
        onUpdateField={handleFieldUpdate}
      />
    </div>
  );
};
