"use client";

import { useEffect, useState } from "react";
import { AllPromptsList } from "./AllPromptsList";
import { FieldEditorModal } from "./FieldEditorModal";
import { createField, updateField } from "@/services/templateService";
import { message } from "antd";

import { FieldEditor } from "./FieldEditor";

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
}

export const PromptEditor = ({
  templateId,
  setTemplateId,
  templateContent,
  setLoading,
  subFieldName,
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

  // 打开编辑弹窗
  const handleEditField = (field: any) => {
    setModalMode("edit");
    setEditingField(field);
    setIsModalOpen(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingField(null);
  };

  // 提交表单（新建或编辑）
  const handleSubmit = async (formData: any) => {
    setLoading(true);

    try {
      if (modalMode === "create") {
        // 新建 Field
        const res = await createField(templateId?.toString() || "", formData);
        if (res.status === "success") {
          message.success("Field created successfully");
          // 刷新字段列表
          setFields([...fields, res.data]);
          setSelectedFieldId(res.data.name);
        } else {
          message.error(res?.data?.detail || "Failed to create field");
        }
      } else {
        // 编辑 Field
        const res = await updateField(
          templateId?.toString() || "",
          editingField?.id || "",
          formData
        );
        if (res.status === "success") {
          message.success("Field updated successfully");
          // 更新字段列表
          setFields(fields.map(f => f.id === editingField.id ? res.data : f));
        } else {
          message.error(res?.data?.detail || "Failed to update field");
        }
      }
      handleCloseModal();
    } catch (error) {
      message.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-row gap-20 h-full">
      {/* Left Sidebar - All Prompts List */}
      <AllPromptsList
        fields={fields}
        selectedFieldId={selectedFieldId}
        onSelectField={handleSelectField}
        onCreatePrompt={handleCreatePrompt}
      />

      {/* Right Content - Field Display */}
      <div className="flex-1 overflow-y-auto">
        <FieldEditor
          templateId={templateId as number}
          field={editingField as any}
        />
      </div>

      {/* Field Editor Modal */}
      <FieldEditorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        field={editingField}
        templateId={templateId as number}
      />
    </div>
  );
};
