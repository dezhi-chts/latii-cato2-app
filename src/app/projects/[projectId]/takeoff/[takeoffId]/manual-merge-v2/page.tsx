"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Image, Input, Modal, Segmented, Spin, Table, Tag, Tooltip, notification } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "next/navigation";

import {
  checkFileSourceMergeResultsAndCreateSingleFileResults,
  getFileSourceMergeResultsByLabel,
  getGroupedLabelsByFileAndTakeOff,
  getTakeOffById,
} from "@/services/takeOffService";
import { getTemplateById } from "@/services/templateService";
import {
  getDisplayValueByField,
  normalizeFieldName,
  parseItemResult as parseItemResultUtil,
} from "../analyze-new/takeoffUtils";

type ViewMode = "items" | "evidence";
type SourceKey = "schedule" | "floorPlan" | "elevation";

interface LabelOption {
  key: string;
  label: string;
  count?: number;
}

const SOURCE_ALIAS: Record<SourceKey, string[]> = {
  schedule: ["schedule", "window table", "table", "window_door_unit_list"],
  floorPlan: ["floor plan", "floor_plan", "floorplan"],
  elevation: ["elevation"],
};

const normalizeKey = (value: string) =>
  value.toLowerCase().replace(/[\s_-]/g, "");

const toArray = (value: any): any[] => (Array.isArray(value) ? value : []);

const ensureLabelFieldsFirst = (fields: string[]) => {
  const hasLabel = fields.includes("Label");
  const hasSubLabel = fields.includes("Sub Label");
  const others = fields.filter((f) => f !== "Label" && f !== "Sub Label");
  const result: string[] = [];
  if (hasLabel) result.push("Label");
  if (hasSubLabel) result.push("Sub Label");
  result.push(...others);
  return result;
};

const normalizeRows = (rows: any[]) =>
  toArray(rows).map((row) => ({
    ...row,
    id: row?.id ?? `${Math.random()}`,
    result: parseItemResultUtil(row?.result as any),
  }));

function TruncatedTextCell({ value }: { value: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const element = divRef.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  }, [value]);

  return (
    <div ref={divRef} className="truncate">
      {isTruncated ? (
        <Tooltip
          title={value}
          placement="topLeft"
          color="white"
          styles={{
            body: {
              backgroundColor: "#ffffff",
              color: "#333333",
              border: "1px solid #d9d9d9",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            },
          }}
        >
          <span>{value || "-"}</span>
        </Tooltip>
      ) : (
        <span>{value || "-"}</span>
      )}
    </div>
  );
}

const extractEvidenceUrls = (item: any): string[] => {
  const urls: string[] = [];
  if (typeof item?.evidence_url === "string" && item.evidence_url) urls.push(item.evidence_url);
  if (typeof item?.s3_url === "string" && item.s3_url) urls.push(item.s3_url);
  if (typeof item?.evidence_msg?.s3_url === "string" && item.evidence_msg.s3_url) {
    urls.push(item.evidence_msg.s3_url);
  }
  if (Array.isArray(item?.evidence_urls)) {
    item.evidence_urls.forEach((url: any) => {
      if (typeof url === "string" && url) urls.push(url);
    });
  }
  if (Array.isArray(item?.evidence_msg)) {
    item.evidence_msg.forEach((msg: any) => {
      if (typeof msg?.s3_url === "string" && msg.s3_url) urls.push(msg.s3_url);
    });
  }
  if (Array.isArray(item?.evidences)) {
    item.evidences.forEach((ev: any) => {
      if (typeof ev?.s3_url === "string" && ev.s3_url) urls.push(ev.s3_url);
      if (typeof ev?.evidence_url === "string" && ev.evidence_url) urls.push(ev.evidence_url);
    });
  }
  return Array.from(new Set(urls));
};

