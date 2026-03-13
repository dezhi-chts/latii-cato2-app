"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TemplateList } from "./TemplateList";
import { SubTabs } from "./SubTabs";
import ReactMarkdown from "react-markdown";
import { EditOutlined } from "@ant-design/icons";

import { MainTab, TemplateEvent } from "@/app/knowledge-base-cato/page";
import { FieldEditor } from "./FieldEditor";

const GENERATIONS = 'Generations';

interface TemplateViewerProps {
  templateList: any[];
  templateId: number | null;
  setTemplateId: (id: number | null) => void;
  templateContent: any;
  onChangeMainTab: (tab: MainTab) => void;
  onChangeSubTab: (name: string) => void;
  onUpdateTemplate: (eventName: TemplateEvent, data: any) => void;
}
export const TemplateViewer = ({
  templateList,
  templateId,
  setTemplateId,
  templateContent,
  onChangeMainTab,
  onChangeSubTab,
  onUpdateTemplate,
}: TemplateViewerProps) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(GENERATIONS);
  const [activeFieldContent, setActiveFieldContent] = useState<any>({});

  useEffect(() => {
    // 模版切换的时候，重新设置子标签
    setActiveSubTab(GENERATIONS);
  }, [templateId]);

  const subTabs = useMemo(() => {
    return templateContent?.fields || [];
  }, [templateContent]);

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
        onUpdateTemplate={onUpdateTemplate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub Tabs */}
        <SubTabs
          templateId={templateId as number}
          tabs={subTabs}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          onAddField={() => console.log("Add new field")}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-8 relative">
          {/** 编辑按钮 */}
          {/* {activeSubTab !== GENERATIONS && (
            <div className="absolute top-10 right-4">
              <button
                className="rounded-md border border-primaryN30 px-2"
                onClick={() => handleFieldEdit()}
              >
                <EditOutlined className="text-xs text-grey-normal" />
                <span className="ml-2 text-xs text-grey-normal">Edit</span>
              </button>
            </div>
          )} */}
          <FieldEditor
            templateId={templateId as number}
            field={activeFieldContent}
          />
        </div>
      </div>
    </div>
  );
};
