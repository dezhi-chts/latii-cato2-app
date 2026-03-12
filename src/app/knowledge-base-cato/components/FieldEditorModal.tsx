"use client";

import { Modal } from "antd";
import { FieldEditor, FieldData } from "./FieldEditor";

interface FieldEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  field?: FieldData | null;
  templateId: string;
}

export const FieldEditorModal = ({
  isOpen,
  onClose,
  field,
  templateId,
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
      <div className="w-[960px] font-nunito">
        <div className="py-2 text-lg text-forumBlue-normal">Create New Prompt</div>
        <FieldEditor
          templateId={templateId}
          field={field}
          mode={'create'}
          onClose={onClose}
        />
      </div>
    </Modal>
  );
};
