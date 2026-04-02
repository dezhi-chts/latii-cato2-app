"use client";

import { notification, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getEvidenceByFileId } from "@/services/evidenceService";
import { getAllGroupedByTakeOff } from "@/services/mergeService";
import { changeCheckedItem } from "@/services/projectService";
import {
	downloadTakeOffResult,
	getTakeOffById,
	getTakeOffSummaryStats,
	resetTakeOff,
} from "@/services/takeOffService";
import { getTemplateById } from "@/services/templateService";

import AddBoxModal from "./components/AddBoxModal";
import EvidenceSidebar from "./components/EvidenceSidebar";
import TakeoffListHeader from "./components/TakeoffListHeader";
import TakeoffItemsTable from "./components/TakeoffItemsTable";
import ItemTraceabilityModal from "../manual-merge-new/components/ItemTraceabilityModal";
import { getFallbackDynamicFields, getSummaryStats } from "./takeoffUtils";
import {
	EvidenceRecord,
	ProjectFileRecord,
	TakeoffDetailsData,
	TakeoffItemRecord,
	TemplateField,
} from "./types";
import { FileOperationType } from "../types/evidence";

// Helper functions for parsing data (same as manual-merge-new)
const parseItemResult = (result: any): Record<string, unknown> => {
	if (!result) return {};
	if (typeof result === "string") {
		try {
			return JSON.parse(result);
		} catch {
			return {};
		}
	}
	return result;
};

const formatNestedObject = (obj: Record<string, unknown>): string => {
	const parts: string[] = [];
	for (const [key, value] of Object.entries(obj)) {
		if (value === null || value === undefined) continue;
		if (typeof value === "object" && !Array.isArray(value)) {
			const nestedStr = formatNestedObject(value as Record<string, unknown>);
			if (nestedStr) {
				parts.push(`${key}: {${nestedStr}}`);
			}
		} else if (Array.isArray(value)) {
			parts.push(`${key}: [${value.join(", ")}]`);
		} else {
			parts.push(`${key}: ${value}`);
		}
	}
	return parts.join(", ");
};

