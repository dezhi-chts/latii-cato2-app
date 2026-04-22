"use client";

import Image from "next/image";
import { Button, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TakeoffItemRecord } from "../../analyze-new/types";
import { FileOperationType } from "../../types/evidence";

export interface MergeFileRow {
	id: number;
	key: string;
	result: Record<string, string>;
	isMerged?: boolean;
	mergedFromRows?: MergeFileRow[];
	evidence_id_list?: number[];
	evidence_msg?: {
		s3_url?: string;
		type?: string;
		project_file_id?: number;
		project_file_page_number?: number;
	};
}

export interface MergeSourceSection {
	key: string;
	title: string;
	count: number;
	conflictCount?: number;
	rows: MergeFileRow[];
}

interface MergeFileCardProps {
	fileName: string;
	fileType: string;
	operationType: string;
	labelsCount: number;
	conflictCount: number;
	hasBlockingConflicts: boolean;
	columns: string[];
	sections: MergeSourceSection[];
	onMergeFile: () => void;
	onMergeSource: (sourceTitle: string) => void;
	onOpenReferenceModal: (item: TakeoffItemRecord) => void;
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

const getColumnWidth = (title: string) => {
	if (!title) {
		return 100;
	}

	if (title.length >= 25) {
		return 220;
	}

	if (title.length >= 15) {
		return 140;
	}

	if (title.length >= 10) {
		return 120;
	}

	return 100;
};

export default function MergeFileCard({
	fileName,
	fileType,
	operationType,
	labelsCount,
	conflictCount,
	hasBlockingConflicts,
	columns,
	sections,
	onMergeFile,
	onMergeSource,
	onOpenReferenceModal,
}: MergeFileCardProps) {
	const [activeSectionKey, setActiveSectionKey] = useState<string>(
		sections.find((section) => section.rows.length > 0)?.key ||
			sections[0]?.key ||
			"",
	);
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 20;

	useEffect(() => {
		const nextActiveSection =
			sections.find((section) => section.key === activeSectionKey) ||
			sections.find((section) => section.rows.length > 0) ||
			sections[0];

		setActiveSectionKey(nextActiveSection?.key || "");
	}, [activeSectionKey, sections]);

	useEffect(() => {
		setCurrentPage(1);
	}, [activeSectionKey]);

	const activeSection = useMemo(() => {
		return (
			sections.find((section) => section.key === activeSectionKey) ||
			sections[0]
		);
	}, [activeSectionKey, sections]);

	const paginatedRows = useMemo(() => {
		const rows = activeSection?.rows || [];
		const startIndex = (currentPage - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		return rows.slice(startIndex, endIndex);
	}, [activeSection?.rows, currentPage, pageSize]);

	const tableColumns = useMemo<ColumnsType<MergeFileRow>>(() => {
		const dataColumns = columns.map((fieldName) => {
			const isLabelColumn = fieldName === "Label";
			const isSubLabelColumn = fieldName === "Sub Label";

			return {
				title: (
					<div className="whitespace-nowrap text-center text-xs text-grey-normal">
						{fieldName}
					</div>
				),
				key: fieldName,
				dataIndex: fieldName,
				width:
					fieldName === "Label" || fieldName === "Sub Label"
						? 120
						: getColumnWidth(fieldName),
				fixed:
					isLabelColumn || isSubLabelColumn ? ("left" as const) : undefined,
				align: "center" as const,
				render: (_: unknown, record: MergeFileRow) => {
					const displayValue = record?.result?.[fieldName] || "-";

					return (
						<div className="mx-auto w-full max-w-[200px] overflow-hidden text-xs">
							<TruncatedTextCell value={displayValue} />
						</div>
					);
				},
			};
		});

		const referenceColumn: ColumnsType<MergeFileRow>[number] = {
			title: (
				<div className="text-center text-xs text-grey-normal">Reference</div>
			),
			key: "reference",
			width: 80,
			fixed: "right",
			align: "center",
			render: (_: unknown, record: MergeFileRow) => {
				return (
					<button
						type="button"
						className="inline-flex h-6 items-center gap-1 px-2 text-[10px] transition-colors hover:opacity-70"
						onClick={(event) => {
							event.stopPropagation();
							onOpenReferenceModal(record as unknown as TakeoffItemRecord);
						}}
					>
						<Image
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
	}, [columns, onOpenReferenceModal]);

	return (
		<div className="flex min-w-0 flex-col rounded-[24px] border border-primaryN30 bg-orange-300 p-6 shadow-[0_12px_34px_rgba(16,24,40,0.05)]">
			<div className="mb-6 flex items-start justify-between gap-4">
				<div className="min-w-0">
					<div className="truncate text-base text-grey-dark">{fileName}</div>
					<div className="mt-3 flex flex-wrap gap-2">
						<div className="rounded-full bg-[#EEF5FF] px-3 py-1 text-xxs text-forumBlue-normal">
							{labelsCount} Labels
						</div>
						<div className="rounded-full bg-grey-light-hover px-3 py-1 text-xxs text-grey-normal">
							{fileType}
						</div>
						{/* <div
							className={`rounded-full px-3 py-1 text-xxs ${
								conflictCount
									? "bg-[#FFF1F0] text-[#D14343]"
									: "bg-[#EDF7EE] text-[#3F8C4C]"
							}`}
						>
							{conflictCount ? `${conflictCount} Conflicts` : "No Conflicts"}
						</div> */}
					</div>
				</div>

				<Button
					className="custom-primary-btn !w-[160px]"
					disabled={hasBlockingConflicts}
					onClick={onMergeFile}
				>
					Merge File Labels
				</Button>
			</div>

			<div className="mb-4 rounded-2xl border border-primaryN30 bg-[#FCFCFD] p-3">
				<div className="flex flex-wrap items-center gap-2">
					{sections.map((section) => {
						const isActive = section.key === activeSection?.key;

						return (
							<button
								key={section.key}
								type="button"
								className={`inline-flex h-7 items-center gap-2 rounded-xl px-3 transition-colors ${
									isActive
										? "bg-forumBlue-normal text-white shadow-[0_6px_16px_rgba(66,124,206,0.2)]"
										: "bg-white text-grey-normal hover:text-forumBlue-normal"
								}`}
								onClick={() => setActiveSectionKey(section.key)}
							>
								<span className="text-xs">{section.title}</span>
								<span
									className={`rounded-full px-2 py-[1px] text-[10px] ${
										isActive
											? "bg-white/20 text-white"
											: "bg-grey-light-hover text-grey-normal"
									}`}
								>
									{section.count}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			<div className="mb-4 flex items-center justify-between gap-3">
				<div>
					<div className="text-sm text-grey-dark">
						{activeSection?.title || "Source"}
					</div>
					<div className="mt-1 text-[11px] text-grey-normal">
						{activeSection?.conflictCount
							? `Resolve ${activeSection.conflictCount} mock conflicts in this section.`
							: "Review labels for the selected source before merging."}
					</div>
				</div>

				<div className="flex items-center gap-2">
					{(operationType === FileOperationType.ArchitectureDrawing ||
						operationType === FileOperationType.Quote) && (
						<button
							type="button"
							disabled={!activeSection?.conflictCount}
							className="inline-flex h-8 shrink-0 items-center rounded-md border border-primaryN30 bg-grey-normal px-3 text-xs text-grey-normal transition-colors hover:border-forumBlue-normal hover:text-forumBlue-normal disabled:cursor-not-allowed disabled:border-primaryN30 disabled:bg-white disabled:text-grey-light"
							onClick={() =>
								activeSection && onMergeSource(activeSection.title)
							}
						>
							{operationType === FileOperationType.ArchitectureDrawing
								? `Merge ${activeSection?.title || "Source"}`
								: "Merge All Labels"}
						</button>
					)}
					{/* {activeSection?.conflictCount ? (
						<button
							type="button"
							className="inline-flex h-8 min-w-[40px] items-center justify-center rounded-full border border-[#F97066] bg-[#F97066] px-3 text-xs font-medium text-white"
						>
							{activeSection.conflictCount}
						</button>
					) : null} */}
				</div>
			</div>

			<div className="min-h-0 flex-1 rounded-xl border border-primaryN30 bg-white">
				<Table<MergeFileRow>
					rowKey={(record) => record.id}
					columns={tableColumns}
					dataSource={paginatedRows}
					pagination={{
						current: currentPage,
						pageSize: pageSize,
						total: activeSection?.rows?.length || 0,
						showSizeChanger: false,
						showTotal: (total) => `Total ${total} items`,
						onChange: (page) => setCurrentPage(page),
						size: "small",
						position: ["bottomRight"],
					}}
					scroll={{
						x: "max-content",
						y: "calc(100vh - 500px)",
					}}
					locale={{
						emptyText: (
							<div className="py-10 text-xs text-grey-normal">
								No labels found for this source.
							</div>
						),
					}}
					className="[&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-3 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-3 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal [&_.ant-pagination]:!my-3 [&_.ant-pagination]:!px-4 [&_.ant-pagination]:!text-xs"
				/>
			</div>
		</div>
	);
}