const collectSourceRows = (payload: any, source: SourceKey): any[] => {
  if (!payload) return [];

  // New API shape:
  // [
  //   { source_type: "Elevation", list: [...] },
  //   { source_type: "Floor Plan", list: [...] },
  //   { source_type: "Schedule", list: [...] }
  // ]
  if (Array.isArray(payload)) {
    const sourceNode = payload.find((node: any) => {
      const nodeType = normalizeKey(String(node?.source_type || node?.mapped_source_type || ""));
      return SOURCE_ALIAS[source].some((alias) =>
        nodeType.includes(normalizeKey(alias)),
      );
    });
    if (sourceNode && Array.isArray(sourceNode?.list)) {
      return sourceNode.list;
    }

    const filtered = payload.filter((item: any) => {
      const typeText = String(
        item?.page_type || item?.source_type || item?.sourceType || item?.type || "",
      );
      const normalizedType = normalizeKey(typeText);
      return SOURCE_ALIAS[source].some((alias) =>
        normalizedType.includes(normalizeKey(alias)),
      );
    });
    return filtered.length > 0 ? filtered : payload;
  }

  if (payload && typeof payload === "object") {
    const nodeType = normalizeKey(String(payload?.source_type || payload?.mapped_source_type || ""));
    const matchedNode = SOURCE_ALIAS[source].some((alias) =>
      nodeType.includes(normalizeKey(alias)),
    );
    if (matchedNode && Array.isArray(payload?.list)) {
      return payload.list;
    }
  }

  const entries = Object.entries(payload || {});
  for (const [key, value] of entries) {
    const normalized = normalizeKey(key);
    const matched = SOURCE_ALIAS[source].some((alias) =>
      normalized.includes(normalizeKey(alias)),
    );
    if (matched && Array.isArray(value)) return value;
  }

  for (const [, value] of entries) {
    if (value && typeof value === "object") {
      const nestedRows = collectSourceRows(value, source);
      if (nestedRows.length > 0) return nestedRows;
    }
  }

  return [];
};

