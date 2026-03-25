"use client";

import { notification, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getEvidenceByFileId } from "@/services/evidenceService";
import { changeCheckedItem } from "@/services/projectService";
import { getTakeOffsDetails } from "@/services/takeOffService";
import { getFieldsByTemplateId } from "@/services/templateService";

import AddBoxModal from "./components/AddBoxModal";
import EvidenceSidebar from "./components/EvidenceSidebar";
import ItemReferenceModal from "./components/ItemReferenceModal";
import TakeoffListHeader from "./components/TakeoffListHeader";
import TakeoffItemsTable from "./components/TakeoffItemsTable";
import { getFallbackDynamicFields, getSummaryStats } from "./takeoffUtils";
import {
	EvidenceRecord,
	ProjectFileRecord,
	TakeoffDetailsData,
	TakeoffItemRecord,
	TemplateField,
} from "./types";
import { FileOperationType } from "../types/evidence";

export default function TakeoffListPage() {
	const router = useRouter();
	const params = useParams();
	const projectId = String(params?.projectId || "");
	const takeoffId = String(params?.takeoffId || "");

	const [loading, setLoading] = useState(true);
	const [takeoffData, setTakeoffData] = useState<TakeoffDetailsData>();
	const [dynamicFields, setDynamicFields] = useState<TemplateField[]>([]);
	const [selectedFileId, setSelectedFileId] = useState<number>(-1);
	const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
	const [referenceItemId, setReferenceItemId] = useState<number | null>(null);
	const [searchValue, setSearchValue] = useState("");
	const [showEvidenceBoxes, setShowEvidenceBoxes] = useState(true);
	const [fileFilter, setFileFilter] = useState("all");
	const [showAddBoxModal, setShowAddBoxModal] = useState(false);
	const [showReferenceModal, setShowReferenceModal] = useState(false);
	const [evidencesByFile, setEvidencesByFile] = useState<
		Record<number, EvidenceRecord[]>
	>({});

	const files = useMemo<ProjectFileRecord[]>(() => {
		return takeoffData?.project_files || [];
	}, [takeoffData?.project_files]);

	const allItems = useMemo<TakeoffItemRecord[]>(() => {
		const itemsByFile = takeoffData?.all_items || {};
		return Object.values(itemsByFile).flat();
	}, [takeoffData?.all_items]);

	const selectedItem = useMemo(() => {
		return allItems.find((item) => item?.id === selectedItemId) || null;
	}, [allItems, selectedItemId]);

	const referenceItem = useMemo(() => {
		return allItems.find((item) => item?.id === referenceItemId) || null;
	}, [allItems, referenceItemId]);

	const summaryStats = useMemo(() => {
		return getSummaryStats(takeoffData);
	}, [takeoffData]);

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
				return;
			}

			const response = await getFieldsByTemplateId(String(templateId));
			if (response.status === "success") {
				const fields = response?.data || [];
				setDynamicFields(
					fields?.length ? fields : getFallbackDynamicFields(fallbackItems),
				);
				return;
			}

			setDynamicFields(getFallbackDynamicFields(fallbackItems));
			notification.error({
				message: "Error",
				description: "Failed to get template fields",
			});
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
		const response = await getTakeOffsDetails(takeoffId);
		setLoading(false);

		if (response.status !== "success") {
			notification.error({
				message: "Error",
				description: "Failed to get takeoff details",
			});
			return;
		}

		const nextTakeoffData = response?.data || {};
		const projectFiles = nextTakeoffData?.project_files || [];
		const firstFileId = projectFiles?.[0]?.id || -1;
		const flattenedItems = Object.values(
			nextTakeoffData?.all_items || {},
		).flat() as TakeoffItemRecord[];

		setTakeoffData(nextTakeoffData);
		setSelectedFileId(firstFileId);
		setSearchValue("");
		setShowEvidenceBoxes(true);
		setSelectedItemId(null);
		setReferenceItemId(null);
		setFileFilter("all");

		await Promise.all([
			fetchDynamicFields(
				nextTakeoffData?.take_off_result?.template_id,
				flattenedItems,
			),
			fetchAllFileEvidences(projectFiles),
		]);
	}, [fetchAllFileEvidences, fetchDynamicFields, takeoffId]);

	useEffect(() => {
		fetchTakeoff();
	}, [fetchTakeoff]);

	useEffect(() => {
		if (!selectedItemId) {
			return;
		}

		if (!allItems.find((item) => item?.id === selectedItemId)) {
			setSelectedItemId(null);
		}
	}, [allItems, selectedItemId]);

	useEffect(() => {
		if (!referenceItemId) {
			return;
		}

		if (!allItems.find((item) => item?.id === referenceItemId)) {
			setReferenceItemId(null);
			setShowReferenceModal(false);
		}
	}, [allItems, referenceItemId]);

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

	const handleResetTakeoff = () => {
		const firstFileId = files?.[0]?.id || -1;
		updateCurrentFileSelection(firstFileId);
		setFileFilter("all");
		setShowEvidenceBoxes(true);
	};

	const handleDownload = () => {
		const fileUrl = currentFile?.parse_detail?.uploaded_file_url;
		if (!fileUrl) {
			notification.info({
				message: "Info",
				description: "No downloadable file found for the current selection",
			});
			return;
		}

		window.open(fileUrl, "_blank", "noopener,noreferrer");
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
		setReferenceItemId(item?.id);
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
					selectedItemId={selectedItem?.id || null}
					reconcileCount={reconcileCount}
					onSearchChange={setSearchValue}
					onToggleStatus={handleToggleStatus}
					onSelectItem={(item) => setSelectedItemId(item?.id)}
					onOpenReferencePanel={handleOpenReferencePanel}
					onOpenReconcile={handleOpenReconcile}
					onRefreshItems={fetchTakeoff}
				/>

				<EvidenceSidebar
					files={files}
					selectedFileId={selectedFileId}
					selectedItem={selectedItem}
					fileFilter={fileFilter}
					showEvidenceBoxes={showEvidenceBoxes}
					evidencesByFile={evidencesByFile}
					onSelectFile={updateCurrentFileSelection}
					onChangeFileFilter={setFileFilter}
					onToggleEvidenceBoxes={() => setShowEvidenceBoxes((prev) => !prev)}
					onOpenAddBoxModal={() => setShowAddBoxModal(true)}
				/>
			</div>

			<AddBoxModal
				open={showAddBoxModal}
				projectId={projectId}
				files={files}
				initialFileId={currentFile?.id}
				selectedItem={selectedItem}
				evidencesByFile={evidencesByFile}
				onChangeFileEvidences={handleChangeFileEvidences}
				onClose={() => setShowAddBoxModal(false)}
			/>
			<ItemReferenceModal
				open={showReferenceModal}
				item={referenceItem}
				dynamicFields={dynamicFields}
				files={files}
				evidencesByFile={evidencesByFile}
				onClose={() => setShowReferenceModal(false)}
			/>
		</div>
	);
}
