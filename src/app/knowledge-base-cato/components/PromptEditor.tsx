"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AllPromptsList } from "./AllPromptsList";
import { FieldEditorModal } from "./FieldEditorModal";

import { FieldEditor } from "./FieldEditor";
import { FieldEvent } from "../page";
import {
  copyField,
  deleteField,
  updateFieldIndex,
  updateTemplate,
} from "@/services/templateService";
import { Input, Modal, message } from "antd";
import { TemplateList } from "./TemplateList";
import ReactMarkdown from "react-markdown";
import { EditOutlined } from "@ant-design/icons";
import { useUser } from "@/context/UserContext";
import { notify } from "@/utils/notify";

// Field 数据类型
interface PromptField {
  id: string;
  name: string;
}

const GENERATIONS = "Generations";
const GENERATIONS_FIELD_ID = "__generations__";

interface PromptEditorProps {
  templateId: number | null;
  setTemplateId: (id: number | null) => void;
  templateList: any[];
  templateContent: any;
  setLoading: (loading: boolean) => void;
  subFieldName: string | null;
  onUpdateField: (eventName: FieldEvent, data: any) => void;
  onRefreshTemplatePrompt?: () => void;
}

export const PromptEditor = ({
  templateId,
  setTemplateId,
  templateList,
  templateContent,
  setLoading,
  subFieldName,
  onUpdateField,
  onRefreshTemplatePrompt,
}: PromptEditorProps) => {
  const { username } = useUser();
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');

  // Modal 状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingField, setEditingField] = useState<any>(null);
  const [isGenerationsEditModalOpen, setIsGenerationsEditModalOpen] = useState(false);
  const [generationsDraft, setGenerationsDraft] = useState("");
  const [isSavingGenerations, setIsSavingGenerations] = useState(false);

  const templateInfo = useMemo(() => {
    return templateList?.find((item: any) => item.id === templateId);
  }, [templateId, templateList]);

  const canEditGenerations = useMemo(() => {
    if (!templateInfo) return false;
    const isStandardTemplate = templateInfo.id === 1;
    const isCompanyTemplate = templateInfo.create_user !== username;
    if (isStandardTemplate || isCompanyTemplate) return false;
    return templateInfo.is_edit !== false;
  }, [templateInfo, username]);

  useEffect(() => {
    const rawFields = Array.isArray(templateContent?.fields)
      ? templateContent.fields
      : [];
    const generationsFieldFromApi = rawFields.find(
      (item: any) => item?.name === GENERATIONS,
    );
    const nonGenerationsFields = rawFields.filter(
      (item: any) => item?.name !== GENERATIONS,
    );

    // Keep GENERATIONS as the first item with a stable id
    // so it won't disappear when template data refreshes.
    setFields([
      {
        ...(generationsFieldFromApi || {}),
        id: generationsFieldFromApi?.id || GENERATIONS_FIELD_ID,
        name: GENERATIONS,
      },
      ...nonGenerationsFields,
    ]);
  }, [templateContent?.fields, templateId]);

  useEffect(() => {
    if (subFieldName) {
      setSelectedFieldId(subFieldName);
    }
  }, [subFieldName]);

  useEffect(() => {
    if (selectedFieldId) {
      if (selectedFieldId === GENERATIONS) {
        setEditingField(null);
        return;
      }
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

  const handleOpenEditGenerations = () => {
    setGenerationsDraft(templateContent?.analysis_ai_prompt || "");
    setIsGenerationsEditModalOpen(true);
  };

  const handleSaveGenerations = async () => {
    if (!templateId) return;
    setIsSavingGenerations(true);
    try {
      const response = await updateTemplate(String(templateId), {
        analysis_ai_prompt: generationsDraft,
      });
      if (response.status !== "success") {
        notify.error({
          title: "Error",
          description: response?.data?.detail || "Failed to update GENERATIONS content.",
        });
        return;
      }
      notify.success({
        title: "Success",
        description: "GENERATIONS content updated successfully.",
      });
      setIsGenerationsEditModalOpen(false);
      onRefreshTemplatePrompt?.();
    } finally {
      setIsSavingGenerations(false);
    }
  };

  // 复制 field
  const handleCopyField = useCallback(async (fieldId: string) => {
    if (!templateId) return;
    setLoading(true);
    const result = await copyField(templateId, fieldId);
    if (result.status === "success") {
      message.success("Field copied successfully");
      onRefreshTemplatePrompt?.();
    } else {
      message.error("Failed to copy field");
    }
    setLoading(false);
  }, [templateId, setLoading, onRefreshTemplatePrompt]);

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
      onRefreshTemplatePrompt?.();
    } else {
      message.error("Failed to delete field");
    }
    setLoading(false);
  }, [templateId, setLoading, onRefreshTemplatePrompt, fields, selectedFieldId]);

  // 更新 field 索引
  const handleUpdateFieldIndex = useCallback(async (fieldId: string, index: number) => {
    let res = await updateFieldIndex(templateId as number, fieldId, index);
    if (res.status === "success") {
      message.success("Field index updated successfully");
      onRefreshTemplatePrompt?.();
    } else {
      message.error("Failed to update field index");
    }
  }, [templateId, onRefreshTemplatePrompt]);

  return (
    <div className="flex flex-row gap-20 h-full">
      {/* Left Sidebar - All Prompts List */}
      <div>
        <div className="pb-4 text-xs text-grey-normal">Template: {templateInfo?.name}</div>
        <AllPromptsList
          fields={fields}
          selectedFieldId={selectedFieldId}
          onSelectField={handleSelectField}
          onCreatePrompt={handleCreatePrompt}
          onCopyField={handleCopyField}
          onDeleteField={handleDeleteField}
          onUpdateFieldIndex={handleUpdateFieldIndex}
        />
      </div>

      {/* Right Content - Field Display */}
      <div className="flex-1 border border-primaryN30 rounded-xl px-10 py-5 relative overflow-hidden">
        {selectedFieldId === GENERATIONS && canEditGenerations && (
          <div className="absolute top-5 right-16 z-10">
            <button
              className="rounded-md border border-primaryN30 px-2"
              onClick={handleOpenEditGenerations}
            >
              <EditOutlined className="text-xs text-grey-normal" />
              <span className="ml-2 text-xs text-grey-normal">Edit</span>
            </button>
          </div>
        )}
        <div className="h-full overflow-y-auto">
          {selectedFieldId === GENERATIONS ? (
            <div className={`text-sm ${canEditGenerations ? "pt-10" : ""}`}>
              <ReactMarkdown>
                {templateContent?.analysis_ai_prompt || "No GENERATIONS content."}
              </ReactMarkdown>
            </div>
          ) : (
            selectedFieldId && (
              <FieldEditor
                templateId={templateId as number}
                templateInfo={templateInfo}
                field={editingField as any}
                onUpdateField={handleFieldUpdate}
              />
            )
          )}
        </div>
      </div>

      {/* Field Editor Modal */}
      <FieldEditorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        field={editingField}
        templateId={templateId as number}
        templateInfo={templateInfo}
        onUpdateField={handleFieldUpdate}
      />
      <Modal
        open={isGenerationsEditModalOpen}
        title="Edit GENERATIONS"
        onCancel={() => setIsGenerationsEditModalOpen(false)}
        onOk={handleSaveGenerations}
        okText="Save"
        cancelText="Cancel"
        confirmLoading={isSavingGenerations}
      >
        <Input.TextArea
          rows={14}
          value={generationsDraft}
          onChange={(e) => setGenerationsDraft(e.target.value)}
          placeholder="Input GENERATIONS markdown content"
        />
      </Modal>
    </div>
  );
};
