"use client";

import { useEffect, useState } from "react";
import { Modal, Button, Input, Checkbox, message } from "antd";
import { createTemplate, getTemplateById } from "@/services/templateService";
import { useUser } from "@/context/UserContext";
import LoadingScreen from "@/components/loading-screen";
import { PlusOutlined } from "@ant-design/icons";


interface StandardField {
  id: string;
  name: string;
  notes: string;
  field_type: string;
}

interface NewTemplateTipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTemplateTipModal = ({
  isOpen,
  onClose,
}: NewTemplateTipModalProps) => {
  const [templateName, setTemplateName] = useState("");

  return (
    <Modal
      open={isOpen}
      title={null}
      centered={true}
      width={400}
      footer={null}
      closable={false}
      onCancel={onClose}
    >
      <div className="px-2 h-[200px] flex flex-col gap-6 py-4 font-nunito">
        <div>
          <div className="mb-2 pb-1 text-forumBlue-normal text-base">Create New Template</div>
          <div className="text-sm">You are leaving this current Page. Any progress wont be saved.</div>
          <div className="text-sm">But you can return to review this any time and add the new prompt.</div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <div>
            <Button className="custom-default-btn" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="ml-2 custom-primary-btn !w-[86px]"
              onClick={() => { }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
