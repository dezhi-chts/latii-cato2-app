"use client";

import Image from "next/image";
import { Button, Empty, Modal, notification, Spin, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams, useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { FileViewStep, useTakeoff } from "@/context/TakeoffContext";

import ManualMergeModal from "./components/ManualMergeModal";
import OriginalItemReferenceModal from "./components/OriginalItemReferenceModal";
import MergedItemReferenceModal from "./components/MergedItemReferenceModal";
import { ProjectFileRecord, TakeoffItemRecord } from "../analyze-new/types";
import { FileOperationType, FileStatus, PageType } from "../types/evidence";
import { getTakeOffById } from "@/services/takeOffService";
import {
	getTakeOffResultByFile,
	autoMergeByFileSource,
	getMergeResultByFileSource,
	getMergeResultByFileSourceList,
	autoMergeByFileSourceList,
	manualMergeByFileSource,
	autoMergeAllSourceTypesByFile,
	getAllGroupedByFile,
	manualMergeByFile,
	autoMergeAllFilesByTakeOff,
	getAllGroupedByTakeOff,
	manualMergeByTakeOff,
} from "@/services/mergeService";
import { getTemplateById } from "@/services/templateService";
import testData from "./test.json";

type WorkflowStage = "unmerged" | "merged" | "ready" | "merge-all";
type StepState = "pending" | "active" | "completed";

interface ManualMergeContext {
	fileId: number;
	mode: "section" | "ready";
	sectionKey?: string;
	sourceType?: string;
}

interface NormalizedFileSection {
	key: string;
	title: string;
	items: any[];
	groupedItems: Record<string, any[]>;
}

interface MergeWorkflowRow extends TakeoffItemRecord {
	key: string;
	result: Record<string, string>;
	sourceType: string;
	isMerged?: boolean;
	mergedFromRows?: MergeWorkflowRow[];
	fileSourceMergeResultId?: number;
	singleFileMergeResultId?: number;
	[key: string]: any;
}

interface MergeWorkflowSection {
	key: string;
	title: string;
	rows: MergeWorkflowRow[];
	groupedRows: Record<string, MergeWorkflowRow[]>;
	autoMergeStarted: boolean;
	autoMergedRows: MergeWorkflowRow[];
	pendingRows: MergeWorkflowRow[];
	manualMergeCompleted: boolean;
}

// Source merge status for each source type (Floor Plan, Elevation, Schedule)
interface SourceMergeStatus {
	autoMerged: boolean;
	manualMergeCompleted: boolean;
	dataLoaded: boolean;
}

// File-level merge status tracking
interface FileMergeStatus {
	// Stage 1: Unmerged data loaded
	unmergedDataLoaded: boolean;
	// Stage 2: Source merge status (for ArchDrawing: 3 sources, for Quote: 1 source)
	sourceMergeStatus: Record<string, SourceMergeStatus>;
	// Stage 3: All sources merged into one
	allSourcesMerged: boolean;
	readyDataLoaded: boolean;
	readyManualMergeCompleted: boolean;
}

interface MergeWorkflowFile {
	id: number;
	fileName: string;
	fileType: string;
	operationType: string;
	labelsCount: number;
	// Merge status tracking
	mergeStatus: FileMergeStatus;
	// Stage data (loaded on demand)
	unmergedSections: MergeWorkflowSection[];
	mergedSections: MergeWorkflowSection[];
	readyAutoMergedRows: MergeWorkflowRow[];
	readyPendingRows: MergeWorkflowRow[];
	// Legacy fields for compatibility
	sections: MergeWorkflowSection[];
	sourceMergeStarted: boolean;
	readyManualMergeCompleted: boolean;
}

const ARCHITECTURE_SECTION_ORDER = [
	PageType.FloorPlan,
	PageType.Elevation,
	PageType.Schedule,
] as const;

const STAGE_META: Record<
	WorkflowStage,
	{ title: string; description: string }
> = {
	unmerged: {
		title: "Unmerged",
		description: "Original extracted labels before auto merge",
	},
	merged: {
		title: "Merged",
		description: "Auto merge results and manual merge follow-up",
	},
	ready: {
		title: "Ready",
		description: "File-level merge results ready for final review",
	},
	"merge-all": {
		title: "Merge All",
		description: "All files merged results",
	},
};

interface MergeAllResult {
	autoMergedRows: MergeWorkflowRow[];
	unmergedRows: MergeWorkflowRow[];
}

const createMockTakeoffItem = (
	id: number,
	result: Record<string, unknown>,
	evidenceId: number,
	sourceType: string,
	projectFileId = 380,
	pageNumber = 1,
) => ({
	id,
	evidence_id: evidenceId,
	evidence_id_list: [evidenceId],
	result,
	isMerged: false,
	evidence_msg: {
		id: evidenceId,
		type: sourceType,
		s3_url: "",
		project_file_page_number: pageNumber,
		project_file_id: projectFileId,
	},
});

const MOCK_ARCHITECTURE_RESULT = testData.Arch_data;

const MOCK_QUOTE_RESULT = testData.Quote_data;

const MOCK_PROJECT_FILES: (ProjectFileRecord & { operation_type?: string })[] =
	testData.file_list;

const MOCK_FILE_RESULT_PAYLOADS: Record<number, unknown> = {
	380: MOCK_ARCHITECTURE_RESULT,
	381: MOCK_QUOTE_RESULT,
};

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

function MergeTableHeader({
	type,
	count,
	showManualMergeButton,
	onManualMerge,
	loadingActionKey,
}: {
	type: "merged" | "unmerged";
	count: number;
	showManualMergeButton?: boolean;
	onManualMerge?: () => void;
	loadingActionKey?: string | null;
}) {
	const isMerged = type === "merged";

	return (
		<div className="mb-4 flex items-center justify-between">
			<div className="flex items-center gap-3">
				<div
					className={`flex h-7 w-7 items-center justify-center rounded-full ${
						isMerged ? "bg-[#EDF7EE]" : "bg-[#FFF1F0]"
					}`}
				>
					{isMerged ? (
						<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
							<path
								d="M13.3334 4L6.00008 11.3333L2.66675 8"
								stroke="#3F8C4C"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					) : (
						<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
							<path
								d="M8 5.33333V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
								stroke="#D14343"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					)}
				</div>
				<div>
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-grey-dark">
							{isMerged ? "Merged" : "Unmerged"}
						</span>
						<span
							className={`rounded-full px-2 py-0.5 text-xs ${
								isMerged
									? "bg-[#EDF7EE] text-[#3F8C4C]"
									: "bg-[#FFF1F0] text-[#D14343]"
							}`}
						>
							{count}
						</span>
					</div>
					<div className="mt-0.5 text-xs text-grey-normal">
						{isMerged
							? "Labels that have been automatically merged"
							: "Labels that require manual merge to resolve conflicts"}
					</div>
				</div>
			</div>
			{showManualMergeButton && onManualMerge && (
				<Button
					className="custom-primary-btn !w-[130px]"
					disabled={Boolean(loadingActionKey)}
					onClick={onManualMerge}
				>
					Manual Merge
				</Button>
			)}
		</div>
	);
}

function MergeRowsTable({
	rows,
	columns,
	emptyText,
	onOpenReferenceModal,
	scrollY,
}: {
	title?: string;
	description?: string;
	rows: MergeWorkflowRow[];
	columns: string[];
	emptyText: string;
	onOpenReferenceModal: (row: MergeWorkflowRow) => void;
	hideHeader?: boolean;
	scrollY?: string;
}) {
	const tableColumns = useMemo<ColumnsType<MergeWorkflowRow>>(() => {
		const getColumnWidth = (fieldName: string) => {
			if (!fieldName) {
				return 100;
			}

			if (fieldName.length >= 25) {
				return 220;
			}

			if (fieldName.length >= 15) {
				return 140;
			}

			if (fieldName.length >= 10) {
				return 120;
			}

			return 100;
		};

		const dataColumns = columns.map((fieldName) => {
			const isFixed = fieldName === "Label" || fieldName === "Sub Label";

			return {
				title: (
					<div className="whitespace-nowrap text-center text-xs text-grey-normal">
						{fieldName}
					</div>
				),
				key: fieldName,
				dataIndex: fieldName,
				width: isFixed ? 120 : getColumnWidth(fieldName),
				fixed: isFixed ? ("left" as const) : undefined,
				align: "center" as const,
				render: (_: unknown, record: MergeWorkflowRow) => {
					const displayValue = record.result?.[fieldName] || "-";

					return (
						<div className="mx-auto w-full max-w-[200px] overflow-hidden text-xs">
							<TruncatedTextCell value={displayValue} />
						</div>
					);
				},
			};
		});

		const referenceColumn: ColumnsType<MergeWorkflowRow>[number] = {
			title: (
				<div className="text-center text-xs text-grey-normal">Reference</div>
			),
			key: "reference",
			width: 96,
			fixed: "right",
			align: "center",
			render: (_: unknown, record: MergeWorkflowRow) => {
				const evidenceCount =
					record?.evidence_id_list?.length ||
					(Array.isArray(record?.evidence_msg)
						? record.evidence_msg.length
						: 0) ||
					(record?.evidence_msg?.s3_url ? 1 : 0);

				return (
					<button
						type="button"
						disabled={!evidenceCount}
						className="inline-flex h-6 items-center gap-1 px-2 text-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
						onClick={(event) => {
							event.stopPropagation();
							if (evidenceCount) {
								onOpenReferenceModal(record);
							}
						}}
					>
						<Image
							src="/assets/icons/file-refrence.svg"
							alt=""
							width={14}
							height={14}
						/>
						{/* <span className="rounded-md bg-loadingGray px-[6px] text-[8px] leading-4 text-grey-dark">
							{evidenceCount}
						</span> */}
					</button>
				);
			},
		};

		return [...dataColumns, referenceColumn];
	}, [columns, onOpenReferenceModal]);

	return (
		<div className="overflow-hidden rounded-[24px] border border-primaryN30 bg-white">
			<div className="p-4">
				<Table<MergeWorkflowRow>
					rowKey={(record) => record.key}
					columns={tableColumns}
					dataSource={rows}
					pagination={false}
					scroll={{ x: "max-content", y: scrollY || "calc(100vh - 470px)" }}
					locale={{
						emptyText: (
							<div className="py-10 text-xs text-grey-normal">{emptyText}</div>
						),
					}}
					className="[&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-3 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-3 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
				/>
			</div>
		</div>
	);
}

const parseItemResult = (result: unknown): Record<string, unknown> => {
	if (!result) {
		return {};
	}

	if (typeof result === "string") {
		try {
			return JSON.parse(result);
		} catch (error) {
			console.error("Failed to parse merge item result:", error);
			return {};
		}
	}

	if (typeof result === "object") {
		return result as Record<string, unknown>;
	}

	return {};
};

const formatValue = (value: unknown) => {
	if (value === null || value === undefined || value === "") {
		return "-";
	}

	if (Array.isArray(value)) {
		return value.join(", ");
	}

	if (typeof value === "object") {
		return JSON.stringify(value);
	}

	return String(value);
};

const getFallbackFields = (allItems: any[]) => {
	const additionalFieldCandidates = [
		"Sub Label",
		"Category",
		"Product",
		"Product Type",
		"Type",
		"Operability",
	];

	const discoveredFields = Array.from(
		new Set(
			allItems.flatMap((item) =>
				Object.keys(parseItemResult(item?.result || {})),
			),
		),
	).filter((field) => field !== "Label");

	const prioritizedFields = additionalFieldCandidates.filter((field) =>
		discoveredFields.includes(field),
	);

	const fallbackFields = discoveredFields.filter(
		(field) => !prioritizedFields.includes(field),
	);

	return ["Label", ...prioritizedFields, ...fallbackFields];
};

const normalizeFieldName = (fieldName: string) => {
	const lowered = fieldName.trim().toLowerCase();

	if (lowered === "label") {
		return "Label";
	}

	if (
		lowered === "sub-label" ||
		lowered === "sublabel" ||
		lowered === "sub_label" ||
		lowered === "sub label"
	) {
		return "Sub Label";
	}

	return fieldName;
};

const getDisplayValueByField = (
	result: Record<string, unknown>,
	fieldName: string,
) => {
	if (fieldName === "Sub Label") {
		return formatValue(
			result["Sub Label"] ??
				result["Sub-Label"] ??
				result["Sublabel"] ??
				result["sub_label"],
		);
	}

	return formatValue(result[fieldName]);
};

const getItemsFromSectionValue = (sectionValue: unknown) => {
	// Handle new API format: Array of { Label, "Sub Label", List: item[] }
	if (Array.isArray(sectionValue)) {
		// Check if it's the new format with List property
		if (sectionValue.length > 0 && sectionValue[0]?.List !== undefined) {
			return sectionValue.flatMap((group) =>
				Array.isArray(group?.List) ? group.List : [],
			);
		}
		// Otherwise it's a flat array of items
		return sectionValue;
	}

	if (
		sectionValue &&
		typeof sectionValue === "object" &&
		Array.isArray((sectionValue as { data?: unknown[] })?.data)
	) {
		return (sectionValue as { data: unknown[] }).data;
	}

	return [];
};

const getGroupedItemsFromSectionValue = (sectionValue: unknown) => {
	// Handle new API format: Array of { Label, "Sub Label", List: item[] }
	if (Array.isArray(sectionValue)) {
		return sectionValue.reduce<Record<string, any[]>>((acc, group) => {
			if (group && typeof group === "object") {
				const label = String(group.Label || "");
				const subLabel = String(group["Sub Label"] || "");
				const groupKey = `${label}_____${subLabel}`;
				const items = Array.isArray(group.List) ? group.List : [];
				if (items.length > 0) {
					acc[groupKey] = items;
				}
			}
			return acc;
		}, {});
	}

	// Handle old format: { label_sublabel_group_data: { groupKey: items[] } }
	if (
		sectionValue &&
		typeof sectionValue === "object" &&
		(sectionValue as Record<string, unknown>)?.label_sublabel_group_data &&
		typeof (sectionValue as Record<string, unknown>)
			.label_sublabel_group_data === "object"
	) {
		const groupedData = (sectionValue as Record<string, any>)
			.label_sublabel_group_data as Record<string, unknown[]>;

		return Object.entries(groupedData).reduce<Record<string, any[]>>(
			(acc, [groupKey, items]) => {
				acc[groupKey] = Array.isArray(items) ? items : [];
				return acc;
			},
			{},
		);
	}

	// Fallback: try to extract flat items and group by Label/Sub Label
	const flatItems = getItemsFromSectionValue(sectionValue);
	if (!flatItems.length) {
		return {};
	}

	return flatItems.reduce<Record<string, any[]>>((acc, item, index) => {
		const itemResult = parseItemResult(item?.result);
		const label = String(itemResult?.Label || `group-${index}`);
		const subLabel = String(itemResult?.["Sub Label"] || "");
		const groupKey = `${label}_____${subLabel}`;
		if (!acc[groupKey]) {
			acc[groupKey] = [];
		}
		acc[groupKey].push(item);
		return acc;
	}, {});
};

const normalizeFileSections = (
	operationType: string,
	resultPayload: unknown,
): NormalizedFileSection[] => {
	if (!resultPayload || typeof resultPayload !== "object") {
		return operationType === FileOperationType.ArchitectureDrawing
			? ARCHITECTURE_SECTION_ORDER.map((sectionTitle) => ({
					key: sectionTitle,
					title: sectionTitle,
					items: [],
					groupedItems: {},
				}))
			: [
					{
						key: "all-labels",
						title: "All Labels",
						items: [],
						groupedItems: {},
					},
				];
	}

	const payload = resultPayload as Record<string, unknown>;

	if (operationType === FileOperationType.ArchitectureDrawing) {
		return ARCHITECTURE_SECTION_ORDER.map((sectionTitle) => {
			const groupedItems = getGroupedItemsFromSectionValue(
				payload?.[sectionTitle],
			);

			return {
				key: sectionTitle,
				title: sectionTitle,
				items: Object.values(groupedItems).flat(),
				groupedItems,
			};
		});
	}

	const rootGroupedItems = getGroupedItemsFromSectionValue(resultPayload);
	if (
		operationType === FileOperationType.Quote &&
		Object.keys(rootGroupedItems).length
	) {
		return [
			{
				key: "all-labels",
				title: "All Labels",
				items: Object.values(rootGroupedItems).flat(),
				groupedItems: rootGroupedItems,
			},
		];
	}

	const genericSections = Object.entries(payload)
		.map(([sectionTitle, sectionValue]) => {
			const groupedItems = getGroupedItemsFromSectionValue(sectionValue);

			return {
				key: sectionTitle,
				title:
					operationType === FileOperationType.Quote && sectionTitle === "data"
						? "All Labels"
						: sectionTitle,
				items: Object.values(groupedItems).flat(),
				groupedItems,
			};
		})
		.filter((section) => section.items.length > 0);

	if (genericSections.length) {
		return genericSections;
	}

	return [
		{
			key: "all-labels",
			title: "All Labels",
			items: Object.values(rootGroupedItems).flat(),
			groupedItems: rootGroupedItems,
		},
	];
};

/**
 * Parse merge result data into MergeWorkflowRows
 * Supports both source-level and file-level merge results:
 * - Source level: in_file_source_merge_result / not_in_file_source_merge_result
 * - File level: in_single_file_merge_result / not_in_single_file_merge_result
 */
interface ParseMergeResultOptions {
	fileId: number;
	sourceType: string;
	preferredFields: string[];
}

interface ParsedMergeResult {
	autoMergedRows: MergeWorkflowRow[];
	pendingRows: MergeWorkflowRow[];
}

const parseFileSourceMergeResult = (
	sourceData: any,
	options: ParseMergeResultOptions,
): ParsedMergeResult => {
	const { fileId, sourceType, preferredFields } = options;

	// Support both source-level and file-level merge result keys
	const inMergeResult =
		sourceData?.in_file_source_merge_result ||
		sourceData?.in_single_file_merge_result ||
		[];
	const notInMergeResult =
		sourceData?.not_in_file_source_merge_result ||
		sourceData?.not_in_single_file_merge_result ||
		[];

	// Process in_file_source_merge_result as autoMergedRows
	const autoMergedRows: MergeWorkflowRow[] = [];
	inMergeResult.forEach((group: any, groupIndex: number) => {
		const groupLabel = group?.Label || "";
		const groupSubLabel = group?.["Sub Label"] || "";
		// Support both "list" (lowercase) and "List" (uppercase)
		const listItems = Array.isArray(group?.list)
			? group.list
			: Array.isArray(group?.List)
				? group.List
				: [];

		listItems.forEach((item: any, itemIndex: number) => {
			const result = parseItemResult(item?.result);
			const displayResult = preferredFields.reduce(
				(acc: Record<string, string>, fieldName: string) => {
					acc[fieldName] = getDisplayValueByField(result, fieldName);
					return acc;
				},
				{},
			);
			autoMergedRows.push({
				...item,
				id: item?.id || `${groupIndex}-${itemIndex}`,
				key: `${fileId}-${sourceType}-merged-${item?.id || `${groupIndex}-${itemIndex}`}`,
				result: displayResult,
				sourceType,
				isMerged: true,
				fileSourceMergeResultId: group?.id,
				groupLabel,
				groupSubLabel,
			});
		});
	});

	// Process not_in_file_source_merge_result as pendingRows
	const pendingRows: MergeWorkflowRow[] = [];
	notInMergeResult.forEach((group: any, groupIndex: number) => {
		const groupLabel = group?.Label || "";
		const groupSubLabel = group?.["Sub Label"] || "";
		// Support both "list" (lowercase) and "List" (uppercase)
		const listItems = Array.isArray(group?.list)
			? group.list
			: Array.isArray(group?.List)
				? group.List
				: [];

		listItems.forEach((item: any, itemIndex: number) => {
			const parsedResult = parseItemResult(item?.result);
			const displayResult = preferredFields.reduce(
				(acc: Record<string, string>, fieldName: string) => {
					acc[fieldName] = getDisplayValueByField(parsedResult, fieldName);
					return acc;
				},
				{},
			);
			pendingRows.push({
				...item,
				id: item?.id || `${groupIndex}-${itemIndex}`,
				key: `${fileId}-${sourceType}-pending-${item?.id || `${groupIndex}-${itemIndex}`}`,
				result: displayResult,
				originalResult: item?.result,
				sourceType,
				isMerged: false,
				groupLabel,
				groupSubLabel,
			});
		});
	});

	return { autoMergedRows, pendingRows };
};

const getArchitectureAutoMerged = (file: MergeWorkflowFile) => {
	return file.sections.every(
		(section) => section.autoMergeStarted || section.rows.length === 0,
	);
};

const getRowGroupKey = (row: MergeWorkflowRow) => {
	const label = String(row?.result?.Label || "");
	const subLabel = String(row?.result?.["Sub Label"] || "");
	return `${label}_____${subLabel}`;
};

const mergeDisplayResults = (rows: MergeWorkflowRow[]) => {
	const allFields = Array.from(
		new Set(rows.flatMap((row) => Object.keys(row?.result || {}))),
	);

	return allFields.reduce<Record<string, string>>((acc, fieldName) => {
		const values = rows
			.map((row) => row?.result?.[fieldName] || "")
			.map((value) => String(value).trim())
			.filter(Boolean);

		if (!values.length) {
			acc[fieldName] = "-";
			return acc;
		}

		acc[fieldName] = Array.from(new Set(values)).join(" / ");
		return acc;
	}, {});
};

const createMergedRepresentativeRow = (
	rows: MergeWorkflowRow[],
	groupKey: string,
	sourceType: string,
): MergeWorkflowRow => {
	const firstRow = rows[0];
	const mergedEvidenceIds = Array.from(
		new Set(
			rows.flatMap((row) => {
				const idList = row?.evidence_id_list;
				if (Array.isArray(idList)) {
					return idList.map((id) => Number(id));
				}

				const evidenceId = Number(row?.evidence_id);
				return Number.isFinite(evidenceId) && evidenceId > 0
					? [evidenceId]
					: [];
			}),
		),
	);

	return {
		...firstRow,
		key: `${firstRow?.key}-merged-${groupKey}`,
		result: mergeDisplayResults(rows),
		sourceType,
		evidence_id_list: mergedEvidenceIds,
		evidence_msg: firstRow?.evidence_msg,
		isMerged: true,
		mergedFromRows: rows.map((r) => ({ ...r, isMerged: false })),
	};
};

const splitGroupedRowsForMockProgress = (
	groupedRows: Record<string, MergeWorkflowRow[]>,
	sourceType: string,
) => {
	const groupedEntries = Object.entries(groupedRows);
	const pendingGroupCount =
		groupedEntries.length <= 1
			? 0
			: Math.max(1, Math.floor(groupedEntries.length / 3));

	return groupedEntries.reduce<{
		autoMergedRows: MergeWorkflowRow[];
		pendingRows: MergeWorkflowRow[];
	}>(
		(acc, [groupKey, rows], index) => {
			const isPending =
				pendingGroupCount > 0 &&
				index >= groupedEntries.length - pendingGroupCount;

			if (isPending) {
				acc.pendingRows.push(...rows);
				return acc;
			}

			acc.autoMergedRows.push(
				createMergedRepresentativeRow(rows, groupKey, sourceType),
			);
			return acc;
		},
		{ autoMergedRows: [], pendingRows: [] },
	);
};

const splitSectionRowsForMockMerge = (
	groupedRows: Record<string, MergeWorkflowRow[]>,
	sourceType: string,
) => {
	return splitGroupedRowsForMockProgress(groupedRows, sourceType);
};

const groupRowsByLabelAndSubLabel = (rows: MergeWorkflowRow[]) => {
	return rows.reduce<Record<string, MergeWorkflowRow[]>>((acc, row) => {
		const groupKey = getRowGroupKey(row);
		if (!acc[groupKey]) {
			acc[groupKey] = [];
		}
		acc[groupKey].push(row);
		return acc;
	}, {});
};

const splitFileRowsForReadyMerge = (rows: MergeWorkflowRow[]) => {
	const groupedRows = groupRowsByLabelAndSubLabel(rows);

	return splitGroupedRowsForMockProgress(groupedRows, "Ready Merge");
};

const applyFullManualMerge = (
	autoMergedRows: MergeWorkflowRow[],
	pendingRows: MergeWorkflowRow[],
	sourceType: string,
) => {
	const groupedPendingRows = Object.entries(
		groupRowsByLabelAndSubLabel(pendingRows),
	);
	if (!groupedPendingRows.length) {
		return {
			autoMergedRows,
			pendingRows,
			completed: true,
		};
	}

	return {
		autoMergedRows: [
			...autoMergedRows,
			...groupedPendingRows.map(([groupKey, rows]) =>
				createMergedRepresentativeRow(rows, groupKey, sourceType),
			),
		],
		pendingRows: [],
		completed: true,
	};
};

const getArchitectureResolved = (file: MergeWorkflowFile) => {
	return file.sections.every((section) => {
		return (
			(section.autoMergeStarted || section.rows.length === 0) &&
			section.pendingRows.length === 0
		);
	});
};

const getQuoteSection = (file: MergeWorkflowFile) => {
	return file.sections[0];
};

const hasArchitectureMergeStarted = (file: MergeWorkflowFile) => {
	// Check if mergedSections has actual merged data (new API flow)
	// Only consider merge started if mergedSections has sections with data
	if (file.mergedSections && file.mergedSections.length > 0) {
		const hasMergedData = file.mergedSections.some(
			(section) =>
				section.autoMergeStarted &&
				(section.autoMergedRows.length > 0 || section.pendingRows.length > 0),
		);
		if (hasMergedData) {
			return true;
		}
	}
	// Fallback to old logic: check if any section in sections array has autoMergeStarted
	// AND has actual merged data (autoMergedRows or pendingRows)
	return file.sections.some(
		(section) =>
			section.autoMergeStarted &&
			(section.autoMergedRows.length > 0 || section.pendingRows.length > 0),
	);
};

const getFileRowsForReadyMerge = (file: MergeWorkflowFile) => {
	return file.sections.flatMap((section) => {
		if (section.autoMergeStarted) {
			return section.autoMergedRows;
		}

		return section.rows;
	});
};

const getFileStageState = (
	file: MergeWorkflowFile,
	stage: WorkflowStage,
): StepState => {
	if (file.operationType === FileOperationType.ArchitectureDrawing) {
		const hasStartedMerge = hasArchitectureMergeStarted(file);

		if (stage === "unmerged") {
			return hasStartedMerge ? "completed" : "active";
		}

		if (stage === "merged") {
			if (!hasStartedMerge) {
				return "pending";
			}

			return file.sourceMergeStarted ? "completed" : "active";
		}

		if (!file.sourceMergeStarted) {
			return "pending";
		}

		return file.readyPendingRows.length === 0 ? "completed" : "active";
	}

	const quoteSection = getQuoteSection(file);

	// Check if quote section has actual merged data
	const hasQuoteMergeStarted =
		quoteSection?.autoMergeStarted &&
		(quoteSection.autoMergedRows.length > 0 ||
			quoteSection.pendingRows.length > 0);

	if (stage === "unmerged") {
		return hasQuoteMergeStarted ? "completed" : "active";
	}

	if (stage === "merged") {
		if (!hasQuoteMergeStarted) {
			return "pending";
		}

		return quoteSection.pendingRows.length === 0 ? "completed" : "active";
	}

	if (!hasQuoteMergeStarted || quoteSection.pendingRows.length > 0) {
		return "pending";
	}

	return "completed";
};

const getRecommendedStage = (file: MergeWorkflowFile): WorkflowStage => {
	if (file.operationType === FileOperationType.ArchitectureDrawing) {
		if (!hasArchitectureMergeStarted(file)) {
			return "unmerged";
		}

		if (!file.sourceMergeStarted) {
			return "merged";
		}

		return "ready";
	}

	const quoteSection = getQuoteSection(file);
	const hasQuoteMergeStarted =
		quoteSection?.autoMergeStarted &&
		(quoteSection.autoMergedRows.length > 0 ||
			quoteSection.pendingRows.length > 0);
	if (!hasQuoteMergeStarted) {
		return "unmerged";
	}

	if (quoteSection.pendingRows.length > 0) {
		return "merged";
	}

	return "ready";
};

const getSectionCountByStage = (
	section: MergeWorkflowSection,
	stage: WorkflowStage,
) => {
	if (stage === "unmerged") {
		return section.rows.length;
	}

	if (stage === "merged") {
		if (!section.autoMergeStarted) {
			return section.rows.length;
		}

		return section.autoMergedRows.length + section.pendingRows.length;
	}

	if (!section.autoMergeStarted) {
		return section.rows.length;
	}

	return section.autoMergedRows.length;
};

const cloneWorkflowFiles = (files: MergeWorkflowFile[]) => {
	return JSON.parse(JSON.stringify(files)) as MergeWorkflowFile[];
};

const getFileStatusMeta = (file: MergeWorkflowFile) => {
	const readyState = getFileStageState(file, "ready");
	const mergedState = getFileStageState(file, "merged");

	if (readyState === "completed") {
		return {
			label: "Ready",
			className: "bg-[#EEF5FF] text-forumBlue-normal",
		};
	}

	if (mergedState !== "pending") {
		return {
			label: "Merged",
			className: "bg-[#F4FBF6] text-green-normal",
		};
	}

	return {
		label: "Unmerged",
		className: "bg-grey-light-hover text-grey-normal",
	};
};

const isFileCompleted = (file: MergeWorkflowFile) => {
	return getFileStageState(file, "ready") === "completed";
};

const getFileListStatusMeta = (
	file: MergeWorkflowFile,
	selectedFileId: number,
) => {
	if (isFileCompleted(file)) {
		return {
			label: "Completed",
			dotClassName: "bg-forumBlue-normal",
		};
	}

	if (file.id === selectedFileId) {
		return {
			label: "Processing",
			dotClassName: "bg-green-normal",
		};
	}

	return {
		label: "Unprocessed",
		dotClassName: "bg-[#DCDCDC]",
	};
};

function SectionTable({
	rows,
	columns,
	onOpenReferenceModal,
}: {
	rows: MergeWorkflowRow[];
	columns: string[];
	onOpenReferenceModal: (row: MergeWorkflowRow) => void;
}) {
	const tableColumns = useMemo<ColumnsType<MergeWorkflowRow>>(() => {
		const getColumnWidth = (fieldName: string) => {
			if (!fieldName) return 80;
			if (fieldName.length >= 25) return 160;
			if (fieldName.length >= 15) return 120;
			if (fieldName.length >= 10) return 100;
			return 80;
		};

		const dataColumns = columns.map((fieldName) => {
			const isFixed = fieldName === "Label" || fieldName === "Sub Label";
			return {
				title: (
					<div className="whitespace-nowrap text-center text-[10px] text-grey-normal">
						{fieldName}
					</div>
				),
				key: fieldName,
				dataIndex: fieldName,
				width: isFixed ? 80 : getColumnWidth(fieldName),
				fixed: isFixed ? ("left" as const) : undefined,
				align: "center" as const,
				render: (_: unknown, record: MergeWorkflowRow) => {
					const displayValue = record.result?.[fieldName] || "-";
					return (
						<div className="mx-auto w-full max-w-[120px] overflow-hidden text-[10px]">
							<TruncatedTextCell value={String(displayValue)} />
						</div>
					);
				},
			};
		});

		const referenceColumn: ColumnsType<MergeWorkflowRow>[number] = {
			title: (
				<div className="text-center text-[10px] text-grey-normal">Ref</div>
			),
			key: "reference",
			width: 50,
			fixed: "right",
			align: "center",
			render: (_: unknown, record: MergeWorkflowRow) => (
				<button
					type="button"
					className="inline-flex h-5 w-5 items-center justify-center"
					onClick={(e) => {
						e.stopPropagation();
						onOpenReferenceModal(record);
					}}
				>
					<Image
						src="/assets/icons/file-refrence.svg"
						alt=""
						width={12}
						height={12}
					/>
				</button>
			),
		};

		return [...dataColumns, referenceColumn];
	}, [columns, onOpenReferenceModal]);

	if (!rows.length) {
		return (
			<div className="flex h-[200px] items-center justify-center text-xs text-grey-normal">
				No items in this section.
			</div>
		);
	}

	// Calculate table height: viewport height - header(80px) - top area(~200px) - section header(~60px) - padding(~100px)
	const tableScrollY = "calc(100vh - 440px)";

	return (
		<Table<MergeWorkflowRow>
			rowKey={(record) => record.key}
			columns={tableColumns}
			dataSource={rows}
			pagination={false}
			scroll={{ x: "max-content", y: tableScrollY }}
			size="small"
			locale={{
				emptyText: (
					<div className="py-6 text-xs text-grey-normal">No items.</div>
				),
			}}
			className="[&_.ant-table]:!text-[10px] [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-cell]:!px-2 [&_.ant-table-tbody>tr>td]:!py-1.5 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
		/>
	);
}

function SectionMergedContent({
	section,
	columns,
	onOpenManualMergeModal,
	onOpenReferenceModal,
	fileId,
}: {
	section: MergeWorkflowSection;
	columns: string[];
	onOpenManualMergeModal: (context: ManualMergeContext) => void;
	onOpenReferenceModal: (row: MergeWorkflowRow) => void;
	fileId: number;
}) {
	const autoMergedRows = section.autoMergedRows || [];
	const pendingRows = section.pendingRows || [];

	const tableColumns = useMemo<ColumnsType<MergeWorkflowRow>>(() => {
		const getColumnWidth = (fieldName: string) => {
			if (!fieldName) return 80;
			if (fieldName.length >= 25) return 160;
			if (fieldName.length >= 15) return 120;
			if (fieldName.length >= 10) return 100;
			return 80;
		};

		const dataColumns = columns.map((fieldName) => {
			const isFixed = fieldName === "Label" || fieldName === "Sub Label";
			return {
				title: (
					<div className="whitespace-nowrap text-center text-[10px] text-grey-normal">
						{fieldName}
					</div>
				),
				key: fieldName,
				dataIndex: fieldName,
				width: isFixed ? 80 : getColumnWidth(fieldName),
				fixed: isFixed ? ("left" as const) : undefined,
				align: "center" as const,
				render: (_: unknown, record: MergeWorkflowRow) => {
					const displayValue = record.result?.[fieldName] || "-";
					return (
						<div className="mx-auto w-full max-w-[120px] overflow-hidden text-[10px]">
							<TruncatedTextCell value={String(displayValue)} />
						</div>
					);
				},
			};
		});

		const referenceColumn: ColumnsType<MergeWorkflowRow>[number] = {
			title: (
				<div className="text-center text-[10px] text-grey-normal">Ref</div>
			),
			key: "reference",
			width: 50,
			fixed: "right",
			align: "center",
			render: (_: unknown, record: MergeWorkflowRow) => (
				<button
					type="button"
					className="inline-flex h-5 w-5 items-center justify-center"
					onClick={(e) => {
						e.stopPropagation();
						onOpenReferenceModal(record);
					}}
				>
					<Image
						src="/assets/icons/file-refrence.svg"
						alt=""
						width={12}
						height={12}
					/>
				</button>
			),
		};

		return [...dataColumns, referenceColumn];
	}, [columns, onOpenReferenceModal]);

	// Calculate table height based on whether both sections exist
	const hasBothSections = autoMergedRows.length > 0 && pendingRows.length > 0;
	// If both sections exist, split the height; otherwise use full available height
	const singleTableScrollY = "calc(100vh - 440px)";
	const splitTableScrollY = "calc((100vh - 500px) / 2)";
	const tableScrollY = hasBothSections ? splitTableScrollY : singleTableScrollY;

	return (
		<div className="space-y-5">
			{/* Auto merged */}
			{autoMergedRows.length > 0 && (
				<div>
					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EDF7EE]">
								<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
									<path
										d="M13.3334 4L6.00008 11.3333L2.66675 8"
										stroke="#3F8C4C"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</div>
							<div>
								<div className="flex items-center gap-2">
									<span className="text-xs font-medium text-grey-dark">
										Merged
									</span>
									<span className="rounded-full bg-[#EDF7EE] px-1.5 py-0.5 text-[10px] text-[#3F8C4C]">
										{autoMergedRows.length}
									</span>
								</div>
								<div className="text-[10px] text-grey-normal">
									Labels automatically merged
								</div>
							</div>
						</div>
					</div>
					<Table<MergeWorkflowRow>
						rowKey={(record) => record.key}
						columns={tableColumns}
						dataSource={autoMergedRows}
						pagination={false}
						scroll={{ x: "max-content", y: tableScrollY }}
						size="small"
						locale={{
							emptyText: (
								<div className="py-4 text-xs text-grey-normal">No items.</div>
							),
						}}
						className="[&_.ant-table]:!text-[10px] [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-cell]:!px-2 [&_.ant-table-tbody>tr>td]:!py-1.5 [&_.ant-table-thead>tr>th]:!bg-[#EDF7EE] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
					/>
				</div>
			)}

			{/* Pending manual merge */}
			{pendingRows.length > 0 && (
				<div>
					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF1F0]">
								<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
									<path
										d="M8 5.33333V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
										stroke="#D14343"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</div>
							<div>
								<div className="flex items-center gap-2">
									<span className="text-xs font-medium text-grey-dark">
										Unmerged
									</span>
									<span className="rounded-full bg-[#FFF1F0] px-1.5 py-0.5 text-[10px] text-[#D14343]">
										{pendingRows.length}
									</span>
								</div>
								<div className="text-[10px] text-grey-normal">
									Labels require manual merge
								</div>
							</div>
						</div>
						<Button
							size="small"
							className="custom-primary-btn !h-7 !w-[110px] !text-[11px]"
							onClick={() =>
								onOpenManualMergeModal({
									fileId,
									mode: "section",
									sectionKey: section.key,
									sourceType: section.key,
								})
							}
						>
							Manual Merge
						</Button>
					</div>
					<Table<MergeWorkflowRow>
						rowKey={(record) => record.key}
						columns={tableColumns}
						dataSource={pendingRows}
						pagination={false}
						scroll={{ x: "max-content", y: tableScrollY }}
						size="small"
						locale={{
							emptyText: (
								<div className="py-4 text-xs text-grey-normal">No items.</div>
							),
						}}
						className="[&_.ant-table]:!text-[10px] [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-cell]:!px-2 [&_.ant-table-tbody>tr>td]:!py-1.5 [&_.ant-table-thead>tr>th]:!bg-[#FFF1F0] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
					/>
				</div>
			)}

			{autoMergedRows.length === 0 && pendingRows.length === 0 && (
				<div className="flex h-[200px] items-center justify-center text-xs text-grey-normal">
					No merged items yet. Run Auto Merge first.
				</div>
			)}
		</div>
	);
}

