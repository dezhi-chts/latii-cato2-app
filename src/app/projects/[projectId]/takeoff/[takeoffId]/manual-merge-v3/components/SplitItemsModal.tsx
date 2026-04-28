"use client";

import { Input, Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

interface SplitItemsModalProps {
  open: boolean;
  loading?: boolean;
  rows: any[];
  columns: ColumnsType<any>;
  currentLabel: string;
  allLabels: string[];
  onCancel: () => void;
  onSave: (selectedRowKeys: React.Key[], targetLabel: string) => Promise<void>;
}

const getDefaultSplitLabel = (currentLabel: string, allLabels: string[]) => {
  const baseLabel = `${String(currentLabel || "").trim()} split`.trim();
  if (!baseLabel) return "split";

  const normalizedExistingLabels = new Set(
    (allLabels || []).map((label) => String(label || "").trim().toLowerCase()),
  );

  if (!normalizedExistingLabels.has(baseLabel.toLowerCase())) {
    return baseLabel;
  }

  let suffix = 2;
  while (normalizedExistingLabels.has(`${baseLabel} ${suffix}`.toLowerCase())) {
    suffix += 1;
  }
  return `${baseLabel} ${suffix}`;
};

export default function SplitItemsModal({
  open,
  loading = false,
  rows,
  columns,
  currentLabel,
  allLabels,
  onCancel,
  onSave,
}: SplitItemsModalProps) {
  const [targetLabel, setTargetLabel] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (open) {
      setTargetLabel(getDefaultSplitLabel(currentLabel, allLabels));
      setSelectedRowKeys([]);
      setErrorMessage("");
      return;
    }
    setTargetLabel("");
    setSelectedRowKeys([]);
    setErrorMessage("");
  }, [allLabels, currentLabel, open]);

  const handleSubmit = async () => {
    if (selectedRowKeys.length === 0) {
      setErrorMessage("Please select at least one item.");
      return;
    }

    const normalizedTargetLabel = targetLabel.trim();
    if (!normalizedTargetLabel) {
      setErrorMessage("Please input a new label name.");
      return;
    }

    if (normalizedTargetLabel === currentLabel) {
      setErrorMessage("Please input a different label name.");
      return;
    }

    const normalizedInputLabel = normalizedTargetLabel.toLowerCase();
    const duplicated = (allLabels || []).some(
      (label) => String(label || "").trim().toLowerCase() === normalizedInputLabel,
    );
    if (duplicated) {
      setErrorMessage("This label already exists. Please input a new label name.");
      return;
    }

    setErrorMessage("");
    await onSave(selectedRowKeys, normalizedTargetLabel);
  };

  return (
    <Modal
      open={open}
      title="Split Items"
      width={1100}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="Save"
      cancelText="Cancel"
      confirmLoading={loading}
    >
      <div className="flex flex-col gap-3">
        <Table<any>
          rowKey={(record) => record.id ?? record.__rowKey}
          columns={columns}
          dataSource={rows}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: (nextRowKeys) => setSelectedRowKeys(nextRowKeys),
          }}
          scroll={{ x: "max-content", y: 380 }}
          className="h-full [&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
        />

        <div className="flex items-center gap-3">
          <span className="w-[60px] text-sm text-grey-normal">Label</span>
          <div className="flex-1">
            <Input
              value={targetLabel}
              onChange={(event) => {
                setTargetLabel(event.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              placeholder="Input new label"
              maxLength={200}
            />
            {errorMessage ? (
              <div className="mt-1 text-xs text-[#ff4d4f]">{errorMessage}</div>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
