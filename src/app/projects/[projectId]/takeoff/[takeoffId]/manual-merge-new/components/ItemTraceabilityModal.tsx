"use client";

import { Empty, Image, Modal, Spin, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";

import {
	getFileSourceMergeResultDetailById,
	getSignalFileSourceMergeResultDetailById,
	getMultipleFilesMergeResultDetailById,
	getTakeOffResultItemWithEvidenceUrlsById,
} from "@/services/takeOffService";

// Traceability level types
type TraceabilityLevel =
	| "multiple_files" // Level 1: Multiple files merge result
	| "single_file" // Level 2: Single file merge result
	| "file_source" // Level 3: File source merge result
	| "original"; // Level 4: Original take off result item

interface ItemTraceabilityModalProps {
	open: boolean;
	item: any | null;
	level: TraceabilityLevel;
	columnNames: string[];
	onClose: () => void;
}

interface TraceabilityData {
	currentItem: any;
	singleFileMergeResults?: any[];
	fileSourceMergeResults?: any[];
	takeOffResultItems?: any[];
	evidence?: any;
}

function TruncatedTextCell({ value }: { value: string }) {
	const divRef = useRef<HTMLDivElement>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	useLayoutEffect(() => {
		const element = divRef.current;
		if (element) {
			setIsTruncated(element.scrollWidth > element.clientWidth);
		}
	}, [value]);

	return (
		<div ref={divRef} className="min-h-[20px] truncate">
			{isTruncated ? (
				<Tooltip
					title={value}
					placement="topLeft"
					color="white"
					styles={{
						body: {
							backgroundColor: "#ffffff",
							color: "#333333",
							border: "1px solid #d9d9d9",
							boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
						},
					}}
				>
					<span>{value}</span>
				</Tooltip>
			) : (
				<span>{value || "-"}</span>
			)}
		</div>
	);
}

function parseResult(item: any): Record<string, string> {
	if (!item?.result) return {};
	if (typeof item.result === "string") {
		try {
			return JSON.parse(item.result);
		} catch {
			return {};
		}
	}
	return item.result;
}

function getColumnWidth(fieldName: string): number {
	if (!fieldName) return 100;
	if (fieldName.length >= 25) return 220;
	if (fieldName.length >= 15) return 140;
	if (fieldName.length >= 10) return 120;
	return 100;
}

function TraceabilityTable({
	title,
	description,
	items,
	columnNames,
	onOpenNestedRef,
	showReference = true,
}: {
	title: string;
	description: string;
	items: any[];
	columnNames: string[];
	onOpenNestedRef?: (item: any, level: TraceabilityLevel) => void;
	showReference?: boolean;
}) {
	const tableColumns = useMemo<ColumnsType<any>>(() => {
		const dataColumns = columnNames.map((fieldName) => {
			const isFixed = fieldName === "Label" || fieldName === "Sub Label";

			return {
				title: (
					<div className="whitespace-nowrap text-center text-xs text-grey-normal">
						{fieldName}
					</div>
				),
				key: fieldName,
				dataIndex: fieldName,
				width: isFixed ? 100 : getColumnWidth(fieldName),
				fixed: isFixed ? ("left" as const) : undefined,
				align: "center" as const,
				render: (_: unknown, record: any) => {
					const result = parseResult(record);
					const value = result[fieldName];
					const displayValue =
						typeof value === "object"
							? JSON.stringify(value)
							: String(value || "-");

					return (
						<div className="mx-auto w-full max-w-[180px] overflow-hidden text-xs">
							<TruncatedTextCell value={displayValue} />
						</div>
					);
				},
			};
		});

		if (showReference && onOpenNestedRef) {
			const referenceColumn: ColumnsType<any>[number] = {
				title: (
					<div className="text-center text-xs text-grey-normal">Reference</div>
				),
				key: "reference",
				width: 90,
				fixed: "right",
				align: "center",
				render: (_: unknown, record: any) => {
					return (
						<button
							type="button"
							className="inline-flex h-6 items-center gap-1 px-2 text-[10px] transition-colors hover:opacity-70"
							onClick={(event) => {
								event.stopPropagation();
								onOpenNestedRef(record, "original");
							}}
						>
							<NextImage
								src="/assets/icons/file-refrence.svg"
								alt=""
								width={14}
								height={14}
							/>
						</button>
					);
				},
			};
			return [...dataColumns, referenceColumn];
		}

		return dataColumns;
	}, [columnNames, onOpenNestedRef, showReference]);

	const dataWithKeys = useMemo(() => {
		return items.map((item, index) => ({
			...item,
			_key: item.id || item.key || `item-${index}`,
		}));
	}, [items]);

	return (
		<div className="rounded-xl border border-primaryN30 bg-white overflow-hidden">
			<div className="border-b border-primaryN30 px-4 py-3 bg-[#FBFBFC]">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-grey-dark">{title}</span>
					<span className="rounded-full bg-[#EEF5FF] px-2 py-0.5 text-xs text-forumBlue-normal">
						{items.length}
					</span>
				</div>
				<div className="mt-1 text-xs text-grey-normal">{description}</div>
			</div>
			{items.length > 0 ? (
				<Table
					rowKey={(record) => record._key}
					columns={tableColumns}
					dataSource={dataWithKeys}
					pagination={false}
					scroll={{ x: "max-content", y: 200 }}
					locale={{
						emptyText: (
							<div className="py-6 text-xs text-grey-normal">
								No items found.
							</div>
						),
					}}
					className="[&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2.5 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
				/>
			) : (
				<div className="flex h-[100px] items-center justify-center">
					<Empty
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						description={
							<span className="text-xs text-grey-normal">No items</span>
						}
					/>
				</div>
			)}
		</div>
	);
}

function OriginalItemView({ item, evidence }: { item: any; evidence: any }) {
	const [zoom, setZoom] = useState(1);
	const imageRef = useRef<HTMLImageElement>(null);

	const itemResult = parseResult(item);
	const fieldEntries = Object.entries(itemResult).filter(
		([key]) => key !== "Source Type",
	) as [string, string][];

	const evidenceUrl = evidence?.evidence_url || "";

	return (
		<div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] gap-5">
			{/* Left: Item details */}
			<div className="flex min-h-0 flex-col rounded-2xl border border-primaryN30 bg-white">
				<div className="border-b border-primaryN30 px-4 py-3">
					<div className="text-xs font-medium text-grey-dark">Item Details</div>
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

			{/* Right: Evidence image */}
			<div className="flex min-h-0 flex-col rounded-2xl border border-primaryN30 bg-white">
				<div className="flex items-center justify-between border-b border-primaryN30 px-4 py-2.5">
					<div className="text-xs font-medium text-grey-dark">
						Evidence Image
					</div>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => setZoom((prev) => Math.max(0.25, prev - 0.25))}
							disabled={zoom <= 0.25}
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
							onClick={() => setZoom(1)}
							className="flex h-7 min-w-[52px] items-center justify-center rounded-md border border-primaryN30 bg-white px-2 text-[11px] text-grey-dark transition-colors hover:border-forumBlue-normal hover:text-forumBlue-normal"
						>
							{Math.round(zoom * 100)}%
						</button>
						<button
							type="button"
							onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))}
							disabled={zoom >= 3}
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

				<div className="min-h-0 flex-1 overflow-auto bg-[#FBFBFC] p-4">
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
								/>
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
	);
}