function UnmergedStageCard({
	selectedFile,
	activeSection,
	columnNames,
	loadingActionKey,
	onAutoMergeSection,
	onOpenReferenceModal,
}: {
	selectedFile: MergeWorkflowFile;
	activeSection: MergeWorkflowSection | null;
	columnNames: string[];
	loadingActionKey: string | null;
	onAutoMergeSection: (fileId: number, sectionKey: string) => void;
	onOpenReferenceModal: (row: MergeWorkflowRow) => void;
}) {
	const currentSectionKey =
		activeSection?.key || selectedFile.sections[0]?.key || "";

	return (
		<>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<div className="text-sm text-grey-dark">
						{selectedFile.operationType ===
						FileOperationType.ArchitectureDrawing
							? `${activeSection?.title || "Source"} Raw Labels`
							: "Quote Raw Labels"}
					</div>
					<div className="mt-1 text-xs text-grey-normal">
						Start with an auto merge to move data into the merged board.
					</div>
				</div>

				{selectedFile.operationType === FileOperationType.Quote ? (
					<Button
						className="custom-primary-btn !w-[150px]"
						loading={
							loadingActionKey ===
							`auto-section-${selectedFile.id}-${currentSectionKey}`
						}
						disabled={Boolean(loadingActionKey)}
						onClick={() =>
							onAutoMergeSection(selectedFile.id, currentSectionKey)
						}
					>
						Auto Merge
					</Button>
				) : null}
			</div>

			<MergeRowsTable
				title="Input List"
				description="This is the raw extracted list used to simulate the unmerged board."
				rows={activeSection?.rows || []}
				columns={columnNames}
				emptyText="No rows found for this section."
				onOpenReferenceModal={onOpenReferenceModal}
			/>
		</>
	);
}

