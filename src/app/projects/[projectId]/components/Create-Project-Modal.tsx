"use client";
import Button from "@/components/Button";
import { useProjects } from "@/context/ProjectsContext";
import { createProject } from "@/services/projectService";
import {
  CreateProjectModalProps,
  defaultProjectSettings,
  ProjectSettings,
} from "@/types/project";
import { Input, Modal, Spin } from "antd";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CreateProjectModal = ({
  isOpen,
  closeModal,
  onSuccess,
}: CreateProjectModalProps) => {
  const { TextArea } = Input;
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    ...defaultProjectSettings,
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const { refetchProjects, lastProjectId } = useProjects();

  const handleInputChange =
    <K extends keyof ProjectSettings>(field: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setProjectSettings((prev) => ({
        ...prev,
        [field]: event.target.value as ProjectSettings[K],
      }));
    };

  const handleSubmit = async () => {
    setLoading(true);

    const keysToRemove = ["project_id", "order"];
    const newSettings = Object.fromEntries(
      Object.entries(projectSettings).filter(
        ([key]) => !keysToRemove.includes(key)
      )
    ) as ProjectSettings;

    try {
      const response = await createProject(newSettings);
      await refetchProjects();
      if (onSuccess) onSuccess();

      if (response?.status === "success" && lastProjectId) {
        setProjectSettings({ ...defaultProjectSettings });
        router.push(`/projects/${lastProjectId + 1}`);
      }
    } catch (error) {
      console.log(error);
    } finally {
      closeModal();
      setLoading(false);
    }
  };

  useEffect(() => {
    const isValid = !!projectSettings.project_name;

    setIsFormValid(isValid);
  }, [projectSettings]);

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={closeModal}
      onOk={handleSubmit}
      title={
        <div className="zoomed-container flex items-start gap-1">
          <Image
            src="/assets/icons/create-project.svg"
            alt="create project icon"
            width={20}
            height={20}
            style={{ width: "auto", height: "auto" }}
          />
          <div className="flex flex-col gap-1">
            <p className="text-forumBlue font-semibold">Create a Project</p>
            <p className="text-sm font-normal">
              To start creating Take Offs you must first create a project.
            </p>
          </div>
        </div>
      }
      width={400}
      footer={
        <div className="mt-6 zoomed-container flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className="text-xs w-16"
            backgroundColor="forumBlue"
          >
            {loading ? <Spin /> : "Create"}
          </Button>
        </div>
      }
    >
      <div className="zoomed-container mt-8 flex gap-6 items-center flex-col w-full">
        <div className="flex flex-col gap-2 w-3/4">
          <p>
            Project Name <span className="text-accentRed">*</span>
          </p>
          <Input
            placeholder="Input a recognizable name for you"
            className="rounded-full "
            value={projectSettings.project_name}
            onChange={handleInputChange("project_name")}
          />
        </div>

        <div className="flex flex-col gap-2 w-3/4">
          <p>
            Project Description{" "}
            <span className="text-basicLightGray">(Optional)</span>
          </p>
          <TextArea
            placeholder="Any additional notes, descriptions"
            rows={2.5}
            style={{ resize: "none" }}
            className=" scrollbar-hidden"
            value={projectSettings.project_desc || ""}
            onChange={handleInputChange("project_desc")}
          />
        </div>
      </div>
    </Modal>
  );
};

export default CreateProjectModal;
