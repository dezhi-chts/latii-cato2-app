"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Empty } from "antd";
import {
  getDisplayValueByField,
  parseItemResult as parseItemResultUtil,
} from "../../../analyze-new/takeoffUtils";

export interface NormalizedCoordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface ScheduleEvidenceImageProps {
  imageUrl: string;
  items: any[];
  activeItemId?: number | null;
  onSelectItem?: (itemId: number) => void;
  renderAtNaturalSize?: boolean;
}

export default function ScheduleEvidenceImage({
  imageUrl,
  items,
  activeItemId = null,
  onSelectItem,
  renderAtNaturalSize = false,
}: ScheduleEvidenceImageProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [showBoxes, setShowBoxes] = useState(false);
  const [imageMetrics, setImageMetrics] = useState({
    renderedWidth: 0,
    renderedHeight: 0,
    naturalWidth: 0,
    naturalHeight: 0,
  });

  useEffect(() => {
    const imageElement = imageRef.current;
    if (!imageElement) return;

    setImageReady(false);
    setShowBoxes(false);
    setImageMetrics({
      renderedWidth: 0,
      renderedHeight: 0,
      naturalWidth: 0,
      naturalHeight: 0,
    });

    const syncLoadedMetrics = () => {
      const rect = imageElement.getBoundingClientRect();
      setImageMetrics({
        renderedWidth: rect.width,
        renderedHeight: rect.height,
        naturalWidth: imageElement.naturalWidth || 0,
        naturalHeight: imageElement.naturalHeight || 0,
      });
      setImageReady(true);
      setShowBoxes(true);
    };

    const syncRenderedSize = () => {
      const rect = imageElement.getBoundingClientRect();
      setImageMetrics((prev) => ({
        ...prev,
        renderedWidth: rect.width,
        renderedHeight: rect.height,
      }));
    };

    syncRenderedSize();
    if (imageElement.complete && imageElement.naturalWidth > 0) {
      // Cached images may skip onLoad, so mark ready proactively.
      syncLoadedMetrics();
    }
    const observer = new ResizeObserver(syncRenderedSize);
    observer.observe(imageElement);
    return () => {
      observer.disconnect();
    };
  }, [imageUrl]);

  const hasImage = Boolean(imageUrl);
  const parseCoordinates = (value: unknown): NormalizedCoordinates | null => {
    if (!value) return null;
    let data: any = value;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return null;
      }
    }
    if (!data || typeof data !== "object") return null;
    const x1 = Number((data as any).x1);
    const y1 = Number((data as any).y1);
    const x2 = Number((data as any).x2);
    const y2 = Number((data as any).y2);
    if (![x1, y1, x2, y2].every((num) => Number.isFinite(num))) {
      return null;
    }
    return { x1, y1, x2, y2 };
  };

  const overlayRects = useMemo(() => {
    if (
      !imageReady ||
      !imageMetrics.renderedWidth ||
      !imageMetrics.renderedHeight ||
      !imageMetrics.naturalWidth ||
      !imageMetrics.naturalHeight ||
      items.length === 0
    ) {
      return [];
    }

    const scaleX = imageMetrics.renderedWidth / imageMetrics.naturalWidth;
    const scaleY = imageMetrics.renderedHeight / imageMetrics.naturalHeight;

    return items
      .map((item) => {
        const id = Number(item?.id);
        if (!Number.isFinite(id)) return null;
        const coordinates = parseCoordinates(item?.coordinates);
        if (!coordinates) return null;
        const { x1, y1, x2, y2 } = coordinates;
        const leftX = Math.min(x1, x2);
        const topY = Math.min(y1, y2);
        const rightX = Math.max(x1, x2);
        const bottomY = Math.max(y1, y2);

        // Restore by natural size first, then scale to rendered size.
        const leftNatural = leftX * imageMetrics.naturalWidth;
        const topNatural = topY * imageMetrics.naturalHeight;
        const widthNatural = (rightX - leftX) * imageMetrics.naturalWidth;
        const heightNatural = (bottomY - topY) * imageMetrics.naturalHeight;
        return {
          id,
          left: leftNatural * scaleX,
          top: topNatural * scaleY,
          width: widthNatural * scaleX,
          height: heightNatural * scaleY,
          area: widthNatural * heightNatural,
        };
      })
      .filter(Boolean) as Array<{
        id: number;
        left: number;
        top: number;
        width: number;
        height: number;
        area: number;
      }>;
  }, [imageMetrics, imageReady, items]);

  const orderedOverlayRects = useMemo(() => {
    // Render larger boxes first so smaller boxes stay on top and remain clickable.
    return [...overlayRects].sort((a, b) => {
      if (b.area !== a.area) return b.area - a.area;
      return a.id - b.id;
    });
  }, [overlayRects]);

  if (!hasImage) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-primaryN30 bg-white">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-xs text-grey-normal">No preview image</span>}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto p-3">
      <div className="mx-auto w-fit">
        <div className="relative inline-block">
          <img
            key={imageUrl}
            ref={imageRef}
            src={imageUrl}
            alt="Schedule Evidence"
            className={`block h-auto w-auto ${renderAtNaturalSize ? "max-w-none" : "max-w-full"}`}
            onLoad={() => {
              const element = imageRef.current;
              if (!element) return;
              const rect = element.getBoundingClientRect();
              setImageMetrics({
                renderedWidth: rect.width,
                renderedHeight: rect.height,
                naturalWidth: element.naturalWidth || 0,
                naturalHeight: element.naturalHeight || 0,
              });
              setImageReady(true);
              setShowBoxes(true);
            }}
            style={
              renderAtNaturalSize && imageMetrics.naturalWidth && imageMetrics.naturalHeight
                ? {
                  width: `${imageMetrics.naturalWidth}px`,
                  height: `${imageMetrics.naturalHeight}px`,
                }
                : undefined
            }
          />

          {showBoxes && orderedOverlayRects.map((rect) => {
            const isActive = rect.id === activeItemId;
            return (
              <div
                key={rect.id}
                className="absolute border transition-colors"
                style={{
                  left: `${rect.left}px`,
                  top: `${rect.top}px`,
                  width: `${Math.max(rect.width, 2)}px`,
                  height: `${Math.max(rect.height, 2)}px`,
                  borderColor: isActive ? "#FF4500" : "#427CCE",
                  backgroundColor: isActive ? "#FF450030" : "#427CCE30",
                }}
                onClick={() => onSelectItem?.(rect.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
