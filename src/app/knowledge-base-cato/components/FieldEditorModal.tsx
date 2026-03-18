"use client";

import { Modal } from "antd";
import { FieldEditor } from "./FieldEditor";
import { FieldEvent } from "../page";

interface FieldEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  field?: any;
  templateId: number;
  onUpdateField?: (eventName: FieldEvent, data: any) => void;
}

export const FieldEditorModal = ({
  isOpen,
  onClose,
  field,
  templateId,
  onUpdateField,
}: FieldEditorModalProps) => {
  return (
    <Modal
      open={isOpen}
      title={null}
      centered={true}
      footer={null}
      width={'auto'}
      onCancel={onClose}
    >
      <div className="px-6 w-[1200px] h-[800px] font-nunito flex flex-col">
        <div className="pt-2 text-base text-forumBlue-normal">Create Prompt</div>
        <div className="text-grey-normal text-xs">Select a prompt or create a new one.</div>
        <div className="flex-1 pt-10">
          <FieldEditor
            templateId={templateId}
            field={field}
            mode={'create'}
            onClose={onClose}
            onUpdateField={onUpdateField}
          />
        </div>
      </div>
    </Modal>
  );
};
