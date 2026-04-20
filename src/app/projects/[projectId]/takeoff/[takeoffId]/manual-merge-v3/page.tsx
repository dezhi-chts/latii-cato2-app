"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Empty, Image, Input, Modal, Segmented, Spin, Table, Tooltip, notification } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams, useRouter } from "next/navigation";
import { CheckCircleFilled, DownOutlined, UpOutlined } from "@ant-design/icons";

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
import ImagePreviewWithExpand from "../components/ImagePreviewWithExpand";
const { confirm } = Modal;

type ContentTab = "items" | "evidences";
type SourceKey = "schedule" | "floorPlan" | "elevation";

interface LabelOption {
  key: string;
  label: string;
  count?: number;
  isMerged?: boolean;
  idList?: number[];
}

interface FinalItemRow extends Record<string, any> {
  __isSystemRoot?: boolean;
  __systemGroupKey?: string;
}

interface EvidenceInfo {
  evidenceId: string;
  url: string;
}

const SOURCE_ALIAS: Record<SourceKey, string[]> = {
  schedule: ["schedule", "window table", "table", "window_door_unit_list"],
  floorPlan: ["floor plan", "floor_plan", "floorplan"],
  elevation: ["elevation"],
};

const normalizeKey = (value: string) =>
  value.toLowerCase().replace(/[\s_-]/g, "");

const toArray = (value: any): any[] => (Array.isArray(value) ? value : []);
const normalizeLabelKey = (value: string) => value.trim().toLowerCase();
const isEmptyDisplayValue = (value: string) => value === "-" || value.trim() === "";

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

const getEvidenceId = (evidence: any, fallback: string = ""): string =>
  String(
    evidence?.evidence_id ??
    evidence?.evidenceId ??
    evidence?.id ??
    fallback,
  );