function MergedStageCard({
	selectedFile,
	activeSection,
	columnNames,
	loadingActionKey,
	onOpenManualMergeModal,
	onOpenReferenceModal,
}: {
	selectedFile: MergeWorkflowFile;
	activeSection: MergeWorkflowSection | null;
	columnNames: string[];
	loadingActionKey: string | null;
	onOpenManualMergeModal: (context: ManualMergeContext) => void;
	onOpenReferenceModal: (row: MergeWorkflowRow) => void;
}) {
	const quoteSection = getQuoteSection(selectedFile);

	return (
		<>
			{selectedFile.operationType === FileOperationType.ArchitectureDrawing &&
			activeSection &&
			!activeSection.autoMergeStarted ? (
				<div className="rounded-[24px] border border-dashed border-primaryN30 bg-[#FCFCFD] px-6 py-12">
					<Empty
						description={
							<span className="text-xs text-grey-normal">
								Run auto merge in the unmerged board first.
							</span>
						}
					/>
				</div>
			) : null}

			{selectedFile.operationType === FileOperationType.Quote &&
			!quoteSection?.autoMergeStarted ? (
				<div className="rounded-[24px] border border-dashed border-primaryN30 bg-[#FCFCFD] px-6 py-12">
					<Empty
						description={
							<span className="text-xs text-grey-normal">
								Run merge in the unmerged board first.
							</span>
						}
					/>
				</div>
			) : null}

			{selectedFile.operationType === FileOperationType.ArchitectureDrawing &&
			activeSection?.autoMergeStarted ? (
				<>
					{activeSection.pendingRows.length ? (
						<>
							<div>
								<MergeTableHeader
									type="merged"
									count={activeSection.autoMergedRows.length}
								/>
								<MergeRowsTable
									title="Auto Merged Items"
									description="Mock auto merge results returned from the current source."
									rows={activeSection.autoMergedRows}
									columns={columnNames}
									emptyText="No auto merged rows."
									onOpenReferenceModal={onOpenReferenceModal}
								/>
							</div>

							<div>
								<MergeTableHeader
									type="unmerged"
									count={activeSection.pendingRows.length}
									showManualMergeButton
									loadingActionKey={loadingActionKey}
									onManualMerge={() =>
										onOpenManualMergeModal({
											fileId: selectedFile.id,
											mode: "section",
											sectionKey: activeSection.key,
											sourceType: activeSection.key,
										})
									}
								/>
								<MergeRowsTable
									title="Unmerged Items"
									description="Rows still waiting for manual merge."
									rows={activeSection.pendingRows}
									columns={columnNames}
									emptyText="No pending rows."
									onOpenReferenceModal={onOpenReferenceModal}
								/>
							</div>
						</>
					) : (
						<div>
							<MergeTableHeader
								type="merged"
								count={
									activeSection.autoMergedRows.length ||
									activeSection.rows.length
								}
							/>
							<MergeRowsTable
								title="Merged Results"
								description="All rows for this source are already merged."
								rows={
									activeSection.autoMergedRows.length
										? activeSection.autoMergedRows
										: activeSection.rows
								}
								columns={columnNames}
								emptyText="No merged rows available."
								onOpenReferenceModal={onOpenReferenceModal}
							/>
						</div>
					)}
				</>
			) : null}

			{selectedFile.operationType === FileOperationType.Quote &&
			quoteSection?.autoMergeStarted ? (
				<div className="space-y-5">
					{quoteSection.pendingRows.length ? (
						<>
							<div>
								<MergeTableHeader
									type="merged"
									count={quoteSection.autoMergedRows?.length || 0}
								/>
								<MergeRowsTable
									title="Auto Merged Items"
									description="Mock auto merge results for the quote file."
									rows={quoteSection.autoMergedRows || []}
									columns={columnNames}
									emptyText="No auto merged rows."
									onOpenReferenceModal={onOpenReferenceModal}
									scrollY="calc((100vh - 520px) / 2)"
								/>
							</div>

							<div>
								<MergeTableHeader
									type="unmerged"
									count={quoteSection.pendingRows?.length || 0}
									showManualMergeButton
									loadingActionKey={loadingActionKey}
									onManualMerge={() =>
										onOpenManualMergeModal({
											fileId: selectedFile.id,
											mode: "section",
											sectionKey: quoteSection?.key || "all-labels",
											sourceType: quoteSection?.key || "all-labels",
										})
									}
								/>
								<MergeRowsTable
									title="Unmerged Items"
									description="Rows that still need manual merge."
									rows={quoteSection.pendingRows || []}
									columns={columnNames}
									emptyText="No pending rows."
									onOpenReferenceModal={onOpenReferenceModal}
									scrollY="calc((100vh - 520px) / 2)"
								/>
							</div>
						</>
					) : (
						<div>
							<MergeTableHeader
								type="merged"
								count={
									quoteSection.autoMergedRows?.length ||
									quoteSection.rows?.length ||
									0
								}
							/>
							<MergeRowsTable
								title="Merged Results"
								description="The quote file has been fully merged."
								rows={
									quoteSection.autoMergedRows?.length
										? quoteSection.autoMergedRows
										: quoteSection.rows || []
								}
								columns={columnNames}
								emptyText="No merged rows available."
								onOpenReferenceModal={onOpenReferenceModal}
							/>
						</div>
					)}
				</div>
			) : null}
		</>
	);
}

