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
      <div className="w-[1200px] h-[60%] font-nunito">
        <div className="py-2 text-lg text-forumBlue-normal">Create New Prompt</div>
        <FieldEditor
          templateId={templateId}
          field={field}
          mode={'create'}
          onClose={onClose}
          onUpdateField={(eventName: FieldEvent, data: any) => {
            onClose();
            onUpdateField?.(eventName, data);
          }}
        />
      </div>
    </Modal>
  );
};
