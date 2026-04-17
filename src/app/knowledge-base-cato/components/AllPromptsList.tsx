"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusOutlined, SearchOutlined, HolderOutlined } from "@ant-design/icons";
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
  onUpdateFieldIndex?: (fieldId: string, index: number) => void;
}

export const AllPromptsList = ({
  fields,
  selectedFieldId,
  onSelectField,
  onCreatePrompt,
  onCopyField,
  onDeleteField,
  onUpdateFieldIndex,
}: AllPromptsListProps) => {
  const [searchText, setSearchText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [orderedFields, setOrderedFields] = useState<PromptField[]>(fields);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<"top" | "bottom" | null>(null);

  useEffect(() => {
    setOrderedFields((previousFields) => {
      if (!previousFields.length) return fields;

      const latestFieldsById = new Map(fields.map((field) => [field.id, field]));
      const previousFieldIds = new Set(previousFields.map((field) => field.id));

      const keptFieldsInOrder = previousFields
        .filter((field) => latestFieldsById.has(field.id))
        .map((field) => latestFieldsById.get(field.id)!);
      const newlyAddedFields = fields.filter((field) => !previousFieldIds.has(field.id));

      return [...keptFieldsInOrder, ...newlyAddedFields];
    });
  }, [fields]);

  const filteredFields = useMemo(() => {
    if (!searchText.trim()) return orderedFields;
    return orderedFields.filter((field) =>
      field.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [orderedFields, searchText]);

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

  const getDropPosition = (target: HTMLDivElement, clientY: number): "top" | "bottom" => {
    const targetRect = target.getBoundingClientRect();
    const targetMiddleY = targetRect.top + targetRect.height / 2;
    return clientY < targetMiddleY ? "top" : "bottom";
  };

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, fieldId: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", fieldId);

    // Use the full row as drag preview so users can see the whole item moving.
    const rowElement = e.currentTarget.closest("[data-prompt-row='true']") as HTMLElement | null;
    if (rowElement) {
      e.dataTransfer.setDragImage(rowElement, rowElement.clientWidth / 2, rowElement.clientHeight / 2);
    }

    setDraggingFieldId(fieldId);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    targetFieldId: string,
    forcedPosition?: "top" | "bottom"
  ) => {
    if (!draggingFieldId || draggingFieldId === targetFieldId) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    const dropPosition = forcedPosition ?? getDropPosition(e.currentTarget, e.clientY);
    setDragOverFieldId(targetFieldId);
    setDragOverPosition(dropPosition);
  };

  const clearDragState = () => {
    setDraggingFieldId(null);
    setDragOverFieldId(null);
    setDragOverPosition(null);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetFieldId: string,
    forcedPosition?: "top" | "bottom"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceFieldId = draggingFieldId ?? e.dataTransfer.getData("text/plain");
    if (!sourceFieldId || sourceFieldId === targetFieldId) {
      clearDragState();
      return;
    }

    const dropPosition = forcedPosition ?? getDropPosition(e.currentTarget, e.clientY);
    let nextIndex = -1;

    setOrderedFields((previousFields) => {
      const sourceIndex = previousFields.findIndex((field) => field.id === sourceFieldId);
      const targetIndex = previousFields.findIndex((field) => field.id === targetFieldId);
      if (sourceIndex === -1 || targetIndex === -1) return previousFields;

      const nextFields = [...previousFields];
      const [draggedField] = nextFields.splice(sourceIndex, 1);
      let insertIndex = targetIndex;

      if (sourceIndex < targetIndex) {
        insertIndex -= 1;
      }
      if (dropPosition === "bottom") {
        insertIndex += 1;
      }

      nextFields.splice(insertIndex, 0, draggedField);
      nextIndex = insertIndex;
      return nextFields;
    });

    // TODO: reorder API will be called here after backend contract is confirmed.
    clearDragState();

    // 通知父组件更新字段索引
    if (nextIndex !== -1) {
      onUpdateFieldIndex?.(sourceFieldId, nextIndex + 1);
    }
  };

  return (
    <div className="w-[350px] h-full flex flex-col">
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
            <div key={field.id}>
              {draggingFieldId && dragOverFieldId === field.id && dragOverPosition === "top" && (
                <div
                  className="h-[36px] mb-1 rounded-md border-2 border-dashed border-forumBlue-normal bg-forumBlue-light-active px-2 flex items-center text-xs text-forumBlue-dark-active"
                  onDragOver={(e) => handleDragOver(e, field.id, "top")}
                  onDrop={(e) => handleDrop(e, field.id, "top")}
                >
                  Drop here
                </div>
              )}
              <div
                data-prompt-row="true"
                className={`group h-[36px] px-3 rounded-md cursor-pointer text-xs border border-primaryN30 flex items-center justify-between transition-all ${selectedFieldId === field.name
                  ? "bg-forumBlue-light-active"
                  : "hover:bg-grey-light"
                  } ${draggingFieldId === field.id ? "opacity-35 scale-[0.98] shadow-sm" : ""}`}
                onClick={() => {
                  onSelectField(field.name);
                }}
                onDragOver={(e) => handleDragOver(e, field.id)}
                onDrop={(e) => handleDrop(e, field.id)}
                onDragEnd={clearDragState}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    className="cursor-grab active:cursor-grabbing text-grey-normal hover:text-forumBlue-normal transition-colors p-0.5 rounded"
                    draggable
                    onClick={(e) => e.stopPropagation()}
                    onDragStart={(e) => handleDragStart(e, field.id)}
                    onDragEnd={clearDragState}
                    title="Drag to reorder"
                  >
                    <HolderOutlined className="text-sm" />
                  </button>
                  <span className="flex-1 truncate">{field.name}</span>
                </div>
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
              {draggingFieldId && dragOverFieldId === field.id && dragOverPosition === "bottom" && (
                <div
                  className="h-[36px] mt-1 rounded-md border-2 border-dashed border-forumBlue-normal bg-forumBlue-light-active px-2 flex items-center text-xs text-forumBlue-dark-active"
                  onDragOver={(e) => handleDragOver(e, field.id, "bottom")}
                  onDrop={(e) => handleDrop(e, field.id, "bottom")}
                >
                  Drop here
                </div>
              )}
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
