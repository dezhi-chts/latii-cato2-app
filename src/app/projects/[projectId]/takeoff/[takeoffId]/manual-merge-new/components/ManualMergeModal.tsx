"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Button,
	Checkbox,
	Empty,
	Image,
	Modal,
	notification,
	Spin,
	Table,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "next/navigation";

import {
	manualMergeByFileSource,
	manualMergeByFile,
	manualMergeByTakeOff,
} from "@/services/mergeService";
import { getTakeOffEvidenceUrlsByIds } from "@/services/takeOffService";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Valid source types for source-level merge API
const VALID_SOURCE_TYPES = [
	"Floor Plan",
	"Elevation",
	"Schedule",
	"window_door_unit_list",
] as const;

const isValidSourceType = (sourceType?: string): boolean => {
	if (!sourceType) return false;
	return VALID_SOURCE_TYPES.includes(sourceType as any);
};

interface ConflictGroup {
	groupKey: string;
	label: string;
	subLabel: string;
	items: any[];
	item_ids: number[];
}

interface MergeResult {
	success: boolean;
	mergedItemIds: number[];
	sourceType?: string;
	fileId?: number;
}

interface ManualMergeModalProps {
	open: boolean;
	pendingRows: any[];
	fileIds?: number[];
	fileId?: number;
	sourceType?: string;
	templateFields?: string[];
	onConfirm: (result: MergeResult) => void;
	onCancel: () => void;
}

interface EvidenceData {
	id: number;
	evidence_url?: string;
	s3_url?: string;
	type?: string;
	project_file_page_number?: number;
	project_file_id?: number;
	file_key?: string;
}

// Evidence data map keyed by item id
type EvidenceDataMap = Record<string, EvidenceData>;

const safeParseResult = (
	result: unknown,
	originalResult?: unknown,
): Record<string, unknown> => {
	// Prefer originalResult if available (contains the raw API data)
	const dataToUse = originalResult ?? result;

	if (!dataToUse) return {};
	if (typeof dataToUse === "string") {
		try {
			return JSON.parse(dataToUse);
		} catch {
			return {};
		}
	}
	if (typeof dataToUse === "object")
		return dataToUse as Record<string, unknown>;
	return {};
};

const formatCellValue = (value: unknown): string => {
	if (value === null || value === undefined || value === "") return "-";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
};

/**
 * Collect merge IDs from items for different merge levels
 * - For file-level merge: extracts take_off_result_item_ids and file_source_merge_result_ids
 * - For takeoff-level merge: extracts single_file_merge_result_ids, take_off_result_item_ids, and file_source_merge_result_ids
 */
const collectMergeIdsFromItems = (
	items: any[],
): {
	takeOffResultItemIds: number[];
	fileSourceMergeResultIds: number[];
	singleFileMergeResultIds: number[];
} => {
	const takeOffResultItemIds: number[] = [];
	const fileSourceMergeResultIds: number[] = [];
	const singleFileMergeResultIds: number[] = [];

	items.forEach((item) => {
		// Collect take_off_result_item_ids from take_off_result_item_id_list
		if (Array.isArray(item.take_off_result_item_id_list)) {
			takeOffResultItemIds.push(...item.take_off_result_item_id_list);
		}

		// Collect single_file_merge_result_ids (item's own id for takeoff-level merge)
		if (item.id) {
			singleFileMergeResultIds.push(item.id);
		}

		// Collect file_source_merge_result_ids from file_source_merge_result_id_list
		if (Array.isArray(item.file_source_merge_result_id_list)) {
			fileSourceMergeResultIds.push(...item.file_source_merge_result_id_list);
		}
		// Also check for single file_source_merge_result_id field
		if (item.file_source_merge_result_id) {
			fileSourceMergeResultIds.push(item.file_source_merge_result_id);
		}
		// Also check for file_source_merge_result_ids array
		if (Array.isArray(item.file_source_merge_result_ids)) {
			fileSourceMergeResultIds.push(...item.file_source_merge_result_ids);
		}
	});

	return {
		takeOffResultItemIds,
		fileSourceMergeResultIds,
		singleFileMergeResultIds,
	};
};

const buildConflictGroups = (pendingRows: any[]): ConflictGroup[] => {
	if (pendingRows.length === 0) return [];

	// Group by groupLabel + groupSubLabel if available
	const grouped: Record<string, any[]> = {};

	pendingRows.forEach((row) => {
		// Use groupLabel/groupSubLabel if available (from API response)
		// Otherwise fall back to result.Label/Sub Label
		const result = safeParseResult(row.result, row.originalResult);
		const label = row.groupLabel ?? String(result.Label || "");
		const subLabel = row.groupSubLabel ?? String(result["Sub Label"] || "");
		const key = `${label}_____${subLabel}`;
		if (!grouped[key]) grouped[key] = [];
		grouped[key].push(row);
	});

	return Object.entries(grouped).map(([key, items]) => {
		// Get label from first item
		const firstItem = items[0];
		const firstResult = safeParseResult(
			firstItem?.result,
			firstItem?.originalResult,
		);
		const label = firstItem?.groupLabel ?? String(firstResult.Label || "");
		const subLabel =
			firstItem?.groupSubLabel ?? String(firstResult["Sub Label"] || "");

		return {
			groupKey: key,
			label,
			subLabel,
			items,
			item_ids: items.map((i) => i.id),
		};
	});
};

