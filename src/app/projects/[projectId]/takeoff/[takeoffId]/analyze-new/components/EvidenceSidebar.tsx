"use client";

import {
	EyeInvisibleOutlined,
	EyeOutlined,
	FileAddOutlined,
	FullscreenOutlined,
	ZoomInOutlined,
	ZoomOutOutlined,
} from "@ant-design/icons";
import { Button, Empty, Modal, Select, Slider, Spin, Tooltip } from "antd";

import { useEffect, useMemo, useRef, useState } from "react";

import { getEvidenceBounds, getEvidenceIds } from "../takeoffUtils";
import { EvidenceRecord, ProjectFileRecord, TakeoffItemRecord } from "../types";
import Image from "next/image";
import { getTakeOffEvidenceUrlsByIds } from "@/services/takeOffService";
import { getEvidenceByFileId } from "@/services/evidenceService";
import { useParams } from "next/navigation";
import { ZoomControls } from "../../components/pdf/Pdf-Controls";

interface EvidenceSidebarProps {
	selectedItem?: TakeoffItemRecord | null;
	files: ProjectFileRecord[];
}

interface PageThumbnailEntry {
	key: string;
	file: ProjectFileRecord;
	pageNumber: number;
	imageUrl: string;
	pageEvidences: EvidenceRecord[];
	aspectRatio: number;
}