function ReadyStageCard({
	selectedFile,
	columnNames,
	loadingActionKey,
	onOpenManualMergeModal,
	onOpenReferenceModal,
}: {
	selectedFile: MergeWorkflowFile;
	columnNames: string[];
	loadingActionKey: string | null;
	onOpenManualMergeModal: (context: ManualMergeContext) => void;
	onOpenReferenceModal: (row: MergeWorkflowRow) => void;
}) {
	return (
		<>
			{selectedFile.operationType === FileOperationType.ArchitectureDrawing &&
			!selectedFile.sourceMergeStarted ? (
				<div className="rounded-[24px] border border-dashed border-primaryN30 bg-[#FCFCFD] px-6 py-12">
					<Empty
						description={
							<span className="text-xs text-grey-normal">
								Complete merged board processing and run Auto Merge Sources
								first.
							</span>
						}
					/>
				</div>
			) : null}

			{selectedFile.operationType === FileOperationType.Quote &&
			getFileStageState(selectedFile, "ready") !== "completed" ? (
				<div className="rounded-[24px] border border-dashed border-primaryN30 bg-[#FCFCFD] px-6 py-12">
					<Empty
						description={
							<span className="text-xs text-grey-normal">
								Finish quote manual merge in the merged board first.
							</span>
						}
					/>
				</div>
			) : null}

			{selectedFile.operationType === FileOperationType.ArchitectureDrawing &&
			selectedFile.sourceMergeStarted ? (
				<div className="space-y-5">
					{selectedFile.readyPendingRows.length ? (
						<>
							{/* Merged section */}
							<div>
								<div className="mb-4 flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDF7EE]">
											<svg
												width="14"
												height="14"
												viewBox="0 0 16 16"
												fill="none"
											>
												<path
													d="M13.3334 4L6.00008 11.3333L2.66675 8"
													stroke="#3F8C4C"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</div>
										<div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-grey-dark">
													Merged
												</span>
												<span className="rounded-full bg-[#EDF7EE] px-2 py-0.5 text-xs text-[#3F8C4C]">
													{selectedFile.readyAutoMergedRows.length}
												</span>
											</div>
											<div className="mt-0.5 text-xs text-grey-normal">
												Labels that have been automatically merged
											</div>
										</div>
									</div>
								</div>
								<MergeRowsTable
									title="Auto Merged Sources"
									description="Mock file-level source merge output."
									rows={selectedFile.readyAutoMergedRows}
									columns={columnNames}
									emptyText="No auto merged source rows."
									onOpenReferenceModal={onOpenReferenceModal}
									hideHeader
									scrollY="calc((100vh - 520px) / 2)"
								/>
							</div>

							{/* Unmerged section */}
							<div>
								<div className="mb-4 flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF1F0]">
											<svg
												width="14"
												height="14"
												viewBox="0 0 16 16"
												fill="none"
											>
												<path
													d="M8 5.33333V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
													stroke="#D14343"
													strokeWidth="1.5"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</div>
										<div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-grey-dark">
													Unmerged
												</span>
												<span className="rounded-full bg-[#FFF1F0] px-2 py-0.5 text-xs text-[#D14343]">
													{selectedFile.readyPendingRows.length}
												</span>
											</div>
											<div className="mt-0.5 text-xs text-grey-normal">
												Labels that require manual merge to resolve conflicts
											</div>
										</div>
									</div>
									<Button
										className="custom-primary-btn !w-[130px]"
										disabled={Boolean(loadingActionKey)}
										onClick={() =>
											onOpenManualMergeModal({
												fileId: selectedFile.id,
												mode: "ready",
												sourceType: "all-labels",
											})
										}
									>
										Manual Merge
									</Button>
								</div>
								<MergeRowsTable
									title="Unmerged Items"
									description="Rows still waiting for final ready merge."
									rows={selectedFile.readyPendingRows}
									columns={columnNames}
									emptyText="No pending ready rows."
									onOpenReferenceModal={onOpenReferenceModal}
									hideHeader
									scrollY="calc((100vh - 520px) / 2)"
								/>
							</div>
						</>
					) : (
						<div>
							<div className="mb-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDF7EE]">
										<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
											<path
												d="M13.3334 4L6.00008 11.3333L2.66675 8"
												stroke="#3F8C4C"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</div>
									<div>
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-grey-dark">
												Merged
											</span>
											<span className="rounded-full bg-[#EDF7EE] px-2 py-0.5 text-xs text-[#3F8C4C]">
												{selectedFile.readyAutoMergedRows.length}
											</span>
										</div>
										<div className="mt-0.5 text-xs text-grey-normal">
											The file is fully merged and ready
										</div>
									</div>
								</div>
							</div>
							<MergeRowsTable
								title="Ready Items"
								description="The file is fully merged and ready."
								rows={selectedFile.readyAutoMergedRows}
								columns={columnNames}
								emptyText="No ready rows available."
								onOpenReferenceModal={onOpenReferenceModal}
								hideHeader
							/>
						</div>
					)}
				</div>
			) : null}

			{selectedFile.operationType === FileOperationType.Quote &&
			getFileStageState(selectedFile, "ready") === "completed" ? (
				<div>
					<div className="mb-4 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDF7EE]">
								<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
									<path
										d="M13.3334 4L6.00008 11.3333L2.66675 8"
										stroke="#3F8C4C"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</div>
							<div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-grey-dark">
										Merged
									</span>
									<span className="rounded-full bg-[#EDF7EE] px-2 py-0.5 text-xs text-[#3F8C4C]">
										{
											(selectedFile.readyAutoMergedRows.length
												? selectedFile.readyAutoMergedRows
												: getQuoteSection(selectedFile)?.autoMergedRows?.length
													? getQuoteSection(selectedFile)?.autoMergedRows || []
													: getQuoteSection(selectedFile)?.rows || []
											).length
										}
									</span>
								</div>
								<div className="mt-0.5 text-xs text-grey-normal">
									The file is fully merged and ready
								</div>
							</div>
						</div>
					</div>
					<MergeRowsTable
						title="Ready Items"
						description="Quote files become ready immediately after merged rows are fully resolved."
						rows={
							selectedFile.readyAutoMergedRows.length
								? selectedFile.readyAutoMergedRows
								: getQuoteSection(selectedFile)?.autoMergedRows?.length
									? getQuoteSection(selectedFile)?.autoMergedRows || []
									: getQuoteSection(selectedFile)?.rows || []
						}
						columns={columnNames}
						emptyText="No ready rows available."
						onOpenReferenceModal={onOpenReferenceModal}
					/>
				</div>
			) : null}
		</>
	);
}

