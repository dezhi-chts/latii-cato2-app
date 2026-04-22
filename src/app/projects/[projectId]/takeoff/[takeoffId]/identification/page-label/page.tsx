"use client";
import { useParams, useRouter } from "next/navigation";
import {
	Button,
	ConfigProvider,
	Divider,
	Modal,
	Popover,
	Select,
	Spin,
} from "antd";

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	forwardRef,
	useImperativeHandle,
} from "react";
import Image from "next/image";
import debounce from "lodash/debounce";

import { getEvidenceByFileId } from "@/services/evidenceService";
import {
	getPdfAnalyseSummary,
	getBoxTypes,
	deleteBoxType,
} from "@/services/drawingIndexService";

import LoadingScreen from "@/components/loading-screen";
import PdfWrapper from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/PdfWrapper";
import Thumbnail from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/Thumbnail";
import BoxTypesSelect from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/BoxTypesSelect";
import {
	ZoomControls,
	SelectPagesControls,
	ClearAllControls,
	AddRectBoxControls,
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/Pdf-Controls";
import DrawingTagsView from "./components/DrawingTagsView";
import BuildingBackground, {
	BuildLoadingStep,
} from "../components/BuildingBackground";
import NewLogicBoxModal from "./components/NewLogicBoxModal";
import Header from "../components/Header";

import {
	EvidenceType,
	FileOperationType,
	FileStatus,
	GroupType,
	PdfWrapperRefMethods,
	QuotePageTypes,
	PageType,
	EvidenceResult,
	ArchDrawingAllPageTags,
	ArchDrawingPageTypes,
	ArchDrawingLabelTypes,
	allPageTypes,
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";
import { useUser } from "@/context/UserContext";
import { useTakeoff } from "@/context/TakeoffContext";
import { ButtonText } from "../page";
import { AnalyzeItemBySourceTypeSSE } from "@/services/DrawingAiService";
import { getTemplates } from "@/services/templateService";
import {
	enrichElevationFloorPlanByEvidenceIds,
	generateFileKeysByProjectFileIds,
	getGroupedEvidencesByTakeOffAndFile,
} from "@/services/takeOffService";
import { notify } from "@/utils/notify";

const { confirm } = Modal;

const validPageType = [
	// Arch Drawing 文件类型有效的page type
	PageType.FloorPlan,
	PageType.Elevation,
	PageType.Schedule,
	PageType.KeyNotes,
	PageType.Mix,
];

interface PromptTemplateOption {
	id: number;
	name: string;
}

export interface IdentLabelRef {
	pdfRef: React.RefObject<PdfWrapperRefMethods | null>;
}

const IdentLabel = forwardRef<IdentLabelRef, {}>((any, ref) => {
	const router = useRouter();
	const projectId = useParams().projectId;
	const takeOffId = useParams().takeoffId;
	const pdfRef = useRef<PdfWrapperRefMethods | null>(null);

	useImperativeHandle(ref, () => ({
		pdfRef,
		getUnsavedCrops,
	}));

	const [pdfUrl, setPdfUrl] = useState<string>();
	const [zoom, setZoom] = useState(1);
	const [page, setPage] = useState(1);
	const [totalPage, setTotalPage] = useState(1);

	const [fileEvidence, setFileEvidence] = useState<any>([]);
	const [thumbnailList, setThumbnailList] = useState<any>([]);
	const [showThumbnail, setShowThumbnail] = useState<boolean>(true);
	const [fullLoading, setFullLoading] = useState<boolean>(false);
	const [buildLoading, setBuildLoading] = useState<boolean>(false);
	const [analyzeProgress, setAnalyzeProgress] = useState<number>(0);
	const [analyzeMessage, setAnalyzeMessage] = useState<string>("");
	const eventSourceRef = useRef<{ close: () => void } | null>(null);
	const [showScheduleTemplateModal, setShowScheduleTemplateModal] =
		useState<boolean>(false);
	const [promptTemplates, setPromptTemplates] = useState<PromptTemplateOption[]>(
		[],
	);
	const [selectedTemplateId, setSelectedTemplateId] = useState<number>();
	const [scheduleTemplateLoading, setScheduleTemplateLoading] =
		useState<boolean>(false);

	const [pageTypeList, setPageTypeList] = useState<any>(ArchDrawingAllPageTags);
	const [labelTypeList, setLabelTypeList] = useState<any>([]);
	const [currentType, setCurrentType] = useState<string>(
		ArchDrawingAllPageTags[0].type,
	);

	const [showNewLogicBoxModal, setShowNewLogicBoxModal] =
		useState<boolean>(false);
	const [editBoxTypeData, setEditBoxTypeData] = useState<any>(null);

	const evidenceIsLoaded = useRef<boolean>(false);
	const unSavedCropsCount = useRef<number>(0);
	const { company_id } = useUser();
	const [boxTypeList, setBoxTypeList] = useState<any>([]);
	const {
		fileList,
		setFileList,
		selectedFileId,
		setSelectedFileId,
		clearStorage,
	} = useTakeoff();

	useEffect(() => {
		getBoxTypeList();
	}, [company_id]);

	// Cleanup SSE connection on unmount
	useEffect(() => {
		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
		};
	}, []);

	const getBoxTypeList = async () => {
		if (!company_id) return;
		let res: any = await getBoxTypes(company_id.toString());
		if (res.status === "success") {
			let boxTypes = res?.data ?? [];
			// 为每个 box type 添加 company_id
			boxTypes = boxTypes.map((item: any) => ({
				...item,
				company_id: company_id.toString(),
			}));
			setBoxTypeList(boxTypes);
		} else {
		}
	};
	const handleNewLogicBoxSuccess = () => {
		getBoxTypeList();
		setEditBoxTypeData(null);
	};

	const handleEditBoxType = (item: any) => {
		setEditBoxTypeData(item);
		setShowNewLogicBoxModal(true);
	};

	const handleDeleteBoxType = async (item: any) => {
		if (!item?.company_id || !item?.id) return;

		const result = await deleteBoxType(item.company_id.toString(), item.id);

		if (result.status === "success") {
			notify.success({
				title: "Success",
				description: "Logic Box deleted successfully",
			});
			getBoxTypeList();
		} else {
			const errorMsg = result?.data?.detail || "Failed to delete Logic Box";
			notify.error({
				title: "Error",
				description: errorMsg,
			});
		}
	};

	const handleCloseModal = () => {
		setShowNewLogicBoxModal(false);
		setEditBoxTypeData(null);
	};

	// 使用summary初始化pageTypeList
	const initPageTypeWidthSummary = useCallback(
		async (summaryData: any) => {
			if (!summaryData) return;
			const page_classification = summaryData.page_classification ?? {};

			setPageTypeList((prev: any) => {
				let newPageTypeList = prev.map((item: any) => {
					if (item.type === PageType.All) {
						return {
							...item,
							count: summaryData.total_pages,
						};
					} else if (item.type === PageType.ActivePages) {
						// 把page_classification中所有不是invalidPageType的type的count加起来
						let totalCount: any = [];
						for (let key in page_classification) {
							if (validPageType.includes(key)) {
								totalCount.push(page_classification[key] ?? 0);
							}
						}
						let count = totalCount.reduce((a: any, b: any) => a + b, 0);
						return {
							...item,
							count: count,
						};
					} else if (item.type === PageType.NotUsed) {
						return {
							...item,
							count: page_classification?.['Unknown'] ?? 0,
						};
					} else {
						return {
							...item,
							count: page_classification[item.type] ?? 0,
						};
					}
				});
				return newPageTypeList;
			});
		},
		[pageTypeList],
	);

	// 使用summary初始化thumbnailList
	const initThumbnailWidthSummary = useCallback(
		async (summaryData: any) => {
			if (!summaryData) return;

			setThumbnailList((prev: any) => {
				return prev.map((item: any) => {
					let itemPageNum: number = 0;
					if (typeof item.file_name === "string") {
						let pageArr = item.file_name?.split(".")[0];
						itemPageNum = parseInt(pageArr) + 1;
					}
					const summaryPages = summaryData?.pages ?? [];
					// 从 summaryPages 中查找对应的类型
					let itemType =
						summaryPages.find((item: any) => item.page_number === itemPageNum)
							?.page_type ?? "";
					return {
						...item,
						type: itemType,
					};
				});
			});
		},
		[thumbnailList],
	);

	// 获取当前文件的evidence，并按照type进行分类
	const getFileEvidences = useCallback(async () => {
		if (selectedFileId === -1) return;
		const file = fileList.find((file: any) => file.id === selectedFileId);
		let filterType = "QuoteLabel";
		if (file && file.operation_type === FileOperationType.ArchitectureDrawing) {
			filterType = "ArchDrawingLabel";
		}

		evidenceIsLoaded.current = false;
		const response = await getEvidenceByFileId(
			projectId as string,
			selectedFileId,
			{ filter_type: filterType },
		);
		if (response.status === "success") {
			evidenceIsLoaded.current = true;
			const evidenceList = response?.data ?? [];
			setFileEvidence(
				evidenceList.filter(
					(item: any) =>
						item.type !== GroupType.DrawingIndex &&
						item.type !== GroupType.TitleInfo,
				),
			);
		} else {
			evidenceIsLoaded.current = false;
			notify.error({
				title: "Error",
				description: "Failed to get file evidence",
			});
		}
	}, [selectedFileId]);

	const getPdfSummary = async () => {
		setFullLoading(true);
		let res: any = await getPdfAnalyseSummary(selectedFileId as any);
		setFullLoading(false);
		if (res.status === "success") {
			//  setSummaryData(res?.data?.data ?? null);
			initPageTypeWidthSummary(res?.data?.data ?? null);
			initThumbnailWidthSummary(res?.data?.data ?? null);
		} else {
			notify.error({
				title: "Error",
				description: "Failed to get pdf analyse pages",
			});
		}
	};

	useEffect(() => {
		if (selectedFileId === -1) return;

		// 没有crop需要保存
		pdfRef?.current?.resetAllInfo();

		// 重置 file evidence
		setFileEvidence([]);

		//reset page
		setPage(1);
		setTotalPage(1);
		if (zoom !== 1.0) {
			setZoom(1.0);
		}

		setThumbnailList((prev: any) => []);

		//设置新的url
		let file = fileList.find((file: any) => file.id === selectedFileId);
		if (file) {
			let newPdfUrl = file?.parse_detail?.uploaded_file_url;
			setPdfUrl(newPdfUrl);
			let list = file?.parse_detail?.image_page_infos ?? [];

			// 设置新的缩略图数据
			setThumbnailList(() => [...list]);

			//获取pdf analyse summary
			getPdfSummary();

			//获取file evidence
			getFileEvidences();
		}
	}, [selectedFileId]);

	const filterThumbnailList = useMemo(() => {
		const file = fileList.find((file: any) => file.id === selectedFileId);
		if (!file) return [];

		if (file && file.operation_type === FileOperationType.Quote)
			return [...thumbnailList];

		if (currentType === PageType.All) return [...thumbnailList];
		else if (currentType === PageType.ActivePages) {
			return [...thumbnailList].filter(
				(item: any) => item.type && validPageType.includes(item.type),
			);
		}
		else if (currentType === PageType.NotUsed) {
			return [...thumbnailList].filter(
				(item: any) => item.type === PageType.NotUsed || item.type === PageType.Unknown,
			);
		} else {
			return [...thumbnailList].filter((item: any) => item.type === currentType);
		}
	}, [selectedFileId, fileList, currentType, thumbnailList]);

	const getItemPage = (item: any, index: number) => {
		if (typeof item.file_name === "string") {
			let pageArr = item.file_name?.split(".")[0];
			return parseInt(pageArr) + 1;
		}
		return index + 1;
	};

	const updateThumbnailPageType = (page: number, type: string) => {
		setThumbnailList((prev: any) => {
			return prev.map((item: any, index: number) => {
				let itemPageNum = getItemPage(item, index);
				if (itemPageNum === page) {
					return {
						...item,
						type: type,
					};
				}
				return item;
			});
		});
	};

	const handleUpdatePageType = useCallback(
		(pageTypes: any) => {
			const page_types = pageTypes || [];
			let findCurrentPageType = page_types.find(
				(item: any) => item.page_number === page,
			);
			if (!findCurrentPageType) {
				return;
			}
			// 如果是Quote文件，则直接更新当前页的type，不需要其他操作
			if (fileOperationType === FileOperationType.Quote) {
				updateThumbnailPageType(page, findCurrentPageType.page_type || "");
				return;
			}

			let newType = findCurrentPageType.page_type || "";
			if (!newType) return;
			newType = validPageType.includes(newType) ? newType : PageType.NotUsed;

			// 获取当前页旧的type
			let oldType =
				thumbnailList.find((item: any, index: number) => {
					let itemPageNum = getItemPage(item, index);
					return itemPageNum === page;
				})?.type || "";

			console.log("######## newType", newType, "oldType", oldType);

			if (oldType === newType) return;

			// 更新当前页的type
			updateThumbnailPageType(page, newType);

			// 如果是quote文件类型，则不执行后面更新tags的操作
			if (fileOperationType === FileOperationType.Quote) return;

			// 更新tags中的数据
			setPageTypeList((prev: any) => {
				let list = [...prev];
				let oldTypeItem = list.find((item: any) => {
					if (oldType === PageType.Unknown) {
						return item.type === PageType.NotUsed
					} else {
						return item.type === oldType
					}

				});
				let newTypeItem = list.find((item: any) => {
					if (newType === PageType.Unknown) {
						return item.type === PageType.NotUsed
					} else {
						return item.type === newType
					}
				});
				let activePagesItem = list.find(
					(item: any) => item.type === PageType.ActivePages,
				);

				// 页面旧类型集合数量减1
				oldTypeItem.count =
					(oldTypeItem?.count || 0) - 1 < 0 ? 0 : (oldTypeItem?.count || 0) - 1;
				// 页面新类型集合数量加1
				newTypeItem.count = (newTypeItem?.count || 0) + 1;

				let activePages = list.filter((item: any) =>
					validPageType.includes(item.type),
				);
				// 计算所有有效类型的计数之和
				activePagesItem.count = activePages.reduce(
					(total: number, item: any) => total + (item.count || 0),
					0,
				);

				return [...list];
			});
		},
		[page, thumbnailList],
	);

	// 使用 lodash 的防抖函数来处理缩放
	const debouncedZoomChange = useCallback(
		debounce(
			(value: number) => {
				if (value === zoom) return;
				if (value < 0.4 || value > 4) return;
				// 四舍五入保留2位小数，避免浮点数精度累积
				const roundedValue = Math.round(value * 100) / 100;
				setZoom(roundedValue);
			},
			500,
			{
				leading: true, // 立即执行第一次调用
				trailing: true, // 也执行 trailing 调用
			},
		),
		[zoom],
	);

	const handleZoomChange = (value: number) => {
		debouncedZoomChange(value);
	};

	const handlePageChange = async (value: number) => {
		// 需要判断当前pdf页面上是否有裁剪区域未提交
		let unsaved = await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
		if (!pdfRef.current || unsaved) {
			if (value < 1) return;
			if (value > totalPage) return;
			if (value === page) return;
			setPage(value);
			return;
		}
	};
	const handleRotate = () => {
		pdfRef?.current?.rotatePDF?.();
	};

	const handleClearAllCrop = () => {
		if (!pdfRef.current) return;

		// 调用删除接口
		pdfRef?.current?.handleBatchDelete();
	};

	const handleAppendEvidence = (evidenceResult: EvidenceResult) => {
		// 如果evidence 数据还未加载完成，则不允许手动追加，需要先加载完成，否则会导致数据不一致
		const { evidences, page_types = [] } = evidenceResult;
		const evidenceList = evidences || [];
		if (!evidenceIsLoaded.current) {
			getFileEvidences();
			return;
		}
		if (!evidenceList?.length) return;
		setFileEvidence([...fileEvidence, ...evidenceList]);

		handleUpdatePageType(page_types);
	};

	const handleDeleteEvidence = (evidenceResult: EvidenceResult) => {
		// 如果evidence 数据还未加载完成，则不允许手动删除，需要先加载完成，否则会导致数据不一致
		const { deleteIds = [], page_types = [] } = evidenceResult;
		if (!evidenceIsLoaded.current) {
			getFileEvidences();
			return;
		}
		if (!deleteIds?.length) return;
		setFileEvidence(
			fileEvidence.filter((item: EvidenceType) => !deleteIds.includes(item.id)),
		);
		handleUpdatePageType(page_types);
	};

	const handleUpdateEvidence = (evidenceResult: EvidenceResult) => {
		// 如果evidence 数据还未加载完成，则不允许手动更新，需要先加载完成，否则会导致数据不一致
		const { evidences, page_types = [] } = evidenceResult;
		const evidenceList = evidences || [];
		if (!evidenceIsLoaded.current) {
			getFileEvidences();
			return;
		}
		if (!evidenceList?.length) return;
		setFileEvidence(
			fileEvidence.map((item: EvidenceType) => {
				// 找到需要更新的item
				let updateItem = evidenceList.find(
					(evid: EvidenceType) => evid.id === item.id,
				);
				if (updateItem) {
					return { ...updateItem };
				}
				return item;
			}),
		);
		handleUpdatePageType(page_types);
	};

	const handleAddRectBox = (type: string) => {
		if (pdfRef.current && pdfRef.current?.addingRect) {
			pdfRef.current?.addingRect({ type, isSaveEvidence: false });
		}
	};

	const getUnsavedCrops = async () => {
		return (await pdfRef?.current?.checkAndHandleUnsavedCrops?.()) || true;
	};

	const handleCropsCount = (count: number) => {
		unSavedCropsCount.current = count;
	};

	const handleChangeBoxType = (type: string) => {
		if (type === "customize") {
			setShowNewLogicBoxModal(true);
			return;
		}
		// 选择 type 后直接添加框
		handleAddRectBox(type);
	};

	const handleAnaylize = async () => {
		setBuildLoading(true);
		setAnalyzeMessage("Connecting...");

		// Close existing SSE connection if any
		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		const sseConnection = AnalyzeItemBySourceTypeSSE(takeOffId as string, 1, {
			onConnected: () => {
				console.log("[SSE] Connected to analyze service");
			},
			onHeartbeat: (data) => {
				console.log("[SSE] Heartbeat received:", data);
			},
			onCompleted: (result: any) => {
				console.log("[SSE] Analysis completed:", result);
				eventSourceRef.current = null;
				router.push(
					`/projects/${projectId}/takeoff/${takeOffId}/manual-merge-new`,
				);
			},
			onError: (error: string) => {
				console.error("[SSE] Analysis error:", error);
				setBuildLoading(false);
				setAnalyzeMessage("");
				eventSourceRef.current = null;
				notify.error({
					title: "Error",
					description: error || "Failed to analyze the file",
				});
			},
		});

		eventSourceRef.current = sseConnection;
	};

	const fetchPromptTemplates = useCallback(async () => {
		setScheduleTemplateLoading(true);
		const response = await getTemplates();
		setScheduleTemplateLoading(false);
		if (response.status !== "success") {
			notify.error({
				title: "Error",
				description: "Failed to load prompt templates.",
			});
			return false;
		}
		const list = response.data?.items || [];
		setPromptTemplates(list);
		if (list.length > 0) {
			const defaultTemplate = list.find((template: any) => template?.is_default);
			setSelectedTemplateId(defaultTemplate?.id || list[0].id);
		}
		return true;
	}, []);

	const handleScheduleAnalyze = useCallback(async () => {
		if (!selectedTemplateId) {
			notify.error({
				title: "Error",
				description: "Please select a template before analysis.",
			});
			return;
		}

		setShowScheduleTemplateModal(false);
		setBuildLoading(true);

		if (eventSourceRef.current) {
			eventSourceRef.current.close();
			eventSourceRef.current = null;
		}

		const sseConnection = AnalyzeItemBySourceTypeSSE(
			takeOffId as string,
			selectedTemplateId,
			{
				onConnected: () => {
					console.log("[SSE] Connected to analyze service");
				},
				onHeartbeat: (data) => {
					console.log("[SSE] Heartbeat received:", data);
				},
				onCompleted: () => {
					eventSourceRef.current = null;
					router.push(
						`/projects/${projectId}/takeoff/${takeOffId}/merge-before/schedule`,
					);
				},
				onError: (error: string) => {
					console.error("[SSE] Analysis error:", error);
					setBuildLoading(false);
					setAnalyzeMessage("");
					eventSourceRef.current = null;
					notify.error({
						title: "Error",
						description: error || "Failed to analyze the file",
					});
				},
			},
		);

		eventSourceRef.current = sseConnection;
	}, [projectId, router, selectedTemplateId, takeOffId]);


	const handleChangeFile = async (fileId: number) => {
		if (selectedFileId === fileId) return;
		// 切换文件, 判断当前是否有未保存的crop，如果有则显示提示框并且保存
		const unsaved = await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
		if (!pdfRef.current || unsaved) {
			// 判断fileId的文件是否是已完成状态，已完成的文件才可以点击，未完成的文件不允许点击
			const file = fileList.find((file: any) => file.id === fileId);
			if (file?.status === FileStatus.Completed) {
				handleFileStatus(selectedFileId, fileId);
			}
		}
	};

	const handleFileKeys = async () => {
		setFullLoading(true);
		let fileIds = fileList.map((file: any) => file.id);
		let res = await generateFileKeysByProjectFileIds(fileIds.join(","));
		if (res.status === "success") {
			// 获取文件中所有的evidence
			handleEvidenceItems();
		} else {
			notify.error({
				title: "Error",
				description: res?.data?.detail || "Failed to generate file keys",
			});
		}
	};

	const handleEvidenceItems = async () => {
		// 获取所有文件的evidence列表中类型为Floor Plan和Elevation的id集合
		let floorPlanIds = fileEvidence.filter(
			(item: EvidenceType) =>
				item.type === PageType.FloorPlan ||
				item.type === PageType.Elevation,
		).map((item: EvidenceType) => item.id);
		let res = await enrichElevationFloorPlanByEvidenceIds(floorPlanIds.join(","));
		if (res.status === "success") {
			// 跳转到合并前页面
			router.push(
				`/projects/${projectId}/takeoff/${takeOffId}/merge-before/floor-plan`,
			);
		} else {
			notify.error({
				title: "Error",
				description: res?.data?.detail || "Failed to get evidence items",
			});
		}
		setFullLoading(false);
	};

	const handleCreateTakeoff = useCallback(async () => {
		if (!selectedFileId) return;
		setFullLoading(true);
		const response = await getGroupedEvidencesByTakeOffAndFile(
			takeOffId as string,
			selectedFileId,
		);
		setFullLoading(false);
		if (response.status !== "success") {
			notify.error({
				title: "Error",
				description:
					response?.data?.detail ||
					"Failed to get grouped evidences by takeoff and file",
			});
			return;
		}
		const groupedData = response?.data || {};
		const elevationFloorPlan = Array.isArray(groupedData?.elevation_floor_plan)
			? groupedData.elevation_floor_plan
			: [];
		const schedule = Array.isArray(groupedData?.schedule)
			? groupedData.schedule
			: [];

		if (elevationFloorPlan.length > 0) {
			handleFileKeys();
			return;
		}
		if (schedule.length === 0) {
			notify.error({
				title: "Error",
				description: "No valid evidence detected.",
			});
			return;
		}

		const loaded = await fetchPromptTemplates();
		if (!loaded) return;
		setShowScheduleTemplateModal(true);
	}, [fetchPromptTemplates, handleFileKeys, selectedFileId, takeOffId]);

	const handleFileStatus = (oldFileId: number, newFileId: number) => {
		setSelectedFileId(newFileId);
		setFileList((prev) => {
			return prev.map((file: any) => {
				if (file.id === oldFileId) {
					// 切换文件时，在label页面的时候，将旧文件的状态设置为已完成
					return { ...file, status: FileStatus.Completed };
				} else if (file.id === newFileId) {
					return { ...file, status: FileStatus.Processing };
				}
				return file;
			});
		});

		let fileInfo = fileList.find((file: any) => file.id === newFileId);
		if (fileInfo?.operation_type === FileOperationType.ArchitectureDrawing) {
			// 如果新文件是Arch Drawing文件，则跳转到summary页面
			router.push(
				`/projects/${projectId}/takeoff/${takeOffId}/identification/index-summary`,
			);
		} else if (fileInfo?.operation_type === FileOperationType.Quote) {
			// 如果新文件是Quote文件，则跳转到label页面
			router.push(
				`/projects/${projectId}/takeoff/${takeOffId}/identification/page-label`,
			);
		}
	};

	const handleNext = async (buttonInfo: { text: string }) => {
		if (buttonInfo.text === ButtonText.NextFile) {
			let filterFiles = fileList.filter(
				(file: any) => file.id !== selectedFileId,
			);
			let nextFile = filterFiles.find(
				(file: any) => file.status !== FileStatus.Completed,
			);
			if (nextFile) {
				// 切换下一个文件时，先判断是否有未保存的crop
				const unsaved = await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
				if (!pdfRef.current || unsaved) {
					// 没有未保存的crop，切换文件
					handleFileStatus(selectedFileId, nextFile.id);
				}
			}
		} else if (
			buttonInfo.text === ButtonText.FileMerge ||
			buttonInfo.text === ButtonText.CreateTakeoff
		) {
			// 切换到合并页面的时候，判断是否有未保存的crop
			const unsaved = await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
			if (!pdfRef.current || unsaved) {
				if (buttonInfo.text === ButtonText.CreateTakeoff) {
					await handleCreateTakeoff();
					return;
				}
				handleFileKeys();
			}
		}
	};

	const fileOperationType = useMemo(() => {
		if (!fileList.length) return "";
		let file = fileList.find((file: any) => file.id === selectedFileId);
		return file?.operation_type || "";
	}, [fileList, selectedFileId]);

	// 处理返回按钮的点击事件
	const handleBack = useCallback(() => {
		const handleBackToPreviousFile = () => {
			let findIndex = fileList.findIndex(
				(file: any) => file.id === selectedFileId,
			);
			if (findIndex > 0) {
				let prevFile = fileList[findIndex - 1];

				// 更新文件状态为processing
				setFileList((prev: any[]) => {
					return prev.map((file: any) => {
						if (file.id === prevFile.id) {
							// 下一个文件状态更改为操作中
							return { ...file, status: FileStatus.Processing };
						} else if (file.id === selectedFileId) {
							// 上一个文件状态更改为未完成
							return { ...file, status: FileStatus.Uploaded };
						}
						return file;
					});
				});

				if (prevFile.status === FileStatus.Completed) {
					setSelectedFileId(prevFile.id);
					// 跳转到label页面
					router.push(
						`/projects/${projectId}/takeoff/${takeOffId}/identification/page-label`,
					);
				} else if (
					prevFile.operation_type === FileOperationType.ArchitectureDrawing
				) {
					setSelectedFileId(prevFile.id);
					// 跳转到summary页面
					router.push(
						`/projects/${projectId}/takeoff/${takeOffId}/identification/index-summary`,
					);
				}
			} else {
				// 如果前面没有文件可以返回了，则直接返回home
				// 清除sessionStorage
				clearStorage();
				router.replace("/home");
			}
		};

		if (fileOperationType === FileOperationType.ArchitectureDrawing) {
			// 如果当前文件是Arch Drawing文件，则跳转到summary页面
			router.push(
				`/projects/${projectId}/takeoff/${takeOffId}/identification/index-summary`,
			);
		} else if (fileOperationType === FileOperationType.Quote) {
			// 如果当前文件是Quote文件
			handleBackToPreviousFile();
		}
	}, [selectedFileId, fileList, fileOperationType, router]);

	// 右上角按钮的相关信息
	const nextButtonInfo = useMemo(() => {
		const hasMultipleFiles = fileList.length > 1;
		const allFilesCompleted = fileList.every(
			(file: any) => file.status === FileStatus.Completed,
		);
		const otherFilesComplete = fileList
			.filter((file: any) => file.id !== selectedFileId)
			.every((file: any) => file.status === FileStatus.Completed);

		// Second 步骤：根据文件数量区分逻辑
		if (hasMultipleFiles) {
			// 关键逻辑：如果其他文件都已完成（无论当前文件状态如何），则进入合并步骤
			if (otherFilesComplete) {
				return {
					text: ButtonText.FileMerge, // 进入 File Merge
					disabled: false,
				};
			} else {
				// 还有其他未完成的文件
				return {
					text: ButtonText.NextFile,
					disabled: false,
				};
			}
		} else {
			// 单个文件完成
			return {
				text: ButtonText.CreateTakeoff,
				disabled: false,
			};
		}
	}, [fileList, selectedFileId]);

	const thumbnailBoxTypeList = useMemo(() => {
		if (fileOperationType === FileOperationType.ArchitectureDrawing) {
			return ArchDrawingPageTypes;
		}
		if (fileOperationType === FileOperationType.Quote) {
			if (boxTypeList?.length > 0) {
				// 转换下文件类型
				let list = boxTypeList.map((item: any) => ({
					...item,
					type: item.name || "",
					icon:
						typeof item?.name === "string" && item?.name?.length > 0
							? item.name[0].toUpperCase()
							: "",
				}));
				list.push(allPageTypes[PageType.Mix]);
				return list;
			}
		}
		return [];
	}, [fileOperationType, boxTypeList]);

	return (
		<div className={`w-full h-[100vh] flex flex-col relative overflow-hidden`}>
			<div className="h-[110px]">
				<Header
					onChangeFile={(fileId: number) => handleChangeFile(fileId)}
					nextButtonInfo={nextButtonInfo}
					handleNext={handleNext}
					onHandleBack={handleBack}
				></Header>
			</div>
			<div className={`flex-1 pr-14 flex flex-row overflow-hidden`}>
				<div className="pl-4 mb-2 flex flex-col">
					<div className="mt-4 mb-4 pl-10 flex flex-row gap-4">
						<div className="mt-1 w-[18px] h-[18px] rounded-full bg-[#C4D6F0] text-xs text-forumBlue-normal-active flex items-center justify-center">
							{fileOperationType === FileOperationType.ArchitectureDrawing
								? "B"
								: "A"}
						</div>
						<div className="">
							<div className="flex flex-row gap-1">
								<p className="mr-2 text-base text-forumBlue-normal">
									Page Labeling
								</p>
								<Popover
									placement="rightBottom"
									title={
										<div className="text-xxs font-medium">
											About Page Labeling
										</div>
									}
									content={
										<div className="w-[300px] text-xxs text-grey-light-strong">
											Review and analyze the sections identified by CATO. You
											can verify existing results or add new labels manually.
											Ensuring every section is correctly labeled guarantees the
											most accurate analysis from CATO.
										</div>
									}
									trigger="hover"
									className="cursor-pointer"
								>
									<Image
										src="/assets/icons/info-forum-blue.svg"
										alt="info circle icon"
										width={14}
										height={14}
									></Image>
								</Popover>
							</div>
							<div className="mt-1 text-xs text-grey-normal">
								Review labeled zones in your file.
							</div>
						</div>
					</div>
					<div className="flex-1 w-[280px] border-r border-primaryN30 overflow-hidden">
						<Thumbnail
							pdfRef={pdfRef}
							showThumbnail={showThumbnail}
							setShowThumbnail={setShowThumbnail}
							data={filterThumbnailList}
							page={page}
							setPage={setPage}
							showCategory={true}
							showShadow={false}
							size={
								fileOperationType === FileOperationType.Quote
									? "larger"
									: "default"
							}
							categoryList={thumbnailBoxTypeList}
						></Thumbnail>
					</div>
				</div>
				<div className={`flex-1 flex flex-col pl-14 gap-6 overflow-hidden`}>
					{fileOperationType === FileOperationType.ArchitectureDrawing && (
						<DrawingTagsView
							pageTypeTags={pageTypeList}
							currentType={currentType}
							setCurrentType={setCurrentType}
						></DrawingTagsView>
					)}
					<div className="flex-1 flex flex-col overflow-hidden">
						<div className="h-[60px] flex flex-row justify-between items-center">
							{fileOperationType === FileOperationType.Quote ? (
								<div className="w-full flex flex-row justify-between">
									<div className="flex flex-row gap-2">
										<ZoomControls
											zoom={zoom}
											handleZoomChange={handleZoomChange}
										/>
										<SelectPagesControls
											page={page}
											totalPages={totalPage}
											handlePageChange={handlePageChange}
										/>
										<ClearAllControls handleClearAll={handleClearAllCrop} />
									</div>
									<div className="flex flex-row gap-2">
										<BoxTypesSelect
											typeList={boxTypeList}
											onChangeType={(type) => handleChangeBoxType(type)}
											onEditType={handleEditBoxType}
											onDeleteType={handleDeleteBoxType}
										/>
									</div>
								</div>
							) : (
								<div className="w-full flex flex-row justify-between">
									<div className="flex flex-row gap-2">
										<AddRectBoxControls
											theme="default"
											handleAddRectBox={() => {
												handleAddRectBox(GroupType.FloorPlan);
											}}
										/>
										<ClearAllControls handleClearAll={handleClearAllCrop} />
									</div>
									<div className="flex flex-row gap-2">
										<SelectPagesControls
											page={page}
											totalPages={totalPage}
											handlePageChange={handlePageChange}
										/>
										<ZoomControls
											zoom={zoom}
											handleZoomChange={handleZoomChange}
										/>
									</div>
								</div>
							)}
						</div>
						<div className="flex-1 flex overflow-hidden border border-primaryN30 rounded-md">
							<PdfWrapper
								ref={pdfRef}
								operationMode={"edit"}
								mode="edit"
								typeList={boxTypeList}
								pdfUrl={pdfUrl as string}
								pdfOperationType={fileOperationType}
								project_id={projectId as any}
								project_file_id={selectedFileId}
								zoom={zoom}
								page={page}
								allEvidence={fileEvidence}
								showAddBtnOnBox={true}
								onChangePage={setPage}
								onTotalPages={setTotalPage}
								onAppendEvidence={handleAppendEvidence}
								onDeleteEvidence={handleDeleteEvidence}
								onUpdateEvidence={handleUpdateEvidence}
								onCropSectionsCount={handleCropsCount}
								onChangeZoom={debouncedZoomChange}
							></PdfWrapper>
						</div>
					</div>
				</div>
			</div>
			{fullLoading && <LoadingScreen isLoading={fullLoading} />}
			{buildLoading && (
				<BuildingBackground step={"page-merge"} durationSeconds={20 * 60} />
			)}
			<Modal
				title="Select Template"
				open={showScheduleTemplateModal}
				onCancel={() => setShowScheduleTemplateModal(false)}
				onOk={handleScheduleAnalyze}
				okText="Confirm"
				cancelText="Cancel"
				destroyOnClose
			>
				<div className="mt-3">
					<Select
						className="w-full"
						placeholder="Please select a template"
						loading={scheduleTemplateLoading}
						value={selectedTemplateId}
						onChange={(value: number | string) => {
							setSelectedTemplateId(Number(value));
						}}
						options={promptTemplates.map((template) => ({
							label: template.name,
							value: template.id,
						}))}
					/>
				</div>
			</Modal>
			<NewLogicBoxModal
				isOpen={showNewLogicBoxModal}
				onClose={handleCloseModal}
				onSuccess={handleNewLogicBoxSuccess}
				editData={editBoxTypeData}
			/>
		</div>
	);
});

IdentLabel.displayName = "IdentLabel";

export default IdentLabel;
