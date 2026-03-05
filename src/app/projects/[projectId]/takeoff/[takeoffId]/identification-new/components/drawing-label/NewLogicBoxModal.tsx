"use client";
import { Modal, Input, Button, Dropdown, message } from "antd";
import { useState, useEffect } from "react";
import { DownOutlined } from "@ant-design/icons";
import { createBoxType, updateBoxType } from "@/services/drawingIndexService";
import { useUser } from "@/context/UserContext";
import LogicBoxExamplesModal from "./LogicBoxExamplesModal";

const { TextArea } = Input;

interface BoxTypeData {
  id?: string;
  name: string;
  description: string;
  color: string;
  search_prompt: string;
  analysis_prompt: string;
}

interface NewLogicBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: BoxTypeData | null;
  isNameEditable?: boolean;
}

const colorOptions = [
  { label: "Blue", color: "#427CCE", twColor: "bg-forumBlue-normal" },
  { label: "Green", color: "#02A960", twColor: "bg-green-normal" },
  { label: "Orange", color: "#FF931D", twColor: "bg-orange-normal" },
  { label: "Yellow", color: "#F5C00B", twColor: "bg-yellow-normal" },
  { label: "Red", color: "#E83838", twColor: "bg-red-normal" },
  { label: "Teal", color: "#0BC6BE", twColor: "bg-teal-normal" },
  { label: "Cyan", color: "#00798A", twColor: "bg-cyan-normal" },
  { label: "Violet", color: "#D868D8", twColor: "bg-violet-normal" },
  { label: "Indigo", color: "#5859D6", twColor: "bg-indigo-normal" },
  { label: "Purple", color: "#8626B7", twColor: "bg-purple-normal" },
  { label: "Brown", color: "#A3835F", twColor: "bg-brown-normal" },
  { label: "Sky", color: "#38BDF8", twColor: "bg-sky-400" },
  { label: "Grey", color: "#A0A0A0", twColor: "bg-elusionDarkGrayTint" },
  { label: "Navy", color: "#325D9B", twColor: "bg-forumBlue-dark" },
];