export default function ItemTraceabilityModal({
	open,
	item,
	level,
	columnNames,
	onClose,
}: ItemTraceabilityModalProps) {
	const [loading, setLoading] = useState(false);
	const [traceData, setTraceData] = useState<TraceabilityData | null>(null);
	const [nestedModalOpen, setNestedModalOpen] = useState(false);
	const [nestedItem, setNestedItem] = useState<any>(null);
	const [nestedLevel, setNestedLevel] = useState<TraceabilityLevel>("original");

	useEffect(() => {
		if (!open || !item) {
			setTraceData(null);
			return;
		}

		const fetchData = async () => {
			setLoading(true);
			try {
				let response: any;
				const itemId = item.id;

				if (level === "multiple_files") {
					response = await getMultipleFilesMergeResultDetailById(itemId);
				} else if (level === "single_file") {
					response = await getSignalFileSourceMergeResultDetailById(itemId);
				} else if (level === "file_source") {
					response = await getFileSourceMergeResultDetailById(itemId);
				} else if (level === "original") {
					response = await getTakeOffResultItemWithEvidenceUrlsById(itemId);
				}

				if (response?.status === "success" && response.data) {
					const data = response.data;
					if (level === "original") {
						setTraceData({
							currentItem: data.take_off_result_item || data,
							evidence: data.evidence || data.evidences?.[0],
						});
					} else {
						setTraceData({
							currentItem: data,
							singleFileMergeResults: data.single_file_merge_results || [],
							fileSourceMergeResults: data.file_source_merge_results || [],
							takeOffResultItems: data.take_off_result_items || [],
							evidence: data.evidence,
						});
					}
				}
			} catch (error) {
				console.error("Error fetching traceability data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [open, item?.id, level]);

	const handleClose = () => {
		setTraceData(null);
		setLoading(false);
		onClose();
	};

	const handleOpenNestedRef = (
		nestedItem: any,
		nestedLevel: TraceabilityLevel,
	) => {
		setNestedItem(nestedItem);
		setNestedLevel(nestedLevel);
		setNestedModalOpen(true);
	};

	const handleCloseNestedRef = () => {
		setNestedModalOpen(false);
		setNestedItem(null);
	};

	const currentResult = parseResult(traceData?.currentItem || item);
	const currentFieldEntries = Object.entries(currentResult).filter(
		([key]) => key !== "Source Type",
	) as [string, string][];

	const getLevelTitle = () => {
		switch (level) {
			case "multiple_files":
				return "Multiple Files Merge Traceability";
			case "single_file":
				return "Single File Merge Traceability";
			case "file_source":
				return "Source Type Merge Traceability";
			case "original":
				return "Original Item Reference";
			default:
				return "Item Traceability";
		}
	};

	const getLevelDescription = () => {
		switch (level) {
			case "multiple_files":
				return "View the source items from multiple files that were merged into this result.";
			case "single_file":
				return "View the source items from different source types that were merged into this result.";
			case "file_source":
				return "View the original items that were merged into this source type result.";
			case "original":
				return "View the evidence image for this original item.";
			default:
				return "";
		}
	};

	return (
		<>
			<Modal
				open={open}
				onCancel={handleClose}
				footer={null}
				title={null}
				centered
				width={level === "original" ? "80vw" : "90vw"}
				destroyOnClose
				closable={false}
				zIndex={1040}
			>
				<div className="flex h-[80vh] min-h-[600px] flex-col gap-4 overflow-hidden p-2 font-nunito">
					{/* Header */}
					<div className="flex items-start justify-between gap-4">
						<div>
							<div className="text-base text-forumBlue-normal">
								{getLevelTitle()}
							</div>
							<div className="mt-1 text-xs text-grey-normal">
								{getLevelDescription()}
							</div>
						</div>
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

					{/* Current item summary */}
					<div className="shrink-0 rounded-xl border border-primaryN30 bg-[#EDF7EE] px-5 py-3">
						<div className="mb-2 flex items-center gap-2">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<circle
									cx="8"
									cy="8"
									r="7"
									stroke="#52C41A"
									strokeWidth="1.5"
								/>
								<path
									d="M5 8L7 10L11 6"
									stroke="#52C41A"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<span className="text-xs font-medium text-[#389E0D]">
								Current Item
							</span>
						</div>
						<div className="flex flex-wrap gap-x-5 gap-y-1">
							{currentFieldEntries.slice(0, 12).map(([key, value]) => (
								<div key={key} className="flex items-center gap-1 text-[11px]">
									<span className="text-grey-normal">{key}:</span>
									<span className="font-medium text-grey-dark">
										{typeof value === "object"
											? JSON.stringify(value)
											: String(value) || "—"}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Content based on level */}
					{loading ? (
						<div className="flex flex-1 items-center justify-center">
							<Spin size="large" />
						</div>
					) : level === "original" ? (
						<OriginalItemView
							item={traceData?.currentItem || item}
							evidence={
								traceData?.evidence || item?.evidence_msg || item?.evidence
							}
						/>
					) : (
						<div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
							{/* Level 1: Multiple files - show 3 tables */}
							{level === "multiple_files" && (
								<>
									{traceData?.singleFileMergeResults &&
										traceData.singleFileMergeResults.length > 0 && (
											<TraceabilityTable
												title="Single File Merge Results"
												description="Items merged within each file"
												items={traceData.singleFileMergeResults}
												columnNames={columnNames}
												onOpenNestedRef={(item) =>
													handleOpenNestedRef(item, "single_file")
												}
											/>
										)}
									{traceData?.fileSourceMergeResults &&
										traceData.fileSourceMergeResults.length > 0 && (
											<TraceabilityTable
												title="Source Type Merge Results"
												description="Items merged within each source type"
												items={traceData.fileSourceMergeResults}
												columnNames={columnNames}
												onOpenNestedRef={(item) =>
													handleOpenNestedRef(item, "file_source")
												}
											/>
										)}
									{traceData?.takeOffResultItems &&
										traceData.takeOffResultItems.length > 0 && (
											<TraceabilityTable
												title="Original Items"
												description="Original extracted items from PDF"
												items={traceData.takeOffResultItems}
												columnNames={columnNames}
												onOpenNestedRef={(item) =>
													handleOpenNestedRef(item, "original")
												}
											/>
										)}
								</>
							)}

							{/* Level 2: Single file - show 2 tables */}
							{level === "single_file" && (
								<>
									{traceData?.fileSourceMergeResults &&
										traceData.fileSourceMergeResults.length > 0 && (
											<TraceabilityTable
												title="Source Type Merge Results"
												description="Items merged within each source type"
												items={traceData.fileSourceMergeResults}
												columnNames={columnNames}
												onOpenNestedRef={(item) =>
													handleOpenNestedRef(item, "file_source")
												}
											/>
										)}
									{traceData?.takeOffResultItems &&
										traceData.takeOffResultItems.length > 0 && (
											<TraceabilityTable
												title="Original Items"
												description="Original extracted items from PDF"
												items={traceData.takeOffResultItems}
												columnNames={columnNames}
												onOpenNestedRef={(item) =>
													handleOpenNestedRef(item, "original")
												}
											/>
										)}
								</>
							)}

							{/* Level 3: File source - show 1 table */}
							{level === "file_source" && (
								<>
									{traceData?.takeOffResultItems &&
										traceData.takeOffResultItems.length > 0 && (
											<TraceabilityTable
												title="Original Items"
												description="Original extracted items from PDF"
												items={traceData.takeOffResultItems}
												columnNames={columnNames}
												onOpenNestedRef={(item) =>
													handleOpenNestedRef(item, "original")
												}
											/>
										)}
								</>
							)}

							{/* Empty state */}
							{!traceData?.singleFileMergeResults?.length &&
								!traceData?.fileSourceMergeResults?.length &&
								!traceData?.takeOffResultItems?.length && (
									<div className="flex h-full items-center justify-center">
										<Empty
											image={Empty.PRESENTED_IMAGE_SIMPLE}
											description={
												<span className="text-xs text-grey-normal">
													No traceability data available for this item.
												</span>
											}
										/>
									</div>
								)}
						</div>
					)}
				</div>
			</Modal>

			{/* Nested modal for drilling down - only render when open */}
			{nestedModalOpen && nestedItem && (
				<ItemTraceabilityModal
					open={nestedModalOpen}
					item={nestedItem}
					level={nestedLevel}
					columnNames={columnNames}
					onClose={handleCloseNestedRef}
				/>
			)}
		</>
	);
}
