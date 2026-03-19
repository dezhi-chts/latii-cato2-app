"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { Stage, Layer, Group, Path, Circle } from "react-konva";
import {
  Form,
  Modal,
  notification,
  Input,
  Select,
  Tooltip,
  Spin,
  Popconfirm,
  Image,
  message,
  Popover,
  InputNumber,
} from "antd";
import {
  LoadingOutlined,
  SyncOutlined,
  PicCenterOutlined,
  ClearOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";

import {
  changeEvidenceType,
  evidenceBatchSubmit,
  evidenceBatchDelete,
  evidenceBatchUpdate,
} from "@/services/evidenceService";

import { rotateChange } from "@/services/projectService";
import { pdfOcrDetect } from "@/services/pdfService";

import { colorList } from "@/theme/colors";

import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

import {
  Point,
  CirclePoint,
  GroupFrame,
  TextContent,
  ViewPort,
  TypeItem,
  EvidenceType,
  FileItem,
  PdfWrapperProps,
  PdfWrapperRefMethods,
  Bounds,
  GroupShapeType,
  GroupType,
  allPageTypes,
  PageType,
  FileOperationType,
} from "../../types/evidence";
import LabelTypesSelect from "./Label-Types-Select";
import EditableSubText from "./EditableSubText";
import { ArchDrawingLabelTypes } from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";

const { confirm } = Modal;

GlobalWorkerOptions.workerSrc = "/assets/js/pdf.worker.min.js";

const getZoneBounds = (polygons: Point[]) => {
  const xs = polygons.map((p) => p.x);
  const ys = polygons.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;
  return { minX, minY, maxX, maxY, width, height };
};

/**
 *
 * @param relativePolygons 相对group的坐标集合
 * @returns circle点集合
 */
const getCriclePoints = (width: number, height: number) => {
  let x = 0;
  let y = 0;
  return [
    { type: "topLeft", x: x, y: y },
    { type: "topRight", x: x + width, y: y },
    { type: "bottomRight", x: x + width, y: y + height },
    { type: "bottomLeft", x: x, y: y + height },
    { type: "top", x: x + width / 2, y: y },
    { type: "right", x: x + width, y: y + height / 2 },
    { type: "bottom", x: x + width / 2, y: y + height },
    { type: "left", x: x, y: y + height / 2 },
  ];
};

const getResizeCursorStyle = (pointType: string) => {
  const cursorMap: Record<string, string> = {
    topLeft: "nwse-resize",
    topRight: "nesw-resize",
    bottomRight: "nwse-resize",
    bottomLeft: "nesw-resize",
    top: "ns-resize",
    right: "ew-resize",
    bottom: "ns-resize",
    left: "ew-resize",
  };
  return cursorMap[pointType] || "default";
};

// 以下的框类型显示 读取按钮
const showReadBtnGroupTypes = [GroupType.OCR];

// 以下的框类型显示 确认按钮
const showConfirmBtnGroupTypes = [GroupType.DrawingIndex, GroupType.TitleInfo];

// 以下的框类型显示 数字按钮
const showNumBtnGroupTypes: GroupType[] = [GroupType.Item, GroupType.WindowDoorUnitList];

// 以下框类型显示  复制按钮集合
const showCopyBtnGroupTypes = [
  GroupType.WindowDoorUnitList,
  GroupType.Item,
  GroupType.LayerInfo,
  GroupType.Description,
];

// 以下框类型显示类型下拉框
const showSelectGroupTypes = [
  GroupType.FloorPlan,
  GroupType.Elevation,
  GroupType.WindowDoorUnit,
  GroupType.Table,
  GroupType.KeyNotes,
];

const PdfWrapper = forwardRef(
  (
    {
      operationMode = "edit",
      project_id,
      project_file_id,
      pdfUrl,
      page,
      zoom,
      allEvidence,
      selectedEvidenceIds,
      typeList,
      pdfOperationType = FileOperationType.ArchitectureDrawing,
      onChangePage,
      onTotalPages,
      onAppendEvidence,
      onDeleteEvidence,
      onUpdateEvidence,
      onCropSectionsCount,
      onUpdateSafeZoom,
      onSuccessOCRText,
    }: PdfWrapperProps,
    ref: any,
  ) => {
    const api = process.env.NEXT_PUBLIC_PROJECTS_API;
    // Canvas maximum size on one side, exceeding this size may cause browser performance issues
    const MAX_CANVAS_SIZE = 8192;

    const pdfCanvas = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const renderTaskRef = useRef<any>(null);
    const loadingTaskRef = useRef<any>(null);
    //  const pdfPageText = useRef<TextContent>({} as TextContent);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

    const pdfDoc = useRef<any>(null);
    const currentViewportRef = useRef<ViewPort | null>(null);

    const [scale, setScale] = useState(1.0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [pageNum, setPageNum] = useState<number>(0);

    const [cropSections, setCropSections] = useState<GroupFrame[]>([]);

    const [stageWidth, setStageWidth] = useState(0);
    const [stageHeight, setStageHeight] = useState(0);

    const [showEvidence, setShowEvidence] = useState<boolean>(true);

    const [isDrawingPolygon, setIsDrawingPolygon] = useState<boolean>(false);

    const [cropMode, setCropMode] = useState<string | null>(null);

    const [isTClicked, setIsTClicked] = useState<boolean>(false);

    const [fullLoading, setFullLoading] = useState(false);

    const [pdfLoading, setPdfLoading] = useState(false);

    const [loadingProgress, setLoadingProgress] = useState(0);

    const [rotate, setRotate] = useState<number>(-1);

    const isAdjustRotateRef = useRef<boolean>(false);

    const dragCtxRef = useRef<
      Record<
        string,
        { minX: number; minY: number; width: number; height: number }
      >
    >({});

    const centerIndexRef = useRef<number>(0);

    const createNewBoxInfo = useRef<any>(null);

    const [pageEvidence, setPageEvidence] = useState<any[]>([]);

    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

    const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null);

    const [ctxMenu, setCtxMenu] = useState<{
      visible: boolean;
      groupId: string;
      stageX: number;
      stageY: number;
    }>({
      visible: false,
      groupId: "",
      stageX: 0,
      stageY: 0,
    });

    useImperativeHandle(
      ref,
      (): PdfWrapperRefMethods => ({
        resetAllInfo,
        getPageAmount,
        addingRect,
        rotatePDF,
        clearCropSections,
        handleBatchSubmit,
        handleBatchDelete,
        checkAndHandleUnsavedCrops,
      }),
    );

    useEffect(() => {
      if (
        pdfDoc.current &&
        page > 0 &&
        page <= totalPages &&
        page !== pageNum
      ) {
        resetInfoByPageNum();
        setPageNum(page);
      }
    }, [page, totalPages, pageNum]);

    useEffect(() => {
      if (zoom) {
        setShowEvidence(false);
        setScale(zoom);
      }
    }, [zoom]);

    useEffect(() => {
      if (pdfCanvas.current) {
        const ctx = pdfCanvas.current.getContext("2d");
        if (ctx) {
          ctxRef.current = ctx;
        } else {
          console.error("Failed to get canvas context");
        }
      }
    }, []);

    // 加载PDF文档
    useEffect(() => {
      if (!pdfUrl || pdfUrl.trim().length === 0) return;
      loadPdf(pdfUrl);

      // 组件卸载时取消加载任务
      return () => {
        if (loadingTaskRef.current) {
          try {
            loadingTaskRef.current.destroy();
          } catch (error) {
            console.error("Error destroying loading task:", error);
          }
        }
      };
    }, [pdfUrl]);

    // 监听裁剪区域数量变化
    useEffect(() => {
      onCropSectionsCount?.(cropSections.length);
    }, [cropSections.length]);

    const loadPdf = async (pdfUrl: string) => {
      if (!pdfUrl || pdfUrl.trim().length === 0) return;

      // 先取消之前的加载任务
      if (loadingTaskRef.current) {
        try {
          loadingTaskRef.current.destroy();
        } catch (error) {
          console.error("Error destroying previous loading task:", error);
        }
      }

      setPdfLoading(true);
      resetLoadingProgress();
      const loadingTask = getDocument({
        url: pdfUrl,

        disableStream: false,
        disableAutoFetch: false,
        rangeChunkSize: 256 * 1024,
        withCredentials: false,
        cMapPacked: true,
      });

      // 保存加载任务引用
      loadingTaskRef.current = loadingTask;

      loadingTask.onProgress = (progress: any) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        setLoadingProgress(percent);
      };

      loadingTask.promise
        .then(async (pdf: any) => {
          pdfDoc.current = pdf;
          setTotalPages(pdf.numPages);
          onTotalPages?.(pdf.numPages);

          const targetPage = page > 0 && page <= pdf.numPages ? page : 1;
          setPageNum(targetPage);
          setPdfLoading(false);
          // 加载成功后清空引用
          loadingTaskRef.current = null;
        })
        .catch((error) => {
          console.error("Failed to load PDF:", error.message);
          setPdfLoading(false);
          if (error.message !== "Worker was destroyed") {
            notification.error({
              message: "Error",
              description: error.message,
            });
          }

          // 加载失败后取消任务并清空引用
          if (loadingTaskRef.current) {
            try {
              loadingTaskRef.current.destroy();
            } catch (destroyError) {
              console.error(
                "Error destroying failed loading task:",
                destroyError,
              );
            }
            loadingTaskRef.current = null;
          }
        });
    };

    const handleBatchSubmit = async () => {
      const filteredCropSections = cropSections.filter(
        (section) => section.bounds.width !== 0 && section.bounds.height !== 0,
      );
      if (filteredCropSections.length === 0) {
        message.warning("No evidence to submit.");
        return;
      }

      confirm({
        title: "Batch Submit",
        content: "Are you sure to submit all evidences?",
        okText: "Yes",
        cancelText: "No",
        okButtonProps: {
          loading: false,
        },
        onOk: () => {
          batchSubmit({ showAlert: true });
        },
      });
    };

    const handleBatchDelete = async () => {
      if (pageEvidence.length === 0) {
        message.warning("No evidence to delete.");
        return;
      }
      confirm({
        title: "Batch Delete",
        content: "Are you sure to delete page evidences?",
        okText: "Yes",
        cancelText: "No",
        okButtonProps: {
          loading: false,
        },
        onOk: async () => {
          let deleteIds = pageEvidence.map((item) => item.id);
          batchDelete(deleteIds);
          // 如果当前有未保存的裁剪区域，则一并删除
          setCropSections([]);
        },
      });
    };

    const batchSubmit = ({
      showAlert = true,
      groupId = null, //根据id查找查找并保存group
      groupInfo = null, // 根据group信息直接保存group
      showLoading = true,
      addActiveShape = false, //是否保存完成后，自动添加选中功能
    }: {
      showAlert?: boolean;
      groupId?: string | null;
      groupInfo?: GroupFrame | null;
      showLoading?: boolean;
      addActiveShape?: boolean; //是否保存完成后，自动添加选中功能
    }): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!currentViewportRef.current) {
          reject(new Error("Viewport not found"));
          return;
        }

        const viewport = currentViewportRef.current;

        if (showLoading) {
          setFullLoading(true);
        }

        let filteredCropSections = cropSections.filter(
          (section) =>
            section.bounds.width !== 0 && section.bounds.height !== 0,
        );

        // 如果存在groupId，则单独提交该group，不存在则提交所有group
        if (groupId) {
          let section = filteredCropSections.find(
            (item) => item.id === groupId,
          );
          if (!section) {
            reject(new Error("Group not found"));
            return;
          }
          filteredCropSections = [section];
        } else if (groupInfo) {
          filteredCropSections = [groupInfo];
        }

        const uploadData = filteredCropSections.map((section: GroupFrame) => {
          let rotateAngle: number = (viewport as any).rotation ?? 0;
          return {
            project_id: project_id,
            project_file_id: project_file_id,
            project_file_page_number: page,
            polygon: JSON.stringify(section.pdfPolygons),
            device_pixel_ratio: window.devicePixelRatio || 1,
            type: section.type,
            scale: viewport.scale,
            page_width_pdf: viewport.width,
            page_height_pdf: viewport.height,
            view_box: JSON.stringify(viewport.viewBox),
            is_rotate: rotateAngle !== 0,
            rotation_angle: rotateAngle,
            sub_text: section.sub_text ?? "",
          };
        });

        evidenceBatchSubmit(uploadData)
          .then((res) => {
            if (showLoading) {
              setFullLoading(false);
            }
            if (res.status === "success") {
              setCropSections(() => []);
              if (showAlert) {
                notification.success({
                  message: "Success",
                  description: "Evidence submit successfully.",
                });
              }

              onAppendEvidence && onAppendEvidence(res.data);
              // 如果需要添加选中功能，则添加
              if (addActiveShape) {
                if (res?.data?.evidences?.length === 1) {
                  setSelectedShapeId(res?.data?.evidences?.[0]?.id);
                }
              }
              resolve("success");
            } else {
              reject(new Error("Evidence submit failed"));
            }
          })
          .catch((error) => {
            if (showLoading) {
              setFullLoading(false);
            }
            console.error("Error submitting evidence:", error);
            notification.error({
              message: "Error",
              description: "Evidence submit failed.",
            });
            reject(error);
          });
      });
    };

    const evidencSubmit = (groupId: string) => {
      batchSubmit({ showAlert: false, groupId });
    };

    const batchDelete = async (deleteIds?: number[]) => {
      setFullLoading(true);

      const res = await evidenceBatchDelete(deleteIds ?? []);
      if (res.status === "success") {
        notification.success({
          message: "Success",
          description: "Evidence delete successfully.",
        });

        onDeleteEvidence &&
          onDeleteEvidence({ ...res.data, deleteIds: deleteIds ?? [] });
      } else {
        notification.error({
          message: "Error",
          description: "Evidence delete failed.",
        });
      }
      setFullLoading(false);
    };

    const checkAndHandleUnsavedCrops = useCallback(
      async (proceedWithoutConfirmation?: boolean) => {
        const filteredCropSections = cropSections.filter(
          (section) =>
            section.bounds.width !== 0 && section.bounds.height !== 0,
        );
        if (filteredCropSections.length === 0) {
          return Promise.resolve(true);
        }

        return new Promise<boolean>((resolve) => {
          if (proceedWithoutConfirmation) {
            batchSubmit({ showAlert: false })
              .then(() => resolve(true))
              .catch(() => resolve(false));
            return;
          }

          confirm({
            title: (
              <p className="text-forumBlue-normal font-normal text-base">
                Finish with this page?
              </p>
            ),
            content: (
              <p className="text-black font-light text-xs">
                Confirm to save your selected items.
              </p>
            ),
            okText: "Save",
            cancelText: "Cancel",
            okButtonProps: {
              loading: false,
            },
            icon: null,
            onOk() {
              batchSubmit({ showAlert: true })
                .then(() => resolve(true))
                .catch(() => resolve(false));
            },
            onCancel() {
              resolve(false);
            },
          });
        });
      },
      [cropSections],
    );

    const updateEvidence = async (evid: EvidenceType) => {
      let polygonStr = evid.polygon;
      if (typeof polygonStr !== "string") {
        try {
          polygonStr = JSON.stringify(polygonStr);
        } catch (e) {
          console.error("Failed to stringify polygon:", e);
          return;
        }
      }

      if (!currentViewportRef.current) {
        return;
      }

      const viewport = currentViewportRef.current;
      const rotateAngle: number = (viewport as any).rotation ?? 0;

      let data = {
        id: evid.id,
        polygon: polygonStr,
        device_pixel_ratio: window.devicePixelRatio || 1,
        type: evid.type,
        scale: viewport.scale,
        page_width_pdf: viewport.width,
        page_height_pdf: viewport.height,
        view_box: JSON.stringify(viewport.viewBox),
        is_rotate: rotateAngle !== 0,
        rotation_angle: rotateAngle,
        sub_text: evid.sub_text,
      };
      let res = await evidenceBatchUpdate([data]);
      if (res.status === "success") {
        onUpdateEvidence && onUpdateEvidence(res.data);
      } else {
        notification.error({
          message: "Error",
          description:
            "Evidence update failed, please delete and re-add the evidence.",
        });
      }
    };

    const getPageAmount = () => {
      if (!pdfDoc.current) return 0;
      return pdfDoc.current.numPages;
    };

    const resetLoadingProgress = () => {
      setLoadingProgress(0);
    };

    const addingRect = (addingOption: any) => {
      addRectArea(addingOption);
    };

    // 监听当前页码变化, 重新渲染当前页码的内容
    useEffect(() => {
      if (
        !pdfDoc.current ||
        !pdfCanvas.current ||
        !ctxRef.current ||
        pageNum === 0
      )
        return;
      (async () => {
        const page = await pdfDoc.current.getPage(pageNum);
        const pageOriginalRotation = page.rotate;
        let viewPointsOptions = {
          scale,
          rotation: isAdjustRotateRef.current ? rotate : pageOriginalRotation,
        };

        const viewport: ViewPort = page.getViewport(viewPointsOptions);
        console.log("######### viewport", viewport);
        // Limit the canvas size to avoid performance issues
        // if (
        //   viewport.width > MAX_CANVAS_SIZE ||
        //   viewport.height > MAX_CANVAS_SIZE
        // ) {
        //   onUpdateSafeZoom?.(scale);
        //   return;
        // }
        currentViewportRef.current = viewport;

        pdfCanvas.current!.width = viewport.width;
        pdfCanvas.current!.height = viewport.height;

        renderTaskRef.current?.cancel?.();
        const task = page.render({
          canvasContext: ctxRef.current!,
          viewport,
        });
        renderTaskRef.current = task;

        try {
          await task.promise;
          setStageWidth(viewport.width);
          setStageHeight(viewport.height);

          requestAnimationFrame(() => {
            setShowEvidence(true);
          });
          // pdfPageText.current = await page.getTextContent({
          //   normalizeWhitespace: true,
          //   disableCombineTextItems: true,
          // });

          if (currentViewportRef.current && cropSections.length > 0) {
            setCropSections((prev) => {
              return prev.map((group) => {
                if (group.pdfPolygons && group.pdfPolygons.length > 0) {
                  const newPolygons = group.pdfPolygons.map((p) => {
                    const [vx, vy] =
                      currentViewportRef.current!.convertToViewportPoint(
                        p.x,
                        p.y,
                      );
                    return { x: vx, y: vy };
                  });
                  const bounds = getZoneBounds(newPolygons);
                  return {
                    ...group,
                    polygons: newPolygons,
                    bounds,
                  };
                } else if (group.polygons.length > 0) {
                  const pdfPolygons = group.polygons.map((p) => {
                    const [px, py] =
                      currentViewportRef.current!.convertToPdfPoint(p.x, p.y);
                    return { x: px, y: py };
                  });
                  const bounds = getZoneBounds(group.polygons);
                  return {
                    ...group,
                    pdfPolygons: pdfPolygons,
                    bounds,
                  };
                }
                return group;
              });
            });
          }

          // 页面渲染成功后，需要判断是否需要增加一个一样尺寸的框，如果createNewBoxInfo有值，说明需要增加一个框
          if (createNewBoxInfo.current) {
            handlePrevOrNextBox(createNewBoxInfo.current);
          }
        } catch (e: any) {
          if (e?.name !== "RenderingCancelledException") console.error(e);
        }
      })();
      return () => {
        renderTaskRef.current?.cancel?.();
      };
    }, [pageNum, scale, rotate]);

    const resetInfoByPageNum = () => {
      setShowEvidence(false);
      setCropSections((prev) => []);
      setCropMode(null);
    };

    const startDrawing = () => {
      if (cropMode === null && cropSections.length > 0) {
        return;
      }

      if (!pdfDoc.current) {
        notification.warning({
          message: "Warning",
          description: "Please load the PDF file first.",
        });
        return;
      }

      setCropMode("polygon");
      setIsDrawingPolygon(true);
      setCropSections((prev) => [
        {
          id: `group-${Date.now()}`,
          shapeType: GroupShapeType.Polygon,
          type: GroupType.Label,
          completed: false,
          polygons: [],
          pdfPolygons: [],
          bounds: {} as any,
        },
      ]);
    };

    const completeDrawing = () => {
      if (!pdfDoc.current) {
        notification.warning({
          message: "Warning",
          description: "Please load the PDF file first.",
        });
        return;
      }
      setCropMode(null);
      setIsDrawingPolygon(false);

      setCropSections((prev) => {
        const list = [...prev];
        const g = list[0];

        if (g.polygons.length > 0) {
          list[0] = { ...g, completed: true };
        } else {
          list.splice(0, 1);
        }

        return list;
      });
    };

    const clearCropSections = () => {
      setCropSections((prev) => []);
      setIsDrawingPolygon(false);
      setCropMode(null);

      centerIndexRef.current = 0;
    };

    const rotatePDF = useCallback(async () => {
      if (!currentViewportRef.current) {
        return;
      }

      const currentRotate = (currentViewportRef.current as any)?.rotation || 0;
      let nextAngle = (currentRotate + 90) % 360;
      setFullLoading(true);
      try {
        let isRotate = nextAngle > 0 ? true : false;

        let res = await rotateChange(project_file_id, isRotate, nextAngle);
        if (res === "success") {
          clearCropSections();
          isAdjustRotateRef.current = true;
          setRotate(nextAngle);
        }
      } catch (error) {
        console.log("######## rotatePDF error", error);
        notification.error({
          message: "Error",
          description: "Failed to rotate the PDF file.",
        });
      } finally {
        setFullLoading(false);
      }
    }, [project_file_id]);

    const adjustToCenter = (type: "evidence" | "group", shape: any) => {
      const container = scrollRef.current;
      if (!container) return;

      if (!shape) return;
      let polygons: CirclePoint[] = [];

      if (type === "evidence") {
        if (shape?.viewportPolygons?.length === 0) return;
        polygons = shape.viewportPolygons;
      }
      if (type === "group") {
        if (shape?.polygons?.length === 0) return;
        polygons = shape.polygons;
      }

      const { minX, minY, width, height } = getZoneBounds(polygons);
      const centerX = minX + width / 2;
      const centerY = minY + height / 2;

      const viewW = container.clientWidth;
      const viewH = container.clientHeight;

      let targetLeft = centerX - viewW / 2;
      let targetTop = centerY - viewH / 2;

      const maxLeft = Math.max(
        0,
        (stageWidth || container.scrollWidth) - viewW,
      );
      const maxTop = Math.max(
        0,
        (stageHeight || container.scrollHeight) - viewH,
      );
      if (targetLeft < 0) targetLeft = 0;
      else if (targetLeft > maxLeft) targetLeft = maxLeft;
      if (targetTop < 0) targetTop = 0;
      else if (targetTop > maxTop) targetTop = maxTop;

      try {
        container.scrollTo({
          left: Math.round(targetLeft),
          top: Math.round(targetTop),
          behavior: "smooth",
        });
      } catch (error) {
        container.scrollLeft = Math.round(targetLeft);
        container.scrollTop = Math.round(targetTop);
      }
    };

    const stageClick = (e: any) => {
      e.evt.preventDefault();

      const stage = e.target.getStage();

      if (cropMode !== "polygon") {
        return;
      }
      if (!isDrawingPolygon) {
        return;
      }

      const pos = stage?.getPointerPosition() || { x: 0, y: 0 };
      if (cropSections[0].polygons) {
        setCropSections((prev) => {
          const list = [...prev];
          const g = list[0];
          const next = [...g.polygons, pos];

          let newPdfPolygons = g.pdfPolygons ? [...g.pdfPolygons] : [];
          if (currentViewportRef.current) {
            const [px, py] = currentViewportRef.current.convertToPdfPoint(
              pos.x,
              pos.y,
            );
            newPdfPolygons.push({ x: px, y: py });
          }

          const bounds = getZoneBounds(next);

          list[0] = {
            ...g,
            polygons: next,
            pdfPolygons: newPdfPolygons,
            bounds,
          };
          return list;
        });
      }
    };

    const stageMouseDown = (e: any) => {
      e.evt.preventDefault();

      if (e.evt.button !== 0) return;

      if (
        e.target.getClassName() === "Circle" ||
        e.target.getClassName() === "Path"
      ) {
        return;
      }

      if (cropMode === null && e.target.getClassName() === "Stage") {
        handleMouseDown(e.evt);
        return;
      }

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition() || { x: 0, y: 0 };

      if (cropMode === "polygon") return;

      setIsTClicked(true);

      let newGroup: GroupFrame = {
        id: `group-${Date.now()}`,
        type: cropMode as any,
        shapeType: GroupShapeType.Rectangle,
        completed: false,
        polygons: [
          {
            x: pos.x,
            y: pos.y,
          },
        ],

        pdfPolygons: currentViewportRef.current
          ? [
            {
              x: currentViewportRef.current.convertToPdfPoint(
                pos.x,
                pos.y,
              )[0],
              y: currentViewportRef.current.convertToPdfPoint(
                pos.x,
                pos.y,
              )[1],
            },
          ]
          : [],
        bounds: {
          minX: pos.x,
          minY: pos.y,
          width: 0,
          height: 0,
        } as any,
      };
      setCropSections((prev: any) => [newGroup]);
    };

    const stageMouseMove = (e: any) => {
      e.evt.preventDefault();

      if (e.evt.button !== 0) return;

      if (
        e.target.getClassName() === "Circle" ||
        (e.target.getClassName() === "Path" && cropMode === null)
      ) {
        return;
      }

      if (cropMode === null && e.target.getClassName() === "Stage") {
        handleMouseMove(e.evt);
        return;
      }

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition() || { x: 0, y: 0 };

      if (cropMode === "polygon") return;

      if (!isTClicked) return;
      setCropSections((prev: GroupFrame[]) => {
        if (prev?.length === 0) return prev;
        let group: GroupFrame = { ...prev[0] };
        const { x, y } = group.polygons[0];

        const left = Math.min(pos.x, x);
        const top = Math.min(pos.y, y);
        const right = Math.max(pos.x, x);
        const bottom = Math.max(pos.y, y);

        const newPolygons = [
          { x: left, y: top },
          { x: right, y: top },
          { x: right, y: bottom },
          { x: left, y: bottom },
        ];

        let bounds = getZoneBounds(newPolygons);

        let newPdfPolygons: Point[] = [];
        if (currentViewportRef.current) {
          newPdfPolygons = newPolygons.map((p) => {
            const [px, py] = currentViewportRef.current!.convertToPdfPoint(
              p.x,
              p.y,
            );
            return { x: px, y: py };
          });
        }
        return [
          {
            ...group,
            polygons: newPolygons,
            pdfPolygons: newPdfPolygons,
            bounds,
          },
        ];
      });
    };
    const stageMouseUp = (e: any) => {
      e.evt.preventDefault();

      if (e.evt.button !== 0) return;

      if (cropMode === null && e.target.getClassName() === "Stage") {
        handleMouseUp();
        return;
      }

      if (cropMode === "polygon") return;

      setIsTClicked(false);
      setCropSections((prev) => {
        return prev.map((item) => {
          return {
            ...item,
            completed: true,
          };
        });
      });
      setCropMode(null);
    };

    const deleteCrop = (groupId: string) => {
      setCropSections((prev) => {
        let list = prev.filter((g: any) => g.id !== groupId);
        if (list.length === 0) {
          clearCropSections();
        }
        return [...list];
      });
    };

    const insertGroup = (group: GroupFrame) => {
      setCropSections((prev: any) => {
        return [...prev, group];
      });
    };

    const addRectArea = (addingOption: any) => {
      const viewPort = currentViewportRef.current;
      if (!viewPort) return;

      let container = scrollRef.current;
      if (!container) return;

      const pdfWidth = viewPort.width;
      const pdfHeight = viewPort.height;
      let width = Math.min(container.clientWidth, pdfWidth) / 7;
      let height = Math.min(container.clientHeight, pdfHeight) / 4;

      let scrollTop = scrollRef.current?.scrollTop || 0;
      let scrollLeft = scrollRef.current?.scrollLeft || 0;
      const left = 60 + scrollLeft;
      const top = 60 + scrollTop;
      const p1 = { x: left, y: top };
      const p2 = { x: left + width, y: top };
      const p3 = { x: left + width, y: top + height };
      const p4 = { x: left, y: top + height };

      const pdfPoints = viewPort
        ? [
          {
            x: viewPort.convertToPdfPoint(p1.x, p1.y)[0],
            y: viewPort.convertToPdfPoint(p1.x, p1.y)[1],
          },
          {
            x: viewPort.convertToPdfPoint(p2.x, p2.y)[0],
            y: viewPort.convertToPdfPoint(p2.x, p2.y)[1],
          },
          {
            x: viewPort.convertToPdfPoint(p3.x, p3.y)[0],
            y: viewPort.convertToPdfPoint(p3.x, p3.y)[1],
          },
          {
            x: viewPort.convertToPdfPoint(p4.x, p4.y)[0],
            y: viewPort.convertToPdfPoint(p4.x, p4.y)[1],
          },
        ]
        : [];

      const groupFrame = {
        id: `group-${Date.now()}`,
        shapeType: GroupShapeType.Rectangle, //矩形框
        type: addingOption?.type,
        polygons: [p1, p2, p3, p4],
        pdfPolygons: pdfPoints,
        completed: true,
        bounds: getZoneBounds([p1, p2, p3, p4]),
      };

      setCropMode(addingOption.type ?? GroupType.Item);
      insertGroup(groupFrame);

      setCropMode(null);
      if (operationMode !== "view") {
        // 取消默认添加时默认选中
        setSelectedShapeId(groupFrame.id);
      }

      if (addingOption?.isSaveEvidence) {
        // 如果有保存参数，则直接保存成evidence
        batchSubmit({
          showAlert: false,
          groupInfo: groupFrame,
          showLoading: false,
          addActiveShape: true
        })
          .then(() => {
            // 保存成功后，添加默认选中功能

          })
          .catch(() => { });
      }
    };

    const handleCreateBox = (evid: any, type: "center" | "next" | "prev") => {
      if (type === "center") {
        // 在当前框的位置的下方，增加一个一样的宽度的框
        handleCenterBox(evid);
      } else if (type === "next") {
        if (page < totalPages) {
          // 在下一页的头部位置增加一个一样尺寸的框，并且需要将前一页的页面滚动到头部
          createNewBoxInfo.current = {
            type: "next",
            evid: evid,
          };
          onChangePage && onChangePage(page + 1);
        }
      } else if (type === "prev") {
        if (page > 1) {
          // 在上一页的尾部位置增加一个一样尺寸的框，并且需要将后一页的页面滚动到尾部
          createNewBoxInfo.current = {
            type: "prev",
            evid: evid,
          };
          onChangePage && onChangePage(page - 1);
        }
      }
    };

    const handleCenterBox = (evid: any) => {
      // 获取当前框的位置和尺寸，然后在当前框的位置下方，增加一个一样的尺寸的框，但是需要注意，不能超过pdf的页面告诉，如果超过高度，则需要调整框的高度
      if (!currentViewportRef.current) {
        console.log("当前视图信息不存在");
        return;
      }
      const viewPort = currentViewportRef.current;
      const viewportHeight = viewPort.height;
      if (!evid.viewportPolygons || evid.viewportPolygons.length === 0) {
        console.log("当前框没有有效多边形信息");
        return;
      }
      let { minX, minY, maxX, maxY, width, height } = getZoneBounds(
        evid.viewportPolygons,
      );
      let y = minY + height + 30;
      // 检查向下放是否超出视口高度
      if (y + height > viewportHeight) {
        // 尝试向上放
        y = minY - height - 30;
        // 检查向上放是否超出上边界
        if (y < 0) {
          // 上下都放不下，放在视口底部
          y = viewportHeight - height - 30;
        }
      }

      handleAutoCreateEvid(evid, { x: minX, y: y, width, height });
    };

    const handlePrevOrNextBox = (info: {
      evid: any;
      type: "prev" | "next";
    }) => {
      if (!currentViewportRef.current) {
        console.log("当前视图信息不存在");
        return;
      }
      const viewPort = currentViewportRef.current;
      const viewportHeight = viewPort.height;

      const { evid, type } = info;
      if (type === "prev") {
        // 在已经更新的页面尾部位置增加一个一样尺寸的框，并且需要将后一页的页面滚动到尾部，注意不能超过pdf的页面高度
        let { minX, minY, width, height } = getZoneBounds(
          evid.viewportPolygons,
        );
        let y = viewportHeight - height - 10;
        handleAutoCreateEvid(evid, { x: minX, y: y, width, height });
        // 将页面滚动到底部
        const container = scrollRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      } else if (type === "next") {
        // 在已经更新的页面尾部头部增加一个一样尺寸的框
        let { minX, minY, width, height } = getZoneBounds(
          evid.viewportPolygons,
        );
        let y = 0;
        handleAutoCreateEvid(evid, { x: minX, y: y, width, height });
        // 将页面滚动到顶部
        const container = scrollRef.current;
        if (container) {
          container.scrollTop = 0;
        }
      }
    };

    const handleAutoCreateEvid = (
      evid: any,
      bounds: { x: number; y: number; width: number; height: number },
    ) => {
      const viewPort = currentViewportRef.current;
      if (!viewPort) return;

      const { x: minX, y: minY, width, height } = bounds;
      const p1 = { x: minX, y: minY };
      const p2 = { x: minX + width, y: minY };
      const p3 = { x: minX + width, y: minY + height };
      const p4 = { x: minX, y: minY + height };

      const pdfPoints = viewPort
        ? [
          {
            x: viewPort.convertToPdfPoint(p1.x, p1.y)[0],
            y: viewPort.convertToPdfPoint(p1.x, p1.y)[1],
          },
          {
            x: viewPort.convertToPdfPoint(p2.x, p2.y)[0],
            y: viewPort.convertToPdfPoint(p2.x, p2.y)[1],
          },
          {
            x: viewPort.convertToPdfPoint(p3.x, p3.y)[0],
            y: viewPort.convertToPdfPoint(p3.x, p3.y)[1],
          },
          {
            x: viewPort.convertToPdfPoint(p4.x, p4.y)[0],
            y: viewPort.convertToPdfPoint(p4.x, p4.y)[1],
          },
        ]
        : [];

      const groupFrame = {
        id: `group-${Date.now()}`,
        shapeType: GroupShapeType.Rectangle, //矩形框
        type: evid?.type,
        polygons: [p1, p2, p3, p4],
        pdfPolygons: pdfPoints,
        completed: true,
        bounds: getZoneBounds([p1, p2, p3, p4]),
        sub_text: evid.sub_text ?? "",
      };
      // 先手动添加框到临时crop中
      insertGroup(groupFrame);

      // 直接保存成evidence
      batchSubmit({
        showAlert: false,
        groupInfo: groupFrame,
        showLoading: false,
      })
        .then(() => {
          // 保存成功
          createNewBoxInfo.current = null;
        })
        .catch(() => {
          createNewBoxInfo.current = null;
        });
    };

    //生成截图
    const createImage = (groupId: string) => {
      console.log("========== 开始多边形区域裁剪 ==========");

      const canvas = pdfCanvas.current;
      const viewport = currentViewportRef.current;
      if (!canvas) {
        console.log("无法获取画布，请刷新页面重试");
        return null;
      }
      if (!viewport) {
        console.log("无法获取视图信息，请重新加载文档");
        return null;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.log("画布初始化失败，请刷新页面");
        return null;
      }

      //查找目标多边形组
      const targetGroup = cropSections.find(
        (group: any) => group.id === groupId,
      );
      if (!targetGroup) {
        console.log(`未找到指定的区域 ID: ${groupId}`);
        return null;
      }

      //验证多边形有效性
      const polygonPoints = targetGroup.polygons;
      if (!polygonPoints || polygonPoints.length < 3) {
        console.log("无效的区域，多边形至少需要3个点）");
        return null;
      }

      // 使用规范化顺序的多边形点，确保形成闭合边界
      const vpPoints = normalizePolygon(polygonPoints as Point[]);

      //视图参数
      const { width: vpW, height: vpH } = viewport;
      console.log("viewport 尺寸：", { vpW, vpH });

      //直接使用 viewport 点计算边界框（与原始 canvas 像素同一坐标系）
      const minX = Math.min(...vpPoints.map((p) => p.x));
      const minY = Math.min(...vpPoints.map((p) => p.y));
      const maxX = Math.max(...vpPoints.map((p) => p.x));
      const maxY = Math.max(...vpPoints.map((p) => p.y));

      //处理原始 canvas 与 viewport 的像素比例
      const vp2px = canvas.width / viewport.width; //一般为1
      const srcX = Math.round(minX * vp2px);
      const srcY = Math.round(minY * vp2px);
      const srcW = Math.max(1, Math.round((maxX - minX) * vp2px));
      const srcH = Math.max(1, Math.round((maxY - minY) * vp2px));

      console.log("裁剪源区域（canvas 像素）：", {
        srcX,
        srcY,
        srcW,
        srcH,
        vp2px,
      });

      //目标画布尺寸 = 源像素尺寸 / 比例，保证与屏幕可见 1:1
      const outW = Math.max(1, Math.round(srcW / Math.max(1e-6, vp2px)));
      const outH = Math.max(1, Math.round(srcH / Math.max(1e-6, vp2px)));

      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) {
        console.log("无法获取临时Canvas上下文");
        return null;
      }
      tempCanvas.width = outW;
      tempCanvas.height = outH;
      (tempCtx as any).imageSmoothingEnabled = false;

      //clip 路径（以临时画布左上角为原点的局部坐标）
      tempCtx.save();
      tempCtx.beginPath();
      vpPoints.forEach((p, i) => {
        const x = p.x - minX;
        const y = p.y - minY;
        if (i === 0) tempCtx.moveTo(x, y);
        else tempCtx.lineTo(x, y);
      });
      tempCtx.closePath();
      tempCtx.clip();

      //绘制源到目标（不缩放，像素一一对应，视觉一致）
      tempCtx.drawImage(canvas, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
      tempCtx.restore();
      const imageUrl = tempCanvas.toDataURL("image/png");
      tempCanvas.remove();
      console.log("========== 多边形区域裁剪完成 ==========");
      return imageUrl;
    };

    //将base64转换为File对象
    const base64ToFile = (base64String: string, filename = "image.png") => {
      //解析base64头部信息（如data:image/png;base64,）
      const arr = base64String.split(",");
      const mimeMatch = arr[0].match(/:(.*?);/);

      //提取MIME类型（如image/png）
      const mime = mimeMatch ? mimeMatch[1] : "image/png";

      //解码base64数据为二进制
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      //创建File对象（最后一个参数是文件名）
      return new File([u8arr], filename, { type: mime });
    };

    //OCR文本识别
    const OCRRecogize = async (groupId: string) => {
      //生成图片文件
      let imageUrl = createImage(groupId);
      if (!imageUrl) return;

      //转换二进制文件
      const file = base64ToFile(imageUrl, `custom-image-${new Date()}.png`);
      setFullLoading(true);
      const res: any = await pdfOcrDetect(file);
      const { data, status } = res;
      if (status === "success") {
        // 识别成功，调用回调
        onSuccessOCRText && onSuccessOCRText?.(res.data.full_text);
        // 删除当前group
        deleteCrop(groupId);
        notification.success({
          message: "Success",
          description: "OCR recognition successful.",
        });
      } else {
        notification.error({
          message: "Error",
          description: "OCR recognition failed.",
        });
      }
      setFullLoading(false);
    };

    /**
     *
     * @param group 截图区域 | Evidence 区域
     * @param circlePt 圆形点
     * @param absX 绝对坐标x
     * @param absY 绝对坐标y
     * @returns
     */
    const onMoveCircle = (
      shape: GroupFrame | EvidenceType,
      circlePt: CirclePoint,
      absX: number,
      absY: number,
    ): Point[] => {
      const frozen = dragCtxRef.current[shape.id];
      const startMinX = frozen.minX;
      const startMinY = frozen.minY;
      const startRight = startMinX + frozen.width;
      const startBottom = startMinY + frozen.height;

      let px = Math.round(absX);
      let py = Math.round(absY);
      if (px < 0) px = 0;
      else if (px > stageWidth) px = stageWidth;
      if (py < 0) py = 0;
      else if (py > stageHeight) py = stageHeight;

      const minSize = 1;

      let newMinX = startMinX;
      let newMinY = startMinY;
      let newRight = startRight;
      let newBottom = startBottom;

      switch (circlePt.type) {
        case "topLeft": {
          let nx = px,
            ny = py;
          if (nx > startRight - minSize) nx = startRight - minSize;
          if (ny > startBottom - minSize) ny = startBottom - minSize;
          if (nx < 0) nx = 0;
          if (ny < 0) ny = 0;
          newMinX = nx;
          newMinY = ny;
          break;
        }

        case "topRight": {
          let rx = px,
            ny = py;
          if (rx < startMinX + minSize) rx = startMinX + minSize;
          if (ny > startBottom - minSize) ny = startBottom - minSize;
          if (rx > stageWidth) rx = stageWidth;
          if (ny < 0) ny = 0;
          newRight = rx;
          newMinY = ny;
          break;
        }

        case "bottomRight": {
          let rx = px,
            by = py;
          if (rx < startMinX + minSize) rx = startMinX + minSize;
          if (by < startMinY + minSize) by = startMinY + minSize;
          if (rx > stageWidth) rx = stageWidth;
          if (by > stageHeight) by = stageHeight;
          newRight = rx;
          newBottom = by;
          break;
        }

        case "bottomLeft": {
          let lx = px,
            by = py;
          if (lx > startRight - minSize) lx = startRight - minSize;
          if (by < startMinY + minSize) by = startMinY + minSize;
          if (lx < 0) lx = 0;
          if (by > stageHeight) by = stageHeight;
          newMinX = lx;
          newBottom = by;
          break;
        }

        case "top": {
          let ny = py;
          if (ny > startBottom - minSize) ny = startBottom - minSize;
          if (ny < 0) ny = 0;
          newMinY = ny;
          break;
        }

        case "right": {
          let rx = px;
          if (rx < startMinX + minSize) rx = startMinX + minSize;
          if (rx > stageWidth) rx = stageWidth;
          newRight = rx;
          break;
        }

        case "bottom": {
          let by = py;
          if (by < startMinY + minSize) by = startMinY + minSize;
          if (by > stageHeight) by = stageHeight;
          newBottom = by;
          break;
        }

        case "left": {
          let lx = px;
          if (lx > startRight - minSize) lx = startRight - minSize;
          if (lx < 0) lx = 0;
          newMinX = lx;
          break;
        }
        default:
          break;
      }

      const p1 = { x: newMinX, y: newMinY };
      const p2 = { x: newRight, y: newMinY };
      const p3 = { x: newRight, y: newBottom };
      const p4 = { x: newMinX, y: newBottom };
      return [p1, p2, p3, p4];
    };

    const onCircleDragMoveInCrop = (
      group: GroupFrame,
      vertexIndex: number,
      circlePt: CirclePoint,
      stageX: number,
      stageY: number,
    ) => {
      setCropSections((prev) => {
        const list = [...prev];
        const groupIndex = list.findIndex((g: any) => g.id === group.id);
        if (groupIndex < 0) return prev;
        const g = list[groupIndex];
        let pts = [...g.polygons];

        if (g.shapeType === GroupShapeType.Rectangle) {
          // 矩形框
          pts = onMoveCircle(group, circlePt, stageX, stageY);
        } else {
          // 多边形框
          pts[vertexIndex] = {
            x: stageX,
            y: stageY,
          };
        }

        let pdfPts = g.pdfPolygons ? [...g.pdfPolygons] : [];
        if (currentViewportRef.current) {
          if (g.shapeType === GroupShapeType.Rectangle) {
            // 矩形框
            pdfPts = pts.map((p) => {
              const [px, py] = currentViewportRef.current!.convertToPdfPoint(
                p.x,
                p.y,
              );
              return { x: px, y: py };
            });
          } else {
            // 多边形框
            if (pdfPts[vertexIndex]) {
              const [px, py] = currentViewportRef.current.convertToPdfPoint(
                stageX,
                stageY,
              );
              pdfPts[vertexIndex] = { x: px, y: py };
            }
          }
        }

        let bounds = getZoneBounds(pts);

        list[groupIndex] = { ...g, polygons: pts, pdfPolygons: pdfPts, bounds };
        return list;
      });
    };

    const onCircleDragMoveInEvid = (
      evidence: EvidenceType,
      vertexIndex: number,
      circlePt: CirclePoint,
      stageX: number,
      stageY: number,
    ) => {
      setPageEvidence((prev) => {
        const list = [...prev];
        const evidenceIndex = list.findIndex((g: any) => g.id === evidence.id);
        if (evidenceIndex < 0) return prev;
        const evid = list[evidenceIndex];

        let pts = onMoveCircle(evid, circlePt, stageX, stageY);

        let pdfPts: any[] = [];
        try {
          pdfPts =
            typeof evidence.polygon === "string"
              ? JSON.parse(evidence.polygon)
              : [];
        } catch (e) {
          console.error("Failed to parse polygon:", e);
        }

        if (currentViewportRef.current) {
          pdfPts = pts.map((p) => {
            const [px, py] = currentViewportRef.current!.convertToPdfPoint(
              p.x,
              p.y,
            );
            return { x: px, y: py };
          });
        }

        list[evidenceIndex] = {
          ...evid,
          polygon: JSON.stringify(pdfPts),
          viewportPolygons: pts,
        };

        return list;
      });
    };

    const dragCropMoveByOffset = (groupId: string, dx: number, dy: number) => {
      setCropSections((prev: any) => {
        const list = [...prev];
        const index = list.findIndex((g: any) => g.id === groupId);
        if (index < 0) return prev;
        let g = list[index];
        let newPolygons = moveShapeByOffset(g.polygons, dx, dy);
        const finalBounds = getZoneBounds(newPolygons);

        let newPdfPolygons = [...newPolygons];
        if (currentViewportRef.current) {
          newPdfPolygons = newPolygons.map((p: Point) => {
            const [px, py] = currentViewportRef.current!.convertToPdfPoint(
              p.x,
              p.y,
            );
            return { x: px, y: py };
          });
        }
        list[index] = {
          ...g,
          polygons: newPolygons,
          pdfPolygons: newPdfPolygons,
          bounds: finalBounds,
        };
        return list;
      });
    };

    const dragEvidenceMoveByOffset = (
      evidenceId: string,
      dx: number,
      dy: number,
    ) => {
      setPageEvidence((prev: any) => {
        const list = [...prev];
        const index = list.findIndex((g: any) => g.id === evidenceId);
        if (index < 0) return prev;
        let evid = list[index];
        let newPolygons = moveShapeByOffset(evid.viewportPolygons, dx, dy);

        let newPdfPolygons: Point[] = [];
        if (currentViewportRef.current) {
          newPdfPolygons = newPolygons.map((p: Point) => {
            const [px, py] = currentViewportRef.current!.convertToPdfPoint(
              p.x,
              p.y,
            );
            return { x: px, y: py };
          });
        }
        list[index] = {
          ...evid,
          viewportPolygons: newPolygons,
          polygon: JSON.stringify(newPdfPolygons),
        };
        return list;
      });
    };

    const moveShapeByOffset = (polygons: Point[], dx: number, dy: number) => {
      if (!dx && !dy) return polygons;

      let newPolygons = polygons.map((p: any) => ({
        x: p.x + dx,
        y: p.y + dy,
      }));
      let scrollPolygons = [...polygons];

      let adjustedDx = dx;
      let adjustedDy = dy;
      let scrollDx = dx;
      let scrollDy = dy;

      if (scrollRef.current) {
        const containerScrollWidth = stageWidth;
        const containerScrollHeight = stageHeight;
        const gap = 8;

        let bounds = getZoneBounds(newPolygons);

        if (bounds.minX < 0) {
          scrollDx = scrollDx - bounds.minX;
          adjustedDx = scrollDx + gap;
        }

        if (bounds.minX + bounds.width > containerScrollWidth) {
          scrollDx =
            scrollDx - (bounds.minX + bounds.width - containerScrollWidth);
          adjustedDx = scrollDx - gap;
        }

        if (bounds.minY < 0) {
          scrollDy = scrollDy - bounds.minY;
          adjustedDy = scrollDy + gap;
        }

        if (bounds.minY + bounds.height > containerScrollHeight) {
          scrollDy =
            scrollDy - (bounds.minY + bounds.height - containerScrollHeight);
          adjustedDy = scrollDy - gap;
        }

        newPolygons = polygons.map((p: any) => ({
          x: p.x + adjustedDx,
          y: p.y + adjustedDy,
        }));
        scrollPolygons = polygons.map((p: any) => ({
          x: p.x + scrollDx,
          y: p.y + scrollDy,
        }));
      }

      if (scrollRef.current) {
        const container = scrollRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const containerScrollWidth = stageWidth;
        const containerScrollHeight = stageHeight;

        const bounds = getZoneBounds(scrollPolygons);

        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        const immediateScroll = (
          element: HTMLElement,
          targetLeft: number,
          targetTop: number,
        ) => {
          element.scrollLeft = targetLeft;
          element.scrollTop = targetTop;
        };

        let targetScrollLeft = scrollLeft;
        let targetScrollTop = scrollTop;

        if (bounds.minX < scrollLeft) {
          const overflowDistance = Math.max(0, scrollLeft - bounds.minX);

          targetScrollLeft = Math.max(0, scrollLeft - overflowDistance);
        } else if (bounds.minX + bounds.width > scrollLeft + containerWidth) {
          const overflowDistance =
            bounds.minX + bounds.width - (scrollLeft + containerWidth);

          const maxAllowedScroll = Math.max(
            0,
            containerScrollWidth - containerWidth,
          );
          targetScrollLeft = Math.min(
            maxAllowedScroll,
            scrollLeft + overflowDistance,
          );
        }

        if (bounds.minY < scrollTop) {
          const overflowDistance = Math.max(0, scrollTop - bounds.minY);

          targetScrollTop = Math.max(0, scrollTop - overflowDistance);
        } else if (bounds.minY + bounds.height > scrollTop + containerHeight) {
          const overflowDistance =
            bounds.minY + bounds.height - (scrollTop + containerHeight);

          const maxAllowedScroll = Math.max(
            0,
            containerScrollHeight - containerHeight,
          );
          targetScrollTop = Math.min(
            maxAllowedScroll,
            scrollTop + overflowDistance,
          );
        }

        immediateScroll(container, targetScrollLeft, targetScrollTop);
      }
      return newPolygons;
    };

    const normalizePolygon = (points: Point[], epsilon = 0.5): Point[] => {
      if (!points || points.length < 3) return points || [];

      const dedup: Point[] = [];
      for (const p of points) {
        const last = dedup[dedup.length - 1];
        if (!last || Math.hypot(p.x - last.x, p.y - last.y) > epsilon) {
          dedup.push(p);
        }
      }
      if (dedup.length > 1) {
        const first = dedup[0];
        const last = dedup[dedup.length - 1];
        if (Math.hypot(first.x - last.x, first.y - last.y) <= epsilon) {
          dedup.pop();
        }
      }
      if (dedup.length < 3) return dedup;

      const cx = dedup.reduce((s, p) => s + p.x, 0) / dedup.length;
      const cy = dedup.reduce((s, p) => s + p.y, 0) / dedup.length;
      const sorted = dedup
        .slice()
        .sort(
          (a, b) =>
            Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
        );

      const area = sorted.reduce((acc, p, i) => {
        const q = sorted[(i + 1) % sorted.length];
        return acc + (p.x * q.y - q.x * p.y);
      }, 0);
      const clockwise = area > 0 ? sorted.reverse() : sorted;
      return clockwise;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (!scrollRef.current) return;
      if (!isDragging) {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setScrollStart({
          left: scrollRef.current.scrollLeft,
          top: scrollRef.current.scrollTop,
        });
      } else {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        scrollRef.current.scrollLeft = scrollStart.left - dx;
        scrollRef.current.scrollTop = scrollStart.top - dy;
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      if (e.buttons !== 1) {
        setIsDragging(false);
        return;
      }
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      scrollRef.current.scrollLeft = scrollStart.left - dx;
      scrollRef.current.scrollTop = scrollStart.top - dy;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const cleanupPreviousPDF = () => {
      if (pdfDoc.current) {
        pdfDoc.current.destroy();
        pdfDoc.current = null;
      }

      if (ctxRef.current) {
        ctxRef.current.clearRect(
          0,
          0,
          pdfCanvas.current?.width || 0,
          pdfCanvas.current?.height || 0,
        );
      }
    };

    const resetAllInfo = () => {
      cleanupPreviousPDF();
      clearCropSections();
      setShowEvidence(false);
      setPageNum(0);
      isAdjustRotateRef.current = false;
      setRotate(-1);
    };

    useEffect(() => {
      return () => {
        renderTaskRef.current?.cancel?.();

        resetAllInfo();
      };
    }, []);

    const handleNewWindow = () => {
      const winWidth = 800;
      const winHeight = 600;

      const windowFeatures = [
        `width=${window.screen.availWidth}`,
        `height=${window.screen.availHeight}`,
        `left=${Math.round(0)}`,
        `top=${Math.round(0)}`,
        "popup=yes",
        "resizable=yes",
        "toolbar=no",
        "location=yes",
        "menubar=no",
        "noopener=yes",
        "noreferrer=yes",
      ].join(",");

      const newWin = window.open(
        `/evidence/evidence-window?project_id=${project_id}&project_file_id=${project_file_id}`,
        "CenteredFloatingWindow",
        windowFeatures,
      );
    };

    const handleCopyShape = (
      sections: GroupFrame[],
      group: GroupFrame,
      direction: "right" | "bottom",
    ) => {
      let groupObj = sections.find((e: any) => e.id === group.id);
      if (!groupObj) return;

      let gapX = 2;
      let gapY = 2;

      let {
        minX: baseMinX,
        minY: baseMinY,
        maxX: baseMaxX,
        maxY: baseMaxY,
        width: baseWidth,
        height: baseHeight,
      } = groupObj.bounds;

      let maxXRight = baseMaxX;
      let maxYBottom = baseMaxY;

      if (direction === "right") {
        let rightShapes = sections
          .filter((section) => {
            const cropBounds = section.bounds;
            if (cropBounds.minX < baseMinX) return false;

            if (cropBounds.minY > baseMaxY || cropBounds.maxY < baseMinY) {
              return false;
            }
            return true;
          })
          .sort((a, b) => {
            return a.bounds.minX - b.bounds.minX;
          });

        let canPutIndex = -1;
        for (let i = 0; i < rightShapes.length; i++) {
          if (i === rightShapes.length - 1) break;
          const cropBounds = rightShapes[i].bounds;
          const nextCropBounds = rightShapes[i + 1].bounds;
          if (nextCropBounds.minX - cropBounds.maxX > baseWidth + gapX * 2) {
            canPutIndex = i;
            break;
          }
        }

        if (canPutIndex === -1) {
          if (rightShapes.length >= 2) {
            gapX = rightShapes[1].bounds.minX - rightShapes[0].bounds.maxX;
          }
          maxXRight = rightShapes[rightShapes.length - 1].bounds.maxX;
        } else {
          maxXRight = rightShapes[canPutIndex].bounds.maxX;
        }
      } else if (direction === "bottom") {
        let bottomShapes = sections
          .filter((section) => {
            const cropBounds = section.bounds;
            if (cropBounds.minY < baseMinY) return false;

            if (cropBounds.minX > baseMaxX || cropBounds.maxX < baseMinX) {
              return false;
            }
            return true;
          })
          .sort((a, b) => {
            return a.bounds.minY - b.bounds.minY;
          });
        let canPutIndex = -1;
        for (let i = 0; i < bottomShapes.length; i++) {
          if (i === bottomShapes.length - 1) break;
          const cropBounds = bottomShapes[i].bounds;
          const nextCropBounds = bottomShapes[i + 1].bounds;
          if (nextCropBounds.minY - cropBounds.maxY > baseHeight + gapY * 2) {
            canPutIndex = i;
            break;
          }
        }
        if (canPutIndex === -1) {
          if (bottomShapes.length >= 2) {
            gapY = bottomShapes[1].bounds.minY - bottomShapes[0].bounds.maxY;
          }
          maxYBottom = bottomShapes[bottomShapes.length - 1].bounds.maxY;
        } else {
          maxYBottom = bottomShapes[canPutIndex].bounds.maxY;
        }
      }

      let targetLeft = direction === "right" ? maxXRight + gapX : baseMinX;
      let targetTop = direction === "bottom" ? maxYBottom + gapY : baseMinY;

      if (direction === "right") {
        if (maxXRight + gapX + baseWidth > stageWidth - 10) {
          message.error("The shape cannot be placed outside the stage");
          return null;
        }
      } else if (direction === "bottom") {
        if (maxYBottom + gapY + baseHeight > stageHeight - 10) {
          message.error("The shape cannot be placed outside the stage");
          return null;
        }
      }

      const dx = Math.round(targetLeft - baseMinX);
      const dy = Math.round(targetTop - baseMinY);

      const newPolygons = groupObj.polygons.map((polygon: any) => {
        const nx = Math.min(
          Math.max(0, polygon.x + dx),
          Math.max(0, stageWidth),
        );
        const ny = Math.min(
          Math.max(0, polygon.y + dy),
          Math.max(0, stageHeight),
        );
        return {
          x: nx,
          y: ny,
        };
      });

      const bounds = getZoneBounds(newPolygons);

      let vp = currentViewportRef.current;
      let pdfPolygons = newPolygons.map((polygon: any) => {
        let [x, y] = vp?.convertToPdfPoint(polygon.x, polygon.y) || [0, 0];
        return { x, y };
      });

      let crop = {
        id: `group-${Date.now()}-${sections.length + 1}`,
        shapeType: groupObj.shapeType,
        type: groupObj.type,
        completed: true,
        polygons: newPolygons,

        pdfPolygons: pdfPolygons,
        bounds,
      };
      return crop;
    };

    const copyGroupShape = (
      group: GroupFrame,
      direction: "right" | "bottom",
    ) => {
      setCropSections((prev) => {
        let list = [...prev];
        let crop = handleCopyShape(list, group, direction);
        if (!crop) return list;
        return [...list, crop];
      });
    };

    useEffect(() => {
      if (!showEvidence) {
        setPageEvidence([]);
        return;
      }

      const filterPageEvidence = allEvidence.filter(
        (item: any) => item.project_file_page_number === pageNum,
      );

      if (filterPageEvidence.length === 0) {
        setPageEvidence([]);
        return;
      }

      const viewPort = currentViewportRef.current;
      if (!viewPort) return;

      const updatedPageEvidence = filterPageEvidence.map((item: any) => {
        let pdfPolygons = [];
        try {
          if (item.polygon instanceof Array) {
            pdfPolygons = [...item.polygon];
          } else if (typeof item.polygon === "string") {
            pdfPolygons = JSON.parse(item.polygon);
          }

          const viewBox = viewPort.viewBox;
          const offsetX =
            Array.isArray(viewBox) && viewBox.length > 1 ? viewBox[0] : 0;
          const offsetY =
            Array.isArray(viewBox) && viewBox.length > 1 ? viewBox[1] : 0;

          pdfPolygons = pdfPolygons.map((p) => {
            if (!item.is_manual) {
              return {
                x: p.x + offsetX,
                y: p.y + offsetY,
              };
            } else {
              return p;
            }
          });
        } catch (e) {
          console.error("Failed to parse polygon data:", item.polygon);
          return item;
        }

        const viewPoints = Array.isArray(pdfPolygons)
          ? pdfPolygons.map((p: Point) => {
            const [px, py] = viewPort.convertToViewportPoint(p.x, p.y);
            return { x: px, y: py };
          })
          : [];

        return { ...item, viewportPolygons: viewPoints };
      });

      setPageEvidence(updatedPageEvidence);
    }, [showEvidence, pageNum, allEvidence, scale]);

    const itemEvidences = useMemo(() => {
      if (!selectedEvidenceIds || selectedEvidenceIds.length === 0) return [];

      const evid = pageEvidence.filter((item: any) =>
        selectedEvidenceIds.includes(item.id),
      );

      if (evid.length > 0) {
        adjustToCenter("evidence", evid[0]);
      }
      return evid;
    }, [pageEvidence, selectedEvidenceIds]);

    return (
      <div className="w-full h-full flex relative">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-auto"
              style={
                operationMode === "edit"
                  ? {
                    display: "grid",
                    alignItems: "center",
                    justifyItems: "center",
                  }
                  : {}
              }
            >
              <div
                className="border border-x-primaryN30"
                style={{
                  position: "relative",
                  width: (stageWidth + 2) + "px",
                  height: (stageHeight + 2) + "px",
                }}
              >
                <canvas ref={pdfCanvas} />

                {/** Stage层处理图形绘制方面 */}
                <Stage
                  width={stageWidth}
                  height={stageHeight}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    touchAction: "inherit",
                  }}
                  onClick={(e) => {
                    if (e.target === e.target.getStage()) {
                      setSelectedShapeId(null);
                      // 当点击画布时，让所有输入框失去焦点
                      document.activeElement?.blur();
                    }

                    stageClick(e);
                  }}
                  onMouseDown={(e) => {
                    if (ctxMenu.visible && e.evt.button !== 2) {
                      setCtxMenu((prev) => ({ ...prev, visible: false }));
                    }

                    stageMouseDown(e);
                  }}
                  onMouseMove={stageMouseMove}
                  onMouseUp={stageMouseUp}
                >
                  <Layer>
                    {pageEvidence.map((evid) => {
                      return (
                        <ShapeWrapper
                          key={evid.id}
                          operationMode={operationMode}
                          type="evidence"
                          shape={evid}
                          selectedShapeId={selectedShapeId}
                          draggingShapeId={draggingShapeId}
                          itemEvidences={itemEvidences}
                          typeList={typeList}
                          pdfOperationType={pdfOperationType}
                          onDragStart={() => {
                            setDraggingShapeId(evid.id);
                            // 设置新的选中元素
                            setSelectedShapeId(evid.id);
                          }}
                          onDragMove={(x, y) => {
                            dragEvidenceMoveByOffset(evid.id, x, y);
                          }}
                          onDragEnd={() => {
                            setDraggingShapeId(null);
                            setTimeout(() => {
                              const updatedEvid = pageEvidence.find(
                                (item) => item.id === evid.id,
                              );
                              if (updatedEvid) {
                                updateEvidence(updatedEvid);
                              }
                            }, 100);
                          }}
                          onClick={() => {
                            if (operationMode === "view") return;

                            if (selectedShapeId === evid.id) {
                              setSelectedShapeId(null);
                            } else {
                              setSelectedShapeId(evid.id);
                            }
                          }}
                          onCircleDragStart={(e, bounds) => {
                            dragCtxRef.current[evid.id] = bounds;
                          }}
                          onCircleDragMove={(e, info) => {
                            const { circleIndex, circlePt, x, y } = info;
                            onCircleDragMoveInEvid(
                              evid,
                              circleIndex,
                              circlePt,
                              x,
                              y,
                            );
                          }}
                          onCircleDragEnd={() => {
                            delete dragCtxRef.current[evid.id];
                            setTimeout(() => {
                              const updatedEvid = pageEvidence.find(
                                (item) => item.id === evid.id,
                              );
                              if (updatedEvid) {
                                updateEvidence(updatedEvid);
                              }
                            }, 100);
                          }}
                        ></ShapeWrapper>
                      );
                    })}
                    {cropSections.map((crop: any, index: number) => {
                      return (
                        <ShapeWrapper
                          key={crop.id}
                          operationMode={operationMode}
                          type="crop"
                          shape={crop}
                          selectedShapeId={selectedShapeId}
                          draggingShapeId={draggingShapeId}
                          itemEvidences={itemEvidences}
                          typeList={typeList}
                          pdfOperationType={pdfOperationType}
                          onDragStart={() => {
                            setDraggingShapeId(crop.id);
                            // 设置新的选中元素
                            setSelectedShapeId(crop.id);
                          }}
                          onDragMove={(x, y) => {
                            dragCropMoveByOffset(crop.id, x, y);
                          }}
                          onDragEnd={() => {
                            setDraggingShapeId(null);
                          }}
                          onClick={() => {
                            if (selectedShapeId === crop.id) {
                              setSelectedShapeId(null);
                            } else {
                              setSelectedShapeId(crop.id);
                            }
                          }}
                          onCircleDragStart={(e, bounds) => {
                            dragCtxRef.current[crop.id] = bounds;
                          }}
                          onCircleDragMove={(e, info) => {
                            const { circleIndex, circlePt, x, y } = info;
                            onCircleDragMoveInCrop(
                              crop,
                              circleIndex,
                              circlePt,
                              x,
                              y,
                            );
                          }}
                          onCircleDragEnd={(e, info) => {
                            delete dragCtxRef.current[crop.id];
                          }}
                        ></ShapeWrapper>
                      );
                    })}
                  </Layer>
                </Stage>

                {/** 处理Evidence按钮的相关显示  */}
                {pageEvidence.map((item: any, index: number) => {
                  if (operationMode === "view") {
                    return null;
                  }

                  if (
                    !item.viewportPolygons ||
                    item.viewportPolygons.length === 0
                  ) {
                    return null;
                  }
                  let { minX, minY, maxX, maxY, width, height } = getZoneBounds(
                    item.viewportPolygons,
                  );

                  let type = item.type ?? "";
                  let color: string = colorList['forumBlue-normal'];

                  // 是否显示复制按钮框
                  let showCopyBtn = false;
                  // 是否显示类型选择下拉框
                  let showSelectGroup = false;
                  // 是否显示左上角的按钮
                  let showNumBtn = false;

                  if (showSelectGroupTypes.includes(type) && pdfOperationType === FileOperationType.ArchitectureDrawing) {
                    // ArchDrawing 文件类型，并且框的类型需要按照颜色来显示
                    showSelectGroup = true;
                    color = allPageTypes[type as keyof typeof allPageTypes]?.color ?? colorList['forumBlue-normal'];
                  } else if (pdfOperationType === FileOperationType.Quote) {
                    showNumBtn = true;
                    // Quote文件类型，需要按照boxTypeList中的type来显示颜色，并且需要显示复制按钮
                    if (type === GroupType.WindowDoorUnitList) {
                      type = GroupType.Item;
                    }
                    let findType = typeList?.find(
                      (box: any) => box.name === type,
                    );
                    if (findType) {
                      showCopyBtn = true;
                      color = findType.color || colorList['forumBlue-normal'];
                    }
                  }

                  return (
                    <div
                      key={item.id}
                      className={`absolute`}
                      style={{
                        left: minX,
                        top: minY,
                      }}
                    >
                      {showNumBtn && (
                        <EditableSubText
                          value={item.sub_text ?? ""}
                          color={color}
                          onChange={(value: string) => {
                            if (value.trim() !== "") {
                              updateEvidence({
                                ...item,
                                sub_text: value,
                              });
                            }
                          }}
                        />
                      )}
                      <div
                        className="absolute flex flex-row items-center"
                        style={{
                          left: showSelectGroup
                            ? width - 68
                            : width - 22,
                          top: 4,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {showSelectGroup && (
                            <LabelTypesSelect
                              typeList={ArchDrawingLabelTypes as any}
                              selectedType={type}
                              onChangeType={async (type) => {
                                if (type === item.type) return;
                                setFullLoading(true);
                                await updateEvidence({ ...item, type });
                                setFullLoading(false);
                              }}
                            />
                          )}
                          <Popconfirm
                            title="Are you sure you want to delete this evidence?"
                            onConfirm={() => batchDelete([item.id])}
                          >
                            <div className="h-[20px] px-[2px] bg-white rounded-full cursor-pointer shadow-md">
                              <Image
                                src="/assets/icons/delete-dark.svg"
                                alt="delete icon"
                                width={15}
                                height={15}
                                preview={false}
                              />
                            </div>
                          </Popconfirm>
                        </div>
                      </div>
                      {/*showCopyBtnGroupTypes.includes(type)*/ showCopyBtn && (
                        <div
                          className="transition-all"
                          style={{
                            position: "absolute",
                            left: width / 2 - 50 + "px",
                            top:
                              maxY > stageHeight - 10
                                ? height - 30 + "px"
                                : height + 2 + "px",
                          }}
                        >
                          <div className="flex justify-center items-center gap-1">
                            <Popover
                              placement="bottom"
                              title={null}
                              content={
                                <div className="text-xs text-grey-normal">
                                  Extend to Previous Page
                                </div>
                              }
                              trigger="hover"
                            >
                              <div
                                className="w-[30px] h-[20px] flex justify-center items-center text-white rounded-tl-md rounded-bl-md cursor-pointer"
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                  handleCreateBox(item, "prev");
                                }}
                              >
                                <span className="-mt-[2px] text-xs">{"<"}</span>
                              </div>
                            </Popover>

                            <div
                              className="w-[28px] h-[20px] flex justify-center items-center text-white cursor-pointer"
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                handleCreateBox(item, "center");
                              }}
                            >
                              <Image
                                src="/assets/icons/layers-linked.svg"
                                alt="layers-linked icon"
                                width={15}
                                height={15}
                                preview={false}
                              ></Image>
                            </div>

                            <Popover
                              placement="bottom"
                              title={null}
                              content={
                                <div className="text-xs text-grey-normal">
                                  Extend to Next Page
                                </div>
                              }
                              trigger="hover"
                            >
                              <div
                                className="w-[30px] h-[20px] flex justify-center items-center text-white rounded-tr-md rounded-br-md cursor-pointer"
                                style={{ backgroundColor: color }}
                                onClick={() => {
                                  handleCreateBox(item, "next");
                                }}
                              >
                                <span className="-mt-[2px] text-xs">{">"}</span>
                              </div>
                            </Popover>

                            <div
                              className="w-[20px] h-[20px] flex justify-center items-center text-white rounded-full cursor-pointer"
                              style={{ backgroundColor: color }}
                              onClick={() => { }}
                            >
                              <Popover
                                placement="rightBottom"
                                title={
                                  <div className="text-xs font-medium">
                                    Chain Link
                                  </div>
                                }
                                content={
                                  <div className="w-[300px] text-xs text-grey-normal">
                                    Create Linked Box Create a new box linked to
                                    this item.
                                    <ul className="ml-3 list-disc">
                                      <li>
                                        Use the{" "}
                                        <span className="text-black font-medium">
                                          Center button
                                        </span>{" "}
                                        to create a box on the current page.
                                      </li>
                                      <li>
                                        Use the{" "}
                                        <span className="text-black font-medium">
                                          Previous or Next buttons
                                        </span>{" "}
                                        to create a linked box with this same
                                        label on the adjacent pages.
                                      </li>
                                    </ul>
                                  </div>
                                }
                                trigger="hover"
                              >
                                <Image
                                  src="/assets/icons/info-white.svg"
                                  alt="plus icon"
                                  width={12}
                                  height={12}
                                  preview={false}
                                ></Image>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/** 处理图形绘制的按钮相关显示  */}
                {cropSections.map((group: GroupFrame) => {
                  if (!group.completed) {
                    return null;
                  }
                  if (group.polygons.length === 0) {
                    return null;
                  }
                  const { minX, minY, maxX, maxY, width, height } =
                    group.bounds;
                  let color: string =
                    allPageTypes[group.type as keyof typeof allPageTypes]
                      ?.color ?? colorList["forumBlue-normal"];
                  return (
                    <div
                      key={group.id}
                      style={{
                        position: "absolute",
                        left: minX,
                        top: minY,
                      }}
                    >
                      <div
                        className="absolute flex flex-row items-center gap-1"
                        style={{
                          left: showReadBtnGroupTypes.includes(group.type)
                            ? width - 110
                            : showConfirmBtnGroupTypes.includes(group.type)
                              ? width - 90
                              : width - 22,
                          top: 4,
                        }}
                      >
                        {showReadBtnGroupTypes.includes(group.type) && (
                          <div
                            className="w-[84px] py-[2px] font-light text-white text-xxs text-center bg-forumBlue-normal rounded-xl whitespace-nowrap cursor-pointer"
                            onClick={() => {
                              // 转换成图片进行OCR识别
                              OCRRecogize(group.id);
                            }}
                          >
                            Read Content
                          </div>
                        )}

                        {showConfirmBtnGroupTypes.includes(group.type) && (
                          <div
                            className="w-[64px] py-[2px] font-light text-white text-xxs text-center bg-forumBlue-normal rounded-lg whitespace-nowrap cursor-pointer"
                            onClick={() => {
                              evidencSubmit(group.id);
                            }}
                          >
                            Confirm
                          </div>
                        )}

                        <div
                          className="h-[20px] px-[2px] bg-white rounded-full cursor-pointer shadow-md"
                          onClick={() => {
                            deleteCrop(group.id);
                          }}
                        >
                          <Image
                            src="/assets/icons/delete-dark.svg"
                            alt="delete icon"
                            width={15}
                            height={15}
                            preview={false}
                          />
                        </div>
                      </div>
                      {/* <div
                        className="transition-all"
                        style={{
                          position: "absolute",
                          left:
                            maxX > stageWidth - 30
                              ? width - 30 + "px"
                              : maxX - minX + 6 + "px",
                          top: height / 2 - 10 + "px",
                          display:
                            selectedShapeId === group.id ? "block" : "none",
                        }}
                      >
                        <div
                          className={`w-[20px] h-[20px]  flex justify-center items-center text-white rounded-full cursor-pointer`}
                          style={{
                            backgroundColor: color,
                          }}
                          onClick={() => {
                            copyGroupShape(group, "right");
                          }}
                        >
                          <span className="">+</span>
                        </div>
                      </div>
                      <div
                        className="transition-all"
                        style={{
                          position: "absolute",
                          left: width / 2 - 10 + "px",
                          top:
                            maxY > stageHeight - 10
                              ? height - 30 + "px"
                              : height + 6 + "px",
                          display:
                            selectedShapeId === group.id ? "block" : "none",
                        }}
                      >
                        <div
                          className={`w-[20px] h-[20px] flex justify-center items-center text-white rounded-full cursor-pointer`}
                          style={{
                            backgroundColor: color,
                          }}
                          onClick={() => {
                            copyGroupShape(group, "bottom");
                          }}
                        >
                          <span className="inline-block">+</span>
                        </div>
                      </div> */}
                    </div>
                  );
                })}
              </div>
            </div>
            {pdfLoading && (
              <div className="absolute inset-0 z-[999] w-[100%] h-[100%] flex flex-col justify-center items-center bg-white/80">
                <div className="w-[300px] mb-4">
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-0 bg-blue-500 rounded-full animate-pulse transition-all duration-300 ease-out"
                      style={{
                        width: `${loadingProgress}%`,
                        transform: "translateX(-50%) scaleX(1.5)",
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-blue-400 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-center text-gray-700 font-medium">
                    File Loading... {loadingProgress}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {fullLoading && (
          <Spin
            fullscreen
            size="large"
            indicator={<LoadingOutlined spin />}
            className="text-white"
            delay={150}
            tip={<p className="animate-pulse text-xl">Loading...</p>}
          />
        )}
      </div>
    );
  },
);

const ShapeWrapper = ({
  operationMode,
  type,
  shape,
  selectedShapeId,
  draggingShapeId,
  itemEvidences,
  typeList,
  pdfOperationType,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClick,
  onCircleDragStart,
  onCircleDragMove,
  onCircleDragEnd,
}: {
  operationMode: "edit" | "view";
  type: "crop" | "evidence";
  shape: GroupFrame | EvidenceType;
  selectedShapeId: string | null;
  draggingShapeId: string | null;
  itemEvidences: EvidenceType[] | null;
  typeList?: any[];
  pdfOperationType: FileOperationType;
  onDragStart: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: () => void;
  onClick: () => void;
  onCircleDragStart: (e: any, bounds: any) => void;
  onCircleDragMove: (e: any, info: any) => void;
  onCircleDragEnd: (e: any, info: any) => void;
}) => {
  let color: string = colorList["forumBlue-normal"];
  let polygons: Point[] = [];
  let bounds: any = {};
  let circlePoints: CirclePoint[] = [];

  if (type === "crop") {
    polygons = (shape as GroupFrame).polygons;
    bounds = (shape as GroupFrame).bounds;
  } else if (type === "evidence") {
    polygons = (shape as EvidenceType)?.viewportPolygons || [];
    bounds = getZoneBounds((shape as EvidenceType)?.viewportPolygons ?? []);
  }

  if (polygons.length === 0) {
    return null;
  }

  if (Object.keys(bounds).length === 0) {
    return null;
  }

  const { minX, minY, width, height } = bounds;

  const relativePolygons = polygons.map((p) => ({
    x: p.x - minX,
    y: p.y - minY,
  }));

  let pathData =
    [
      `M ${relativePolygons[0].x} ${relativePolygons[0].y}`,
      ...relativePolygons.slice(1).map((p) => `L ${p.x} ${p.y}`),
    ].join(" ") + "Z";

  if (type === "evidence") {
    let evidType = shape.type ?? "";
    if (showSelectGroupTypes.includes(evidType as any) && pdfOperationType === FileOperationType.ArchitectureDrawing) {
      // ArchDrawing 文件类型，并且框的类型需要按照颜色来显示
      color = allPageTypes[evidType as keyof typeof allPageTypes]?.color ?? colorList['forumBlue-normal'];
    } else if (pdfOperationType === FileOperationType.Quote) {
      // Quote文件类型，需要按照boxTypeList中的type来显示颜色，并且需要显示复制按钮
      if (evidType === GroupType.WindowDoorUnitList) {
        evidType = GroupType.Item;
      }
      let findType = typeList?.find(
        (box: any) => box.name === evidType,
      );
      if (findType) {
        color = findType.color || colorList['forumBlue-normal'];
      }
    }
  }

  if (draggingShapeId === shape.id) {
    color = "#FF4500";
  }

  if (selectedShapeId === shape.id) {
    circlePoints = getCriclePoints(width, height);
  }

  return (
    <Group key={shape.id} x={minX} y={minY}>
      {/** 填充区域  */}
      <Path
        data={pathData}
        fill={color + "30"}
        stroke={color}
        strokeWidth={1}
        draggable={operationMode === "edit"}
        dragDistance={2}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage && operationMode === "edit") {
            stage.container().style.cursor = "move";
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage && operationMode === "edit") {
            stage.container().style.cursor = "default";
          }
        }}
        onDragStart={(e) => {
          e.cancelBubble = true;
          onDragStart?.();
        }}
        onDragMove={(e) => {
          e.cancelBubble = true;
          const n = e.target;
          const { x, y } = n.position();
          if (x || y) {
            onDragMove?.(x, y);
          }

          n.position({ x: 0, y: 0 });
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          onDragEnd?.();
          const n = e.target;
          n.position({ x: 0, y: 0 });
        }}
        onClick={(e) => {
          e.cancelBubble = true;
          onClick?.();
        }}
      />

      {circlePoints.map((circlePt, circleIndex) => (
        <Circle
          key={`${shape.id}-v-${circleIndex}`}
          x={circlePt.x}
          y={circlePt.y}
          radius={4}
          fill="#fff"
          stroke="#1677ff"
          strokeWidth={2}
          draggable
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) {
              const cursorStyle = getResizeCursorStyle(circlePt.type);
              stage.container().style.cursor = cursorStyle;
            }
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage();
            if (stage) {
              stage.container().style.cursor = "default";
            }
          }}
          onDragStart={(e) => {
            e.cancelBubble = true;
            onCircleDragStart(e, bounds);
          }}
          onDragMove={(e) => {
            e.cancelBubble = true;
            const stage = e.target.getStage();
            const p = stage?.getPointerPosition();
            if (!p) return;
            e.target.position({ x: circlePt.x, y: circlePt.y });
            onCircleDragMove(e, {
              shape,
              circleIndex,
              circlePt,
              x: p.x,
              y: p.y,
            });
          }}
          onDragEnd={(e) => {
            e.cancelBubble = true;
            onCircleDragEnd(e, {
              shape,
              circleIndex,
            });
          }}
          dragBoundFunc={(pos) => ({
            x: Math.round(circlePt.x),
            y: Math.round(circlePt.y),
          })}
        />
      ))}
    </Group>
  );
};

PdfWrapper.displayName = "PdfWrapper";
export default PdfWrapper;
