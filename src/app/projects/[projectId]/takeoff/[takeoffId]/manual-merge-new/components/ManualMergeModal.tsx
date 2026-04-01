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
import { useParams, useSearchParams } from "next/navigation";

import {
	reconcileConfirm,
	reconcileKeepAllConfirm,
} from "@/services/DrawingAiService";
import { getEvidenceByFileId } from "@/services/evidenceService";
import { getTemplateById } from "@/services/templateService";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ConflictGroup {
	groupKey: string;
	label: string;
	subLabel: string;
	items: any[];
	item_ids: number[];
}

interface ManualMergeModalProps {
	open: boolean;
	pendingRows: any[];
	fileIds?: number[];
	onConfirm: (mergedResults: any[]) => void;
	onCancel: () => void;
}

interface EvidenceData {
	id: number;
	s3_url?: string;
	type?: string;
	project_file_page_number?: number;
	project_file_id?: number;
}

const MOCK_CONFLICT_DATA: Record<string, any[]> = {
	"1.22_____": [
		{
			id: 11283,
			evidence_id: 12554,
			evidence_id_list: [12554],
			result: JSON.stringify({
				Label: "1.22",
				Product: "Window",
				"Product Type": "Direct Set / Picture / Fixed",
				Operability: "None",
				Width: 36,
				Height: 64,
				Width_mm: 914.4,
				Height_mm: 2133.6,
				Quantity: 1,
				"Source Type": "Image",
				"Sub Label": "",
			}),
			isMerged: false,
			sourceType: "Image",
			evidence_msg: {
				id: 12554,
				type: "Elevation",
				s3_url:
					"https://latii-cato2-dev.s3.amazonaws.com/s3_evidences/original/6b6af7cbd6064ac3b848d8d75eb2c78f_01KJH28XK8W2Z15E82FZ660FSF_custom-image-12554.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260331%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260331T061116Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=fa65cf353c9ec695877245220268ccd03758b32c78e41710d0fb80fe493b7b05",
				project_file_page_number: 5,
				project_file_id: 218,
			},
		},
		{
			id: 112832,
			evidence_id: 12547,
			evidence_id_list: [12547],
			result: JSON.stringify({
				Label: "1.22",
				Product: "Window",
				"Product Type": "Fixed Casement",
				Operability: "None",
				Width: 36,
				Height: 84,
				Width_mm: 816.0,
				Height_mm: 1131.5,
				Quantity: 1,
				"Source Type": "Table",
				"Sub Label": "",
			}),
			isMerged: false,
			sourceType: "Table",
			evidence_msg: {
				id: 12547,
				type: "Schedule",
				s3_url:
					"https://latii-cato2-dev.s3.amazonaws.com/s3_evidences/original/f2dbdf802bdb436d865ab311a07cecad_01KJH28XK8W2Z15E82FZ660FSF_custom-image-12547.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260331%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260331T061116Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=70c7a012c34b48ef6ea5189b245d72400aebc7657cd45d7462d74651f18f3b92",
				project_file_page_number: 3,
				project_file_id: 218,
			},
		},
	],
	// "1.00_____": [
	// 	{
	// 		id: 11284,
	// 		evidence_id: 12554,
	// 		evidence_id_list: [12554],
	// 		result: JSON.stringify({
	// 			Label: "1.00",
	// 			Product: "Door",
	// 			"Product Type": "Swing Single",
	// 			Operability: "Outswing Open - Left Hinge",
	// 			Quantity: 1,
	// 			"Source Type": "Image",
	// 			"Sub Label": "",
	// 		}),
	// 		evidence_msg: {
	// 			id: 12554,
	// 			type: "Elevation",
	// 			s3_url:
	// 				"https://latii-cato2-dev.s3.amazonaws.com/s3_evidences/original/6b6af7cbd6064ac3b848d8d75eb2c78f_01KJH28XK8W2Z15E82FZ660FSF_custom-image-12554.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260331%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260331T061116Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=fa65cf353c9ec695877245220268ccd03758b32c78e41710d0fb80fe493b7b05",
	// 			project_file_page_number: 5,
	// 		},
	// 	},
	// 	{
	// 		id: 112842,
	// 		evidence_id: 12556,
	// 		evidence_id_list: [12556],
	// 		result: JSON.stringify({
	// 			Label: "1.00",
	// 			Product: "Door",
	// 			"Product Type": "Swing Single",
	// 			Operability: "Inswing Open - Right Hinge",
	// 			Quantity: 1,
	// 			"Source Type": "Table",
	// 			"Sub Label": "",
	// 		}),
	// 		evidence_msg: {
	// 			id: 12556,
	// 			type: "Schedule",
	// 			s3_url:
	// 				"https://latii-cato2-dev.s3.amazonaws.com/s3_evidences/original/f2dbdf802bdb436d865ab311a07cecad_01KJH28XK8W2Z15E82FZ660FSF_custom-image-12547.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260331%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260331T061116Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=70c7a012c34b48ef6ea5189b245d72400aebc7657cd45d7462d74651f18f3b92",
	// 			project_file_page_number: 4,
	// 		},
	// 	},
	// ],
	// "1.18_____": [
	// 	{
	// 		id: 11288,
	// 		evidence_id: 12547,
	// 		evidence_id_list: [12547],
	// 		result: JSON.stringify({
	// 			Label: "1.18",
	// 			Product: "Window",
	// 			"Product Type": "Sliding Window",
	// 			Operability: "XOX",
	// 			Height: 36,
	// 			Quantity: 1,
	// 			Location: "BATH 3",
	// 			"Source Type": "Image",
	// 			"Sub Label": "",
	// 		}),
	// 		evidence_msg: {
	// 			id: 12547,
	// 			type: "Floor Plan",
	// 			s3_url:
	// 				"https://latii-cato2-dev.s3.amazonaws.com/s3_evidences/original/f2dbdf802bdb436d865ab311a07cecad_01KJH28XK8W2Z15E82FZ660FSF_custom-image-12547.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260331%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260331T061116Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=70c7a012c34b48ef6ea5189b245d72400aebc7657cd45d7462d74651f18f3b92",
	// 			project_file_page_number: 3,
	// 		},
	// 	},
	// 	{
	// 		id: 112882,
	// 		evidence_id: 12558,
	// 		evidence_id_list: [12558],
	// 		result: JSON.stringify({
	// 			Label: "1.18",
	// 			Product: "Window",
	// 			"Product Type": "Sliding Window",
	// 			Operability: "XO",
	// 			Height: 42,
	// 			Quantity: 2,
	// 			Location: "BATH 3",
	// 			"Source Type": "Table",
	// 			"Sub Label": "",
	// 		}),
	// 		evidence_msg: {
	// 			id: 12558,
	// 			type: "Schedule",
	// 			s3_url:
	// 				"https://latii-cato2-dev.s3.amazonaws.com/s3_evidences/original/6b6af7cbd6064ac3b848d8d75eb2c78f_01KJH28XK8W2Z15E82FZ660FSF_custom-image-12554.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260331%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260331T061116Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=fa65cf353c9ec695877245220268ccd03758b32c78e41710d0fb80fe493b7b05",
	// 			project_file_page_number: 2,
	// 		},
	// 	},
	// ],
};

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

