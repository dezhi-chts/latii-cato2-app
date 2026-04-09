"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, notification, Spin, Modal } from "antd";
import { useParams, useRouter } from "next/navigation";

import PdfWrapper from "../components/pdf/PdfWrapper";
import {
	ZoomControls,
	SelectPagesControls,
	AddRectBoxControls,
} from "../components/pdf/Pdf-Controls";
import { getEvidenceBySubTextEvidenceIds, getEvidencesElevationFloorPlanWithUrlByProjectFileId, getEvidencesWindowTableQuoteWithUrlByProjectFileId } from "@/services/takeOffService";
import {
	getTakeOffById,
	getEvidenceUrlsByEvidenceIds,
} from "@/services/takeOffService";
import {
	ProjectFileRecord,
	ProjectFileParseDetail,
	ImagePageInfo,
} from "../analyze-new/types";
import { EvidenceType, FileOperationType, GroupType, PageType } from "../types/evidence";
import Image from "next/image";
import LabelTable from "./components/LabelTable";
import ImageList from "./components/ImageList";
import { ArchDrawingSummaryPageTypes } from '../types/evidence'
import EvidenceThumbailList from "./components/EvidenceThumbailList";
import LabelConfirmModal from "./components/LabelConfirmModal";
import { evidenceBatchSubmit } from "@/services/evidenceService";
import LoadingScreen from "@/components/loading-screen";
import { set } from "lodash";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

interface ExtendedProjectFile extends ProjectFileRecord {
	operation_type?: string;
}

