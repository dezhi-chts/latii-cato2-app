"use client";

import {
	EyeInvisibleOutlined,
	EyeOutlined,
	FileAddOutlined,
	FullscreenOutlined,
} from "@ant-design/icons";
import { Button, Empty, Select, Tooltip } from "antd";

import { useEffect, useMemo, useRef, useState } from "react";

import { getEvidenceBounds, getEvidenceIds } from "../takeoffUtils";
import { EvidenceRecord, ProjectFileRecord, TakeoffItemRecord } from "../types";
import Image from "next/image";

interface EvidenceSidebarProps {
	files: ProjectFileRecord[];
	selectedFileId: number;
	selectedItem?: TakeoffItemRecord | null;
	fileFilter: string;
	showEvidenceBoxes: boolean;
	evidencesByFile: Record<number, EvidenceRecord[]>;
	onSelectFile: (fileId: number) => void;
	onChangeFileFilter: (value: string) => void;
	onToggleEvidenceBoxes: () => void;
	onOpenAddBoxModal: () => void;
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
	highlightedEvidenceIds: number[];
	isTargetPage: boolean;
	isSelectedFile: boolean;
	showEvidenceBoxes: boolean;
	forceLoad: boolean;
	onClick: () => void;
	onRegisterRef: (key: string, element: HTMLDivElement | null) => void;
	onImageReady: (key: string) => void;
}

