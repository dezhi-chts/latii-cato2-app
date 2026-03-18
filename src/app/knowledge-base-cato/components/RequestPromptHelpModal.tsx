"use client";

import { useState } from "react";
import { Modal, Button, Input, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { UploadBox } from "@/app/projects/[projectId]/components/Create-Takeoff/Takeoff-Upload"

interface RequestPromptHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestPromptHelpModal = ({
  isOpen,
  onClose,
}: RequestPromptHelpModalProps) => {
  const [promptGoal, setPromptGoal] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setPromptGoal("");
    setFileList([]);
    onClose();
  };

  const handleSendRequest = async () => {
    if (!promptGoal.trim()) {
      message.error("Please enter your prompt goal");
      return;
    }

    setLoading(true);
    // TODO: 实现发送请求的 API 调用
    // const formData = new FormData();
    // formData.append("promptGoal", promptGoal);
    // fileList.forEach((file) => {
    //   if (file.originFileObj) {
    //     formData.append("files", file.originFileObj);
    //   }
    // });

    // 模拟 API 调用
    setTimeout(() => {
      message.success("Request sent successfully!");
      setLoading(false);
      handleClose();
    }, 1000);
  };

  return (
    <Modal
      open={isOpen}
      title={null}
      centered={true}
      width={580}
      footer={null}
      onCancel={handleClose}
      closable={false}
    >
      <div className="font-nunito py-2 px-4">
        {/* Title */}
        <h2 className="text-forumBlue-normal text-lg mb-4">
          Request for Assistance
        </h2>

        {/* Description */}
        <p className="text-ms mb-6 leading-relaxed">
          We&apos;re here to help you refine your project prompts. Provide a
          brief description of your goal and attach any relevant files to
          help us design the best solution for you.
        </p>

        {/* General Prompt Goal */}
        <div className="mb-5">
          <label className="text-sm mb-2 block">
            General Prompt Goal<span className="text-red-500">*</span>
          </label>
          <Input.TextArea
            value={promptGoal}
            onChange={(e) => setPromptGoal(e.target.value)}
            placeholder="Describe the main objective of your prompt..."
            className="border-primaryN30 rounded-md text-xs"
            rows={6}
          />
        </div>

        {/* Supporting Files */}
        <div className="mb-5">
          <label className="text-ms mb-2 block">
            Supporting Files
          </label>
          <UploadBox files={fileList} setFiles={setFileList} />
        </div>

        {/* Footer Text */}
        <p className="text-sm mb-6 leading-relaxed">
          A support partner will reach out shortly to guide you through
          the process. Let&apos;s build the future together.
        </p>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <Button className="custom-default-btn" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="custom-primary-btn"
            onClick={handleSendRequest}
            loading={loading}
          >
            Send Request
          </Button>
        </div>
      </div>
    </Modal>
  );
};
