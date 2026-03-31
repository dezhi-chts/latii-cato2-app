"use client";

import { Empty, Image, Modal, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";

import OriginalItemReferenceModal from "./OriginalItemReferenceModal";
import { ProjectFileRecord } from "../../analyze-new/types";

interface MergedItemReferenceModalProps {
	open: boolean;
	projectId: string;
	files?: ProjectFileRecord[];
	mergedItem: any | null;
	onClose: () => void;
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

export default function MergedItemReferenceModal({
	open,
	projectId,
	files,
	mergedItem,
	onClose,
}: MergedItemReferenceModalProps) {
	const [nestedRefOpen, setNestedRefOpen] = useState(false);
	const [nestedRefItem, setNestedRefItem] = useState<any | null>(null);

	const mergedResult = useMemo(() => {
		if (!mergedItem) return {};
		if (typeof mergedItem.result === "string") {
			try {
				return JSON.parse(mergedItem.result);
			} catch {
				return {};
			}
		}
		return mergedItem.result || {};
	}, [mergedItem]);

	const mergedFieldEntries = useMemo(() => {
		return Object.entries(mergedResult).filter(
			([key]) => key !== "Source Type",
		) as [string, string][];
	}, [mergedResult]);

	const sourceItems: any[] = useMemo(() => {
		if (!mergedItem?.mergedFromRows) return [];
		return mergedItem.mergedFromRows.map((item: any, index: number) => ({
			...item,
			_index: index,
			_key: item.key || item.id || `source-${index}`,
		}));
	}, [mergedItem]);

	const parseResult = (item: any): Record<string, string> => {
		if (!item?.result) return {};
		if (typeof item.result === "string") {
			try {
				return JSON.parse(item.result);
			} catch {
				return {};
			}
		}
		return item.result;
	};

	const columnNames = useMemo(() => {
		const priorityFields = ["Label", "Sub Label", "Product", "Product Type", "Operability", "Width", "Height", "Quantity"];
		const fieldSet = new Set<string>();
		sourceItems.forEach((item) => {
			const result = parseResult(item);
			Object.keys(result).forEach((key) => {
				if (key !== "Source Type") fieldSet.add(key);
			});
		});
		const allFields = Array.from(fieldSet);
		const sorted = priorityFields.filter((f) => allFields.includes(f));
		allFields.forEach((f) => {
			if (!sorted.includes(f)) sorted.push(f);
		});
		return sorted;
	}, [sourceItems]);

	const handleOpenNestedRef = (item: any) => {
		setNestedRefItem(item);
		setNestedRefOpen(true);
	};

	const getColumnWidth = (fieldName: string) => {
		if (!fieldName) return 100;
		if (fieldName.length >= 25) return 220;
		if (fieldName.length >= 15) return 140;
		if (fieldName.length >= 10) return 120;
		return 100;
	};

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
					const displayValue = typeof value === "object" 
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

		const evidenceColumn: ColumnsType<any>[number] = {
			title: (
				<div className="text-center text-xs text-grey-normal">Evidence</div>
			),
			key: "evidence",
			width: 120,
			align: "center",
			render: (_: unknown, record: any) => {
				const evidenceUrl =
					record.evidence_msg?.s3_url ||
					(Array.isArray(record.evidence_msg)
						? record.evidence_msg[0]?.s3_url
						: "") ||
					"";

				return evidenceUrl ? (
					<div className="flex justify-center">
						<Image
							src={evidenceUrl}
							alt="Evidence"
							width={80}
							height={60}
							style={{ objectFit: "cover" }}
							className="rounded border border-primaryN30"
							preview={{ zIndex: 1100 }}
						/>
					</div>
				) : (
					<span className="text-[10px] text-grey-normal">No image</span>
				);
			},
		};

		const referenceColumn: ColumnsType<any>[number] = {
			title: (
				<div className="text-center text-xs text-grey-normal">Reference</div>
			),
			key: "reference",
			width: 90,
			fixed: "right",
			align: "center",
			render: (_: unknown, record: any) => {
				const evidenceUrl =
					record.evidence_msg?.s3_url ||
					(Array.isArray(record.evidence_msg)
						? record.evidence_msg[0]?.s3_url
						: "") ||
					"";

				return (
					<button
						type="button"
						disabled={!evidenceUrl}
						className="inline-flex h-6 items-center gap-1 px-2 text-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
						onClick={(event) => {
							event.stopPropagation();
							if (evidenceUrl) {
								handleOpenNestedRef(record);
							}
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

		return [...dataColumns, evidenceColumn, referenceColumn];
	}, [columnNames]);

	return (
		<>
			<Modal
				open={open}
				onCancel={onClose}
				footer={null}
				title={null}
				centered
				width="90vw"
				destroyOnClose
				closable={false}
				zIndex={1040}
			>
				<div className="flex h-[80vh] min-h-[600px] flex-col gap-4 overflow-hidden p-2 font-nunito">
					{/* Header */}
					<div className="flex items-start justify-between gap-4">
						<div>
							<div className="text-base text-forumBlue-normal">
								Merged Item Traceability
							</div>
							<div className="mt-1 text-xs text-grey-normal">
								Review the source items that were merged into this result.
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
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

					{/* Merged item summary */}
					<div className="shrink-0 rounded-xl border border-primaryN30 bg-[#EDF7EE] px-5 py-3">
						<div className="mb-2 flex items-center gap-2">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<circle cx="8" cy="8" r="7" stroke="#52C41A" strokeWidth="1.5" />
								<path
									d="M5 8L7 10L11 6"
									stroke="#52C41A"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<span className="text-xs font-medium text-[#389E0D]">
								Merged Result
							</span>
							<span className="ml-2 text-xs text-grey-normal">
								from {sourceItems.length} source items
							</span>
						</div>
						<div className="flex flex-wrap gap-x-5 gap-y-1">
							{mergedFieldEntries.slice(0, 12).map(([key, value]) => (
								<div key={key} className="flex items-center gap-1 text-[11px]">
									<span className="text-grey-normal">{key}:</span>
									<span className="font-medium text-grey-dark">
										{typeof value === "object" ? JSON.stringify(value) : String(value) || "—"}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Source items table */}
					<div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-primaryN30 bg-white">
						{sourceItems.length > 0 ? (
							<Table
								rowKey={(record) => record._key}
								columns={tableColumns}
								dataSource={sourceItems}
								pagination={false}
								scroll={{ x: "max-content", y: "calc(80vh - 280px)" }}
								locale={{
									emptyText: (
										<div className="py-10 text-xs text-grey-normal">
											No source items found.
										</div>
									),
								}}
								className="[&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2.5 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
							/>
						) : (
							<div className="flex h-full items-center justify-center">
								<Empty
									image={Empty.PRESENTED_IMAGE_SIMPLE}
									description={
										<span className="text-xs text-grey-normal">
											No source item information available for this merged item.
										</span>
									}
								/>
							</div>
						)}
					</div>
				</div>
			</Modal>

			{/* Nested original item reference modal */}
			<OriginalItemReferenceModal
				open={nestedRefOpen}
				projectId={projectId}
				files={files}
				item={nestedRefItem}
				onClose={() => {
					setNestedRefOpen(false);
					setNestedRefItem(null);
				}}
			/>
		</>
	);
}
