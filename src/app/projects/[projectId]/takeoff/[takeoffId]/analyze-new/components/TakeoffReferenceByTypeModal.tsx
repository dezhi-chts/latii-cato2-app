"use client";

import { Empty, Modal, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";

import { getTakeOffEvidenceUrlsByIds } from "@/services/takeOffService";

interface ReferenceEvidenceItem {
  id: number;
  type?: string;
  evidence_url?: string;
  project_file_page_number?: number;
}

interface TakeoffReferenceByTypeModalProps {
  open: boolean;
  item: any;
  onClose: () => void;
}

const typeContains = (value: string, keywords: string[]) => {
  const text = value.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
};

const dedupeByEvidenceId = (list: ReferenceEvidenceItem[]) => {
  const map = new Map<number, ReferenceEvidenceItem>();
  list.forEach((item) => {
    if (typeof item?.id === "number" && !map.has(item.id)) {
      map.set(item.id, item);
    }
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
        <span className="text-xs text-grey-normal">{evidences.length} items</span>
      </div>
      {evidences.length > 0 ? (
        <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
          {evidences.map((evidence, index) => (
            <div
              key={`${evidence.id}-${index}`}
              className="overflow-hidden rounded-lg border border-primaryN30 bg-[#FBFBFC]"
            >
              <div className="bg-white p-2">
                {evidence.evidence_url ? (
                  <img
                    src={evidence.evidence_url}
                    alt={evidence.type || "Evidence"}
                    className="h-[220px] w-full rounded-md object-contain"
                  />
                ) : (
                  <div className="flex h-[220px] items-center justify-center rounded-md border border-dashed border-primaryN30 text-xs text-grey-normal">
                    No evidence image
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-primaryN30 bg-primaryN20">
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
  onClose,
}: TakeoffReferenceByTypeModalProps) {
  const [loading, setLoading] = useState(false);
  const [evidences, setEvidences] = useState<ReferenceEvidenceItem[]>([]);

  useEffect(() => {
    if (!open || !item) return;

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
        const next = Object.values(payload || {}) as ReferenceEvidenceItem[];
        setEvidences(next);
      } finally {
        setLoading(false);
      }
    };

    fetchEvidences();
  }, [item, open]);

  const scheduleEvidences = useMemo(
    () =>
      dedupeByEvidenceId(
      evidences.filter((evidence) =>
        typeContains(String(evidence?.type || ""), ["table", "window door unit"]),
        ),
      ),
    [evidences],
  );
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
            <EvidenceCard title="Schedule" evidences={scheduleEvidences} />
            <EvidenceCard title="Floor Plan" evidences={floorPlanEvidences} />
            <EvidenceCard title="Elevation" evidences={elevationEvidences} />
          </div>
        )}
      </div>
    </Modal>
  );
}

