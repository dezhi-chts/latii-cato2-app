"use client";

import { useEffect, useRef, useState } from "react";
import { ConfigProvider, notification, Modal, message } from "antd";
import Header from "./components/Header";
import { TemplateViewer } from "./components/TemplateViewer";
import { PromptEditor } from "./components/PromptEditor";
import {
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  setTemplateDefault,
  copyTemplate,
  updateField,
  createField,
} from "@/services/templateService";
import LoadingScreen from "@/components/loading-screen";

const { confirm } = Modal;

// 主 Tab 类型
export enum MainTab {
  YourTemplates = "Your Templates",
  PromptLibrary = "Prompt Library",
}

const mainTabList = [
  MainTab.YourTemplates,
  MainTab.PromptLibrary,
];

// templete更改事件类型
export enum TemplateEvent {
  UpdateName = "updateName",
  UpdateValueDefault = "updateValueDefault",
  Create = "create",
  Delete = "delete",
  Copy = "copy",
}

export enum FieldEvent {
  Update = "update",
  Create = "create",
  Delete = "delete",
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
    setLoading(true);
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
    setLoading(false);
  };

  // 获取模版内容
  const fetchTemplateContent = async (id: number) => {
    // 将模版内容设置为空，避免在获取内容时显示旧内容
    setTemplateContent(null);
    setLoading(true);
    const response = await getTemplateById(id);
    if (response.status === "success") {
      setTemplateContent(response.data);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to fetch template content",
      });
    }
    setLoading(false);
  };

  // 设置默认模版
  const handleTemplateDefault = async (templateId: number) => {
    setTemplateList((prev) => {
      let list = prev.map((template) => {
        return {
          ...template,
          is_default: template.id === templateId,
        }
      });
      return list;
    });
    handleSetDefaultTemplate(templateId);
  };

  // 更新模版名称
  const handleUpdateTemplateName = async (templateId: number, name: string) => {
    let updatedTemplate = templateList.find((template) => template.id === templateId);
    updatedTemplate.name = name;
    setTemplateList(templateList.map((template) => {
      return {
        ...template,
        name: template.id === templateId ? name : template.name,
      }
    }));
    sendUpdateTemplate(templateId, updatedTemplate);
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (templateId === 1) return; // 标准模版不允许删除
    confirm({
      title: "Are you sure you want to delete this template?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        sendDeleteTemplate(templateId);
      },
    })
  };

  // 发送模版更新请求
  const sendUpdateTemplate = async (templateId: number, updatedTemplate: any) => {
    // 同步当前默认状态到服务端
    const response = await updateTemplate(templateId + '', updatedTemplate);
    if (response.status === "success") {
    } else {
      notification.error({
        message: "Error",
        description: "Failed to update template name",
      });
    }
  }

  const handleCopyTemplate = async (templateId: number, name: string) => {
    setLoading(true);
    // 发送请求
    const response = await copyTemplate(templateId, companyId, name);
    if (response.status === "success") {
      fetchTemplates();
    } else {
      notification.error({
        message: "Error",
        description: "Failed to copy template",
      });
    }
    setLoading(false);
  }

  // 发送删除模版请求
  const sendDeleteTemplate = async (templateId: number) => {
    // 同步当前默认状态到服务端
    const response = await deleteTemplate(templateId);
    if (response.status === "success") {
      fetchTemplates();
    } else {
      notification.error({
        message: "Error",
        description: "Failed to delete template",
      });
    }
  }

  // 设置默认模版
  const handleSetDefaultTemplate = async (templateId: number) => {
    // 同步当前默认状态到服务端
    const response = await setTemplateDefault(templateId, companyId);
    if (response.status === "success") {
    } else {
      notification.error({
        message: "Error",
        description: "Failed to set default template",
      });
    }
  }

  // 更新field信息
  const sendUpdateField = async (templateId: number, fieldId: string, fieldData: any) => {
    // 同步当前默认状态到服务端
    console.log('########## sendUpdateField', templateId, fieldId, fieldData);
    const response = await updateField(templateId, fieldId, fieldData);
    if (response.status === "success") {
    } else {
      notification.error({
        message: "Error",
        description: "Failed to update field",
      });
    }
  }

  // 模版更新事件处理
  const handleUpdateTemplate = (eventName: TemplateEvent, data: any) => {
    if (eventName === TemplateEvent.Create) {
      fetchTemplates();
    } else if (eventName === TemplateEvent.UpdateValueDefault) {
      handleTemplateDefault(data.template_id);
    } else if (eventName === TemplateEvent.UpdateName) {
      handleUpdateTemplateName(data.template_id, data.name);
    } else if (eventName === TemplateEvent.Delete) {
      handleDeleteTemplate(data.template_id);
    } else if (eventName === TemplateEvent.Copy) {
      handleCopyTemplate(data.template_id, data.name);
    }
  };

  const handleUpdateField = (eventName: FieldEvent, data: any) => {
    if (eventName === FieldEvent.Create) {
      fetchTemplateContent(data.template_id);
    } else if (eventName === FieldEvent.Update) {
      setTemplateContent((prev: any) => ({
        ...prev,
        fields: prev.fields.map((field: any) => {
          return field.id === data.field_id ? {
            ...field,
            ...data.fieldData,
          } : field;
        }),
      }));
      sendUpdateField(data.template_id, data.field_id, data.fieldData);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="px-14 h-[110px] flex items-center border-b border-primaryN30">
        <Header />
      </div>

      <div className="px-14 py-6 w-full flex flex-row gap-4">
        {/* Main Tab Switcher */}
        {mainTabList.map((tab: MainTab) => (
          <div key={tab} className={`w-[140px] h-[30px] flex items-center justify-center text-xs rounded-md cursor-pointer ${tab === activeMainTab ? 'font-bold text-grey-dark bg-forumBlue-light' : 'text-grey-light-strong'}`}
            onClick={() => {
              if (templateId === 1 && tab === MainTab.PromptLibrary) {
                // 默认模版禁止切换到 PromptLibrary，因为 PromptLibrary 是用户自定义的模版
                message.error('Standard template is not allowed to switch to PromptLibrary');
                return;
              }
              setActiveMainTab(tab)
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="px-14 pb-10 flex-1 overflow-hidden">
        {/* Tab 内容切换 */}
        {activeMainTab === MainTab.YourTemplates ? (
          <TemplateViewer
            templateList={templateList}
            templateId={templateId}
            setTemplateId={setTemplateId}
            templateContent={templateContent}
            onChangeSubTab={(id) => subFieldId.current = id}
            onChangeMainTab={setActiveMainTab}
            onUpdateTemplate={handleUpdateTemplate}
            onUpdateField={handleUpdateField}
          />
        ) : (
          <PromptEditor
            templateId={templateId}
            setTemplateId={setTemplateId}
            templateContent={templateContent}
            subFieldName={subFieldId.current}
            setLoading={setLoading}
            onUpdateField={handleUpdateField}
            onRefreshTemplate={() => templateId && fetchTemplateContent(templateId)}
          />
        )}
      </div>
      {loading && <LoadingScreen isLoading={loading} />}
    </div>
  );
};

export default Page;
