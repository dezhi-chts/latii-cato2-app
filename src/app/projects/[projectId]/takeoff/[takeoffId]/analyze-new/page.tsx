"use client";

import { Modal, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getEvidenceByFileId } from "@/services/evidenceService";
import { changeCheckedItem } from "@/services/projectService";
import {
	downloadTakeOffResult,
	getTakeOffById,
	getTakeOffSummaryStats,
	resetTakeOff,
	getAllTakeOffResultItemsByTakeOffId
} from "@/services/takeOffService";
import { getTemplateById } from "@/services/templateService";

import AddBoxModal from "./components/AddBoxModal";
import EvidenceSidebar from "./components/EvidenceSidebar";
import TakeoffListHeader from "./components/TakeoffListHeader";
import TakeoffItemsTable from "./components/TakeoffItemsTable";
import TakeoffReferenceByTypeModal from "./components/TakeoffReferenceByTypeModal";
import {
	getFallbackDynamicFields,
	getDisplayValueByField,
	getSummaryStats,
	parseItemResult,
} from "./takeoffUtils";
import {
	EvidenceRecord,
	ProjectFileRecord,
	TakeoffDetailsData,
	TakeoffItemRecord,
	TemplateField,
} from "./types";
import { FileOperationType } from "../types/evidence";
import LoadingScreen from "@/components/loading-screen";
import { notify } from "@/utils/notify";
import { useBrowserBackToHome } from "@/app/projects/[projectId]/takeoff/[takeoffId]/hooks/useBrowserBackToHome";

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
	const parseIdList = (item: any, listKey: string, textKey: string): number[] => {
		if (Array.isArray(item?.[listKey])) {
			return item[listKey]
				.map((value: any) => Number(value))
				.filter((value: number) => Number.isFinite(value));
		}
		const textValue = item?.[textKey];
		if (typeof textValue !== "string" || !textValue.trim()) {
			return [];
		}
		const matches = textValue.match(/\d+/g) || [];
		return matches
			.map((value) => Number(value))
			.filter((value) => Number.isFinite(value));
	};

	const toParsedItem = (
		item: any,
		index: number,
		fallbackMerged: boolean,
	): ParsedTakeoffItem => {
		const rawResult = parseItemResult(item?.result);
		const displayResult = preferredFields.reduce(
			(acc: Record<string, string>, fieldName: string) => {
				acc[fieldName] = getDisplayValueByField(rawResult, fieldName);
				return acc;
			},
			{},
		);

		return {
			...item,
			id: item?.id ?? `item-${index}`,
			key: `item-${item?.id ?? index}`,
			result: displayResult,
			originalResult: rawResult,
			isMerged:
				typeof item?.is_merged === "boolean"
					? item.is_merged
					: fallbackMerged,
			take_off_result_item_id_list: parseIdList(
				item,
				"take_off_result_item_id_list",
				"take_off_result_item_ids",
			),
			single_file_merge_result_id_list: parseIdList(
				item,
				"single_file_merge_result_id_list",
				"single_file_merge_result_ids",
			),
			file_source_merge_result_id_list: parseIdList(
				item,
				"file_source_merge_result_id_list",
				"file_source_merge_result_ids",
			),
			mergedFromRows: item?.mergedFromRows || [item],
		};
	};

	// New API shape: single item object or item array
	if (Array.isArray(sourceData)) {
		return sourceData.map((item, index) =>
			toParsedItem(item, index, Boolean(item?.is_merged)),
		);
	}
	if (
		sourceData &&
		typeof sourceData === "object" &&
		typeof sourceData?.id !== "undefined" &&
		sourceData?.result
	) {
		return [toParsedItem(sourceData, 0, Boolean(sourceData?.is_merged))];
	}

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
				items.push({
					...toParsedItem(item, itemIndex, true),
					groupLabel,
					groupSubLabel,
					mergedFromRows: item?.mergedFromRows || listItems,
				});
			});
		} else {
			items.push({
				...toParsedItem(group, groupIndex, true),
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
				items.push({
					...toParsedItem(item, itemIndex, false),
					groupLabel,
					groupSubLabel,
					mergedFromRows: item?.mergedFromRows || listItems,
				});
			});
		} else {
			items.push({
				...toParsedItem(group, groupIndex, false),
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
	useBrowserBackToHome();

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
	const [evidencesByFile, setEvidencesByFile] = useState<
		Record<number, EvidenceRecord[]>
	>({});
	const [summaryStats, setSummaryStats] = useState<any>({});
	const [fullLoading, setFullLoading] = useState(false);
	const [downloadLoading, setDownloadLoading] = useState(false);

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
			notify.error({
				title: "Error",
				description: response?.data?.detail || "Failed to get template fields",
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
				notify.error({
					title: "Error",
					description: takeoffResponse?.data?.detail || "Failed to get takeoff details",
				});
				setLoading(false);
				return;
			}

			const takeoffBasicData = takeoffResponse.data;
			const projectFiles = takeoffBasicData?.project_files || [];
			const firstFileId = projectFiles?.[0]?.id || -1;
			const templateId = takeoffBasicData?.take_off_result?.template_id || 1;

			// Step 2: Fetch template fields
			const fields = await fetchDynamicFields(templateId, []);
			// Use fetched fields or default fields (don't use columnNames state to avoid dependency loop)
			const preferredFields =
				fields.length > 0 ? fields : ["Label", "Sub Label"];

			// Step 3: Get merged data from getAllTakeOffResultItemsByTakeOffId
			const groupedResponse = await getAllTakeOffResultItemsByTakeOffId(takeoffId);

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
		} catch (error: any) {
			console.error("Error fetching takeoff:", error);
			notify.error({
				title: "Error",
				description: error?.message || "Failed to get takeoff details",
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
			const groupedResponse = await getAllTakeOffResultItemsByTakeOffId(takeoffId);
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

		const response: any = await changeCheckedItem(String(item?.id), checked);
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

		notify.error({
			title: "Error",
			description: response?.data?.detail || "Failed to update item status",
		});
	};

	const handleResetTakeoff = () => {
		Modal.confirm({
			title: "Reset Takeoff",
			content:
				"Are you sure you want to reset this takeoff? This action cannot be undone.",
			okText: "Reset",
			okButtonProps: { danger: true },
			cancelText: "Cancel",
			onOk: async () => {
				setFullLoading(true);
				let fileIds = files.map((file) => file.id).join(",");
				const response = await resetTakeOff(takeoffId, fileIds);
				setFullLoading(false);
				if (response.status === "success") {
					notify.success({
						title: "Success",
						description: "Take off reset successfully",
					});
					router.push(
						`/projects/${projectId}/takeoff/${takeoffId}/identification`,
					);
				} else {
					notify.error({
						title: "Error",
						description: response?.data?.detail || "Failed to reset take off",
					});
				}
			},
		});
	};

	const handleDownload = async () => {
		setDownloadLoading(true);
		try {
			const response: any = await downloadTakeOffResult(takeoffId);

			if (response.status === "success" && response.data) {
				if (response.data) {
					let fileName =
						response.data["file_name"] || `take_off_${takeoffId}.zip`;
					let fileUrl = response.data["download_url"] || "";
					if (fileUrl) {
						const link = document.createElement("a");
						link.href = fileUrl;
						link.download = fileName;
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
					} else {
						notify.error({
							title: "Error",
							description: "No file url found",
						});
					}
				}
			} else {
				notify.error({
					title: "Error",
					description:
						response?.data?.detail || "Failed to download take off result",
				});
			}
		} catch (error: any) {
			console.error("Download error:", error);
			notify.error({
				title: "Error",
				description: error?.message || "Failed to download take off result",
			});
		} finally {
			setDownloadLoading(false);
		}
	};

	const handleOpenReconcile = () => {
		if (!selectedFileId || reconcileCount < 1) {
			notify.info({
				title: "Info",
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
					onSelectItem={(item) => {
						setSelectedItemId(item?.id);
					}}
					onOpenReferencePanel={handleOpenReferencePanel}
					onOpenReconcile={handleOpenReconcile}
					onRefreshItems={refreshItemsOnly}
				/>

				<EvidenceSidebar
					selectedItem={selectedItem as any}
					files={files}
				/>
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
			<TakeoffReferenceByTypeModal
				open={showReferenceModal}
				item={referenceItem}
				onClose={() => {
					setShowReferenceModal(false);
					setReferenceItem(null);
				}}
			/>
			{fullLoading && <LoadingScreen isLoading={fullLoading} />}
		</div>
	);
}
