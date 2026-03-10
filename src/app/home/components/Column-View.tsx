import { Checkbox, Button, Modal } from "antd";
import { useState, useCallback } from "react";
import Image from "next/image";

interface ColumnViewProps {
  open: boolean;
  onClose: () => void;
  columns: { field_name: string; Hint_text: string }[];
  onColumnsChange: (columns: string[]) => void;
  selectedColumns: string[];
}

const SortableItem = ({ field, onChange, checked, disabledCheckbox }: any) => {
  if (field.field_name === "actions") return null;
  const isProjectName = field.field_name === "project_name";
  return (
    <div
      className={`px-2 w-full h-[30px] flex flex-row items-center rounded-md ${isProjectName ? "bg-primaryN20" : ""}`}
    >
      <div className="pr-4">
        <Image src="/assets/icons/drag.svg" alt="Drag" width={6} height={10} />
      </div>
      <div className="flex-1 text-sm">{field?.Hint_text}</div>
      {!isProjectName && (
        <div className="text-right">
          <Checkbox
            disabled={disabledCheckbox}
            value={field.field_name}
            checked={checked}
            onChange={() => {
              if (disabledCheckbox) return;
              onChange(field.field_name);
            }}
            className="text-sm flex-1"
          />
        </div>
      )}
    </div>
  );
};

export const ColumnView = ({
  open,
  onClose,
  columns,
  onColumnsChange,
  selectedColumns,
}: ColumnViewProps) => {
  const filteredColumns = selectedColumns.filter(
    (value) => value !== "actions",
  );

  const [checkedColumns, setCheckedColumns] =
    useState<string[]>(filteredColumns);

  const handleCheckboxChange = useCallback(
    (columnKey: string) => {
      const checked = checkedColumns.includes(columnKey);
      let newCheckedColumns;
      if (checked) {
        newCheckedColumns = checkedColumns.filter((key) => key !== columnKey);
      } else {
        newCheckedColumns = [...checkedColumns, columnKey];
      }
      setCheckedColumns(newCheckedColumns);
    },
    [checkedColumns],
  );

  const handleSave = useCallback(() => {
    onColumnsChange(checkedColumns);
    onClose();
  }, [checkedColumns, onClose]);

  return (
    <Modal
      onCancel={onClose}
      open={open}
      closable={false}
      footer={
        <div className="mt-4 flex gap-3 justify-end">
          <Button className="w-[76px] h-[28px]" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="w-[76px] h-[28px]"
            type="primary"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      }
    >
      <div className="flex flex-col mb-4">
        <p className="text-forumBlue-normal text-lg">Column Order</p>
        <p className="text-grey-dark text-xs">Only show up to 5 fields</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {columns.map((field: any, index: number) => {
          const isChecked = checkedColumns.includes(field.field_name);
          // 6 is the max number of columns that can be displayed, 1 always being the project name.
          const disabledCheckbox = checkedColumns.length >= 6;
          return (
            <SortableItem
              key={`item-${field.field_name}`}
              index={index}
              field={field}
              checked={isChecked}
              onChange={(field_name: string) =>
                handleCheckboxChange(field_name)
              }
              disabledCheckbox={!isChecked && disabledCheckbox}
            />
          );
        })}
      </div>
    </Modal>
  );
};
