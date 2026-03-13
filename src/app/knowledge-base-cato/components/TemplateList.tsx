"use client";

import { useState, useRef } from "react";
import { Button, Popover, Input } from "antd";
import { FormOutlined, DeleteOutlined } from "@ant-design/icons";
import Image from "next/image";
import { NewTemplateModal } from "./NewTemplateModal";
import { TemplateEvent } from "../page";

interface Template {
  id: number;
  name: string;
  is_default: boolean;
}

interface TemplateListProps {
  templates: Template[];
  selectedTemplateId: number | null;
  onSelectTemplate: (id: number) => void;
  onUpdateTemplate?: (eventName: TemplateEvent, data: any) => void;
}

export const TemplateList = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onUpdateTemplate
}: TemplateListProps) => {
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  // 当前正在编辑的 template id
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  // 编辑时的临时值 - 使用 ref 避免重新渲染
  const editValueRef = useRef<string>("");
  // 用于强制刷新 input 显示的值
  const [, forceUpdate] = useState({});

  const handleOpenNewTemplateModal = () => {
    setIsNewTemplateModalOpen(true);
  };

  const handleCloseNewTemplateModal = () => {
    setIsNewTemplateModalOpen(false);
  };

  const handleTemplateDefault = (templateId: number) => {
    onUpdateTemplate?.(TemplateEvent.UpdateValueDefault, { template_id: templateId });
  };

  // 处理删除事件 - ID 为 1 的标准模版不允许删除
  const handleDeleteTemplate = (templateId: number) => {
    if (templateId === 1) return; // 标准模版不允许删除
    onUpdateTemplate?.(TemplateEvent.Delete, { template_id: templateId });
  };

  // 处理双击事件 - ID 为 1 的标准模版不允许修改
  const handleDoubleClick = (template: Template) => {
    if (template.id === 1) return; // 标准模版不允许编辑
    editValueRef.current = template.name;
    setEditingTemplateId(template.id);
  };

  // 处理 input 变化
  const handleInputChange = (value: string) => {
    editValueRef.current = value;
    forceUpdate({}); // 强制刷新以显示最新值
  };

  // 处理保存
  const handleSave = () => {
    if (editingTemplateId && editValueRef.current.trim()) {
      onUpdateTemplate?.(TemplateEvent.UpdateName, { template_id: editingTemplateId, name: editValueRef.current.trim() });
    }
    setEditingTemplateId(null);
    editValueRef.current = "";
  };

  const handleCreate = (templateInfo: Template) => {
    onUpdateTemplate?.(TemplateEvent.Create, templateInfo);
  };

  // 处理取消
  const handleCancel = () => {
    setEditingTemplateId(null);
    editValueRef.current = "";
  };

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="w-[320px] my-2 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg text-grey-normal">Templates</span>
          <Popover
            placement="rightBottom"
            title={null}
            content={
              <div className="py-2 w-[280px] flex flex-col gap-2">
                <div className="text-sm font-medium text-grey-normal">Templates</div>
                <div className="text-xs text-grey-normal leading-relaxed">
                  Customize the fields Cato uses to read your PDF. Create specialized templates to accurately capture data for different takeoff types (e.g., steel vs. aluminum).
                </div>
              </div>
            }
            trigger="hover"
          >
            <Image
              src="/assets/icons/info.svg"
              alt="info circle icon"
              width={14}
              height={14}
            ></Image>
          </Popover>
        </div>
        <Button
          className="custom-primary-btn !w-[110px]"
          icon={<span className="text-xs">+</span>}
          onClick={handleOpenNewTemplateModal}
        >
          Template
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {templates.map((template, index) => (
          <div
            key={template.id}
            className={`px-3 h-[36px] rounded-md cursor-pointer flex justify-between items-center ${selectedTemplateId === template.id
              ? "bg-forumBlue-light-active"
              : "bg-white border-transparent hover:bg-grey-light"
              }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {editingTemplateId === template.id ? (
                <Input
                  size="small"
                  defaultValue={editValueRef.current}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSave}
                  autoFocus
                  className="w-full h-[28px] text-xs border-forumBlue-normal"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={`text-xs truncate ${template.id === 1 ? "" : "cursor-text"}`}
                  onDoubleClick={() => handleDoubleClick(template)}
                  title={template.id === 1 ? "Standard template cannot be renamed" : "Double click to rename"}
                >
                  {template.name}
                </span>
              )}
              {template.id === 1 && (
                <Popover
                  placement="rightBottom"
                  title={null}
                  content={
                    <div className="py-2 w-[280px] flex flex-col gap-2">
                      <div className="text-sm font-medium text-grey-normal">Standard Template</div>
                      <div className="text-xs text-grey-normal leading-relaxed">
                        Contains the default fields Cato always looks for. This template is fixed, create on top new prompt fields in other templates.
                      </div>
                    </div>
                  }
                  trigger="hover"
                >
                  <Image
                    src="/assets/icons/info.svg"
                    alt="info circle icon"
                    width={14}
                    height={14}
                  ></Image>
                </Popover>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xxs px-2 rounded-lg border border- bg-grey-light-hover ${template.is_default ? "text-forumBlue-normal" : "text-grey-light-strong"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTemplateDefault(template.id)
                }}
              >
                Default
              </span>
              {selectedTemplateId === template.id && template.id !== 1 ? (
                <>
                  {/* <button className="text-grey-normal hover:text-forumBlue-normal">
                    <FormOutlined className="text-xs text-forumBlue-normal" />
                  </button> */}
                  <button className="text-grey-normal hover:text-red-500" onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id)
                  }}>
                    <DeleteOutlined className="text-xs text-forumBlue-normal" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* New Template Modal */}
      <NewTemplateModal
        isOpen={isNewTemplateModalOpen}
        onClose={handleCloseNewTemplateModal}
        onSuccess={handleCreate}
      />
    </div>
  );
};
