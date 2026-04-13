"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Image, Input, Modal, Segmented, Spin, Table, Tag, Tooltip, notification } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams, useRouter } from "next/navigation";
import { CheckCircleFilled } from "@ant-design/icons";

import {
  checkFileSourceMergeResultsAndCreateSingleFileResults,
  autoCreateMultipleFilesMergeResultByTakeOffId,
  getFileSourceMergeResultsByLabel,
  getGroupedLabelsByFileAndTakeOff,
  getTakeOffById,
  getTakeOffEvidenceUrlsByIds,
} from "@/services/takeOffService";
import { getTemplateById } from "@/services/templateService";
import {
  getDisplayValueByField,
  normalizeFieldName,
  parseItemResult as parseItemResultUtil,
} from "../analyze-new/takeoffUtils";
import BuildingBackground from "../identification/components/BuildingBackground";

type ViewMode = "items" | "evidence";
type SourceKey = "schedule" | "floorPlan" | "elevation";

interface LabelOption {
  key: string;
  label: string;
  count?: number;
  isMerged?: boolean;
  idList?: number[];
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
  const hasQuantity = fields.includes("Quantity");
  const hasOperability = fields.includes("Operability");
  // 过滤掉 Label、Sub Label 和 Quantity，保留其他字段（包括 Operability）
  const others = fields.filter((f) => f !== "Label" && f !== "Sub Label" && f !== "Quantity");
  const result: string[] = [];
  if (hasLabel) result.push("Label");
  if (hasSubLabel) result.push("Sub Label");
  // 将其他字段添加到结果中
  result.push(...others);
  // 如果同时有 Quantity 和 Operability，且 Quantity 不在 Operability 后面，则将 Quantity 插入到 Operability 后面
  if (hasQuantity && hasOperability) {
    const operabilityIndex = result.indexOf("Operability");
    if (operabilityIndex !== -1) {
      // 在 Operability 后面插入 Quantity
      result.splice(operabilityIndex + 1, 0, "Quantity");
    } else {
      result.push("Quantity");
    }
  } else if (hasQuantity) {
    // 只有 Quantity 没有 Operability，放到最后
    result.push("Quantity");
  }
  return result;
};

const normalizeRows = (rows: any[]) =>
  toArray(rows).map((row, index) => ({
    ...row,
    id: row?.id ?? null,
    __rowKey: row?.id ?? `row-${index}`,
    result: parseItemResultUtil(row?.result as any),
  }));

const toValidItemId = (item: any): string | null => {
  return item.id || null;
};

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

const getTakeOffResultItemIds = (item: any): string[] => {
  const listIds = Array.isArray(item?.take_off_result_item_id_list)
    ? item.take_off_result_item_id_list.map((id: any) => String(id)).filter(Boolean)
    : [];
  if (listIds.length > 0) return listIds;

  if (typeof item?.take_off_result_item_ids === "string" && item.take_off_result_item_ids) {
    try {
      const parsed = JSON.parse(item.take_off_result_item_ids);
      if (Array.isArray(parsed)) {
        return parsed.map((id: any) => String(id)).filter(Boolean);
      }
    } catch (error) {
      console.error("Failed to parse take_off_result_item_ids:", error);
    }
  }
  return [];
};

const extractEvidenceUrls = (
  item: any,
  evidenceUrlByResultItemId: Record<string, string>,
): string[] => {
  const urls: string[] = [];
  getTakeOffResultItemIds(item).forEach((resultItemId) => {
    const mappedUrl = evidenceUrlByResultItemId[resultItemId];
    if (mappedUrl) urls.push(mappedUrl);
  });
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
  if (!Array.isArray(payload)) return [];

  const sourceNode = payload.find((node: any) => {
    const nodeType = normalizeKey(String(node?.source_type || ""));
    return SOURCE_ALIAS[source].some(
      (alias) => nodeType === normalizeKey(alias),
    );
  });

  return Array.isArray(sourceNode?.list) ? sourceNode.list : [];
};