const extractEvidenceUrls = (
  item: any,
  evidenceByResultItemId: Record<string, EvidenceInfo>,
): string[] => {
  const urls: string[] = [];
  getTakeOffResultItemIds(item).forEach((resultItemId) => {
    const mappedEvidence = evidenceByResultItemId[resultItemId];
    if (mappedEvidence?.url) urls.push(mappedEvidence.url);
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

const extractEvidenceEntries = (
  item: any,
  evidenceByResultItemId: Record<string, EvidenceInfo>,
): EvidenceInfo[] => {
  const entries: EvidenceInfo[] = [];

  getTakeOffResultItemIds(item).forEach((resultItemId) => {
    const mappedEvidence = evidenceByResultItemId[resultItemId];
    if (mappedEvidence?.url) {
      entries.push({
        evidenceId: mappedEvidence.evidenceId || resultItemId,
        url: mappedEvidence.url,
      });
    }
  });

  if (typeof item?.evidence_url === "string" && item.evidence_url) {
    entries.push({ evidenceId: getEvidenceId(item, item.evidence_url), url: item.evidence_url });
  }
  if (typeof item?.s3_url === "string" && item.s3_url) {
    entries.push({ evidenceId: getEvidenceId(item, item.s3_url), url: item.s3_url });
  }
  if (typeof item?.evidence_msg?.s3_url === "string" && item.evidence_msg.s3_url) {
    entries.push({
      evidenceId: getEvidenceId(item?.evidence_msg, item.evidence_msg.s3_url),
      url: item.evidence_msg.s3_url,
    });
  }
  if (Array.isArray(item?.evidence_urls)) {
    item.evidence_urls.forEach((url: any, index: number) => {
      if (typeof url === "string" && url) {
        entries.push({ evidenceId: getEvidenceId(item, `${url}-${index}`), url });
      }
    });
  }
  if (Array.isArray(item?.evidence_msg)) {
    item.evidence_msg.forEach((msg: any, index: number) => {
      if (typeof msg?.s3_url === "string" && msg.s3_url) {
        entries.push({
          evidenceId: getEvidenceId(msg, `${msg.s3_url}-${index}`),
          url: msg.s3_url,
        });
      }
    });
  }
  if (Array.isArray(item?.evidences)) {
    item.evidences.forEach((ev: any, index: number) => {
      if (typeof ev?.s3_url === "string" && ev.s3_url) {
        entries.push({
          evidenceId: getEvidenceId(ev, `${ev.s3_url}-${index}`),
          url: ev.s3_url,
        });
      }
      if (typeof ev?.evidence_url === "string" && ev.evidence_url) {
        entries.push({
          evidenceId: getEvidenceId(ev, `${ev.evidence_url}-${index}`),
          url: ev.evidence_url,
        });
      }
    });
  }

  const dedupMap = new Map<string, string>();
  entries.forEach((entry) => {
    if (!entry.url) return;
    const dedupeKey = entry.evidenceId || entry.url;
    if (!dedupMap.has(dedupeKey)) {
      dedupMap.set(dedupeKey, entry.url);
    }
  });

  return Array.from(dedupMap.entries()).map(([evidenceId, url]) => ({
    evidenceId,
    url,
  }));
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
  const [originalScheduleLabelById, setOriginalScheduleLabelById] = useState<Record<string, string>>({});
  const [collapsedSystemLabelMap, setCollapsedSystemLabelMap] = useState<Record<string, boolean>>({});

  const [contentTab, setContentTab] = useState<ContentTab>("evidences");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [evidenceByResultItemId, setEvidenceByResultItemId] = useState<
    Record<string, EvidenceInfo>
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
        new Map(
          scheduleRows
            .flatMap((item) => extractEvidenceEntries(item, evidenceByResultItemId))
            .map((entry) => [entry.evidenceId || entry.url, entry.url]),
        ).values(),
      ),
    [evidenceByResultItemId, scheduleRows],
  );
  const floorPlanEvidenceUrls = useMemo(
    () =>
      Array.from(
        new Map(
          floorPlanRows
            .flatMap((item) => extractEvidenceEntries(item, evidenceByResultItemId))
            .map((entry) => [entry.evidenceId || entry.url, entry.url]),
        ).values(),
      ),
    [evidenceByResultItemId, floorPlanRows],
  );
  const elevationEvidenceUrls = useMemo(
    () =>
      Array.from(
        new Map(
          elevationRows
            .flatMap((item) => extractEvidenceEntries(item, evidenceByResultItemId))
            .map((entry) => [entry.evidenceId || entry.url, entry.url]),
        ).values(),
      ),
    [evidenceByResultItemId, elevationRows],
  );

  const finalItemsRows = useMemo<FinalItemRow[]>(() => {
    if (scheduleRows.length === 0) return [];

    const groupedMap = new Map<string, { labelValue: string; rows: any[] }>();
    scheduleRows.forEach((row, index) => {
      const labelValue = getDisplayValueByField(row?.result || {}, "Label");
      const normalizedKey = normalizeLabelKey(labelValue || "");
      const groupKey = normalizedKey || `__unknown__${String(row?.id ?? row?.__rowKey ?? index)}`;
      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, { labelValue, rows: [] });
      }
      groupedMap.get(groupKey)?.rows.push(row);
    });

    const visited = new Set<string>();
    const result: FinalItemRow[] = [];

    scheduleRows.forEach((row, index) => {
      const labelValue = getDisplayValueByField(row?.result || {}, "Label");
      const normalizedKey = normalizeLabelKey(labelValue || "");
      const groupKey = normalizedKey || `__unknown__${String(row?.id ?? row?.__rowKey ?? index)}`;
      if (visited.has(groupKey)) return;
      visited.add(groupKey);

      const groupedRows = groupedMap.get(groupKey)?.rows || [row];
      if (groupedRows.length <= 1 || isEmptyDisplayValue(labelValue || "")) {
        result.push(groupedRows[0]);
        return;
      }

      const rootRow =
        groupedRows.find((item) =>
          isEmptyDisplayValue(getDisplayValueByField(item?.result || {}, "Sub Label") || ""),
        ) || groupedRows[0];
      const childRows = groupedRows.filter((item) => item !== rootRow);

      result.push({
        ...rootRow,
        __isSystemRoot: true,
        __systemGroupKey: groupKey,
      });

      const collapsed = collapsedSystemLabelMap[groupKey] ?? false;
      if (!collapsed) {
        result.push(...childRows);
      }
    });

    return result;
  }, [collapsedSystemLabelMap, scheduleRows]);

  const fetchEvidenceUrlsByRows = useCallback(async (rows: any[]) => {
    const ids = Array.from(new Set(rows.flatMap((item) => getTakeOffResultItemIds(item))));
    if (ids.length === 0) {
      setEvidenceByResultItemId({});
      return;
    }

    const response = await getTakeOffEvidenceUrlsByIds(ids.join(","));
    if (response.status !== "success") {
      setEvidenceByResultItemId({});
      return;
    }

    const payload = response.data?.data ?? response.data ?? {};
    const nextMap: Record<string, EvidenceInfo> = {};
    Object.entries(payload).forEach(([resultItemId, evidence]: [string, any]) => {
      if (typeof evidence?.evidence_url === "string" && evidence.evidence_url) {
        nextMap[resultItemId] = {
          evidenceId: getEvidenceId(evidence, resultItemId),
          url: evidence.evidence_url,
        };
      }
    });
    setEvidenceByResultItemId(nextMap);
  }, []);

  const fetchColumns = useCallback(async (templateId: number) => {
    const result = await getTemplateById(templateId);
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
    setOriginalScheduleLabelById({});
    setCollapsedSystemLabelMap({});
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

      const nextCollapsedMap: Record<string, boolean> = {};
      const labelCountMap = new Map<string, number>();
      nextScheduleRows.forEach((row) => {
        const labelValue = getDisplayValueByField(row?.result || {}, "Label");
        const key = normalizeLabelKey(labelValue || "");
        if (!key) return;
        labelCountMap.set(key, (labelCountMap.get(key) || 0) + 1);
      });
      labelCountMap.forEach((count, key) => {
        if (count > 1) {
          nextCollapsedMap[key] = false;
        }
      });

      setScheduleRows(nextScheduleRows);
      setFloorPlanRows(nextFloorPlanRows);
      setElevationRows(nextElevationRows);
      setOriginalScheduleLabelById(
        nextScheduleRows.reduce((acc: Record<string, string>, row: any) => {
          if (row?.id !== null && row?.id !== undefined) {
            acc[String(row.id)] = getDisplayValueByField(row?.result || {}, "Label");
          }
          return acc;
        }, {}),
      );
      setCollapsedSystemLabelMap(nextCollapsedMap);
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
        setOriginalScheduleLabelById({});
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
      setContentTab("evidences");
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
      fetchColumns(takeoffRes.data?.take_off_result?.template_id || 1);

      await fetchLabelsAndMaybeLoadData(String(firstFileId));
    } finally {
      setLoading(false);
    }
  }, [fetchLabelsAndMaybeLoadData, takeoffId]);

  useEffect(() => {
    initPage();
  }, []);

  const handleSwitchLabel = async (label: string) => {
    if (label === selectedLabel) return;
    if (modifiedCount > 0) {
      confirm({
        title: "Unsaved Changes",
        content: "You have unsaved Schedule edits. Please submit label changes before switching.",
      });
      return;
    }
    setContentTab("evidences");
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
    setContentTab("evidences");
    setFileId(nextFileId);
    await fetchLabelsAndMaybeLoadData(nextFileId);
  };

  const startEdit = (record: any, fieldName: string) => {
    const id = String(record.id);
    setEditingCell({ id, field: fieldName });
    const currentValue = getDisplayValueByField(record?.result || {}, fieldName);
    setEditingValue(currentValue === "-" ? "" : currentValue);
  };

  const submitScheduleRows = useCallback(
    async (
      nextScheduleRows: any[],
      options?: {
        silentSuccess?: boolean;
      },
    ) => {
      if (!takeoffId || !fileId) return false;

      const allItemIds = Array.from(
        [...nextScheduleRows, ...floorPlanRows, ...elevationRows]
          .map((item) => toValidItemId(item))
          .filter(Boolean),
      ) as string[];
      if (allItemIds.length === 0) {
        notification.warning({
          message: "No Items",
          description: "No items found to submit.",
        });
        return false;
      }

      setLoading(true);
      const response = await checkFileSourceMergeResultsAndCreateSingleFileResults(
        takeoffId,
        fileId,
        allItemIds.join(","),
        nextScheduleRows,
      );
      setLoading(false);
      if (response.status === "success") {
        if (!options?.silentSuccess) {
          notification.success({
            message: "Success",
            description:
              nextScheduleRows.length > 0
                ? `Merged complete with ${nextScheduleRows.length} schedule rows.`
                : "Merged complete.",
          });
        }
        setScheduleChanges({});
        await fetchLabelsAndMaybeLoadData(fileId, selectedLabel, true);
        return true;
      } else {
        notification.error({
          message: "Error",
          description: response?.data?.detail || "Failed to submit modified Schedule rows.",
        });
      }
    },
    [elevationRows, fileId, floorPlanRows, fetchLabelsAndMaybeLoadData, selectedLabel, takeoffId],
  );

  const commitEdit = async (record: any, fieldName: string) => {
    if (isSelectedLabelMerged) return;
    const id = String(record.id);
    const oldDisplay = getDisplayValueByField(record?.result || {}, fieldName);
    const oldValue = oldDisplay === "-" ? "" : oldDisplay;
    const newValue = editingValue.trim();

    setEditingCell(null);
    setEditingValue("");
    if (oldValue === newValue) return;

    const nextScheduleRows = scheduleRows.map((row) => {
      if (String(row.id) !== id) return row;
      const nextRow = {
        ...row,
        result: {
          ...parseItemResultUtil(row?.result as any),
          [fieldName]: newValue,
        },
      };
      return nextRow;
    });

    const changedRow = nextScheduleRows.find((row) => String(row.id) === id);
    if (changedRow) {
      setScheduleChanges((prevChanges) => ({
        ...prevChanges,
        [id]: changedRow,
      }));
    }
    setScheduleRows(nextScheduleRows);
  };

  const normalizeScheduleRowsForSubmit = useCallback(
    (rows: any[]) =>
      rows.map((row) => {
        const rowId = row?.id !== null && row?.id !== undefined ? String(row.id) : "";
        const currentLabel = getDisplayValueByField(row?.result || {}, "Label");
        if (!isEmptyDisplayValue(currentLabel || "")) return row;

        const originalLabel = rowId ? originalScheduleLabelById[rowId] : "";
        if (!originalLabel || isEmptyDisplayValue(originalLabel)) return row;

        return {
          ...row,
          result: {
            ...parseItemResultUtil(row?.result as any),
            Label: originalLabel,
          },
        };
      }),
    [originalScheduleLabelById],
  );

  const handleSubmitChanges = useCallback(async () => {
    const normalizedRows = normalizeScheduleRowsForSubmit([...scheduleRows]);
    setScheduleRows(normalizedRows);
    await submitScheduleRows(normalizedRows, { silentSuccess: false });
  }, [normalizeScheduleRowsForSubmit, scheduleRows, submitScheduleRows]);

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
    scrollY?: string,
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
            {fieldName === "Label" && record?.__isSystemRoot && record?.__systemGroupKey ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <TruncatedTextCell value={value || "-"} />
                </div>
                <Button
                  type="text"
                  size="small"
                  className="!absolute !right-0 !top-1/2 !h-5 !w-5 !min-w-5 !-translate-y-1/2 !p-0"
                  onClick={(event) => {
                    event.stopPropagation();
                    const groupKey = record.__systemGroupKey as string;
                    setCollapsedSystemLabelMap((prev) => ({
                      ...prev,
                      [groupKey]: !(prev[groupKey] ?? false),
                    }));
                  }}
                >
                  {(collapsedSystemLabelMap[record.__systemGroupKey] ?? false) ? (
                    <DownOutlined className="text-[10px] text-grey-normal" />
                  ) : (
                    <UpOutlined className="text-[10px] text-grey-normal" />
                  )}
                </Button>
              </div>
            ) : (
              <TruncatedTextCell value={value || "-"} />
            )}
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
              const urls = extractEvidenceUrls(record, evidenceByResultItemId);
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
        scroll={scrollY ? { x: "max-content", y: scrollY } : { x: "max-content" }}
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

  interface RenderTableSectionParams {
    title: string;
    rows: any[];
    editable: boolean;
    withEvidenceAction: boolean;
    extra?: React.ReactNode;
    scrollY?: string;
    stretch?: boolean;
  }

  const renderTableSection = ({
    title,
    rows,
    editable,
    withEvidenceAction,
    extra,
    scrollY = "calc((100vh - 130px)/2 - 96px)",
    stretch = true,
  }: RenderTableSectionParams) => (
    <div
      className={`flex min-h-0 flex-col rounded-xl border border-primaryN30 bg-white p-3 ${stretch ? "h-full" : ""
        }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-forumBlue-normal">{title}</span>
          <span className="text-xs text-grey-normal">{rows.length} items</span>
          {extra}
        </div>
      </div>
      <div className={stretch ? "min-h-0 flex-1" : ""}>
        {renderTable(rows, editable, withEvidenceAction, scrollY)}
      </div>
    </div>
  );

  const renderEvidenceSection = (title: string, evidenceUrls: string[]) => (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-primaryN30 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-forumBlue-normal">{title}</span>
        <span className="text-xs text-grey-normal">{evidenceUrls.length} images</span>
      </div>
      {evidenceUrls.length > 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            {evidenceUrls.map((url, index) => (
              <div key={`${url}-${index}`} className="relative">
                <div className="absolute left-1 top-1 rounded-md z-10 flex h-5 w-5 items-center justify-center bg-forumBlue-light-active text-xs font-medium text-white shadow-sm">
                  {index + 1}
                </div>
                {/* <Image
                  src={url}
                  alt={`${title} Evidence`}
                  className="w-full rounded-md border border-primaryN30"
                  preview={false}
                /> */}
                {<ImagePreviewWithExpand src={url} alt={`${title} Evidence`} />}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No evidence images." />
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-white font-nunito">
      <header className="flex h-[110px] shrink-0 items-center justify-between border-b border-primaryN30 bg-white px-10">
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

      <div className="flex flex-1 gap-4 p-4 overflow-y-hidden">
        <div className="w-[220px] shrink-0 rounded-xl border border-primaryN30 bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-forumBlue-normal">Labels</span>
            <span className="text-xs text-grey-normal">{labels.length}</span>
          </div>
          <div className="space-y-2 overflow-auto max-h-[calc(100vh-200px)]">
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

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="h-[calc((100vh - 130px)/2)] min-h-0 overflow-hidden">
              {renderTableSection({
                title: "Final Items",
                rows: finalItemsRows,
                editable: !isSelectedLabelMerged,
                withEvidenceAction: true,
                extra: !isSelectedLabelMerged ? (
                  <Button
                    className="ml-4 custom-primary-btn"
                    loading={submitting}
                    onClick={handleSubmitChanges}
                  >
                    Merge Complete
                  </Button>
                ) : null,
              })}
            </div>

            <div className="flex-1 min-h-0 rounded-xl border border-primaryN30 bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                {/* <span className="text-sm font-medium text-forumBlue-normal">Content</span> */}
                <Segmented
                  size="small"
                  value={contentTab}
                  onChange={(value) => setContentTab(value as ContentTab)}
                  options={[
                    { label: "Items", value: "items" },
                    { label: "Evidences", value: "evidences" },
                  ]}
                />
              </div>

              {contentTab === "items" ? (
                <div className="h-[calc(100%-40px)] min-h-0 overflow-y-auto pr-1">
                  <div className="flex flex-col gap-3">
                    <div className="shrink-0">
                      {renderTableSection({
                        title: "Schedule",
                        rows: scheduleRows,
                        editable: false,
                        withEvidenceAction: true,
                        extra: null,
                        scrollY: undefined,
                        stretch: false,
                      })}
                    </div>
                    <div className="shrink-0">
                      {renderTableSection({
                        title: "Floor Plan",
                        rows: floorPlanRows,
                        editable: false,
                        withEvidenceAction: true,
                        extra: null,
                        scrollY: undefined,
                        stretch: false,
                      })}
                    </div>
                    <div className="shrink-0">
                      {renderTableSection({
                        title: "Elevation",
                        rows: elevationRows,
                        editable: false,
                        withEvidenceAction: true,
                        extra: null,
                        scrollY: undefined,
                        stretch: false,
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[calc(100%-40px)] min-h-0">
                  <div className="grid h-full min-h-0 grid-cols-3 gap-3">
                    {renderEvidenceSection("Schedule", scheduleEvidenceUrls)}
                    {renderEvidenceSection("Floor Plan", floorPlanEvidenceUrls)}
                    {renderEvidenceSection("Elevation", elevationEvidenceUrls)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={previewOpen}
        title={<span className="text-lg text-forumBlue-normal font-sans">Evidence Preview</span>}
        footer={null}
        width={1000}
        onCancel={() => setPreviewOpen(false)}
      >
        {previewUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {previewUrls.map((url) => (
              <ImagePreviewWithExpand key={url} src={url} alt="Evidence Preview" />
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

