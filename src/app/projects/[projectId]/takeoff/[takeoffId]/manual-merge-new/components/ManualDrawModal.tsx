"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Modal, notification } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import PdfWrapper from "../../components/pdf/PdfWrapper";
import { ZoomControls } from "../../components/pdf/Pdf-Controls";
import {
	analyzeNewEvidencesByProjectFile,
	getEvidenceByProjectFileAndPage,
	getTakeOffResultItemWithEvidenceUrlsById,
} from "@/services/takeOffService";
import { ProjectFileRecord } from "../../analyze-new/types";
import {
	FileOperationType,
	GroupType,
	itemBoxType,
} from "../../types/evidence";

import { EvidenceType } from "../../types/evidence";
import { useParams } from "next/navigation";
import LoadingScreen from "@/components/loading-screen";

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 3;

interface ManualDrawModalProps {
	open: boolean;
	item: {
		id: number;
		key: string;
		result?: Record<string, string>;
		sourceType?: string;
	} | null;
	fileInfo: (ProjectFileRecord & { operation_type?: string }) | null;
	projectId: string;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function ManualDrawModal({
	open,
	item,
	fileInfo,
	projectId,
	onClose,
	onSuccess,
}: ManualDrawModalProps) {
	const takeoffId = useParams().takeoffId;
	const pdfWrapperRef = useRef<any>(null);
	const [evidenceList, setEvidenceList] = useState<EvidenceType[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [zoom, setZoom] = useState(1);
	const [targetEvidenceIds, setTargetEvidenceIds] = useState<number[]>([]);
	const [fullLoading, setFullLoading] = useState(false);

	const pdfUrl = fileInfo?.parse_detail?.uploaded_file_url || "";

	// When modal opens, fetch item's evidence to get the initial page number, then fetch page evidences
	useEffect(() => {
		if (!open || !item?.id || !fileInfo?.id) return;

		console.log("item 8888", item);

		const initializePageAndEvidence = async () => {
			try {
				// Step 1: Get item's evidence to determine the page number
				const itemResponse = await getTakeOffResultItemWithEvidenceUrlsById(
					item.id,
				);
				let targetPage = 1;
				if (itemResponse.status === "success" && itemResponse.data) {
					targetPage =
						itemResponse.data?.evidence?.project_file_page_number || 1;
					let targetEvidenceIds =
						typeof itemResponse.data?.evidence?.id === "number"
							? [itemResponse.data?.evidence?.id]
							: [];
					setTargetEvidenceIds(targetEvidenceIds);
				}
				setCurrentPage(targetPage);

				// Step 2: Immediately fetch evidences for that page
				const pageResponse = await getEvidenceByProjectFileAndPage(
					fileInfo.id,
					targetPage,
				);
				if (pageResponse.status === "success" && pageResponse.data) {
					setEvidenceList(pageResponse.data || []);
				}
			} catch (error) {
				console.error("Error initializing page and evidence:", error);
				setCurrentPage(1);
			} finally {
			}
		};

		initializePageAndEvidence();
	}, [open, item?.id, fileInfo?.id]);

	// Reset state when modal closes
	useEffect(() => {
		if (!open) {
			setEvidenceList([]);
			setCurrentPage(0);
			setZoom(1);
		}
	}, [open]);

	const handleZoomChange = (value: number) => {
		const clampedValue = Math.max(ZOOM_MIN, Math.min(value, ZOOM_MAX));
		setZoom(clampedValue);
	};

	const handleAddBox = () => {
		if (pdfWrapperRef.current) {
			let type: any = item?.sourceType;
			if (item?.sourceType === GroupType.FloorPlan) {
				type = itemBoxType.FloorPlanItem;
			} else if (item?.sourceType === GroupType.Elevation) {
				type = itemBoxType.ElevationItem;
			} else if (item?.sourceType === "Schedule") {
				type = itemBoxType.WindowDoorUnitItem;
			} else if (item?.sourceType === GroupType.WindowDoorUnitList) {
				type = itemBoxType.WindowDoorUnitListItem;
			}
			console.log("type 8888", type);
			pdfWrapperRef.current.addingRect({
				type: type,
				isSaveEvidence: false,
			});
		}
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const handleTotalPages = (total: number) => {
		setTotalPages(total);
	};

	const handleAppendEvidence = (data: any) => {
		if (data?.evidences) {
			setEvidenceList((prev) => [...prev, ...data.evidences]);
		}
	};

	const handleDeleteEvidence = (data: any) => {
		if (data?.deleteIds) {
			setEvidenceList((prev) =>
				prev.filter((e) => !data.deleteIds.includes(e.id)),
			);
		}
	};

	const handleUpdateEvidence = (data: any) => {
		if (data?.evidences) {
			setEvidenceList((prev) =>
				prev.map((e) => {
					const updated = data.evidences.find((u: any) => u.id === e.id);
					return updated ? { ...e, ...updated } : e;
				}),
			);
		}
	};

	const handleConfirm = async () => {
		if (pdfWrapperRef.current) {
			const cropSectionsData =
				pdfWrapperRef.current.getRevertCropSectionsData();
			console.log("cropSectionsData", cropSectionsData);
			if (cropSectionsData.length === 0) {
				notification.error({
					message: "Error",
					description: "Please add at least one box.",
				});
				return;
			}
			let newList = cropSectionsData.map((item: any) => {
				const type = item.type;
				if (type === itemBoxType.WindowDoorUnitItem) {
					return {
						...item,
						type: GroupType.WindowDoorUnit,
					};
				} else if (type === itemBoxType.TableItem) {
					return {
						...item,
						type: GroupType.Table,
					};
				} else if (type === itemBoxType.WindowDoorUnitListItem) {
					return {
						...item,
						type: "window_door_unit_list",
					};
				}
				return item;
			});
			console.log("newList", newList);
			setFullLoading(true);
			const response = await analyzeNewEvidencesByProjectFile(
				takeoffId as string,
				fileInfo?.id?.toString() || "",
				newList,
			);
			console.log("response 888", response);

			setFullLoading(false);
			if (response.status === "success" && response.data) {
				console.log("response.data success");
				notification.success({
					message: "Success",
					description: "Analyze new evidences by project file successfully",
				});
				// 刷新父组件当前数据，关闭弹框
				onSuccess?.();
			} else {
				notification.error({
					message: "Error",
					description: "Failed to analyze new evidences by project file",
				});
			}
		}
	};

	return (
		<Modal
			open={open}
			title={null}
			onCancel={onClose}
			footer={null}
			width={"80vw"}
			centered
			destroyOnClose
		>
			<div className="h-[80vh] flex flex-col font-nunito">
				<div className="py-2 flex items-center gap-3">
					<span className="text-lg text-forumBlue-normal">Manual Draw Box</span>
				</div>
				<div className="border-t border-primaryN30 bg-[#FBFBFC] px-4 py-3">
					<div className="flex flex-row gap-4 text-xs">
						<div>
							<span className="text-grey-normal">Label: </span>
							<span className="font-medium text-grey-dark">
								{item?.result?.Label || "-"}
							</span>
						</div>
						<div>
							<span className="text-grey-normal">Sub Label: </span>
							<span className="font-medium text-grey-dark">
								{item?.result?.["Sub Label"] || "-"}
							</span>
						</div>
						<div>
							<span className="text-grey-normal">Source Type: </span>
							<span className="font-medium text-grey-dark">
								{item?.sourceType || "-"}
							</span>
						</div>
					</div>
				</div>

				{/* Header with item info, zoom controls and Add Box button */}
				<div className="flex items-center justify-between border-b border-primaryN30 px-4 py-3">
					<div className="flex items-center gap-4">
						<div className="text-xs text-grey-normal">
							<span className="font-medium text-grey-dark">File: </span>
							{fileInfo?.file_name || "-"}
						</div>
						<div className="text-xs text-grey-normal">
							<span className="font-medium text-grey-dark">Page: </span>
							{currentPage}
						</div>
					</div>

					{/* Zoom controls */}
					<ZoomControls zoom={zoom} handleZoomChange={handleZoomChange} />

					<Button
						type="primary"
						icon={<PlusOutlined />}
						className="custom-primary-btn"
						onClick={handleAddBox}
						disabled={!pdfUrl}
					>
						Add Box
					</Button>
				</div>

				{/* PDF Viewer */}
				<div className="min-h-0 flex-1">
					<PdfWrapper
						ref={pdfWrapperRef}
						operationMode="view"
						project_id={projectId}
						project_file_id={fileInfo?.id || 0}
						pdfUrl={pdfUrl}
						page={currentPage}
						zoom={zoom}
						allEvidence={evidenceList}
						selectedEvidenceIds={targetEvidenceIds}
						typeList={[]}
						pdfOperationType={
							fileInfo?.operation_type === "Quote"
								? FileOperationType.Quote
								: FileOperationType.ArchitectureDrawing
						}
						onChangePage={handlePageChange}
						onTotalPages={handleTotalPages}
						onAppendEvidence={handleAppendEvidence}
						onDeleteEvidence={handleDeleteEvidence}
						onUpdateEvidence={handleUpdateEvidence}
						onChangeZoom={handleZoomChange}
					/>
				</div>

				{/* Item info footer */}
			</div>
			<div className="flex flex-row gap-2 justify-end py-2">
				<Button key="cancel" className="custom-default-btn" onClick={onClose}>
					Cancel
				</Button>
				<Button
					key="confirm"
					className="custom-primary-btn"
					onClick={handleConfirm}
				>
					Confirm
				</Button>
			</div>
			{fullLoading && <LoadingScreen isLoading={fullLoading} />}
		</Modal>
	);
}
