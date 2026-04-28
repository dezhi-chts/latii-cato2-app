"use client";

import { FullscreenOutlined } from "@ant-design/icons";
import { Button, Empty } from "antd";
import { useEffect, useRef, useState } from "react";
import { getEvidenceBounds } from "../takeoffUtils";
import { EvidenceRecord, ProjectFileRecord } from "../types";
import EvidenceImagePreviewModal from "./EvidenceImagePreviewModal";

export interface PageThumbnailEntry {
  key: string;
  file: ProjectFileRecord;
  pageNumber: number;
  imageUrl: string;
  pageEvidences: EvidenceRecord[];
  aspectRatio: number;
}

interface PageThumbnailCardProps {
  entry: PageThumbnailEntry;
  onImageRendered: (
    entryKey: string,
    metrics: {
      naturalWidth: number;
      naturalHeight: number;
      displayWidth: number;
      displayHeight: number;
      scaleX: number;
      scaleY: number;
    },
  ) => void;
}

export default function PageThumbnailCard({ entry, onImageRendered }: PageThumbnailCardProps) {
  const thumbnailImageRef = useRef<HTMLImageElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [thumbnailImageLoaded, setThumbnailImageLoaded] = useState(false);

  useEffect(() => {
    setThumbnailImageLoaded(false);
  }, [entry.imageUrl]);

  const syncThumbnailImageReadyState = (
    imageElement: HTMLImageElement,
    shouldCaptureMetrics: boolean,
  ) => {
    setThumbnailImageLoaded(true);
    if (!shouldCaptureMetrics) {
      return;
    }
    const naturalWidth = Number(imageElement.naturalWidth || 0);
    const naturalHeight = Number(imageElement.naturalHeight || 0);
    const displayWidth = Number(imageElement.clientWidth || 0);
    const displayHeight = Number(imageElement.clientHeight || 0);
    if (!naturalWidth || !naturalHeight || !displayWidth || !displayHeight) {
      return;
    }
    onImageRendered(entry.key, {
      naturalWidth,
      naturalHeight,
      displayWidth,
      displayHeight,
      scaleX: displayWidth / naturalWidth,
      scaleY: displayHeight / naturalHeight,
    });
  };

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      const thumbnailImage = thumbnailImageRef.current;
      if (thumbnailImage?.complete && thumbnailImage.naturalWidth > 0) {
        syncThumbnailImageReadyState(thumbnailImage, true);
      }
    });
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [entry.imageUrl, previewOpen]);

  return (
    <div className="border border-primaryN30 rounded-lg">
      <div className="mx-2 my-4 flex items-center justify-between">
        <span className="max-w-[300px] truncate text-xs text-grey-normal">
          {entry.file?.file_name || "Unnamed file"}
        </span>
        <span className="text-xs text-grey-normal">{"Page " + entry.pageNumber}</span>
      </div>

      <div className="relative overflow-hidden rounded-lg bg-white">
        <Button
          type="text"
          size="small"
          icon={<FullscreenOutlined />}
          className="!absolute right-2 top-2 z-10 !rounded-md !bg-black/40 !text-white hover:!bg-black/60 hover:!text-white"
          onClick={(event) => {
            event.stopPropagation();
            setPreviewOpen(true);
          }}
        />
        {entry.imageUrl ? (
          <div className="w-full py-3">
            <div className="relative w-full">
              <img
                ref={thumbnailImageRef}
                src={entry.imageUrl}
                alt={`${entry.file?.file_name || "File"} page ${entry.pageNumber}`}
                className="block h-auto w-full"
                loading="lazy"
                onLoad={(event) => {
                  syncThumbnailImageReadyState(event.currentTarget, true);
                }}
              />
              {thumbnailImageLoaded &&
                entry.pageEvidences.map((evidence) => {
                  const bounds = getEvidenceBounds(evidence);
                  if (!bounds) {
                    return null;
                  }
                  const sourceWidth = Number(bounds.source_width || evidence?.page_width_pdf || 0);
                  const sourceHeight = Number(bounds.source_height || evidence?.page_height_pdf || 0);
                  if (!sourceWidth || !sourceHeight) {
                    return null;
                  }
                  const leftPercent = (bounds.left / sourceWidth) * 100;
                  const topPercent = (bounds.top / sourceHeight) * 100;
                  const widthPercent = (bounds.width / sourceWidth) * 100;
                  const heightPercent = (bounds.height / sourceHeight) * 100;

                  return (
                    <div
                      key={evidence?.id}
                      className="absolute border-red-500"
                      style={{
                        borderStyle: "solid",
                        borderWidth: "1.5px",
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`,
                      }}
                    />
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span className="text-xs text-grey-normal">No preview image</span>}
            />
          </div>
        )}
      </div>

      <EvidenceImagePreviewModal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        fileName={entry.file?.file_name}
        pageNumber={entry.pageNumber}
        imageUrl={entry.imageUrl}
        pageEvidences={entry.pageEvidences}
      />
    </div>
  );
}

