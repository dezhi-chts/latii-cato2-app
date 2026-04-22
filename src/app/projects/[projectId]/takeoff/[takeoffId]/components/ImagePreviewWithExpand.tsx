"use client";

import { Empty, Modal } from "antd";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent,
} from "react";

import { ZoomControls } from "./pdf/Pdf-Controls";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;

interface ImagePreviewWithExpandProps {
  src: string;
  alt?: string;
  showExpand?: boolean;
  className?: string;
  imageClassName?: string;
}

const clampZoom = (zoom: number) => {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
};

export default function ImagePreviewWithExpand({
  src,
  alt = "Image preview",
  showExpand = true,
  className = "",
  imageClassName = "",
}: ImagePreviewWithExpandProps) {
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [baseDisplayWidth, setBaseDisplayWidth] = useState(0);

  const handleZoomChange = useCallback((nextZoom: number) => {
    setZoom(clampZoom(nextZoom));
  }, []);

  const syncModalViewport = useCallback(() => {
    const container = modalScrollRef.current;
    if (!container) {
      return;
    }
    const nextViewportWidth = Number(container.clientWidth || 0);
    const nextViewportHeight = Number(container.clientHeight || 0);
    setViewportSize({
      width: nextViewportWidth,
      height: nextViewportHeight,
    });
    if (naturalSize.width > 0) {
      setBaseDisplayWidth(Math.min(naturalSize.width, nextViewportWidth));
    }
  }, [naturalSize.width]);

  const handleOpenPreview = useCallback(() => {
    if (!showExpand || !src) {
      return;
    }
    setZoom(1);
    setIsPreviewOpen(true);
  }, [showExpand, src]);

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setZoom(1);
    setIsDragging(false);
  }, []);

  const handleWheelZoom = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      if (event.nativeEvent.cancelable) {
        event.preventDefault();
      }
      event.stopPropagation();
      const direction = event.deltaY < 0 ? 1 : -1;
      handleZoomChange(zoom + direction * ZOOM_STEP);
    },
    [handleZoomChange, zoom],
  );

  const handleModalMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !src) {
        return;
      }
      const container = modalScrollRef.current;
      if (!container) {
        return;
      }
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      };
      setIsDragging(true);
      event.preventDefault();
    },
    [src],
  );

  useEffect(() => {
    if (!isDragging) {
      return;
    }
    const handleMouseMove = (event: MouseEvent) => {
      const container = modalScrollRef.current;
      if (!container) {
        return;
      }
      const deltaX = event.clientX - dragStartRef.current.x;
      const deltaY = event.clientY - dragStartRef.current.y;
      container.scrollLeft = dragStartRef.current.scrollLeft - deltaX;
      container.scrollTop = dragStartRef.current.scrollTop - deltaY;
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }
    syncModalViewport();
    const container = modalScrollRef.current;
    if (!container) {
      return;
    }
    const observer = new ResizeObserver(() => {
      syncModalViewport();
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [isPreviewOpen, syncModalViewport]);

  const modalImageWidth = useMemo(() => {
    if (baseDisplayWidth <= 0) {
      return 0;
    }
    return baseDisplayWidth * zoom;
  }, [baseDisplayWidth, zoom]);

  const modalImageHeight = useMemo(() => {
    if (naturalSize.width <= 0 || naturalSize.height <= 0 || modalImageWidth <= 0) {
      return 0;
    }
    return (naturalSize.height / naturalSize.width) * modalImageWidth;
  }, [modalImageWidth, naturalSize.height, naturalSize.width]);

  const shouldCenterHorizontally = useMemo(() => {
    if (modalImageWidth <= 0) {
      return false;
    }
    if (viewportSize.width <= 0) {
      return true;
    }
    return modalImageWidth <= viewportSize.width;
  }, [modalImageWidth, viewportSize.width]);

  const shouldCenterVertically = useMemo(() => {
    if (modalImageHeight <= 0) {
      return false;
    }
    if (viewportSize.height <= 0) {
      return true;
    }
    return modalImageHeight <= viewportSize.height;
  }, [modalImageHeight, viewportSize.height]);

  const rootClassName = `h-full w-full ${className}`.trim();
  const normalImageClassName =
    `max-h-full max-w-full object-contain ${imageClassName}`.trim();
  const modalImageStyle: CSSProperties = {
    width: modalImageWidth > 0 ? `${modalImageWidth}px` : "auto",
  };

  return (
    <>
      <div className={rootClassName}>
        {src ? (
          <div className="flex h-full w-full items-center justify-center overflow-hidden">
            <img
              src={src}
              alt={alt}
              className={`${normalImageClassName} ${
                showExpand ? "cursor-zoom-in" : ""
              }`.trim()}
              onClick={handleOpenPreview}
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span className="text-xs text-grey-normal">No image</span>}
            />
          </div>
        )}
      </div>

      <Modal
        open={isPreviewOpen}
        onCancel={handleClosePreview}
        footer={null}
        width="80vw"
        destroyOnClose
        title={<div className="text-forumBlue-normal">{alt}</div>}
      >
        <div className="flex h-[75vh] min-h-[420px] flex-col">
          <div className="mb-3 flex items-center justify-center">
            <ZoomControls zoom={zoom} handleZoomChange={handleZoomChange} />
          </div>
          <div
            ref={modalScrollRef}
            className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-primaryN30 bg-primaryN20 p-4"
            onWheel={handleWheelZoom}
            onMouseDown={handleModalMouseDown}
            style={{
              cursor: src ? (isDragging ? "grabbing" : "grab") : "default",
              userSelect: isDragging ? "none" : "auto",
            }}
          >
            <div
              className={`flex min-h-full min-w-full ${
                shouldCenterVertically ? "items-center" : "items-start"
              } ${
                shouldCenterHorizontally ? "justify-center" : "justify-start"
              }`}
            >
              <img
                src={src}
                alt={alt}
                className="block h-auto max-w-none shrink-0 rounded-lg border border-primaryN30 bg-white"
                style={modalImageStyle}
                draggable={false}
                onLoad={(event) => {
                  const imageElement = event.currentTarget;
                  const nextNaturalWidth = Number(imageElement.naturalWidth || 0);
                  const nextNaturalHeight = Number(imageElement.naturalHeight || 0);
                  setNaturalSize({
                    width: nextNaturalWidth,
                    height: nextNaturalHeight,
                  });
                  setBaseDisplayWidth((prevWidth) => {
                    const nextViewportWidth = Number(
                      modalScrollRef.current?.clientWidth || 0,
                    );
                    if (!nextNaturalWidth || !nextViewportWidth) {
                      return prevWidth;
                    }
                    return Math.min(nextNaturalWidth, nextViewportWidth);
                  });
                  syncModalViewport();
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
