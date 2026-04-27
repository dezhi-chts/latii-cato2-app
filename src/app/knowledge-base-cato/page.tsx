"use client";

import { useEffect, useRef, useState } from "react";
import { Button, ConfigProvider, Modal, Upload, message } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
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
  importTemplate,
  downloadTemplateJson,
} from "@/services/templateService";
import LoadingScreen from "@/components/loading-screen";
import { useUser } from "@/context/UserContext";
import { notify } from "@/utils/notify";

const { confirm } = Modal;
const { Dragger } = Upload;

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
  const [openCreateTemplateSignal, setOpenCreateTemplateSignal] = useState(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileList, setImportFileList] = useState<UploadFile[]>([]);

  // 公司ID - 可以从用户信息或其他地方获取
  const { company_id, username } = useUser();

  useEffect(() => {
    if (company_id) {
      fetchTemplates();
    }
  }, [company_id]);

  useEffect(() => {
    if (templateId) {
      // 获取模版内容
      fetchTemplateContent(templateId);
    }
  }, [templateId]);

  useEffect(() => {
    if (username !== 'Guest' && templateList.length > 0) {
      let firstTemplate = templateList.find((template: any) => template.create_user === username && template.id !== 1);
      if (firstTemplate) {
        setTemplateId(firstTemplate.id);
      } else if (templateList.length > 0) {
        setTemplateId(templateList[0].id);
      }
    }
  }, [username, templateList]);


  // 获取模版列表
  const fetchTemplates = async () => {
    setLoading(true);
    const response = await getTemplates(company_id as number);
    if (response.status === "success") {
      let list = response.data?.items || [];
      if (list.length > 0) {
        list = list.filter((template: any) => template.id !== 1);
      }
      // 将list中的标准模版放在第一位
      const standardTemplate = {
        id: 1,
        name: "Standard Template",
        create_user: "System",
      };
      list.unshift(standardTemplate);
      setTemplateList(list);
      // 找到默认模版ID，设置为当前选中模版ID，如果没找到默认模版，设置为第一个模版
    } else {
      notify.error({
        title: "Error",
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
      notify.error({
        title: "Error",
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
      notify.error({
        title: "Error",
        description: "Failed to update template name",
      });
    }
  }

  const handleCopyTemplate = async (templateId: number, name: string) => {
    setLoading(true);
    // 发送请求
    const response = await copyTemplate(templateId, company_id, name);
    if (response.status === "success") {
      notify.success({
        title: "Success",
        description: "Copy template successfully",
      });
      fetchTemplates();
    } else {
      notify.error({
        title: "Error",
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
      notify.error({
        title: "Error",
        description: "Failed to delete template",
      });
    }
  }

  // 设置默认模版
  const handleSetDefaultTemplate = async (templateId: number) => {
    // 同步当前默认状态到服务端
    const response = await setTemplateDefault(templateId, company_id as number);
    if (response.status === "success") {
      // 设置默认模版成功
      notify.success({
        title: "Success",
        description: "Set default template successfully",
      });
    } else {
      notify.error({
        title: "Error",
        description: "Failed to set default template",
      });
    }
  }

  // 更新field信息
  const sendUpdateField = async (templateId: number, fieldId: string, fieldData: any) => {
    // 同步当前默认状态到服务端
    console.log('########## sendUpdateField', templateId, fieldId, fieldData);
    setLoading(true);
    const response = await updateField(templateId, fieldId, fieldData);
    setLoading(false);
    if (response.status === "success") {
      notify.success({
        title: "Success",
        description: "Updated successfully",
      });
      // 刷新数据
      fetchTemplateContent(templateId);
    } else {
      notify.error({
        title: "Error",
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
      // setTemplateContent((prev: any) => ({
      //   ...prev,
      //   fields: prev.fields.map((field: any) => {
      //     return field.id === data.field_id ? {
      //       ...field,
      //       ...data.fieldData,
      //     } : field;
      //   }),
      // }));
      sendUpdateField(data.template_id, data.field_id, data.fieldData);
    }
  };

  const handleOpenCreateTemplate = () => {
    setOpenCreateTemplateSignal((prev) => prev + 1);
  };

  const handleConsumeCreateTemplateSignal = () => {
    setOpenCreateTemplateSignal(0);
  };

  const handleImportTemplateClick = () => {
    setIsImportModalOpen(true);
  };

  const isJsonFile = (file: File) => {
    const isJsonType = file.type === "application/json";
    const isJsonExtension = file.name.toLowerCase().endsWith(".json");
    return isJsonType || isJsonExtension;
  };

  const uploadProps: UploadProps = {
    accept: ".json,application/json",
    maxCount: 1,
    fileList: importFileList,
    beforeUpload: (file) => {
      if (!isJsonFile(file)) {
        message.error("Please upload a JSON file");
        return Upload.LIST_IGNORE;
      }
      setImportFileList([
        {
          uid: file.uid,
          name: file.name,
          status: "done",
          originFileObj: file,
        },
      ]);
      return false;
    },
    onRemove: () => {
      setImportFileList([]);
    },
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFileList([]);
  };

  const handleConfirmImportTemplate = async () => {
    const uploadFile = importFileList[0];
    const file =
      (uploadFile?.originFileObj as File | undefined) ||
      (uploadFile as unknown as File | undefined);
    if (!file) {
      message.error("Please upload a JSON file");
      return;
    }
    if (!isJsonFile(file)) {
      message.error("Please upload a JSON file");
      return;
    }
    setLoading(true);
    const response = await importTemplate(company_id as number, file);
    if (response.status === "success") {
      message.success("Template imported successfully");
      await fetchTemplates();
      handleCloseImportModal();
    } else {
      notify.error({
        title: "Error",
        description: response?.data?.detail || "Failed to import template",
      });
    }
    setLoading(false);
  };

  const handleDownloadTemplate = async (targetTemplateId: number, name: string) => {
    if (!targetTemplateId) return;

    setLoading(true);
    const response = await downloadTemplateJson(targetTemplateId);
    if (response.status === "success") {
      const fileContent = response.data;
      const blob =
        fileContent instanceof Blob
          ? fileContent
          : new Blob([JSON.stringify(fileContent, null, 2)], {
            type: "application/json",
          });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name || "template"}-${targetTemplateId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      notify.error({
        title: "Error",
        description: response?.data?.detail || "Failed to download template",
      });
    }
    setLoading(false);
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
              if (tab === MainTab.PromptLibrary) {
                if (templateId === 1 || templateList?.find((item: any) => item.id === templateId)?.is_edit === false) {
                  // 标准模版和非用户模版禁止切换到 PromptLibrary，因为 PromptLibrary 是用户自定义的模版
                  message.error('You do not have the permission to switch to the PromptLibrary.');
                  return;
                }
              }
              setActiveMainTab(tab)
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {activeMainTab === MainTab.YourTemplates && (
        <div className="px-14 pb-2 w-full">
          <div className="flex items-center gap-2">
            <Button
              className="custom-primary-btn !w-[130px]"
              onClick={handleImportTemplateClick}
            >
              <UploadOutlined className="text-xs" />
              <span className="">Import Template</span>
            </Button>
            <Button
              className="custom-primary-btn !w-[90px]"
              onClick={handleOpenCreateTemplate}
            >
              <PlusOutlined className="text-xs" />
              <span className="">Template</span>
            </Button>
          </div>
        </div>
      )}

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
            openCreateTemplateSignal={openCreateTemplateSignal}
            onConsumeCreateTemplateSignal={handleConsumeCreateTemplateSignal}
            onDownloadTemplate={handleDownloadTemplate}
            onRefreshTemplateContent={fetchTemplateContent}
          />
        ) : (
          <PromptEditor
            templateId={templateId}
            setTemplateId={setTemplateId}
            templateList={templateList}
            templateContent={templateContent}
            subFieldName={subFieldId.current}
            setLoading={setLoading}
            onUpdateField={handleUpdateField}
            onRefreshTemplatePrompt={() => templateId && fetchTemplateContent(templateId)}
          />
        )}
      </div>
      <Modal
        open={isImportModalOpen}
        title="Import Template"
        onCancel={handleCloseImportModal}
        footer={null}
        centered
      >
        <div className="py-2">
          <p className="text-xs text-grey-normal mb-3">
            Upload a template JSON file to import it into your template library.
          </p>
          <Dragger {...uploadProps} className="!bg-white">
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text text-sm">Click or drag JSON file to this area to upload</p>
            <p className="ant-upload-hint">Only one JSON file is allowed.</p>
          </Dragger>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCloseImportModal}>Cancel</Button>
            <Button type="primary" onClick={handleConfirmImportTemplate} loading={loading}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
      {loading && <LoadingScreen isLoading={loading} />}
    </div>
  );
};

export default Page;
