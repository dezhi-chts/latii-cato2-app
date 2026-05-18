"use client";

import { EyeOutlined } from "@ant-design/icons";
import { Empty, Modal, Tooltip } from "antd";
import { useMemo } from "react";

import ScheduleEvidenceImage from "../../merge-before/schedule/components/ScheduleEvidenceImage";

interface ImageReferenceModalProps {
  open: boolean;
  evidenceList: any[];
  onClose: () => void;
  onOpenPdfContext?: (evidence: any) => void;
}

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

export default function ImageReferenceModal({
  open,
  evidenceList,
  onClose,
  onOpenPdfContext,
}: ImageReferenceModalProps) {
  const referenceItems = useMemo(() => {
    const evidenceMap = new Map<string, any>();
    const overlayMap = new Map<string, Array<{ id: number; coordinates: any }>>();

    (evidenceList || []).forEach((evidence) => {
      const evidenceId = getEvidenceId(evidence) || getEvidenceUrl(evidence);
      if (!evidenceId) return;
      if (!evidenceMap.has(evidenceId)) {
        evidenceMap.set(evidenceId, {
          ...(evidence || {}),
          id: evidenceId,
          url: getEvidenceUrl(evidence),
        });
      }
      if (!hasCoordinatesData(evidence)) return;
      const itemId = Number((evidence as any)?.source_item_id ?? evidence?.id);
      if (!Number.isFinite(itemId)) return;
      if (!overlayMap.has(evidenceId)) {
        overlayMap.set(evidenceId, []);
      }
      overlayMap.get(evidenceId)?.push({
        id: itemId,
        coordinates: evidence?.coordinates,
      });
    });

    return Array.from(evidenceMap.values()).map((evidence) => {
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
  }, [evidenceList]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="50vw"
      centered
      destroyOnClose
      title={null}
    >
      <div className="flex h-[78vh] min-h-[560px] flex-col overflow-hidden p-2">
        <div className="mb-2">
          <div className="text-base text-forumBlue-normal">Reference</div>
          <div className="mt-1 text-xs text-grey-normal">View the source image associated with the item</div>
        </div>
        <div className="my-2 text-sm text-grey-normal"><span className="">Total Sources: </span> {referenceItems.length}</div>
        {referenceItems.length > 0 ? (
          <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-1 items-start gap-4 overflow-y-auto pr-1">
            {referenceItems.map((evidence, index) => (
              <div
                key={`${evidence?.id || "evidence"}-${index}`}
                className="flex min-h-0 self-start flex-col rounded-xl border border-primaryN30 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm text-forumBlue-normal">Source #{index + 1}</div>
                  {onOpenPdfContext && (
                    <Tooltip title="Preview PDF Context">
                      <div className="rounded-full bg-forumBlue-normal px-1">
                        <EyeOutlined
                          className="cursor-pointer text-white"
                          onClick={() => onOpenPdfContext(evidence)}
                        />
                      </div>
                    </Tooltip>
                  )}
                </div>
                {/* 使用最小高度而不是固定高度，避免高宽比特殊时图片被裁切。 */}
                <div className="rounded-md border border-primaryN30 bg-[#FBFBFC] p-2">
                  <ScheduleEvidenceImage
                    imageUrl={evidence?.url || evidence?.evidence_url || ""}
                    items={Array.isArray(evidence?.overlayItems) ? evidence.overlayItems : []}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No evidence image found." />
          </div>
        )}
      </div>
    </Modal>
  );
}

