"use client";

import { useState } from "react";
import { Button, Popover } from "antd";
import { FormOutlined, DeleteOutlined } from "@ant-design/icons";
import Image from "next/image";
import { NewTemplateModal } from "./NewTemplateModal";

interface Template {
  id: number;
  name: string;
  isDefault: boolean;
}

interface TemplateListProps {
  templates: Template[];
  selectedTemplateId: number | null;
  onSelectTemplate: (id: number) => void;
  onTemplateCreated: () => void;
}

export const TemplateList = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onTemplateCreated,
}: TemplateListProps) => {
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);

  const handleOpenNewTemplateModal = () => {
    setIsNewTemplateModalOpen(true);
  };

  const handleCloseNewTemplateModal = () => {
    setIsNewTemplateModalOpen(false);
  };

  return (
    <div className="w-[320px] my-2 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-grey-normal">Templates</span>
        <Button
          className="custom-primary-btn !w-[100px] !bg-forumBlue-light !text-forumBlue-dark-active !border-none"
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
            <div className="flex items-center gap-2">
              <span className="text-xs">{template.name}</span>
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
            <div className="flex items-center gap-2">
              {index === 0 ? (
                <>
                  <span className="text-xxs text-grey-normal bg-white px-2 rounded-lg border border-primaryN30">
                    Default
                  </span>
                </>
              ) : selectedTemplateId === template.id ? (
                <>
                  <button className="text-grey-normal hover:text-forumBlue-normal">
                    <FormOutlined className="text-xs text-forumBlue-normal" />
                  </button>
                  <button className="text-grey-normal hover:text-red-500">
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
        onSuccess={onTemplateCreated}
      />
    </div>
  );
};
