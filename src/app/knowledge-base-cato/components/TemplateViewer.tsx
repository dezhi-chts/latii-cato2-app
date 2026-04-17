"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TemplateList } from "./TemplateList";
import { SubTabs } from "./SubTabs";
import ReactMarkdown from "react-markdown";
import { EditOutlined } from "@ant-design/icons";

import { FieldEvent, MainTab, TemplateEvent } from "@/app/knowledge-base-cato/page";
import { FieldEditor } from "./FieldEditor";
import { Popover } from "antd";
import Image from "next/image";


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
  onDownloadTemplate: (templateId: number, name: string) => void;
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
  onDownloadTemplate,
}: TemplateViewerProps) => {
  const [activeSubTab, setActiveSubTab] = useState<string>('');
  const [activeFieldContent, setActiveFieldContent] = useState<any>({});

  const subTabs = useMemo(() => {
    let fields = templateContent?.fields || [];
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

  useEffect(()=>{
    // 模版更改的时候需要清空当前activeSubTab
    setActiveSubTab('');
  },[templateId])

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
          <span>Template creator: {templateContent?.create_user || ''}</span>
        </div>
        <SubTabs
          templateId={templateId as number}
          templateInfo={templateList.find((item: any) => item.id === templateId)}
          tabs={subTabs}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
          onAddField={() => console.log("Add new field")}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto my-8 px-10 py-5 relative rounded-xl border border-primaryN30">
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
            templateInfo={templateList.find((item: any) => item.id === templateId)}
            field={activeFieldContent}
            onUpdateField={handleFieldUpdate}
          />
        </div>
      </div>
    </div>
  );
};
