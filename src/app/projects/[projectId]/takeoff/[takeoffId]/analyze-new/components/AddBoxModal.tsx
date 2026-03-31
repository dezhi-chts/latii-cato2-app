"use client";

import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Empty, Modal, Select, notification } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useUser } from "@/context/UserContext";
import { deleteBoxType, getBoxTypes } from "@/services/drawingIndexService";

import BoxTypesSelect from "../../components/pdf/BoxTypesSelect";
import {
	SelectPagesControls,
	ZoomControls,
} from "../../components/pdf/Pdf-Controls";
import PdfWrapper from "../../components/pdf/PdfWrapper";
import Thumbnail from "../../components/pdf/Thumbnail";
import {
	EvidenceResult,
	FileOperationType,
	PdfWrapperRefMethods,
} from "../../types/evidence";
import NewLogicBoxModal from "../../identification/page-label/components/NewLogicBoxModal";
import { EvidenceRecord, ProjectFileRecord, TakeoffItemRecord } from "../types";

interface AddBoxModalProps {
	open: boolean;
	projectId: string;
	files: ProjectFileRecord[];
	initialFileId?: number;
	selectedItem?: TakeoffItemRecord | null;
	evidencesByFile: Record<number, EvidenceRecord[]>;
	onChangeFileEvidences: (
		fileId: number,
		updater: (current: EvidenceRecord[]) => EvidenceRecord[],
	) => void;
	onClose: () => void;
}

