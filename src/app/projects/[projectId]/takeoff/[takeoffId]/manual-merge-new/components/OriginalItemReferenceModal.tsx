"use client";

import { Button, Empty, Modal } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AddBoxModal from "../../analyze-new/components/AddBoxModal";
import { EvidenceRecord, ProjectFileRecord } from "../../analyze-new/types";

interface OriginalItemReferenceModalProps {
	open: boolean;
	projectId: string;
	files?: ProjectFileRecord[];
	item: any | null;
	onClose: () => void;
}

interface BoxCoordinate {
	x: number;
	y: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const DEFAULT_ZOOM = 1;

// Test box coordinates - array of boxes, each box has 4 points
const TEST_BOX_COORDINATES: BoxCoordinate[][] = [
	[
		{ x: 2241, y: 1328 },
		{ x: 2241, y: 1475 },
		{ x: 2320, y: 1475 },
		{ x: 2320, y: 1328 },
	],
	[
		{ x: 1831, y: 615 },
		{ x: 1831, y: 714 },
		{ x: 1912, y: 714 },
		{ x: 1912, y: 615 },
	],
	[
		{ x: 1416, y: 899 },
		{ x: 1416, y: 1002 },
		{ x: 1498, y: 1002 },
		{ x: 1498, y: 899 },
	],
	[
		{ x: 1835, y: 472 },
		{ x: 1835, y: 571 },
		{ x: 1913, y: 571 },
		{ x: 1913, y: 472 },
	],
];

export default function OriginalItemReferenceModal({
	open,
	projectId,
	files,
	item,
	onClose,
}: OriginalItemReferenceModalProps) {
	const [zoom, setZoom] = useState(DEFAULT_ZOOM);
	const [imageNaturalSize, setImageNaturalSize] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [imageDisplaySize, setImageDisplaySize] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [showAddBoxModal, setShowAddBoxModal] = useState(false);
	const [mockFiles, setMockFiles] = useState<ProjectFileRecord[]>([]);
	const [mockEvidencesByFile, setMockEvidencesByFile] = useState<
		Record<number, EvidenceRecord[]>
	>({});
	const imageRef = useRef<HTMLImageElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const itemEvidenceType = item?.evidence_msg?.type || "";
	const itemPageNumber = item?.evidence_msg?.project_file_page_number || 1;

	const testEvidUrl =
		"https://latii-cato2-dev.s3.amazonaws.com/s3_evidences/pdf/image/6453b42964b547dfb66f2be9e54eacb9_manual_test_page44_dpi_100.png?response-content-disposition=attachment%3B%20filename%3D%22page44_dpi_100.png%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260330%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260330T040223Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=5f570e5ca0932c6a8a33f7b4f557276f62709a1412ce525042940cdf1013872b";

	const evidenceUrl = useMemo(() => {
		if (!item) return "";
		if (Array.isArray(item.evidence_msg)) {
			return item.evidence_msg[0]?.s3_url || "";
		}
		//return item.evidence_msg?.s3_url || "";
		return testEvidUrl;
	}, [item]);

	// Calculate box positions based on image scale
	const boxStyles = useMemo(() => {
		if (!imageNaturalSize || !imageDisplaySize) return [];

		// Calculate scale ratio between displayed size and natural size
		const scaleX = imageDisplaySize.width / imageNaturalSize.width;
		const scaleY = imageDisplaySize.height / imageNaturalSize.height;

		return TEST_BOX_COORDINATES.map((boxCoords) => {
			// Get bounding box from coordinates
			const minX = Math.min(...boxCoords.map((p) => p.x));
			const minY = Math.min(...boxCoords.map((p) => p.y));
			const maxX = Math.max(...boxCoords.map((p) => p.x));
			const maxY = Math.max(...boxCoords.map((p) => p.y));

			return {
				left: minX * scaleX,
				top: minY * scaleY,
				width: (maxX - minX) * scaleX,
				height: (maxY - minY) * scaleY,
			};
		});
	}, [imageNaturalSize, imageDisplaySize]);

	// Handle image load to get natural dimensions
	const handleImageLoad = useCallback(
		(e: React.SyntheticEvent<HTMLImageElement>) => {
			const img = e.currentTarget;
			setImageNaturalSize({
				width: img.naturalWidth,
				height: img.naturalHeight,
			});
		},
		[],
	);

	// Update display size when zoom changes or after image loads
	useEffect(() => {
		const updateDisplaySize = () => {
			if (imageRef.current) {
				setImageDisplaySize({
					width: imageRef.current.offsetWidth,
					height: imageRef.current.offsetHeight,
				});
			}
		};

		updateDisplaySize();

		// Use ResizeObserver to track size changes
		const resizeObserver = new ResizeObserver(updateDisplaySize);
		if (imageRef.current) {
			resizeObserver.observe(imageRef.current);
		}

		return () => {
			resizeObserver.disconnect();
		};
	}, [zoom, imageNaturalSize]);

	const itemResult = useMemo(() => {
		if (!item) return {};
		if (typeof item.result === "string") {
			try {
				return JSON.parse(item.result);
			} catch {
				return {};
			}
		}
		return item.result || {};
	}, [item]);

	const fieldEntries = useMemo(() => {
		return Object.entries(itemResult).filter(
			([key]) => key !== "Source Type",
		) as [string, string][];
	}, [itemResult]);

	const handleZoomIn = () => {
		setZoom((prev) => Math.min(MAX_ZOOM, prev + 0.25));
	};

	const handleZoomOut = () => {
		setZoom((prev) => Math.max(MIN_ZOOM, prev - 0.25));
	};

	const handleResetZoom = () => {
		setZoom(DEFAULT_ZOOM);
	};

	const handleClose = () => {
		setZoom(DEFAULT_ZOOM);
		setImageNaturalSize(null);
		setImageDisplaySize(null);
		onClose();
	};

	const handleOpenAddBoxModal = () => {
		setShowAddBoxModal(true);
	};

	const handleCloseAddBoxModal = () => {
		setShowAddBoxModal(false);
	};

	const handleChangeFileEvidences = (
		fileId: number,
		updater: (current: EvidenceRecord[]) => EvidenceRecord[],
	) => {
		setMockEvidencesByFile((prev) => ({
			...prev,
			[fileId]: updater(prev[fileId] || []),
		}));
	};

	return (
		<Modal
			open={open}
			onCancel={handleClose}
			footer={null}
			title={null}
			centered
			width="80vw"
			destroyOnClose
			closable={false}
			zIndex={1050}
		>
			<div className="flex h-[80vh] min-h-[640px] flex-col gap-4 overflow-hidden p-2 font-nunito">
				{/* Header */}
				<div className="flex items-start justify-between gap-4">
					<div>
						<div className="text-base text-forumBlue-normal">
							Item Reference
						</div>
						<div className="mt-1 text-xs text-grey-normal">
							View the evidence image for this item.
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Button
							type="primary"
							className="custom-primary-btn !h-8 !px-4"
							onClick={handleOpenAddBoxModal}
						>
							Add Box
						</Button>
						<button
							type="button"
							onClick={handleClose}
							className="flex h-8 w-8 items-center justify-center rounded-md text-grey-normal transition-colors hover:bg-grey-light-hover hover:text-grey-dark"
						>
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
								<path
									d="M1 1L13 13M1 13L13 1"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
								/>
							</svg>
						</button>
					</div>
				</div>

				{/* Item info bar */}
				<div className="flex items-center gap-3 rounded-xl border border-primaryN30 bg-[#FBFBFC] px-4 py-2.5">
					<div className="flex items-center gap-2">
						<span className="text-xs font-medium text-grey-dark">
							{itemResult.Label || "—"}
						</span>
						{itemResult["Sub Label"] && (
							<span className="text-xs text-grey-normal">
								/ {itemResult["Sub Label"]}
							</span>
						)}
					</div>
					<div className="h-4 w-px bg-primaryN30" />
					{fieldEntries.slice(0, 4).map(([key, value]) => (
						<div key={key} className="flex items-center gap-1 text-[11px]">
							<span className="text-grey-normal">{key}:</span>
							<span className="text-grey-dark">{String(value) || "—"}</span>
						</div>
					))}
					{itemEvidenceType && (
						<>
							<div className="h-4 w-px bg-primaryN30" />
							<span className="rounded-full bg-[#EEF5FF] px-2 py-0.5 text-[10px] text-forumBlue-normal">
								{itemEvidenceType}
							</span>
						</>
					)}
					{itemPageNumber > 0 && (
						<>
							<div className="h-4 w-px bg-primaryN30" />
							<span className="text-[11px] text-grey-normal">
								Page {itemPageNumber}
							</span>
						</>
					)}
				</div>

				{/* Main content */}
				<div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] gap-5">
					{/* Left: Item details */}
					<div className="flex min-h-0 flex-col rounded-2xl border border-primaryN30 bg-white">
						<div className="border-b border-primaryN30 px-4 py-3">
							<div className="text-xs font-medium text-grey-dark">
								Item Details
							</div>
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto">
							<div className="divide-y divide-primaryN30">
								{fieldEntries.length > 0 ? (
									fieldEntries.map(([key, value]) => (
										<div
											key={key}
											className="grid grid-cols-[100px_minmax(0,1fr)] gap-3 px-4 py-2.5"
										>
											<div className="text-[11px] text-grey-normal">{key}</div>
											<div className="break-words text-[11px] text-grey-dark">
												{typeof value === "object"
													? JSON.stringify(value)
													: String(value) || "—"}
											</div>
										</div>
									))
								) : (
									<div className="px-4 py-10 text-center text-xs text-grey-normal">
										No item details available.
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right: Evidence image with zoom */}
					<div className="flex min-h-0 flex-col rounded-2xl border border-primaryN30 bg-white">
						{/* Zoom controls */}
						<div className="flex items-center justify-between border-b border-primaryN30 px-4 py-2.5">
							<div className="text-xs font-medium text-grey-dark">
								Evidence Image
							</div>
							<div className="flex items-center gap-1">
								<button
									type="button"
									onClick={handleZoomOut}
									disabled={zoom <= MIN_ZOOM}
									className="flex h-7 w-7 items-center justify-center rounded-md border border-primaryN30 bg-white text-sm text-grey-dark transition-colors hover:border-forumBlue-normal hover:text-forumBlue-normal disabled:cursor-not-allowed disabled:opacity-40"
								>
									<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
										<path
											d="M3 7H11"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeLinecap="round"
										/>
									</svg>
								</button>
								<button
									type="button"
									onClick={handleResetZoom}
									className="flex h-7 min-w-[52px] items-center justify-center rounded-md border border-primaryN30 bg-white px-2 text-[11px] text-grey-dark transition-colors hover:border-forumBlue-normal hover:text-forumBlue-normal"
								>
									{Math.round(zoom * 100)}%
								</button>
								<button
									type="button"
									onClick={handleZoomIn}
									disabled={zoom >= MAX_ZOOM}
									className="flex h-7 w-7 items-center justify-center rounded-md border border-primaryN30 bg-white text-sm text-grey-dark transition-colors hover:border-forumBlue-normal hover:text-forumBlue-normal disabled:cursor-not-allowed disabled:opacity-40"
								>
									<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
										<path
											d="M7 3V11M3 7H11"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeLinecap="round"
										/>
									</svg>
								</button>
							</div>
						</div>

						{/* Image container */}
						<div
							ref={containerRef}
							className="min-h-0 flex-1 overflow-auto bg-[#FBFBFC] p-4"
						>
							{evidenceUrl ? (
								<div
									className="flex min-h-full items-start justify-center"
									style={{
										width: zoom > 1 ? `${zoom * 100}%` : "100%",
										minWidth: zoom > 1 ? `${zoom * 100}%` : undefined,
									}}
								>
									<div className="relative inline-block">
										<img
											ref={imageRef}
											src={evidenceUrl}
											alt="Evidence"
											className="rounded-lg border border-primaryN30 bg-white shadow-sm"
											style={{
												width: zoom > 1 ? "100%" : `${zoom * 100}%`,
												height: "auto",
												maxWidth: "none",
												display: "block",
											}}
											onLoad={handleImageLoad}
										/>
										{/* Box overlays */}
										{boxStyles.map((boxStyle, index) => (
											<div
												key={index}
												className="pointer-events-none absolute border-2 border-red-500 bg-red-500/10"
												style={{
													left: boxStyle.left,
													top: boxStyle.top,
													width: boxStyle.width,
													height: boxStyle.height,
												}}
											/>
										))}
									</div>
								</div>
							) : (
								<div className="flex h-full items-center justify-center rounded-xl border border-dashed border-primaryN30 bg-white">
									<Empty
										image={Empty.PRESENTED_IMAGE_SIMPLE}
										description={
											<span className="text-xs text-grey-normal">
												No evidence image available for this item.
											</span>
										}
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Add Box Modal */}
			<AddBoxModal
				open={showAddBoxModal}
				projectId={projectId}
				files={files || []}
				initialFileId={item?.evidence_msg?.project_file_id}
				selectedItem={item}
				evidencesByFile={mockEvidencesByFile}
				onChangeFileEvidences={handleChangeFileEvidences}
				onClose={handleCloseAddBoxModal}
			/>
		</Modal>
	);
}
