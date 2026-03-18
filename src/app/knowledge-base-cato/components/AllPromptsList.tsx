"use client";

import { useState, useMemo } from "react";
import { PlusOutlined, CopyOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { Input, Modal, Button } from "antd";
import Image from "next/image";


interface PromptField {
  id: string;
  name: string;
  hasError?: boolean;
}

interface AllPromptsListProps {
  fields: PromptField[];
  selectedFieldId: string;
  onSelectField: (id: string) => void;
  onCreatePrompt: () => void;
  onCopyField?: (fieldId: string) => void;
  onDeleteField?: (fieldId: string) => void;
}

export const AllPromptsList = ({
  fields,
  selectedFieldId,
  onSelectField,
  onCreatePrompt,
  onCopyField,
  onDeleteField,
}: AllPromptsListProps) => {
  const [searchText, setSearchText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);

  const filteredFields = useMemo(() => {
    if (!searchText.trim()) return fields;
    return fields.filter((field) =>
      field.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [fields, searchText]);

  const handleCopyField = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    onCopyField?.(fieldId);
  };

  const handleDeleteClick = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    setFieldToDelete(fieldId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (fieldToDelete) {
      onDeleteField?.(fieldToDelete);
    }
    setShowDeleteModal(false);
    setFieldToDelete(null);
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setFieldToDelete(null);
  };

  return (
    <div className="w-[350px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-base text-grey-normal">All Prompts</span>
        <button
          className="w-[80px] h-[26px] flex items-center text-xs justify-center rounded-lg transition-colors bg-forumBlue-light-hover text-forumBlue-dark-active"
          onClick={onCreatePrompt}
        >
          <PlusOutlined className="text-xs" />
          <span className="ml-1">Prompt</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-3">
        <Input
          size="small"
          placeholder="Project Name, Status, Client and More."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined className="text-grey-normal" />}
          className="h-[28px] border-primaryN30 rounded-md text-xs"
          allowClear
        />
      </div>

      {/* Field List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2">
          {filteredFields.map((field) => (
            <div
              key={field.name}
              className={`group h-[36px] px-3 rounded-md cursor-pointer text-xs border border-primaryN30 flex items-center justify-between transition-all ${selectedFieldId === field.name
                ? "bg-forumBlue-light-active"
                : "hover:bg-grey-light"
                }`}
              onClick={() => {
                onSelectField(field.name);
              }}
            >
              <span className="flex-1 truncate">{field.name}</span>
              <div className="flex items-center gap-2">
                {field.hasError && (
                  <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                )}
                {/* Copy and Delete buttons - show on hover or when selected */}
                <div
                  className={`flex items-center gap-1 transition-opacity ${selectedFieldId === field.name
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                    }`}
                >
                  <button
                    className="p-1 rounded hover:bg-white/50 transition-colors"
                    onClick={(e) => handleCopyField(e, field.id)}
                    title="Copy"
                  >
                    <Image src="/assets/icons/copy.svg" alt="plus icon" width={15} height={15} ></Image>
                  </button>
                  <button
                    className="p-1 rounded hover:bg-white/50 transition-colors"
                    onClick={(e) => handleDeleteClick(e, field.id)}
                    title="Delete"
                  >
                    <Image src="/assets/icons/delete-forum-blue.svg" alt="plus icon" width={15} height={15} ></Image>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        title={null}
        centered={true}
        width={380}
        footer={null}
        onCancel={handleCloseModal}
      >
        <div className="font-nunito px-2 py-4">
          <h3 className="text-base font-medium text-forumBlue-normal mb-4">
            Delete Individual Prompt?
          </h3>
          <p className="text-sm">
            This prompt will be removed from your library and <span className="font-bold">all templates</span> that contain it.
          </p>
          <p className="text-sm">
            This action cannot be undone.
          </p>
          <p className="mt-4 mb-6 text-sm ">
            Are you sure you want to continue?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              className="custom-default-btn"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              className="custom-default-btn !bg-[#FF931D] !text-white hover:!bg-[#FF931D]"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
