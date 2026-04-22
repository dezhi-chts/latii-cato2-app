"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Spin, Modal } from "antd";
import { useParams, useRouter } from "next/navigation";

import {
	getEvidenceBySubTextEvidenceIds,
	getEvidencesElevationFloorPlanWithUrlByProjectFileId,
	getEvidencesWindowTableQuoteWithUrlByProjectFileId,
} from "@/services/takeOffService";
import {
	getTakeOffById,
	getEvidenceUrlsByEvidenceIds,
} from "@/services/takeOffService";
import { getTemplateById } from "@/services/templateService";
import {
	ProjectFileRecord,
	ProjectFileParseDetail,
	ImagePageInfo,
} from "../analyze-new/types";
import {
	EvidenceType,
	FileOperationType,
	GroupType,
	PageType,
} from "../types/evidence";
import {
	getDisplayValueByField,
	normalizeFieldName,
	parseItemResult as parseItemResultUtil,
} from "../analyze-new/takeoffUtils";


import LoadingScreen from "@/components/loading-screen";


interface ExtendedProjectFile extends ProjectFileRecord {
	operation_type?: string;
}

enum ViewStep {
	FloorPlan = "FloorPlan",
	Schedule = "Schedule",
}

export default function MergeBeforePage() {
	const router = useRouter();
	const { projectId, takeoffId } = useParams();

	const pdfWrapperRef = useRef<any>(null);

	const [fullLoading, setFullLoading] = useState(false);
	const [files, setFiles] = useState<ExtendedProjectFile[]>([]);
	const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
	const [thumbnailData, setThumbnailData] = useState<any[]>([]);
	const [itemBoxList, setItemBoxList] = useState<EvidenceType[]>([]);
	const [scheduleList, setScheduleList] = useState<any[]>([]);
	const [columnNames, setColumnNames] = useState<string[]>([]);

	const [step, setStep] = useState<ViewStep>(ViewStep.FloorPlan);

	const selectedFile = useMemo(() => {
		return files.find((f) => f.id === selectedFileId) || null;
	}, [files, selectedFileId]);

	const handleSelectFile = (fileId: number) => {
		if (fileId !== selectedFileId) {
			setSelectedFileId(fileId);
		}
	};

	const handleNext = () => {
		setStep(ViewStep.Schedule);
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
				>
					Next
				</Button>
			</header>
			{fullLoading && <LoadingScreen isLoading={fullLoading} />}
		</div>
	);
}
