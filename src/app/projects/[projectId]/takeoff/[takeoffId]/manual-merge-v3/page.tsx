"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Image, Input, Modal, Segmented, Spin, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams, useRouter } from "next/navigation";
import { DownOutlined, UpOutlined, DeleteOutlined } from "@ant-design/icons";

import {
  checkFileSourceMergeResultsAndCreateSingleFileResults,
  autoCreateMultipleFilesMergeResultByTakeOffId,
  deleteFileSourceMergeResultByIdList,
  deleteSingleFileMergeResultByIdList,
  getFileSourceMergeResultsByLabel,
  getGroupedLabelsByFileAndTakeOff,
  getTakeOffById,
  getTakeOffEvidenceUrlsByIds,
  rollbackSingleFileMergeResultByIds,
  splitFileSourceMergeResultsByIdList,
  updateFileSourceMergeResultsByIdList,
  updateSingleFileMergeResultsByIdList,
  addTakeOffResultItemManualMerge,
} from "@/services/takeOffService";
import { getTemplateById } from "@/services/templateService";
import {
  getDisplayValueByField,
  normalizeFieldName,
  parseItemResult as parseItemResultUtil,
  setResultValueByField,
} from "../analyze-new/takeoffUtils";
import { EvidenceRecord } from "../analyze-new/types";
import BuildingBackground from "../identification/components/BuildingBackground";
import FileHeader from "./components/FileHeader";
import LabelSidebar from "./components/LabelSidebar";
import EvidenceImagePreviewModal from "../components/evidence/EvidenceImagePreviewModal";
import TakeoffReferenceByTypeModal from "../components/reference/TakeoffReferenceByTypeModal";
import TableSection from "./components/TableSection";
import EvidenceSection from "./components/EvidenceSection";
import SplitItemsModal from "./components/SplitItemsModal";
import ImageReferenceModal from "./components/ImageReferenceModal";
import ScheduleSourceModal from "./components/ScheduleSourceModal";
import CreateItemModal from "../components/schedule/CreateItemModal";
import { type NormalizedCoordinates } from "../components/evidence/ScheduleEvidenceImage";
import { notify } from "@/utils/notify";
import { useBrowserBackToHome } from "@/app/projects/[projectId]/takeoff/[takeoffId]/hooks/useBrowserBackToHome";
import TakeoffFileWorkflowNav from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/workflow/TakeoffFileWorkflowNav";
import LoadingScreen from "@/components/loading-screen";

const { confirm } = Modal;

type ContentTab = "items" | "evidences";
type SourceKey = "schedule" | "floorPlan" | "elevation" | "finallyData";

interface LabelOption {
  key: string;
  label: string;
  count?: number;
  isMerged?: boolean;
  isAutoMerged?: boolean;
  idList?: number[];
}

interface FinalItemRow extends Record<string, any> {
  __isSystemRoot?: boolean;
  __systemGroupKey?: string;
}

interface GroupedSummaryRow extends Record<string, any> {
  __isGroupedSummary?: boolean;
  __groupKey?: string;
  __rowKey?: string;
}

interface EvidenceInfo extends Record<string, any> { }

interface ClassifiedEvidenceItem {
  id: string;
  url: string;
  project_file_id?: number;
  project_file_page_number?: number;
  page_width_pdf?: number;
  page_height_pdf?: number;
  polygon?: any;
  [key: string]: any;
}

interface ClassifiedEvidenceUrls {
  schedule: ClassifiedEvidenceItem[];
  floorPlan: ClassifiedEvidenceItem[];
  elevation: ClassifiedEvidenceItem[];
}

type ReferenceType = "schedule" | "floorPlan" | "elevation";

const SOURCE_TYPE_MAP: Record<SourceKey, string> = {
  schedule: "Schedule",
  floorPlan: "Floor Plan",
  elevation: "Elevation",
  finallyData: "Finally Data",
};

const toArray = (value: any): any[] => (Array.isArray(value) ? value : []);
const normalizeLabelKey = (value: string) => value.trim().toLowerCase();
const isEmptyDisplayValue = (value: string) => value === "-" || value.trim() === "";
const emptyClassifiedEvidenceUrls: ClassifiedEvidenceUrls = {
  schedule: [],
  floorPlan: [],
  elevation: [],
};

const getEvidenceUrlFromItem = (evidence: any): string => {
  if (typeof evidence?.evidence_url === "string" && evidence.evidence_url) return evidence.evidence_url;
  if (typeof evidence?.url === "string" && evidence.url) return evidence.url;
  if (typeof evidence?.s3_url === "string" && evidence.s3_url) return evidence.s3_url;
  return "";
};

const getRawEvidenceId = (evidence: any): string => {
  const rawId = evidence?.evidence_id ?? evidence?.evidenceId ?? evidence?.id;
  if (rawId !== null && rawId !== undefined && String(rawId).trim()) {
    return String(rawId);
  }
  return "";
};

const getEvidenceUniqueId = (evidence: any, fallbackUrl: string): string => {
  const id = getRawEvidenceId(evidence);
  if (id) {
    return id;
  }
  return fallbackUrl;
};

const classifyEvidenceUrls = (evidences: any[]): ClassifiedEvidenceUrls => {
  const scheduleList: ClassifiedEvidenceItem[] = [];
  const floorPlanList: ClassifiedEvidenceItem[] = [];
  const elevationList: ClassifiedEvidenceItem[] = [];
  const seenEvidenceIds = new Set<string>();

  const normalizeType = (value: unknown) => String(value || "").trim().toLowerCase();

  evidences.forEach((evidence) => {
    const url = getEvidenceUrlFromItem(evidence);
    if (!url) return;
    const uniqueId = getEvidenceUniqueId(evidence, url);
    if (seenEvidenceIds.has(uniqueId)) return;
    seenEvidenceIds.add(uniqueId);
    const evidenceId = getRawEvidenceId(evidence) || uniqueId;

    const evidenceType = normalizeType(evidence?.evidence_type ?? evidence?.type);
    if (evidenceType === "window door unit" || evidenceType === "table") {
      scheduleList.push({
        ...(evidence || {}),
        id: evidenceId,
        url,
      });
      return;
    }
    if (evidenceType === "floor plan item") {
      floorPlanList.push({
        ...(evidence || {}),
        id: evidenceId,
        url,
      });
      return;
    }
    if (evidenceType === "elevation item") {
      elevationList.push({
        ...(evidence || {}),
        id: evidenceId,
        url,
      });
    }
  });

  return {
    schedule: scheduleList,
    floorPlan: floorPlanList,
    elevation: elevationList,
  };
};

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

const normalizeGroupFieldValue = (value: string) => {
  if (isEmptyDisplayValue(value || "")) return "";
  return normalizeLabelKey(value || "");
};

const pickParentRowByRule = (rows: any[]): any | null => {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const emptySubLabelRows = rows.filter((row) => {
    const subLabel = getDisplayValueByField(row?.result || {}, "Sub Label");
    return isEmptyDisplayValue(subLabel || "");
  });

  if (emptySubLabelRows.length === 1) {
    return emptySubLabelRows[0];
  }

  if (emptySubLabelRows.length > 1) {
    const emptyProductRow = emptySubLabelRows.find((row) => {
      const product = getDisplayValueByField(row?.result || {}, "Product");
      return isEmptyDisplayValue(product || "");
    });
    return emptyProductRow || rows[0];
  }

  return rows[0];
};

const parseQuantityNumber = (value: string) => {
  if (!value) return 0;
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatQuantityNumber = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 10000) / 10000;
  const hasDecimal = !Number.isInteger(rounded);
  return hasDecimal ? String(rounded) : String(Math.trunc(rounded));
};

const toValidItemId = (item: any): string | null => {
  return item.id || null;
};