function PageThumbnailCard({
	entry,
	highlightedEvidenceIds,
	isTargetPage,
	isSelectedFile,
	showEvidenceBoxes,
	forceLoad,
	onClick,
	onRegisterRef,
	onImageReady,
}: PageThumbnailCardProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const imageRef = useRef<HTMLImageElement | null>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const element = containerRef.current;
		if (!element) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((observerEntry) => {
					if (observerEntry.isIntersecting) {
						setIsVisible(true);
					}
				});
			},
			{
				rootMargin: "400px 0px",
				threshold: 0.01,
			},
		);

		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, []);

	useEffect(() => {
		if (forceLoad) {
			setIsVisible(true);
		}
	}, [forceLoad]);

	const sortedEvidences = useMemo(() => {
		return [...entry.pageEvidences].sort((firstEvidence, secondEvidence) => {
			const firstHighlighted = highlightedEvidenceIds.includes(
				firstEvidence?.id,
			);
			const secondHighlighted = highlightedEvidenceIds.includes(
				secondEvidence?.id,
			);

			if (firstHighlighted === secondHighlighted) {
				return 0;
			}

			return firstHighlighted ? 1 : -1;
		});
	}, [entry.pageEvidences, highlightedEvidenceIds]);

	const shouldRenderImage = isVisible || forceLoad;

	useEffect(() => {
		if (!shouldRenderImage || !entry.imageUrl || !imageRef.current?.complete) {
			return;
		}

		onImageReady(entry.key);
	}, [entry.imageUrl, entry.key, onImageReady, shouldRenderImage]);

	return (
		<div
			ref={(element) => {
				containerRef.current = element;
				onRegisterRef(entry.key, element);
			}}
			className={`cursor-pointer rounded-xl border bg-primaryN20 p-4 transition-all ${
				isTargetPage
					? "border-forumBlue-normal shadow-sm ring-2 ring-forumBlue-normal/20"
					: isSelectedFile
						? "border-forumBlue-normal/40"
						: "border-transparent"
			}`}
			onClick={onClick}
		>
			<div className="mb-3 flex items-center justify-between">
				<span className="text-xs text-grey-normal">{entry.pageNumber}</span>
				<span className="max-w-[230px] truncate text-xxs text-grey-normal">
					{entry.file?.file_name || "Unnamed file"}
				</span>
			</div>

			<div
				className="relative overflow-hidden rounded-lg bg-white"
				style={{ aspectRatio: `${entry.aspectRatio}` }}
			>
				{entry.imageUrl ? (
					<>
						{shouldRenderImage ? (
							<img
								ref={imageRef}
								src={entry.imageUrl}
								alt={`${entry.file?.file_name || "File"} page ${entry.pageNumber}`}
								className="absolute inset-0 h-full w-full object-contain"
								loading="lazy"
								onLoad={() => onImageReady(entry.key)}
							/>
						) : (
							<div className="absolute inset-0 animate-pulse bg-primaryN30" />
						)}
						{shouldRenderImage &&
							showEvidenceBoxes &&
							sortedEvidences.map((evidence) => {
								const bounds = getEvidenceBounds(evidence);
								if (!bounds) {
									return null;
								}

								const isHighlighted = highlightedEvidenceIds.includes(
									evidence?.id,
								);

								return (
									<div
										key={evidence?.id}
										className={`absolute ${
											isHighlighted
												? "border-2 border-red-normal bg-red-normal/10"
												: "border border-forumBlue-normal bg-[#427CCE]/20"
										}`}
										style={{
											left: `${bounds.left}%`,
											top: `${bounds.top}%`,
											width: `${bounds.width}%`,
											height: `${bounds.height}%`,
										}}
									>
										{/* <span className="absolute -left-[1px] -top-[18px] rounded-sm bg-forumBlue-normal px-1 py-[1px] text-[10px] leading-none text-white">
											{evidenceIndex + 1}
										</span> */}
									</div>
								);
							})}
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
		</div>
	);
}

export default function EvidenceSidebar({
	files,
	selectedFileId,
	selectedItem,
	fileFilter,
	showEvidenceBoxes,
	evidencesByFile,
	onSelectFile,
	onChangeFileFilter,
	onToggleEvidenceBoxes,
	onOpenAddBoxModal,
}: EvidenceSidebarProps) {
	const selectedEvidenceIds = getEvidenceIds(selectedItem);
	const pageRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const lastScrolledItemIdRef = useRef<number | null>(null);
	const lastAutoSyncedItemIdRef = useRef<number | null>(null);
	const [activePageKey, setActivePageKey] = useState<string | null>(null);
	const [targetImageReadyKey, setTargetImageReadyKey] = useState<string | null>(
		null,
	);

	useEffect(() => {
		if (!selectedItem?.id) {
			lastAutoSyncedItemIdRef.current = null;
			lastScrolledItemIdRef.current = null;
			setActivePageKey(null);
			setTargetImageReadyKey(null);
			return;
		}

		if (lastAutoSyncedItemIdRef.current === selectedItem.id) {
			return;
		}

		const selectedItemFileId = String(selectedItem?.project_file_id || "");
		if (fileFilter !== "all" && fileFilter !== selectedItemFileId) {
			onChangeFileFilter(selectedItemFileId);
		}

		lastAutoSyncedItemIdRef.current = selectedItem.id;
	}, [fileFilter, onChangeFileFilter, selectedItem]);

	const visibleFiles = files.filter((file) => {
		if (fileFilter === "all") {
			return true;
		}

		return String(file?.id) === fileFilter;
	});

	const pageEntries = useMemo<PageThumbnailEntry[]>(() => {
		return visibleFiles.flatMap((file) => {
			const imagePages = file?.parse_detail?.image_page_infos || [];
			const fileEvidences = evidencesByFile?.[file?.id] || [];
			const fallbackEvidence =
				fileEvidences.find((evidence) => {
					return (
						Number(evidence?.page_width_pdf || 0) > 0 &&
						Number(evidence?.page_height_pdf || 0) > 0
					);
				}) || null;

			return imagePages.map((pageInfo, pageIndex) => {
				const pageNumber = pageIndex + 1;
				const pageEvidences = fileEvidences.filter((evidence) => {
					return (evidence?.project_file_page_number || 1) === pageNumber;
				});
				const ratioEvidence =
					pageEvidences.find((evidence) => {
						return (
							Number(evidence?.page_width_pdf || 0) > 0 &&
							Number(evidence?.page_height_pdf || 0) > 0
						);
					}) || fallbackEvidence;
				const pageWidth = Number(ratioEvidence?.page_width_pdf || 0);
				const pageHeight = Number(ratioEvidence?.page_height_pdf || 0);
				const aspectRatio =
					pageWidth > 0 && pageHeight > 0 ? pageWidth / pageHeight : 0.75;

				return {
					key: `${file?.id}-${pageNumber}`,
					file,
					pageNumber,
					imageUrl: pageInfo?.s3_url || "",
					pageEvidences,
					aspectRatio,
				};
			});
		});
	}, [evidencesByFile, visibleFiles]);

	const targetPageKey = useMemo(() => {
		if (!selectedItem || !selectedEvidenceIds.length) {
			return null;
		}

		const currentFileEvidences =
			evidencesByFile?.[selectedItem?.project_file_id] || [];
		const targetEvidence = currentFileEvidences.find((evidence) => {
			return selectedEvidenceIds.includes(evidence?.id);
		});

		if (!targetEvidence) {
			return null;
		}

		return `${targetEvidence.project_file_id}-${targetEvidence.project_file_page_number || 1}`;
	}, [evidencesByFile, selectedEvidenceIds, selectedItem]);

	useEffect(() => {
		setTargetImageReadyKey(null);
	}, [targetPageKey]);

	const scrollToPageKey = (
		pageKey: string,
		behavior: ScrollBehavior = "smooth",
	) => {
		const targetElement = pageRefs.current[pageKey];
		if (!targetElement) {
			return;
		}

		targetElement.scrollIntoView({
			behavior,
			block: "center",
		});
	};

	useEffect(() => {
		if (!selectedItem?.id || !targetPageKey) {
			return;
		}

		if (
			lastScrolledItemIdRef.current === selectedItem.id &&
			activePageKey === targetPageKey
		) {
			return;
		}

		const scrollToTarget = () => {
			scrollToPageKey(targetPageKey);
			setActivePageKey(targetPageKey);
		};

		const timer = window.setTimeout(scrollToTarget, 50);

		return () => {
			window.clearTimeout(timer);
		};
	}, [activePageKey, selectedItem, targetPageKey]);

	useEffect(() => {
		if (
			!selectedItem?.id ||
			!targetPageKey ||
			targetImageReadyKey !== targetPageKey
		) {
			return;
		}

		const timer = window.setTimeout(() => {
			scrollToPageKey(targetPageKey);
			setActivePageKey(targetPageKey);
			lastScrolledItemIdRef.current = selectedItem.id;
		}, 80);

		return () => {
			window.clearTimeout(timer);
		};
	}, [selectedItem, targetImageReadyKey, targetPageKey]);

	return (
		<div className="flex h-full w-[470px] flex-col border-l border-primaryN30 pl-5">
			<div className="flex items-center justify-between gap-3 pt-10">
				<div className="flex items-center gap-3">
					<Select
						value={fileFilter}
						onChange={onChangeFileFilter}
						className="w-[205px] [&_.ant-select-selector]:!h-[32px] [&_.ant-select-selector]:!rounded-md [&_.ant-select-selector]:!border-primaryN30 [&_.ant-select-selection-item]:!text-xs [&_.ant-select-selection-item]:!leading-[30px]"
						options={[
							{ label: "All Files", value: "all" },
							...files.map((file, index) => ({
								label: file?.file_name || `File ${index + 1}`,
								value: String(file?.id),
							})),
						]}
					/>
					{/* <Button className="!h-[32px] !rounded-md !border-primaryN30 !px-3 !text-xs !text-grey-dark">
						100%
					</Button> */}
				</div>

				<div className="flex items-center gap-2">
					<Tooltip
						title={showEvidenceBoxes ? "Hide label boxes" : "Show label boxes"}
					>
						<Button
							className="!h-[32px] !w-[32px] !rounded-md !border-primaryN30 !px-0 !text-grey-dark"
							icon={
								showEvidenceBoxes ? <EyeInvisibleOutlined /> : <EyeOutlined />
							}
							onClick={onToggleEvidenceBoxes}
						/>
					</Tooltip>
					{/* <Tooltip title="Open selected preview">
						<Button
							className="!h-[32px] !w-[32px] !rounded-md !border-primaryN30 !px-0 !text-grey-dark"
							icon={<FullscreenOutlined />}
						/>
					</Tooltip> */}
					<Tooltip title="Add box">
						<div
							className="w-[30px] !h-[24px] text-xxs text-forumBlue-dark-active bg-forumBlue-light-active rounded-md flex flex-row justify-center items-center gap-1 cursor-pointer"
							onClick={onOpenAddBoxModal}
						>
							<Image
								src="/assets/icons/add-box.svg"
								alt="add box"
								width={8}
								height={8}
							></Image>
						</div>
					</Tooltip>
				</div>
			</div>

			<div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
				<div className="flex flex-col gap-6 pb-6">
					{pageEntries.map((entry) => {
						return (
							<PageThumbnailCard
								key={entry.key}
								entry={entry}
								highlightedEvidenceIds={selectedEvidenceIds}
								isTargetPage={entry.key === activePageKey}
								isSelectedFile={entry.file?.id === selectedFileId}
								showEvidenceBoxes={showEvidenceBoxes}
								forceLoad={entry.key === targetPageKey}
								onClick={() => {
									onSelectFile(entry.file?.id);
									setActivePageKey(entry.key);
								}}
								onRegisterRef={(key, element) => {
									pageRefs.current[key] = element;
								}}
								onImageReady={(key) => {
									if (key === targetPageKey) {
										setTargetImageReadyKey(key);
									}
								}}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
}
