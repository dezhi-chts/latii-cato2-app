"use client";

import { useEffect, useRef, useState } from "react";
import { ConfigProvider, notification, Tabs } from "antd";
import Header from "./components/Header";
import { TemplateViewer } from "./components/TemplateViewer";
import { PromptEditor } from "./components/PromptEditor";
import {
  getTemplates,
  getTemplateById,
} from "@/services/templateService";
import LoadingScreen from "@/components/loading-screen";

// 主 Tab 类型
export enum MainTab {
  YourTemplates = "your-templates",
  PromptLibrary = "prompt-library",
}

const Page = () => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>(
    MainTab.YourTemplates
  );

  // 模版列表
  const [templateList, setTemplateList] = useState<any[]>([]);
  // 当前选中模版ID
  const [templateId, setTemplateId] = useState<number | null>(null);
  // 当前选中模版的内容
  const [templateContent, setTemplateContent] = useState<any>(null);
  // 当前选中FieldID
  const subFieldId = useRef<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 公司ID - 可以从用户信息或其他地方获取，这里暂时硬编码为1
  const companyId = 1;

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (templateId) {
      // 获取模版内容
      fetchTemplateContent(templateId);
    }
  }, [templateId]);


  // 获取模版列表
  const fetchTemplates = async () => {
    const response = await getTemplates();
    if (response.status === "success") {
      let list = response.data?.items || [];
      let fixed = { id: 1, name: "Standard Prompt" };
      list.unshift(fixed);
      setTemplateId(fixed.id);
      setTemplateList(list);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to fetch templates",
      });
    }
  };

  // 获取模版内容
  const fetchTemplateContent = async (id: number) => {
    const response = await getTemplateById(id);
    if (response.status === "success") {
      setTemplateId(id);
      setTemplateContent(response.data);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to fetch template content",
      });
    }
  };

  // 模版创建成功后,刷新模版列表
  const handleTemplateCreated = () => {
    fetchTemplates();
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="px-14 h-[80px] flex items-center ">
        <Header />
      </div>

      <div className="px-14 w-full flex flex-col border-b border-primaryN30">
        {/* Main Tab Switcher */}
        <ConfigProvider
          theme={{
            components: {
              Tabs: {
                inkBarColor: "#555555",
                itemSelectedColor: "#555555",
                itemColor: "#A3A3A3",
                itemHoverColor: "#555555",
              },
            },
          }}
        >
          <Tabs
            activeKey={activeMainTab}
            onChange={(key) => setActiveMainTab(key as MainTab)}
            items={[
              {
                key: MainTab.YourTemplates,
                label: "Your Templates",
              },
              {
                key: MainTab.PromptLibrary,
                label: "Prompt Library",
                disabled: true,
              },
            ]}
            className="[&_.ant-tabs-tab]:text-xs [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav::before]:border-b-0 [&_.ant-tabs-tab]:px-2"
          />
        </ConfigProvider>
      </div>

      <div className="px-14 py-10 flex-1 overflow-hidden">
        {/* Tab 内容切换 */}
        {activeMainTab === MainTab.YourTemplates ? (
          <TemplateViewer
            templateList={templateList}
            templateId={templateId}
            setTemplateId={setTemplateId}
            templateContent={templateContent}
            onChangeSubTab={(id) => subFieldId.current = id}
            onChangeMainTab={setActiveMainTab}
            onTemplateCreated={handleTemplateCreated}
          />
        ) : (
          <PromptEditor
            templateId={templateId}
            setTemplateId={setTemplateId}
            templateContent={templateContent}
            subFieldName={subFieldId.current}
            setLoading={setLoading}
          />
        )}
      </div>
      {loading && <LoadingScreen isLoading={loading} />}
    </div>
  );
};

export default Page;
