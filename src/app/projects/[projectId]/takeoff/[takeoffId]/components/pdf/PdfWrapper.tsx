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
import { Stage, Layer, Group, Path, Circle, Rect, Text } from "react-konva";
import {
	Form,
	Modal,
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
	EditOutlined,
	DeleteOutlined,
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
	itemBoxType,
	ArchDrawingItemLabelTypes,
} from "../../types/evidence";
import LabelTypesSelect from "./Label-Types-Select";
import EditableSubText from "./EditableSubText";
import { ArchDrawingLabelTypes } from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";

const { confirm } = Modal;

GlobalWorkerOptions.workerSrc = "/assets/js/pdf.worker.min.js";
import { notify } from "@/utils/notify";

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
const showDrawingIndexGroupTypes = [GroupType.DrawingIndex, GroupType.TitleInfo];

// 以下的框类型显示 数字按钮
const showNumBtnGroupTypes: GroupType[] = [
	GroupType.Item,
	GroupType.WindowDoorUnitList,
];

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

// 以下的框类型显示 确认按钮
const showConfirmBtnGroupTypes = [...showDrawingIndexGroupTypes, ...showSelectGroupTypes];

const itemBoxTypes = [
	itemBoxType.FloorPlanItem,
	itemBoxType.ElevationItem,
	itemBoxType.TableItem,
	itemBoxType.WindowDoorUnitItem,
	itemBoxType.WindowDoorUnitListItem,
];

