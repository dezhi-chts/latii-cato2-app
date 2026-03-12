"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TemplateList } from "./TemplateList";
import { SubTabs } from "./SubTabs";
import ReactMarkdown from "react-markdown";
import { EditOutlined } from "@ant-design/icons";

import { MainTab } from "@/app/knowledge-base-cato/page";

const GENERATIONS = 'Generations';

interface TemplateViewerProps {
  templateList: any[];
  templateId: number | null;
  setTemplateId: (id: number | null) => void;
  templateContent: any;
  onChangeMainTab: (tab: MainTab) => void;
  onChangeSubTab: (name: string) => void;
  onTemplateCreated: () => void;
}
export const TemplateViewer = ({
  templateList,
  templateId,
  setTemplateId,
  templateContent,
  onChangeMainTab,
  onChangeSubTab,
  onTemplateCreated,
}: TemplateViewerProps) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(GENERATIONS);
  const [activeFieldContent, setActiveFieldContent] = useState<any>({});

  const subTabs = useMemo(() => {
    return templateContent?.fields || [];
  }, [templateContent]);

  useEffect(() => {
    if (activeSubTab === GENERATIONS) {
      setActiveFieldContent({
        name: GENERATIONS,
      });
    }
    let field = subTabs.find((item: any) => item.name === activeSubTab);
    if (field) {
      setActiveFieldContent(field);
    }
    // 触发子字段ID变化
    onChangeSubTab(activeSubTab);
  }, [activeSubTab, subTabs, onChangeSubTab]);

  const rules = useMemo(() => {
    return activeFieldContent?.config_json?.extraction_rules || [];
  }, [activeFieldContent]);

  const handleFieldEdit = useCallback(() => {
    onChangeMainTab(MainTab.PromptLibrary);
  }, [activeSubTab]);

  return (
    <div className="flex flex-row gap-20 h-full">
      {/* Template List */}
      <TemplateList
        templates={templateList}
        selectedTemplateId={templateId}
        onSelectTemplate={setTemplateId}
        onTemplateCreated={onTemplateCreated}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub Tabs */}
        <SubTabs
          templateId={templateId?.toString() || ""}
          tabs={subTabs}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          onAddField={() => console.log("Add new field")}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {/* Title Section */}
          {
            activeFieldContent?.name === GENERATIONS ? (
              <div className="mb-6">
                <ReactMarkdown>
                  {templateContent?.analysis_ai_prompt &&
                    templateContent.analysis_ai_prompt.replace(/\n/g, "  \n")}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="mb-6 flex flex-col gap-5">
                <div>
                  <p className="text-base">Prompt Label</p>
                  <p className="text-sm text-grey-normal">{activeFieldContent?.name}</p>
                </div>
                <div>
                  <p className="text-base">Type</p>
                  <p className="text-sm text-grey-normal">{activeFieldContent?.field_type}</p>
                </div>
                <div>
                  <p className="text-base">Extraction Rules</p>
                  <p className="text-sm text-grey-normal">
                    {
                      rules.map((rule: any, index: number) => (
                        <p key={index}>{index + 1}. {rule}</p>
                      ))
                    }</p>
                </div>
              </div>
            )
          }
          {/** 编辑按钮 */}
          {activeSubTab !== GENERATIONS && (
            <div className="absolute top-10 right-4">
              <button
                className="rounded-md border border-primaryN30 px-2"
                onClick={() => handleFieldEdit()}
              >
                <EditOutlined className="text-xs text-grey-normal" />
                <span className="ml-2 text-xs text-grey-normal">Edit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
