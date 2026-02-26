"use client";
import { useEffect, useState } from "react";
import { Modal, notification } from "antd";
import TakeoffUpload from "./Create-Takeoff/Takeoff-Upload";
import ProjectForm from "./Project-Form";
import { type UploadFile } from "antd/es/upload/interface";
import { createProject } from "@/services/projectService";
import { useCompany } from "@/context/CompanyContext";
import { normalizeKey } from "@/lib/functions";
import { Attribute } from "@/types/home";
import Button from "@/components/Button";

type FormValues = Record<string, any>;

type CreateProjectModalProps = {
  isOpen: boolean;
  closeModal: () => void;
  onHandleUpload?: (data: any) => void;
  refreshProjects: () => void;
};

const CreateProjectModal = ({
  isOpen,
  closeModal,
  onHandleUpload,
  refreshProjects,
}: CreateProjectModalProps) => {
  const [form, setForm] = useState<Record<string, any>>({});
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { company } = useCompany();

  const handleProjectSubmit = async () => {
    setLoading(true);
    const formattedForm = formatPayload(form, company.project_attributes);
    const response = await createProject(formattedForm);
    setLoading(false);
    if (response?.status === "success") {
      notification.success({
        message: "Project created successfully",
      });
      refreshProjects();
      closeModal();
    } else {
      notification.error({
        message: "Failed to create project",
        description: "Please check the console for more details",
      });
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

  useEffect(() => {
    const isValid = hasAllRequiredFields(company.project_attributes, form);
    setIsFormValid(isValid);
  }, [form]);

  const formatPayload = (
    form: Record<string, any>,
    projectAttributes: any[],
  ) => {
    const attributeKeyByName = Object.fromEntries(
      projectAttributes.map((attr) => [normalizeKey(attr.label), attr.uuid]),
    ) as Record<string, string>;

    const { project_name, location, ...rest } = form;

    const attributes = Object.fromEntries(
      Object.entries(rest)
        .filter(([key]) => attributeKeyByName[key])
        .map(([key, value]) => [attributeKeyByName[key], value ?? ""]),
    );

    return {
      project_name,
      location: location ?? "",
      attributes,
    };
  };

  const hasAllRequiredFields = (
    attributes: Attribute[],
    form: FormValues,
  ): boolean => {
    if (!form.project_name || form.project_name.trim() === "") {
      return false;
    }

    for (const attr of attributes) {
      if (!attr.required) continue;

      const key = normalizeKey(attr.label);
      const value = form[key];

      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return false;
      }
    }

    return true;
  };

  return (
    <Modal
      open={isOpen}
      title={
        <p className="ml-1 text-forumBlue-normal text-lg font-normal font-nunito">
          Create New Project
        </p>
      }
      centered={true}
      width={1250}
      footer={null}
      onCancel={closeModal}
    >
      <div className="mt-8 p-2 max-h-[80vh] flex flex-row justify-between font-nunito">
        <div className="w-[400px] flex flex-col border border-grey-light-hover rounded-md overflow-hidden">
          <div className="px-5 my-4 text-lg">Start from Blank Template</div>
          <div className="px-5 py-2 overflow-y-auto">
            <ProjectForm form={form} setForm={setForm} />
          </div>
          <div className="flex-1 flex items-end justify-center mb-4">
            <Button
              onClick={() => {
                if (!isFormValid) return;
                handleProjectSubmit();
              }}
              className="w-32 rounded-md text-xs"
              backgroundColor="forumBlue-normal"
              disabled={!isFormValid || loading}
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
        <div className="px-5 w-[720px] flex flex-col border border-grey-light-hover rounded-md overflow-y-auto">
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