const getNestedValue = (
	obj: Record<string, unknown>,
	path: string,
): unknown => {
	const parts = path.split(".");
	let current: unknown = obj;
	for (const part of parts) {
		if (current === null || current === undefined) return undefined;
		if (typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return current;
};

const formatValue = (value: unknown): string => {
	if (value === null || value === undefined) return "-";
	if (Array.isArray(value)) {
		if (value.length === 0) return "-";
		return value
			.map((item) => {
				if (typeof item === "object" && item !== null) {
					return formatNestedObject(item as Record<string, unknown>);
				}
				return String(item);
			})
			.join("; ");
	}
	if (typeof value === "object") {
		return formatNestedObject(value as Record<string, unknown>);
	}
	return String(value);
};

const getDisplayValueByField = (
	result: Record<string, unknown>,
	fieldName: string,
): string => {
	if (fieldName === "Sub Label") {
		const subLabel = result["Sub Label"] ?? result["sub_label"];
		return formatValue(subLabel);
	}

	if (result[fieldName] !== undefined) {
		return formatValue(result[fieldName]);
	}

	if (fieldName.includes(".")) {
		const value = getNestedValue(result, fieldName);
		if (value !== undefined) {
			return formatValue(value);
		}
	}

	for (const [key, val] of Object.entries(result)) {
		if (typeof val === "object" && val !== null && !Array.isArray(val)) {
			const nestedResult = val as Record<string, unknown>;
			if (nestedResult[fieldName] !== undefined) {
				return formatValue(nestedResult[fieldName]);
			}
			for (const [, nestedVal] of Object.entries(nestedResult)) {
				if (
					typeof nestedVal === "object" &&
					nestedVal !== null &&
					!Array.isArray(nestedVal)
				) {
					const deepNestedResult = nestedVal as Record<string, unknown>;
					if (deepNestedResult[fieldName] !== undefined) {
						return formatValue(deepNestedResult[fieldName]);
					}
				}
			}
		}
	}

	if (fieldName.includes(".")) {
		const parts = fieldName.split(".");
		for (let i = parts.length - 1; i >= 0; i--) {
			const partialPath = parts.slice(i).join(".");
			const value = getNestedValue(result, partialPath);
			if (value !== undefined) {
				return formatValue(value);
			}
			if (i === parts.length - 1 && result[parts[i]] !== undefined) {
				return formatValue(result[parts[i]]);
			}
		}
	}

	return "-";
};

interface ParsedTakeoffItem {
	id: number | string;
	key: string;
	result: Record<string, string>;
	originalResult?: any;
	isMerged: boolean;
	groupLabel?: string;
	groupSubLabel?: string;
	mergedFromRows?: any[];
	take_off_result_item_id_list?: number[];
	single_file_merge_result_id_list?: number[];
	[key: string]: any;
}

const parseTakeoffMergeResult = (
	sourceData: any,
	preferredFields: string[],
): ParsedTakeoffItem[] => {
	const inMergeResult =
		sourceData?.in_multiple_files_merge_result ||
		sourceData?.in_single_file_merge_result ||
		sourceData?.in_file_source_merge_result ||
		[];
	const notInMergeResult =
		sourceData?.not_in_multiple_files_merge_result ||
		sourceData?.not_in_single_file_merge_result ||
		sourceData?.not_in_file_source_merge_result ||
		[];

	const items: ParsedTakeoffItem[] = [];

	// Process merged items
	inMergeResult.forEach((group: any, groupIndex: number) => {
		const groupLabel = group?.Label || "";
		const groupSubLabel = group?.["Sub Label"] || "";
		const listItems = Array.isArray(group?.list)
			? group.list
			: Array.isArray(group?.List)
				? group.List
				: [];

		if (listItems.length > 0) {
			listItems.forEach((item: any, itemIndex: number) => {
				const result = parseItemResult(item?.result);
				const displayResult = preferredFields.reduce(
					(acc: Record<string, string>, fieldName: string) => {
						acc[fieldName] = getDisplayValueByField(result, fieldName);
						return acc;
					},
					{},
				);
				items.push({
					...item,
					id: item?.id || `merged-${groupIndex}-${itemIndex}`,
					key: `merged-${item?.id || `${groupIndex}-${itemIndex}`}`,
					result: displayResult,
					originalResult: item?.result,
					isMerged: true,
					groupLabel,
					groupSubLabel,
					mergedFromRows: item?.mergedFromRows || listItems,
				});
			});
		} else {
			const result = parseItemResult(group?.result || group);
			const displayResult = preferredFields.reduce(
				(acc: Record<string, string>, fieldName: string) => {
					acc[fieldName] = getDisplayValueByField(result, fieldName);
					return acc;
				},
				{},
			);
			items.push({
				...group,
				id: group?.id || `merged-${groupIndex}`,
				key: `merged-${group?.id || groupIndex}`,
				result: displayResult,
				originalResult: group?.result || group,
				isMerged: true,
				groupLabel,
				groupSubLabel,
				mergedFromRows: group?.mergedFromRows || [group],
			});
		}
	});

	// Process unmerged items
	notInMergeResult.forEach((group: any, groupIndex: number) => {
		const groupLabel = group?.Label || "";
		const groupSubLabel = group?.["Sub Label"] || "";
		const listItems = Array.isArray(group?.list)
			? group.list
			: Array.isArray(group?.List)
				? group.List
				: [];

		if (listItems.length > 0) {
			listItems.forEach((item: any, itemIndex: number) => {
				const result = parseItemResult(item?.result);
				const displayResult = preferredFields.reduce(
					(acc: Record<string, string>, fieldName: string) => {
						acc[fieldName] = getDisplayValueByField(result, fieldName);
						return acc;
					},
					{},
				);
				items.push({
					...item,
					id: item?.id || `unmerged-${groupIndex}-${itemIndex}`,
					key: `unmerged-${item?.id || `${groupIndex}-${itemIndex}`}`,
					result: displayResult,
					originalResult: item?.result,
					isMerged: false,
					groupLabel,
					groupSubLabel,
					mergedFromRows: item?.mergedFromRows || listItems,
				});
			});
		} else {
			const result = parseItemResult(group?.result || group);
			const displayResult = preferredFields.reduce(
				(acc: Record<string, string>, fieldName: string) => {
					acc[fieldName] = getDisplayValueByField(result, fieldName);
					return acc;
				},
				{},
			);
			items.push({
				...group,
				id: group?.id || `unmerged-${groupIndex}`,
				key: `unmerged-${group?.id || groupIndex}`,
				result: displayResult,
				originalResult: group?.result || group,
				isMerged: false,
				groupLabel,
				groupSubLabel,
				mergedFromRows: group?.mergedFromRows || [group],
			});
		}
	});

	return items;
};

export default function TakeoffListPage() {
	const router = useRouter();
	const params = useParams();
	const projectId = String(params?.projectId || "");
	const takeoffId = String(params?.takeoffId || "");

	const [loading, setLoading] = useState(true);
	const [takeoffData, setTakeoffData] = useState<TakeoffDetailsData>();
	const [dynamicFields, setDynamicFields] = useState<TemplateField[]>([]);
	const [columnNames, setColumnNames] = useState<string[]>([
		"Label",
		"Sub Label",
	]);
	const [parsedItems, setParsedItems] = useState<ParsedTakeoffItem[]>([]);
	const [selectedFileId, setSelectedFileId] = useState<number>(-1);
	const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
	const [referenceItem, setReferenceItem] = useState<ParsedTakeoffItem | null>(
		null,
	);
	const [searchValue, setSearchValue] = useState("");
	const [showEvidenceBoxes, setShowEvidenceBoxes] = useState(true);
	const [fileFilter, setFileFilter] = useState("all");
	const [showAddBoxModal, setShowAddBoxModal] = useState(false);
	const [showReferenceModal, setShowReferenceModal] = useState(false);
	const [downloadLoading, setDownloadLoading] = useState(false);
	const [evidencesByFile, setEvidencesByFile] = useState<
		Record<number, EvidenceRecord[]>
	>({});
	const [summaryStats, setSummaryStats] = useState<any>({});

	const files = useMemo<ProjectFileRecord[]>(() => {
		return takeoffData?.project_files || [];
	}, [takeoffData?.project_files]);

	const allItems = useMemo<TakeoffItemRecord[]>(() => {
		// Convert parsed items to TakeoffItemRecord format for compatibility
		return parsedItems.map((item, index) => {
			const { id, result, ...rest } = item;
			return {
				...rest,
				sequence_number: index + 1,
				project_file_id: 0,
				is_checked: true,
				id: typeof id === "number" ? id : index,
				result: result,
			};
		}) as unknown as TakeoffItemRecord[];
	}, [parsedItems]);

	const selectedItem = useMemo(() => {
		return parsedItems.find((item) => item?.id === selectedItemId) || null;
	}, [parsedItems, selectedItemId]);

	const currentFile = useMemo(() => {
		return files.find((file) => file?.id === selectedFileId);
	}, [files, selectedFileId]);

	const reconcileCount = useMemo(() => {
		const reconcileByFile = takeoffData?.reconcile_candidate_count || {};
		return Object.values(reconcileByFile).reduce(
			(acc, count) => acc + count,
			0,
		);
	}, [takeoffData?.reconcile_candidate_count]);

	const updateCurrentFileSelection = useCallback((fileId: number) => {
		setSelectedFileId(fileId);
		setSearchValue("");
		setSelectedItemId(null);
	}, []);

	const fetchDynamicFields = useCallback(
		async (templateId?: number, fallbackItems: TakeoffItemRecord[] = []) => {
			if (!templateId) {
				setDynamicFields(getFallbackDynamicFields(fallbackItems));
				return [];
			}

			const response = await getTemplateById(templateId);
			if (response.status === "success" && response.data) {
				const templateData = response.data;
				// Extract field names from template, similar to manual-merge-new
				const fields: string[] = [];

				// Add Label and Sub Label first
				fields.push("Label");
				fields.push("Sub Label");

				// Add other fields from template
				if (templateData.fields && Array.isArray(templateData.fields)) {
					templateData.fields.forEach((field: any) => {
						const fieldName = field.name || field.field_name || field;
						if (
							fieldName &&
							fieldName !== "Label" &&
							fieldName !== "Sub Label"
						) {
							fields.push(fieldName);
						}
					});
				}

				// Convert to TemplateField format for compatibility
				const templateFields: TemplateField[] = fields.map((name, index) => ({
					id: index,
					name,
					field_name: name,
					field_type: "text",
				}));

				setDynamicFields(
					templateFields.length
						? templateFields
						: getFallbackDynamicFields(fallbackItems),
				);
				setColumnNames(fields);
				return fields;
			}

			setDynamicFields(getFallbackDynamicFields(fallbackItems));
			notification.error({
				message: "Error",
				description: "Failed to get template fields",
			});
			return [];
		},
		[],
	);

	const fetchAllFileEvidences = useCallback(
		async (projectFiles: ProjectFileRecord[]) => {
			if (!projectFiles.length) {
				setEvidencesByFile({});
				return;
			}

			const responses = await Promise.all(
				projectFiles.map(async (file: any) => {
					let filterType = "QuoteLabel";
					if (
						file &&
						file.operation_type === FileOperationType.ArchitectureDrawing
					) {
						filterType = "ArchDrawingLabel";
					}

					const response = await getEvidenceByFileId(projectId, file?.id, {
						filter_type: "", //filterType,
					});
					return {
						fileId: file?.id,
						response,
					};
				}),
			);

			const nextEvidenceMap = responses.reduce<
				Record<number, EvidenceRecord[]>
			>((acc, item) => {
				if (item?.response?.status === "success") {
					acc[item.fileId] = item?.response?.data || [];
				} else {
					acc[item.fileId] = [];
				}

				return acc;
			}, {});

			setEvidencesByFile(nextEvidenceMap);
		},
		[projectId],
	);

	const fetchTakeoff = useCallback(async () => {
		setLoading(true);

		try {
			// Step 1: Get takeoff basic info
			const takeoffResponse = await getTakeOffById(takeoffId);
			if (takeoffResponse.status !== "success" || !takeoffResponse.data) {
				notification.error({
					message: "Error",
					description: "Failed to get takeoff details",
				});
				setLoading(false);
				return;
			}

			const takeoffBasicData = takeoffResponse.data;
			const projectFiles = takeoffBasicData?.project_files || [];
			const firstFileId = projectFiles?.[0]?.id || -1;
			const templateId = takeoffBasicData?.take_off_result?.template_id;

			// Step 2: Fetch template fields
			const fields = await fetchDynamicFields(templateId, []);
			// Use fetched fields or default fields (don't use columnNames state to avoid dependency loop)
			const preferredFields =
				fields.length > 0 ? fields : ["Label", "Sub Label"];

			// Step 3: Get merged data from getAllGroupedByTakeOff
			const groupedResponse = await getAllGroupedByTakeOff(Number(takeoffId));

			let items: ParsedTakeoffItem[] = [];
			if (groupedResponse.status === "success" && groupedResponse.data) {
				items = parseTakeoffMergeResult(groupedResponse.data, preferredFields);
			}

			// Build takeoff data structure for compatibility
			const nextTakeoffData: TakeoffDetailsData = {
				project_files: projectFiles,
				take_off_result: takeoffBasicData?.take_off_result || {},
				all_items: {},
				reconcile_candidate_count: {},
			};

			setTakeoffData(nextTakeoffData);
			setParsedItems(items);
			setSelectedFileId(firstFileId);
			setSearchValue("");
			setShowEvidenceBoxes(true);
			setSelectedItemId(null);
			setReferenceItem(null);
			setFileFilter("all");

			// Fetch evidences
			//await fetchAllFileEvidences(projectFiles);
		} catch (error) {
			console.error("Error fetching takeoff:", error);
			notification.error({
				message: "Error",
				description: "Failed to get takeoff details",
			});
		} finally {
			setLoading(false);
		}
	}, [fetchAllFileEvidences, fetchDynamicFields, takeoffId]);

	const getSummaryStats = useCallback(async () => {
		try {
			const summaryStats = await getTakeOffSummaryStats(takeoffId);
			if (summaryStats.status === "success") {
				setSummaryStats(summaryStats.data);
			}
		} catch (error) {
			console.error("Error refreshing summary stats:", error);
		}
	}, [takeoffId]);

	const refreshItemsOnly = useCallback(async () => {
		try {
			const groupedResponse = await getAllGroupedByTakeOff(Number(takeoffId));
			if (groupedResponse.status === "success" && groupedResponse.data) {
				const preferredFields =
					columnNames.length > 0 ? columnNames : ["Label", "Sub Label"];
				const items = parseTakeoffMergeResult(
					groupedResponse.data,
					preferredFields,
				);
				setParsedItems(items);
			}
		} catch (error) {
			console.error("Error refreshing items:", error);
		}
	}, [takeoffId, columnNames]);

	useEffect(() => {
		fetchTakeoff();
		getSummaryStats();
	}, [takeoffId]);

	useEffect(() => {
		if (!selectedItemId) {
			return;
		}

		if (!parsedItems.find((item) => item?.id === selectedItemId)) {
			setSelectedItemId(null);
		}
	}, [parsedItems, selectedItemId]);

	useEffect(() => {
		if (!referenceItem) {
			return;
		}

		if (!parsedItems.find((item) => item?.id === referenceItem.id)) {
			setReferenceItem(null);
			setShowReferenceModal(false);
		}
	}, [parsedItems, referenceItem]);

	useEffect(() => {
		if (dynamicFields.length) {
			return;
		}

		if (allItems.length) {
			setDynamicFields(getFallbackDynamicFields(allItems));
		}
	}, [allItems, dynamicFields.length]);

	const handleToggleStatus = async (
		item: TakeoffItemRecord,
		checked: boolean,
	) => {
		const currentFileItems =
			takeoffData?.all_items?.[item?.project_file_id] || [];
		const originalChecked = item?.is_checked;

		setTakeoffData((prev) => {
			if (!prev) {
				return prev;
			}

			return {
				...prev,
				all_items: {
					...(prev?.all_items || {}),
					[item?.project_file_id]: currentFileItems.map((currentItem) => {
						if (currentItem?.id === item?.id) {
							return {
								...currentItem,
								is_checked: checked,
							};
						}

						return currentItem;
					}),
				},
			};
		});

		const response = await changeCheckedItem(String(item?.id), checked);
		if (response) {
			return;
		}

		setTakeoffData((prev) => {
			if (!prev) {
				return prev;
			}

			return {
				...prev,
				all_items: {
					...(prev?.all_items || {}),
					[item?.project_file_id]: currentFileItems.map((currentItem) => {
						if (currentItem?.id === item?.id) {
							return {
								...currentItem,
								is_checked: originalChecked,
							};
						}

						return currentItem;
					}),
				},
			};
		});

		notification.error({
			message: "Error",
			description: "Failed to update item status",
		});
	};

	const handleResetTakeoff = async () => {
		let fileIds = files.map((file) => file.id).join(",");
		const response = await resetTakeOff(takeoffId, fileIds);
		if (response.status === "success") {
			notification.success({
				message: "Success",
				description: "Take off reset successfully",
			});
			// 返回到合并前的页面
			router.push(`/projects/${projectId}/takeoff/${takeoffId}/identification`);
		} else {
			notification.error({
				message: "Error",
				description: "Failed to reset take off",
			});
		}
	};

	const handleDownload = async () => {
		setDownloadLoading(true);
		try {
			const response = await downloadTakeOffResult(takeoffId);

			if (response.status === "success" && response.data) {
				const blob = response.data;
				const filename = `take_off_${takeoffId}.zip`;
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);

				notification.success({
					message: "Success",
					description: "Take off result downloaded successfully",
				});
			} else {
				notification.error({
					message: "Error",
					description: "Failed to download take off result",
				});
			}
		} catch (error) {
			console.error("Download error:", error);
			notification.error({
				message: "Error",
				description: "Failed to download take off result",
			});
		} finally {
			setDownloadLoading(false);
		}
	};

	const handleOpenReconcile = () => {
		if (!selectedFileId || reconcileCount < 1) {
			notification.info({
				message: "Info",
				description: "There are no reconcile conflicts in the current file",
			});
			return;
		}

		router.push(
			`/projects/${projectId}/takeoff/${takeoffId}/items-merge?_fId=${selectedFileId}`,
		);
	};

	const handleOpenReferencePanel = (item: TakeoffItemRecord) => {
		setSelectedItemId(item?.id);
		// Find the parsed item to get full data including mergedFromRows
		const parsedItem = parsedItems.find((p) => p.id === item?.id);
		setReferenceItem(parsedItem || null);
		setShowReferenceModal(true);
	};

	const handleChangeFileEvidences = useCallback(
		(
			fileId: number,
			updater: (current: EvidenceRecord[]) => EvidenceRecord[],
		) => {
			setEvidencesByFile((prev) => {
				const current = prev?.[fileId] || [];
				return {
					...prev,
					[fileId]: updater(current),
				};
			});
		},
		[],
	);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center bg-white">
				<Spin />
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-white">
			<TakeoffListHeader
				takeoffName={takeoffData?.take_off_result?.name || ""}
				files={files}
				selectedFileId={selectedFileId}
				summaryStats={summaryStats}
				downloadLoading={downloadLoading}
				onSelectFile={updateCurrentFileSelection}
				onResetTakeoff={handleResetTakeoff}
				onDownload={handleDownload}
			/>

			<div className="flex min-h-0 flex-1 overflow-hidden px-14 pb-6">
				<TakeoffItemsTable
					items={allItems}
					dynamicFields={dynamicFields}
					loading={false}
					searchValue={searchValue}
					selectedItemId={
						typeof selectedItem?.id === "number" ? selectedItem.id : null
					}
					reconcileCount={reconcileCount}
					takeoffId={takeoffId}
					onSearchChange={setSearchValue}
					onToggleStatus={handleToggleStatus}
					onSelectItem={(item) => setSelectedItemId(item?.id)}
					onOpenReferencePanel={handleOpenReferencePanel}
					onOpenReconcile={handleOpenReconcile}
					onRefreshItems={refreshItemsOnly}
				/>

				{/* <EvidenceSidebar
					files={files}
					selectedFileId={selectedFileId}
					selectedItem={selectedItem as TakeoffItemRecord | null}
					fileFilter={fileFilter}
					showEvidenceBoxes={showEvidenceBoxes}
					evidencesByFile={evidencesByFile}
					onSelectFile={updateCurrentFileSelection}
					onChangeFileFilter={setFileFilter}
					onToggleEvidenceBoxes={() => setShowEvidenceBoxes((prev) => !prev)}
					onOpenAddBoxModal={() => setShowAddBoxModal(true)}
				/> */}
			</div>

			<AddBoxModal
				open={showAddBoxModal}
				projectId={projectId}
				files={files}
				initialFileId={currentFile?.id}
				selectedItem={selectedItem as any}
				evidencesByFile={evidencesByFile}
				onChangeFileEvidences={handleChangeFileEvidences}
				onClose={() => setShowAddBoxModal(false)}
			/>
			<ItemTraceabilityModal
				open={showReferenceModal}
				item={referenceItem}
				level="multiple_files"
				columnNames={columnNames}
				onClose={() => {
					setShowReferenceModal(false);
					setReferenceItem(null);
				}}
			/>
		</div>
	);
}
