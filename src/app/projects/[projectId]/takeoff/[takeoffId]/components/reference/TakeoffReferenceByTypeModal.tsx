"use client";

import { Empty, Modal, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";

import { getTakeOffEvidenceUrlsByIds } from "@/services/takeOffService";
import ScheduleEvidenceImage from "../evidence/ScheduleEvidenceImage";

type ReferenceType = "schedule" | "floorPlan" | "elevation";

interface ReferenceEvidenceItem {
  id: number | string;
  type?: string;
  evidence_url?: string;
  url?: string;
  evidence_id?: number | string;
  evidenceId?: number | string;
  source_item_id?: number;
  coordinates?: any;
  project_file_page_number?: number;
  overlayItems?: Array<{ id: number; coordinates: any }>;
  [key: string]: any;
}

interface TakeoffReferenceByTypeModalProps {
  open: boolean;
  item: any;
  evidenceList?: ReferenceEvidenceItem[];
  currentLabel?: string;
  initialType?: ReferenceType;
  initialEvidenceId?: string;
  onOpenPdfContext?: (evidence: ReferenceEvidenceItem, type: ReferenceType) => void;
  onClose: () => void;
}

const typeContains = (value: string, keywords: string[]) => {
  const text = value.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
};

const getEvidenceUrl = (evidence: any) => {
  if (typeof evidence?.evidence_url === "string" && evidence.evidence_url) return evidence.evidence_url;
  if (typeof evidence?.url === "string" && evidence.url) return evidence.url;
  if (typeof evidence?.s3_url === "string" && evidence.s3_url) return evidence.s3_url;
  return "";
};

const getEvidenceId = (evidence: any) => {
  const rawId = evidence?.evidence_id ?? evidence?.evidenceId ?? evidence?.id;
  if (rawId !== null && rawId !== undefined && String(rawId).trim()) {
    return String(rawId);
  }
  return "";
};

const hasCoordinatesData = (evidence: any) => {
  const coordinates = evidence?.coordinates;
  if (!coordinates) return false;
  if (typeof coordinates === "string") return coordinates.trim().length > 0;
  return typeof coordinates === "object";
};

const dedupeByEvidenceId = (list: ReferenceEvidenceItem[]) => {
  const map = new Map<string, ReferenceEvidenceItem>();
  list.forEach((item) => {
    const evidenceId = getEvidenceId(item) || getEvidenceUrl(item);
    if (!evidenceId || map.has(evidenceId)) return;
    map.set(evidenceId, {
      ...(item || {}),
      id: evidenceId,
      url: getEvidenceUrl(item),
    });
  });
  return Array.from(map.values());
};

const parseResultItemIds = (item: any): string[] => {
  if (Array.isArray(item?.take_off_result_item_id_list)) {
    return item.take_off_result_item_id_list
      .map((id: any) => String(id))
      .filter(Boolean);
  }

  const text = item?.take_off_result_item_ids;
  if (typeof text === "string" && text.trim()) {
    const matches = text.match(/\d+/g) || [];
    return matches.map((id) => String(id));
  }

  return [];
};

function EvidenceCard({
  title,
  evidences,
}: {
  title: string;
  evidences: ReferenceEvidenceItem[];
}) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-primaryN30 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-forumBlue-normal">{title}</span>
        <span className="text-xs text-grey-normal">{evidences.length} source</span>
      </div>
      {evidences.length > 0 ? (
        <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
          {evidences.map((evidence, index) => (
            <div
              key={`${evidence.id}-${index}`}
              className="overflow-hidden rounded-lg border border-primaryN30 bg-[#FBFBFC]"
            >
              <div className="h-[300px] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-white p-2">
                {evidence.evidence_url || evidence.url ? (
                  <img
                    src={evidence.url || evidence.evidence_url || ""}
                    alt={evidence.type || "Evidence"}
                    className="h-auto w-auto max-w-full max-h-full rounded-md object-contain"
                  />
                ) : (
                  <div className="flex min-h-[140px] items-center justify-center rounded-md border border-dashed border-primaryN30 text-xs text-grey-normal">
                    No evidence image
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-primaryN30 bg-primaryN20">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span className="text-xs text-grey-normal">No matched evidence</span>}
          />
        </div>
      )}
    </div>
  );
}

function ScheduleEvidenceCard({
  evidences,
}: {
  evidences: ReferenceEvidenceItem[];
}) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-primaryN30 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-forumBlue-normal">Schedule</span>
        <span className="text-xs text-grey-normal">{evidences.length} source</span>
      </div>
      {evidences.length > 0 ? (
        <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
          {evidences.map((evidence, index) => (
            <div
              key={`${evidence.id}-${index}`}
              className="overflow-hidden rounded-lg border border-primaryN30 bg-[#FBFBFC]"
            >
              <div className="h-[300px] overflow-y-auto overflow-x-hidden bg-white p-2 ">
                <ScheduleEvidenceImage
                  displayMode="contain"
                  imageUrl={evidence.url || evidence.evidence_url || ""}
                  items={Array.isArray(evidence?.overlayItems) ? evidence.overlayItems : []}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-primaryN30 bg-primaryN20">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span className="text-xs text-grey-normal">No matched evidence</span>}
          />
        </div>
      )}
    </div>
  );
}

export default function TakeoffReferenceByTypeModal({
  open,
  item,
  evidenceList,
  onClose,
}: TakeoffReferenceByTypeModalProps) {
  const [loading, setLoading] = useState(false);
  const [evidences, setEvidences] = useState<ReferenceEvidenceItem[]>([]);
  const useProvidedEvidenceList = evidenceList !== undefined;

  useEffect(() => {
    if (!open) return;

    if (useProvidedEvidenceList) {
      setLoading(false);
      setEvidences(Array.isArray(evidenceList) ? evidenceList : []);
      return;
    }

    if (!item) {
      setEvidences([]);
      return;
    }

    const fetchEvidences = async () => {
      const ids = parseResultItemIds(item);
      if (ids.length === 0) {
        setEvidences([]);
        return;
      }

      setLoading(true);
      try {
        const response = await getTakeOffEvidenceUrlsByIds(ids.join(","));
        if (response.status !== "success") {
          setEvidences([]);
          return;
        }

        const payload = response.data?.data ?? response.data ?? {};
        const next = Object.values(payload || {}).flatMap((value: any) =>
          Array.isArray(value) ? value : [value],
        ) as ReferenceEvidenceItem[];
        // 匹配matchedPrimaryCoordinate中的evidence_id
        if (item?.matched_primary_coordinate?.length > 0) {
          next.forEach((evidence) => {
            const matchedPrimaryCoordinate = item?.matched_primary_coordinate?.find((coord: any) => {
              return coord.evidence_id === evidence.id;
            });
            if (matchedPrimaryCoordinate) {
              evidence.coordinates = matchedPrimaryCoordinate.coordinates;
            }
          });
          setEvidences(next);
          return;
        }
        setEvidences(next);
      } finally {
        setLoading(false);
      }
    };

    fetchEvidences();
  }, [evidenceList, item, open, useProvidedEvidenceList]);

  const scheduleEvidences = useMemo(() => {
    const scheduleList = evidences.filter((evidence) =>
      typeContains(String(evidence?.type || ""), ["table", "window door unit"]),
    );
    const map = new Map<string, ReferenceEvidenceItem>();
    const overlayMap = new Map<string, Array<{ id: number; coordinates: any }>>();

    scheduleList.forEach((evidence) => {
      const evidenceId = getEvidenceId(evidence) || getEvidenceUrl(evidence);
      if (!evidenceId) return;

      if (hasCoordinatesData(evidence)) {
        const itemId = Number(evidence?.source_item_id ?? evidence?.id);
        if (Number.isFinite(itemId)) {
          if (!overlayMap.has(evidenceId)) {
            overlayMap.set(evidenceId, []);
          }
          overlayMap.get(evidenceId)?.push({
            id: itemId,
            coordinates: evidence?.coordinates,
          });
        }
      }

      if (!map.has(evidenceId)) {
        map.set(evidenceId, {
          ...(evidence || {}),
          id: evidenceId,
          url: getEvidenceUrl(evidence),
        });
      }
    });

    return Array.from(map.values()).map((evidence) => {
      const overlayItems = overlayMap.get(String(evidence?.id || "")) || [];
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
  }, [evidences]);

  const floorPlanEvidences = useMemo(
    () =>
      dedupeByEvidenceId(
        evidences.filter((evidence) =>
          typeContains(String(evidence?.type || ""), ["floor plan"]),
        ),
      ),
    [evidences],
  );
  const elevationEvidences = useMemo(
    () =>
      dedupeByEvidenceId(
        evidences.filter((evidence) =>
          typeContains(String(evidence?.type || ""), ["elevation"]),
        ),
      ),
    [evidences],
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90%"
      centered
      destroyOnClose
      title={null}
    >
      <div className="flex h-[78vh] min-h-[620px] flex-col overflow-hidden p-2">
        <div className="mb-4">
          <div className="text-base text-forumBlue-normal">Reference</div>
          <div className="mt-1 text-xs text-grey-normal">
            View grouped evidence images by source type.
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Spin />
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-4 overflow-hidden">
            <ScheduleEvidenceCard evidences={scheduleEvidences} />
            <EvidenceCard title="Floor Plan" evidences={floorPlanEvidences} />
            <EvidenceCard title="Elevation" evidences={elevationEvidences} />
          </div>
        )}
      </div>
    </Modal>
  );
}