export default function ManualMergeV2Page() {
  const router = useRouter();
  const projectId = useParams().projectId as string;
  const takeoffId = useParams().takeoffId as string;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [buildLoading, setBuildLoading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
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

  const [viewMode, setViewMode] = useState<Record<"schedule" | "floorPlan" | "elevation", ViewMode>>({
    schedule: "items",
    floorPlan: "items",
    elevation: "items",
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [evidenceUrlByResultItemId, setEvidenceUrlByResultItemId] = useState<
    Record<string, string>
  >({});

  const modifiedCount = useMemo(() => Object.keys(scheduleChanges).length, [scheduleChanges]);
  const selectedLabelMeta = useMemo(
    () => labels.find((item) => item.label === selectedLabel) || null,
    [labels, selectedLabel],
  );
  const isSelectedLabelMerged = Boolean(selectedLabelMeta?.isMerged);

  const scheduleEvidenceUrls = useMemo(
    () =>
      Array.from(
        new Set(
          scheduleRows.flatMap((item) =>
            extractEvidenceUrls(item, evidenceUrlByResultItemId),
          ),
        ),
      ),
    [evidenceUrlByResultItemId, scheduleRows],
  );
  const floorPlanEvidenceUrls = useMemo(
    () =>
      Array.from(
        new Set(
          floorPlanRows.flatMap((item) =>
            extractEvidenceUrls(item, evidenceUrlByResultItemId),
          ),
        ),
      ),
    [evidenceUrlByResultItemId, floorPlanRows],
  );
  const elevationEvidenceUrls = useMemo(
    () =>
      Array.from(
        new Set(
          elevationRows.flatMap((item) =>
            extractEvidenceUrls(item, evidenceUrlByResultItemId),
          ),
        ),
      ),
    [evidenceUrlByResultItemId, elevationRows],
  );

  const fetchEvidenceUrlsByRows = useCallback(async (rows: any[]) => {
    const ids = Array.from(new Set(rows.flatMap((item) => getTakeOffResultItemIds(item))));
    if (ids.length === 0) {
      setEvidenceUrlByResultItemId({});
      return;
    }

    const response = await getTakeOffEvidenceUrlsByIds(ids.join(","));
    if (response.status !== "success") {
      setEvidenceUrlByResultItemId({});
      return;
    }

    const payload = response.data?.data ?? response.data ?? {};
    const nextMap: Record<string, string> = {};
    Object.entries(payload).forEach(([resultItemId, evidence]: [string, any]) => {
      if (typeof evidence?.evidence_url === "string" && evidence.evidence_url) {
        nextMap[resultItemId] = evidence.evidence_url;
      }
    });
    setEvidenceUrlByResultItemId(nextMap);
  }, []);

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

  const fetchLabelData = useCallback(async (label: string, fileIdOverride?: string) => {
    if (!label) return;
    const resolvedFileId = fileIdOverride || fileId;
    if (!takeoffId || !resolvedFileId) return;
    setLoading(true);
    setScheduleRows([]);
    setFloorPlanRows([]);
    setElevationRows([]);
    try {
      const response = await getFileSourceMergeResultsByLabel(takeoffId, resolvedFileId, label);
      if (response.status !== "success") {
        notification.error({
          message: "Error",
          description: "Failed to load merge rows by label.",
        });
        return;
      }

      const payload = response.data?.data ?? response.data ?? [];
      const nextScheduleRows = normalizeRows(collectSourceRows(payload, "schedule"));
      const nextFloorPlanRows = normalizeRows(collectSourceRows(payload, "floorPlan"));
      const nextElevationRows = normalizeRows(collectSourceRows(payload, "elevation"));

      setScheduleRows(nextScheduleRows);
      setFloorPlanRows(nextFloorPlanRows);
      setElevationRows(nextElevationRows);
      await fetchEvidenceUrlsByRows([
        ...nextScheduleRows,
        ...nextFloorPlanRows,
        ...nextElevationRows,
      ]);
      setScheduleChanges({});
      setEditingCell(null);
      setEditingValue("");
    } finally {
      setLoading(false);
    }
  }, [fetchEvidenceUrlsByRows, fileId, takeoffId]);

  const fetchLabelsAndMaybeLoadData = useCallback(
    async (
      resolvedFileId: string,
      preferredLabel?: string,
      autoSwitchFromMergedCurrent: boolean = false,
    ) => {
      if (!takeoffId || !resolvedFileId) return;
      const labelsRes = await getGroupedLabelsByFileAndTakeOff(takeoffId, resolvedFileId);
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
            isMerged: Boolean(item?.is_merged),
            idList: Array.isArray(item?.id_list) ? item.id_list : [],
          };
        })
        .filter(Boolean) as LabelOption[];

      setLabels(nextLabels);
      if (nextLabels.length === 0) {
        setSelectedLabel("");
        setScheduleRows([]);
        setFloorPlanRows([]);
        setElevationRows([]);
        setScheduleChanges({});
        return;
      }

      const hasPreferredLabel =
        !!preferredLabel && nextLabels.some((item) => item.label === preferredLabel);
      let nextSelectedLabel = hasPreferredLabel ? (preferredLabel as string) : nextLabels[0].label;

      if (autoSwitchFromMergedCurrent && hasPreferredLabel) {
        const currentIndex = nextLabels.findIndex((item) => item.label === preferredLabel);
        const currentItem = currentIndex >= 0 ? nextLabels[currentIndex] : null;
        if (currentItem?.isMerged) {
          const nextUnmerged =
            nextLabels.slice(Math.max(currentIndex + 1, 0)).find((item) => !item.isMerged) ||
            nextLabels.find((item) => !item.isMerged);
          if (nextUnmerged?.label) {
            nextSelectedLabel = nextUnmerged.label;
          }
        }
      }

      setSelectedLabel(nextSelectedLabel);
      setViewMode({
        schedule: "items",
        floorPlan: "items",
        elevation: "items",
      });
      await fetchLabelData(nextSelectedLabel, resolvedFileId);
    },
    [fetchLabelData, takeoffId],
  );

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
      setFiles(takeoffRes.data?.project_files || []);
      if (!firstFileId) {
        notification.warning({
          message: "Warning",
          description: "No file found for current takeoff.",
        });
        return;
      }
      setFileId(String(firstFileId));

      await fetchLabelsAndMaybeLoadData(String(firstFileId));
    } finally {
      setLoading(false);
    }
  }, [fetchLabelsAndMaybeLoadData, takeoffId]);

  useEffect(() => {
    fetchColumns();
    initPage();
  }, []);

  const handleSwitchLabel = async (label: string) => {
    if (label === selectedLabel) return;
    if (modifiedCount > 0) {
      Modal.warning({
        title: "Unsaved Changes",
        content: "You have unsaved Schedule edits. Please submit label changes before switching.",
      });
      return;
    }
    setViewMode({
      schedule: "items",
      floorPlan: "items",
      elevation: "items",
    });
    setSelectedLabel(label);
    await fetchLabelData(label);
  };

  const handleSwitchFile = async (nextFileId: string) => {
    if (!nextFileId || nextFileId === fileId) return;
    if (modifiedCount > 0) {
      Modal.warning({
        title: "Unsaved Changes",
        content: "You have unsaved Schedule edits. Please merge complete before switching file.",
      });
      return;
    }
    setViewMode({
      schedule: "items",
      floorPlan: "items",
      elevation: "items",
    });
    setFileId(nextFileId);
    await fetchLabelsAndMaybeLoadData(nextFileId);
  };

  const startEdit = (record: any, fieldName: string) => {
    const id = String(record.id);
    setEditingCell({ id, field: fieldName });
    const currentValue = getDisplayValueByField(record?.result || {}, fieldName);
    setEditingValue(currentValue === "-" ? "" : currentValue);
  };

  const commitEdit = (record: any, fieldName: string) => {
    if (isSelectedLabelMerged) return;
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

  const handleSubmitChanges = useCallback(async () => {
    if (!takeoffId || !fileId) return;
    const scheduleAllItems = [...scheduleRows];
    const allItemIds = Array.from(
      [...scheduleRows, ...floorPlanRows, ...elevationRows]
        .map((item) => toValidItemId(item))
    );
    if (allItemIds.length === 0) {
      notification.warning({
        message: "No Items",
        description: "No items found to submit.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await checkFileSourceMergeResultsAndCreateSingleFileResults(
        takeoffId,
        fileId,
        allItemIds.join(","),
        scheduleAllItems,
      );
      if (response.status === "success") {
        notification.success({
          message: "Success",
          description:
            scheduleAllItems.length > 0
              ? `Merged complete with ${scheduleAllItems.length} schedule rows.`
              : "Merged complete.",
        });
        setScheduleChanges({});
        await fetchLabelsAndMaybeLoadData(fileId, selectedLabel, true);
        return;
      }

      notification.error({
        message: "Error",
        description: "Failed to submit modified Schedule rows.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [scheduleRows, floorPlanRows, elevationRows]);

  const handleCreateMergeResult = useCallback(async () => {
    if (!takeoffId) return;
    setBuildLoading(true);
    try {
      const response = await autoCreateMultipleFilesMergeResultByTakeOffId(takeoffId);
      if (response.status === "success") {
        router.push(`/projects/${projectId}/takeoff/${takeoffId}/analyze-new`);
        return;
      }
      notification.error({
        message: "Error",
        description: response.data?.detail || "Failed to create merge result.",
      });
    } finally {
      setBuildLoading(false);
    }
  }, [takeoffId]);

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
            className={`mx-auto w-full max-w-[300px] overflow-hidden text-xs ${editable ? "cursor-text" : ""
              }`}
            onClick={() => {
              if (editable && !isSelectedLabelMerged) startEdit(record, fieldName);
            }}
          >
            <TruncatedTextCell value={value || "-"} />
          </div>
        );
      },
    }));

    const actionColumn: ColumnsType<any>[number] = {
      title: <div className="text-center text-xs text-grey-normal">Reference</div>,
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
              const urls = extractEvidenceUrls(record, evidenceUrlByResultItemId);
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
            <Image
              src="/assets/icons/file-refrence.svg"
              alt=""
              width={14}
              height={14}
              preview={false}
            />
          </Button>
        ) : null,
    };

    return (
      <Table<any>
        rowKey={(record) => record.id ?? record.__rowKey}
        columns={withEvidenceAction ? [...dataColumns, actionColumn] : dataColumns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: "max-content", y: "calc(100vh - 260px)" }}
        locale={{
          emptyText: (
            <div className="py-10 text-xs text-grey-normal">
              No items found.
            </div>
          ),
        }}
        className="h-full [&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
      />
    );
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-white font-nunito">
      <header className="flex h-[88px] shrink-0 items-center justify-between border-b border-primaryN30 bg-white px-10">
        <div className="flex items-center gap-3">
          {files.map((file) => (
            <button
              key={file.id}
              type="button"
              className={`flex h-[50px] min-w-[140px] flex-col items-start justify-center rounded-lg px-4 text-left transition-all ${String(file.id) === fileId ? "bg-primaryN30" : "border border-primaryN30"
                }`}
              onClick={() => handleSwitchFile(String(file.id))}
            >
              <span className="max-w-[180px] truncate text-sm text-grey-dark">
                {file.file_name || `File ${file.id}`}
              </span>
            </button>
          ))}
        </div>
        <Button type="primary" className="custom-primary-btn !w-[150px]" onClick={handleCreateMergeResult}>
          Create Merge Result
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
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1 text-left">
                      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                        {item.isMerged ? (
                          <CheckCircleFilled className="text-green-normal" />
                        ) : null}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {typeof item.count === "number" ? (
                      <span className="text-grey-normal">{item.count}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max gap-4 pb-2">
            <div className="w-[800px] shrink-0 rounded-xl border border-primaryN30 bg-white p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex w-1/3 items-center gap-2">
                  <Tag color="blue">Base</Tag>
                  <span className="text-sm font-medium text-forumBlue-normal">Schedule</span>
                  <span className="text-xs text-grey-normal">{scheduleRows.length} items</span>
                </div>
                <div className="mr-2 flex flex-1 flex-row justify-end items-center gap-2">
                  {!isSelectedLabelMerged ? (
                    <Button
                      type="primary"
                      size="small"
                      className="custom-primary-btn"
                      loading={submitting}
                      onClick={handleSubmitChanges}
                    >
                      Merge Complete
                    </Button>
                  ) : null}
                </div>
                <div className="flex justify-end gap-2">
                  <Segmented
                    size="small"
                    value={viewMode.schedule}
                    onChange={(value) =>
                      setViewMode((prev) => ({ ...prev, schedule: value as ViewMode }))
                    }
                    options={[
                      { label: "Items", value: "items" },
                      { label: "Evidence", value: "evidence" },
                    ]}
                  />
                </div>
              </div>
              {viewMode.schedule === "items" ? (
                renderTable(scheduleRows, !isSelectedLabelMerged, true)
              ) : scheduleEvidenceUrls.length > 0 ? (
                <div className="max-h-[420px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    {scheduleEvidenceUrls.map((url, index) => (
                      <Image
                        key={`${url}-${index}`}
                        src={url}
                        alt="Schedule Evidence"
                        className="w-full rounded-md border border-primaryN30"
                        preview={false}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No evidence images." />
              )}
            </div>

            <div className="w-[800px] shrink-0 rounded-xl border border-primaryN30 bg-white p-3">
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
                <div className="max-h-[420px] overflow-y-auto pr-1">
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
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No evidence images." />
              )}
            </div>

            <div className="w-[800px] shrink-0 rounded-xl border border-primaryN30 bg-white p-3">
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
                <div className="max-h-[420px] overflow-y-auto pr-1">
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
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No evidence images." />
              )}
            </div>
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
                preview={false}
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
      {buildLoading && <BuildingBackground step={"page-takeoff"} />}
    </div>
  );
}

