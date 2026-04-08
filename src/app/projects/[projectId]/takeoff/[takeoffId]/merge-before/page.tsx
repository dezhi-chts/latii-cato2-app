"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, notification, Spin } from "antd";
import { useParams, useRouter } from "next/navigation";

import PdfWrapper from "../components/pdf/PdfWrapper";
import Thumbnail from "../components/pdf/Thumbnail";
import {
	ZoomControls,
	SelectPagesControls,
	AddRectBoxControls,
} from "../components/pdf/Pdf-Controls";
import { getEvidenceBySubTextEvidenceIds } from "@/services/takeOffService";
import {
	getTakeOffById,
	getEvidenceUrlsByEvidenceIds,
} from "@/services/takeOffService";
import {
	ProjectFileRecord,
	ProjectFileParseDetail,
	ImagePageInfo,
} from "../analyze-new/types";
import { EvidenceType, FileOperationType, GroupType } from "../types/evidence";
import Image from "next/image";
import { getEvidenceByFileId } from "@/services/evidenceService";
import LabelTable from "./components/LabelTable";
import ImageList from "./components/ImageList";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

interface ExtendedProjectFile extends ProjectFileRecord {
	operation_type?: string;
}

interface ParsedOcrResult {
	Label?: string;
	"Sub Label"?: string;
	[key: string]: unknown;
}

interface LabelTableItem {
	id: string | number;
	label: string;
	subLabel: string;
	evidenceId?: number;
}

