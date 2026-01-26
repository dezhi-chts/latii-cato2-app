"use client";
import { useEffect, useRef, useState } from "react";
import {
  CreateProjectModalProps,
  defaultProjectSettings,
  ProjectSettings,
} from "@/types/project";
import { Button, Input, Modal, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";

import { useRouter } from "next/navigation";
import TakeoffUpload from "./Create-Takeoff/Takeoff-Upload";
import ProjectForm from "./Project-Form";

const CreateProjectModal = ({
  isOpen,
  closeModal,
  onSuccess,
  onOpenTakeoffModal
}: CreateProjectModalProps) => {
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    ...defaultProjectSettings,
  });
  const projectFormRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 创建工程
  const handleProjectSubmit = async () => {
    console.log('######### handleProjectSubmit', projectSettings);
    if (!projectFormRef?.current?.isValidForm()) {
      message.warning("Please fill out all required fields.");
      return;
    }
  };

  const handleUpload = (data: { archFiles: UploadFile[], quoteFiles: UploadFile[] }) => {
    console.log('######### handleUpload', data);
    //打开Create-Project-Takeoff-Modal弹窗
    onOpenTakeoffModal?.(data);
  }

  return (
    <Modal
      open={isOpen}
      title={
        <p className="ml-1 text-forumBlue text-lg font-normal">Create New Project</p>
      }
      width={1250}
      footer={null}
      onCancel={closeModal}
    >
      <div className="mt-8 p-2 flex flex-row justify-between">
        <div className="w-[400px] max-h-[80vh] flex flex-col border border-basicLightGray rounded-md overflow-hidden">
          <div className="px-5 my-4 text-lg text-baseGray">Blank Template</div>
          <div className="px-5 py-2 overflow-y-auto">
            <ProjectForm ref={projectFormRef} projectSettings={projectSettings} setProjectSettings={setProjectSettings} />
          </div>
          <div className="flex-1 flex items-end justify-center">
            <Button
              onClick={handleProjectSubmit}
              type="primary"
              className="w-[124px] mb-4"
            >
              Create
            </Button>
          </div>
        </div>
        <div className="px-5 w-[720px] flex flex-col border border-basicLightGray rounded-md overflow-y-auto">
          <div className="my-4 text-lg text-baseGray">From Takeoff</div>
          <div className="flex-1">
            <TakeoffUpload onHandleUpload={handleUpload} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateProjectModal;