const buildConflictGroups = (pendingRows: any[]): ConflictGroup[] => {
	const mockKeys = Object.keys(MOCK_CONFLICT_DATA);

	if (pendingRows.length > 0) {
		// Check if pendingRows are already grouped (from API with groupLabel/groupSubLabel)
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

		const groups = Object.entries(grouped).map(([key, items]) => {
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

		// Return groups that have conflicts (more than 1 item) or all groups if any exist
		if (groups.length > 0) return groups;
	}

	// Fallback to mock data
	return mockKeys.map((key) => {
		const items = MOCK_CONFLICT_DATA[key];
		const firstResult = safeParseResult(items[0]?.result);
		return {
			groupKey: key,
			label: String(firstResult.Label || ""),
			subLabel: String(firstResult["Sub Label"] || ""),
			items,
			item_ids: items.map((i: any) => i.id),
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
	item_id: number;
	evidence_selected: boolean;
	s3_url: string;
	type: string;
}

export default function ManualMergeModal({
	open,
	pendingRows,
	fileIds,
	onConfirm,
	onCancel,
}: ManualMergeModalProps) {
	const params = useParams();
	const takeOffId = Number(params.takeoffId);
	const projectId = String(params.projectId);

	const [conflictGroups, setConflictGroups] = useState<ConflictGroup[]>([]);
	const [activeGroupIndex, setActiveGroupIndex] = useState(0);
	const [mergeMode, setMergeMode] = useState<MergeMode>("customize");

	const [tableData, setTableData] = useState<TableItem[]>([]);
	const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
	const [allEvidences, setAllEvidences] = useState<EvidenceData[]>([]);
	const [loadingEvidences, setLoadingEvidences] = useState(false);
	const [templateFields, setTemplateFields] = useState<string[]>([]);

	const [confirming, setConfirming] = useState(false);

	// Fetch template fields when modal opens
	useEffect(() => {
		const fetchTemplateFields = async () => {
			if (!open) return;

			try {
				const result = await getTemplateById(1);
				if (result.status === "success" && result.data) {
					const template = result.data;
					const fields = template.fields || [];
					const fieldNames = fields
						.map((field: any) => field.name || field.field_name)
						.filter(Boolean);

					if (fieldNames.length > 0) {
						setTemplateFields(fieldNames);
					}
				}
			} catch (error) {
				console.error("[ManualMergeModal] Error fetching template:", error);
			}
		};

		fetchTemplateFields();
	}, [open]);

	// Fetch all evidences for all files when modal opens
	useEffect(() => {
		const fetchEvidences = async () => {
			if (!open || !projectId) return;

			// Collect all unique file IDs from both fileIds prop and pendingRows
			const allFileIds = new Set<number>();

			// Add fileIds from props
			if (fileIds && fileIds.length > 0) {
				fileIds.forEach((fId) => allFileIds.add(fId));
			}

			// Extract project_file_id from pendingRows items
			pendingRows.forEach((row) => {
				if (row.project_file_id) {
					allFileIds.add(row.project_file_id);
				}
			});

			if (allFileIds.size === 0) return;

			setLoadingEvidences(true);
			try {
				// Fetch evidences for all files concurrently
				const fileIdArray = Array.from(allFileIds);
				console.log(
					"[ManualMergeModal] Fetching evidences for file IDs:",
					fileIdArray,
				);

				const evidencePromises = fileIdArray.map((fId) =>
					getEvidenceByFileId(projectId, fId),
				);
				const results = await Promise.all(evidencePromises);

				// Merge all evidences into one array
				const mergedEvidences: EvidenceData[] = [];
				results.forEach((res) => {
					if (res.status === "success" && Array.isArray(res.data)) {
						mergedEvidences.push(...res.data);
					}
				});

				setAllEvidences(mergedEvidences);
			} catch (error) {
				console.error("[ManualMergeModal] Error fetching evidences:", error);
			} finally {
				setLoadingEvidences(false);
			}
		};

		fetchEvidences();
	}, [open, fileIds, projectId, pendingRows]);

	useEffect(() => {
		if (open) {
			const groups = buildConflictGroups(pendingRows);
			setConflictGroups(groups);
			setActiveGroupIndex(0);
			setMergeMode("customize");
		}
	}, [open, pendingRows]);

	const activeGroup = conflictGroups[activeGroupIndex] || null;

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
			items.forEach((item: any, index: number) => {
				// First try to get from evidence_msg (if available)
				const msg = item.evidence_msg;
				if (msg) {
					const url =
						typeof msg === "object" && !Array.isArray(msg)
							? msg.s3_url || ""
							: Array.isArray(msg)
								? msg[0]?.s3_url || ""
								: "";
					if (url) {
						evidences.push({
							id: msg.id || item.evidence_id || 0,
							index,
							item_id: item.id,
							evidence_selected: true,
							s3_url: url,
							type: msg.type || "",
						});
						return;
					}
				}

				// Try to find evidence from allEvidences using evidence_id or evidence_id_list
				const evidenceIds: number[] = [];
				if (item.evidence_id) {
					evidenceIds.push(item.evidence_id);
				}
				if (Array.isArray(item.evidence_id_list)) {
					evidenceIds.push(...item.evidence_id_list);
				}
				if (Array.isArray(item.evidence_ids)) {
					evidenceIds.push(...item.evidence_ids);
				}

				// Find matching evidence from allEvidences
				for (const evidenceId of evidenceIds) {
					const matchedEvidence = allEvidences.find((e) => e.id === evidenceId);
					if (matchedEvidence) {
						if (matchedEvidence.s3_url) {
							evidences.push({
								id: matchedEvidence.id,
								index,
								item_id: item.id,
								evidence_selected: true,
								s3_url: matchedEvidence.s3_url,
								type: matchedEvidence.type || "",
							});
							break;
						}
					}
				}
			});
			setEvidenceList(evidences);
		},
		[allEvidences],
	);

	useEffect(() => {
		if (!activeGroup) return;
		generateTableData(activeGroup.items);
		generateEvidenceList(activeGroup.items);
	}, [activeGroup, generateTableData, generateEvidenceList]);

	// Re-generate evidence list when allEvidences is loaded
	useEffect(() => {
		if (!activeGroup || allEvidences.length === 0) return;
		generateEvidenceList(activeGroup.items);
	}, [allEvidences, activeGroup, generateEvidenceList]);

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

	const handleConfirmGroup = useCallback(async () => {
		if (!activeGroup || tableData.length === 0) return;
		setConfirming(true);

		try {
			if (mergeMode === "customize") {
				const item_fields = tableData.map((item, index) => {
					let selectFields = [...item.selectFields];
					if (index > 0) {
						selectFields = selectFields.filter((f) => f !== "Label");
					}
					const findEvid = evidenceList.find((e) => e.item_id === item.id);
					return {
						item_id: item.id,
						fields: selectFields,
						evidence_selected: findEvid?.evidence_selected ?? false,
					};
				});

				const body = {
					take_off_id: takeOffId,
					item_fields,
					merged_result: computedMergedResult || {},
				};
				const res = await reconcileConfirm(body);
				if (res.status === "success") {
					notification.success({
						message: "Confirmed",
						description: `Label "${activeGroup.label}" has been reconciled.`,
					});
				} else {
					notification.success({
						message: "Group Resolved",
						description: `Label "${activeGroup.label}" has been merged locally.`,
					});
				}
			} else {
				const body = {
					take_off_id: takeOffId,
					item_ids: tableData.map((item) => item.id),
				};
				const res = await reconcileKeepAllConfirm(body);
				if (res.status === "success") {
					notification.success({
						message: "Confirmed",
						description: `Label "${activeGroup.label}" Keep All confirmed.`,
					});
				} else {
					notification.success({
						message: "Group Resolved",
						description: `Label "${activeGroup.label}" Keep All resolved locally.`,
					});
				}
			}
		} catch {
			notification.success({
				message: "Group Resolved",
				description: `Label "${activeGroup.label}" has been merged locally.`,
			});
		} finally {
			setConfirming(false);
		}

		const remaining = conflictGroups.filter(
			(g) => g.groupKey !== activeGroup.groupKey,
		);
		setConflictGroups(remaining);

		if (remaining.length === 0) {
			onConfirm([]);
			return;
		}

		const nextIndex = Math.min(activeGroupIndex, remaining.length - 1);
		setActiveGroupIndex(nextIndex);
	}, [
		activeGroup,
		computedMergedResult,
		mergeMode,
		takeOffId,
		tableData,
		evidenceList,
		conflictGroups,
		activeGroupIndex,
		onConfirm,
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
								Resolve conflicting items by selecting the preferred values for
								each field
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
													isActive ? "text-forumBlue-normal" : "text-grey-dark"
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
									<div className="mb-4 max-h-[50%] shrink-0">
										<div className="h-full overflow-hidden rounded-[12px] border border-primaryN30">
											<Table
												rowKey={(record) => record.id || Math.random()}
												columns={customizeColumns}
												dataSource={tableData}
												pagination={false}
												scroll={{
													x: "max-content",
													y: "calc(100% - 100px)",
												}}
												size="small"
												className="h-full small-font-table [&_.ant-table]:!h-full [&_.ant-table]:!text-xs [&_.ant-table-body]:!overflow-y-auto [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-container]:!h-full [&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
											/>
										</div>
									</div>

									{/* Evidence images - fill remaining height (between top table and bottom Final Item) */}
									<div className="mb-4 min-h-0 flex-1 overflow-y-auto">
										{evidenceList.length > 0 ? (
											<div className="flex flex-row flex-wrap gap-4">
												{evidenceList.map((item, index) => (
													<div
														key={item.id}
														className="relative min-w-[30%] max-w-[32%] flex-1 overflow-hidden rounded-lg border border-primaryN30"
													>
														<div className="flex flex-row gap-3 p-3">
															<div className="shrink-0">
																<span className="inline-block rounded bg-primaryN30 px-1.5 py-0.5 text-xs text-grey-normal">
																	{item.index + 1}
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
															<div className="shrink-0">
																<div
																	className={`flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-md border transition-colors ${
																		item.evidence_selected
																			? "border-forumBlue-normal bg-forumBlue-normal/10"
																			: "border-transparent"
																	}`}
																	onClick={() => handleEvidenceChecked(index)}
																>
																	<svg
																		width="18"
																		height="18"
																		viewBox="0 0 24 24"
																		fill="none"
																	>
																		<path
																			d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
																			stroke={
																				item.evidence_selected
																					? "#427CCE"
																					: "#999"
																			}
																			strokeWidth="1.5"
																			strokeLinecap="round"
																			strokeLinejoin="round"
																		/>
																		<path
																			d="M14 2V8H20"
																			stroke={
																				item.evidence_selected
																					? "#427CCE"
																					: "#999"
																			}
																			strokeWidth="1.5"
																			strokeLinecap="round"
																			strokeLinejoin="round"
																		/>
																	</svg>
																</div>
															</div>
														</div>
													</div>
												))}
											</div>
										) : null}
									</div>

									{/* Final Item / Merged Result - fixed 100px height */}
									<div className="h-[130px] shrink-0 overflow-hidden rounded-[12px] bg-[#EEF5FF]/40 px-5 py-2">
										<div className="mb-2 flex shrink-0 items-center justify-between">
											<span className="text-sm font-medium text-forumBlue-normal">
												Final Item
											</span>
											<Button
												className="custom-primary-btn !h-7 !px-4 !w-[150px] !text-xs"
												loading={confirming}
												onClick={handleConfirmGroup}
											>
												Confirm Reconciliation
											</Button>
										</div>

										{mergeMode === "customize" && computedMergedResult ? (
											<div className="h-[calc(100%-36px)] overflow-auto rounded-[8px] border border-primaryN30 bg-white">
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
											<div className="h-[calc(100%-36px)] overflow-auto rounded-[8px] border border-primaryN30 bg-white">
												<Table
													rowKey={(record: any) => record?.id || Math.random()}
													columns={mergedColumns}
													dataSource={tableData.map((item) => ({
														...safeParseResult(
															item.result,
															item.originalResult,
														),
														original_item_id: item.id,
													}))}
													pagination={false}
													scroll={{
														x: "max-content",
													}}
													size="small"
													className="small-font-table [&_.ant-table]:!text-xs [&_.ant-table-cell]:!border-b-primaryN30 [&_.ant-table-tbody>tr>td]:!py-2 [&_.ant-table-thead>tr>th]:!bg-[#FBFBFC] [&_.ant-table-thead>tr>th]:!py-2 [&_.ant-table-thead>tr>th]:!font-normal [&_.ant-table-thead>tr>th]:!text-grey-normal"
												/>
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
	);
}
