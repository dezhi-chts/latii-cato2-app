"use client";

import {
  forwardRef,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Empty } from "antd";
import { CheckOutlined, DeleteOutlined } from "@ant-design/icons";

export interface NormalizedCoordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

type ScheduleEvidenceImageDisplayMode = "width" | "contain";

interface ScheduleEvidenceImageProps {
  imageUrl: string;
  items: any[];
  activeItemId?: number | null;
  onSelectItem?: (itemId: number) => void;
  renderAtNaturalSize?: boolean;
  displayMode?: ScheduleEvidenceImageDisplayMode;
  disableContainerScroll?: boolean;
  onConfirmSubItemBox?: (
    coordinates: NormalizedCoordinates,
    boxId: string,
  ) => Promise<boolean | void> | boolean | void;
}

export interface ScheduleEvidenceImageRef {
  addSubItemBox: () => void;
}

interface DraftSubItemBox {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

type ResizeCorner = "nw" | "ne" | "sw" | "se";
type DragAction = "move" | ResizeCorner;

const MIN_BOX_SIZE = 12;
const NEW_BOX_BORDER_COLOR = "#16A34A";
const NEW_BOX_BACKGROUND_COLOR = "rgba(22,163,74,0.12)";
const HANDLE_BORDER_COLOR = "#427CCE";
const HANDLE_BACKGROUND_COLOR = "#FFFFFF";

const clamp = (value: number, min: number, max: number) => {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
};

const toFixedRatio = (value: number) => Number(value.toFixed(3));

const getClientPositionInContainer = (event: MouseEvent, rect: DOMRect) => {
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

const ScheduleEvidenceImage = forwardRef<ScheduleEvidenceImageRef, ScheduleEvidenceImageProps>(
  function ScheduleEvidenceImage({
    imageUrl,
    items,
    activeItemId = null,
    onSelectItem,
    renderAtNaturalSize = false,
    displayMode,
    disableContainerScroll = false,
    onConfirmSubItemBox,
  }: ScheduleEvidenceImageProps, ref) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const displayAreaRef = useRef<HTMLDivElement | null>(null);
  const overlayContainerRef = useRef<HTMLDivElement | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [showBoxes, setShowBoxes] = useState(false);
  const [draftBoxes, setDraftBoxes] = useState<DraftSubItemBox[]>([]);
  const [selectedDraftBoxId, setSelectedDraftBoxId] = useState<string | null>(null);
  const [confirmingIds, setConfirmingIds] = useState<Record<string, boolean>>({});
  const [imageMetrics, setImageMetrics] = useState({
    renderedWidth: 0,
    renderedHeight: 0,
    naturalWidth: 0,
    naturalHeight: 0,
  });
  const [displayAreaSize, setDisplayAreaSize] = useState({
    width: 0,
    height: 0,
  });
  const resolvedDisplayMode: ScheduleEvidenceImageDisplayMode =
    displayMode || (disableContainerScroll ? "contain" : "width");
  const isContainMode = resolvedDisplayMode === "contain";
  const dragSessionRef = useRef<{
    boxId: string;
    action: DragAction;
    containerRect: DOMRect;
    startPointerX: number;
    startPointerY: number;
    initialLeft: number;
    initialTop: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  useEffect(() => {
    const displayArea = displayAreaRef.current;
    if (!displayArea) return;

    const syncDisplayAreaSize = () => {
      const rect = displayArea.getBoundingClientRect();
      setDisplayAreaSize({
        width: rect.width,
        height: rect.height,
      });
    };

    syncDisplayAreaSize();
    const observer = new ResizeObserver(syncDisplayAreaSize);
    observer.observe(displayArea);
    return () => {
      observer.disconnect();
    };
  }, []);

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

  useEffect(() => {
    setDraftBoxes([]);
    setSelectedDraftBoxId(null);
    setConfirmingIds({});
  }, [imageUrl]);

  const updateDraftBoxById = (boxId: string, updater: (box: DraftSubItemBox) => DraftSubItemBox) => {
    setDraftBoxes((prev) => prev.map((box) => (box.id === boxId ? updater(box) : box)));
  };

  const addSubItemBox = () => {
    if (!imageReady || !imageMetrics.renderedWidth || !imageMetrics.renderedHeight) return;
    const nextWidth = imageMetrics.renderedWidth * 0.5;
    const nextHeight = imageMetrics.renderedHeight * 0.3;
    const nextBox: DraftSubItemBox = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      left: clamp((imageMetrics.renderedWidth - nextWidth) / 2, 0, imageMetrics.renderedWidth - nextWidth),
      top: clamp((imageMetrics.renderedHeight - nextHeight) / 2, 0, imageMetrics.renderedHeight - nextHeight),
      width: nextWidth,
      height: nextHeight,
    };
    setDraftBoxes((prev) => [...prev, nextBox]);
    setSelectedDraftBoxId(nextBox.id);
  };

  useImperativeHandle(ref, () => ({
    addSubItemBox,
  }));

  const removeDraftBox = (boxId: string) => {
    setDraftBoxes((prev) => prev.filter((box) => box.id !== boxId));
    setConfirmingIds((prev) => {
      if (!prev[boxId]) return prev;
      const next = { ...prev };
      delete next[boxId];
      return next;
    });
    setSelectedDraftBoxId((prev) => (prev === boxId ? null : prev));
  };

  const beginDrag = (
    event: ReactMouseEvent<HTMLDivElement>,
    box: DraftSubItemBox,
    action: DragAction,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const container = overlayContainerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const pointer = {
      x: event.clientX - containerRect.left,
      y: event.clientY - containerRect.top,
    };
    setSelectedDraftBoxId(box.id);
    dragSessionRef.current = {
      boxId: box.id,
      action,
      containerRect,
      startPointerX: pointer.x,
      startPointerY: pointer.y,
      initialLeft: box.left,
      initialTop: box.top,
      initialWidth: box.width,
      initialHeight: box.height,
    };
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragSession = dragSessionRef.current;
      if (!dragSession) return;
      const currentPointer = getClientPositionInContainer(event, dragSession.containerRect);
      const boundsWidth = imageMetrics.renderedWidth;
      const boundsHeight = imageMetrics.renderedHeight;
      if (!boundsWidth || !boundsHeight) return;
      const {
        boxId,
        action,
        startPointerX,
        startPointerY,
        initialLeft,
        initialTop,
        initialWidth,
        initialHeight,
      } = dragSession;

      updateDraftBoxById(boxId, (box) => {
        if (action === "move") {
          const deltaX = currentPointer.x - startPointerX;
          const deltaY = currentPointer.y - startPointerY;
          const nextLeft = clamp(initialLeft + deltaX, 0, boundsWidth - initialWidth);
          const nextTop = clamp(initialTop + deltaY, 0, boundsHeight - initialHeight);
          return {
            ...box,
            left: Math.round(nextLeft),
            top: Math.round(nextTop),
          };
        }

        const startRight = initialLeft + initialWidth;
        const startBottom = initialTop + initialHeight;
        if (action === "nw") {
          const nextLeft = clamp(currentPointer.x, 0, startRight - MIN_BOX_SIZE);
          const nextTop = clamp(currentPointer.y, 0, startBottom - MIN_BOX_SIZE);
          return {
            ...box,
            left: Math.round(nextLeft),
            top: Math.round(nextTop),
            width: Math.round(startRight - nextLeft),
            height: Math.round(startBottom - nextTop),
          };
        }
        if (action === "ne") {
          const nextRight = clamp(currentPointer.x, initialLeft + MIN_BOX_SIZE, boundsWidth);
          const nextTop = clamp(currentPointer.y, 0, startBottom - MIN_BOX_SIZE);
          return {
            ...box,
            top: Math.round(nextTop),
            width: Math.round(nextRight - initialLeft),
            height: Math.round(startBottom - nextTop),
          };
        }
        if (action === "sw") {
          const nextLeft = clamp(currentPointer.x, 0, startRight - MIN_BOX_SIZE);
          const nextBottom = clamp(currentPointer.y, initialTop + MIN_BOX_SIZE, boundsHeight);
          return {
            ...box,
            left: Math.round(nextLeft),
            width: Math.round(startRight - nextLeft),
            height: Math.round(nextBottom - initialTop),
          };
        }
        const nextRight = clamp(currentPointer.x, initialLeft + MIN_BOX_SIZE, boundsWidth);
        const nextBottom = clamp(currentPointer.y, initialTop + MIN_BOX_SIZE, boundsHeight);
        return {
          ...box,
          width: Math.round(nextRight - initialLeft),
          height: Math.round(nextBottom - initialTop),
        };
      });
    };

    const handleMouseUp = () => {
      dragSessionRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [imageMetrics.renderedHeight, imageMetrics.renderedWidth]);

  const handleConfirmDraftBox = async (box: DraftSubItemBox) => {
    if (!onConfirmSubItemBox || !imageMetrics.renderedWidth || !imageMetrics.renderedHeight) return;
    const left = clamp(box.left, 0, imageMetrics.renderedWidth);
    const top = clamp(box.top, 0, imageMetrics.renderedHeight);
    const right = clamp(box.left + box.width, 0, imageMetrics.renderedWidth);
    const bottom = clamp(box.top + box.height, 0, imageMetrics.renderedHeight);
    const coordinates: NormalizedCoordinates = {
      x1: toFixedRatio(left / imageMetrics.renderedWidth),
      y1: toFixedRatio(top / imageMetrics.renderedHeight),
      x2: toFixedRatio(right / imageMetrics.renderedWidth),
      y2: toFixedRatio(bottom / imageMetrics.renderedHeight),
    };

    setConfirmingIds((prev) => ({ ...prev, [box.id]: true }));
    const result = await onConfirmSubItemBox(coordinates, box.id);
    setConfirmingIds((prev) => ({ ...prev, [box.id]: false }));
    if (result === false) return;
    removeDraftBox(box.id);
  };

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
      .map((item, index) => {
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
          renderKey: `${id}-${index}-${leftX.toFixed(4)}-${topY.toFixed(4)}-${rightX.toFixed(4)}-${bottomY.toFixed(4)}`,
          left: leftNatural * scaleX,
          top: topNatural * scaleY,
          width: widthNatural * scaleX,
          height: heightNatural * scaleY,
          area: widthNatural * heightNatural,
        };
      })
      .filter(Boolean) as Array<{
        id: number;
        renderKey: string;
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

  const containImageSize = useMemo(() => {
    if (
      !isContainMode ||
      !imageMetrics.naturalWidth ||
      !imageMetrics.naturalHeight ||
      !displayAreaSize.width ||
      !displayAreaSize.height
    ) {
      return null;
    }
    /**
     * contain 模式只允许图片缩小到父容器内部，不能放大或拉伸。
     */
    const scale = Math.min(
      displayAreaSize.width / imageMetrics.naturalWidth,
      displayAreaSize.height / imageMetrics.naturalHeight,
      1,
    );
    return {
      width: imageMetrics.naturalWidth * scale,
      height: imageMetrics.naturalHeight * scale,
    };
  }, [
    displayAreaSize.height,
    displayAreaSize.width,
    imageMetrics.naturalHeight,
    imageMetrics.naturalWidth,
    isContainMode,
  ]);

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
    <div
      ref={displayAreaRef}
      className={`h-full min-h-0 w-full ${isContainMode ? "overflow-hidden p-0" : "overflow-auto p-3"}`}
    >
      <div
        className={
          isContainMode
            ? "flex h-full min-h-0 w-full items-center justify-center"
            : "mx-auto w-fit"
        }
      >
        <div className={isContainMode ? "max-h-full max-w-full" : ""}>
          <div
            ref={overlayContainerRef}
            className={isContainMode ? "relative inline-block max-h-full max-w-full" : "relative inline-block"}
            onMouseDown={() => setSelectedDraftBoxId(null)}
          >
            <img
              key={imageUrl}
              ref={imageRef}
              src={imageUrl}
              alt="Schedule Evidence"
              className={`block object-contain ${
                renderAtNaturalSize ? "max-w-none" : "max-w-full"
              } ${isContainMode ? "max-h-full" : "h-auto w-auto"}`}
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
                  : isContainMode && containImageSize
                    ? {
                      width: `${containImageSize.width}px`,
                      height: `${containImageSize.height}px`,
                    }
                    : undefined
              }
            />

            {showBoxes && orderedOverlayRects.map((rect) => {
            const isActive = rect.id === activeItemId;
            return (
              <div
                key={rect.renderKey}
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

            {showBoxes && draftBoxes.map((box) => {
            const isSelected = box.id === selectedDraftBoxId;
            const handleSize = 10;
            /**
             * 默认把操作按钮放在框外右上角；
             * 若会超出图片顶部边界，则改为放在框内右上角，避免按钮被裁切。
             */
            const actionToolbarHeight = 24;
            const actionToolbarMargin = 4;
            const shouldPlaceToolbarInside = box.top < actionToolbarHeight + actionToolbarMargin;
            return (
              <div
                key={box.id}
                className="absolute border"
                style={{
                  left: `${box.left}px`,
                  top: `${box.top}px`,
                  width: `${Math.max(box.width, MIN_BOX_SIZE)}px`,
                  height: `${Math.max(box.height, MIN_BOX_SIZE)}px`,
                  borderColor: NEW_BOX_BORDER_COLOR,
                  backgroundColor: NEW_BOX_BACKGROUND_COLOR,
                  cursor: "move",
                  zIndex: isSelected ? 40 : 30,
                }}
                onMouseDown={(event) => beginDrag(event, box, "move")}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedDraftBoxId(box.id);
                }}
              >
                <div
                  className="absolute flex items-center gap-1 rounded-md bg-white px-1 py-[1px] shadow-sm"
                  style={{
                    right: shouldPlaceToolbarInside ? "0px" : "-4px",
                    top: shouldPlaceToolbarInside ? "0px" : "-24px",
                  }}
                >
                  <button
                    type="button"
                    className="flex h-5 w-5 items-center justify-center rounded border border-primaryN30 bg-forumBlue-normal"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleConfirmDraftBox(box);
                    }}
                    disabled={Boolean(confirmingIds[box.id])}
                  >
                    <CheckOutlined className="text-xs text-white" />
                  </button>
                  <button
                    type="button"
                    className="flex h-5 w-5 items-center justify-center rounded border border-primaryN30 bg-forumBlue-normal"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeDraftBox(box.id);
                    }}
                  >
                    <DeleteOutlined className="text-xs text-white" />
                  </button>
                </div>

                <div
                  className="absolute -left-1 -top-1 rounded-full border"
                  style={{
                    width: `${handleSize}px`,
                    height: `${handleSize}px`,
                    cursor: "nwse-resize",
                    borderColor: HANDLE_BORDER_COLOR,
                    backgroundColor: HANDLE_BACKGROUND_COLOR,
                  }}
                  onMouseDown={(event) => beginDrag(event, box, "nw")}
                />
                <div
                  className="absolute -right-1 -top-1 rounded-full border"
                  style={{
                    width: `${handleSize}px`,
                    height: `${handleSize}px`,
                    cursor: "nesw-resize",
                    borderColor: HANDLE_BORDER_COLOR,
                    backgroundColor: HANDLE_BACKGROUND_COLOR,
                  }}
                  onMouseDown={(event) => beginDrag(event, box, "ne")}
                />
                <div
                  className="absolute -bottom-1 -left-1 rounded-full border"
                  style={{
                    width: `${handleSize}px`,
                    height: `${handleSize}px`,
                    cursor: "nesw-resize",
                    borderColor: HANDLE_BORDER_COLOR,
                    backgroundColor: HANDLE_BACKGROUND_COLOR,
                  }}
                  onMouseDown={(event) => beginDrag(event, box, "sw")}
                />
                <div
                  className="absolute -bottom-1 -right-1 rounded-full border"
                  style={{
                    width: `${handleSize}px`,
                    height: `${handleSize}px`,
                    cursor: "nwse-resize",
                    borderColor: HANDLE_BORDER_COLOR,
                    backgroundColor: HANDLE_BACKGROUND_COLOR,
                  }}
                  onMouseDown={(event) => beginDrag(event, box, "se")}
                />
              </div>
            );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ScheduleEvidenceImage;
