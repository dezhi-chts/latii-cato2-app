"use client";
import { useRef, useState } from "react";
import { Button, Modal, message } from "antd";
import TakeoffUpload from "./Create-Takeoff/Takeoff-Upload";
import ProjectForm from "./Project-Form";
import { type ProjectSettings, defaultProjectSettings } from "@/types/project";
import { type UploadFile } from "antd/es/upload/interface";

const CreateProjectModal = ({ isOpen, closeModal, onHandleUpload }: any) => {
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    ...defaultProjectSettings,
  });
  const projectFormRef = useRef<any>(null);

  // 创建工程
  const handleProjectSubmit = async () => {
    console.log("######### handleProjectSubmit", projectSettings);
    if (!projectFormRef?.current?.isValidForm()) {
      message.warning("Please fill out all required fields.");
      return;
    }
  };

  const handleUpload = (data: {
    archFiles: UploadFile[];
    quoteFiles: UploadFile[];
  }) => {
    console.log("######### handleUpload", data);
    //打开Create-Project-Takeoff-Modal弹窗
    onHandleUpload?.(data);
  };

  return (
    <Modal
      open={isOpen}
      title={
        <p className="ml-1 text-forumBlue text-lg font-normal font-nunito">
          Create New Project
        </p>
      }
      centered={true}
      width={1250}
      footer={null}
      onCancel={closeModal}
    >
      <div className="mt-8 p-2 max-h-[80vh] flex flex-row justify-between font-nunito">
        <div className="w-[400px] flex flex-col border border-baseLightHover rounded-md overflow-hidden">
          <div className="px-5 my-4 text-lg">Start from Blank Template</div>
          <div className="px-5 py-2 overflow-y-auto">
            <ProjectForm />
          </div>
          <div className="flex-1 flex items-end justify-center">
            <Button
              onClick={handleProjectSubmit}
              className="mb-4 custom-primary-btn"
            >
              Create
            </Button>
          </div>
        </div>
        <div className="px-5 w-[720px] flex flex-col border border-baseLightHover rounded-md overflow-y-auto">
          <div className="my-4 text-lg">Start from Takeoff</div>
          <div className="flex-1">
            <TakeoffUpload onHandleUpload={handleUpload} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateProjectModal;