const ColorDropdown = ({
  selectedColor,
  onChange,
}: {
  selectedColor: string;
  onChange: (color: string) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const selectedOption = colorOptions.find((opt) => opt.color === selectedColor);

  const handleSelectColor = (colorValue: string) => {
    onChange(colorValue);
    setVisible(false);
  };

  const dropdownContent = (
    <div className="p-3 bg-white rounded-md shadow-lg border border-primaryN30">
      <div className="grid grid-cols-6 gap-2">
        {colorOptions.map((opt) => (
          <button
            key={opt.color}
            type="button"
            onClick={() => handleSelectColor(opt.color)}
            className={`w-[20px] h-[20px] rounded-full ${opt.twColor} flex items-center justify-center transition-all hover:scale-110 ${selectedColor === opt.color
              ? "ring-1 ring-offset-1 ring-black"
              : ""
              }`}
          >
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dropdown
      open={visible}
      onOpenChange={setVisible}
      dropdownRender={() => dropdownContent}
      trigger={["click"]}
    >
      <div className="w-full h-[32px] px-3 flex items-center justify-between border border-primaryN30 rounded-md cursor-pointer hover:border-forumBlue-normal bg-white">
        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded-full ${selectedOption?.twColor}`} />
          <span className="text-xs text-grey-normal">{selectedOption?.label}</span>
        </div>
        <DownOutlined className="text-xs text-grey-normal" />
      </div>
    </Dropdown>
  );
};

// 系统默认类型，不允许修改名称
const SYSTEM_DEFAULT_TYPES = ["Item", "Table", "Context information"];

export default function NewLogicBoxModal({
  isOpen,
  onClose,
  onSuccess,
  editData,
}: NewLogicBoxModalProps) {
  const { company_id } = useUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#427CCE");
  const [searchPrompt, setSearchPrompt] = useState("");
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState(false);

  const isEditMode = !!editData?.id;
  const isNameEditable = !isEditMode || (editData?.name && !SYSTEM_DEFAULT_TYPES.includes(editData.name));

  useEffect(() => {
    if (isOpen && editData) {
      setName(editData.name || "");
      setDescription(editData.description || "");
      setColor(editData.color || "#427CCE");
      setSearchPrompt(editData.search_prompt || "");
      setAnalysisPrompt(editData.analysis_prompt || "");
    } else if (isOpen) {
      handleResetForm();
    }
  }, [isOpen, editData]);

  const handleSubmit = async () => {
    if (!company_id) {
      message.error("Company ID not found");
      return;
    }

    setLoading(true);

    const data = {
      name,
      description,
      color,
      search_prompt: searchPrompt,
      analysis_prompt: analysisPrompt,
    };

    let result;
    if (isEditMode && editData?.id) {
      result = await updateBoxType(company_id.toString(), editData.id, data);
    } else {
      result = await createBoxType(company_id.toString(), data);
    }

    setLoading(false);

    if (result.status === "success") {
      message.success(isEditMode ? "Logic Box updated successfully" : "Logic Box created successfully");
      handleResetForm();
      onClose();
      onSuccess?.();
    } else {
      const errorMsg = typeof result?.data === 'string'
        ? result?.data
        : result?.data?.detail || result?.data?.message || "Failed to update Logic Box";
      message.error(errorMsg);
    }
  };

  const handleCancel = () => {
    onClose();
    handleResetForm();
  };

  const handleResetForm = () => {
    setName("");
    setDescription("");
    setColor("#427CCE");
    setSearchPrompt("");
    setAnalysisPrompt("");
  };

  return (
    <Modal
      open={isOpen}
      title={null}
      centered={true}
      width={560}
      footer={null}
      onCancel={handleCancel}
      destroyOnClose={true}
    >
      <div className="p-6 font-nunito">
        <h2 className="text-lg text-forumBlue-normal mb-2">
          {isEditMode ? "Edit Logic Box" : "New Logic Box"}
        </h2>
        <p className="text-xs text-[#6B6B6B] mb-6">
          {isEditMode
            ? "Update the instructions for this Logic Box."
            : "Create a new set of instructions to tell CATO which specific details to find in your files."}
        </p>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm mb-1 block">
              Logic Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Item, Table, Glass Table, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border-primaryN30"
              disabled={!isNameEditable}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm mb-1 block">
              Color <span className="text-red-500">*</span>
            </label>
            <ColorDropdown selectedColor={color} onChange={setColor} />
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm mb-1 block">
            Search Prompt <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-[#6B6B6B] mb-2">
            Describe what this type of information typically look like so CATO can find it in the future on its own.
          </p>
          <TextArea
            placeholder="Example text."
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            rows={3}
            className="rounded-md border-primaryN30"
          />
        </div>

        <div className="mb-8">
          <label className="text-sm mb-1 block">
            Analysis Prompt <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-[#6B6B6B] mb-2">
            Once the information is found, describe how you want CATO to analyze the information and correlate to the other information.
          </p>
          <TextArea
            placeholder="Example text."
            value={analysisPrompt}
            onChange={(e) => setAnalysisPrompt(e.target.value)}
            rows={3}
            className="rounded-md border-primaryN30"
          />
        </div>

        <div className="flex items-center justify-between">
          <a
            className="text-xs text-grey-light-strong underline cursor-pointer hover:text-forumBlue-normal"
            onClick={() => setShowExamplesModal(true)}
          >
            Explore Examples
          </a>
          <div className="flex gap-3">
            <Button
              className="custom-default-btn"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              className="custom-primary-btn !w-[76px]"
              onClick={handleSubmit}
              disabled={!name || !searchPrompt || !analysisPrompt || !color}
              loading={loading}
            >
              {isEditMode ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </div>

      <LogicBoxExamplesModal
        isOpen={showExamplesModal}
        onClose={() => setShowExamplesModal(false)}
      />
    </Modal>
  );
}
