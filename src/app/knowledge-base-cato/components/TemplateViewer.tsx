"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TemplateList } from "./TemplateList";
import { SubTabs } from "./SubTabs";
import ReactMarkdown from "react-markdown";
import { EditOutlined } from "@ant-design/icons";

import { FieldEvent, MainTab, TemplateEvent } from "@/app/knowledge-base-cato/page";
import { FieldEditor } from "./FieldEditor";
import { Input, Modal, Popover } from "antd";
import Image from "next/image";
import { updateTemplate } from "@/services/templateService";
import { notify } from "@/utils/notify";
import { useUser } from "@/context/UserContext";


const GENERATIONS = 'Generations';

interface TemplateViewerProps {
  templateList: any[];
  templateId: number | null;
  setTemplateId: (id: number | null) => void;
  templateContent: any;
  onChangeMainTab: (tab: MainTab) => void;
  onChangeSubTab: (name: string) => void;
  onUpdateTemplate: (eventName: TemplateEvent, data: any) => void;
  onUpdateField: (eventName: FieldEvent, data: any) => void;
  openCreateTemplateSignal: number;
  onConsumeCreateTemplateSignal: () => void;
  onDownloadTemplate: (templateId: number, name: string) => void;
  onRefreshTemplateContent: (templateId: number) => Promise<void> | void;
}
export const TemplateViewer = ({
  templateList,
  templateId,
  setTemplateId,
  templateContent,
  onChangeMainTab,
  onChangeSubTab,
  onUpdateTemplate,
  onUpdateField,
  openCreateTemplateSignal,
  onConsumeCreateTemplateSignal,
  onDownloadTemplate,
  onRefreshTemplateContent,
}: TemplateViewerProps) => {
  const { username } = useUser();
  const [activeSubTab, setActiveSubTab] = useState<string>('');
  const [activeFieldContent, setActiveFieldContent] = useState<any>({});
  const [isGenerationsEditModalOpen, setIsGenerationsEditModalOpen] = useState(false);
  const [generationsDraft, setGenerationsDraft] = useState("");
  const [isUpdatingGenerations, setIsUpdatingGenerations] = useState(false);

  const templateInfo = useMemo(() => {
    return templateList.find((item: any) => item.id === templateId);
  }, [templateId, templateList]);

  const canEditGenerations = useMemo(() => {
    if (!templateInfo) return false;
    const isStandardTemplate = templateInfo.id === 1;
    const isCompanyTemplate = templateInfo.create_user !== username;
    if (isStandardTemplate || isCompanyTemplate) return false;
    return templateInfo.is_edit !== false;
  }, [templateInfo, username]);

  const subTabs = useMemo(() => {
    let fields = templateContent?.fields || [];
    if (!fields.find((item: any) => item.name === GENERATIONS)) {
      fields.unshift({
        name: GENERATIONS,
        config_json: {
          available_values: [],
          extraction_rules: [templateContent?.analysis_ai_prompt || ""],
        },
      });
    }

    if (fields.length > 0) {
      let findActiveSub = fields.find((item: any) => item.name === activeSubTab);
      if (activeSubTab === '' || !findActiveSub) {
        setActiveSubTab(fields[0]?.name || '');
      } else if (findActiveSub) {
        setActiveSubTab(findActiveSub.name);
      } else {
        setActiveSubTab(fields[0]?.name || '');
      }
    }
    return fields;
  }, [templateContent, activeSubTab]);

  useEffect(() => {
    // 模版更改的时候需要清空当前activeSubTab
    setActiveSubTab('');
  }, [templateId])

  useEffect(() => {
    if (activeSubTab === GENERATIONS) {
      setActiveFieldContent({
        name: GENERATIONS,
        config_json: {
          available_values: [],
          extraction_rules: [templateContent?.analysis_ai_prompt || ""],
        },
      });
    }
    let field = subTabs.find((item: any) => item.name === activeSubTab);
    if (field) {
      setActiveFieldContent(field);
    }
    // 触发子字段ID变化
    onChangeSubTab(activeSubTab);
  }, [activeSubTab, subTabs, onChangeSubTab]);

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
    setIsUpdatingGenerations(true);
    try {
      const response = await updateTemplate(String(templateId), {
        analysis_ai_prompt: generationsDraft,
      });
      if (response.status !== "success") {
        notify.error({
          title: "Error",
          description: "Failed to update GENERATIONS content.",
        });
        return;
      }
      notify.success({
        title: "Success",
        description: "GENERATIONS content updated successfully.",
      });
      setIsGenerationsEditModalOpen(false);
      await onRefreshTemplateContent(templateId);
    } finally {
      setIsUpdatingGenerations(false);
    }
  };

  return (
    <div className="flex flex-row gap-20 h-full">
      {/* Template List */}
      <div className="h-full">
        <TemplateList
          templates={templateList}
          selectedTemplateId={templateId}
          onSelectTemplate={setTemplateId}
          onUpdateTemplate={onUpdateTemplate}
          openCreateTemplateSignal={openCreateTemplateSignal}
          onConsumeCreateTemplateSignal={onConsumeCreateTemplateSignal}
          onDownloadTemplate={onDownloadTemplate}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub Tabs */}
        <div className="flex items-center gap-2 text-xs text-grey-normal">
          <Popover
            placement="rightBottom"
            title={null}
            content={
              <div className="py-1 w-[240px] flex flex-col">

              </div>
            }
            trigger="hover"
          >
            <Image
              src="/assets/icons/info-forum-blue.svg"
              alt="info circle icon"
              className="cursor-pointer"
              width={14}
              height={14}
            ></Image>
          </Popover>
          <span>Template creator: {templateContent?.id === 1 ? 'System' : templateContent?.create_user || ''}</span>
        </div>
        <SubTabs
          templateId={templateId as number}
          templateInfo={templateInfo}
          tabs={subTabs}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          onAddField={() => console.log("Add new field")}
        />

        {/* Content */}
        <div className="flex-1 my-8 px-10 py-5 relative rounded-xl border border-primaryN30 overflow-hidden">
          {activeSubTab === GENERATIONS && canEditGenerations && (
            <div className="top-5 right-16 absolute z-10">
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
            {activeSubTab === GENERATIONS ? (
              <div className={`text-sm ${canEditGenerations ? "pt-10" : ""}`}>
                <ReactMarkdown>
                  {templateContent?.analysis_ai_prompt || "No GENERATIONS content."}
                </ReactMarkdown>
              </div>
            ) : (
              <FieldEditor
                templateId={templateId as number}
                templateInfo={templateInfo}
                field={activeFieldContent}
                onUpdateField={handleFieldUpdate}
              />
            )}
          </div>
        </div>
      </div>
      <Modal
        open={isGenerationsEditModalOpen}
        title="Edit GENERATIONS"
        onCancel={() => setIsGenerationsEditModalOpen(false)}
        onOk={handleSaveGenerations}
        okText="Save"
        cancelText="Cancel"
        confirmLoading={isUpdatingGenerations}
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
