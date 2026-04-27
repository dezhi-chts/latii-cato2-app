"use client";

import { notify } from "@/utils/notify";
import { Input, Modal } from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;

interface EditProjectModalProps {
  open: boolean;
  loading?: boolean;
  projectName?: string;
  projectDescription?: string;
  onCancel: () => void;
  onConfirm: (payload: {
    projectName: string;
    projectDescription: string;
  }) => Promise<void> | void;
}

export default function EditProjectModal({
  open,
  loading = false,
  projectName = "",
  projectDescription = "",
  onCancel,
  onConfirm,
}: EditProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(projectName || "");
    setDescription(projectDescription || "");
  }, [open, projectDescription, projectName]);

  return (
    <Modal
      open={open}
      title="Edit Project"
      okText="Confirm"
      cancelText="Cancel"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={() => {
        const normalizedName = name.trim();
        if (!normalizedName) {
          notify.error({
            title: "Error",
            description: "Project name is required",
          });
          return;
        };
        onConfirm({
          projectName: normalizedName,
          projectDescription: description.trim(),
        });
      }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-2 text-xs text-grey-normal">Project Name</div>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Input project name"
          />
        </div>
        {/* <div>
          <div className="mb-2 text-xs text-grey-normal">Project Description</div>
          <TextArea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Input project description"
          />
        </div> */}
      </div>
    </Modal>
  );
}
