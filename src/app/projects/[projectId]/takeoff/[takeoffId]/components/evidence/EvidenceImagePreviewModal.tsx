"use client";

import { Empty, Modal } from "antd";
import { ZoomControls } from "../pdf/Pdf-Controls";
import { useEffect, useRef, useState } from "react";
import { getEvidenceBounds } from "../../analyze-new/takeoffUtils";
import { EvidenceRecord } from "../../analyze-new/types";

interface EvidenceImagePreviewModalProps {
  open: boolean;
  fileName?: string;
  pageNumber: number;
  imageUrl: string;
  pageEvidences: EvidenceRecord[];
  onCancel: () => void;
}

export default function EvidenceImagePreviewModal({
  open,
  fileName,
  pageNumber,
  imageUrl,
  pageEvidences,
  onCancel,
}: EvidenceImagePreviewModalProps) {
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const modalImageRef = useRef<HTMLImageElement | null>(null);
  const modalDragStartRef = useRef({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const zoomModifierPressedRef = useRef(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isModalDragging, setIsModalDragging] = useState(false);
  const [modalImageLoaded, setModalImageLoaded] = useState(false);

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const WHEEL_ZOOM_STEP = 0.1;

  useEffect(() => {
    setModalImageLoaded(false);
  }, [imageUrl]);

  useEffect(() => {
    if (!open) {
      setIsModalDragging(false);
      setZoomScale(1);
    }
  }, [open]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      const modalImage = modalImageRef.current;
      if (modalImage?.complete && modalImage.naturalWidth > 0) {
        setModalImageLoaded(true);
      }
    });
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [imageUrl, open]);

  useEffect(() => {
    if (!isModalDragging) return;
    const handleMouseMove = (event: MouseEvent) => {
      const container = modalScrollRef.current;
      if (!container) return;
      const dx = event.clientX - modalDragStartRef.current.x;
      const dy = event.clientY - modalDragStartRef.current.y;
      container.scrollLeft = modalDragStartRef.current.scrollLeft - dx;
      container.scrollTop = modalDragStartRef.current.scrollTop - dy;
    };
    const handleMouseUp = () => {
      setIsModalDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isModalDragging]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      zoomModifierPressedRef.current = event.ctrlKey || event.metaKey;
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      zoomModifierPressedRef.current = event.ctrlKey || event.metaKey;
    };
    const handleWindowBlur = () => {
      zoomModifierPressedRef.current = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      zoomModifierPressedRef.current = false;
    };
  }, [open]);

  const handleZoomChange = (value: number) => {
    const clampedValue = Math.max(ZOOM_MIN, Math.min(value, ZOOM_MAX));
    setZoomScale(clampedValue);
  };

  const handleModalWheelZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    const modifierActive = zoomModifierPressedRef.current;
    if (!modifierActive || (!event.ctrlKey && !event.metaKey)) return;
    if (event.nativeEvent.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();
    const direction = event.deltaY < 0 ? 1 : -1;
    handleZoomChange(zoomScale + direction * WHEEL_ZOOM_STEP);
  };

  const handleModalMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !imageUrl) return;
    const container = modalScrollRef.current;
    if (!container) return;
    modalDragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
    setIsModalDragging(true);
    event.preventDefault();
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={"80vw"}
      destroyOnClose
      title={<div className="text-forumBlue-normal">{fileName || "Unnamed file"}</div>}
    >
      <div className="flex h-[75vh] min-h-[520px] flex-col">
        <div className="mb-3 flex items-center justify-center">
          <ZoomControls zoom={zoomScale} handleZoomChange={handleZoomChange} />
          <span className="ml-6 text-xs text-grey-normal">{"Page " + pageNumber}</span>
        </div>
        <div
          ref={modalScrollRef}
          className="min-h-0 flex-1 overflow-auto rounded-lg border border-primaryN30 bg-primaryN20 p-4"
          onWheel={handleModalWheelZoom}
          onMouseDown={handleModalMouseDown}
          style={{
            cursor: imageUrl ? (isModalDragging ? "grabbing" : "grab") : "default",
            userSelect: isModalDragging ? "none" : "auto",
          }}
        >
          <div
            className="relative rounded-lg bg-white"
            style={{
              width: `${zoomScale * 100}%`,
              minWidth: "420px",
            }}
          >
            {imageUrl ? (
              <div className="w-full py-3">
                <div className="relative w-full">
                  <img
                    ref={modalImageRef}
                    src={imageUrl}
                    alt={`${fileName || "File"} page ${pageNumber}`}
                    className="block h-auto w-full"
                    loading="lazy"
                    onLoad={() => setModalImageLoaded(true)}
                  />
                  {modalImageLoaded &&
                    pageEvidences.map((evidence) => {
                      const bounds = getEvidenceBounds(evidence);
                      if (!bounds) return null;
                      const sourceWidth = Number(bounds.source_width || evidence?.page_width_pdf || 0);
                      const sourceHeight = Number(bounds.source_height || evidence?.page_height_pdf || 0);
                      if (!sourceWidth || !sourceHeight) return null;
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
                            borderWidth: "2px",
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
        </div>
      </div>
    </Modal>
  );
}