export default function ManualMergeNewPage() {
	const params = useParams();
	const router = useRouter();
	const projectId = String(params?.projectId || "");
	const takeoffId = String(params?.takeoffId || "");
	const [loading, setLoading] = useState(true);
	const [workflowFiles, setWorkflowFiles] = useState<MergeWorkflowFile[]>([]);
	const [columnNames, setColumnNames] = useState<string[]>([
		"Label",
		"Sub Label",
	]);
	const [selectedFileId, setSelectedFileIdLocal] = useState<number>(-1);
	const [selectedStage, setSelectedStage] = useState<WorkflowStage>("unmerged");
	const [activeSectionKeys, setActiveSectionKeys] = useState<
		Record<number, string>
	>({});
	const [showOriginalRefModal, setShowOriginalRefModal] = useState(false);
	const [originalRefItem, setOriginalRefItem] =
		useState<MergeWorkflowRow | null>(null);
	const [showMergedRefModal, setShowMergedRefModal] = useState(false);
	const [mergedRefItem, setMergedRefItem] = useState<MergeWorkflowRow | null>(
		null,
	);
	const [loadingActionKey, setLoadingActionKey] = useState<string | null>(null);
	const [showItemsMergeModal, setShowItemsMergeModal] = useState(false);
	const [itemsMergePendingRows, setItemsMergePendingRows] = useState<any[]>([]);
	const [createTakeoffLoading, setCreateTakeoffLoading] = useState(false);
	const [manualMergeContext, setManualMergeContext] =
		useState<ManualMergeContext | null>(null);
	const lastStageSyncedFileIdRef = useRef<number | null>(null);
	const initialWorkflowFilesRef = useRef<MergeWorkflowFile[]>([]);
	const hasInitializedRef = useRef(false);
	const [isMergeAllMode, setIsMergeAllMode] = useState(false);
	const [mergeAllResult, setMergeAllResult] = useState<MergeAllResult | null>(
		null,
	);
	const [mergeAllLoading, setMergeAllLoading] = useState(false);

	const { setTakeOff, setFileList, setSelectedFileId, setFileViewStep } =
		useTakeoff();

	const selectedFile = useMemo(() => {
		return workflowFiles.find((file) => file.id === selectedFileId) || null;
	}, [selectedFileId, workflowFiles]);

	const activeSection = useMemo(() => {
		if (!selectedFile) {
			return null;
		}

		// Determine which sections to use based on current stage
		const sectionsToUse =
			selectedStage === "merged" && selectedFile.mergedSections.length > 0
				? selectedFile.mergedSections
				: selectedFile.unmergedSections.length > 0
					? selectedFile.unmergedSections
					: selectedFile.sections;

		const activeKey =
			activeSectionKeys[selectedFile.id] || sectionsToUse[0]?.key || "";
		return (
			sectionsToUse.find((section) => section.key === activeKey) ||
			sectionsToUse[0] ||
			null
		);
	}, [activeSectionKeys, selectedFile, selectedStage]);

	const resolveColumnNames = useCallback(async (templateId: number = 1) => {
		try {
			const result = await getTemplateById(templateId);
			if (result.status === "success" && result.data) {
				const template = result.data;
				// Extract field names from template fields
				const fields = template.fields || [];
				const fieldNames = fields
					.map((field: any) => field.name || field.field_name)
					.filter(Boolean)
					.map(normalizeFieldName);

				if (fieldNames.length > 0) {
					setColumnNames(fieldNames);
					return fieldNames;
				}
			}
		} catch (error) {
			console.error("Error fetching template:", error);
		}

		// Fallback to default fields if template fetch fails
		const defaultFields = [
			"Label",
			"Sub Label",
			"Product",
			"Product Type",
			"Operability",
			"Width",
			"Height",
			"Width_mm",
			"Height_mm",
			"Quantity",
			"Glass Layer",
			"Glass Width",
			"Glass Brand",
			"Glass Type",
			"Glass Arrangement Configuration",
			"Glass Arrangement Spacer Type",
			"Location",
			"Source Type",
		];
		setColumnNames(defaultFields);
		return defaultFields;
	}, []);

	const buildSectionsFromData = useCallback(
		(
			fileId: number,
			operationType: string,
			normalizedSections: NormalizedFileSection[],
			preferredFields: string[],
		): MergeWorkflowSection[] => {
			return normalizedSections.map((section) => {
				const rows = (section.items || []).map(
					(item: any, index: number): MergeWorkflowRow => {
						const result = parseItemResult(item?.result);
						const displayResult = preferredFields.reduce<
							Record<string, string>
						>((acc, fieldName) => {
							acc[fieldName] = getDisplayValueByField(result, fieldName);
							return acc;
						}, {});

						return {
							...item,
							id: Number(item?.id || index),
							key: `${fileId}-${section.key}-${item?.id || index}`,
							result: displayResult,
							sourceType: section.title,
							isMerged: false,
						};
					},
				);

				const groupedRows = Object.entries(section.groupedItems || {}).reduce<
					Record<string, MergeWorkflowRow[]>
				>((acc, [groupKey, items]) => {
					acc[groupKey] = (items || []).map((item: any, index: number) => {
						const itemKey = `${fileId}-${section.key}-${item?.id || index}`;
						return (
							rows.find((row) => row.key === itemKey) || {
								...item,
								id: Number(item?.id || index),
								key: itemKey,
								result: preferredFields.reduce<Record<string, string>>(
									(fieldAcc, fieldName) => {
										fieldAcc[fieldName] = getDisplayValueByField(
											parseItemResult(item?.result),
											fieldName,
										);
										return fieldAcc;
									},
									{},
								),
								sourceType: section.title,
							}
						);
					});
					return acc;
				}, {});

				return {
					key: section.key,
					title: section.title,
					rows,
					groupedRows,
					autoMergeStarted: false,
					autoMergedRows: [],
					pendingRows: [],
					manualMergeCompleted: false,
				};
			});
		},
		[],
	);

	const createInitialMergeStatus = useCallback(
		(operationType: string): FileMergeStatus => {
			const sourceTypes =
				operationType === FileOperationType.ArchitectureDrawing
					? [PageType.FloorPlan, PageType.Elevation, PageType.Schedule]
					: ["all-labels"];

			const sourceMergeStatus = sourceTypes.reduce<
				Record<string, SourceMergeStatus>
			>((acc, sourceType) => {
				acc[sourceType] = {
					autoMerged: false,
					manualMergeCompleted: false,
					dataLoaded: false,
				};
				return acc;
			}, {});

			return {
				unmergedDataLoaded: false,
				sourceMergeStatus,
				allSourcesMerged: false,
				readyDataLoaded: false,
				readyManualMergeCompleted: false,
			};
		},
		[],
	);

	const buildWorkflowFiles = useCallback(
		(
			projectFiles: (ProjectFileRecord & { operation_type?: string })[],
			preferredFields: string[],
			fileResultsByFileId: Record<number, NormalizedFileSection[]>,
		): MergeWorkflowFile[] => {
			return projectFiles.map((file) => {
				const unmergedSections = buildSectionsFromData(
					file.id,
					file.operation_type || "",
					fileResultsByFileId[file.id] || [],
					preferredFields,
				);

				const mergeStatus = createInitialMergeStatus(file.operation_type || "");
				mergeStatus.unmergedDataLoaded = true;

				return {
					id: file.id,
					fileName: file.file_name || `File ${file.id}`,
					fileType:
						file.operation_type === FileOperationType.ArchitectureDrawing
							? "Architecture Drawing"
							: file.operation_type === FileOperationType.Quote
								? "Quote"
								: file.operation_type || "Unknown",
					operationType: file.operation_type || "",
					labelsCount: unmergedSections.reduce(
						(sum, section) => sum + section.rows.length,
						0,
					),
					mergeStatus,
					unmergedSections,
					mergedSections: [],
					readyAutoMergedRows: [],
					readyPendingRows: [],
					sections: unmergedSections,
					sourceMergeStarted: false,
					readyManualMergeCompleted: false,
				};
			});
		},
		[buildSectionsFromData, createInitialMergeStatus],
	);

	const fetchTakeoffDetails = useCallback(async () => {
		setLoading(true);
		try {
			// Step 1: Get takeoff data and file list by takeoffId
			const takeoffResponse = await getTakeOffById(takeoffId);
			if (takeoffResponse.status !== "success" || !takeoffResponse.data) {
				notification.error({
					message: "Failed to load takeoff",
					description: "Unable to fetch takeoff details. Please try again.",
				});
				setLoading(false);
				return;
			}

			const takeoffData = takeoffResponse.data;
			const projectFiles: (ProjectFileRecord & { operation_type?: string })[] =
				(takeoffData.project_files || []).map((file: any) => ({
					...file,
					status: FileStatus.Completed,
				}));

			if (projectFiles.length === 0) {
				notification.warning({
					message: "No files found",
					description: "This takeoff has no project files.",
				});
				setLoading(false);
				return;
			}

			// Step 2: Fetch original items data for each file (for unmerged files)
			const fileResultsByFileId: Record<number, NormalizedFileSection[]> = {};

			await Promise.all(
				projectFiles.map(async (file) => {
					const resultResponse = await getTakeOffResultByFile(
						Number(takeoffId),
						file.id,
					);
					console.log("resultResponse", resultResponse);
					if (resultResponse.status === "success" && resultResponse.data) {
						fileResultsByFileId[file.id] = normalizeFileSections(
							file.operation_type || "",
							resultResponse.data,
						);
					} else {
						// If API fails, use empty sections
						fileResultsByFileId[file.id] = normalizeFileSections(
							file.operation_type || "",
							null,
						);
					}
				}),
			);

			const preferredFields = await resolveColumnNames(1);
			const nextWorkflowFiles = buildWorkflowFiles(
				projectFiles,
				preferredFields,
				fileResultsByFileId,
			);

			setTakeOff({
				id: Number(takeoffId),
				project_files: projectFiles,
				take_off_result: takeoffData.take_off_result || {
					template_id: undefined,
				},
			});
			setFileList(projectFiles);
			setSelectedFileId(projectFiles[0]?.id || -1);
			setFileViewStep(FileViewStep.FileMerge);
			initialWorkflowFilesRef.current = cloneWorkflowFiles(nextWorkflowFiles);
			setWorkflowFiles(nextWorkflowFiles);
			setSelectedFileIdLocal(projectFiles[0]?.id || -1);
		} catch (error) {
			console.error("Error fetching takeoff details:", error);
			notification.error({
				message: "Error",
				description: "An error occurred while loading takeoff data.",
			});
		} finally {
			setLoading(false);
		}
	}, [
		buildWorkflowFiles,
		resolveColumnNames,
		setFileList,
		setFileViewStep,
		setSelectedFileId,
		setTakeOff,
		takeoffId,
	]);

	useEffect(() => {
		// Skip if already initialized (prevents re-fetch on hot reload)
		if (hasInitializedRef.current) {
			return;
		}
		hasInitializedRef.current = true;
		fetchTakeoffDetails();
	}, [fetchTakeoffDetails]);

	useEffect(() => {
		if (!selectedFile) {
			return;
		}

		const defaultSectionKey = selectedFile.sections[0]?.key;
		if (defaultSectionKey && !activeSectionKeys[selectedFile.id]) {
			setActiveSectionKeys((current) => ({
				...current,
				[selectedFile.id]: defaultSectionKey,
			}));
		}
	}, [activeSectionKeys, selectedFile]);

	useEffect(() => {
		if (!selectedFile) {
			return;
		}

		if (lastStageSyncedFileIdRef.current === selectedFile.id) {
			return;
		}

		lastStageSyncedFileIdRef.current = selectedFile.id;
		setSelectedStage(getRecommendedStage(selectedFile));
	}, [selectedFile]);

	const updateWorkflowFile = useCallback(
		(
			fileId: number,
			updater: (file: MergeWorkflowFile) => MergeWorkflowFile,
		) => {
			setWorkflowFiles((current) =>
				current.map((file) => (file.id === fileId ? updater(file) : file)),
			);
		},
		[],
	);

	// Load merged data for a specific file (Merged stage)
	const loadMergedDataForFile = useCallback(
		async (fileId: number, sourceTypes: string[]) => {
			const result = await getMergeResultByFileSourceList(
				Number(takeoffId),
				fileId,
				sourceTypes,
			);

			if (result.status === "success" && result.data) {
				const file = workflowFiles.find((f) => f.id === fileId);
				if (!file) return;

				const preferredFields = await resolveColumnNames(1);

				const mergedSections = sourceTypes.map((sourceType) => {
					const sourceData = result.data[sourceType] || [];
					const normalizedSection = normalizeFileSections(file.operationType, {
						[sourceType]: sourceData,
					});
					const sections = buildSectionsFromData(
						fileId,
						file.operationType,
						normalizedSection,
						preferredFields,
					);
					return (
						sections[0] || {
							key: sourceType,
							title: sourceType,
							rows: [],
							groupedRows: {},
							autoMergeStarted: true,
							autoMergedRows: [],
							pendingRows: [],
							manualMergeCompleted: false,
						}
					);
				});

				updateWorkflowFile(fileId, (f) => ({
					...f,
					mergedSections,
					mergeStatus: {
						...f.mergeStatus,
						sourceMergeStatus: sourceTypes.reduce(
							(acc, sourceType) => {
								acc[sourceType] = {
									...f.mergeStatus.sourceMergeStatus[sourceType],
									dataLoaded: true,
								};
								return acc;
							},
							{ ...f.mergeStatus.sourceMergeStatus },
						),
					},
				}));
			}
		},
		[
			takeoffId,
			workflowFiles,
			resolveColumnNames,
			buildSectionsFromData,
			updateWorkflowFile,
		],
	);

	// Load ready data for a specific file (Ready stage)
	const loadReadyDataForFile = useCallback(
		async (fileId: number) => {
			const result = await getAllGroupedByFile(Number(takeoffId), fileId);

			if (result.status === "success" && result.data) {
				const file = workflowFiles.find((f) => f.id === fileId);
				if (!file) return;

				const preferredFields = await resolveColumnNames(1);

				const { autoMergedRows, pendingRows } = parseFileSourceMergeResult(
					result.data,
					{
						fileId,
						sourceType: "Ready",
						preferredFields,
					},
				);

				updateWorkflowFile(fileId, (f) => ({
					...f,
					readyAutoMergedRows: autoMergedRows,
					readyPendingRows: pendingRows,
					mergeStatus: {
						...f.mergeStatus,
						readyDataLoaded: true,
					},
				}));
			}
		},
		[takeoffId, workflowFiles, resolveColumnNames, updateWorkflowFile],
	);

	// Auto merge all sources for a file (triggers all 3 sources for ArchDrawing)
	const handleAutoMergeAllSources = useCallback(
		async (fileId: number) => {
			const file = workflowFiles.find((f) => f.id === fileId);
			if (!file) return;

			// Determine source types based on file type and actual data
			let sourceTypes: string[] = [];

			if (file.operationType === FileOperationType.ArchitectureDrawing) {
				// For ArchitectureDrawing, only include source types that have data
				const possibleSourceTypes = [
					PageType.FloorPlan,
					PageType.Elevation,
					PageType.Schedule,
				];
				sourceTypes = possibleSourceTypes.filter((sourceType) => {
					const section = file.unmergedSections.find(
						(s) => s.key === sourceType,
					);
					return section && section.rows.length > 0;
				});
			} else if (file.operationType === FileOperationType.Quote) {
				// For Quote files, use window_door_unit_list
				sourceTypes = ["window_door_unit_list"];
			} else {
				// Fallback for other file types
				sourceTypes = file.unmergedSections
					.filter((s) => s.rows.length > 0)
					.map((s) => s.key);
			}

			if (sourceTypes.length === 0) {
				notification.warning({
					message: "No data to merge",
					description: "There are no items to merge in this file.",
				});
				return;
			}

			setLoadingActionKey(`auto-all-sections-${fileId}`);

			try {
				// Call auto merge for all sources concurrently
				const mergeResult = await autoMergeByFileSourceList(
					Number(takeoffId),
					fileId,
					sourceTypes,
				);

				if (mergeResult.status !== "success") {
					notification.error({
						message: "Auto merge failed",
						description: "Failed to auto merge all sources. Please try again.",
					});
					return;
				}

				// Fetch all merged results
				const resultsData = await getMergeResultByFileSourceList(
					Number(takeoffId),
					fileId,
					sourceTypes,
				);

				if (resultsData.status === "success" && resultsData.data) {
					const preferredFields = await resolveColumnNames(1);

					// Build merged sections from API response
					const mergedSections: MergeWorkflowSection[] = [];

					sourceTypes.forEach((sourceType) => {
						const sourceData = resultsData.data[sourceType];
						if (!sourceData) return;

						const { autoMergedRows, pendingRows } = parseFileSourceMergeResult(
							sourceData,
							{
								fileId,
								sourceType,
								preferredFields,
							},
						);

						// Skip if both lists are empty
						if (autoMergedRows.length === 0 && pendingRows.length === 0) {
							return;
						}

						mergedSections.push({
							key: sourceType,
							title: sourceType,
							rows: [...autoMergedRows, ...pendingRows],
							groupedRows: {},
							autoMergeStarted: true,
							autoMergedRows,
							pendingRows,
							manualMergeCompleted: pendingRows.length === 0,
						});
					});

					mergedSections.forEach((section, idx) => {
						console.log(`Section ${idx} (${section.key}):`, {
							autoMergedRows: section.autoMergedRows.length,
							pendingRows: section.pendingRows.length,
							rows: section.rows.length,
						});
					});

					updateWorkflowFile(fileId, (f) => ({
						...f,
						mergedSections,
						// Note: sourceMergeStarted should remain false here
						// It should only be true when Ready stage merge is started
						mergeStatus: {
							...f.mergeStatus,
							sourceMergeStatus: sourceTypes.reduce(
								(acc, sourceType) => {
									const section = mergedSections.find(
										(s) => s.key === sourceType,
									);
									const hasPending = (section?.pendingRows?.length || 0) > 0;
									acc[sourceType] = {
										autoMerged: true,
										manualMergeCompleted: !hasPending,
										dataLoaded: true,
									};
									return acc;
								},
								{ ...f.mergeStatus.sourceMergeStatus },
							),
						},
					}));

					// Auto switch to Merged stage after successful merge
					console.log("Setting selectedStage to 'merged'");
					setSelectedStage("merged");

					notification.success({
						message: "Auto merge completed",
						description: "All sources have been auto merged successfully.",
					});
				}
			} catch (error) {
				console.error("Error in auto merge all sources:", error);
				notification.error({
					message: "Error",
					description: "An error occurred during auto merge.",
				});
			} finally {
				setLoadingActionKey(null);
			}
		},
		[
			takeoffId,
			workflowFiles,
			resolveColumnNames,
			buildSectionsFromData,
			updateWorkflowFile,
		],
	);

	const handleSelectFile = (fileId: number, allowIncomplete = false) => {
		const targetFile = workflowFiles.find((file) => file.id === fileId);
		if (!targetFile) {
			return;
		}

		if (
			!allowIncomplete &&
			fileId !== selectedFileId &&
			!isFileCompleted(targetFile)
		) {
			notification.warning({
				message: "File not ready",
				description:
					"Only completed files can be switched from the file list. Use Next File to continue unfinished work.",
			});
			return;
		}

		lastStageSyncedFileIdRef.current = null;
		setSelectedFileIdLocal(fileId);
		setSelectedFileId(fileId);
	};

	const handleSelectSection = (fileId: number, sectionKey: string) => {
		setActiveSectionKeys((current) => ({
			...current,
			[fileId]: sectionKey,
		}));
	};

	const canCreateTakeoff = useMemo(() => {
		const allDone = workflowFiles.every(
			(file) => getFileStageState(file, "ready") === "completed",
		);
		if (!allDone) return false;
		if (!isMergeAllMode || !mergeAllResult) return false;
		if (mergeAllResult.unmergedRows.length > 0) return false;
		return true;
	}, [workflowFiles, isMergeAllMode, mergeAllResult]);

	const handleCreateTakeoff = () => {
		if (!canCreateTakeoff) {
			if (!isMergeAllMode) {
				notification.warning({
					message: "Merge All Required",
					description:
						'Please click "Merge All File Labels" first and resolve all conflicts before creating the takeoff.',
				});
			} else if (mergeAllResult && mergeAllResult.unmergedRows.length > 0) {
				notification.warning({
					message: "Unresolved Conflicts",
					description:
						"There are still unmerged labels. Please resolve all conflicts via Manual Merge first.",
				});
			} else {
				notification.warning({
					message: "Unfinished Files",
					description:
						"Complete the merge flow for all files before creating the takeoff.",
				});
			}
			return;
		}

		setCreateTakeoffLoading(true);
		setTimeout(() => {
			router.push(`/projects/${projectId}/takeoff/${takeoffId}/analyze-new`);
		}, 2000);
	};

	const handleOpenReferenceModal = useCallback((row: MergeWorkflowRow) => {
		if (row.isMerged) {
			setMergedRefItem(row);
			setShowMergedRefModal(true);
		} else {
			setOriginalRefItem(row);
			setShowOriginalRefModal(true);
		}
	}, []);

	const handleOpenManualMergeModal = useCallback(
		(context: ManualMergeContext) => {
			setManualMergeContext(context);

			let pendingRows: any[] = [];
			const file = workflowFiles.find((f) => f.id === context.fileId);
			if (file) {
				if (context.mode === "ready") {
					pendingRows = file.readyPendingRows || [];
				} else if (context.sectionKey) {
					// First try to get from mergedSections (new API flow)
					const mergedSection = file.mergedSections.find(
						(s) => s.key === context.sectionKey,
					);
					if (mergedSection && mergedSection.pendingRows.length > 0) {
						pendingRows = mergedSection.pendingRows || [];
					} else {
						// Fallback to sections (old flow)
						const section = file.sections.find(
							(s) => s.key === context.sectionKey,
						);
						if (section) {
							pendingRows = section.pendingRows || [];
						}
					}
				}
			}

			setItemsMergePendingRows(pendingRows);
			setShowItemsMergeModal(true);
		},
		[workflowFiles],
	);

	const mockRequestDelay = useCallback(
		() => new Promise((resolve) => setTimeout(resolve, 3000)),
		[],
	);

	const handleAutoMergeSection = async (fileId: number, sectionKey: string) => {
		const actionKey = `auto-section-${fileId}-${sectionKey}`;
		setLoadingActionKey(actionKey);
		await mockRequestDelay();

		updateWorkflowFile(fileId, (file) => {
			const sections = file.sections.map((section) => {
				const shouldAutoMergeSection =
					file.operationType === FileOperationType.ArchitectureDrawing
						? true
						: section.key === sectionKey;

				if (!shouldAutoMergeSection) {
					return section;
				}

				const { autoMergedRows, pendingRows } = splitSectionRowsForMockMerge(
					section.groupedRows,
					section.title,
				);

				return {
					...section,
					autoMergeStarted: true,
					autoMergedRows,
					pendingRows,
					manualMergeCompleted: pendingRows.length === 0,
				};
			});

			return {
				...file,
				sections,
			};
		});

		setSelectedStage("merged");
		notification.success({
			message: "Mock auto merge complete",
			description: "The merged board now shows auto merged and pending rows.",
		});
		setLoadingActionKey(null);
	};

	const handleAutoMergeAllSections = async (fileId: number) => {
		const actionKey = `auto-all-sections-${fileId}`;
		setLoadingActionKey(actionKey);
		await mockRequestDelay();

		updateWorkflowFile(fileId, (file) => {
			const sections = file.sections.map((section) => {
				const { autoMergedRows, pendingRows } = splitSectionRowsForMockMerge(
					section.groupedRows,
					section.title,
				);

				return {
					...section,
					autoMergeStarted: true,
					autoMergedRows,
					pendingRows,
					manualMergeCompleted: pendingRows.length === 0,
				};
			});

			return {
				...file,
				sections,
			};
		});

		setSelectedStage("merged");
		notification.success({
			message: "Auto merge complete",
			description: "All sections have been auto merged.",
		});
		setLoadingActionKey(null);
	};

	const handleManualMergeSection = async (
		fileId: number,
		sectionKey: string,
	) => {
		const actionKey = `manual-section-${fileId}-${sectionKey}`;
		setLoadingActionKey(actionKey);
		await mockRequestDelay();

		updateWorkflowFile(fileId, (file) => {
			const sections = file.sections.map((section) => {
				if (section.key !== sectionKey) {
					return section;
				}

				const mergeResult = applyFullManualMerge(
					section.autoMergedRows,
					section.pendingRows,
					section.title,
				);

				return {
					...section,
					autoMergeStarted: true,
					autoMergedRows: mergeResult.autoMergedRows,
					pendingRows: mergeResult.pendingRows,
					manualMergeCompleted: mergeResult.completed,
				};
			});

			const nextFile = {
				...file,
				sections,
			};

			if (file.operationType === FileOperationType.Quote) {
				const quoteSection = sections[0];
				return {
					...nextFile,
					sourceMergeStarted: quoteSection?.pendingRows.length === 0,
					readyAutoMergedRows:
						quoteSection?.pendingRows.length === 0
							? quoteSection?.autoMergedRows || []
							: [],
					readyPendingRows: quoteSection?.pendingRows.length === 0 ? [] : [],
					readyManualMergeCompleted: quoteSection?.pendingRows.length === 0,
				};
			}

			return nextFile;
		});

		if (selectedFile?.operationType === FileOperationType.Quote) {
			setSelectedStage("ready");
		}

		notification.success({
			message: "Mock manual merge complete",
			description:
				"The pending rows have been merged into a single result list.",
		});
		setLoadingActionKey(null);
	};

	const handleAutoMergeSources = useCallback(
		async (fileId: number) => {
			const actionKey = `auto-sources-${fileId}`;
			setLoadingActionKey(actionKey);

			try {
				// Call autoMergeAllSourceTypesByFile API
				const mergeResult = await autoMergeAllSourceTypesByFile(
					Number(takeoffId),
					fileId,
				);

				if (mergeResult.status !== "success") {
					notification.error({
						message: "Auto Merge Failed",
						description: "Failed to auto merge sources. Please try again.",
					});
					setLoadingActionKey(null);
					return;
				}

				// Get the merged result using getAllGroupedByFile
				const groupedResult = await getAllGroupedByFile(
					Number(takeoffId),
					fileId,
				);

				if (groupedResult.status === "success" && groupedResult.data) {
					const preferredFields = await resolveColumnNames(1);

					const { autoMergedRows, pendingRows } = parseFileSourceMergeResult(
						groupedResult.data,
						{
							fileId,
							sourceType: "Ready",
							preferredFields,
						},
					);

					updateWorkflowFile(fileId, (file) => ({
						...file,
						sourceMergeStarted: true,
						readyAutoMergedRows: autoMergedRows,
						readyPendingRows: pendingRows,
						readyManualMergeCompleted: pendingRows.length === 0,
						mergeStatus: {
							...file.mergeStatus,
							readyDataLoaded: true,
						},
					}));

					setSelectedStage("ready");
					notification.success({
						message: "Auto Merge Sources Complete",
						description: `Successfully merged sources. ${autoMergedRows.length} merged, ${pendingRows.length} pending.`,
					});
				} else {
					notification.error({
						message: "Failed to Load Results",
						description: "Auto merge completed but failed to load results.",
					});
				}
			} catch (error) {
				console.error("Error in auto merge sources:", error);
				notification.error({
					message: "Error",
					description: "An error occurred during auto merge sources.",
				});
			} finally {
				setLoadingActionKey(null);
			}
		},
		[takeoffId, resolveColumnNames, updateWorkflowFile],
	);

	const handleAutoMergeReady = async (fileId: number) => {
		const actionKey = `auto-ready-${fileId}`;
		setLoadingActionKey(actionKey);
		await mockRequestDelay();

		updateWorkflowFile(fileId, (file) => {
			const mergeResult = applyFullManualMerge(
				file.readyAutoMergedRows,
				file.readyPendingRows,
				"Ready Merge",
			);

			return {
				...file,
				readyAutoMergedRows: mergeResult.autoMergedRows,
				readyPendingRows: mergeResult.pendingRows,
				readyManualMergeCompleted: mergeResult.completed,
			};
		});

		notification.success({
			message: "Mock ready auto merge complete",
			description: "The file is now fully merged in the ready board.",
		});
		setLoadingActionKey(null);
	};

	const handleMoveToNextFile = () => {
		const currentIndex = workflowFiles.findIndex(
			(file) => file.id === selectedFileId,
		);
		if (currentIndex < 0) {
			return;
		}

		const unfinishedFiles = workflowFiles.filter(
			(file) => getFileStageState(file, "ready") !== "completed",
		);
		const nextFile =
			workflowFiles
				.slice(currentIndex + 1)
				.find((file) => getFileStageState(file, "ready") !== "completed") ||
			unfinishedFiles[0];
		if (!nextFile) {
			notification.info({
				message: "Info",
				description: "No next file available.",
			});
			return;
		}

		handleSelectFile(nextFile.id, true);
	};

	const handleResetCurrentFile = async (fileId: number) => {
		const actionKey = `reset-file-${fileId}`;
		setLoadingActionKey(actionKey);
		await mockRequestDelay();

		const initialFile = initialWorkflowFilesRef.current.find(
			(file) => file.id === fileId,
		);
		if (!initialFile) {
			setLoadingActionKey(null);
			return;
		}

		setWorkflowFiles((current) =>
			current.map((file) =>
				file.id === fileId ? cloneWorkflowFiles([initialFile])[0] : file,
			),
		);
		setSelectedStage("unmerged");
		lastStageSyncedFileIdRef.current = fileId;
		setLoadingActionKey(null);
		notification.success({
			message: "Mock reset complete",
			description:
				"The current file has been reset to the initial unmerged state.",
		});
	};

	const handleRequestSourceMerge = (fileId: number) => {
		const file = workflowFiles.find((item) => item.id === fileId);
		if (!file) {
			return;
		}

		// Check mergedSections first (new API flow), fallback to sections (old flow)
		const sectionsToCheck =
			file.mergedSections.length > 0 ? file.mergedSections : file.sections;

		const hasPendingSections = sectionsToCheck.some(
			(section) => !section.autoMergeStarted || section.pendingRows.length > 0,
		);

		if (hasPendingSections) {
			notification.warning({
				message: "Pending manual merge",
				description:
					"At least one source still has unmerged items. Complete all source manual merges before file merge.",
			});
			return;
		}

		handleAutoMergeSources(fileId);
	};

	const allFilesCompleted = useMemo(() => {
		return workflowFiles.every((file) => isFileCompleted(file));
	}, [workflowFiles]);

	const handleMergeAllFileLabels = async () => {
		setMergeAllLoading(true);
		await mockRequestDelay();

		const allAutoMergedRows: MergeWorkflowRow[] = [];
		const allUnmergedRows: MergeWorkflowRow[] = [];

		workflowFiles.forEach((file) => {
			if (file.readyAutoMergedRows.length > 0) {
				allAutoMergedRows.push(...file.readyAutoMergedRows);
			} else {
				file.sections.forEach((section) => {
					if (section.autoMergedRows.length > 0) {
						allAutoMergedRows.push(...section.autoMergedRows);
					}
				});
			}

			if (file.readyPendingRows.length > 0) {
				allUnmergedRows.push(...file.readyPendingRows);
			} else {
				file.sections.forEach((section) => {
					if (section.pendingRows.length > 0) {
						allUnmergedRows.push(...section.pendingRows);
					}
				});
			}
		});

		const groupedAutoMerged = groupRowsByLabelAndSubLabel(allAutoMergedRows);
		const finalAutoMerged = Object.entries(groupedAutoMerged).map(
			([groupKey, rows]) =>
				createMergedRepresentativeRow(rows, groupKey, "All Files Merge"),
		);

		const mockUnmergedRows: MergeWorkflowRow[] =
			allUnmergedRows.length > 0
				? allUnmergedRows
				: [
						{
							key: "mock-unmerged-1",
							id: 99901,
							result: {
								Label: "2.05",
								"Sub Label": "",
								Product: "Window",
								"Product Type": "Casement Double",
								Operability: "Outswing Open",
								Quantity: "2",
								"Source Type": "Image",
							},
							sourceType: "Image",
							isMerged: false,
							evidence_id: 12554,
							evidence_msg: {
								id: 12554,
								type: "Elevation",
								s3_url: "",
								project_file_page_number: 5,
								project_file_id: 380,
							},
						} as any,
						{
							key: "mock-unmerged-2",
							id: 99902,
							result: {
								Label: "2.05",
								"Sub Label": "",
								Product: "Window",
								"Product Type": "Casement Single",
								Operability: "Fixed",
								Quantity: "1",
								"Source Type": "Table",
							},
							sourceType: "Table",
							isMerged: false,
							evidence_id: 12547,
							evidence_msg: {
								id: 12547,
								type: "Schedule",
								s3_url: "",
								project_file_page_number: 3,
								project_file_id: 380,
							},
						} as any,
					];

		setMergeAllResult({
			autoMergedRows: finalAutoMerged,
			unmergedRows: mockUnmergedRows,
		});
		setIsMergeAllMode(true);
		setMergeAllLoading(false);

		notification.success({
			message: "Merge All File Labels Complete",
			description: "All file labels have been merged successfully.",
		});
	};

	const handleManualMergeUnmergedRows = () => {
		if (!mergeAllResult) return;
		setItemsMergePendingRows(mergeAllResult.unmergedRows);
		setShowItemsMergeModal(true);
	};

	const handleExitMergeAllMode = () => {
		setIsMergeAllMode(false);
		setMergeAllResult(null);
	};

	const handleItemsMergeConfirm = useCallback(
		async (mergeResult: {
			success: boolean;
			mergedItemIds: number[];
			sourceType?: string;
			fileId?: number;
		}) => {
			if (!mergeResult.success) {
				return;
			}

			setLoadingActionKey("manual-merge-refresh");

			try {
				const fileId = mergeResult.fileId || manualMergeContext?.fileId;
				const sourceType =
					mergeResult.sourceType || manualMergeContext?.sectionKey;

				if (!fileId) {
					console.error("No fileId available for refresh");
					return;
				}

				if (manualMergeContext?.mode === "ready") {
					// Refresh ready data
					await loadReadyDataForFile(fileId);
					updateWorkflowFile(fileId, (file) => ({
						...file,
						readyManualMergeCompleted: true,
						mergeStatus: {
							...file.mergeStatus,
							readyManualMergeCompleted: true,
						},
					}));
				} else if (sourceType) {
					// Refresh merged data for this source
					const resultData = await getMergeResultByFileSource(
						Number(takeoffId),
						fileId,
						sourceType,
					);

					if (resultData.status === "success" && resultData.data) {
						const file = workflowFiles.find((f) => f.id === fileId);
						if (file) {
							const preferredFields = await resolveColumnNames(1);

							const { autoMergedRows, pendingRows } =
								parseFileSourceMergeResult(resultData.data, {
									fileId,
									sourceType,
									preferredFields,
								});

							const manualMergeCompleted = pendingRows.length === 0;

							updateWorkflowFile(fileId, (f) => {
								const existingIndex = f.mergedSections.findIndex(
									(s) => s.key === sourceType,
								);

								const updatedSection: MergeWorkflowSection = {
									key: sourceType,
									title: sourceType,
									rows: [...autoMergedRows, ...pendingRows],
									groupedRows: {},
									autoMergeStarted: true,
									autoMergedRows,
									pendingRows,
									manualMergeCompleted,
								};

								const newMergedSections =
									existingIndex >= 0
										? f.mergedSections.map((s, i) =>
												i === existingIndex ? updatedSection : s,
											)
										: [...f.mergedSections, updatedSection];

								return {
									...f,
									mergedSections: newMergedSections,
									mergeStatus: {
										...f.mergeStatus,
										sourceMergeStatus: {
											...f.mergeStatus.sourceMergeStatus,
											[sourceType]: {
												...f.mergeStatus.sourceMergeStatus[sourceType],
												manualMergeCompleted,
											},
										},
									},
								};
							});
						}
					}
				}
			} catch (error) {
				console.error("Error refreshing data after manual merge:", error);
			} finally {
				setLoadingActionKey(null);
			}
		},
		[
			manualMergeContext,
			takeoffId,
			workflowFiles,
			loadReadyDataForFile,
			resolveColumnNames,
			updateWorkflowFile,
		],
	);

	const handleItemsMergeCancel = useCallback(() => {
		setShowItemsMergeModal(false);
		setManualMergeContext(null);
		setItemsMergePendingRows([]);
	}, []);

	const isFullscreenAutoMergeLoading = Boolean(
		loadingActionKey?.startsWith("auto-section-") ||
		loadingActionKey?.startsWith("auto-all-sections-") ||
		loadingActionKey?.startsWith("auto-sources-") ||
		loadingActionKey?.startsWith("auto-ready-") ||
		loadingActionKey?.startsWith("reset-file-") ||
		mergeAllLoading ||
		createTakeoffLoading,
	);

	const fullscreenLoadingText = useMemo(() => {
		if (createTakeoffLoading) return "Creating takeoff...";
		return "Auto merging...";
	}, [createTakeoffLoading]);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center bg-white">
				<Spin />
			</div>
		);
	}

	const canAutoMergeSources = Boolean(
		selectedFile?.operationType === FileOperationType.ArchitectureDrawing &&
		!selectedFile.sourceMergeStarted,
	);
	const isSelectedFileCompleted = Boolean(
		selectedFile && isFileCompleted(selectedFile),
	);
	const hasOtherUnfinishedFiles = workflowFiles.some(
		(file) => file.id !== selectedFileId && !isFileCompleted(file),
	);
	const shouldShowResetMerge = Boolean(
		selectedFile && getFileStatusMeta(selectedFile).label !== "Unmerged",
	);
	const shouldShowNextFile = isSelectedFileCompleted && hasOtherUnfinishedFiles;

	return (
		<div className="min-h-screen flex flex-col">
			{isFullscreenAutoMergeLoading ? (
				<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/70">
					<div className="flex flex-col items-center gap-3 rounded-[20px] bg-white px-8 py-7 shadow-[0_12px_34px_rgba(16,24,40,0.12)]">
						<Spin size="large" />
						<div className="text-sm text-grey-dark">
							{fullscreenLoadingText}
						</div>
					</div>
				</div>
			) : null}

			<div className="h-[110px] border-b border-primaryN30 bg-white px-14 flex flex-row items-center justify-between">
				<div className="flex items-center gap-6 flex-1 min-w-0">
					<div className="min-w-0 overflow-x-auto">
						<div className="flex min-w-max items-center gap-4">
							{workflowFiles.map((file, index) => {
								const isSelected =
									file.id === selectedFileId && !isMergeAllMode;
								const canSelectFile =
									(isSelected || isFileCompleted(file)) && !isMergeAllMode;
								const fileListStatusMeta = getFileListStatusMeta(
									file,
									selectedFileId,
								);

								return (
									<div key={file.id} className="flex items-center gap-4">
										<button
											type="button"
											className="flex items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
											disabled={!canSelectFile}
											onClick={() => handleSelectFile(file.id)}
										>
											<div
												className={`flex h-4 w-4 items-center justify-center rounded-full ${fileListStatusMeta.dotClassName}`}
											>
												{isSelected ? (
													<div className="h-[6px] w-[6px] rounded-full bg-white" />
												) : null}
											</div>
											<div className="flex items-center gap-3">
												<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5F7FA]">
													<Image
														src="/assets/icons/extensions/pdf.svg"
														alt="PDF"
														width={18}
														height={18}
													/>
												</div>
												<div className="min-w-0">
													<div
														className={`max-w-[180px] truncate text-xs ${
															isSelected
																? "text-forumBlue-normal"
																: "text-grey-dark"
														}`}
													>
														{file.fileName}
													</div>
													<div className="mt-1 text-xxs text-grey-light-strong">
														{file.fileType} · {fileListStatusMeta.label}
													</div>
												</div>
											</div>
										</button>

										{index < workflowFiles.length - 1 ? (
											<div className="h-px w-10 bg-grey-light-strong" />
										) : null}
									</div>
								);
							})}

							{workflowFiles.length > 0 && (
								<>
									<div className="h-px w-10 bg-grey-light-strong" />
									<div className="flex items-center gap-3 text-left">
										<div
											className={`flex h-4 w-4 items-center justify-center rounded-full ${
												isMergeAllMode ? "bg-green-normal" : "bg-[#DCDCDC]"
											}`}
										>
											{isMergeAllMode ? (
												<svg
													width="8"
													height="8"
													viewBox="0 0 16 16"
													fill="none"
												>
													<path
														d="M13.3334 4L6.00008 11.3333L2.66675 8"
														stroke="white"
														strokeWidth="2.5"
														strokeLinecap="round"
														strokeLinejoin="round"
													/>
												</svg>
											) : null}
										</div>
										<div className="min-w-0">
											<div
												className={`text-xs ${
													isMergeAllMode
														? "text-grey-dark"
														: "text-grey-light-strong"
												}`}
											>
												Merge All File Labels
											</div>
											<div className="mt-1 text-xxs text-grey-light-strong">
												{isMergeAllMode
													? "Completed"
													: allFilesCompleted
														? "Ready"
														: "Not Started"}
											</div>
										</div>
									</div>
								</>
							)}
						</div>
					</div>
				</div>

				<Button
					className="custom-primary-btn !w-[150px]"
					disabled={!canCreateTakeoff || createTakeoffLoading}
					onClick={handleCreateTakeoff}
				>
					Create Takeoff
				</Button>
			</div>

			<div className="flex-1 flex px-14 py-6">
				{isMergeAllMode && mergeAllResult ? (
					<div className="min-w-0 border border-primaryN30 bg-white p-6 shadow-[0_12px_34px_rgba(16,24,40,0.05)]">
						<div className="flex items-center justify-between border-b border-primaryN30 pb-5 mb-6">
							<div>
								<div className="text-lg font-medium text-grey-dark">
									Merge All File Labels Results
								</div>
								<div className="mt-2 text-sm text-grey-normal">
									Review the merged results from all files
								</div>
							</div>
							<Button
								className="custom-default-btn !w-[130px]"
								onClick={handleExitMergeAllMode}
							>
								Back to Files
							</Button>
						</div>

						<div className="space-y-6">
							<div>
								<div className="mb-4 flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EDF7EE]">
										<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
											<path
												d="M13.3334 4L6.00008 11.3333L2.66675 8"
												stroke="#3F8C4C"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</div>
									<div>
										<div className="text-base font-medium text-grey-dark">
											Auto Merged Labels
										</div>
										<div className="text-xs text-grey-normal">
											{mergeAllResult.autoMergedRows.length} labels have been
											automatically merged from all files
										</div>
									</div>
									<div className="ml-auto rounded-full bg-[#EDF7EE] px-3 py-1 text-xs text-[#3F8C4C]">
										{mergeAllResult.autoMergedRows.length} Items
									</div>
								</div>
								<MergeRowsTable
									title="Auto Merged Labels"
									description="Labels that have been automatically merged"
									rows={mergeAllResult.autoMergedRows}
									columns={columnNames}
									emptyText="No auto merged labels."
									onOpenReferenceModal={handleOpenReferenceModal}
									scrollY={
										mergeAllResult.unmergedRows.length > 0
											? "calc((100vh - 520px) / 2)"
											: "calc(100vh - 400px)"
									}
								/>
							</div>

							<div>
								<div className="mb-4 flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF1F0]">
										<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
											<path
												d="M8 5.33333V8M8 10.6667H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z"
												stroke="#D14343"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</div>
									<div>
										<div className="text-base font-medium text-grey-dark">
											Unmerged Labels
										</div>
										<div className="text-xs text-grey-normal">
											{mergeAllResult.unmergedRows.length > 0
												? `${mergeAllResult.unmergedRows.length} labels require manual merge. Click "Manual Merge" to resolve conflicts.`
												: "All labels have been merged successfully."}
										</div>
									</div>
									<div className="ml-auto flex items-center gap-3">
										<div
											className={`rounded-full px-3 py-1 text-xs ${
												mergeAllResult.unmergedRows.length > 0
													? "bg-[#FFF1F0] text-[#D14343]"
													: "bg-[#EDF7EE] text-[#3F8C4C]"
											}`}
										>
											{mergeAllResult.unmergedRows.length} Items
										</div>
										{mergeAllResult.unmergedRows.length > 0 && (
											<Button
												className="custom-primary-btn !w-[150px]"
												onClick={handleManualMergeUnmergedRows}
											>
												Manual Merge
											</Button>
										)}
									</div>
								</div>
								{mergeAllResult.unmergedRows.length > 0 ? (
									<MergeRowsTable
										title="Unmerged Labels"
										description="Labels that need manual merge"
										rows={mergeAllResult.unmergedRows}
										columns={columnNames}
										emptyText="No unmerged labels."
										onOpenReferenceModal={handleOpenReferenceModal}
										scrollY="calc((100vh - 520px) / 2)"
									/>
								) : (
									<div className="rounded-[16px] border border-[#D4EDDA] bg-[#F4FBF6] p-6 text-center">
										<div className="flex items-center justify-center gap-2 text-[#3F8C4C]">
											<svg
												width="20"
												height="20"
												viewBox="0 0 20 20"
												fill="none"
											>
												<path
													d="M16.6667 5L7.50001 14.1667L3.33334 10"
													stroke="#3F8C4C"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
											<span className="text-sm font-medium">
												All labels have been merged successfully!
											</span>
										</div>
										<div className="mt-2 text-xs text-grey-normal">
											You can now proceed to create the takeoff.
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-[24px] border border-primaryN30 bg-white p-6 shadow-[0_12px_34px_rgba(16,24,40,0.05)]">
						{selectedFile ? (
							<>
								<div className="flex flex-wrap items-center justify-between gap-6 border-b border-primaryN30 pb-5">
									<div className="min-w-0">
										<div className="text-base text-grey-dark">
											{selectedFile.fileName}
										</div>
										<div className="mt-2 flex flex-wrap gap-2">
											<div className="rounded-full bg-[#EEF5FF] px-3 py-1 text-xxs text-forumBlue-normal">
												{selectedFile.fileType}
											</div>
											<div className="rounded-full bg-grey-light-hover px-3 py-1 text-xxs text-grey-normal">
												{selectedFile.labelsCount} Labels
											</div>
										</div>
									</div>

									<div className="flex-1 flex justify-center">
										<div className="flex min-w-max items-center gap-4 rounded-[20px] border border-primaryN30 bg-[#FCFCFD] px-5 py-3">
											{(["unmerged", "merged", "ready"] as WorkflowStage[]).map(
												(stage, index) => {
													const state = getFileStageState(selectedFile, stage);
													const isSelected =
														selectedStage === stage && !isMergeAllMode;
													const circleClassName =
														state === "completed"
															? "bg-forumBlue-normal"
															: state === "active"
																? "bg-green-normal"
																: "bg-[#DCDCDC]";

													return (
														<div
															key={stage}
															className="flex items-center gap-4"
														>
															<button
																type="button"
																className="flex items-center gap-2 text-left disabled:cursor-not-allowed"
																disabled={state === "pending" || isMergeAllMode}
																onClick={() => {
																	if (!isMergeAllMode) {
																		setSelectedStage(stage);
																	}
																}}
															>
																<div
																	className={`flex h-3 w-3 items-center justify-center rounded-full ${circleClassName}`}
																>
																	{isSelected ? (
																		<div className="h-[5px] w-[5px] rounded-full bg-white" />
																	) : null}
																</div>
																<div
																	className={`text-xs ${
																		isSelected
																			? "text-grey-dark"
																			: "text-grey-normal"
																	}`}
																>
																	{STAGE_META[stage].title}
																</div>
															</button>

															{index < 2 ? (
																<div className="h-px w-8 bg-grey-light-strong" />
															) : null}
														</div>
													);
												},
											)}
										</div>
									</div>

									<div className="flex items-center gap-3">
										{shouldShowResetMerge && (
											<Button
												className="custom-default-btn !w-[130px]"
												disabled={Boolean(loadingActionKey)}
												onClick={() => handleResetCurrentFile(selectedFile.id)}
											>
												Reset Merge
											</Button>
										)}
										{shouldShowNextFile && (
											<Button
												className="custom-primary-btn !w-[130px]"
												disabled={Boolean(loadingActionKey)}
												onClick={handleMoveToNextFile}
											>
												Next File
											</Button>
										)}
										{allFilesCompleted && (
											<Button
												className="custom-primary-btn !w-[180px]"
												disabled={Boolean(loadingActionKey)}
												onClick={handleMergeAllFileLabels}
											>
												Merge All File Labels
											</Button>
										)}
									</div>
								</div>

								{/* Architecture Drawing: 3-column layout for sections */}
								{selectedFile.operationType ===
									FileOperationType.ArchitectureDrawing &&
								selectedStage !== "ready" ? (
									<div className="mt-5 flex min-h-0 flex-1 flex-col">
										{/* Section action buttons */}
										<div className="mb-4 flex shrink-0 items-center justify-between">
											<div className="text-sm text-grey-dark">
												{selectedStage === "unmerged"
													? "Raw Labels by Source Type"
													: "Merged Labels by Source Type"}
											</div>
											<div className="flex items-center gap-3">
												{selectedStage === "unmerged" ? (
													<Button
														className="custom-primary-btn !w-[150px]"
														loading={
															loadingActionKey ===
															`auto-all-sections-${selectedFile.id}`
														}
														disabled={Boolean(loadingActionKey)}
														onClick={() =>
															handleAutoMergeAllSources(selectedFile.id)
														}
													>
														Auto Merge
													</Button>
												) : null}
												{selectedStage === "merged" && canAutoMergeSources ? (
													<Button
														className="custom-primary-btn !w-[150px]"
														loading={
															loadingActionKey ===
															`auto-sources-${selectedFile.id}`
														}
														disabled={Boolean(loadingActionKey)}
														onClick={() =>
															handleRequestSourceMerge(selectedFile.id)
														}
													>
														Merge File Labels
													</Button>
												) : null}
											</div>
										</div>

										{/* 3-column grid for sections */}
										<div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
											{(selectedStage === "merged" &&
											selectedFile.mergedSections.length > 0
												? selectedFile.mergedSections
												: selectedFile.unmergedSections.length > 0
													? selectedFile.unmergedSections
													: selectedFile.sections
											).map((section) => (
												<div
													key={section.key}
													className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-primaryN30 bg-white"
												>
													{/* Section header */}
													<div className="flex shrink-0 items-center border-b border-primaryN30 bg-[#FBFBFC] px-4 py-3">
														<div className="flex items-center gap-2">
															<span className="text-sm font-medium text-grey-dark">
																{section.title}
															</span>
															<span className="rounded-full bg-[#EEF5FF] px-2 py-0.5 text-[10px] text-forumBlue-normal">
																{getSectionCountByStage(section, selectedStage)}{" "}
																items
															</span>
														</div>
													</div>

													{/* Section content */}
													<div className="min-h-0 flex-1 overflow-auto p-3">
														{selectedStage === "unmerged" ? (
															<SectionTable
																rows={section.rows}
																columns={columnNames}
																onOpenReferenceModal={handleOpenReferenceModal}
															/>
														) : (
															<SectionMergedContent
																section={section}
																columns={columnNames}
																onOpenManualMergeModal={
																	handleOpenManualMergeModal
																}
																onOpenReferenceModal={handleOpenReferenceModal}
																fileId={selectedFile.id}
															/>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								) : null}

								{/* Quote type or Ready stage: single column */}
								{(selectedFile.operationType === FileOperationType.Quote ||
									selectedStage === "ready") && (
									<div className="mt-6 space-y-5">
										{selectedStage === "unmerged" ? (
											<UnmergedStageCard
												selectedFile={selectedFile}
												activeSection={activeSection}
												columnNames={columnNames}
												loadingActionKey={loadingActionKey}
												onAutoMergeSection={handleAutoMergeSection}
												onOpenReferenceModal={handleOpenReferenceModal}
											/>
										) : null}

										{selectedStage === "merged" ? (
											<MergedStageCard
												selectedFile={selectedFile}
												activeSection={activeSection}
												columnNames={columnNames}
												loadingActionKey={loadingActionKey}
												onOpenManualMergeModal={handleOpenManualMergeModal}
												onOpenReferenceModal={handleOpenReferenceModal}
											/>
										) : null}

										{selectedStage === "ready" ? (
											<ReadyStageCard
												selectedFile={selectedFile}
												columnNames={columnNames}
												loadingActionKey={loadingActionKey}
												onOpenManualMergeModal={handleOpenManualMergeModal}
												onOpenReferenceModal={handleOpenReferenceModal}
											/>
										) : null}
									</div>
								)}
							</>
						) : (
							<div className="flex min-h-[520px] items-center justify-center">
								<Empty
									description={
										<span className="text-xs text-grey-normal">
											No file available for merge workflow.
										</span>
									}
								/>
							</div>
						)}
					</div>
				)}
			</div>

			{showOriginalRefModal && (
				<OriginalItemReferenceModal
					open={showOriginalRefModal}
					files={MOCK_PROJECT_FILES || []}
					projectId={projectId}
					item={originalRefItem}
					onClose={() => {
						setShowOriginalRefModal(false);
						setOriginalRefItem(null);
					}}
				/>
			)}

			<MergedItemReferenceModal
				open={showMergedRefModal}
				projectId={projectId}
				files={MOCK_PROJECT_FILES || []}
				mergedItem={mergedRefItem}
				onClose={() => {
					setShowMergedRefModal(false);
					setMergedRefItem(null);
				}}
			/>
			{showItemsMergeModal && (
				<ManualMergeModal
					open={showItemsMergeModal}
					pendingRows={itemsMergePendingRows}
					fileIds={
						manualMergeContext?.fileId
							? [manualMergeContext.fileId]
							: workflowFiles.map((f) => f.id)
					}
					fileId={manualMergeContext?.fileId}
					sourceType={manualMergeContext?.sourceType}
					onConfirm={handleItemsMergeConfirm}
					onCancel={handleItemsMergeCancel}
				/>
			)}
		</div>
	);
}
