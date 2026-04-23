"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Popover, Input, Tooltip } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import Image from "next/image";
import { NewTemplateModal } from "./NewTemplateModal";
import { NewTemplateTipModal } from "./NewTemplateTipModal";

import { TemplateEvent } from "../page";
import { useUser } from "@/context/UserContext";

interface Template {
  id: number;
  name: string;
  is_default: boolean;
  is_edit: boolean;
  create_user?: string;
}

interface TemplateListProps {
  templates: Template[];
  selectedTemplateId: number | null;
  onSelectTemplate: (id: number) => void;
  onUpdateTemplate?: (eventName: TemplateEvent, data: any) => void;
  openCreateTemplateSignal: number;
  onConsumeCreateTemplateSignal?: () => void;
  onDownloadTemplate: (templateId: number, name: string) => void;
}

const TruncatedTemplateName = ({
  name,
  canEditName,
  onDoubleClick,
}: {
  name: string;
  canEditName: boolean;
  onDoubleClick: () => void;
}) => {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      const el = textRef.current;
      if (!el) return;
      setShowTooltip(el.scrollWidth > el.clientWidth);
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);

    const observer = new ResizeObserver(() => {
      checkTruncation();
    });
    if (textRef.current) {
      observer.observe(textRef.current);
    }

    return () => {
      window.removeEventListener("resize", checkTruncation);
      observer.disconnect();
    };
  }, [name]);

  return (
    <Tooltip title={showTooltip ? name : null} placement="topLeft">
      <span
        ref={textRef}
        className={`text-xs truncate ${canEditName ? "cursor-text" : ""}`}
        onDoubleClick={onDoubleClick}
        title={canEditName ? "Double click to rename" : undefined}
      >
        {name}
      </span>
    </Tooltip>
  );
};

export const TemplateList = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onUpdateTemplate,
  openCreateTemplateSignal,
  onConsumeCreateTemplateSignal,
  onDownloadTemplate,
}: TemplateListProps) => {
  const { username } = useUser();
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false);
  // 当前正在编辑的 template id
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  // 编辑时的临时值 - 使用 ref 避免重新渲染
  const editValueRef = useRef<string>("");
  // 用于强制刷新 input 显示的值
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (openCreateTemplateSignal > 0) {
      setIsNewTemplateModalOpen(true);
      onConsumeCreateTemplateSignal?.();
    }
  }, [openCreateTemplateSignal, onConsumeCreateTemplateSignal]);

  const handleOpenNewTemplateModal = () => {
    setIsNewTemplateModalOpen(true);
  };

  const handleCloseNewTemplateModal = () => {
    setIsNewTemplateModalOpen(false);
  };

  const handleTemplateDefault = (templateId: number) => {
    onUpdateTemplate?.(TemplateEvent.UpdateValueDefault, { template_id: templateId, });
  };

  // 处理删除事件 - ID 为 1 的标准模版不允许删除
  const handleDeleteTemplate = (templateId: number) => {
    if (templateId === 1) return; // 标准模版不允许删除
    onUpdateTemplate?.(TemplateEvent.Delete, { template_id: templateId });
  };

  // 处理双击事件 - ID 为 1 的标准模版不允许修改
  const handleDoubleClick = (template: Template) => {
    const isMyTemplate = template.create_user === username;
    if (template.id === 1 || template.is_edit === false || !isMyTemplate) return;
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

  const handleCopyTemplate = (templateId: number, name: string) => {
    onUpdateTemplate?.(TemplateEvent.Copy, { template_id: templateId, name: name.trim() });
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

  const myTemplates = useMemo(() => {
    if (username === 'Guest' || templates.length === 0) {
      return [];
    }
    return templates.filter((template) => template.create_user === username && template.id !== 1);
  }, [templates, username])
  const otherTemplates = useMemo(() => {
    if (username === 'Guest' || templates.length === 0) {
      return [];
    }
    return templates.filter((template) => template.create_user !== username && template.id !== 1);
  }, [templates, username])

  const standardTemplate = useMemo(() => {
    if (templates.length === 0) {
      return null;
    }
    return templates.find((template) => template.id === 1);
  }, [templates, username])

  const renderTemplateItem = (template: Template) => {
    const isMyTemplate = template.create_user === username;
    const canDefault = template.id !== 1 && template.is_edit === true && isMyTemplate;
    const canEditName = template.id !== 1 && template.is_edit === true && isMyTemplate;
    const canDelete = template.id !== 1 && template.is_edit === true && isMyTemplate;
    return (
      <div
        key={template.id}
        className={`group px-3 h-[36px] rounded-md cursor-pointer flex justify-between items-center ${selectedTemplateId === template.id
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
            <TruncatedTemplateName
              name={template.name}
              canEditName={canEditName}
              onDoubleClick={() => {
                handleDoubleClick(template);
              }}
            />
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
          {/* Default 标签 - 只显示当前设置的 default */}
          {
            canDefault &&
            <div
              className={`flex items-center gap-1 transition-opacity ${selectedTemplateId === template.id || template.is_default
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
                }`}
            >
              <span className={`text-xxs px-2 rounded-lg bg-grey-light-hover ${selectedTemplateId === template.id && template.is_default
                ? "bg-white text-forumBlue-normal"
                : template.is_default ? "text-forumBlue-normal" : " text-grey-normal"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTemplateDefault(template.id);
                }}
              >
                Default
              </span>
            </div>
          }
          {/* 复制/删除/下载按钮 */}
          <div
            className={`flex items-center gap-1 transition-opacity ${selectedTemplateId === template.id
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
              }`}
          >
            <button
              className="p-1 rounded hover:bg-white/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyTemplate(template.id, template.name + " copy");
              }}
              title="Copy"
            >
              <Image src="/assets/icons/copy.svg" alt="Copy" width={12} height={12} />
            </button>
            {canDelete && (
              <button
                className="p-1 rounded hover:bg-white/50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTemplate(template.id);
                }}
                title="Delete"
              >
                <Image src="/assets/icons/delete-forum-blue.svg" alt="Delete" width={12} height={12} />
              </button>
            )}
            <button
              className="p-1 rounded hover:bg-white/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadTemplate(template.id, template.name);
              }}
              title="Download"
            >
              <DownloadOutlined className="text-xs text-forumBlue-normal" style={{ fontSize: 12 }} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-[320px] h-full my-2 min-h-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base text-grey-normal">Templates</span>
          <Popover
            placement="rightBottom"
            title={null}
            content={
              <div className="py-2 w-[280px] flex flex-col gap-1">
                <div className="text-sm font-medium">Templates</div>
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
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {standardTemplate && (
          <div className="text-xs text-forumBlue-normal pt-1">Standard Template</div>
        )}
        {standardTemplate && renderTemplateItem(standardTemplate)}
        {myTemplates.length > 0 && (
          <div className="text-xs text-forumBlue-normal pt-1">My Templates</div>
        )}
        {myTemplates.map(renderTemplateItem)}

        {otherTemplates.length > 0 && (
          <div className="text-xs text-forumBlue-normal pt-3">Company Templates</div>
        )}
        {otherTemplates.map(renderTemplateItem)}
      </div>

      {/* New Template Modal */}
      <NewTemplateModal
        isOpen={isNewTemplateModalOpen}
        onClose={handleCloseNewTemplateModal}
        onSuccess={handleCreate}
        onAddPrompt={() => {
          setIsNewFieldModalOpen(true);
        }}
      />

      <NewTemplateTipModal
        isOpen={isNewFieldModalOpen}
        onClose={() => {
          setIsNewFieldModalOpen(false);
        }}
      />
    </div>
  );
};