interface PageThumbnailCardProps {
	entry: PageThumbnailEntry;
	imageMetrics?: {
		naturalWidth: number;
		naturalHeight: number;
		displayWidth: number;
		displayHeight: number;
		scaleX: number;
		scaleY: number;
	};
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

function PageThumbnailCard({
	entry,
	imageMetrics,
	onImageRendered,
}: PageThumbnailCardProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const modalScrollRef = useRef<HTMLDivElement | null>(null);
	const thumbnailImageRef = useRef<HTMLImageElement | null>(null);
	const modalImageRef = useRef<HTMLImageElement | null>(null);
	const modalDragStartRef = useRef({
		x: 0,
		y: 0,
		scrollLeft: 0,
		scrollTop: 0,
	});
	const [previewOpen, setPreviewOpen] = useState(false);
	const [zoomScale, setZoomScale] = useState(1);
	const [isModalDragging, setIsModalDragging] = useState(false);
	const [thumbnailImageLoaded, setThumbnailImageLoaded] = useState(false);
	const [modalImageLoaded, setModalImageLoaded] = useState(false);

	const ZOOM_MIN = 0.5;
	const ZOOM_MAX = 3;
	const WHEEL_ZOOM_STEP = 0.1;

	useEffect(() => {
		setThumbnailImageLoaded(false);
		setModalImageLoaded(false);
	}, [entry.imageUrl]);

	const syncImageReadyState = (
		imageElement: HTMLImageElement,
		mode: "thumbnail" | "modal",
		shouldCaptureMetrics: boolean,
	) => {
		if (mode === "thumbnail") {
			setThumbnailImageLoaded(true);
		} else {
			setModalImageLoaded(true);
		}

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
				syncImageReadyState(thumbnailImage, "thumbnail", true);
			}

			const modalImage = modalImageRef.current;
			if (modalImage?.complete && modalImage.naturalWidth > 0) {
				syncImageReadyState(modalImage, "modal", false);
			}
		});

		return () => {
			window.cancelAnimationFrame(rafId);
		};
	}, [entry.imageUrl, previewOpen]);

	const renderPreviewLayer = (
		mode: "thumbnail" | "modal",
		shouldCaptureMetrics = false,
		evidenceBorderWidth = 1.5,
	) => {
		const shouldRenderBoxes =
			mode === "thumbnail" ? thumbnailImageLoaded : modalImageLoaded;

		return (
			<div className={`py-3 relative w-full`}>
				<img
					ref={(element) => {
						if (mode === "thumbnail") {
							thumbnailImageRef.current = element;
						} else {
							modalImageRef.current = element;
						}
					}}
					src={entry.imageUrl}
					alt={`${entry.file?.file_name || "File"} page ${entry.pageNumber}`}
					className="block h-auto w-full"
					loading="lazy"
					onLoad={(event) => {
						syncImageReadyState(event.currentTarget, mode, shouldCaptureMetrics);
					}}
				/>
				{shouldRenderBoxes &&
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
									borderWidth: `${evidenceBorderWidth}px`,
									left: `${leftPercent}%`,
									top: `${topPercent}%`,
									width: `${widthPercent}%`,
									height: `${heightPercent}%`,
								}}
							/>
						);
					})}
			</div>
		);
	};

	const handleZoomChange = (value: number) => {
		const clampedValue = Math.max(ZOOM_MIN, Math.min(value, ZOOM_MAX));
		setZoomScale(clampedValue);
	};

	const handleModalWheelZoom = (event: React.WheelEvent<HTMLDivElement>) => {
		if (!event.ctrlKey && !event.metaKey) return;
		event.preventDefault();
		event.stopPropagation();
		const direction = event.deltaY < 0 ? 1 : -1;
		handleZoomChange(zoomScale + direction * WHEEL_ZOOM_STEP);
	};

	const handleModalMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
		if (event.button !== 0 || !entry.imageUrl) return;
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
		if (!previewOpen) {
			setIsModalDragging(false);
		}
	}, [previewOpen]);


	return (
		<div
			ref={(element) => {
				containerRef.current = element;
			}}
			className="border border-primaryN30 rounded-lg"
		>
			<div className="mx-2 my-4 flex items-center justify-between">
				<span className="max-w-[300px] truncate text-xs text-grey-normal">
					{entry.file?.file_name || "Unnamed file"}
				</span>
				<span className="text-xs text-grey-normal">{'Page ' + entry.pageNumber}</span>
			</div>

			<div
				className="relative overflow-hidden rounded-lg bg-white"
			>
				<Button
					type="text"
					size="small"
					icon={<FullscreenOutlined />}
					className="!absolute right-2 top-2 z-10 !rounded-md !bg-black/40 !text-white hover:!bg-black/60 hover:!text-white"
					onClick={(event) => {
						event.stopPropagation();
						setPreviewOpen(true);
						setZoomScale(1);
					}}
				/>
				{entry.imageUrl ? (
					<>
						{renderPreviewLayer("thumbnail", true)}
					</>
				) : (
					<div className="absolute inset-0 flex items-center justify-center bg-white">
						<Empty
							image={Empty.PRESENTED_IMAGE_SIMPLE}
							description={
								<span className="text-xs text-grey-normal">
									No preview image
								</span>
							}
						/>
					</div>
				)}
			</div>

			<Modal
				open={previewOpen}
				onCancel={() => {
					setPreviewOpen(false);
					setIsModalDragging(false);
				}}
				footer={null}
				width={'80vw'}
				destroyOnClose
				title={<div className="text-forumBlue-normal">{entry.file?.file_name || "Unnamed file"}</div>}
			>
				<div className="flex h-[75vh] min-h-[520px] flex-col">
					<div className="mb-3 flex items-center justify-center">
						<ZoomControls
							zoom={zoomScale}
							handleZoomChange={handleZoomChange}
						/>
						<span className="ml-6 text-xs text-grey-normal">{'Page ' + entry.pageNumber}</span>
					</div>
					<div
						ref={modalScrollRef}
						className="min-h-0 flex-1 overflow-auto rounded-lg border border-primaryN30 bg-primaryN20 p-4"
						onWheel={handleModalWheelZoom}
						onMouseDown={handleModalMouseDown}
						style={{
							cursor: entry.imageUrl
								? isModalDragging
									? "grabbing"
									: "grab"
								: "default",
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
							{entry.imageUrl ? (
								renderPreviewLayer("modal", false, 2)
							) : (
								<div className="absolute inset-0 flex items-center justify-center bg-white">
									<Empty
										image={Empty.PRESENTED_IMAGE_SIMPLE}
										description={
											<span className="text-xs text-grey-normal">
												No preview image
											</span>
										}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
}

export default function EvidenceSidebar({
	selectedItem,
	files
}: EvidenceSidebarProps) {
	const projectId = useParams().projectId;
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

	useEffect(() => {
		if (!selectedItem) {
			setLoadingEvidences(false);
			setEvidences([]);
			return;
		}
		fetchEvidences();
	}, [selectedItem]);

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

	const pageEntries = (() => {
		if (!evidences.length) {
			setPageData([]);
		}
		const groupedMap = new Map<string, PageThumbnailEntry>();

		evidences.forEach((evid) => {
			const fileId = Number(evid?.project_file_id || 0);
			const pageNumber = Number(evid?.project_file_page_number || 1);
			const file = files.find((f) => Number(f?.id) === fileId);
			const imagePages = file?.parse_detail?.image_page_infos || [];
			const imageUrl =
				imagePages.find((pageInfo, pageIndex) => {
					return Number(pageIndex + 1) === pageNumber;
				})?.s3_url || "";
			const groupKey = `${fileId}-${pageNumber}-${imageUrl || "no-image"}`;
			const existing = groupedMap.get(groupKey);

			if (existing) {
				existing.pageEvidences.push(evid);
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
				pageEvidences: [evid],
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
	});

	// const pageEntries = (() => {
	// 	if (!evidences.length) {
	// 		setPageData([]);
	// 	}

	// 	const file = files[0];
	// 	const imagePages = file?.parse_detail?.image_page_infos || [];
	// 	let list: any = [];
	// 	for (let i = 0; i < imagePages.length; i++) {
	// 		const pageInfo = imagePages[i];
	// 		let pageNumber = i + 1;
	// 		let evides = evidences.filter((evid) => evid?.project_file_page_number === pageNumber);
	// 		const pageKey = `${file?.id}-${pageNumber}`;
	// 		const pageMetrics = pageImageMetricsMap[pageKey];
	// 		const aspectRatio =
	// 			pageMetrics && pageMetrics.naturalWidth > 0 && pageMetrics.naturalHeight > 0
	// 				? pageMetrics.naturalWidth / pageMetrics.naturalHeight
	// 				: 1;
	// 		list.push({
	// 			key: pageKey,
	// 			file,
	// 			pageNumber,
	// 			imageUrl: pageInfo?.s3_url || "",
	// 			pageEvidences: evides,
	// 			aspectRatio: Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1,
	// 		});
	// 	}
	// 	setPageData(list);
	// });

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
			const next = Object.values(payload || {}) as any[] || [];
			// 	去重next中id重复的evidence id
			let uniqueEvidences = next.filter((evid, index, self) => {
				return index === self.findIndex((t) => t.id === evid.id);
			});

			setEvidences(uniqueEvidences);
		} finally {
			setLoadingEvidences(false);
		}

		// const response = await getEvidenceByFileId(projectId as string, files[0]?.id as number);
		// if (response.status !== "success") {
		// 	setEvidences([]);
		// 	return;
		// }
		// setEvidences(response.data || []);
	};

	useEffect(() => {
		pageEntries();
	}, [evidences, pageImageMetricsMap]);

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

	const selectedLabel =
		selectedItem && typeof selectedItem.result === "object"
			? String((selectedItem.result as Record<string, unknown>)?.Label || "")
			: "";


	return (
		<div className="flex h-full w-[480px] flex-col border-l border-primaryN30 pl-5">
			{/* <div className="mt-3 rounded-xl border border-forumBlue-normal/20 bg-gradient-to-br from-[#F8FBFF] to-white px-4 py-3 shadow-sm">
				<div className="flex items-start gap-2">
					<div className="mt-[2px] h-2 w-2 rounded-full bg-forumBlue-normal" />
					<div className="min-w-0">
						<div className="text-sm font-semibold tracking-[0.01em] text-forumBlue-normal">
							Evidence Source Panel
						</div>
						<div className="mt-0.5 text-xxs uppercase tracking-[0.08em] text-forumBlue-normal/70">
							Trace & Verify
						</div>
					</div>
				</div>
				<div className="mt-2 text-xs leading-5 text-grey-normal">
					Review the source pages for the selected item. Each thumbnail overlays all related evidence boxes so you can quickly validate location and context.
				</div>
			</div> */}
			<div className="my-2">
				<span className="text-sm text-forumBlue-normal">Label：</span>
				<span className="ml-1 text-sm text-grey-normal">{selectedLabel}</span>
				{!selectedItem && (
					<div className="mt-2 rounded-lg border border-dashed border-primaryN40 bg-[#FCFDFF] px-3 py-2.5">
						<div className="text-xs font-medium text-forumBlue-normal">
							No item selected
						</div>
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
						{pageData.map((entry) => {
							return (
								<PageThumbnailCard
									key={entry.key}
									entry={entry}
									imageMetrics={pageImageMetricsMap[entry.key]}
									onImageRendered={handleImageRendered}
								/>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
