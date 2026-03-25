"use client";

import { FullscreenExitOutlined, FullscreenOutlined } from "@ant-design/icons";
import { Empty, Modal } from "antd";
import { useEffect, useMemo, useState } from "react";

import {
	formatCellValue,
	getEvidenceIds,
	getPreviewImageInfo,
	parseItemResult,
} from "../takeoffUtils";
import {
	EvidenceRecord,
	ProjectFileRecord,
	TakeoffItemRecord,
	TemplateField,
} from "../types";

interface ItemReferenceModalProps {
	open: boolean;
	item?: TakeoffItemRecord | null;
	dynamicFields: TemplateField[];
	files: ProjectFileRecord[];
	evidencesByFile: Record<number, EvidenceRecord[]>;
	onClose: () => void;
}

interface ReferenceCardItem {
	evidence: EvidenceRecord;
	file?: ProjectFileRecord;
	imageUrl: string;
}

export default function ItemReferenceModal({
	open,
	item,
	dynamicFields,
	files,
	evidencesByFile,
	onClose,
}: ItemReferenceModalProps) {
	const [expandedEvidenceId, setExpandedEvidenceId] = useState<number | null>(
		null,
	);
	const result = parseItemResult(item?.result || {});
	const labelValue = formatCellValue(result?.Label);
	const orderedFieldNames = [
		"Label",
		...dynamicFields
			.map((field) => field?.name)
			.filter((name): name is string => Boolean(name && name !== "Label")),
		...Object.keys(result || {}).filter(
			(name) =>
				name !== "Label" &&
				!dynamicFields.some((field) => field?.name === name),
		),
	];
	const orderedFields = orderedFieldNames
		.map((name) => ({
			name,
			value: formatCellValue(result?.[name]),
		}))
		.filter((field, index, fields) => {
			return (
				fields.findIndex((candidate) => candidate.name === field.name) === index
			);
		});

	const evidenceIds = getEvidenceIds(item);
	const referenceCards = evidenceIds
		.map((evidenceId) => {
			const matchedFile = files.find((file) => {
				return (evidencesByFile?.[file.id] || []).some(
					(evidence) => evidence?.id === evidenceId,
				);
			});
			const matchedEvidence = matchedFile
				? (evidencesByFile?.[matchedFile.id] || []).find(
						(evidence) => evidence?.id === evidenceId,
					)
				: undefined;

			if (!matchedEvidence) {
				return null;
			}

			const { previewImage } = getPreviewImageInfo(matchedFile, [
				matchedEvidence,
			]);

			return {
				evidence: matchedEvidence,
				file: matchedFile,
				imageUrl: matchedEvidence?.evidence_url || previewImage,
			};
		})
		.filter((card): card is NonNullable<typeof card> => Boolean(card));

	const expandedCard = useMemo(() => {
		if (!expandedEvidenceId) {
			return null;
		}

		return (
			referenceCards.find((card) => card.evidence.id === expandedEvidenceId) ||
			null
		);
	}, [expandedEvidenceId, referenceCards]);

	useEffect(() => {
		if (!open) {
			setExpandedEvidenceId(null);
			return;
		}

		if (
			expandedEvidenceId &&
			!referenceCards.some((card) => card.evidence.id === expandedEvidenceId)
		) {
			setExpandedEvidenceId(null);
		}
	}, [expandedEvidenceId, open, referenceCards]);

	return (
		<Modal
			open={open}
			onCancel={onClose}
			footer={null}
			title={null}
			width={"80%"}
			centered
			destroyOnClose
			closable={false}
		>
			<div className="flex h-[78vh] min-h-[640px] flex-col overflow-hidden p-2">
				<div className="mb-5">
					<div>
						<div className="text-base text-forumBlue-normal">
							Reference Panel
						</div>
						<div className="mt-1 text-xs text-grey-normal">
							Review the selected takeoff item details and linked evidence
							images.
						</div>
					</div>
				</div>

				<div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)] gap-6">
					<div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-primaryN30 bg-white">
						<div className="divide-y divide-primaryN30">
							{orderedFields.length ? (
								orderedFields.map((field) => {
									return (
										<div
											key={field.name}
											className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 px-4 py-3"
										>
											<div className="text-xs text-grey-normal">
												{field.name}
											</div>
											<div className="break-words text-xs text-grey-dark">
												{field.value}
											</div>
										</div>
									);
								})
							) : (
								<div className="px-4 py-10 text-center text-xs text-grey-normal">
									No item properties available.
								</div>
							)}
						</div>
					</div>

					<div
						className={`flex min-h-0 flex-col rounded-2xl border border-primaryN30 bg-white ${
							expandedCard ? "overflow-hidden p-0" : "p-5"
						}`}
					>
						{expandedCard ? (
							<div className="relative min-h-0 flex-1 bg-[#FBFBFC]">
								<button
									type="button"
									className="absolute right-4 top-4 z-10 flex h-8 items-center gap-2 rounded-md border border-primaryN30 bg-white px-3 text-xs text-grey-dark shadow-sm transition-colors hover:border-forumBlue-normal hover:text-forumBlue-normal"
									onClick={() => setExpandedEvidenceId(null)}
								>
									<FullscreenExitOutlined />
								</button>

								<div className="flex h-full w-full items-center justify-center overflow-auto">
									{expandedCard.imageUrl ? (
										<img
											src={expandedCard.imageUrl}
											alt={`${expandedCard.file?.file_name || "Evidence"} page ${
												expandedCard.evidence?.project_file_page_number || 1
											}`}
											className="max-h-full w-full rounded-xl border border-primaryN30 bg-white object-contain"
										/>
									) : (
										<Empty
											image={Empty.PRESENTED_IMAGE_SIMPLE}
											description={
												<span className="text-xs text-grey-normal">
													No evidence image
												</span>
											}
										/>
									)}
								</div>
							</div>
						) : (
							<>
								<div className="min-h-0 flex-1 overflow-y-auto pr-1">
									{referenceCards.length ? (
										<div className="grid grid-cols-2 gap-4">
											{referenceCards.map((card) => {
												return (
													<div
														key={card.evidence.id}
														className="overflow-hidden rounded-2xl border border-primaryN30 bg-[#FBFBFC] shadow-[0_6px_18px_rgba(23,43,77,0.04)]"
													>
														<div className="flex items-start justify-between gap-3 border-b border-primaryN30 px-4 py-3">
															<div className="min-w-0">
																<div className="truncate text-sm text-grey-dark">
																	{card.file?.file_name || "Unnamed file"}
																</div>
																<div className="mt-1 text-xs text-grey-normal">
																	Page{" "}
																	{card.evidence?.project_file_page_number || 1}
																</div>
															</div>
															<button
																type="button"
																className="flex h-8 w-8 items-center justify-center rounded-md border border-primaryN30 bg-white text-grey-dark transition-colors hover:border-forumBlue-normal hover:text-forumBlue-normal"
																onClick={() =>
																	setExpandedEvidenceId(card.evidence.id)
																}
															>
																<FullscreenOutlined />
															</button>
														</div>

														<div className="flex h-[280px] items-center justify-center bg-white p-4">
															{card.imageUrl ? (
																<img
																	src={card.imageUrl}
																	alt={`${card.file?.file_name || "Evidence"} page ${
																		card.evidence?.project_file_page_number || 1
																	}`}
																	className="max-h-full w-full rounded-xl border border-primaryN30 bg-white object-contain"
																/>
															) : (
																<Empty
																	image={Empty.PRESENTED_IMAGE_SIMPLE}
																	description={
																		<span className="text-xs text-grey-normal">
																			No evidence image
																		</span>
																	}
																/>
															)}
														</div>
													</div>
												);
											})}
										</div>
									) : (
										<div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-primaryN30 bg-primaryN20">
											<Empty
												image={Empty.PRESENTED_IMAGE_SIMPLE}
												description={
													<span className="text-xs text-grey-normal">
														No linked evidence found for this item.
													</span>
												}
											/>
										</div>
									)}
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		</Modal>
	);
}