const showItemConfirmBtnTypes = ['Floor Plan Item', 'Elevation Item'];

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
			evidenceDraggable = true,
			showAddBtnOnBox = false,
			onChangePage,
			onTotalPages,
			onAppendEvidence,
			onDeleteEvidence,
			onUpdateEvidence,
			onCropSectionsCount,
			onUpdateSafeZoom,
			onSuccessOCRText,
			onItemEvidenceConfirm,
			onChangeSelectedEvidence,
			onChangeZoom,
			enableAreaSelection = false,
			onAreaSelectionAction,
		}: PdfWrapperProps,
		ref: any,
	) => {
		const api = process.env.NEXT_PUBLIC_PROJECTS_API;
		// Canvas maximum size on one side, exceeding this size may cause browser performance issues
		const MAX_CANVAS_SIZE = 8192;

		const pdfCanvas = useRef<HTMLCanvasElement>(null);
		const pdfContentRef = useRef<HTMLDivElement>(null);
		const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
		const renderTaskRef = useRef<any>(null);
		const loadingTaskRef = useRef<any>(null);
		//  const pdfPageText = useRef<TextContent>({} as TextContent);
		const MIN_SCALE = 0.5;
		const MAX_SCALE = 3;
		const AUTO_FIT_MIN_SCALE = 0.1;
		const AUTO_FIT_PADDING = 0;
		const WHEEL_ZOOM_STEP = 0.1;
		const AREA_SELECT_MIN_SIZE = 10;

		const scrollRef = useRef<HTMLDivElement>(null);
		const [isDragging, setIsDragging] = useState(false);
		const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
		const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });
		// 区域框选专用状态，避免与原有拖拽/绘制逻辑混用
		const [isAreaSelectMode, setIsAreaSelectMode] = useState(false);
		const [isAreaSelecting, setIsAreaSelecting] = useState(false);
		const [areaSelectStart, setAreaSelectStart] = useState<Point | null>(null);
		const [areaSelectRect, setAreaSelectRect] = useState<Bounds | null>(null);
		const [savedAreaSelectPdfRect, setSavedAreaSelectPdfRect] =
			useState<Bounds | null>(null);
		const [showSavedAreaSelectRect, setShowSavedAreaSelectRect] =
			useState<boolean>(false);
		const suppressStageClickRef = useRef(false);

		const pdfDoc = useRef<any>(null);
		const currentViewportRef = useRef<ViewPort | null>(null);
		const lastCenteredEvidenceIdRef = useRef<string | number | null>(null);

		const [scale, setScale] = useState(1.0);
		const [totalPages, setTotalPages] = useState<number>(0);
		const [pageNum, setPageNum] = useState<number>(0);

		const [cropSections, setCropSections] = useState<GroupFrame[]>([]);

		const [stageWidth, setStageWidth] = useState(0);
		const [stageHeight, setStageHeight] = useState(0);
		const [initialContainerSize, setInitialContainerSize] = useState({
			width: 0,
			height: 0,
		});
		const zoomModifierPressedRef = useRef(false);
		const zoomAnchorRef = useRef<{
			pdfX: number;
			pdfY: number;
			mouseX: number;
			mouseY: number;
			targetScale: number;
		} | null>(null);
		const shouldAutoFitPageRef = useRef(true);
		const minZoomScaleRef = useRef(MIN_SCALE);
		const autoFitAppliedAtRef = useRef(0);

		const [showEvidence, setShowEvidence] = useState<boolean>(true);

		const [isDrawingPolygon, setIsDrawingPolygon] = useState<boolean>(false);

		const [cropMode, setCropMode] = useState<string | null>(null);

		const [isTClicked, setIsTClicked] = useState<boolean>(false);

		const [fullLoading, setFullLoading] = useState(false);

		const [pdfLoading, setPdfLoading] = useState(false);

		const [loadingProgress, setLoadingProgress] = useState(0);

		const [isRendering, setIsRendering] = useState(false);

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

		const clearAreaSelection = () => {
			setSavedAreaSelectPdfRect(null);
			setAreaSelectRect(null);
			setAreaSelectStart(null);
			setIsAreaSelecting(false);
			setIsAreaSelectMode(false);
			setShowSavedAreaSelectRect(false);
			onChangeSelectedEvidence?.([]);
			setSelectedShapeId(null);
		};

		useEffect(() => {
			if (!enableAreaSelection) {
				clearAreaSelection();
			}
		}, [enableAreaSelection]);

		useImperativeHandle(
			ref,
			(): PdfWrapperRefMethods => ({
				resetAllInfo,
				getPageAmount,
				addingRect,
				rotatePDF,
				clearCropSections,
				removeCropSectionByIds,
				handleBatchSubmit,
				handleBatchDelete,
				checkAndHandleUnsavedCrops,
				getRevertCropSectionsData,
				clearAreaSelection,
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
				shouldAutoFitPageRef.current = true;
				setPageNum(page);
			}
		}, [page, totalPages, pageNum]);

		useEffect(() => {
			if (typeof zoom === "number" && Number.isFinite(zoom)) {
				const nextZoom = Number(zoom.toFixed(2));
				// Guard against stale parent zoom echoing back right after auto-fit.
				if (
					Date.now() - autoFitAppliedAtRef.current < 500 &&
					Math.abs(nextZoom - minZoomScaleRef.current) > 0.001
				) {
					return;
				}
				if (Math.abs(nextZoom - scale) <= 0.001) return;
				setShowEvidence(false);
				setScale(nextZoom);
			}
		}, [zoom, scale]);

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

		useEffect(() => {
			let rafId = 0;
			const measureOnce = () => {
				const container = scrollRef.current;
				if (!container) return;
				const width = container.clientWidth;
				const height = container.clientHeight;
				if (width > 0 && height > 0) {
					setInitialContainerSize({ width, height });
				}
			};
			rafId = requestAnimationFrame(measureOnce);
			return () => {
				if (rafId) cancelAnimationFrame(rafId);
			};
		}, []);

		useEffect(() => {
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
			};
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
					shouldAutoFitPageRef.current = true;
					setPageNum(targetPage);
					setPdfLoading(false);
					// 加载成功后清空引用
					loadingTaskRef.current = null;
				})
				.catch((error) => {
					console.error("Failed to load PDF:", error.message);
					setPdfLoading(false);
					if (error.message !== "Worker was destroyed") {
						notify.error({
							title: "Error",
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

		const handleBatchDelete = async (isDeleteParentEvidence = true) => {
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
					let evidenceList = [...pageEvidence];
					if (!isDeleteParentEvidence) {
						// 不删除父证据，只删除子证据
						evidenceList = evidenceList.filter((item) => !item.isParentEvidence && !item.isOtherParentEvidence);
					}
					let deleteIds = evidenceList.map((item) => item.id);
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
							removeCropSectionByIds(filteredCropSections.map((item) => item.id));
							if (showAlert) {
								notify.success({
									title: "Success",
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
						notify.error({
							title: "Error",
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
				notify.success({
					title: "Success",
					description: "Evidence delete successfully.",
				});

				onDeleteEvidence &&
					onDeleteEvidence({ ...res.data, deleteIds: deleteIds ?? [] });
			} else {
				notify.error({
					title: "Error",
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
						cancelText: "Skip",
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
							resolve(true);
						},
					});
				});
			},
			[cropSections],
		);

		const getRevertCropSectionsData = useCallback(() => {
			let list = cropSections.filter(
				(section) => section.bounds.width !== 0 && section.bounds.height !== 0,
			);
			if (list!.length === 0 || !currentViewportRef.current) {
				return [];
			}

			const viewport = currentViewportRef.current;

			const uploadData = list.map((section: GroupFrame) => {
				let rotateAngle: number = (viewport as any).rotation ?? 0;
				return {
					groupId: section.id,
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
					sub_text: "",
				};
			});
			return uploadData;
		}, [cropSections]);

		const updateEvidence = async (operationType: string, evid: EvidenceType) => {
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

			let updateData: any = { ...evid };

			switch (operationType) {
				case 'drag':
				// 拖动更新位置
				case 'resize': {
					// 缩放更新位置
					updateData.device_pixel_ratio = window.devicePixelRatio || 1;
					updateData.polygon = polygonStr;
					updateData.view_box = JSON.stringify(viewport.viewBox);
				}
					updateData.scale = viewport.scale;
					updateData.is_rotate = rotateAngle !== 0;
					updateData.rotation_angle = rotateAngle;
					updateData.page_width_pdf = viewport.width;
					updateData.page_height_pdf = viewport.height;
					break;
				case 'changeSubText': {
					// 修改子文本
					updateData.sub_text = evid.sub_text;
				}
					break;
				case 'changeType': {
					// 修改类型
					updateData.type = evid.type;
				}
					break;
				default:
					break;
			}

			let res = await evidenceBatchUpdate([updateData]);
			if (res.status === "success") {
				onUpdateEvidence && onUpdateEvidence(res.data);
			} else {
				notify.error({
					title: "Error",
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
				setIsRendering(true);
				const page = await pdfDoc.current.getPage(pageNum);
				const pageOriginalRotation = page.rotate;
				const targetRotation = isAdjustRotateRef.current ? rotate : pageOriginalRotation;
				const shouldAutoFit = shouldAutoFitPageRef.current;
				const container = scrollRef.current;
				let fitScale: number | null = null;
				if (container) {
					// 计算自动缩放的基准宽度和高度
					const fitBaseWidth =
						initialContainerSize.width > 0
							? initialContainerSize.width
							: container.clientWidth;
					const fitBaseHeight =
						initialContainerSize.height > 0
							? initialContainerSize.height
							: container.clientHeight;
					const availableWidth = fitBaseWidth - AUTO_FIT_PADDING;
					const availableHeight = fitBaseHeight - AUTO_FIT_PADDING;
					if (availableWidth > 0 && availableHeight > 0) {
						// 计算自动缩放比例
						const baseViewport: ViewPort = page.getViewport({
							scale: 1,
							rotation: targetRotation,
						});
						const rawFitScale = Math.min(
							availableWidth / baseViewport.width,
							availableHeight / baseViewport.height,
						);
						// 限制缩放比例在最小和最大值之间
						fitScale = Number(
							Math.min(
								MAX_SCALE,
								Math.max(AUTO_FIT_MIN_SCALE, rawFitScale),
							).toFixed(2),
						);
						minZoomScaleRef.current = fitScale;
					}
				}
				if (shouldAutoFit) {
					// 自动缩放
					if (!fitScale || !Number.isFinite(fitScale)) {
						setIsRendering(false);
						return;
					}
					if (Math.abs(fitScale - scale) > 0.001) {
						// 自动缩放比例与当前缩放比例差异大于0.001, 则应用自动缩放比例
						setShowEvidence(false);
						autoFitAppliedAtRef.current = Date.now();
						setScale(fitScale);
						onChangeZoom?.(fitScale);
						setIsRendering(false);
						return;
					}
					shouldAutoFitPageRef.current = false;
				}

				let viewPointsOptions = {
					scale,
					rotation: targetRotation,
				};

				const viewport: ViewPort = page.getViewport(viewPointsOptions);
				console.log("#########  pageNum", pageNum, " viewport", viewport);
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
				} finally {
					setIsRendering(false);
				}
			})();
			return () => {
				renderTaskRef.current?.cancel?.();
			};
		}, [pageNum, scale, rotate, initialContainerSize.width, initialContainerSize.height]);

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
				notify.warning({
					title: "Warning",
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
				notify.warning({
					title: "Warning",
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

		const removeCropSectionByIds = (ids: string[]) => {
			setCropSections((prev) => prev.filter((item) => !ids.includes(item.id)));
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
				notify.error({
					title: "Error",
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

		const convertViewportBoundsToPdfBounds = (bounds: Bounds): Bounds | null => {
			const viewport = currentViewportRef.current;
			if (!viewport) {
				return null;
			}
			const corners = [
				{ x: bounds.minX, y: bounds.minY },
				{ x: bounds.maxX, y: bounds.minY },
				{ x: bounds.maxX, y: bounds.maxY },
				{ x: bounds.minX, y: bounds.maxY },
			];
			const pdfPoints = corners.map((point) => {
				const [x, y] = viewport.convertToPdfPoint(point.x, point.y);
				return { x, y };
			});
			return getZoneBounds(pdfPoints);
		};

		const convertPdfBoundsToViewportBounds = (bounds: Bounds): Bounds | null => {
			const viewport = currentViewportRef.current;
			if (!viewport) {
				return null;
			}
			const corners = [
				{ x: bounds.minX, y: bounds.minY },
				{ x: bounds.maxX, y: bounds.minY },
				{ x: bounds.maxX, y: bounds.maxY },
				{ x: bounds.minX, y: bounds.maxY },
			];
			const viewportPoints = corners.map((point) => {
				const [x, y] = viewport.convertToViewportPoint(point.x, point.y);
				return { x, y };
			});
			return getZoneBounds(viewportPoints);
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

			const stage = e.target.getStage();
			const isStageTarget = e.target === stage;
			const pointer = stage?.getPointerPosition() || { x: 0, y: 0 };

			// Shift + 左键进入区域框选模式，不影响原有拖动画布与绘制逻辑
			if (
				enableAreaSelection &&
				operationMode === "edit" &&
				cropMode === null &&
				isStageTarget &&
				(e.evt.shiftKey || isAreaSelectMode)
			) {
				setIsAreaSelectMode(true);
				setIsAreaSelecting(true);
				setAreaSelectStart(pointer);
				setSavedAreaSelectPdfRect(null);
				setShowSavedAreaSelectRect(false);
				setAreaSelectRect({
					minX: pointer.x,
					minY: pointer.y,
					maxX: pointer.x,
					maxY: pointer.y,
					width: 0,
					height: 0,
				});
				return;
			}

			if (cropMode === null && e.target.getClassName() === "Stage") {
				handleMouseDown(e.evt);
				return;
			}

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

			if (isAreaSelecting && areaSelectStart) {
				const stage = e.target.getStage();
				const pos = stage?.getPointerPosition() || areaSelectStart;
				const left = Math.min(areaSelectStart.x, pos.x);
				const top = Math.min(areaSelectStart.y, pos.y);
				const right = Math.max(areaSelectStart.x, pos.x);
				const bottom = Math.max(areaSelectStart.y, pos.y);
				setAreaSelectRect({
					minX: left,
					minY: top,
					maxX: right,
					maxY: bottom,
					width: right - left,
					height: bottom - top,
				});
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

			if (isAreaSelecting) {
				const finalRect = areaSelectRect;
				setIsAreaSelecting(false);
				setIsAreaSelectMode(false);
				setAreaSelectStart(null);
				setAreaSelectRect(null);

				// 防止紧接着触发 stage onClick 时清空选中态
				suppressStageClickRef.current = true;

				if (
					!finalRect ||
					finalRect.width < AREA_SELECT_MIN_SIZE ||
					finalRect.height < AREA_SELECT_MIN_SIZE
				) {
					setSavedAreaSelectPdfRect(null);
					setShowSavedAreaSelectRect(false);
					onChangeSelectedEvidence?.([]);
					setSelectedShapeId(null);
					return;
				}
				const pdfRect = convertViewportBoundsToPdfBounds(finalRect);
				setSavedAreaSelectPdfRect(pdfRect);
				setShowSavedAreaSelectRect(Boolean(pdfRect));

				const intersects = (a: Bounds, b: Bounds) => {
					return !(
						a.maxX < b.minX ||
						a.minX > b.maxX ||
						a.maxY < b.minY ||
						a.minY > b.maxY
					);
				};

				const toBounds = (shape: any): Bounds | null => {
					if (
						shape?.bounds &&
						typeof shape.bounds.minX === "number" &&
						typeof shape.bounds.minY === "number" &&
						typeof shape.bounds.width === "number" &&
						typeof shape.bounds.height === "number"
					) {
						return {
							minX: shape.bounds.minX,
							minY: shape.bounds.minY,
							maxX: shape.bounds.minX + shape.bounds.width,
							maxY: shape.bounds.minY + shape.bounds.height,
							width: shape.bounds.width,
							height: shape.bounds.height,
						};
					}
					if (Array.isArray(shape?.polygons) && shape.polygons.length > 0) {
						const polygonBounds = getZoneBounds(shape.polygons);
						return {
							minX: polygonBounds.minX,
							minY: polygonBounds.minY,
							maxX: polygonBounds.maxX,
							maxY: polygonBounds.maxY,
							width: polygonBounds.width,
							height: polygonBounds.height,
						};
					}
					return null;
				};

				const selectedIds = pageEvidence
					.filter((shape) => {
						const bounds = toBounds(shape);
						return bounds ? intersects(finalRect, bounds) : false;
					})
					.map((shape) => shape.id);

				onChangeSelectedEvidence?.(selectedIds);
				if (selectedIds.length === 1) {
					setSelectedShapeId(selectedIds[0]);
				} else {
					setSelectedShapeId(null);
				}
				return;
			}

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
					addActiveShape: true,
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
				notify.success({
					title: "Success",
					description: "OCR recognition successful.",
				});
			} else {
				notify.error({
					title: "Error",
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
			// let scrollPolygons = [...polygons];

			// let adjustedDx = dx;
			// let adjustedDy = dy;
			// let scrollDx = dx;
			// let scrollDy = dy;

			// if (scrollRef.current) {
			// 	const containerScrollWidth = stageWidth;
			// 	const containerScrollHeight = stageHeight;
			// 	const gap = 8;

			// 	let bounds = getZoneBounds(newPolygons);

			// 	if (bounds.minX < 0) {
			// 		scrollDx = scrollDx - bounds.minX;
			// 		adjustedDx = scrollDx + gap;
			// 	}

			// 	if (bounds.minX + bounds.width > containerScrollWidth) {
			// 		scrollDx =
			// 			scrollDx - (bounds.minX + bounds.width - containerScrollWidth);
			// 		adjustedDx = scrollDx - gap;
			// 	}

			// 	if (bounds.minY < 0) {
			// 		scrollDy = scrollDy - bounds.minY;
			// 		adjustedDy = scrollDy + gap;
			// 	}

			// 	if (bounds.minY + bounds.height > containerScrollHeight) {
			// 		scrollDy =
			// 			scrollDy - (bounds.minY + bounds.height - containerScrollHeight);
			// 		adjustedDy = scrollDy - gap;
			// 	}

			// 	newPolygons = polygons.map((p: any) => ({
			// 		x: p.x + adjustedDx,
			// 		y: p.y + adjustedDy,
			// 	}));
			// 	scrollPolygons = polygons.map((p: any) => ({
			// 		x: p.x + scrollDx,
			// 		y: p.y + scrollDy,
			// 	}));
			// }

			// if (scrollRef.current) {
			// 	const container = scrollRef.current;
			// 	const containerWidth = container.clientWidth;
			// 	const containerHeight = container.clientHeight;
			// 	const containerScrollWidth = stageWidth;
			// 	const containerScrollHeight = stageHeight;

			// 	const bounds = getZoneBounds(scrollPolygons);

			// 	const scrollLeft = container.scrollLeft;
			// 	const scrollTop = container.scrollTop;

			// 	const immediateScroll = (
			// 		element: HTMLElement,
			// 		targetLeft: number,
			// 		targetTop: number,
			// 	) => {
			// 		element.scrollLeft = targetLeft;
			// 		element.scrollTop = targetTop;
			// 	};

			// 	let targetScrollLeft = scrollLeft;
			// 	let targetScrollTop = scrollTop;

			// 	if (bounds.minX < scrollLeft) {
			// 		const overflowDistance = Math.max(0, scrollLeft - bounds.minX);

			// 		targetScrollLeft = Math.max(0, scrollLeft - overflowDistance);
			// 	} else if (bounds.minX + bounds.width > scrollLeft + containerWidth) {
			// 		const overflowDistance =
			// 			bounds.minX + bounds.width - (scrollLeft + containerWidth);

			// 		const maxAllowedScroll = Math.max(
			// 			0,
			// 			containerScrollWidth - containerWidth,
			// 		);
			// 		targetScrollLeft = Math.min(
			// 			maxAllowedScroll,
			// 			scrollLeft + overflowDistance,
			// 		);
			// 	}

			// 	if (bounds.minY < scrollTop) {
			// 		const overflowDistance = Math.max(0, scrollTop - bounds.minY);

			// 		targetScrollTop = Math.max(0, scrollTop - overflowDistance);
			// 	} else if (bounds.minY + bounds.height > scrollTop + containerHeight) {
			// 		const overflowDistance =
			// 			bounds.minY + bounds.height - (scrollTop + containerHeight);

			// 		const maxAllowedScroll = Math.max(
			// 			0,
			// 			containerScrollHeight - containerHeight,
			// 		);
			// 		targetScrollTop = Math.min(
			// 			maxAllowedScroll,
			// 			scrollTop + overflowDistance,
			// 		);
			// 	}

			// 	immediateScroll(container, targetScrollLeft, targetScrollTop);
			// }
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

		const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
			const modifierActive = zoomModifierPressedRef.current;
			if (!modifierActive || (!e.ctrlKey && !e.metaKey)) return;
			const container = scrollRef.current;
			const contentEl = pdfContentRef.current;
			const viewport = currentViewportRef.current;
			if (!container || !contentEl || !viewport) return;
			if (e.nativeEvent.cancelable) {
				e.preventDefault();
			}
			e.stopPropagation();
			const containerRect = container.getBoundingClientRect();
			const contentRect = contentEl.getBoundingClientRect();
			const mouseX = e.clientX - containerRect.left;
			const mouseY = e.clientY - containerRect.top;

			const direction = e.deltaY < 0 ? 1 : -1;
			const prevScale = Number(scale.toFixed(2));
			const dynamicMinScale = Number(
				Math.max(AUTO_FIT_MIN_SCALE, minZoomScaleRef.current || MIN_SCALE).toFixed(2),
			);
			const next = Math.min(
				MAX_SCALE,
				Math.max(dynamicMinScale, scale + direction * WHEEL_ZOOM_STEP),
			);
			const nextScale = Number(next.toFixed(2));
			onUpdateSafeZoom?.(nextScale);
			if (nextScale === prevScale) {
				return;
			}

			const viewX = e.clientX - contentRect.left;
			const viewY = e.clientY - contentRect.top;
			const [pdfX, pdfY] = viewport.convertToPdfPoint(viewX, viewY);
			zoomAnchorRef.current = {
				pdfX,
				pdfY,
				mouseX,
				mouseY,
				targetScale: nextScale,
			};

			setShowEvidence(false);
			setScale(nextScale);
			onChangeZoom?.(nextScale);
		};

		useEffect(() => {
			const anchor = zoomAnchorRef.current;
			const container = scrollRef.current;
			const contentEl = pdfContentRef.current;
			const viewport = currentViewportRef.current;
			if (!anchor || !container || !contentEl || !viewport || isRendering) return;
			if (Math.abs((viewport.scale ?? 0) - anchor.targetScale) > 0.001) return;

			requestAnimationFrame(() => {
				const latestContainer = scrollRef.current;
				const latestContent = pdfContentRef.current;
				const latestViewport = currentViewportRef.current;
				const latestAnchor = zoomAnchorRef.current;
				if (
					!latestContainer ||
					!latestContent ||
					!latestViewport ||
					!latestAnchor
				) {
					return;
				}
				if (
					Math.abs((latestViewport.scale ?? 0) - latestAnchor.targetScale) >
					0.001
				) {
					return;
				}

				const [nextViewX, nextViewY] = latestViewport.convertToViewportPoint(
					latestAnchor.pdfX,
					latestAnchor.pdfY,
				);
				if (!Number.isFinite(nextViewX) || !Number.isFinite(nextViewY)) {
					zoomAnchorRef.current = null;
					return;
				}

				const latestContainerRect = latestContainer.getBoundingClientRect();
				const latestContentRect = latestContent.getBoundingClientRect();
				const currentScreenX =
					latestContentRect.left - latestContainerRect.left + nextViewX;
				const currentScreenY =
					latestContentRect.top - latestContainerRect.top + nextViewY;
				let targetLeft =
					latestContainer.scrollLeft + (currentScreenX - latestAnchor.mouseX);
				let targetTop =
					latestContainer.scrollTop + (currentScreenY - latestAnchor.mouseY);

				const maxLeft = Math.max(
					0,
					latestContainer.scrollWidth - latestContainer.clientWidth,
				);
				const maxTop = Math.max(
					0,
					latestContainer.scrollHeight - latestContainer.clientHeight,
				);
				targetLeft = Math.max(0, Math.min(targetLeft, maxLeft));
				targetTop = Math.max(0, Math.min(targetTop, maxTop));

				latestContainer.scrollLeft = Math.round(targetLeft);
				latestContainer.scrollTop = Math.round(targetTop);
				zoomAnchorRef.current = null;
			});
		}, [scale, stageWidth, stageHeight, isRendering]);

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

			let gapX = 20;
			let gapY = 20;

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
				shapeType: GroupShapeType.Rectangle,
				type: groupObj.type,
				completed: true,
				polygons: newPolygons,
				pdfPolygons: pdfPolygons,
				bounds,
			};
			return crop;
		};

		const copyGroupShape = useCallback((
			type: string, //类型 group || evidence
			group: GroupFrame,
			direction: "right" | "bottom",
		) => {
			let groupFrame: any = { ...group };
			if (type === 'evidence') {
				if (groupFrame?.viewportPolygons?.length > 0) {
					groupFrame.polygons = groupFrame.viewportPolygons;
					groupFrame.bounds = getZoneBounds(groupFrame.viewportPolygons);
				}
			}

			let pageEvidenceList: any = [];
			pageEvidence.forEach((item: any) => {
				if (item?.viewportPolygons?.length > 0) {
					item.polygons = item.viewportPolygons;
					item.bounds = getZoneBounds(item.viewportPolygons);
					if (item.isParentEvidence || item.isOtherParentEvidence) {
					} else {
						pageEvidenceList.push(item);
					}
				}
			});

			setCropSections((prev) => {
				let AllList = [...prev, ...pageEvidenceList]; // evidence框和自定义group框的集合
				let crop = handleCopyShape(AllList, groupFrame, direction);
				if (!crop) return prev;
				return [...prev, crop];
			});
		}, [cropSections, pageEvidence]);

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
						Array.isArray(viewBox) && viewBox.length > 1 ? Number(viewBox[0]) : 0;
					const offsetY =
						Array.isArray(viewBox) && viewBox.length > 1 ? Number(viewBox[1]) : 0;
					const hasValidViewBox =
						Array.isArray(viewBox) &&
						viewBox.length >= 4 &&
						viewBox.every((v: any) => Number.isFinite(Number(v)));

					// 解析 evidence 自身存储的 view_box（可能是 string 或 array）
					let evidenceViewBox: number[] | null = null;
					if (Array.isArray(item?.view_box)) {
						evidenceViewBox = item.view_box.map((v: any) => Number(v));
					} else if (typeof item?.view_box === "string") {
						try {
							const parsedViewBox = JSON.parse(item.view_box);
							if (Array.isArray(parsedViewBox)) {
								evidenceViewBox = parsedViewBox.map((v: any) => Number(v));
							}
						} catch (_) {
							// view_box 解析失败，下面会走 fallback
						}
					}
					const hasValidEvidenceViewBox =
						Array.isArray(evidenceViewBox) &&
						evidenceViewBox.length >= 4 &&
						evidenceViewBox.every((v) => Number.isFinite(v));
					let shouldApplyViewBoxOffset = false;
					if (hasValidEvidenceViewBox && hasValidViewBox) {
						const normalizedEvidenceViewBox = evidenceViewBox as number[];
						shouldApplyViewBoxOffset = normalizedEvidenceViewBox
							.slice(0, 4)
							.some((value, index) => Number(value) !== Number(viewBox[index]));
					}

					pdfPolygons = Array.isArray(pdfPolygons)
						? pdfPolygons.map((p: any) => {
							if (shouldApplyViewBoxOffset) {
								return {
									x: Number(p?.x) + offsetX,
									y: Number(p?.y) + offsetY,
								};
							}
							return p;
						})
						: [];
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

		const centerEvidence = useMemo(() => {
			if (!selectedEvidenceIds || selectedEvidenceIds.length === 0) {
				lastCenteredEvidenceIdRef.current = null;
				return null;
			}

			const evid = pageEvidence.filter((item: any) =>
				selectedEvidenceIds.includes(item.id),
			);
			const nextCenterEvidence = evid?.[0] ?? null;
			if (!nextCenterEvidence) {
				return null;
			}

			const nextCenterEvidenceId = nextCenterEvidence.id;
			if (
				nextCenterEvidenceId !== lastCenteredEvidenceIdRef.current
			) {
				// 如果居中的evidenceId发生了变化，则设置新的evidence居中
				adjustToCenter("evidence", nextCenterEvidence);
				lastCenteredEvidenceIdRef.current = nextCenterEvidenceId;
			}
			return nextCenterEvidence;
		}, [pageEvidence, selectedEvidenceIds, draggingShapeId]);

		const savedAreaSelectRect = useMemo(() => {
			if (!savedAreaSelectPdfRect || !showSavedAreaSelectRect) {
				return null;
			}
			return convertPdfBoundsToViewportBounds(savedAreaSelectPdfRect);
		}, [
			savedAreaSelectPdfRect,
			showSavedAreaSelectRect,
			pageNum,
			scale,
			rotate,
			stageWidth,
			stageHeight,
		]);

		const visibleAreaSelectRect = enableAreaSelection
			? areaSelectRect || savedAreaSelectRect
			: null;
		// Unified overlay button scaling rule:
		// - scale in [0.5, 1]: shrink proportionally
		// - scale > 1: keep original size
		// With 20x20 base buttons and min scale 0.5, visual min is 10x10.
		const overlayControlScale = Math.min(1, Math.max(0.5, scale));
		const getControlScaleForBox = useCallback(
			(boxWidth: number, boxHeight: number) => {
				// If either side is large enough, keep original-size controls.
				// This avoids tiny controls on long-wide rectangles.
				return boxWidth > 60 || boxHeight > 60 ? 1 : overlayControlScale;
			},
			[overlayControlScale],
		);

		const getEvidenceIdsByAreaRect = useCallback(
			(targetRect: Bounds | null) => {
				if (!targetRect) {
					return [];
				}
				const intersects = (a: Bounds, b: Bounds) => {
					return !(
						a.maxX < b.minX ||
						a.minX > b.maxX ||
						a.maxY < b.minY ||
						a.minY > b.maxY
					);
				};
				const toViewportBounds = (shape: any): Bounds | null => {
					if (
						Array.isArray(shape?.viewportPolygons) &&
						shape.viewportPolygons.length > 0
					) {
						const box = getZoneBounds(shape.viewportPolygons);
						return {
							minX: box.minX,
							minY: box.minY,
							maxX: box.maxX,
							maxY: box.maxY,
							width: box.width,
							height: box.height,
						};
					}
					if (
						shape?.bounds &&
						typeof shape.bounds.minX === "number" &&
						typeof shape.bounds.minY === "number" &&
						typeof shape.bounds.width === "number" &&
						typeof shape.bounds.height === "number"
					) {
						return {
							minX: shape.bounds.minX,
							minY: shape.bounds.minY,
							maxX: shape.bounds.minX + shape.bounds.width,
							maxY: shape.bounds.minY + shape.bounds.height,
							width: shape.bounds.width,
							height: shape.bounds.height,
						};
					}
					if (Array.isArray(shape?.polygons) && shape.polygons.length > 0) {
						const box = getZoneBounds(shape.polygons);
						return {
							minX: box.minX,
							minY: box.minY,
							maxX: box.maxX,
							maxY: box.maxY,
							width: box.width,
							height: box.height,
						};
					}
					return null;
				};
				return pageEvidence
					.filter((shape) => {
						if (shape.isParentEvidence || shape.isOtherParentEvidence) return false;
						const shapeBounds = toViewportBounds(shape);
						return shapeBounds ? intersects(targetRect, shapeBounds) : false;
					})
					.map((shape) => shape.id);
			},
			[pageEvidence],
		);

		const handleAreaSelectionOperation = useCallback(
			(action: "edit" | "delete") => {
				const currentRect = savedAreaSelectRect || areaSelectRect;
				const evidenceIds = getEvidenceIdsByAreaRect(currentRect);
				onAreaSelectionAction?.({
					action,
					evidenceIds,
				});
				if (action === "edit") {
					setIsAreaSelectMode(true);
					//	setShowSavedAreaSelectRect(false);
				}
			},
			[
				areaSelectRect,
				getEvidenceIdsByAreaRect,
				onAreaSelectionAction,
				savedAreaSelectRect,
			],
		);

		useEffect(() => {
			const handleAreaSelectionDeleteByKeyboard = (event: KeyboardEvent) => {
				const isDeleteKey =
					event.key === "Delete" || event.key === "Backspace";
				if (!isDeleteKey || event.repeat) return;
				if (!enableAreaSelection || isAreaSelecting) return;
				if (!savedAreaSelectRect && !areaSelectRect) return;

				const target = event.target as HTMLElement | null;
				if (target) {
					const tagName = target.tagName?.toLowerCase();
					const isTypingTarget =
						tagName === "input" ||
						tagName === "textarea" ||
						tagName === "select" ||
						target.isContentEditable;
					if (isTypingTarget) return;
				}

				event.preventDefault();
				handleAreaSelectionOperation("delete");
			};

			window.addEventListener("keydown", handleAreaSelectionDeleteByKeyboard);
			return () => {
				window.removeEventListener("keydown", handleAreaSelectionDeleteByKeyboard);
			};
		}, [
			areaSelectRect,
			enableAreaSelection,
			handleAreaSelectionOperation,
			isAreaSelecting,
			savedAreaSelectRect,
		]);

		return (
			<div className="w-full h-full flex relative">
				<div className="flex-1 flex flex-col overflow-hidden">
					<div className="flex-1 flex flex-col overflow-hidden relative">
						<div
							ref={scrollRef}
							className="flex-1 min-h-0 overflow-auto"
							onWheel={handleWheelZoom}
							style={
								operationMode === "edit"
									? {
										display: "grid",
										alignItems: "center",
										justifyItems: "center",
										cursor:
											cropMode === null
												? isDragging
													? "grabbing"
													: "grab"
												: "default",
									}
									: {}
							}
						>
							<div
								ref={pdfContentRef}
								className="border border-x-primaryN30"
								style={{
									position: "relative",
									width: stageWidth + 2 + "px",
									height: stageHeight + 2 + "px",
								}}
							>
								{isRendering && (
									<div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
										<Spin tip="Loading page..." />
									</div>
								)}
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
										cursor:
											enableAreaSelection &&
												(isAreaSelectMode || isAreaSelecting)
												? "crosshair"
												: cropMode === null
													? isDragging
														? "grabbing"
														: "grab"
													: "default",
									}}
									onClick={(e) => {
										if (suppressStageClickRef.current) {
											suppressStageClickRef.current = false;
											return;
										}
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
										{visibleAreaSelectRect && (
											<Rect
												x={visibleAreaSelectRect.minX}
												y={visibleAreaSelectRect.minY}
												width={visibleAreaSelectRect.width}
												height={visibleAreaSelectRect.height}
												fill="rgba(2, 169, 96, 0.15)"
												stroke="#02A960"
												strokeWidth={1}
												dash={[4, 4]}
												listening={false}
											/>
										)}
										{pageEvidence.map((evid) => {
											return (
												<ShapeWrapper
													key={evid.id}
													operationMode={operationMode}
													type="evidence"
													shape={evid}
													selectedShapeId={selectedShapeId}
													draggingShapeId={draggingShapeId}
													centerEvidence={centerEvidence}
													typeList={typeList}
													pdfOperationType={pdfOperationType}
													evidenceDraggable={evidenceDraggable}
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
																updateEvidence('drag', updatedEvid);
															}
														}, 100);
													}}
													onClick={() => {
														if (operationMode === "view") return;

														if (selectedShapeId === evid.id) {
															setSelectedShapeId(null);
															onChangeSelectedEvidence?.([]);
														} else {
															setSelectedShapeId(evid.id);
															onChangeSelectedEvidence?.([evid.id]);
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
																updateEvidence('resize', updatedEvid);
															}
														}, 100);
													}}
												></ShapeWrapper>
											);
										})}
										{showEvidence && cropSections.map((crop: any, index: number) => {
											return (
												<ShapeWrapper
													key={crop.id}
													operationMode={operationMode}
													type="crop"
													shape={crop}
													selectedShapeId={selectedShapeId}
													draggingShapeId={draggingShapeId}
													centerEvidence={centerEvidence}
													typeList={typeList}
													pdfOperationType={pdfOperationType}
													evidenceDraggable={evidenceDraggable}
													onDragStart={() => {
														setDraggingShapeId(crop.id);
														// 设置新的选中元素
														setSelectedShapeId(crop.id);
														// 禁止 PDF 容器滚动
														if (scrollRef.current) {
															//scrollRef.current.style.overflow = 'hidden';
														}
													}}
													onDragMove={(x, y) => {
														dragCropMoveByOffset(crop.id, x, y);
													}}
													onDragEnd={() => {
														setDraggingShapeId(null);
														// 恢复 PDF 容器滚动
														if (scrollRef.current) {
															//scrollRef.current.style.overflow = 'auto';
														}
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

								{enableAreaSelection &&
									savedAreaSelectRect &&
									!isAreaSelecting && (
										<div
											className="absolute"
											style={{
												left: savedAreaSelectRect.minX,
												top: savedAreaSelectRect.minY,
												width: savedAreaSelectRect.width,
												height: savedAreaSelectRect.height,
												pointerEvents: "none",
											}}
										>
											<div
												className="absolute flex items-center gap-1 pointer-events-auto"
												style={{
													right: 2,
													top: 2,
												}}
											>
												<Tooltip title="Edit Labels">
													<div
														className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
														onClick={() => {
															handleAreaSelectionOperation("edit");
														}}
													>
														<EditOutlined className="text-[12px]" />
													</div>
												</Tooltip>
												<Tooltip title="Delete Labels">
													<div
														className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
														onClick={() => {
															handleAreaSelectionOperation("delete");
														}}
													>
														<DeleteOutlined className="text-[12px]" />
													</div>
												</Tooltip>
												<Tooltip title="Close Box">
													<div
														className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
														onClick={() => {
															clearAreaSelection();
														}}
													>
														<CloseOutlined className="text-[12px]" />
													</div>
												</Tooltip>
											</div>
										</div>
									)}

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
									const evidenceControlScale = getControlScaleForBox(
										width,
										height,
									);
									const evidencePlusOffset = -Math.round(26 * evidenceControlScale);

									let type = item.type ?? "";
									let color: string = colorList["forumBlue-normal"];

									// 是否显示复制按钮框
									let showCopyBtn = false;
									// 是否显示类型选择下拉框
									let showSelectGroup = false;
									// 是否显示左上角的按钮
									let showNumBtn = false;
									// 是否显示删除按钮
									let showDeleteBtn = false;

									if (
										showSelectGroupTypes.includes(type) &&
										pdfOperationType === FileOperationType.ArchitectureDrawing && !item.isParentEvidence && !item.isOtherParentEvidence
									) {
										// ArchDrawing 文件类型，并且框的类型需要按照颜色来显示
										showSelectGroup = true;
										color =
											allPageTypes[type as keyof typeof allPageTypes]?.color ??
											colorList["forumBlue-normal"];
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
											color = findType.color || colorList["forumBlue-normal"];
										}
									}

									if (selectedShapeId === item.id && !item.isParentEvidence && !item.isOtherParentEvidence) {
										// 如果当前选中的元素是当前Evidence，那么显示删除按钮
										showDeleteBtn = true;
									}

									return (
										<div
											key={item.id}
											className={`absolute`}
											style={{
												position: "absolute",
												left: minX,
												top: minY,
												width: width,
												height: height,
												pointerEvents: "none",
											}}
										>
											{showNumBtn && (
												<EditableSubText
													value={item.sub_text ?? ""}
													color={color}
													onChange={(value: string) => {
														if (value.trim() !== "") {
															updateEvidence('changeSubText', {
																...item,
																sub_text: value,
															});
														}
													}}
												/>
											)}
											<div
												className="absolute flex flex-row items-center pointer-events-auto"
												style={{
													right: 2,
													top: 2,
													transform: `scale(${evidenceControlScale})`,
													transformOrigin: "top right",
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
																await updateEvidence('changeType', { ...item, type });
																setFullLoading(false);
															}}
														/>
													)}
													{
														showDeleteBtn && (
															<>
																{/* <Popconfirm
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
																</Popconfirm> */}
																<div className="h-[20px] px-[2px] bg-white rounded-full cursor-pointer shadow-md" onClick={() => batchDelete([item.id])}>
																	<Image
																		src="/assets/icons/delete-dark.svg"
																		alt="delete icon"
																		width={15}
																		height={15}
																		preview={false}
																	/>
																</div>
															</>
														)
													}
												</div>
											</div>
											{
												/*showCopyBtnGroupTypes.includes(type)*/ showCopyBtn && (
													<div
														className="transition-all pointer-events-auto"
														style={{
															position: "absolute",
															left: width / 2 - 50 + "px",
															top:
																maxY > stageHeight - 10
																	? height - 30 + "px"
																	: height + 2 + "px",
															transform: `scale(${evidenceControlScale})`,
															transformOrigin: "top left",
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
																	<span className="-mt-[2px] text-xs">
																		{"<"}
																	</span>
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
																	<span className="-mt-[2px] text-xs">
																		{">"}
																	</span>
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
																			Create Linked Box Create a new box linked
																			to this item.
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
												)
											}
											{showAddBtnOnBox &&
												<div
													className="absolute flex items-center pointer-events-auto transition-all"
													style={{
														right: evidencePlusOffset,
														top: "50%",
														transform: `translateY(-50%) scale(${evidenceControlScale})`,
														transformOrigin: "center right",
														display:
															selectedShapeId === item.id ? "block" : "none",
													}}
												>
													<div
														className={`w-[20px] h-[20px]  flex justify-center items-center text-white rounded-full cursor-pointer`}
														style={{
															backgroundColor: color,
														}}
														onClick={() => {
															copyGroupShape('evidence', item, "right");
														}}
													>
														<span className="">+</span>
													</div>
												</div>}
											{
												showAddBtnOnBox && <div
													className="absolute flex items-center pointer-events-auto transition-all"
													style={{
														left: "50%",
														bottom: evidencePlusOffset,
														transform: `translateX(-50%) scale(${evidenceControlScale})`,
														transformOrigin: "bottom center",
														display:
															selectedShapeId === item.id ? "block" : "none",
													}}
												>
													<div
														className={`w-[20px] h-[20px] flex justify-center items-center text-white rounded-full cursor-pointer`}
														style={{
															backgroundColor: color,
														}}
														onClick={() => {
															copyGroupShape('evidence', item, "bottom");
														}}
													>
														<span className="inline-block">+</span>
													</div>
												</div>
											}
										</div>
									);
								})}

								{/** 处理图形绘制的按钮相关显示  */}
								{showEvidence && cropSections.map((group: GroupFrame) => {
									if (!group.completed) {
										return null;
									}
									if (group.polygons.length === 0) {
										return null;
									}
									const { minX, minY, maxX, maxY, width, height } =
										group.bounds;
									const groupControlScale = getControlScaleForBox(
										width,
										height,
									);
									const groupPlusOffset = -Math.round(26 * groupControlScale);
									let color: string =
										allPageTypes[group.type as keyof typeof allPageTypes]
											?.color ?? colorList["forumBlue-normal"];

									let showSelectGroup = false;
									let selectGroupTypeList: any[] = ArchDrawingLabelTypes;
									if (itemBoxTypes.includes(group.type as any)) {
										// 添加的是item小框类型
										if (
											group.type === (itemBoxType.WindowDoorUnitItem as any) ||
											group.type === (itemBoxType.TableItem as any)
										) {
											//如果添加的是schedule类型，则需要显示schedule类型下拉框
											showSelectGroup = true;
											color =
												allPageTypes[group.type as keyof typeof allPageTypes]
													?.color ?? colorList["forumBlue-normal"];
											selectGroupTypeList = ArchDrawingItemLabelTypes;
										}
									}

									if (
										showSelectGroupTypes.includes(group.type) &&
										pdfOperationType === FileOperationType.ArchitectureDrawing
									) {
										// ArchDrawing 文件类型，并且框的类型需要按照颜色来显示
										//	showSelectGroup = true;
										color =
											allPageTypes[group.type as keyof typeof allPageTypes]
												?.color ?? colorList["forumBlue-normal"];
									}

									return (
										<div
											key={group.id}
											style={{
												position: "absolute",
												left: minX,
												top: minY,
												width: width,
												height: height,
												pointerEvents: "none",
											}}
										>
											{/* 右上角按钮组 */}
											<div
												className="absolute flex flex-row items-center gap-1 pointer-events-auto"
												style={{
													right: 2,
													top: 2,
													transform: `scale(${groupControlScale})`,
													transformOrigin: "top right",
												}}
											>
												{showSelectGroup && (
													<LabelTypesSelect
														typeList={selectGroupTypeList}
														selectedType={group.type}
														onChangeType={async (type) => {
															if (type === group.type) return;
															setCropSections((prev: any) => {
																return prev.map((item: any) => {
																	if (item.id === group.id) {
																		return {
																			...item,
																			type: type as GroupType,
																		};
																	}
																	return item;
																});
															});
														}}
													/>
												)}
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

												{[...showConfirmBtnGroupTypes, ...showItemConfirmBtnTypes].includes(group.type) && (
													<div
														className="w-[44px] px-[3px] py-[1px] font-light text-white text-xxs text-center bg-forumBlue-normal rounded-lg whitespace-nowrap cursor-pointer"
														onClick={() => {
															if (showConfirmBtnGroupTypes.includes(group.type)) {
																evidencSubmit(group.id);
															} else if (showItemConfirmBtnTypes.includes(group.type)) {
																let revertCropSectionsData = getRevertCropSectionsData();
																if (!revertCropSectionsData) return;
																let findItem = revertCropSectionsData.find(
																	(item: any) => item.groupId === group.id,
																);
																onItemEvidenceConfirm?.(findItem);
															}
														}}
													>
														Confirm
													</div>
												)}

												<div
													className="h-[20px] px-[2px] bg-white rounded-full cursor-pointer shadow-md pointer-events-auto"
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

											{/* 右侧复制按钮 */}
											{showAddBtnOnBox && selectedShapeId === group.id && (
												<div
													className="absolute flex items-center pointer-events-auto transition-all"
													style={{
														right: groupPlusOffset,
														top: "50%",
														transform: `translateY(-50%) scale(${groupControlScale})`,
														transformOrigin: "center right",
													}}
												>
													<div
														className="w-[20px] h-[20px] flex justify-center items-center text-white rounded-full cursor-pointer"
														style={{ backgroundColor: color }}
														onClick={() => {
															copyGroupShape('group', group, "right");
														}}
													>
														<span>+</span>
													</div>
												</div>
											)}

											{/* 底部复制按钮 */}
											{showAddBtnOnBox && selectedShapeId === group.id && (
												<div
													className="absolute flex justify-center pointer-events-auto transition-all"
													style={{
														left: "50%",
														bottom: groupPlusOffset,
														transform: `translateX(-50%) scale(${groupControlScale})`,
														transformOrigin: "bottom center",
													}}
												>
													<div
														className="w-[20px] h-[20px] flex justify-center items-center text-white rounded-full cursor-pointer"
														style={{ backgroundColor: color }}
														onClick={() => {
															copyGroupShape('group', group, "bottom");
														}}
													>
														<span>+</span>
													</div>
												</div>
											)}
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
	centerEvidence,
	typeList,
	pdfOperationType,
	evidenceDraggable,
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
	centerEvidence: { id: string | number } | null;  // 居中显示的evidence
	typeList?: any[];
	pdfOperationType: FileOperationType;
	evidenceDraggable?: boolean; // 是否可拖动evidence
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

	if (type === "evidence" || type === "crop") {
		let evidType = shape.type ?? "";
		if (
			showSelectGroupTypes.includes(evidType as any) &&
			pdfOperationType === FileOperationType.ArchitectureDrawing
		) {
			// ArchDrawing 文件类型，并且框的类型需要按照颜色来显示
			color =
				allPageTypes[evidType as keyof typeof allPageTypes]?.color ??
				colorList["forumBlue-normal"];
		} else if (pdfOperationType === FileOperationType.Quote) {
			// Quote文件类型，需要按照boxTypeList中的type来显示颜色，并且需要显示复制按钮
			if (evidType === GroupType.WindowDoorUnitList) {
				evidType = GroupType.Item;
			}
			let findType = typeList?.find((box: any) => box.name === evidType);
			if (findType) {
				color = findType.color || colorList["forumBlue-normal"];
			}
		}
	}

	let shapeDraggable = evidenceDraggable ?? true;
	if (type === "evidence") {
		if (shape?.isParentEvidence || shape?.isOtherParentEvidence) {
			// 如果是父级红色外框，则不允许点击和移动
			shapeDraggable = false;
		}
	}
	!(type === "evidence" && !evidenceDraggable);

	if (draggingShapeId === shape.id) {
		color = "#FF4500";
	}

	if (centerEvidence?.id === shape.id) {
		color = "#FF4500";
	}

	if (shape?.isParentEvidence) {
		color = "#FF4500";
	}

	if (selectedShapeId === shape.id) {
		if (shapeDraggable) {
			circlePoints = getCriclePoints(width, height);
		}
	}

	const isParentEvidence = shape?.isParentEvidence;
	const isOtherParentEvidence = shape?.isOtherParentEvidence;
	let fill: any = color + "30";
	if (isParentEvidence) {
		fill = undefined;
	} else if (isOtherParentEvidence) {
		//fill = "#717171" + "90";
		fill = undefined;
		color = "#717171";
	}



	return (
		<Group key={shape.id} x={minX} y={minY}>
			{/** 填充区域  */}
			<Path
				data={pathData}
				fill={fill}
				stroke={color}
				strokeWidth={isParentEvidence || isOtherParentEvidence ? 3 : 1}
				dash={isParentEvidence || isOtherParentEvidence ? [10, 5] : undefined}
				listening={!isParentEvidence && !isOtherParentEvidence}
				draggable={shapeDraggable}
				dragDistance={2}
				onMouseEnter={(e) => {
					const stage = e.target.getStage();
					if (isParentEvidence || isOtherParentEvidence) {
						return;
					}
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
					if (isParentEvidence || isOtherParentEvidence) {
						return;
					}
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