export default function AddBoxModal({
	open,
	projectId,
	files,
	initialFileId,
	selectedItem,
	evidencesByFile,
	onChangeFileEvidences,
	onClose,
}: AddBoxModalProps) {
	console.log("files", files);
	const { company_id } = useUser();
	const pdfRef = useRef<PdfWrapperRefMethods | null>(null);
	const [selectedFileId, setSelectedFileId] = useState<number>(
		initialFileId || -1,
	);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [zoom, setZoom] = useState(1);
	const [showThumbnail, setShowThumbnail] = useState(true);
	const [boxTypeList, setBoxTypeList] = useState<any[]>([]);
	const [showNewLogicBoxModal, setShowNewLogicBoxModal] = useState(false);
	const [editBoxTypeData, setEditBoxTypeData] = useState<any>(null);

	const [pdfUrl, setPdfUrl] = useState<string>("");
	const [imagePages, setImagePages] = useState<any[]>([]);

	useEffect(() => {
		if (!open) {
			return;
		}

		setSelectedFileId(initialFileId || files?.[0]?.id || -1);
		setPage(1);
		setZoom(1);
	}, [files, initialFileId, open]);

	const selectedFile = useMemo(() => {
		return files.find((file) => file.id === selectedFileId);
	}, [files, selectedFileId]);

	useEffect(() => {
		if (!selectedFile) {
			return;
		}

		pdfRef.current?.resetAllInfo?.();
		setPage(1);
		setZoom(1);

		setPdfUrl(selectedFile?.parse_detail?.uploaded_file_url || "");
		setImagePages(selectedFile?.parse_detail?.image_page_infos || []);
	}, [selectedFile]);

	const selectedFileEvidences = useMemo(() => {
		if (!selectedFileId || selectedFileId === -1) {
			return [];
		}

		return evidencesByFile?.[selectedFileId] || [];
	}, [evidencesByFile, selectedFileId]);

	const thumbnailData = useMemo(() => {
		return imagePages.map((pageInfo, index) => ({
			page: index + 1,
			file_name: pageInfo?.file_name || `${index}.png`,
			s3_key: pageInfo?.s3_key || `${selectedFileId}-${index}`,
			s3_url: pageInfo?.s3_url || "",
			type: "",
		}));
	}, [imagePages, selectedFileId]);

	const selectedFileOperationType =
		(
			selectedFile as ProjectFileRecord & {
				operation_type?: FileOperationType;
			}
		)?.operation_type || FileOperationType.Quote;

	const fetchBoxTypeList = useCallback(async () => {
		if (!company_id) {
			return;
		}

		const response = await getBoxTypes(company_id.toString());
		if (response.status === "success") {
			setBoxTypeList(response?.data ?? []);
			return;
		}

		notification.error({
			message: "Error",
			description: "Failed to load box types",
		});
	}, [company_id]);

	useEffect(() => {
		if (open) {
			fetchBoxTypeList();
		}
	}, [fetchBoxTypeList, open]);

	const handleZoomChange = (value: number) => {
		const safeZoom = Math.min(3, Math.max(0.2, Number(value.toFixed(2))));
		setZoom(safeZoom);
	};

	const handlePageChange = (nextPage: number) => {
		if (!totalPages) {
			return;
		}

		const safePage = Math.min(totalPages, Math.max(1, nextPage));
		setPage(safePage);
	};

	const handleAddRectBox = (type: string) => {
		if (pdfRef.current?.addingRect) {
			pdfRef.current.addingRect({ type, isSaveEvidence: true });
		}
	};

	const handleChangeBoxType = (type: string) => {
		if (type === "customize") {
			setEditBoxTypeData(null);
			setShowNewLogicBoxModal(true);
			return;
		}

		handleAddRectBox(type);
	};

	const handleDeleteBoxType = async (item: any) => {
		if (!company_id || !item?.id) {
			return;
		}

		const response = await deleteBoxType(company_id.toString(), item.id);
		if (response.status === "success") {
			fetchBoxTypeList();
			return;
		}

		notification.error({
			message: "Error",
			description: response?.data?.detail || "Failed to delete logic box",
		});
	};

	const handleAppendEvidence = (result: EvidenceResult) => {
		const nextEvidences = (result?.evidences || []) as EvidenceRecord[];
		if (!selectedFileId || !nextEvidences.length) {
			return;
		}

		onChangeFileEvidences(selectedFileId, (current) => {
			const existingIds = new Set(current.map((item) => item.id));
			return [
				...current,
				...nextEvidences.filter((item) => !existingIds.has(item.id)),
			];
		});
	};

	const handleDeleteEvidence = (result: EvidenceResult) => {
		const deleteIds = result?.deleteIds || [];
		if (!selectedFileId || !deleteIds.length) {
			return;
		}

		onChangeFileEvidences(selectedFileId, (current) => {
			return current.filter((item) => !deleteIds.includes(item.id));
		});
	};

	const handleUpdateEvidence = (result: EvidenceResult) => {
		const nextEvidences = (result?.evidences || []) as EvidenceRecord[];
		if (!selectedFileId || !nextEvidences.length) {
			return;
		}

		onChangeFileEvidences(selectedFileId, (current) => {
			return current.map((item) => {
				const updatedItem = nextEvidences.find(
					(evidence) => evidence.id === item.id,
				);
				return updatedItem ? { ...updatedItem } : item;
			});
		});
	};

	const handleChangeFile = async (nextFileId: number) => {
		if (nextFileId === selectedFileId) {
			return;
		}

		const canSwitch = await pdfRef.current?.checkAndHandleUnsavedCrops?.();
		if (!pdfRef.current || canSwitch) {
			setSelectedFileId(nextFileId);
			setPage(1);
			setZoom(1);
		}
	};

	const handleClose = async () => {
		const canClose = await pdfRef.current?.checkAndHandleUnsavedCrops?.();
		if (!pdfRef.current || canClose) {
			onClose();
		}
	};

	return (
		<>
			<Modal
				open={open}
				onCancel={handleClose}
				footer={null}
				title={null}
				centered
				width={"80vw"}
				destroyOnClose
			>
				<div className="flex h-[82vh] min-h-[720px] flex-col gap-5 p-2 font-nunito">
					<div className="flex items-start justify-between gap-4">
						<div>
							<div className="text-base text-forumBlue-normal">
								Add Evidence Box
							</div>
							<div className="mt-1 text-xs text-grey-normal">
								Select a file, review page thumbnails, and draw new evidence
								boxes directly on the PDF.
							</div>
						</div>
					</div>

					<div className="p-2">
						<Select
							value={selectedFileId > 0 ? selectedFileId : undefined}
							onChange={handleChangeFile}
							className="w-[360px] [&_.ant-select-selector]:!h-[36px] [&_.ant-select-selector]:!rounded-md [&_.ant-select-selector]:!border-primaryN30 [&_.ant-select-selection-item]:!text-xs [&_.ant-select-selection-item]:!leading-[34px]"
							options={files.map((file, index) => ({
								label: file?.file_name || `File ${index + 1}`,
								value: file.id,
							}))}
						/>
					</div>

					<div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] gap-6">
						<div className="flex min-h-0 flex-col rounded-2xl border border-primaryN30 bg-white">
							<div className="min-h-0 flex-1 overflow-y-auto p-3">
								{thumbnailData.length ? (
									<div className="flex h-full justify-center">
										<Thumbnail
											pdfRef={pdfRef}
											showThumbnail={showThumbnail}
											setShowThumbnail={setShowThumbnail}
											data={thumbnailData}
											page={page}
											setPage={setPage}
											showCategory={false}
											showShadow={false}
											size={
												selectedFileOperationType === FileOperationType.Quote
													? "larger"
													: "default"
											}
										/>
									</div>
								) : (
									<div className="flex h-full items-center justify-center rounded-xl border border-dashed border-primaryN30 bg-primaryN20">
										<Empty
											image={Empty.PRESENTED_IMAGE_SIMPLE}
											description={
												<span className="text-xs text-grey-normal">
													No thumbnails available
												</span>
											}
										/>
									</div>
								)}
							</div>
						</div>

						<div className="flex min-h-0 flex-col rounded-2xl border border-primaryN30 bg-white p-5">
							<div className="mb-4 flex items-center justify-between gap-4">
								<div className="flex items-center gap-2">
									<ZoomControls
										zoom={zoom}
										handleZoomChange={handleZoomChange}
									/>
									<SelectPagesControls
										page={page}
										totalPages={totalPages}
										handlePageChange={handlePageChange}
									/>
								</div>
								<div className="flex items-center gap-2">
									<BoxTypesSelect
										typeList={boxTypeList}
										onChangeType={handleChangeBoxType}
										onEditType={(item) => {
											setEditBoxTypeData(item);
											setShowNewLogicBoxModal(true);
										}}
										onDeleteType={handleDeleteBoxType}
									/>
								</div>
							</div>

							<div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-primaryN30 bg-[#FBFBFC]">
								<PdfWrapper
									ref={pdfRef}
									operationMode="edit"
									mode="edit"
									typeList={boxTypeList}
									pdfUrl={pdfUrl}
									pdfOperationType={selectedFileOperationType}
									project_id={projectId}
									project_file_id={selectedFileId}
									zoom={zoom}
									page={page}
									allEvidence={selectedFileEvidences as any}
									onChangePage={setPage}
									onTotalPages={setTotalPages}
									onAppendEvidence={handleAppendEvidence}
									onDeleteEvidence={handleDeleteEvidence}
									onUpdateEvidence={handleUpdateEvidence}
								/>
							</div>
						</div>
					</div>
				</div>
			</Modal>

			<NewLogicBoxModal
				isOpen={showNewLogicBoxModal}
				onClose={() => {
					setShowNewLogicBoxModal(false);
					setEditBoxTypeData(null);
				}}
				onSuccess={() => {
					fetchBoxTypeList();
					setEditBoxTypeData(null);
				}}
				editData={editBoxTypeData}
			/>
		</>
	);
}