const isOriginalItemRow = (item: any): boolean => {
  const validId = toValidItemId(item);
  return Boolean(validId);
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

const collectSourceRows = (payload: any, source: SourceKey, isLabelMerged: boolean): any[] => {
  if (!Array.isArray(payload)) return [];

  const sourceNode = payload.find((node: any) => {
    return String(node?.source_type || "").trim() === SOURCE_TYPE_MAP[source];
  });

  if (source === "finallyData") {
    if (isLabelMerged) {
      return Array.isArray(sourceNode?.merged_list) ? sourceNode.merged_list : [];
    }
    return Array.isArray(sourceNode?.list) ? sourceNode.list : [];
  }
  return Array.isArray(sourceNode?.list) ? sourceNode.list : [];
};

const collectSourceMergedRows = (payload: any, source: SourceKey): any[] => {
  if (!Array.isArray(payload)) return [];

  const sourceNode = payload.find((node: any) => {
    return String(node?.source_type || "").trim() === SOURCE_TYPE_MAP[source];
  });

  return Array.isArray(sourceNode?.merged_list) ? sourceNode.merged_list : [];
};

// Evidence ids should always come from API "list" rows,
// regardless of schedule showing merged_list or list in UI.
const collectSourceRowsForEvidence = (payload: any, source: SourceKey): any[] => {
  if (!Array.isArray(payload)) return [];

  const sourceNode = payload.find((node: any) => {
    return String(node?.source_type || "").trim() === SOURCE_TYPE_MAP[source];
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
  useBrowserBackToHome({ disableBrowserNavigation: buildLoading });
  const [files, setFiles] = useState<any[]>([]);
  const [fileId, setFileId] = useState<number | null>(null);
  const [labels, setLabels] = useState<LabelOption[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);

  const [scheduleRows, setScheduleRows] = useState<any[]>([]);
  const [floorPlanRows, setFloorPlanRows] = useState<any[]>([]);
  const [elevationRows, setElevationRows] = useState<any[]>([]);
  const [finallyDataRows, setFinallyDataRows] = useState<any[]>([]);
  const [finallyDataMergedRows, setFinallyDataMergedRows] = useState<any[]>([]);
  const [scheduleMergedRows, setScheduleMergedRows] = useState<any[]>([]);
  const [floorPlanMergedRows, setFloorPlanMergedRows] = useState<any[]>([]);
  const [elevationMergedRows, setElevationMergedRows] = useState<any[]>([]);

  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [scheduleChanges, setScheduleChanges] = useState<Record<string, any>>({});
  const [originalScheduleLabelById, setOriginalScheduleLabelById] = useState<Record<string, string>>({});
  const [collapsedSystemLabelMap, setCollapsedSystemLabelMap] = useState<Record<string, boolean>>({});
  const [collapsedAutoMergedLabels, setCollapsedAutoMergedLabels] = useState(false);
  const [collapsedConflictLabels, setCollapsedConflictLabels] = useState(false);
  const [collapsedFloorPlanGroupMap, setCollapsedFloorPlanGroupMap] = useState<Record<string, boolean>>({});
  const [collapsedElevationGroupMap, setCollapsedElevationGroupMap] = useState<Record<string, boolean>>({});
  const [collapsedScheduleGroupMap, setCollapsedScheduleGroupMap] = useState<Record<string, boolean>>({});

  const [contentTab, setContentTab] = useState<ContentTab>("evidences");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<{
    fileName?: string;
    pageNumber: number;
    imageUrl: string;
    pageEvidences: EvidenceRecord[];
  }>({
    fileName: "",
    pageNumber: 1,
    imageUrl: "",
    pageEvidences: [],
  });
  const [evidenceByResultItemId, setEvidenceByResultItemId] = useState<
    Record<string, EvidenceInfo[]>
  >({});
  const [classifiedEvidenceUrls, setClassifiedEvidenceUrls] = useState<ClassifiedEvidenceUrls>(
    emptyClassifiedEvidenceUrls,
  );
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitSubmitting, setSplitSubmitting] = useState(false);
  const [rollbackSubmitting, setRollbackSubmitting] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copySubmitting, setCopySubmitting] = useState(false);
  const [copySelectedRowKeys, setCopySelectedRowKeys] = useState<React.Key[]>([]);
  const [referenceByTypeModalOpen, setReferenceByTypeModalOpen] = useState(false);
  const [referenceByTypeItem, setReferenceByTypeItem] = useState<any>(null);
  const [referenceByTypeEvidenceList, setReferenceByTypeEvidenceList] = useState<any[]>([]);
  const [referenceByTypeInitialType, setReferenceByTypeInitialType] = useState<ReferenceType | undefined>(undefined);
  const [referenceByTypeInitialEvidenceId, setReferenceByTypeInitialEvidenceId] = useState<string | undefined>(undefined);
  const [imageReferenceModalOpen, setImageReferenceModalOpen] = useState(false);
  const [imageReferenceEvidenceList, setImageReferenceEvidenceList] = useState<any[]>([]);
  const [scheduleSourceModalOpen, setScheduleSourceModalOpen] = useState(false);
  const [scheduleSourceTargetEvidence, setScheduleSourceTargetEvidence] = useState<any | null>(null);
  const [scheduleCreateItemModalOpen, setScheduleCreateItemModalOpen] = useState(false);
  const [schedulePendingCoordinates, setSchedulePendingCoordinates] = useState<NormalizedCoordinates | null>(null);

  const modifiedCount = useMemo(() => Object.keys(scheduleChanges).length, [scheduleChanges]);
  const selectedLabelMeta = useMemo(
    () => labels.find((item) => item.label === selectedLabel) || null,
    [labels, selectedLabel],
  );
  const isSelectedLabelMerged = Boolean(selectedLabelMeta?.isMerged);
  const autoMergedLabels = useMemo(
    () => labels.filter((item) => Boolean(item.isAutoMerged)),
    [labels],
  );
  const conflictLabels = useMemo(
    () => labels.filter((item) => !Boolean(item.isAutoMerged)),
    [labels],
  );
  const allLabelNames = useMemo(() => labels.map((item) => item.label), [labels]);

  const scheduleEvidences = classifiedEvidenceUrls.schedule;
  const floorPlanEvidences = classifiedEvidenceUrls.floorPlan;
  const elevationEvidences = classifiedEvidenceUrls.elevation;

  const hasCoordinatesData = useCallback((evidence: any) => {
    if (!evidence) return false;
    const coordinates = evidence?.coordinates;
    if (!coordinates) return false;
    if (typeof coordinates === "string") {
      return coordinates.trim().length > 0;
    }
    return typeof coordinates === "object";
  }, []);

  const scheduleEvidencesWithOverlay = useMemo(() => {
    const scheduleEvidenceIdSet = new Set(
      scheduleEvidences
        .map((evidence) => getEvidenceUniqueId(evidence, getEvidenceUrlFromItem(evidence)))
        .filter(Boolean),
    );
    const overlayMap: Record<string, Array<{ id: number; coordinates: any }>> = {};

    Object.entries(evidenceByResultItemId).forEach(([resultItemId, evidenceList]) => {
      toArray(evidenceList).forEach((evidence) => {
        const evidenceKey = getEvidenceUniqueId(evidence, getEvidenceUrlFromItem(evidence));
        if (!evidenceKey || !scheduleEvidenceIdSet.has(evidenceKey)) return;
        if (!hasCoordinatesData(evidence)) return;
        const itemId = Number(resultItemId);
        if (!Number.isFinite(itemId)) return;
        if (!overlayMap[evidenceKey]) {
          overlayMap[evidenceKey] = [];
        }
        overlayMap[evidenceKey].push({
          id: itemId,
          coordinates: evidence?.coordinates,
        });
      });
    });

    return scheduleEvidences.map((evidence) => {
      const evidenceKey = getEvidenceUniqueId(evidence, getEvidenceUrlFromItem(evidence));
      const overlayItems = overlayMap[evidenceKey] || [];
      /**
       * 同一 evidence 下按 result item id 去重，避免重复叠框。
       */
      const uniqueOverlayMap = new Map<number, { id: number; coordinates: any }>();
      overlayItems.forEach((item) => {
        if (!uniqueOverlayMap.has(item.id)) {
          uniqueOverlayMap.set(item.id, item);
        }
      });
      return {
        ...evidence,
        overlayItems: Array.from(uniqueOverlayMap.values()),
      };
    });
  }, [evidenceByResultItemId, hasCoordinatesData, scheduleEvidences]);
  const getEvidencesByResultItemIds = useCallback((record: any) => {
    const resultItemIds = getTakeOffResultItemIds(record);
    const seen = new Set<string>();
    const evidenceList: any[] = [];
    resultItemIds.forEach((resultItemId) => {
      const mappedEvidences = toArray(evidenceByResultItemId[resultItemId]);
      mappedEvidences.forEach((evidence) => {
        const url = getEvidenceUrlFromItem(evidence);
        const uniqueKey = getEvidenceUniqueId(evidence, url) || url;
        if (!uniqueKey || seen.has(uniqueKey)) return;
        seen.add(uniqueKey);
        evidenceList.push(evidence);
      });
    });
    return evidenceList;
  }, [evidenceByResultItemId]);

  const getOverlayEvidencesByResultItemIds = useCallback((record: any) => {
    const resultItemIds = getTakeOffResultItemIds(record);
    const evidenceList: any[] = [];
    resultItemIds.forEach((resultItemId) => {
      const mappedEvidences = toArray(evidenceByResultItemId[resultItemId]);
      mappedEvidences.forEach((evidence) => {
        if (!evidence) return;
        evidenceList.push({
          ...(evidence || {}),
          source_item_id: Number(resultItemId),
        });
      });
    });
    return evidenceList;
  }, [evidenceByResultItemId]);

  const openReferenceModal = useCallback((
    item: any,
    evidenceList: any[],
    options?: {
      preferredType?: ReferenceType;
      selectedEvidenceId?: string;
      emptyTip?: string;
    },
  ) => {
    if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
      notify.info({
        title: "No Evidence",
        description: options?.emptyTip || "No evidence image found for this row.",
      });
      return;
    }
    setReferenceByTypeItem(item || null);
    setReferenceByTypeEvidenceList(evidenceList);
    setReferenceByTypeInitialType(options?.preferredType);
    setReferenceByTypeInitialEvidenceId(options?.selectedEvidenceId);
    setReferenceByTypeModalOpen(true);
  }, []);

  const openImageReferenceModal = useCallback((
    evidenceList: any[],
    emptyTip: string = "No evidence image found for this row.",
  ) => {
    if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
      notify.info({
        title: "No Evidence",
        description: emptyTip,
      });
      return;
    }
    setImageReferenceEvidenceList(evidenceList);
    setImageReferenceModalOpen(true);
  }, []);

  const handleOpenReferenceModalByRecord = useCallback((
    record: any,
    preferredType?: ReferenceType,
  ) => {
    // 检查是否有 matched_primary_coordinate 字段（仅用于已合并 label）
    const matchedPrimaryCoordinate = record?.matched_primary_coordinate;
    
    let evidenceList: any[];
    
    if (isSelectedLabelMerged && Array.isArray(matchedPrimaryCoordinate) && matchedPrimaryCoordinate.length > 0) {
      // 已合并 label，从 matched_primary_coordinate 中构建 evidenceList
      evidenceList = matchedPrimaryCoordinate.map((coord: any, index: number) => {
        // 先查找是否有对应的 evidence 数据
        const resultItemIds = getTakeOffResultItemIds(record);
        let matchingEvidence: any = null;
        
        for (const itemId of resultItemIds) {
          const evList = toArray(evidenceByResultItemId[itemId]);
          const found = evList.find((ev: any) => {
            const evId = getRawEvidenceId(ev);
            return evId && coord.evidence_id && String(evId) === String(coord.evidence_id);
          });
          if (found) {
            matchingEvidence = found;
            break;
          }
        }
        
        const url = matchingEvidence 
          ? getEvidenceUrlFromItem(matchingEvidence) 
          : "";
        
        return {
          // 优先使用匹配到的 evidence 数据，否则使用坐标信息
          ...(matchingEvidence || {}),
          id: coord.evidence_id || index,
          evidence_id: coord.evidence_id,
          url: url,
          evidence_url: url,
          // 强制设置 coordinates 为 matched_primary_coordinate 中的值
          coordinates: coord.coordinates,
          source_item_id: Number(record?.id || 0),
          // 确保有正确的 type，默认为 "table" 类型（Schedule）
          type: matchingEvidence?.type || "table",
        };
      });
    } else {
      // 未合并 label，保持原有逻辑
      evidenceList = getOverlayEvidencesByResultItemIds(record).map((evidence) => ({
        ...(evidence || {}),
        source_item_id: Number(record?.id || 0),
      }));
    }
    
    openReferenceModal(record, evidenceList, {
      preferredType,
      emptyTip: "No evidence image found for this row.",
    });
  }, [getOverlayEvidencesByResultItemIds, openReferenceModal, isSelectedLabelMerged, evidenceByResultItemId]);

  const handleOpenImageReferenceModalByRecord = useCallback((record: any) => {
    const evidenceList = getOverlayEvidencesByResultItemIds(record);
    openImageReferenceModal(evidenceList, "No evidence image found for this row.");
  }, [getOverlayEvidencesByResultItemIds, openImageReferenceModal]);

  const handleOpenReferenceModalByEvidence = useCallback((evidence: any) => {
    const overlayItems = Array.isArray(evidence?.overlayItems) ? evidence.overlayItems : [];
    const evidenceList = overlayItems.length > 0
      ? overlayItems.map((overlayItem: any) => ({
        ...(evidence || {}),
        source_item_id: overlayItem?.id,
        coordinates: overlayItem?.coordinates,
      }))
      : [evidence];
    openReferenceModal(evidence, evidenceList, {
      preferredType: "schedule",
      selectedEvidenceId: String(evidence?.id || ""),
      emptyTip: "No evidence image found for this source image.",
    });
  }, [openReferenceModal]);

  const handleOpenPdfPreviewFromReference = useCallback((evidence: any, _type: ReferenceType) => {
    const fileId = Number(evidence?.project_file_id || 0);
    const pageNumber = Number(evidence?.project_file_page_number || 1) || 1;
    const matchedFile = files.find((item) => Number(item?.id) === fileId);
    const pageInfos = matchedFile?.parse_detail?.image_page_infos || [];
    const matchedPageInfo =
      pageInfos.find(
        (pageInfo: any, pageIndex: number) =>
          Number(pageInfo?.project_file_page_number || pageInfo?.page_number || pageIndex + 1) ===
          pageNumber,
      ) || null;
    const imageUrl = matchedPageInfo?.s3_url || getEvidenceUrlFromItem(evidence);
    if (!imageUrl) {
      notify.info({
        title: "No Evidence",
        description: "No preview image found for this evidence.",
      });
      return;
    }

    const previewEvidence = {
      ...(evidence || {}),
      id: Number(evidence?.evidence_id || evidence?.evidenceId || evidence?.id || 0),
    } as EvidenceRecord;
    setPreviewPayload({
      fileName: matchedFile?.file_name || "Unnamed file",
      pageNumber,
      imageUrl,
      /**
       * 为了避免出现多个红框，这里只传当前选中的 evidence。
       */
      pageEvidences: [previewEvidence],
    });
    setPreviewOpen(true);
  }, [files]);

  const handleOpenScheduleSourceAddBoxModal = useCallback((evidence: any) => {
    /**
     * 从 Schedule Source 卡片进入 Add Box 时，锁定当前 evidence，
     * 弹窗内只对这张图进行画框与提交。
     */
    setScheduleSourceTargetEvidence(evidence || null);
    setScheduleSourceModalOpen(true);
  }, []);
  const handleOpenCreateItemFromScheduleSource = useCallback(async (coordinates: NormalizedCoordinates) => {
    const selectedEvidence = scheduleSourceTargetEvidence;
    const evidenceId = Number(
      selectedEvidence?.evidence_id ??
      selectedEvidence?.evidenceId ??
      selectedEvidence?.id ??
      0,
    );
    if (!Number.isFinite(evidenceId) || evidenceId <= 0) {
      notify.error({
        title: "Error",
        description: "Unable to resolve evidence id for creating item.",
      });
      return false;
    }
    /**
     * 先缓存用户在 Add Box 弹窗里确认的坐标，
     * 后续由 CreateItemModal 复用该坐标完成新增 item。
     * 这里返回 false，避免打开 CreateItemModal 时提前删除当前 draft box；
     * 新增成功后会关闭 ScheduleSourceModal，组件销毁时再清理框。
     */
    setSchedulePendingCoordinates(coordinates);
    setScheduleCreateItemModalOpen(true);
    return false;
  }, [scheduleSourceTargetEvidence]);

  const groupedFloorPlanRows = useMemo(() => {
    const groupedMap = new Map<
      string,
      {
        rows: any[];
      }
    >();
    floorPlanRows.forEach((row) => {
      const label = getDisplayValueByField(row?.result || {}, "Label");
      const groupKey = normalizeGroupFieldValue(label) || `__unknown__${String(row?.id || "")}`;
      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, { rows: [] });
      }
      const groupData = groupedMap.get(groupKey)!;
      groupData.rows.push(row);
    });

    const normalizedGroupedMap = new Map<
      string,
      {
        parentRow: any | null;
        childRows: any[];
      }
    >();
    groupedMap.forEach((groupData, groupKey) => {
      const parentRow = pickParentRowByRule(groupData.rows);
      const childRows = groupData.rows.filter((row) => row !== parentRow);
      normalizedGroupedMap.set(groupKey, {
        parentRow,
        childRows,
      });
    });

    return normalizedGroupedMap;
  }, [floorPlanRows]);

  const groupedScheduleRows = useMemo(() => {
    const groupedMap = new Map<
      string,
      {
        rows: any[];
      }
    >();
    scheduleRows.forEach((row) => {
      const label = getDisplayValueByField(row?.result || {}, "Label");
      const groupKey = normalizeGroupFieldValue(label) || `__unknown__${String(row?.id || "")}`;
      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, { rows: [] });
      }
      const groupData = groupedMap.get(groupKey)!;
      groupData.rows.push(row);
    });

    const normalizedGroupedMap = new Map<
      string,
      {
        parentRow: any | null;
        childRows: any[];
      }
    >();
    groupedMap.forEach((groupData, groupKey) => {
      const parentRow = pickParentRowByRule(groupData.rows);
      const childRows = groupData.rows.filter((row) => row !== parentRow);
      normalizedGroupedMap.set(groupKey, {
        parentRow,
        childRows,
      });
    });

    return normalizedGroupedMap;
  }, [scheduleRows]);

  const groupedElevationRows = useMemo(() => {
    const groupedMap = new Map<
      string,
      {
        rows: any[];
      }
    >();
    elevationRows.forEach((row) => {
      const label = getDisplayValueByField(row?.result || {}, "Label");
      const groupKey = normalizeGroupFieldValue(label) || `__unknown__${String(row?.id || "")}`;
      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, { rows: [] });
      }
      const groupData = groupedMap.get(groupKey)!;
      groupData.rows.push(row);
    });

    const normalizedGroupedMap = new Map<
      string,
      {
        parentRow: any | null;
        childRows: any[];
      }
    >();
    groupedMap.forEach((groupData, groupKey) => {
      const parentRow = pickParentRowByRule(groupData.rows);
      const childRows = groupData.rows.filter((row) => row !== parentRow);
      normalizedGroupedMap.set(groupKey, {
        parentRow,
        childRows,
      });
    });

    return normalizedGroupedMap;
  }, [elevationRows]);

  useEffect(() => {
    setCollapsedFloorPlanGroupMap((prev) => {
      const next: Record<string, boolean> = {};
      groupedFloorPlanRows.forEach((_, groupKey) => {
        next[groupKey] = prev[groupKey] ?? true;
      });
      return next;
    });
  }, [groupedFloorPlanRows]);

  useEffect(() => {
    setCollapsedScheduleGroupMap((prev) => {
      const next: Record<string, boolean> = {};
      groupedScheduleRows.forEach((_, groupKey) => {
        next[groupKey] = prev[groupKey] ?? true;
      });
      return next;
    });
  }, [groupedScheduleRows]);

  useEffect(() => {
    setCollapsedElevationGroupMap((prev) => {
      const next: Record<string, boolean> = {};
      groupedElevationRows.forEach((_, groupKey) => {
        next[groupKey] = prev[groupKey] ?? true;
      });
      return next;
    });
  }, [groupedElevationRows]);

  const displayFloorPlanRows = useMemo<GroupedSummaryRow[]>(() => {
    const result: GroupedSummaryRow[] = [];
    groupedFloorPlanRows.forEach((groupData, groupKey) => {
      if (!groupData.parentRow) {
        return;
      }
      if (groupData.childRows.length === 0) {
        result.push(groupData.parentRow);
        return;
      }
      result.push({
        ...groupData.parentRow,
        __isGroupedSummary: true,
        __groupKey: groupKey,
      });
      if (!collapsedFloorPlanGroupMap[groupKey]) {
        result.push(...groupData.childRows);
      }
    });
    return result;
  }, [collapsedFloorPlanGroupMap, groupedFloorPlanRows]);

  const displayScheduleRows = useMemo<GroupedSummaryRow[]>(() => {
    const result: GroupedSummaryRow[] = [];
    groupedScheduleRows.forEach((groupData, groupKey) => {
      if (!groupData.parentRow) {
        return;
      }
      if (groupData.childRows.length === 0) {
        result.push(groupData.parentRow);
        return;
      }
      result.push({
        ...groupData.parentRow,
        __isGroupedSummary: true,
        __groupKey: groupKey,
      });
      if (!collapsedScheduleGroupMap[groupKey]) {
        result.push(...groupData.childRows);
      }
    });
    return result;
  }, [collapsedScheduleGroupMap, groupedScheduleRows]);

  const displayElevationRows = useMemo<GroupedSummaryRow[]>(() => {
    const result: GroupedSummaryRow[] = [];
    groupedElevationRows.forEach((groupData, groupKey) => {
      if (!groupData.parentRow) {
        return;
      }
      if (groupData.childRows.length === 0) {
        result.push(groupData.parentRow);
        return;
      }
      result.push({
        ...groupData.parentRow,
        __isGroupedSummary: true,
        __groupKey: groupKey,
      });
      if (!collapsedElevationGroupMap[groupKey]) {
        result.push(...groupData.childRows);
      }
    });
    return result;
  }, [collapsedElevationGroupMap, groupedElevationRows]);

  const floorPlanItemCount = useMemo(
    () => floorPlanRows.filter(isOriginalItemRow).length,
    [floorPlanRows],
  );
  const scheduleItemCount = useMemo(
    () => scheduleRows.filter(isOriginalItemRow).length,
    [scheduleRows],
  );
  const elevationItemCount = useMemo(
    () => elevationRows.filter(isOriginalItemRow).length,
    [elevationRows],
  );

  const finalItemsSource = useMemo<{ source: SourceKey | null; rows: any[] }>(() => {
    const sourceFinallyDataRows = isSelectedLabelMerged
      ? finallyDataMergedRows
      : finallyDataRows;
    if (sourceFinallyDataRows.length > 0) {
      return { source: "finallyData", rows: sourceFinallyDataRows };
    }
    return { source: null, rows: [] };
  }, [finallyDataMergedRows, finallyDataRows, isSelectedLabelMerged]);

  const finalItemsRows = useMemo<FinalItemRow[]>(() => {
    if (finalItemsSource.rows.length === 0) return [];
    const sourceRows = finalItemsSource.rows;

    const groupedMap = new Map<string, { labelValue: string; rows: any[] }>();
    sourceRows.forEach((row, index) => {
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

    sourceRows.forEach((row, index) => {
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

      const rootRow = pickParentRowByRule(groupedRows);
      if (!rootRow) {
        result.push(groupedRows[0]);
        return;
      }
      const childRows = groupedRows.filter((item) => item !== rootRow);
      if (childRows.length === 0) {
        result.push(rootRow);
        return;
      }

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
  }, [collapsedSystemLabelMap, finalItemsSource]);

  const splitTableColumns = useMemo<ColumnsType<any>>(
    () =>
      columns.map((fieldName) => ({
        title: <div className="text-center text-xs text-grey-normal">{fieldName}</div>,
        key: `split-${fieldName}`,
        dataIndex: fieldName,
        width: fieldName === "Label" || fieldName === "Sub Label" ? 120 : 130,
        align: "center" as const,
        render: (_: unknown, record: any) => {
          const value = getDisplayValueByField(record?.result || {}, fieldName);
          return (
            <div className="mx-auto w-full max-w-[280px] overflow-hidden text-xs">
              <TruncatedTextCell value={value || "-"} />
            </div>
          );
        },
      })),
    [columns],
  );

  const fetchEvidenceUrlsByRows = useCallback(async (rows: any[]) => {
    const ids = Array.from(new Set(rows.flatMap((item) => getTakeOffResultItemIds(item))));
    if (ids.length === 0) {
      setEvidenceByResultItemId({});
      setClassifiedEvidenceUrls(emptyClassifiedEvidenceUrls);
      return;
    }

    const response = await getTakeOffEvidenceUrlsByIds(ids.join(","));
    if (response.status !== "success") {
      setEvidenceByResultItemId({});
      setClassifiedEvidenceUrls(emptyClassifiedEvidenceUrls);
      return;
    }

    const payload = response.data?.data ?? response.data ?? {};
    const nextMap: Record<string, EvidenceInfo[]> = {};
    const allEvidences: any[] = [];

    const collectEvidence = (candidate: any, fallbackResultItemId?: string) => {
      if (!candidate) return;
      if (Array.isArray(candidate)) {
        candidate.forEach((item) => collectEvidence(item, fallbackResultItemId));
        return;
      }
      allEvidences.push(candidate);
      if (!fallbackResultItemId) return;
      if (!nextMap[fallbackResultItemId]) {
        nextMap[fallbackResultItemId] = [];
      }
      nextMap[fallbackResultItemId].push(candidate);
    };

    if (Array.isArray(payload)) {
      payload.forEach((item) => collectEvidence(item));
    } else if (payload && typeof payload === "object") {
      Object.entries(payload).forEach(([resultItemId, evidence]: [string, any]) => {
        collectEvidence(evidence, resultItemId);
      });
    }

    setEvidenceByResultItemId(nextMap);
    setClassifiedEvidenceUrls(classifyEvidenceUrls(allEvidences));
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

  const fetchLabelData = useCallback(async (
    label: string,
    fileIdOverride?: string | number,
    mergedOverride?: boolean,
  ) => {
    if (!label) return;
    const resolvedFileId = fileIdOverride || fileId;
    if (!takeoffId || !resolvedFileId) return;
    setLoading(true);
    setScheduleRows([]);
    setFloorPlanRows([]);
    setElevationRows([]);
    setFinallyDataRows([]);
    setFinallyDataMergedRows([]);
    setScheduleMergedRows([]);
    setFloorPlanMergedRows([]);
    setElevationMergedRows([]);
    setOriginalScheduleLabelById({});
    setCollapsedSystemLabelMap({});
    setCollapsedScheduleGroupMap({});
    try {
      const response = await getFileSourceMergeResultsByLabel(
        takeoffId,
        String(resolvedFileId),
        label,
      );
      if (response.status !== "success") {
        notify.error({
          title: "Error",
          description: response?.data?.detail || "Failed to load merge rows by label.",
        });
        return;
      }

      if (response.data?.length === 0) {
        // 该Label下无任何item数据，，需要刷新label列表
        if (fileId) {
          fetchLabelsAndMaybeLoadData(fileId);
        }
        return;
      }

      const payload = response.data?.data ?? response.data ?? [];
      const labelMeta = labels.find((item) => item.label === label);
      const isLabelMerged =
        typeof mergedOverride === "boolean"
          ? mergedOverride
          : Boolean(labelMeta?.isMerged);

      const nextScheduleRows = normalizeRows(collectSourceRows(payload, "schedule", false));
      const nextFloorPlanRows = normalizeRows(collectSourceRows(payload, "floorPlan", false));
      const nextElevationRows = normalizeRows(collectSourceRows(payload, "elevation", false));
      const nextFinallyDataRows = normalizeRows(collectSourceRows(payload, "finallyData", false));
      const nextFinallyDataMergedRows = normalizeRows(
        collectSourceRows(payload, "finallyData", true),
      );
      const nextScheduleMergedRows = normalizeRows(collectSourceMergedRows(payload, "schedule"));
      const nextFloorPlanMergedRows = normalizeRows(collectSourceMergedRows(payload, "floorPlan"));
      const nextElevationMergedRows = normalizeRows(collectSourceMergedRows(payload, "elevation"));
      const evidenceScheduleRows = normalizeRows(collectSourceRowsForEvidence(payload, "schedule"));
      const evidenceFloorPlanRows = normalizeRows(collectSourceRowsForEvidence(payload, "floorPlan"));
      const evidenceElevationRows = normalizeRows(collectSourceRowsForEvidence(payload, "elevation"));

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
      setFinallyDataRows(nextFinallyDataRows);
      setFinallyDataMergedRows(nextFinallyDataMergedRows);
      setScheduleMergedRows(nextScheduleMergedRows);
      setFloorPlanMergedRows(nextFloorPlanMergedRows);
      setElevationMergedRows(nextElevationMergedRows);
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
        ...evidenceScheduleRows,
        ...evidenceFloorPlanRows,
        ...evidenceElevationRows,
      ]);
      setScheduleChanges({});
      setEditingCell(null);
      setEditingValue("");
    } finally {
      setLoading(false);
    }
  }, [fetchEvidenceUrlsByRows, fileId, takeoffId, labels]);

  const fetchLabelsAndMaybeLoadData = useCallback(
    async (
      resolvedFileId: number,
      preferredLabel?: string,
      autoSwitchFromMergedCurrent: boolean = false,
    ) => {
      if (!takeoffId || !resolvedFileId) return;
      const labelsRes = await getGroupedLabelsByFileAndTakeOff(
        takeoffId,
        String(resolvedFileId),
      );
      if (labelsRes.status !== "success") {
        notify.error({
          title: "Error",
          description: labelsRes?.data?.detail || "Failed to load grouped labels.",
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
            isAutoMerged: Boolean(item?.is_auto_merged),
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
        setFinallyDataRows([]);
        setFinallyDataMergedRows([]);
        setScheduleMergedRows([]);
        setFloorPlanMergedRows([]);
        setElevationMergedRows([]);
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
        if (Boolean(currentItem?.isMerged)) {
          const nextUnmerged =
            nextLabels
              .slice(Math.max(currentIndex + 1, 0))
              .find((item) => !Boolean(item.isMerged)) ||
            nextLabels.find((item) => !Boolean(item.isMerged));
          if (nextUnmerged?.label) {
            nextSelectedLabel = nextUnmerged.label;
          }
        }
      }

      const nextSelectedLabelMeta = nextLabels.find(
        (item) => item.label === nextSelectedLabel,
      );

      setSelectedLabel(nextSelectedLabel);
      setContentTab("evidences");
      await fetchLabelData(
        nextSelectedLabel,
        resolvedFileId,
        Boolean(nextSelectedLabelMeta?.isMerged),
      );
    },
    [fetchLabelData, takeoffId],
  );

  const initPage = useCallback(async () => {
    if (!takeoffId) return;
    setLoading(true);
    try {
      const takeoffRes = await getTakeOffById(takeoffId);
      if (takeoffRes.status !== "success") {
        notify.error({
          title: "Error",
          description: takeoffRes?.data?.detail || "Failed to load takeoff data.",
        });
        return;
      }

      const firstFileId = takeoffRes.data?.project_files?.[0]?.id;
      setFiles(takeoffRes.data?.project_files || []);
      if (!firstFileId) {
        notify.warning({
          title: "Warning",
          description: "No file found for current takeoff.",
        });
        return;
      }
      setFileId(firstFileId);
      fetchColumns(takeoffRes.data?.take_off_result?.template_id || 1);

      await fetchLabelsAndMaybeLoadData(firstFileId);
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
        content: "You have unsaved Schedule edits. Are you sure you want to continue?.",
        onCancel: async () => {

        },
        onOk: async () => {
          setContentTab("evidences");
          setSelectedLabel(label);
          fetchLabelData(label);
        },
      });
      return;
    }
    setContentTab("evidences");
    setSelectedLabel(label);
    await fetchLabelData(label);
  };

  const handleSwitchFile = async (nextFileId: number) => {
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

  const submitFinalItemsRows = useCallback(
    async (
      nextFinalItemsRows: any[],
      options?: {
        silentSuccess?: boolean;
      },
    ) => {
      if (!takeoffId || !fileId) return false;

      const nextScheduleRowsForSubmit =
        finalItemsSource.source === "schedule" ? nextFinalItemsRows : scheduleRows;
      const nextFloorPlanRowsForSubmit =
        finalItemsSource.source === "floorPlan" ? nextFinalItemsRows : floorPlanRows;
      const nextElevationRowsForSubmit =
        finalItemsSource.source === "elevation" ? nextFinalItemsRows : elevationRows;
      const nextFinallyDataRowsForSubmit =
        finalItemsSource.source === "finallyData" ? nextFinalItemsRows : finallyDataRows;

      const allItemIds = Array.from(
        [
          ...nextScheduleRowsForSubmit,
          ...nextFloorPlanRowsForSubmit,
          ...nextElevationRowsForSubmit,
          ...nextFinallyDataRowsForSubmit,
        ]
          .map((item) => toValidItemId(item))
          .filter(Boolean),
      ) as string[];
      if (allItemIds.length === 0) {
        notify.warning({
          title: "No Items",
          description: "No items found to submit.",
        });
        return false;
      }

      setLoading(true);
      const response = await checkFileSourceMergeResultsAndCreateSingleFileResults(
        takeoffId,
        String(fileId),
        allItemIds.join(","),
        nextFinalItemsRows,
      );
      setLoading(false);
      if (response.status === "success") {
        if (!options?.silentSuccess) {
          notify.success({
            title: "Success",
            description:
              nextFinalItemsRows.length > 0
                ? `Merged complete with ${nextFinalItemsRows.length} rows.`
                : "Merged complete.",
          });
        }
        setScheduleChanges({});
        await fetchLabelsAndMaybeLoadData(fileId, selectedLabel, true);
        return true;
      } else {
        notify.error({
          title: "Error",
          description: response?.data?.detail || "Failed to submit modified rows.",
        });
      }
    },
    [
      elevationRows,
      fileId,
      finalItemsSource.source,
      floorPlanRows,
      finallyDataRows,
      scheduleRows,
      fetchLabelsAndMaybeLoadData,
      selectedLabel,
      takeoffId,
    ],
  );

  const commitEdit = async (record: any, fieldName: string) => {
    const id = String(record.id);
    const oldDisplay = getDisplayValueByField(record?.result || {}, fieldName);
    const oldValue = oldDisplay === "-" ? "" : oldDisplay;
    const newValue = editingValue.trim();

    setEditingCell(null);
    setEditingValue("");
    if (oldValue === newValue) return;

    const sourceRows = finalItemsSource.rows;
    const nextSourceRows = sourceRows.map((row) => {
      if (String(row.id) !== id) return row;
      const nextRow = {
        ...row,
        result: setResultValueByField(
          parseItemResultUtil(row?.result as any),
          fieldName,
          newValue,
        ),
      };
      return nextRow;
    });

    const changedRow = nextSourceRows.find((row) => String(row.id) === id);
    if (changedRow) {
      setScheduleChanges((prevChanges) => ({
        ...prevChanges,
        [id]: changedRow,
      }));
    }
    if (finalItemsSource.source === "schedule") {
      if (isSelectedLabelMerged) {
        setScheduleMergedRows(nextSourceRows);
      } else {
        setScheduleRows(nextSourceRows);
      }
    } else if (finalItemsSource.source === "floorPlan") {
      if (isSelectedLabelMerged) {
        setFloorPlanMergedRows(nextSourceRows);
      } else {
        setFloorPlanRows(nextSourceRows);
      }
    } else if (finalItemsSource.source === "elevation") {
      if (isSelectedLabelMerged) {
        setElevationMergedRows(nextSourceRows);
      } else {
        setElevationRows(nextSourceRows);
      }
    } else if (finalItemsSource.source === "finallyData") {
      if (isSelectedLabelMerged) {
        setFinallyDataMergedRows(nextSourceRows);
      } else {
        setFinallyDataRows(nextSourceRows);
      }
    }
  };

  const handleSaveChangesForMergedLabel = useCallback(async () => {
    const changedItems = Object.values(scheduleChanges)
      .map((item: any) => {
        const id = item?.id !== null && item?.id !== undefined ? String(item.id) : "";
        if (!id) return null;
        return {
          id,
          result: parseItemResultUtil(item?.result as any),
        };
      })
      .filter(Boolean) as Array<{ id: string; result: Record<string, any> }>;

    if (changedItems.length === 0) {
      notify.info({
        title: "No Changes",
        description: "No modified items to save.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await updateSingleFileMergeResultsByIdList(changedItems);
      if (response.status === "success") {
        notify.success({
          title: "Success",
          description: `Saved ${changedItems.length} modified items.`,
        });
        setScheduleChanges({});
        await fetchLabelData(selectedLabel);
        return;
      }
      notify.error({
        title: "Error",
        description: response?.data?.detail || "Failed to save modified items.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [fetchLabelData, scheduleChanges, selectedLabel]);

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
    if (!finalItemsSource.source) {
      notify.warning({
        title: "No Items",
        description: "No items found to submit.",
      });
      return;
    }

    const currentRows = finalItemsSource.rows;
    const normalizedRows =
      finalItemsSource.source === "schedule"
        ? normalizeScheduleRowsForSubmit([...currentRows])
        : [...currentRows];

    if (finalItemsSource.source === "schedule") {
      setScheduleRows(normalizedRows);
    } else if (finalItemsSource.source === "floorPlan") {
      setFloorPlanRows(normalizedRows);
    } else if (finalItemsSource.source === "elevation") {
      setElevationRows(normalizedRows);
    } else if (finalItemsSource.source === "finallyData") {
      setFinallyDataRows(normalizedRows);
    }

    await submitFinalItemsRows(normalizedRows, { silentSuccess: false });
  }, [finalItemsSource, normalizeScheduleRowsForSubmit, submitFinalItemsRows]);

  const handleRollbackMergedLabel = useCallback(() => {
    if (!isSelectedLabelMerged) return;
    const resolvedFileId = fileId ? Number(fileId) : 0;
    const rollbackIds = finalItemsSource.rows
      .map((row) => String(row?.id || "").trim())
      .filter(Boolean);

    if (!resolvedFileId || rollbackIds.length === 0) {
      notify.warning({
        title: "No Merged Data",
        description: "No merged results found for the current label.",
      });
      return;
    }

    confirm({
      title: "Undo Merge Confirmation",
      content:
        "Undoing this merge will rollback the current merged label. Are you sure you want to continue?",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: async () => {
        setRollbackSubmitting(true);
        try {
          const response = await rollbackSingleFileMergeResultByIds(
            rollbackIds.join(","),
          );
          if (response.status !== "success") {
            notify.error({
              title: "Error",
              description: response?.data?.detail || "Failed to undo merged label.",
            });
            return;
          }
          notify.success({
            title: "Success",
            description: "Merged label has been rolled back.",
          });
          await fetchLabelsAndMaybeLoadData(resolvedFileId, selectedLabel);
        } finally {
          setRollbackSubmitting(false);
        }
      },
    });
  }, [
    fetchLabelsAndMaybeLoadData,
    finalItemsSource.rows,
    fileId,
    isSelectedLabelMerged,
    selectedLabel,
  ]);

  const handleCreateMergeResult = useCallback(async () => {
    if (!takeoffId) return;
    setBuildLoading(true);
    try {
      const response = await autoCreateMultipleFilesMergeResultByTakeOffId(takeoffId);
      setBuildLoading(false);
      if (response.status === "success") {
        router.replace(`/projects/${projectId}/takeoff/${takeoffId}/analyze-new`);
        return;
      }
      notify.error({
        title: "Error",
        description: response.data?.detail || "Failed to create merge result.",
      });
    } catch (error) {
      setBuildLoading(false);
      notify.error({
        title: "Error",
        description: "Failed to create merge result.",
      });
    }
  }, [takeoffId]);

  const handleDeleteFinalItem = useCallback(
    (record: any) => {
      const itemId = record?.id;
      if (itemId === null || itemId === undefined || itemId === "") {
        notify.warning({
          title: "Invalid Item",
          description: "Unable to delete item because id is missing.",
        });
        return;
      }

      confirm({
        title: "Delete Item",
        content: "Are you sure you want to delete this item?",
        okText: "Delete",
        cancelText: "Cancel",
        okButtonProps: { danger: true },
        onOk: async () => {
          const idsToDelete = (() => {
            if (!record?.__isSystemRoot || !record?.__systemGroupKey) {
              return [String(itemId)];
            }
            const parentGroupKey = String(record.__systemGroupKey);
            const groupedIds = finalItemsSource.rows
              .filter((row) => {
                const labelValue = getDisplayValueByField(row?.result || {}, "Label");
                const rowGroupKey =
                  normalizeLabelKey(labelValue || "") ||
                  `__unknown__${String(row?.id ?? row?.__rowKey ?? "")}`;
                return rowGroupKey === parentGroupKey;
              })
              .map((row) => String(row?.id || ""))
              .filter(Boolean);
            return groupedIds.length ? groupedIds : [String(itemId)];
          })();

          setLoading(true);
          try {
            const resultIds = idsToDelete.join(",");
            const response = isSelectedLabelMerged
              ? await deleteSingleFileMergeResultByIdList(resultIds)
              : await deleteFileSourceMergeResultByIdList(resultIds);

            if (response.status !== "success") {
              notify.error({
                title: "Error",
                description: response?.data?.detail || "Failed to delete item.",
              });
              return;
            }

            notify.success({
              title: "Success",
              description:
                idsToDelete.length > 1
                  ? `Deleted ${idsToDelete.length} items successfully.`
                  : "Item deleted successfully.",
            });

            await fetchLabelData(selectedLabel, fileId || undefined);
          } finally {
            setLoading(false);
          }
        },
      });
    },
    [fetchLabelData, fileId, finalItemsSource.rows, isSelectedLabelMerged, selectedLabel],
  );

  const refreshItemsAndEvidence = useCallback(async () => {
    await fetchLabelData(selectedLabel, fileId || undefined);
  }, [fetchLabelData, fileId, selectedLabel]);

  const openSplitModal = useCallback(() => {
    setSplitModalOpen(true);
  }, []);

  const closeSplitModal = useCallback(() => {
    setSplitModalOpen(false);
  }, []);

  const openCopyModal = useCallback(() => {
    setCopySelectedRowKeys([]);
    setCopyModalOpen(true);
  }, []);

  const closeCopyModal = useCallback(() => {
    setCopySelectedRowKeys([]);
    setCopyModalOpen(false);
  }, []);

  const handleConfirmCopyItems = useCallback(async () => {
    if (copySelectedRowKeys.length === 0) {
      notify.warning({
        title: "No Items Selected",
        description: "Please select at least one item.",
      });
      return;
    }
    setCopySubmitting(true);
    try {
      notify.info({
        title: "Coming Soon",
        description: `Copy API is not ready yet. Selected ${copySelectedRowKeys.length} item(s).`,
      });
      closeCopyModal();
    } finally {
      setCopySubmitting(false);
    }
  }, [closeCopyModal, copySelectedRowKeys.length]);

  const handleSubmitSplit = useCallback(async (selectedRowKeys: React.Key[], targetLabel: string) => {
    const selectedIds = selectedRowKeys
      .map((key) => String(key))
      .filter(Boolean);
    if (!selectedIds.length) {
      notify.warning({
        title: "No Valid Items",
        description: "Selected items are invalid, please reselect.",
      });
      return;
    }

    setSplitSubmitting(true);
    try {
      const response = await splitFileSourceMergeResultsByIdList(
        takeoffId,
        fileId as number,
        selectedIds.join(","),
        targetLabel,
      );
      if (response.status !== "success") {
        notify.error({
          title: "Error",
          description: response?.data?.detail || "Failed to split items.",
        });
        return;
      }

      notify.success({
        title: "Success",
        description: `Split ${selectedIds.length} items successfully.`,
      });
      closeSplitModal();
      await fetchLabelsAndMaybeLoadData(fileId as number, selectedLabel);
    } finally {
      setSplitSubmitting(false);
    }
  }, [closeSplitModal, fetchLabelsAndMaybeLoadData, fileId, selectedLabel, takeoffId]);

  const renderTable = (
    title: string,
    rows: any[],
    editable: boolean,
    scrollY?: string,
  ) => {
    const dataColumns: ColumnsType<any> = columns.map((fieldName) => ({
      title: <div className="text-center whitespace-nowrap text-xs text-grey-normal">{fieldName}</div>,
      key: fieldName,
      dataIndex: fieldName,
      width: fieldName === "Label" || fieldName === "Sub Label" ? 120 : 130,
      fixed: fieldName === "Label" || fieldName === "Sub Label" ? ("left" as const) : undefined,
      align: "center" as const,
      render: (_: unknown, record: any) => {
        const isGroupedSummary = Boolean(record?.__isGroupedSummary);
        const value = getDisplayValueByField(record?.result || {}, fieldName);
        const isEditing = editable && editingCell?.id === String(record.id) && editingCell?.field === fieldName;
        let conflicting_fields = record?.conflicting_fields || [];
        let isConflicting = conflicting_fields.includes(fieldName) && title === 'Final Items';
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
            className={`mx-auto w-full h-full max-w-[300px] overflow-hidden text-xs ${editable ? "cursor-text" : ""
              } ${isConflicting ? 'bg-[#FFFF00]' : ''} `}
            onClick={() => {
              if (isGroupedSummary) return;
              if (editable) startEdit(record, fieldName);
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
            ) : fieldName === "Label" &&
              isGroupedSummary &&
              (title === "Schedule" || title === "Floor Plan" || title === "Elevation") &&
              record?.__groupKey ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <TruncatedTextCell value={value || "-"} />
                </div>
                <Button
                  type="text"
                  size="small"
                  className="!h-5 !w-5 !min-w-5 !p-0"
                  onClick={(event) => {
                    event.stopPropagation();
                    const groupKey = String(record.__groupKey);
                    if (title === "Schedule") {
                      setCollapsedScheduleGroupMap((prev) => ({
                        ...prev,
                        [groupKey]: !(prev[groupKey] ?? true),
                      }));
                      return;
                    }
                    if (title === "Floor Plan") {
                      setCollapsedFloorPlanGroupMap((prev) => ({
                        ...prev,
                        [groupKey]: !(prev[groupKey] ?? true),
                      }));
                      return;
                    }
                    setCollapsedElevationGroupMap((prev) => ({
                      ...prev,
                      [groupKey]: !(prev[groupKey] ?? true),
                    }));
                  }}
                >
                  {title === "Schedule"
                    ? (collapsedScheduleGroupMap[String(record.__groupKey)] ?? true)
                      ? <DownOutlined className="text-[10px] text-grey-normal" />
                      : <UpOutlined className="text-[10px] text-grey-normal" />
                    : title === "Floor Plan"
                      ? (collapsedFloorPlanGroupMap[String(record.__groupKey)] ?? true)
                        ? <DownOutlined className="text-[10px] text-grey-normal" />
                        : <UpOutlined className="text-[10px] text-grey-normal" />
                      : (collapsedElevationGroupMap[String(record.__groupKey)] ?? true)
                        ? <DownOutlined className="text-[10px] text-grey-normal" />
                        : <UpOutlined className="text-[10px] text-grey-normal" />}
                </Button>
              </div>
            ) : (
              <TruncatedTextCell
                value={
                  value || "-"
                }
              />
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
      (
        <div>
          {record?.__isGroupedSummary && title !== "Schedule" ? null : (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  if (title === "Final Items") {
                    if (isSelectedLabelMerged) {
                      // 已合并 label 保持当前 reference 方式不变
                      handleOpenReferenceModalByRecord(record);
                    } else {
                      // 未合并 label 使用两列图片弹窗
                      handleOpenImageReferenceModalByRecord(record);
                    }
                    return;
                  }
                  if (title === "Schedule") {
                    handleOpenImageReferenceModalByRecord(record);
                    return;
                  }
                  if (title === "Floor Plan") {
                    handleOpenImageReferenceModalByRecord(record);
                    return;
                  }
                  if (title === "Elevation") {
                    handleOpenImageReferenceModalByRecord(record);
                  }
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
              {
                title === 'Final Items' && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleDeleteFinalItem(record)}
                  >
                    <Image
                      src="/assets/icons/delete.svg"
                      alt=""
                      width={15}
                      height={15}
                      preview={false}
                    />
                  </Button>
                )
              }
            </>
          )}
        </div>
      ),
    };

    return (
      <Table<any>
        rowKey={(record) => record.id ?? record.__rowKey}
        columns={[...dataColumns, actionColumn]}
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

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-white font-nunito">
      <header className="flex h-[110px] shrink-0 items justify-between items-center border-b border-primaryN30 bg-white px-10 pt-4">
        <TakeoffFileWorkflowNav
          className="flex-1"
          files={files}
          selectedFileId={fileId}
          onSelectFile={handleSwitchFile}
          currentStep="final-items"
          projectId={projectId}
          takeoffId={takeoffId}
        />
        <Button type="primary" className="custom-primary-btn !w-[150px]" onClick={handleCreateMergeResult}>
          Create Merge Result
        </Button>
      </header>
      <div className="flex flex-1 gap-4 p-4 overflow-y-hidden">
        <LabelSidebar
          labels={labels}
          autoMergedLabels={autoMergedLabels}
          conflictLabels={conflictLabels}
          selectedLabel={selectedLabel}
          collapsedAutoMergedLabels={collapsedAutoMergedLabels}
          collapsedConflictLabels={collapsedConflictLabels}
          onToggleAutoMergedLabels={() => setCollapsedAutoMergedLabels((prev) => !prev)}
          onToggleConflictLabels={() => setCollapsedConflictLabels((prev) => !prev)}
          onSwitchLabel={handleSwitchLabel}
        />

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="h-[calc((100vh - 130px)/2)] min-h-0 overflow-hidden">
              <TableSection
                title="Final Items"
                rows={finalItemsRows}
                editable={true}
                extra={(
                  <div className="ml-4 flex items-center gap-2">
                    <Button
                      className={`custom-primary-btn ${isSelectedLabelMerged ? '!w-[60px]' : ''}`}
                      loading={submitting}
                      onClick={isSelectedLabelMerged ? handleSaveChangesForMergedLabel : handleSubmitChanges}
                    >
                      {isSelectedLabelMerged ? "Save" : "Merge Complete"}
                    </Button>
                    {isSelectedLabelMerged && (
                      <Button
                        className="custom-primary-btn !w-[96px]"
                        onClick={handleRollbackMergedLabel}
                      >
                        Undo Merge
                      </Button>
                    )}
                    {!isSelectedLabelMerged && (
                      finalItemsRows.length > 1 && (
                        <Button className="custom-primary-btn !w-[60px]" onClick={openSplitModal}>
                          Split
                        </Button>
                      )
                    )}
                    {/* <Button className="custom-primary-btn !w-[60px]" onClick={openCopyModal}>
                      Copy
                    </Button> */}
                  </div>
                )}
                renderTable={renderTable}
              />
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
                    { label: "Source", value: "evidences" },
                  ]}
                />
              </div>

              {contentTab === "items" ? (
                <div className="h-[calc(100%-40px)] min-h-0 overflow-y-auto pr-1">
                  <div className="flex flex-col gap-3">
                    <div className="shrink-0">
                      <TableSection
                        title="Schedule"
                        rows={displayScheduleRows}
                        itemCount={scheduleItemCount}
                        editable={false}
                        extra={null}
                        scrollY={undefined}
                        stretch={false}
                        renderTable={renderTable}
                      />
                    </div>
                    <div className="shrink-0">
                      <TableSection
                        title="Floor Plan"
                        rows={displayFloorPlanRows}
                        itemCount={floorPlanItemCount}
                        editable={false}
                        extra={null}
                        scrollY={undefined}
                        stretch={false}
                        renderTable={renderTable}
                      />
                    </div>
                    <div className="shrink-0">
                      <TableSection
                        title="Elevation"
                        rows={displayElevationRows}
                        itemCount={elevationItemCount}
                        editable={false}
                        extra={null}
                        scrollY={undefined}
                        stretch={false}
                        renderTable={renderTable}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[calc(100%-40px)] min-h-0">
                  <div className="grid h-full min-h-0 grid-cols-3 gap-3">
                    <EvidenceSection
                      title="Schedule"
                      evidences={scheduleEvidencesWithOverlay}
                      files={files}
                      currentLabel={selectedLabel}
                      allLabels={labels}
                      isLabelMerged={isSelectedLabelMerged}
                      onRefreshItemsAndEvidence={refreshItemsAndEvidence}
                      onOpenScheduleAddBoxModal={handleOpenScheduleSourceAddBoxModal}
                    />
                    <EvidenceSection
                      title="Floor Plan"
                      evidences={floorPlanEvidences}
                      files={files}
                      currentLabel={selectedLabel}
                      allLabels={labels}
                      isLabelMerged={isSelectedLabelMerged}
                      onRefreshItemsAndEvidence={refreshItemsAndEvidence}
                    />
                    <EvidenceSection
                      title="Elevation"
                      evidences={elevationEvidences}
                      files={files}
                      currentLabel={selectedLabel}
                      allLabels={labels}
                      isLabelMerged={isSelectedLabelMerged}
                      onRefreshItemsAndEvidence={refreshItemsAndEvidence}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EvidenceImagePreviewModal
        open={previewOpen}
        fileName={previewPayload.fileName}
        pageNumber={previewPayload.pageNumber}
        imageUrl={previewPayload.imageUrl}
        pageEvidences={previewPayload.pageEvidences}
        onCancel={() => setPreviewOpen(false)}
      />
      <TakeoffReferenceByTypeModal
        open={referenceByTypeModalOpen}
        item={referenceByTypeItem}
        evidenceList={referenceByTypeEvidenceList}
        currentLabel={selectedLabel}
        initialType={referenceByTypeInitialType}
        initialEvidenceId={referenceByTypeInitialEvidenceId}
        onOpenPdfContext={handleOpenPdfPreviewFromReference}
        onClose={() => {
          setReferenceByTypeModalOpen(false);
          setReferenceByTypeItem(null);
          setReferenceByTypeEvidenceList([]);
          setReferenceByTypeInitialType(undefined);
          setReferenceByTypeInitialEvidenceId(undefined);
        }}
      />
      <ImageReferenceModal
        open={imageReferenceModalOpen}
        evidenceList={imageReferenceEvidenceList}
        onOpenPdfContext={(evidence) => handleOpenPdfPreviewFromReference(evidence, "schedule")}
        onClose={() => {
          setImageReferenceModalOpen(false);
          setImageReferenceEvidenceList([]);
        }}
      />
      <ScheduleSourceModal
        open={scheduleSourceModalOpen}
        evidence={scheduleSourceTargetEvidence}
        onConfirmSubItemBox={handleOpenCreateItemFromScheduleSource}
        onClose={() => {
          setScheduleSourceModalOpen(false);
          setScheduleSourceTargetEvidence(null);
        }}
      />
      <CreateItemModal
        open={scheduleCreateItemModalOpen}
        columns={columns}
        takeOffId={takeoffId}
        selectedFileId={fileId}
        pageEvidenceId={Number(
          scheduleSourceTargetEvidence?.evidence_id ??
          scheduleSourceTargetEvidence?.evidenceId ??
          scheduleSourceTargetEvidence?.id ??
          0,
        )}
        defaultLabel={selectedLabel || "Label"}
        previewImageUrl={getEvidenceUrlFromItem(scheduleSourceTargetEvidence)}
        previewCoordinates={schedulePendingCoordinates}
        /** manual merge 阶段新增 item 需要同步 file source merge result，因此使用专用接口。 */
        onSubmitCreateItem={addTakeOffResultItemManualMerge}
        onCancel={() => {
          setScheduleCreateItemModalOpen(false);
          setSchedulePendingCoordinates(null);
        }}
        onSuccess={async (createdBody) => {
          /**
           * 创建成功后需要关闭 Add Box 弹窗和 CreateItemModal，
           * 再根据新增 item 的 Label 决定刷新左侧列表还是只刷新右侧内容。
           */
          setScheduleCreateItemModalOpen(false);
          setScheduleSourceModalOpen(false);
          setSchedulePendingCoordinates(null);
          setScheduleSourceTargetEvidence(null);

          const createdLabel = String(createdBody?.result?.Label);
          const currentLabel = String(selectedLabel);
          if (createdLabel === currentLabel) {
            await refreshItemsAndEvidence();
            return;
          }

          if (fileId) {
            await fetchLabelsAndMaybeLoadData(Number(fileId), createdLabel || selectedLabel);
          }
        }}
      />

      <SplitItemsModal
        open={splitModalOpen}
        loading={splitSubmitting}
        rows={finalItemsRows}
        columns={splitTableColumns}
        currentLabel={selectedLabel}
        allLabels={allLabelNames}
        onCancel={closeSplitModal}
        onSave={handleSubmitSplit}
      />

      <Modal
        open={copyModalOpen}
        title="Copy Items"
        width={1100}
        onCancel={closeCopyModal}
        onOk={handleConfirmCopyItems}
        okText="Confirm"
        cancelText="Cancel"
        confirmLoading={copySubmitting}
      >
        <Table<any>
          rowKey={(record) => record.id ?? record.__rowKey}
          columns={splitTableColumns}
          dataSource={finalItemsRows}
          pagination={false}
          rowSelection={{
            selectedRowKeys: copySelectedRowKeys,
            onChange: (nextRowKeys) => setCopySelectedRowKeys(nextRowKeys),
          }}
          scroll={{ x: "max-content", y: 380 }}
          className="h-full [&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
        />
      </Modal>

      {loading && <LoadingScreen isLoading={loading} />}
      {buildLoading && <BuildingBackground step={"page-takeoff"} />}
    </div>
  );
}

