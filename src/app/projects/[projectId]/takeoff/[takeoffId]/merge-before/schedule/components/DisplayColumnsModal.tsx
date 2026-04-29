"use client";

import { Checkbox, Modal } from "antd";

interface DisplayColumnsModalProps {
  open: boolean;
  templateColumns: string[];
  selectedColumns: string[];
  requiredColumns: readonly string[];
  onToggleColumn: (fieldName: string, checked: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DisplayColumnsModal({
  open,
  templateColumns,
  selectedColumns,
  requiredColumns,
  onToggleColumn,
  onCancel,
  onConfirm,
}: DisplayColumnsModalProps) {
  return (
    <Modal
      open={open}
      title="Select Display Columns"
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Confirm"
      cancelText="Cancel"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          {templateColumns.map((fieldName) => {
            const isRequired = requiredColumns.includes(fieldName);
            const checked = selectedColumns.includes(fieldName);
            return (
              <label
                key={`display-column-${fieldName}`}
                className="flex cursor-pointer items-start gap-2 text-sm text-grey-dark"
              >
                <Checkbox
                  checked={checked}
                  disabled={isRequired}
                  onChange={(event) => onToggleColumn(fieldName, event.target.checked)}
                  className="custom-checkbox text-xs text-grey-normal"
                />
                <span className="whitespace-normal break-words leading-5">{fieldName}</span>
              </label>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
