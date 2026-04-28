"use client";

import { Spin } from "antd";
import { useEffect, useMemo, useState } from "react";

import { EvidenceRecord, ProjectFileRecord, TakeoffItemRecord } from "../types";
import { getTakeOffEvidenceUrlsByIds } from "@/services/takeOffService";
import PageThumbnailCard, { PageThumbnailEntry } from "./PageThumbnailCard";

interface EvidenceSidebarProps {
  selectedItem?: TakeoffItemRecord | null;
  files: ProjectFileRecord[];
}

export default function EvidenceSidebar({ selectedItem, files }: EvidenceSidebarProps) {
  const [evidences, setEvidences] = useState<any[]>([]);
  const [pageData, setPageData] = useState<PageThumbnailEntry[]>([]);
  const [loadingEvidences, setLoadingEvidences] = useState(false);
  const [pageImageMetricsMap, setPageImageMetricsMap] = useState<
    Record<
      string,
      {
        naturalWidth: number;
        naturalHeight: number;
        displayWidth: number;
        displayHeight: number;
        scaleX: number;
        scaleY: number;
      }
    >
  >({});

  const parseResultItemIds = (item: any): string[] => {
    if (Array.isArray(item?.take_off_result_item_id_list)) {
      return item.take_off_result_item_id_list.map((id: any) => String(id)).filter(Boolean);
    }

    const text = item?.take_off_result_item_ids;
    if (typeof text === "string" && text.trim()) {
      const matches = text.match(/\d+/g) || [];
      return matches.map((id) => String(id));
    }

    return [];
  };

  const fetchEvidences = async () => {
    const ids = parseResultItemIds(selectedItem);
    if (ids.length === 0) {
      setLoadingEvidences(false);
      setEvidences([]);
      return;
    }

    setLoadingEvidences(true);
    try {
      const response = await getTakeOffEvidenceUrlsByIds(ids.join(","));
      if (response.status !== "success") {
        setEvidences([]);
        return;
      }

      const payload = response.data?.data ?? response.data ?? {};
      let next = (Object.values(payload || {}) as any[]) || [];
      next = next.filter((evid) => evid !== null);
      const uniqueEvidences = next.filter((evid, index, self) => {
        return index === self.findIndex((target) => target?.id === evid?.id);
      });
      setEvidences(uniqueEvidences);
    } finally {
      setLoadingEvidences(false);
    }
  };

  useEffect(() => {
    if (!selectedItem) {
      setLoadingEvidences(false);
      setEvidences([]);
      return;
    }
    fetchEvidences();
  }, [selectedItem]);

  useEffect(() => {
    if (!evidences.length) {
      setPageData([]);
      return;
    }

    const groupedMap = new Map<string, PageThumbnailEntry>();
    evidences.forEach((evid) => {
      const fileId = Number(evid?.project_file_id || 0);
      const pageNumber = Number(evid?.project_file_page_number || 1);
      const file = files.find((item) => Number(item?.id) === fileId);
      const imagePages = file?.parse_detail?.image_page_infos || [];
      const imageUrl =
        imagePages.find((pageInfo, pageIndex) => Number(pageIndex + 1) === pageNumber)?.s3_url || "";

      const groupKey = `${fileId}-${pageNumber}-${imageUrl || "no-image"}`;
      const existing = groupedMap.get(groupKey);
      if (existing) {
        existing.pageEvidences.push(evid as EvidenceRecord);
        return;
      }

      const pageMetrics = pageImageMetricsMap[groupKey];
      const aspectRatio =
        pageMetrics && pageMetrics.naturalWidth > 0 && pageMetrics.naturalHeight > 0
          ? pageMetrics.naturalWidth / pageMetrics.naturalHeight
          : 1;

      groupedMap.set(groupKey, {
        key: groupKey,
        file: file as ProjectFileRecord,
        pageNumber,
        imageUrl,
        pageEvidences: [evid as EvidenceRecord],
        aspectRatio: Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1,
      });
    });

    const list = Array.from(groupedMap.values()).sort((first, second) => {
      const firstFileId = Number(first?.file?.id || 0);
      const secondFileId = Number(second?.file?.id || 0);
      if (firstFileId !== secondFileId) {
        return firstFileId - secondFileId;
      }
      return Number(first.pageNumber || 0) - Number(second.pageNumber || 0);
    });
    setPageData(list);
  }, [evidences, files, pageImageMetricsMap]);

  const handleImageRendered = (
    entryKey: string,
    metrics: {
      naturalWidth: number;
      naturalHeight: number;
      displayWidth: number;
      displayHeight: number;
      scaleX: number;
      scaleY: number;
    },
  ) => {
    setPageImageMetricsMap((prev) => {
      const current = prev[entryKey];
      if (
        current &&
        Math.abs(current.naturalWidth - metrics.naturalWidth) < 0.5 &&
        Math.abs(current.naturalHeight - metrics.naturalHeight) < 0.5 &&
        Math.abs(current.displayWidth - metrics.displayWidth) < 0.5 &&
        Math.abs(current.displayHeight - metrics.displayHeight) < 0.5
      ) {
        return prev;
      }
      return {
        ...prev,
        [entryKey]: metrics,
      };
    });
  };

  const selectedLabel = useMemo(
    () =>
      selectedItem && typeof selectedItem.result === "object"
        ? String((selectedItem.result as Record<string, unknown>)?.Label || "")
        : "",
    [selectedItem],
  );

  return (
    <div className="flex h-full w-[480px] flex-col border-l border-primaryN30 pl-5">
      <div className="my-2">
        <span className="text-sm text-forumBlue-normal">Label：</span>
        <span className="ml-1 text-sm text-grey-normal">{selectedLabel}</span>
        {!selectedItem && (
          <div className="mt-2 rounded-lg border border-dashed border-primaryN40 bg-[#FCFDFF] px-3 py-2.5">
            <div className="text-xs font-medium text-forumBlue-normal">No item selected</div>
            <div className="mt-1 text-xxs leading-5 text-grey-normal">
              Select an item from the table to view its source pages and evidence boxes here.
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
        {loadingEvidences ? (
          <div className="flex h-full min-h-[220px] items-center justify-center">
            <Spin />
          </div>
        ) : (
          <div className="flex flex-col gap-6 pb-6">
            {pageData?.length > 0 ? (
              pageData.map((entry) => (
                <PageThumbnailCard
                  key={entry.key}
                  entry={entry}
                  onImageRendered={handleImageRendered}
                />
              ))
            ) : (
              <div>
                <div className="text-xs font-medium text-forumBlue-normal">No pages found</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