export default function MergeBeforePage() {
	const router = useRouter();
	const { projectId, takeoffId } = useParams();

	const pdfWrapperRef = useRef<any>(null);

	const [loading, setLoading] = useState(true);
	const [files, setFiles] = useState<ExtendedProjectFile[]>([]);
	const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [zoom, setZoom] = useState(1);
	const [showThumbnail, setShowThumbnail] = useState(false);
	const [evidenceList, setEvidenceList] = useState<EvidenceType[]>([]);
	const [itemBoxList, setItemBoxList] = useState<EvidenceType[]>([]);
	const [imageData, setImageData] = useState<any[]>([]);

	const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<number | null>(
		null,
	);
	const [selectedElevationId, setSelectedElevationId] = useState<number | null>(
		null,
	);
	const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<number[]>([]);

	const selectedFile = useMemo(() => {
		return files.find((f) => f.id === selectedFileId) || null;
	}, [files, selectedFileId]);

	const pdfUrl = selectedFile?.parse_detail?.uploaded_file_url || "";

	const thumbnailData = useMemo(() => {
		const imagePages = selectedFile?.parse_detail?.image_page_infos || [];
		return imagePages.map((info: ImagePageInfo, index: number) => ({
			page: index + 1,
			file_name: info.file_name || "",
			s3_key: info.s3_key || "",
			s3_url: info.s3_url || "",
			type: "",
		}));
	}, [selectedFile]);

	const parseOcrText = (
		ocrText: unknown,
	): { evidenceId?: number; result: ParsedOcrResult } => {
		if (!ocrText) {
			return { evidenceId: undefined, result: {} };
		}

		try {
			const parsed =
				typeof ocrText === "string" ? JSON.parse(ocrText) : ocrText;
			return {
				evidenceId: (parsed as any)?.evidence_id,
				result: ((parsed as any)?.result || {}) as ParsedOcrResult,
			};
		} catch {
			return { evidenceId: undefined, result: {} };
		}
	};

	const floorPlanData = useMemo<LabelTableItem[]>(() => {
		return (itemBoxList || [])
			.filter((item: any) => item?.type === "Floor Plan Item")
			.map((item: any) => {
				const { evidenceId, result } = parseOcrText(item?.ocr_text);
				return {
					id: item?.id,
					label: String(result?.Label || "-"),
					subLabel: String(result?.["Sub Label"] || "-"),
					evidenceId,
				};
			});
	}, [itemBoxList]);

	const elevationData = useMemo<LabelTableItem[]>(() => {
		return (itemBoxList || [])
			.filter((item: any) => item?.type === "Elevation Item")
			.map((item: any) => {
				const { evidenceId, result } = parseOcrText(item?.ocr_text);
				return {
					id: item?.id,
					label: String(result?.Label || "-"),
					subLabel: String(result?.["Sub Label"] || "-"),
					evidenceId,
				};
			});
	}, [itemBoxList]);

	const fetchTakeoffData = useCallback(async () => {
		if (!takeoffId) return;

		setLoading(true);
		try {
			const response = await getTakeOffById(takeoffId as string);
			if (response.status === "success" && response.data) {
				const projectFiles: ExtendedProjectFile[] =
					response.data.project_files || [];
				setFiles(projectFiles);

				if (projectFiles.length > 0) {
					setSelectedFileId(projectFiles[0].id);
					fetchEvidenceByFileId(projectFiles[0].id);
				}
			}
		} catch (error) {
			console.error("Error fetching takeoff data:", error);
			notification.error({
				message: "Error",
				description: "Failed to load takeoff data.",
			});
		} finally {
			setLoading(false);
		}
	}, [takeoffId]);

	const fetchEvidenceByFileId = useCallback(async (fileId: number) => {
		try {
			const response: any = await getEvidenceByFileId(
				projectId as string,
				fileId,
			);
			if (response.status === "success" && response.data) {
				setEvidenceList(response.data || []);
			}
		} catch (error) {
			console.error("Error fetching evidence data:", error);
		}
	}, []);

	const getItemsByPageEvidences = useCallback(async () => {
		let ids =
			evidenceList
				.filter((e) => e.project_file_page_number === currentPage)
				?.map((e) => e.id) || [];
		if (ids.length > 0) {
			let res = await getEvidenceBySubTextEvidenceIds(ids.join(","));
			if (res.status === "success" && res.data) {
				setItemBoxList(res.data || []);
			} else {
				notification.error({
					message: "Error",
					description: "Failed to load evidence data.",
				});
			}
		}
	}, [currentPage, evidenceList]);

	const getEvidenceImages = async () => {
		let ids =
			evidenceList
				.filter((e: any) => e.type === GroupType.Elevation)
				?.map((e) => e.id) || [];
		if (ids.length === 0) return;
		const res = await getEvidenceUrlsByEvidenceIds(ids.join(","));
		if (res.status === "success" && res.data) {
			const data = res.data;
			let imageList: any[] = [];
			Object.values(data).forEach((item: any) => {
				imageList.push({
					id: item.id,
					evidence_url: item.evidence_url || "",
				});
			});
			setImageData(imageList);
		}
	};

	useEffect(() => {
		if (evidenceList.length > 0 && currentPage > 0) {
			getItemsByPageEvidences();
		}
	}, [currentPage, evidenceList]);

	useEffect(() => {
		if (evidenceList.length > 0) {
			getEvidenceImages();
		}
	}, [evidenceList]);

	useEffect(() => {
		fetchTakeoffData();
	}, [fetchTakeoffData]);

	useEffect(() => {
		if (selectedFileId) {
			fetchEvidenceByFileId(selectedFileId);
		}
	}, [selectedFileId, fetchEvidenceByFileId]);

	useEffect(() => {
		if (selectedFileId) {
			// 调用pdf的resetAllInfo方法
			pdfWrapperRef.current?.resetAllInfo?.();

			setCurrentPage(1);
			setZoom(1);
			setEvidenceList([]);
			setItemBoxList([]);
			setSelectedFloorPlanId(null);
			setSelectedElevationId(null);
			setSelectedEvidenceIds([]);
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

	const handleTotalPages = (total: number) => {
		setTotalPages(total);
	};

	const handleAddBox = () => {
		if (pdfWrapperRef.current) {
			pdfWrapperRef.current.addingRect({
				type: GroupType.Item,
				isSaveEvidence: false,
			});
		}
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

	const handleSelectFloorPlan = (item: LabelTableItem) => {
		setSelectedFloorPlanId(Number(item.id));
		setSelectedElevationId(null);
		setSelectedEvidenceIds(
			typeof item.evidenceId === "number" ? [item.evidenceId] : [],
		);
	};

	const handleSelectElevation = (item: LabelTableItem) => {
		setSelectedElevationId(Number(item.id));
		setSelectedFloorPlanId(null);
		setSelectedEvidenceIds(
			typeof item.evidenceId === "number" ? [item.evidenceId] : [],
		);
	};

	const handleNext = () => {
		notification.info({
			message: "Next",
			description: "Next button clicked.",
		});
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center bg-white">
				<Spin size="large" />
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-white font-nunito">
			{/* Header */}
			<header className="px-14 flex h-[110px] shrink-0 items-center justify-between border-b border-primaryN30 bg-white">
				<div className="flex items-center gap-3">
					{files.map((file) => (
						<button
							key={file.id}
							type="button"
							className={`flex h-[50px] min-w-[140px] flex-col items-start justify-center rounded-lg px-4 text-left transition-all ${
								file.id === selectedFileId
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
				>
					Next
				</Button>
			</header>

			{/* Content */}
			<div className="pl-6 pr-14 py-2 flex-1 flex flex-row relative overflow-x-auto">
				{/* Left: Thumbnail */}
				<div
					className={`h-full shrink-0 transition-all duration-200 z-999 overflow-y-auto ${
						showThumbnail ? "w-[250px]" : "w-0"
					}`}
				>
					<Thumbnail
						pdfRef={pdfWrapperRef}
						showThumbnail={showThumbnail}
						setShowThumbnail={setShowThumbnail}
						data={thumbnailData}
						page={currentPage}
						setPage={handlePageChange}
						showShadow={false}
						size={
							selectedFile?.operation_type === FileOperationType.Quote
								? "larger"
								: "default"
						}
					/>
				</div>
				{/* Right: PDF Viewer with Controls */}
				<div
					className={`w-[80vw] flex flex-col ${showThumbnail ? "pl-0" : "pl-6"}`}
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
						<div className="flex items-center gap-4">
							<SelectPagesControls
								page={currentPage}
								totalPages={totalPages}
								handlePageChange={handlePageChange}
							/>
							<ZoomControls zoom={zoom} handleZoomChange={handleZoomChange} />
						</div>
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
								onChangePage={handlePageChange}
								onTotalPages={handleTotalPages}
								onAppendEvidence={handleAppendEvidence}
								onDeleteEvidence={handleDeleteEvidence}
								onUpdateEvidence={handleUpdateEvidence}
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
				<div className="flex h-full flex-row gap-2 shrink-0 border-l border-primaryN30 bg-white p-4 overflow-hidden">
					<div className="w-[300px]">
						<LabelTable
							title="Floor Plan"
							data={floorPlanData}
							selectedId={selectedFloorPlanId}
							onSelect={handleSelectFloorPlan}
						/>
					</div>
					<div className="w-[300px]">
						<LabelTable
							title="Elevation"
							data={elevationData}
							selectedId={selectedElevationId}
							onSelect={handleSelectElevation}
						/>
					</div>
					<div className="w-[250px] min-h-0">
						<ImageList imagesData={imageData} />
					</div>
				</div>
			</div>
		</div>
	);
}
