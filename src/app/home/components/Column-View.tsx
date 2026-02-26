import { Checkbox, Drawer, Button, Modal } from "antd";
import { useState, useMemo, useCallback } from "react";
import Image from "next/image";

interface ColumnViewProps {
  open: boolean;
  onClose: () => void;
  columns: { field_name: string; Hint_text: string }[];
  onColumnsChange: (columns: string[]) => void;
  selectedColumns: string[];
}

const SortableItem = ({ field, onChange, checked }: any) => {
  const disable = field.field_name.includes("_name");
  return (
    <div
      className={`px-2 w-full h-[30px] flex flex-row items-center rounded-md ${disable ? "bg-primaryN20" : ""}`}
    >
      <div className="pr-4">
        <Image
          src="/assets/icons/drag.svg"
          alt="Drag"
          width={6}
          height={10}
        ></Image>
      </div>
      <div className="flex-1 text-sm">{field?.Hint_text}</div>
      <div className="text-right">
        <Checkbox
          value={field.field_name}
          checked={checked}
          onChange={() => {
            if (disable) return;
            onChange(field.field_name);
          }}
          className="text-sm flex-1"
        ></Checkbox>
      </div>
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
  const [checkedColumns, setCheckedColumns] =
    useState<string[]>(selectedColumns);

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
      title={
        <p className="text-forumBlue-normal text-lg font-semibold">
          Column View
        </p>
      }
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
      {columns.map((field: any, index: number) => {
        return (
          <SortableItem
            key={`item-${field.field_name}`}
            index={index}
            field={field}
            checked={checkedColumns.includes(field.field_name)}
            onChange={(field_name: string) => handleCheckboxChange(field_name)}
          />
        );
      })}
    </Modal>
  );
};
