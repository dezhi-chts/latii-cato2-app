"use client";

import { Checkbox, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import Image from "next/image";
import { useMemo, useState } from "react";

export type ItemResultRow = {
  id: number;
  take_off_id: number;
  project_file_id: number;
  evidence_id: number | null;
  evidence_ids: string | null;
  evidence_id_list?: number[];
  is_checked: boolean;
  is_deleted: boolean;
  is_reconciled: boolean;
  reconcile_source_ids: number[] | null;
  reconcile_batch_id: number | null;
  create_user: string;
  create_time: string;
  update_user: string;
  update_time: string;
  result: {
    Label?: string;
    Product?: string;
    "Product Type"?: string;
    Operability?: string;
    Width?: number;
    Height?: number;
    Width_mm?: number;
    Height_mm?: number;
    Quantity?: number;
    Location?: string;
    "Source Type"?: string;
  };
};

type Props = {
  items?: ItemResultRow[];
  onToggleChecked?: (itemId: number, checked: boolean) => Promise<void> | void;
  onOpenEvidence?: (item: ItemResultRow) => void;
  onRowClick?: (item: ItemResultRow) => void;
};

const getCategory = (product?: string) => {
  if (!product) return "-";
  return product;
};

const getType = (productType?: string) => {
  if (!productType) return "-";
  return productType.replace("Casement ", "");
};

const getStatusVariant = (item: ItemResultRow) => {
  if (item.is_checked) return "checked";
  if (item.is_reconciled) return "reconciled";
  return "default";
};

const statusCircleClassMap = {
  checked: "border-[#2F80ED] text-[#2F80ED]",
  reconciled: "border-[#27AE60] bg-[#27AE60] text-white",
  default: "border-[#D9D9D9] text-transparent",
};

export default function NewItemsTable({
  items = [],
  onToggleChecked,
  onOpenEvidence,
  onRowClick,
}: Props) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const dataSource = useMemo(() => {
    return items.map((item) => ({
      ...item,
      key: item.id,
    }));
  }, [items]);

  const columns: ColumnsType<ItemResultRow & { key: number }> = [
    {
      title: "",
      dataIndex: "selection",
      width: 52,
      fixed: "left",
      render: (_, record) => (
        <div
          className="flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={selectedRowKeys.includes(record.id)}
            onChange={(e) => {
              const checked = e.target.checked;

              setSelectedRowKeys((prev) => {
                if (checked) {
                  return [...prev, record.id];
                }

                return prev.filter((key) => key !== record.id);
              });
            }}
          />
        </div>
      ),
    },
    {
      title: "label",
      dataIndex: ["result", "Label"],
      width: 120,
      render: (_, record) => {
        const hasChildren = false;

        return (
          <div className="flex items-center justify-between gap-2">
            <span>{record.result?.Label ?? "-"}</span>
            {hasChildren ? (
              <span className="text-lg leading-none">›</span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Sub-Label",
      width: 120,
      render: (_, record) => record.result?.Label ?? "-",
    },
    {
      title: "Location",
      width: 180,
      render: (_, record) => <span>{record.result?.Location ?? "-"}</span>,
    },
    {
      title: "Quantity",
      width: 110,
      render: (_, record) => record.result?.Quantity ?? "-",
    },
    {
      title: "Category",
      width: 140,
      render: (_, record) => getCategory(record.result?.Product),
    },
    {
      title: "Type",
      width: 180,
      render: (_, record) => getType(record.result?.["Product Type"]),
    },
    {
      title: "Width",
      width: 110,
      render: (_, record) => record.result?.Width ?? "-",
    },
    {
      title: "Status",
      width: 120,
      render: (_, record) => {
        const variant = getStatusVariant(record);

        return (
          <div className="flex items-center gap-4">
            <button
              type="button"
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[12px] ${statusCircleClassMap[variant]}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleChecked?.(record.id, !record.is_checked);
              }}
            >
              {record.is_reconciled ? "✓" : "•"}
            </button>

            <span className="text-[#BDBDBD] text-lg leading-none">↺</span>
          </div>
        );
      },
    },
    {
      title: "",
      width: 120,
      fixed: "right",
      render: (_, record) => {
        const evidenceCount = record.evidence_id_list?.length ?? 0;

        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEvidence?.(record);
              }}
              className="flex items-center gap-1"
            >
              <Image
                src="/assets/icons/file-refrence.svg"
                alt="reference"
                width={16}
                height={16}
              />
              <span className="min-w-5 h-5 px-1 rounded-full bg-[#E5E7EB] text-[11px] flex items-center justify-center">
                {evidenceCount}
              </span>
            </button>

            <Tooltip title="More actions">
              <button
                type="button"
                className="text-[#BDBDBD] text-xl leading-none"
                onClick={(e) => e.stopPropagation()}
              >
                …
              </button>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full flex">
      <div className="w-[6px] rounded-l-xl bg-[#2F80ED]" />

      <div className="flex-1 overflow-hidden border border-[#E5E7EB] rounded-r-xl">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          size="large"
          scroll={{ x: 1200, y: "calc(100vh - 280px)" }}
          onRow={(record) => ({
            onClick: () => onRowClick?.(record),
          })}
        />
      </div>
    </div>
  );
}
