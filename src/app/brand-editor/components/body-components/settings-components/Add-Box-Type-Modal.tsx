"use client";

import { Input, Modal, Select } from "antd";
import { useEffect, useMemo, useState } from "react";
import { boxesColors } from "@/lib/constants";
import Button from "@/components/Button";
import ExploreExamplesModal from "./Explore-Examples-Modal";

type CreateBoxTypeData = {
  name: string;
  description: string;
  color: string;
  search_prompt: string;
  analysis_prompt: string;
};

type ModalProps = {
  isOpen: boolean;
  handleCancel: () => void;
  onOk: (data: CreateBoxTypeData) => void | Promise<void>;
};

const AddBoxTypeModal = (props: ModalProps) => {
  const { TextArea } = Input;
  const [isExploreExamplesModalOpen, setIsExploreExamplesModalOpen] =
    useState<boolean>(false);

  const [form, setForm] = useState<CreateBoxTypeData>({
    name: "",
    description: "",
    color: "",
    search_prompt: "",
    analysis_prompt: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!props.isOpen) {
      setForm({
        name: "",
        description: "",
        color: "",
        search_prompt: "",
        analysis_prompt: "",
      });
      setSubmitting(false);
    }
  }, [props.isOpen]);

  const formatColorName = (name: string) =>
    name
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const isValid = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.color.trim().length > 0 &&
      form.search_prompt.trim().length > 0 &&
      form.analysis_prompt.trim().length > 0
    );
  }, [form]);

  const handleOk = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await props.onOk({
        ...form,
        name: form.name.trim(),
        color: form.color.trim(),
        search_prompt: form.search_prompt.trim(),
        analysis_prompt: form.analysis_prompt.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const colorOptions = Object.keys(boxesColors).map((key) => ({
    value: key,
    label: (
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full inline-block"
          style={{
            backgroundColor: boxesColors[key as keyof typeof boxesColors],
          }}
        />
        <span className="text-xs">{formatColorName(key)}</span>
      </div>
    ),
  }));

  const footer = (
    <div className="flex justify-between">
      <div>
        <p
          className="underline text-grey-normal cursor-pointer"
          onClick={() => setIsExploreExamplesModalOpen(true)}
        >
          Explore Examples
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          className="rounded-md"
          onClick={props.handleCancel}
          backgroundColor="grey-light"
          color="grey-dark"
        >
          Cancel
        </Button>
        <Button
          disabled={!isValid}
          backgroundColor="forumBlue-normal"
          className=" rounded-md bg-forumBlue-normal text-white border-none hover:bg-forumBlue-normal disabled:opacity-70 disabled:text-white"
          onClick={handleOk}
        >
          Create
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      open={props.isOpen}
      onCancel={props.handleCancel}
      onOk={handleOk}
      footer={footer}
    >
      <ExploreExamplesModal
        isOpen={isExploreExamplesModalOpen}
        handleCancel={() => setIsExploreExamplesModalOpen(false)}
      />
      <div className="flex flex-col gap-7">
        {/* titulo y subtitulo */}
        <div className="flex flex-col gap-2">
          <h2 className="text-forumBlue-normal text-lg">New Logic Box</h2>
          <p className="text-grey-normal">
            Create a new set of instructions to tell CATO which specific details
            to find in your files.
          </p>
        </div>

        {/* secction de input + select */}
        <div className="flex items-center w-full gap-8">
          <div className="w-7/12 flex flex-col">
            <div className="flex items-center gap-1">
              <span>Logic Name</span>
              <span className="text-red-normal">*</span>
            </div>
            <Input
              placeholder="Item, Table, Glass Table, etc."
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="w-5/12 flex flex-col">
            <div className="flex items-center gap-1 text-sm">
              <span>Color</span>
              <span className="text-red-normal">*</span>
            </div>
            <Select
              value={form.color || undefined}
              onChange={(v) => setForm((p) => ({ ...p, color: v }))}
              options={colorOptions}
              placeholder="Select"
            />
          </div>
        </div>

        {/* Seccion de search prompt */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-sm">Search Prompt</span>
            <span className="text-red-normal">*</span>
          </div>
          <p className="text-xs text-grey-normal mb-4">
            Describe what this type of information typically look like so CATO
            can find it in the future on its own.
          </p>
          <TextArea
            rows={3}
            value={form.search_prompt}
            onChange={(e) =>
              setForm((p) => ({ ...p, search_prompt: e.target.value }))
            }
          />
        </div>

        {/* Seccion de analysis prompt */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-sm">Analysis Prompt</span>
            <span className="text-red-normal">*</span>
          </div>
          <p className="text-xs text-grey-normal mb-4">
            Once the information is found, describe how you want CATO to analyze
            the information and correlate to the other information.
          </p>
          <TextArea
            rows={3}
            value={form.analysis_prompt}
            onChange={(e) =>
              setForm((p) => ({ ...p, analysis_prompt: e.target.value }))
            }
          />
        </div>
      </div>
    </Modal>
  );
};

export default AddBoxTypeModal;