export default function ManualMergeV2Page() {
  const takeoffId = useParams().takeoffId as string;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileId, setFileId] = useState<string>("");
  const [labels, setLabels] = useState<LabelOption[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);

  const [scheduleRows, setScheduleRows] = useState<any[]>([]);
  const [floorPlanRows, setFloorPlanRows] = useState<any[]>([]);
  const [elevationRows, setElevationRows] = useState<any[]>([]);

  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [scheduleChanges, setScheduleChanges] = useState<Record<string, any>>({});

  const [viewMode, setViewMode] = useState<Record<"floorPlan" | "elevation", ViewMode>>({
    floorPlan: "items",
    elevation: "items",
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const modifiedCount = useMemo(() => Object.keys(scheduleChanges).length, [scheduleChanges]);

  const floorPlanEvidenceUrls = useMemo(
    () => Array.from(new Set(floorPlanRows.flatMap((item) => extractEvidenceUrls(item)))),
    [floorPlanRows],
  );
  const elevationEvidenceUrls = useMemo(
    () => Array.from(new Set(elevationRows.flatMap((item) => extractEvidenceUrls(item)))),
    [elevationRows],
  );

  const fetchColumns = useCallback(async () => {
    const result = await getTemplateById(1);
    if (result.status === "success" && result.data) {
      const fieldNames = (result.data.fields || [])
        .map((field: any) => field.name || field.field_name)
        .filter(Boolean)
        .map(normalizeFieldName);
      if (fieldNames.length > 0) {
        setColumns(ensureLabelFieldsFirst(fieldNames));
        return;
      }
    }

    setColumns(["Label", "Sub Label", "Product", "Product Type", "Quantity"]);
  }, []);

  const fetchLabelData = useCallback(async (label: string) => {
    if (!label) return;
    setLoading(true);
    try {
      const response = await getFileSourceMergeResultsByLabel(takeoffId, fileId, label);
      if (response.status !== "success") {
        notification.error({
          message: "Error",
          description: "Failed to load merge rows by label.",
        });
        return;
      }

      const payload = response.data?.data ?? response.data ?? [];
      setScheduleRows(normalizeRows(collectSourceRows(payload, "schedule")));
      setFloorPlanRows(normalizeRows(collectSourceRows(payload, "floorPlan")));
      setElevationRows(normalizeRows(collectSourceRows(payload, "elevation")));
      setScheduleChanges({});
      setEditingCell(null);
      setEditingValue("");
    } finally {
      setLoading(false);
    }
  }, [fileId, takeoffId]);

  const initPage = useCallback(async () => {
    if (!takeoffId) return;
    setLoading(true);
    try {
      const takeoffRes = await getTakeOffById(takeoffId);
      if (takeoffRes.status !== "success") {
        notification.error({
          message: "Error",
          description: "Failed to load takeoff data.",
        });
        return;
      }

      const firstFileId = takeoffRes.data?.project_files?.[0]?.id;
      if (!firstFileId) {
        notification.warning({
          message: "Warning",
          description: "No file found for current takeoff.",
        });
        return;
      }
      setFileId(String(firstFileId));

      const labelsRes = await getGroupedLabelsByFileAndTakeOff(takeoffId, String(firstFileId));
      if (labelsRes.status !== "success") {
        notification.error({
          message: "Error",
          description: "Failed to load grouped labels.",
        });
        return;
      }

      const rawLabels = toArray(labelsRes.data);
      const nextLabels: LabelOption[] = rawLabels
        .map((item: any, index: number) => {
          if (typeof item === "string") {
            return { key: `${item}-${index}`, label: item, count: undefined };
          }
          const label =
            item?.label || item?.name || item?.group_label || item?.groupLabel || "";
          if (!label) return null;
          return {
            key: `${label}-${index}`,
            label,
            count: Number(item?.count || item?.total || 0) || undefined,
          };
        })
        .filter(Boolean) as LabelOption[];

      setLabels(nextLabels);
      if (nextLabels.length > 0) {
        setSelectedLabel(nextLabels[0].label);
        await fetchLabelData(nextLabels[0].label);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchLabelData, takeoffId]);

  useEffect(() => {
    fetchColumns();
    initPage();
  }, [fetchColumns, initPage]);

  const handleSwitchLabel = async (label: string) => {
    if (label === selectedLabel) return;
    if (modifiedCount > 0) {
      Modal.warning({
        title: "Unsaved Changes",
        content: "You have unsaved Schedule edits. Please submit label changes before switching.",
      });
      return;
    }
    setSelectedLabel(label);
    await fetchLabelData(label);
  };

  const startEdit = (record: any, fieldName: string) => {
    const id = String(record.id);
    setEditingCell({ id, field: fieldName });
    const currentValue = getDisplayValueByField(record?.result || {}, fieldName);
    setEditingValue(currentValue === "-" ? "" : currentValue);
  };

  const commitEdit = (record: any, fieldName: string) => {
    const id = String(record.id);
    const oldDisplay = getDisplayValueByField(record?.result || {}, fieldName);
    const oldValue = oldDisplay === "-" ? "" : oldDisplay;
    const newValue = editingValue.trim();
    setEditingCell(null);
    setEditingValue("");
    if (oldValue === newValue) return;

    setScheduleRows((prev) =>
      prev.map((row) => {
        if (String(row.id) !== id) return row;
        const nextRow = {
          ...row,
          result: {
            ...parseItemResultUtil(row?.result as any),
            [fieldName]: newValue,
          },
        };
        setScheduleChanges((prevChanges) => ({
          ...prevChanges,
          [id]: nextRow,
        }));
        return nextRow;
      }),
    );
  };

  const handleSubmitChanges = async () => {
    if (!takeoffId || !fileId) return;
    const ids = Object.keys(scheduleChanges);
    if (ids.length === 0) {
      notification.info({
        message: "No Changes",
        description: "No Schedule changes to submit.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await checkFileSourceMergeResultsAndCreateSingleFileResults(
        takeoffId,
        fileId,
        ids.join(","),
        Object.values(scheduleChanges),
      );
      if (response.status === "success") {
        notification.success({
          message: "Success",
          description: `Submitted ${ids.length} modified rows.`,
        });
        setScheduleChanges({});
        await fetchLabelData(selectedLabel);
        return;
      }

      notification.error({
        message: "Error",
        description: "Failed to submit modified Schedule rows.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderTable = (
    rows: any[],
    editable: boolean,
    withEvidenceAction: boolean,
  ) => {
    const dataColumns: ColumnsType<any> = columns.map((fieldName) => ({
      title: <div className="text-center text-xs text-grey-normal">{fieldName}</div>,
      key: fieldName,
      dataIndex: fieldName,
      width: fieldName === "Label" || fieldName === "Sub Label" ? 120 : 130,
      fixed: fieldName === "Label" || fieldName === "Sub Label" ? ("left" as const) : undefined,
      align: "center" as const,
      render: (_: unknown, record: any) => {
        const value = getDisplayValueByField(record?.result || {}, fieldName);
        const isEditing = editable && editingCell?.id === String(record.id) && editingCell?.field === fieldName;
        if (isEditing) {
          return (
            <Input
              autoFocus
              size="small"
              value={editingValue}
              onChange={(event) => setEditingValue(event.target.value)}
              onBlur={() => commitEdit(record, fieldName)}
              onPressEnter={() => commitEdit(record, fieldName)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setEditingCell(null);
                  setEditingValue("");
                }
              }}
            />
          );
        }
        return (
          <div
            className={`mx-auto w-full max-w-[300px] overflow-hidden text-xs ${
              editable ? "cursor-text" : ""
            }`}
            onClick={() => {
              if (editable) startEdit(record, fieldName);
            }}
          >
            <TruncatedTextCell value={value || "-"} />
          </div>
        );
      },
    }));

    const actionColumn: ColumnsType<any>[number] = {
      title: <div className="text-center text-xs text-grey-normal">Action</div>,
      key: "action",
      width: 90,
      align: "center",
      fixed: "right",
      render: (_: unknown, record: any) =>
        withEvidenceAction ? (
          <Button
            type="link"
            size="small"
            onClick={() => {
              const urls = extractEvidenceUrls(record);
              if (urls.length === 0) {
                notification.info({
                  message: "No Evidence",
                  description: "No evidence image found for this row.",
                });
                return;
              }
              setPreviewUrls(urls);
              setPreviewOpen(true);
            }}
          >
            View
          </Button>
        ) : null,
    };

    return (
      <Table<any>
        rowKey={(record) => record.id}
        columns={withEvidenceAction ? [...dataColumns, actionColumn] : dataColumns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: "max-content", y: 260 }}
        locale={{
          emptyText: (
            <div className="py-10 text-xs text-grey-normal">
              No items found.
            </div>
          ),
        }}
        className="[&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
      />
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white font-nunito">
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-primaryN30 bg-white px-10">
        <div>
          <p className="text-base font-semibold text-forumBlue-normal">Manual Merge V2</p>
          <p className="text-xs text-grey-normal">
            Review labels and submit manually edited Schedule items.
          </p>
        </div>
        <Button
          type="primary"
          className="custom-primary-btn"
          loading={submitting}
          onClick={handleSubmitChanges}
        >
          Submit Label
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 gap-4 p-4">
        <div className="w-[260px] shrink-0 rounded-xl border border-primaryN30 bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-forumBlue-normal">Labels</span>
            <span className="text-xs text-grey-normal">{labels.length} items</span>
          </div>
          <div className="space-y-2 overflow-auto max-h-[calc(100vh-180px)]">
            {labels.map((item) => {
              const active = item.label === selectedLabel;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSwitchLabel(item.label)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-xs transition-all ${active ? "border-forumBlue-normal bg-primaryN30" : "border-primaryN30"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {typeof item.count === "number" ? (
                      <span className="text-grey-normal">{item.count}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-primaryN30 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag color="blue">Base</Tag>
                <span className="text-sm font-medium text-forumBlue-normal">Schedule</span>
                <span className="text-xs text-grey-normal">{scheduleRows.length} items</span>
              </div>
              <div className="text-xs text-grey-normal">Modified: {modifiedCount}</div>
            </div>
            {renderTable(scheduleRows, true, false)}
          </div>

          <div className="rounded-xl border border-primaryN30 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-forumBlue-normal">Floor Plan</span>
                <span className="text-xs text-grey-normal">{floorPlanRows.length} items</span>
              </div>
              <Segmented
                size="small"
                value={viewMode.floorPlan}
                onChange={(value) =>
                  setViewMode((prev) => ({ ...prev, floorPlan: value as ViewMode }))
                }
                options={[
                  { label: "Items", value: "items" },
                  { label: "Evidence", value: "evidence" },
                ]}
              />
            </div>
            {viewMode.floorPlan === "items" ? (
              renderTable(floorPlanRows, false, true)
            ) : floorPlanEvidenceUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {floorPlanEvidenceUrls.map((url) => (
                  <Image
                    key={url}
                    src={url}
                    alt="Floor Plan Evidence"
                    className="w-full rounded-md border border-primaryN30"
                    preview={false}
                  />
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No evidence images." />
            )}
          </div>

          <div className="rounded-xl border border-primaryN30 bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-forumBlue-normal">Elevation</span>
                <span className="text-xs text-grey-normal">{elevationRows.length} items</span>
              </div>
              <Segmented
                size="small"
                value={viewMode.elevation}
                onChange={(value) =>
                  setViewMode((prev) => ({ ...prev, elevation: value as ViewMode }))
                }
                options={[
                  { label: "Items", value: "items" },
                  { label: "Evidence", value: "evidence" },
                ]}
              />
            </div>
            {viewMode.elevation === "items" ? (
              renderTable(elevationRows, false, true)
            ) : elevationEvidenceUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {elevationEvidenceUrls.map((url) => (
                  <Image
                    key={url}
                    src={url}
                    alt="Elevation Evidence"
                    className="w-full rounded-md border border-primaryN30"
                    preview={false}
                  />
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No evidence images." />
            )}
          </div>
        </div>
      </div>

      <Modal
        open={previewOpen}
        title="Evidence Preview"
        footer={null}
        width={900}
        onCancel={() => setPreviewOpen(false)}
      >
        {previewUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {previewUrls.map((url) => (
              <Image
                key={url}
                src={url}
                alt="Evidence Preview"
                className="w-full rounded-md border border-primaryN30"
              />
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No evidence images." />
        )}
      </Modal>

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/40">
          <Spin />
        </div>
      )}
    </div>
  );
}