export default function MergeBeforePage() {
	const router = useRouter();
	const { projectId, takeoffId } = useParams();

	const pdfWrapperRef = useRef<any>(null);

	const [fullLoading, setFullLoading] = useState(true);
	const [files, setFiles] = useState<ExtendedProjectFile[]>([]);
	const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [zoom, setZoom] = useState(1);
	const [showThumbnail, setShowThumbnail] = useState(true);
	const [thumbnailData, setThumbnailData] = useState<any[]>([]);
	const [itemBoxList, setItemBoxList] = useState<EvidenceType[]>([]);
	const [scheduleList, setScheduleList] = useState<any[]>([]);

	const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<number | null>(
		null,
	);
	const [pageElevationId, setPageElevationId] = useState<number>(0);
	const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<any>(null);
	const [showLabelModal, setShowLabelModal] = useState(false);
	const [showScheduleModal, setShowScheduleModal] = useState(false);

	const confirmItem = useRef<any>(null);

	const selectedFile = useMemo(() => {
		return files.find((f) => f.id === selectedFileId) || null;
	}, [files, selectedFileId]);

	const pdfUrl = selectedFile?.parse_detail?.uploaded_file_url || "";

	const floorPlanData = useMemo<any[]>(() => {
		return (itemBoxList || [])
			.filter((item: any) => item?.type === "Floor Plan Item");
	}, [itemBoxList]);

	const elevationData = useMemo<any[]>(() => {
		return (itemBoxList || [])
			.filter((item: any) => item?.type === "Elevation Item");
	}, [itemBoxList]);

	const fetchTakeoffData = useCallback(async () => {
		if (!takeoffId) return;

		setFullLoading(true);
		try {
			const response = await getTakeOffById(takeoffId as string);
			if (response.status === "success" && response.data) {
				const projectFiles: ExtendedProjectFile[] =
					response.data.project_files || [];
				setFiles(projectFiles);

				if (projectFiles.length > 0) {
					setSelectedFileId(projectFiles[0].id);
				}
			}
		} catch (error) {
			console.error("Error fetching takeoff data:", error);
			notification.error({
				message: "Error",
				description: "Failed to load takeoff data.",
			});
		} finally {
			setFullLoading(false);
		}
	}, [takeoffId]);

	const fetchFloorPlanAndElevation = useCallback(async () => {
		if (!selectedFileId) return;
		const response = await getEvidencesElevationFloorPlanWithUrlByProjectFileId(selectedFileId.toString());
		if (response.status === "success" && response.data) {
			let data = response.data || [];
			data.sort((a: any, b: any) => (a?.project_file_page_number || 0) - (b?.project_file_page_number || 0));
			setThumbnailData(data);
			if (data.length > 0) {
				setCurrentPage(data[0].project_file_page_number || 0);
				setPageElevationId(data[0].id || 0);
			}
		} else {
			notification.error({
				message: "Error",
				description: "Failed to load floor plan and elevation data.",
			});
		}

	}, [selectedFileId]);

	const fetchScheduleEvidenceList = useCallback(async () => {
		if (!selectedFileId) return;
		const response = await getEvidencesWindowTableQuoteWithUrlByProjectFileId(selectedFileId.toString());
		if (response.status === "success" && response.data) {
			setScheduleList(response.data || []);
		} else {
			notification.error({
				message: "Error",
				description: "Failed to load schedule evidence data.",
			});
		}
	}, [selectedFileId]);

	const getItemsByPageEvidences = useCallback(async (id: number) => {
		if (id) {
			let res = await getEvidenceBySubTextEvidenceIds(id.toString());
			if (res.status === "success" && res.data) {
				let currentPageEvidence = thumbnailData.find((item: any) => item.id === id);
				if (currentPageEvidence) {
					currentPageEvidence.isParentEvidence = true;
				}

				let list = res.data || [];
				if (currentPageEvidence) {
					list.unshift(currentPageEvidence);
				}
				setItemBoxList(list);

			} else {
				notification.error({
					message: "Error",
					description: "Failed to load evidence data.",
				});
			}
		}
	}, [currentPage, thumbnailData]);


	useEffect(() => {
		if (pageElevationId) {
			getItemsByPageEvidences(pageElevationId);
			setSelectedEvidenceIds([pageElevationId]);
		}
	}, [pageElevationId]);


	useEffect(() => {
		fetchTakeoffData();
	}, []);

	useEffect(() => {
		if (selectedFileId) {
			fetchFloorPlanAndElevation();
			fetchScheduleEvidenceList();
		}
	}, [selectedFileId]);

	useEffect(() => {
		if (selectedFileId) {
			// 调用pdf的resetAllInfo方法
			pdfWrapperRef.current?.resetAllInfo?.();

			setCurrentPage(1);
			setZoom(1);
			setItemBoxList([]);
			setSelectedFloorPlanId(null);
		}
	}, [selectedFileId]);

	const handleSelectFile = (fileId: number) => {
		if (fileId !== selectedFileId) {
			setSelectedFileId(fileId);
		}
	};

	const handleZoomChange = (value: number) => {
		const clampedValue = Math.max(ZOOM_MIN, Math.min(value, ZOOM_MAX));
		setZoom(clampedValue);
	};

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	const handlePageEvidenceChange = useCallback((evidenceId: any) => {
		setPageElevationId(evidenceId);
		let currentPage = thumbnailData.find((item) => item.id === evidenceId)?.project_file_page_number || 0;
		setCurrentPage(currentPage);
	}, [currentPage, thumbnailData]);

	const handleTotalPages = (total: number) => {
		setTotalPages(total);
	};

	const handleAddBox = useCallback(() => {
		if (!pageElevationId || thumbnailData.length === 0) return;

		if (pdfWrapperRef.current) {
			let evid = thumbnailData.find((item) => item.id === pageElevationId);
			if (!evid) return;
			let evidType = evid.type + ' Item';
			pdfWrapperRef.current.addingRect({
				type: evidType,
				isSaveEvidence: false,
			});
		}
	}, [pageElevationId, thumbnailData]);


	const handleDeleteEvidence = (data: any) => {
		// 刷新数据
		getItemsByPageEvidences(pageElevationId);
	};

	const handleUpdateEvidence = (data: any) => {
		if (data?.evidences) {
			setItemBoxList((prev) =>
				prev.map((e) => {
					const updated = data.evidences.find((u: any) => u.id === e.id);
					return updated ? { ...e, ...updated } : e;
				}),
			);
		}
	};

	const handleSelectFloorPlan = (item: { id: string | number }) => {
		setSelectedEvidenceIds([item.id]);
	};

	const handleSelectElevation = (item: { id: string | number }) => {
		setSelectedEvidenceIds([item.id]);
	};

	const handleUpdateItemByLabelTable = useCallback((updatedItem: any) => {
		setItemBoxList((prev) =>
			prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
		);
	}, []);

	const handleDeleteItemByLabelTable = useCallback(async (deletedId: number) => {
		setSelectedEvidenceIds((prev: number[] | null) =>
			prev?.includes(deletedId) ? null : prev,
		);
		await getItemsByPageEvidences(pageElevationId);
	}, [getItemsByPageEvidences, pageElevationId]);

	const handleItemEvidenceConfirm = useCallback((item: any) => {
		console.log("item", item);
		// show confirm modal
		confirmItem.current = item;
		setShowLabelModal(true);
	}, []);

	const evidenceType = useMemo(() => {
		return thumbnailData.find((item) => item.id === pageElevationId)?.type || "";
	}, [pageElevationId]);

	const handleItemSubmit = useCallback(async (formData: any) => {
		// submit form data
		let ocr_text = {
			result: {
				Label: formData.Label,
				'Sub Label': formData['Sub Label'],
			}
		}

		let count = evidenceType === PageType.FloorPlan ? floorPlanData.length : elevationData.length;

		let itemInfo = { ...confirmItem.current };
		if (itemInfo.groupId) {
			delete itemInfo.groupId;
		}

		let data = [{
			...itemInfo,
			ocr_text: JSON.stringify(ocr_text),
			sub_text: `${pageElevationId}:${count + 1}`,
		}];
		console.log('data', data);

		setFullLoading(true);

		// 组装数据
		let res = await evidenceBatchSubmit(data);
		setFullLoading(false);
		if (res.status === 'success') {
			notification.success({
				message: 'Confirm success',
			});
			// 关闭弹窗
			setShowLabelModal(false);
			// 清除裁剪区域
			pdfWrapperRef.current?.clearCropSections?.();
			// 刷新数据
			getItemsByPageEvidences(pageElevationId);
		} else {
			notification.error({
				message: res?.data?.detail || 'Confirm failed',
			});
		}

	}, [evidenceType, floorPlanData, elevationData]);

	const handleNext = () => {
		notification.info({
			message: "Next",
			description: "Next button clicked.",
		});
	};

	const handleChangeSelectedEvidence = (evidenceIds: number[]) => {
		// 获取evidenceIds
		if (evidenceIds.length > 0) {
			setSelectedEvidenceIds(evidenceIds);
		}
	};

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-white font-nunito">
			{/* Header */}
			<header className="px-14 flex h-[110px] shrink-0 items-center justify-between border-b border-primaryN30 bg-white">
				<div className="flex items-center gap-3">
					{files.map((file) => (
						<button
							key={file.id}
							type="button"
							className={`flex h-[50px] min-w-[140px] flex-col items-start justify-center rounded-lg px-4 text-left transition-all ${file.id === selectedFileId
								? "bg-primaryN30"
								: "border border-primaryN30"
								}`}
							onClick={() => handleSelectFile(file.id)}
						>
							<span className="max-w-[180px] truncate text-sm text-grey-dark">
								{file.file_name || `File ${file.id}`}
							</span>
							{file.operation_type && (
								<span className="mt-1 text-xs text-grey-normal">
									{file.operation_type}
								</span>
							)}
						</button>
					))}
				</div>
				<Button
					type="primary"
					className="custom-primary-btn"
					onClick={handleNext}
					disabled={true}
				>
					Next
				</Button>
			</header>

			{/* Content */}
			<div className="pl-6 pr-14 py-2 flex-1 min-h-0 flex flex-row overflow-hidden">
				{/* Left: Thumbnail */}
				<div
					className={`h-full shrink-0 transition-all duration-200 z-999 overflow-y-auto ${showThumbnail ? "w-[250px]" : "w-0"
						}`}
				>
					<EvidenceThumbailList
						pdfRef={pdfWrapperRef}
						data={thumbnailData}
						evidenceId={pageElevationId}
						onChangeEvidenceId={handlePageEvidenceChange}
						showShadow={false}
						showCategory={true}
						categoryList={ArchDrawingSummaryPageTypes}
						size={
							selectedFile?.operation_type === FileOperationType.Quote
								? "larger"
								: "default"
						}
					/>
				</div>
				{/* Right: PDF Viewer with Controls */}
				<div
					className={`min-w-0 flex-1 flex flex-col overflow-hidden ${showThumbnail ? "pl-0" : "pl-6"}`}
				>
					{/* PDF Controls Bar */}
					<div className="flex h-12 shrink-0 items-center justify-between">
						<div className="flex flex-row items-center gap-2">
							<button
								type="button"
								className="flex h-7 w-7 items-center justify-center rounded-md bg-grey-light text-grey-normal transition-all hover:bg-primaryN30"
								onClick={() => setShowThumbnail(!showThumbnail)}
							>
								<Image
									src="/assets/icons/thumbnail.svg"
									width={16}
									height={16}
									alt="thumbnail icon"
								/>
							</button>
							<AddRectBoxControls
								text="Add Box"
								handleAddRectBox={handleAddBox}
							/>
						</div>
						<ZoomControls
							zoom={zoom}
							handleZoomChange={handleZoomChange}
						/>
					</div>

					{/* PDF Viewer */}
					<div className="min-h-0 flex-1 overflow-hidden">
						{pdfUrl ? (
							<PdfWrapper
								ref={pdfWrapperRef}
								operationMode="edit"
								project_id={projectId as string}
								project_file_id={selectedFileId || 0}
								pdfUrl={pdfUrl}
								page={currentPage}
								zoom={zoom}
								allEvidence={itemBoxList}
								selectedEvidenceIds={selectedEvidenceIds}
								typeList={[]}
								pdfOperationType={
									selectedFile?.operation_type === "Quote"
										? FileOperationType.Quote
										: FileOperationType.ArchitectureDrawing
								}
								evidenceDraggable={false}
								onChangePage={handlePageChange}
								onTotalPages={handleTotalPages}
								onDeleteEvidence={handleDeleteEvidence}
								onUpdateEvidence={handleUpdateEvidence}
								onItemEvidenceConfirm={handleItemEvidenceConfirm}
								onChangeSelectedEvidence={handleChangeSelectedEvidence}
							/>
						) : (
							<div className="flex h-full items-center justify-center text-grey-normal">
								{files.length === 0
									? "No files available"
									: "Select a file to view"}
							</div>
						)}
					</div>
				</div>
				{/** right view */}
				<div className="h-full w-[320px] shrink-0 border-l border-primaryN30 bg-white p-4 overflow-hidden">
					{evidenceType === PageType.FloorPlan &&
						<div className="w-[300px]">
							<LabelTable
								title="Floor Plan"
								data={floorPlanData}
								selectedId={selectedEvidenceIds?.[0] || ''}
								setShowScheduleModal={setShowScheduleModal}
								onSelect={handleSelectFloorPlan}
								onUpdateItem={handleUpdateItemByLabelTable}
								onDeleteSuccess={handleDeleteItemByLabelTable}
							/>
						</div>
					}

					{evidenceType === PageType.Elevation &&
						<div className="w-[300px]">
							<LabelTable
								title="Elevation"
								data={elevationData}
								selectedId={selectedEvidenceIds?.[0] || ''}
								setShowScheduleModal={setShowScheduleModal}
								onSelect={handleSelectElevation}
								onUpdateItem={handleUpdateItemByLabelTable}
								onDeleteSuccess={handleDeleteItemByLabelTable}
							/>
						</div>
					}
				</div>
			</div>
			{showLabelModal && (
				<LabelConfirmModal
					open={showLabelModal}
					onCancel={() => setShowLabelModal(false)}
					onSubmit={handleItemSubmit}
				>
					<ImageList imagesData={scheduleList} showPreview={false} />
				</LabelConfirmModal>
			)}
			{
				showScheduleModal && (
					<Modal
						title={null}
						open={showScheduleModal}
						onCancel={() => setShowScheduleModal(false)}
						width={'50vw'}
						centered={true}
						footer={null}
					>
						<div className="h-[80vh] flex flex-col overflow-hidden">
							<ImageList imagesData={scheduleList} showPreview={false} />
						</div>
					</Modal>
				)
			}
			{
				fullLoading && <LoadingScreen isLoading={fullLoading} />
			}
		</div>
	);
}