const getFieldsFromItems = (items: any[]): string[] => {
	const fieldSet = new Set<string>();
	items.forEach((item) => {
		const result = safeParseResult(item.result, item.originalResult);
		Object.keys(result).forEach((k) => fieldSet.add(k));
	});

	const priority = [
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
	const ordered = priority.filter((f) => fieldSet.has(f));
	const rest = Array.from(fieldSet).filter((f) => !ordered.includes(f));
	return [...ordered, ...rest];
};

type MergeMode = "customize" | "keepAll";

interface TableItem {
	id: number;
	result: string;
	originalResult?: string;
	selectFields: string[];
	evidence_selected: boolean;
	evidence_id_list?: number[];
	evidence_msg?: any;
	groupLabel?: string;
	groupSubLabel?: string;
	[key: string]: any;
}

interface EvidenceItem {
	id: number;
	index: number;
	itemIndex: number; // The index of the item this evidence belongs to (1-based for display)
	item_id: number;
	evidence_selected: boolean;
	s3_url: string;
	type: string;
}

export default function ManualMergeModal({
	open,
	pendingRows,
	fileIds,
	fileId,
	sourceType,
	templateFields: propsTemplateFields,
	onConfirm,
	onCancel,
}: ManualMergeModalProps) {
	const params = useParams();
	const takeOffId = Number(params.takeoffId);

	const [conflictGroups, setConflictGroups] = useState<ConflictGroup[]>([]);
	const [activeGroupIndex, setActiveGroupIndex] = useState(0);
	const [mergeMode, setMergeMode] = useState<MergeMode>("customize");

	const [tableData, setTableData] = useState<TableItem[]>([]);
	const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
	const [evidenceMap, setEvidenceMap] = useState<EvidenceDataMap>({});
	const [loadingEvidences, setLoadingEvidences] = useState(false);

	console.log("[ManualMergeModal] sourceType:", sourceType);

	// Determine evidence fetch mode based on sourceType (computed, not state to avoid timing issues)
	const evidenceFetchMode = useMemo(():
		| "item_id"
		| "take_off_result_item_id" => {
		return isValidSourceType(sourceType)
			? "item_id"
			: "take_off_result_item_id";
	}, [sourceType]);

	const [confirming, setConfirming] = useState(false);
	const [showKeepAllModal, setShowKeepAllModal] = useState(false);
	const [keepAllItems, setKeepAllItems] = useState<any[]>([]);
	const [keepAllSubmitting, setKeepAllSubmitting] = useState(false);

	// Use template fields from props, ensure Label and Sub Label are first
	const templateFields = useMemo(() => {
		if (!propsTemplateFields || propsTemplateFields.length === 0) {
			return [];
		}
		// Ensure Label and Sub Label are at the beginning
		const hasLabel = propsTemplateFields.includes("Label");
		const hasSubLabel = propsTemplateFields.includes("Sub Label");
		const otherFields = propsTemplateFields.filter(
			(f) => f !== "Label" && f !== "Sub Label",
		);
		const result: string[] = [];
		if (hasLabel) result.push("Label");
		if (hasSubLabel) result.push("Sub Label");
		result.push(...otherFields);
		return result;
	}, [propsTemplateFields]);

	useEffect(() => {
		if (open) {
			const groups = buildConflictGroups(pendingRows);
			setConflictGroups(groups);
			setActiveGroupIndex(0);
			setMergeMode("customize");
		}
	}, [open, pendingRows]);

	const activeGroup = conflictGroups[activeGroupIndex] || null;

	// Fetch evidences for current active group when it changes
	useEffect(() => {
		const fetchEvidencesForGroup = async () => {
			if (!open || !activeGroup) return;

			// Use the computed evidenceFetchMode to determine which field to use
			const idsToFetch: number[] = [];

			if (evidenceFetchMode === "item_id") {
				// Source-level merge: use item.id directly
				activeGroup.items.forEach((item) => {
					if (item.id) {
						idsToFetch.push(item.id);
					}
				});
			} else {
				// File-level or takeoff-level merge: use take_off_result_item_id_list
				activeGroup.items.forEach((item) => {
					if (Array.isArray(item.take_off_result_item_id_list)) {
						idsToFetch.push(...item.take_off_result_item_id_list);
					}
				});
			}

			if (idsToFetch.length === 0) return;

			setLoadingEvidences(true);
			try {
				// Join IDs with comma for the API call
				const resultItemIds = idsToFetch.join(",");
				const result = await getTakeOffEvidenceUrlsByIds(resultItemIds);

				if (result.status === "success" && result.data) {
					// The API returns a map with IDs as keys
					setEvidenceMap(result.data as EvidenceDataMap);
				}
			} catch (error) {
				console.error("[ManualMergeModal] Error fetching evidences:", error);
			} finally {
				setLoadingEvidences(false);
			}
		};

		fetchEvidencesForGroup();
	}, [open, activeGroup, evidenceFetchMode]);

	// Use template fields if available, otherwise fallback to getFieldsFromItems
	const fields = useMemo(() => {
		if (templateFields.length > 0) {
			return templateFields;
		}
		if (!activeGroup) return [];
		return getFieldsFromItems(activeGroup.items);
	}, [activeGroup, templateFields]);

	const generateTableData = useCallback((items: any[]) => {
		const data: TableItem[] = items.map((item: any, index: number) => {
			const result = safeParseResult(item.result, item.originalResult);
			return {
				...item,
				selectFields: index === 0 ? Object.keys(result) : ["Label"],
				evidence_selected: true,
			};
		});
		setTableData(data);
	}, []);

	const generateEvidenceList = useCallback(
		(items: any[]) => {
			const evidences: EvidenceItem[] = [];
			let evidenceIndex = 0;

			items.forEach((item: any, itemIdx: number) => {
				const itemIndex = itemIdx + 1; // 1-based index for display

				// First try to get from evidence_msg (if available)
				const msg = item.evidence_msg;
				if (msg) {
					const url =
						typeof msg === "object" && !Array.isArray(msg)
							? msg.evidence_url || msg.s3_url || ""
							: Array.isArray(msg)
								? msg[0]?.evidence_url || msg[0]?.s3_url || ""
								: "";
					if (url) {
						evidences.push({
							id: msg.id || item.evidence_id || evidenceIndex,
							index: evidenceIndex++,
							itemIndex,
							item_id: item.id,
							evidence_selected: true,
							s3_url: url,
							type: msg.type || "",
						});
						return;
					}
				}

				// Try to find evidence from evidenceMap based on fetch mode
				if (evidenceFetchMode === "item_id") {
					// Source-level merge: match using item.id (one evidence per item)
					const itemId = String(item.id);
					const matchedEvidence = evidenceMap[itemId];
					if (matchedEvidence) {
						const imageUrl =
							matchedEvidence.evidence_url || matchedEvidence.s3_url;
						if (imageUrl) {
							evidences.push({
								id: matchedEvidence.id,
								index: evidenceIndex++,
								itemIndex,
								item_id: item.id,
								evidence_selected: true,
								s3_url: imageUrl,
								type: matchedEvidence.type || "",
							});
							return;
						}
					}
				} else {
					// File-level or takeoff-level merge: match using take_off_result_item_id_list
					// One item may have multiple take_off_result_item_ids, each with its own evidence
					const takeOffResultItemIds = item.take_off_result_item_id_list || [];
					let foundAny = false;
					for (const resultItemId of takeOffResultItemIds) {
						const matchedEvidence = evidenceMap[String(resultItemId)];
						if (matchedEvidence) {
							const imageUrl =
								matchedEvidence.evidence_url || matchedEvidence.s3_url;
							if (imageUrl) {
								evidences.push({
									id: matchedEvidence.id,
									index: evidenceIndex++,
									itemIndex,
									item_id: item.id,
									evidence_selected: true,
									s3_url: imageUrl,
									type: matchedEvidence.type || "",
								});
								foundAny = true;
							}
						}
					}
					if (foundAny) {
						return;
					}
				}

				// Fallback: add item without evidence image
				evidences.push({
					id: item.evidence_id || evidenceIndex,
					index: evidenceIndex++,
					itemIndex,
					item_id: item.id,
					evidence_selected: true,
					s3_url: "",
					type: "",
				});
			});
			setEvidenceList(evidences);
		},
		[evidenceMap, evidenceFetchMode],
	);

	// Generate table data when activeGroup changes
	useEffect(() => {
		if (!activeGroup) return;
		generateTableData(activeGroup.items);
	}, [activeGroup, generateTableData]);

	// Generate evidence list when activeGroup or evidenceMap changes
	// Wait for evidenceMap to be loaded before generating evidence list
	useEffect(() => {
		if (!activeGroup) return;
		// Always generate evidence list - if evidenceMap is empty, items will use fallback (no image)
		// This ensures the list is updated when evidenceMap is loaded
		generateEvidenceList(activeGroup.items);
	}, [activeGroup, evidenceMap, generateEvidenceList]);

	useEffect(() => {
		if (!activeGroup) return;
		if (mergeMode === "customize") {
			setTableData((prev) =>
				prev.map((item, idx) => {
					const result = safeParseResult(item.result, item.originalResult);
					return {
						...item,
						selectFields: idx === 0 ? Object.keys(result) : ["Label"],
					};
				}),
			);
			setEvidenceList((prev) =>
				prev.map((e) => ({ ...e, evidence_selected: true })),
			);
		} else {
			setTableData((prev) =>
				prev.map((item) => ({ ...item, selectFields: [] })),
			);
			setEvidenceList((prev) =>
				prev.map((e) => ({ ...e, evidence_selected: true })),
			);
		}
	}, [mergeMode]);

	const handleToggleField = useCallback(
		(itemId: number, field: string) => {
			if (mergeMode !== "customize" || field === "Label") return;
			setTableData((prev) =>
				prev.map((item) => {
					if (item.id === itemId) {
						if (item.selectFields.includes(field)) {
							return {
								...item,
								selectFields: item.selectFields.filter((f) => f !== field),
							};
						}
						return {
							...item,
							selectFields: [...item.selectFields, field],
						};
					}
					return item;
				}),
			);
		},
		[mergeMode],
	);

	const handleEvidenceChecked = useCallback(
		(index: number) => {
			if (mergeMode === "keepAll") return;
			setEvidenceList((prev) =>
				prev.map((item, i) =>
					i === index
						? { ...item, evidence_selected: !item.evidence_selected }
						: item,
				),
			);
		},
		[mergeMode],
	);

	const computedMergedResult = useMemo(() => {
		if (mergeMode !== "customize" || tableData.length === 0) return null;
		const merged: Record<string, string> = {};
		fields.forEach((field) => {
			for (const item of tableData) {
				if (item.selectFields.includes(field)) {
					const result = safeParseResult(item.result, item.originalResult);
					merged[field] = formatCellValue(result[field]);
					break;
				}
			}
			if (!merged[field]) {
				const firstItem = tableData[0];
				const result = safeParseResult(
					firstItem?.result,
					firstItem?.originalResult,
				);
				merged[field] = formatCellValue(result[field]);
			}
		});
		return merged;
	}, [tableData, fields, mergeMode]);

	// Handle Keep All button click - open new modal with all conflict items
	const handleKeepAllClick = useCallback(() => {
		if (!activeGroup || tableData.length === 0) return;

		// Generate items with copy1, copy2 suffix for Label
		const itemsWithCopySuffix = tableData.map((item, index) => {
			const result = safeParseResult(item.result, item.originalResult);
			const originalLabel = result.Label || "";
			const newLabel =
				index === 0 ? originalLabel : `${originalLabel} copy${index}`;

			return {
				...item,
				id: item.id,
				originalResult: item.originalResult,
				result: {
					...result,
					Label: newLabel,
				},
				modifiedLabel: newLabel,
			};
		});

		setKeepAllItems(itemsWithCopySuffix);
		setShowKeepAllModal(true);
	}, [activeGroup, tableData]);

	// Handle Keep All submit
	const handleKeepAllSubmit = useCallback(async () => {
		// fileId can be 0 for takeoff-level merge, so check for undefined/null specifically
		if (fileId === undefined || fileId === null || keepAllItems.length === 0) {
			notification.error({
				message: "Error",
				description: "Missing required parameters",
			});
			return;
		}

		setKeepAllSubmitting(true);
		try {
			let res;

			if (isValidSourceType(sourceType)) {
				// Source-level merge: use manualMergeByFileSource
				const merge_list = keepAllItems.map((item) => ({
					result: item.result,
					take_off_result_item_ids: [item.id],
				}));

				res = await manualMergeByFileSource(
					takeOffId,
					fileId,
					sourceType!,
					merge_list,
				);
			} else if (fileId === 0) {
				// Takeoff-level merge (multiple files): use manualMergeByTakeOff
				const merge_list = keepAllItems.map((item) => {
					const {
						takeOffResultItemIds,
						fileSourceMergeResultIds,
						singleFileMergeResultIds,
					} = collectMergeIdsFromItems([item]);

					return {
						result: item.result,
						single_file_merge_result_ids: singleFileMergeResultIds,
						take_off_result_item_ids: takeOffResultItemIds,
						file_source_merge_result_ids: fileSourceMergeResultIds,
					};
				});

				res = await manualMergeByTakeOff(takeOffId, merge_list);
			} else {
				// File-level merge (single file internal): use manualMergeByFile
				const merge_list = keepAllItems.map((item) => {
					const { takeOffResultItemIds, singleFileMergeResultIds } =
						collectMergeIdsFromItems([item]);

					return {
						result: item.result,
						take_off_result_item_ids: takeOffResultItemIds,
						file_source_merge_result_ids: singleFileMergeResultIds,
					};
				});

				res = await manualMergeByFile(takeOffId, fileId, merge_list);
			}

			if (res.status === "success") {
				notification.success({
					message: "Keep All Submitted",
					description: `Successfully merged ${keepAllItems.length} items.`,
				});
				setShowKeepAllModal(false);

				const mergedItemIds = keepAllItems.map((item) => item.id);

				// Remove the current group from conflict groups
				const remaining = conflictGroups.filter(
					(g) => g.groupKey !== activeGroup?.groupKey,
				);
				setConflictGroups(remaining);

				if (remaining.length === 0) {
					// All groups merged, notify parent to refresh data and close modal
					onConfirm({
						success: true,
						mergedItemIds,
						sourceType,
						fileId,
					});
					onCancel();
				} else {
					const nextIndex = Math.min(activeGroupIndex, remaining.length - 1);
					setActiveGroupIndex(nextIndex);
					// Notify parent about partial merge success
					onConfirm({
						success: true,
						mergedItemIds,
						sourceType,
						fileId,
					});
				}
			} else {
				notification.error({
					message: "Submission Failed",
					description: "Failed to submit Keep All merge.",
				});
			}
		} catch (error) {
			console.error("[ManualMergeModal] Keep All submit error:", error);
			notification.error({
				message: "Error",
				description: "An error occurred while submitting.",
			});
		} finally {
			setKeepAllSubmitting(false);
		}
	}, [
		fileId,
		sourceType,
		keepAllItems,
		takeOffId,
		conflictGroups,
		activeGroup,
		activeGroupIndex,
		onConfirm,
		onCancel,
	]);

	// Handle Customize submit
	const handleCustomizeSubmit = useCallback(async () => {
		// fileId can be 0 for takeoff-level merge, so check for undefined/null specifically
		if (
			fileId === undefined ||
			fileId === null ||
			!activeGroup ||
			!computedMergedResult
		) {
			notification.error({
				message: "Error",
				description: "Missing required parameters",
			});
			return;
		}

		setConfirming(true);
		try {
			const mergedItemIds = tableData.map((item) => item.id);
			let res;

			if (isValidSourceType(sourceType)) {
				// Source-level merge: use manualMergeByFileSource
				const merge_list = [
					{
						result: computedMergedResult,
						take_off_result_item_ids: mergedItemIds,
					},
				];

				res = await manualMergeByFileSource(
					takeOffId,
					fileId,
					sourceType!,
					merge_list,
				);
			} else if (fileId === 0) {
				// Takeoff-level merge (multiple files): use manualMergeByTakeOff
				const {
					takeOffResultItemIds,
					fileSourceMergeResultIds,
					singleFileMergeResultIds,
				} = collectMergeIdsFromItems(tableData);

				const merge_list = [
					{
						result: computedMergedResult,
						single_file_merge_result_ids: singleFileMergeResultIds,
						take_off_result_item_ids: takeOffResultItemIds,
						file_source_merge_result_ids: fileSourceMergeResultIds,
					},
				];

				res = await manualMergeByTakeOff(takeOffId, merge_list);
			} else {
				// File-level merge (single file internal): use manualMergeByFile
				const { takeOffResultItemIds, singleFileMergeResultIds } =
					collectMergeIdsFromItems(tableData);

				const merge_list = [
					{
						result: computedMergedResult,
						take_off_result_item_ids: takeOffResultItemIds,
						file_source_merge_result_ids: singleFileMergeResultIds,
					},
				];

				res = await manualMergeByFile(takeOffId, fileId, merge_list);
			}

			if (res.status === "success") {
				notification.success({
					message: "Merge Submitted",
					description: `Successfully merged items for "${activeGroup.label}".`,
				});

				// Remove the current group from conflict groups
				const remaining = conflictGroups.filter(
					(g) => g.groupKey !== activeGroup.groupKey,
				);
				setConflictGroups(remaining);

				if (remaining.length === 0) {
					// All groups merged, notify parent to refresh data and close modal
					onConfirm({
						success: true,
						mergedItemIds,
						sourceType,
						fileId,
					});
					onCancel();
				} else {
					const nextIndex = Math.min(activeGroupIndex, remaining.length - 1);
					setActiveGroupIndex(nextIndex);
					// Notify parent about partial merge success
					onConfirm({
						success: true,
						mergedItemIds,
						sourceType,
						fileId,
					});
				}
			} else {
				notification.error({
					message: "Submission Failed",
					description: "Failed to submit merge.",
				});
			}
		} catch (error) {
			console.error("[ManualMergeModal] Customize submit error:", error);
			notification.error({
				message: "Error",
				description: "An error occurred while submitting.",
			});
		} finally {
			setConfirming(false);
		}
	}, [
		fileId,
		sourceType,
		activeGroup,
		computedMergedResult,
		tableData,
		takeOffId,
		conflictGroups,
		activeGroupIndex,
		onConfirm,
		onCancel,
	]);

	const mergedHeaders = useMemo(() => {
		return fields.filter((f) => f !== "Source Type");
	}, [fields]);

	const customizeColumns = useMemo<ColumnsType<any>>(() => {
		if (!activeGroup) return [];

		const indexCol: ColumnsType<any>[number] = {
			title: "",
			key: "_index",
			width: 44,
			align: "center",
			fixed: "left",
			render: (_: unknown, __: unknown, index: number) => (
				<span className="inline-flex h-5 w-5 items-center justify-center rounded bg-forumBlue-normal text-[10px] text-white">
					{index + 1}
				</span>
			),
		};

		const idCol: ColumnsType<any>[number] = {
			title: <span className="text-xs text-grey-normal">#</span>,
			key: "_id",
			width: 60,
			align: "center",
			fixed: "left",
			render: (_: unknown, record: any) => (
				<span className="text-xs text-grey-normal">{record.id}</span>
			),
		};

		const fieldCols: ColumnsType<any> = fields.map((field) => ({
			title: (
				<span className="whitespace-nowrap text-xs text-grey-normal">
					{field}
				</span>
			),
			key: field,
			width: field.length > 15 ? 150 : 100,
			align: "center" as const,
			render: (_: unknown, record: any) => {
				const result = safeParseResult(record.result, record.originalResult);
				const value = formatCellValue(result[field]);
				const isSelected =
					mergeMode === "customize" &&
					(record.selectFields || []).includes(field);
				const isLabel = field === "Label";

				return (
					<div
						className={`cursor-pointer rounded px-1.5 py-0.5 text-xs transition-all ${
							isLabel
								? "bg-[#EEF5FF] font-medium text-forumBlue-normal"
								: isSelected
									? "border border-forumBlue-normal bg-[#EEF5FF]/50 text-grey-dark"
									: "border border-transparent text-grey-normal hover:border-primaryN30 hover:bg-[#FCFCFD]"
						}`}
						onClick={() => handleToggleField(record.id, field)}
					>
						{value}
					</div>
				);
			},
		}));

		return [indexCol, idCol, ...fieldCols];
	}, [activeGroup, fields, mergeMode, handleToggleField]);

	const mergedColumns = useMemo<ColumnsType<any>>(() => {
		const indexCol: ColumnsType<any>[number] = {
			title: "",
			key: "_idx",
			width: 44,
			align: "center",
			render: () => <Checkbox checked className="pointer-events-none" />,
		};

		const fieldCols: ColumnsType<any> = mergedHeaders.map((field) => ({
			title: (
				<span className="whitespace-nowrap text-xs text-grey-normal">
					{field}
				</span>
			),
			key: field,
			width: field.length > 15 ? 150 : 100,
			align: "center" as const,
			render: (_: unknown, record: any) => {
				const value = formatCellValue(record[field]);
				return <span className="text-xs text-grey-dark">{value}</span>;
			},
		}));

		return [indexCol, ...fieldCols];
	}, [mergedHeaders]);

	const totalCount = conflictGroups.length;

	return (
		<>
			<Modal
				open={open}
				title={null}
				footer={null}
				closable={true}
				onCancel={onCancel}
				width="92vw"
				style={{ top: 24 }}
				styles={{
					body: {
						padding: 0,
						maxHeight: "calc(100vh - 60px)",
						overflow: "hidden",
					},
				}}
				maskClosable={true}
			>
				<div className="flex h-[calc(100vh-80px)] flex-col">
					{/* Header */}
					<div className="flex shrink-0 items-center justify-between border-b border-primaryN30 px-6 py-3">
						<div className="flex items-center gap-4">
							<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF5FF]">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
									<path
										d="M16 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19V5C18 3.89543 17.1046 3 16 3Z"
										stroke="#427CCE"
										strokeWidth="1.5"
									/>
									<path
										d="M9 7H15M9 11H15M9 15H12"
										stroke="#427CCE"
										strokeWidth="1.5"
										strokeLinecap="round"
									/>
								</svg>
							</div>
							<div>
								<div className="text-base font-medium text-grey-dark">
									Manual Merge
								</div>
								<div className="mt-0.5 text-xs text-grey-normal">
									Resolve conflicting items by selecting the preferred values
									for each field
								</div>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2 rounded-full bg-[#F5F7FA] px-4 py-1.5">
								<span className="text-xs text-grey-normal">Remaining</span>
								<span className="text-xs font-medium text-forumBlue-normal">
									{totalCount}
								</span>
							</div>
							{/* <Button
							className="custom-default-btn !h-8 !w-[90px]"
							onClick={onCancel}
						>
							Cancel
						</Button> */}
						</div>
					</div>

					{/* Body */}
					<div className="flex flex-1 overflow-hidden">
						{/* Left panel */}
						<div className="w-[200px] shrink-0 overflow-y-auto border-r border-primaryN30 bg-[#FCFCFD] p-4">
							<div className="mb-4">
								<div className="text-sm font-medium text-grey-dark">
									Reconcile Panel
								</div>
								<div className="mt-1 text-xs text-grey-normal">
									Handle {totalCount} duplicates
								</div>
							</div>

							<div className="space-y-2">
								{conflictGroups.map((group, index) => {
									const isActive = index === activeGroupIndex;
									return (
										<button
											key={group.groupKey}
											type="button"
											className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
												isActive
													? "border border-forumBlue-normal bg-[#EEF5FF] shadow-[0_2px_8px_rgba(66,124,206,0.12)]"
													: "border border-transparent hover:border-primaryN30 hover:bg-white"
											}`}
											onClick={() => {
												setActiveGroupIndex(index);
											}}
										>
											<div
												className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
													isActive ? "bg-forumBlue-normal" : "bg-[#DCDCDC]"
												}`}
											>
												<div className="h-[6px] w-[6px] rounded-full bg-white" />
											</div>
											<div className="min-w-0 flex-1 overflow-hidden">
												<div
													className={`truncate text-xs font-medium ${
														isActive
															? "text-forumBlue-normal"
															: "text-grey-dark"
													}`}
												>
													{group.label || "Unknown"}
												</div>
												<div
													className="mt-0.5 truncate text-[10px] text-grey-normal"
													title={`Items ${group.item_ids.join(", ")}`}
												>
													Items {group.item_ids.join(", ")}
												</div>
											</div>
										</button>
									);
								})}
							</div>
						</div>

						{/* Right panel */}
						<div className="flex flex-1 flex-col overflow-hidden">
							{activeGroup ? (
								<>
									{/* Toolbar */}
									<div className="flex shrink-0 items-center justify-between border-b border-primaryN30 px-5 py-2.5">
										<div className="flex rounded-lg border border-primaryN30 bg-[#FCFCFD]">
											<button
												type="button"
												className={`rounded-l-lg px-4 py-1.5 text-xs transition-colors ${
													mergeMode === "customize"
														? "bg-primaryN30 font-bold text-grey-normal"
														: "bg-primaryN20 font-normal text-grey-normal"
												}`}
												onClick={() => setMergeMode("customize")}
											>
												Customize
											</button>
											<button
												type="button"
												className={`ml-px rounded-r-lg px-4 py-1.5 text-xs transition-colors ${
													mergeMode === "keepAll"
														? "bg-primaryN30 font-bold text-grey-normal"
														: "bg-primaryN20 font-normal text-grey-normal"
												}`}
												onClick={() => setMergeMode("keepAll")}
											>
												Keep All
											</button>
										</div>
									</div>

									{/* Content area */}
									<div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
										{/* Source items table - 50% height */}
										<div className=" mb-4 shrink-0">
											<div className="overflow-hidden">
												<Table
													rowKey={(record) => record.id || Math.random()}
													columns={customizeColumns}
													dataSource={tableData}
													pagination={false}
													scroll={{
														x: "max-content",
														y: "calc(30vh + 50px)",
													}}
													size="small"
													className="max-h-[calc(30vh + 50px)] small-font-table [&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
												/>
											</div>
										</div>

										{/* Evidence images - fill remaining height (between top table and bottom Final Item) */}
										<div className="mb-4 min-h-0 flex-1 overflow-y-auto">
											{evidenceList.length > 0 ? (
												<div className="flex flex-row flex-wrap gap-4">
													{evidenceList.map((item) => (
														<div
															key={`evidence-${item.index}-${item.id}`}
															className="relative min-w-[30%] max-w-[32%] flex-1 overflow-hidden rounded-lg border border-primaryN30"
														>
															<div className="flex flex-row gap-3 p-3">
																<div className="shrink-0">
																	<span className="inline-block rounded bg-primaryN30 px-1.5 py-0.5 text-xs text-grey-normal">
																		{item.itemIndex}
																	</span>
																</div>
																<div className="flex-1 overflow-hidden">
																	{item.s3_url ? (
																		<Image
																			src={item.s3_url}
																			alt=""
																			width="100%"
																			height="auto"
																			className="max-h-[180px] object-contain"
																			preview={false}
																		/>
																	) : (
																		<div className="flex h-[150px] items-center justify-center text-xs text-grey-normal">
																			No evidence image
																		</div>
																	)}
																</div>
															</div>
														</div>
													))}
												</div>
											) : null}
										</div>

										{/* Final Item / Merged Result - fixed 100px height */}
										<div className="shrink-0 overflow-hidden rounded-[12px] bg-[#EEF5FF]/40 px-5 py-2">
											<div className="mb-2 flex shrink-0 items-center justify-between">
												<span className="text-sm font-medium text-forumBlue-normal">
													{mergeMode === "customize"
														? "Final Item"
														: "Keep All Items"}
												</span>
												{mergeMode === "customize" ? (
													<Button
														className="custom-primary-btn !h-7 !w-[150px] !px-4 !text-xs"
														loading={confirming}
														onClick={handleCustomizeSubmit}
													>
														Submit Merge
													</Button>
												) : (
													<Button
														className="custom-primary-btn !h-7 !w-[150px] !px-4 !text-xs"
														onClick={handleKeepAllClick}
													>
														Preview & Submit
													</Button>
												)}
											</div>

											{mergeMode === "customize" && computedMergedResult ? (
												<div className="overflow-auto rounded-[8px] border border-primaryN30 bg-white">
													<Table
														rowKey={() => "live-preview"}
														columns={mergedColumns}
														dataSource={[computedMergedResult]}
														pagination={false}
														scroll={{
															x: "max-content",
														}}
														size="small"
														className="small-font-table [&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
													/>
												</div>
											) : mergeMode === "keepAll" && tableData.length > 0 ? (
												<div className="flex h-[calc(100%-36px)] items-center justify-center text-xs text-grey-normal">
													Click "Preview & Submit" to view all items with
													modified labels
												</div>
											) : null}
										</div>
									</div>
								</>
							) : (
								<div className="flex flex-1 items-center justify-center">
									<Empty
										description={
											<span className="text-xs text-grey-normal">
												No conflict groups available
											</span>
										}
									/>
								</div>
							)}
						</div>
					</div>
				</div>

				{confirming && (
					<div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
						<Spin size="large" />
					</div>
				)}
			</Modal>

			{/* Keep All Preview Modal */}
			<Modal
				open={showKeepAllModal}
				onCancel={() => setShowKeepAllModal(false)}
				footer={null}
				width={1000}
				centered
				destroyOnClose
				className="[&_.ant-modal-content]:!p-0"
			>
				<div className="flex h-[70vh] flex-col">
					{/* Header */}
					<div className="flex shrink-0 items-center justify-between border-b border-primaryN30 px-6 py-4">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF5FF]">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
									<path
										d="M16 3H8C6.89543 3 6 3.89543 6 5V19C6 20.1046 6.89543 21 8 21H16C17.1046 21 18 20.1046 18 19V5C18 3.89543 17.1046 3 16 3Z"
										stroke="#427CCE"
										strokeWidth="1.5"
									/>
									<path
										d="M9 7H15M9 11H15M9 15H12"
										stroke="#427CCE"
										strokeWidth="1.5"
										strokeLinecap="round"
									/>
								</svg>
							</div>
							<div>
								<div className="text-base font-medium text-grey-dark">
									Keep All Items Preview
								</div>
								<div className="mt-0.5 text-xs text-grey-normal">
									Review items with modified labels before submitting
								</div>
							</div>
						</div>
					</div>

					{/* Table */}
					<div className="flex-1 overflow-hidden p-4">
						<div className="h-full overflow-auto rounded-lg border border-primaryN30">
							<Table
								rowKey={(record) => record.id || Math.random()}
								columns={[
									{
										title: <span className="text-xs text-grey-normal">#</span>,
										key: "_index",
										width: 50,
										align: "center",
										fixed: "left",
										render: (_: unknown, __: unknown, index: number) => (
											<span className="inline-flex h-5 w-5 items-center justify-center rounded bg-forumBlue-normal text-[10px] text-white">
												{index + 1}
											</span>
										),
									},
									{
										title: <span className="text-xs text-grey-normal">ID</span>,
										key: "_id",
										width: 60,
										align: "center",
										fixed: "left",
										render: (_: unknown, record: any) => (
											<span className="text-xs text-grey-normal">
												{record.id}
											</span>
										),
									},
									...fields.map((field) => ({
										title: (
											<span className="whitespace-nowrap text-xs text-grey-normal">
												{field}
											</span>
										),
										key: field,
										width: field.length > 15 ? 150 : 100,
										align: "center" as const,
										render: (_: unknown, record: any) => {
											const value = formatCellValue(record.result?.[field]);
											const isLabel = field === "Label";

											return (
												<div
													className={`rounded px-1.5 py-0.5 text-xs ${
														isLabel
															? "bg-[#EEF5FF] font-medium text-forumBlue-normal"
															: "text-grey-normal"
													}`}
												>
													{value}
												</div>
											);
										},
									})),
								]}
								dataSource={keepAllItems}
								pagination={false}
								scroll={{
									x: "max-content",
									y: "calc(70vh - 200px)",
								}}
								size="small"
								className="small-font-table [&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
							/>
						</div>
					</div>

					{/* Footer */}
					<div className="flex shrink-0 items-center justify-end gap-3 border-t border-primaryN30 px-6 py-4">
						<Button
							className="custom-default-btn !h-8"
							onClick={() => setShowKeepAllModal(false)}
						>
							Cancel
						</Button>
						<Button
							className="custom-primary-btn !h-8"
							loading={keepAllSubmitting}
							onClick={handleKeepAllSubmit}
						>
							Submit All Items
						</Button>
					</div>
				</div>

				{keepAllSubmitting && (
					<div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
						<Spin size="large" />
					</div>
				)}
			</Modal>
		</>
	);
}
