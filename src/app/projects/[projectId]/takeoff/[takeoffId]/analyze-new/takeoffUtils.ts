import {
	EvidenceBoxBounds,
	EvidencePoint,
	EvidenceRecord,
	ProjectFileRecord,
	SummaryStats,
	TakeoffDetailsData,
	TakeoffItemRecord,
} from "./types";

const QUANTITY_KEYS = ["Quantity", "Qty", "quantity"];
const SYSTEM_KEYS = ["Category", "Product", "Type", "System"];

export const parseItemResult = (
	result: TakeoffItemRecord["result"],
): Record<string, unknown> => {
	if (!result) {
		return {};
	}

	if (typeof result === "string") {
		try {
			return JSON.parse(result);
		} catch (error) {
			console.error("Failed to parse takeoff item result:", error);
			return {};
		}
	}

	return result;
};

export const getResultValue = (
	item: TakeoffItemRecord,
	fieldName: string,
): unknown => {
	const result = parseItemResult(item?.result);

	if (fieldName in result) {
		return result[fieldName];
	}

	const nestedValue = fieldName.split(".").reduce<unknown>((acc, key) => {
		if (
			acc &&
			typeof acc === "object" &&
			key in (acc as Record<string, unknown>)
		) {
			return (acc as Record<string, unknown>)[key];
		}

		return undefined;
	}, result);

	return nestedValue;
};

export const formatCellValue = (value: unknown) => {
	if (value === null || value === undefined || value === "") {
		return "-";
	}

	if (Array.isArray(value)) {
		return value.join(", ");
	}

	if (typeof value === "object") {
		return JSON.stringify(value);
	}

	return String(value);
};

export const getEvidenceIds = (item?: TakeoffItemRecord | null) => {
	return item?.evidence_id_list || [];
};

export const getQuantityValue = (item: TakeoffItemRecord) => {
	const result = parseItemResult(item?.result);

	for (const key of QUANTITY_KEYS) {
		const value = result?.[key];
		const quantity = Number(value);
		if (!Number.isNaN(quantity)) {
			return quantity;
		}
	}

	return 0;
};

export const getSummaryStats = (
	takeoffData?: TakeoffDetailsData,
): SummaryStats => {
	const allItems = Object.values(takeoffData?.all_items || {}).flat();

	const defaultStats: SummaryStats = {
		items: takeoffData?.total_items || allItems.length,
		products: 0,
		systems: 0,
		boxedItems: 0,
	};

	return allItems.reduce((summary, item) => {
		const result = parseItemResult(item?.result);
		const typeValue = SYSTEM_KEYS.map((key) => result?.[key]).find((value) =>
			Boolean(value),
		);

		if (
			String(typeValue || "")
				.toLowerCase()
				.includes("system")
		) {
			summary.systems += 1;
		}

		summary.products += getQuantityValue(item);
		summary.boxedItems += getEvidenceIds(item).length;
		return summary;
	}, defaultStats);
};

export const getFallbackDynamicFields = (items: TakeoffItemRecord[]) => {
	const firstItem = items?.[0];
	const result = parseItemResult(firstItem?.result);

	return Object.keys(result || {})
		.filter((key) => key.toLowerCase() !== "label")
		.map((name) => ({ name }));
};

export const filterItemsByKeyword = (
	items: TakeoffItemRecord[],
	keyword: string,
) => {
	const normalizedKeyword = keyword.trim().toLowerCase();

	if (!normalizedKeyword) {
		return items;
	}

	return items.filter((item) => {
		const result = parseItemResult(item?.result);

		return Object.values(result).some((value) =>
			formatCellValue(value).toLowerCase().includes(normalizedKeyword),
		);
	});
};

const parsePolygon = (polygon?: string | EvidencePoint[]) => {
	if (!polygon) {
		return [] as EvidencePoint[];
	}

	if (Array.isArray(polygon)) {
		return polygon;
	}

	try {
		const parsedPolygon = JSON.parse(polygon);
		return Array.isArray(parsedPolygon) ? parsedPolygon : [];
	} catch (error) {
		console.error("Failed to parse evidence polygon:", error);
		return [];
	}
};

const parseViewBox = (viewBox?: string | number[]) => {
	if (!viewBox) {
		return null as number[] | null;
	}

	if (Array.isArray(viewBox)) {
		return viewBox.map((value) => Number(value));
	}

	try {
		const parsedViewBox = JSON.parse(viewBox);
		if (!Array.isArray(parsedViewBox)) {
			return null;
		}

		return parsedViewBox.map((value) => Number(value));
	} catch (error) {
		console.error("Failed to parse evidence viewBox:", error);
		return null;
	}
};

const applyViewportTransform = (
	point: EvidencePoint,
	viewBox: number[],
	scale: number,
	rotation: number,
) => {
	const normalizedRotation = ((rotation % 360) + 360) % 360;
	const centerX = (viewBox[2] + viewBox[0]) / 2;
	const centerY = (viewBox[3] + viewBox[1]) / 2;

	let rotateA = 1;
	let rotateB = 0;
	let rotateC = 0;
	let rotateD = -1;

	switch (normalizedRotation) {
		case 90:
			rotateA = 0;
			rotateB = 1;
			rotateC = 1;
			rotateD = 0;
			break;
		case 180:
			rotateA = -1;
			rotateB = 0;
			rotateC = 0;
			rotateD = 1;
			break;
		case 270:
			rotateA = 0;
			rotateB = -1;
			rotateC = -1;
			rotateD = 0;
			break;
		default:
			break;
	}

	const offsetCanvasX =
		rotateA === 0
			? Math.abs(centerY - viewBox[1]) * scale
			: Math.abs(centerX - viewBox[0]) * scale;
	const offsetCanvasY =
		rotateA === 0
			? Math.abs(centerX - viewBox[0]) * scale
			: Math.abs(centerY - viewBox[1]) * scale;

	const transformA = rotateA * scale;
	const transformB = rotateB * scale;
	const transformC = rotateC * scale;
	const transformD = rotateD * scale;
	const transformE =
		offsetCanvasX - transformA * centerX - transformC * centerY;
	const transformF =
		offsetCanvasY - transformB * centerX - transformD * centerY;

	return {
		x: transformA * point.x + transformC * point.y + transformE,
		y: transformB * point.x + transformD * point.y + transformF,
	};
};

const getViewportScale = (
	viewBox: number[],
	pageWidth: number,
	pageHeight: number,
	rotation: number,
) => {
	const normalizedRotation = ((rotation % 360) + 360) % 360;
	const baseWidth = Math.abs(Number(viewBox[2] || 0) - Number(viewBox[0] || 0));
	const baseHeight = Math.abs(
		Number(viewBox[3] || 0) - Number(viewBox[1] || 0),
	);

	if (!baseWidth || !baseHeight) {
		return 1;
	}

	if (normalizedRotation === 90 || normalizedRotation === 270) {
		return pageWidth / baseHeight || pageHeight / baseWidth || 1;
	}

	return pageWidth / baseWidth || pageHeight / baseHeight || 1;
};

export const getEvidenceBounds = (
	evidence?: EvidenceRecord,
): EvidenceBoxBounds | null => {
	const polygon = parsePolygon(evidence?.polygon);
	const pageWidth = Number(evidence?.page_width_pdf || 0);
	const pageHeight = Number(evidence?.page_height_pdf || 0);
	const viewBox = parseViewBox(evidence?.view_box);
	const rotationAngle = Number(evidence?.rotation_angle || 0);
	const viewportScale =
		viewBox && viewBox.length >= 4
			? getViewportScale(viewBox, pageWidth, pageHeight, rotationAngle)
			: 1;

	if (!polygon.length || !pageWidth || !pageHeight) {
		return null;
	}

	const viewportPoints = polygon.map((point) => {
		const normalizedPoint = {
			x: Number(point?.x || 0),
			y: Number(point?.y || 0),
		};

		if (!viewBox || viewBox.length < 4) {
			return normalizedPoint;
		}

		const adjustedPoint = !evidence?.is_manual
			? {
					x: normalizedPoint.x + Number(viewBox[0] || 0),
					y: normalizedPoint.y + Number(viewBox[1] || 0),
				}
			: normalizedPoint;

		return applyViewportTransform(
			adjustedPoint,
			viewBox,
			viewportScale,
			rotationAngle,
		);
	});

	const xValues = viewportPoints.map((point) => point?.x || 0);
	const yValues = viewportPoints.map((point) => point?.y || 0);
	const left = Math.min(...xValues);
	const top = Math.min(...yValues);
	const right = Math.max(...xValues);
	const bottom = Math.max(...yValues);

	return {
		id: evidence?.id || 0,
		left: Math.max(0, (left / pageWidth) * 100),
		top: Math.max(0, (top / pageHeight) * 100),
		width: Math.max(0, ((right - left) / pageWidth) * 100),
		height: Math.max(0, ((bottom - top) / pageHeight) * 100),
	};
};

export const getPreviewImageInfo = (
	file?: ProjectFileRecord,
	evidences: EvidenceRecord[] = [],
) => {
	const imagePages = file?.parse_detail?.image_page_infos || [];
	const previewPage = evidences?.[0]?.project_file_page_number || 1;
	const previewIndex = Math.max(previewPage - 1, 0);
	const previewImage =
		imagePages?.[previewIndex]?.s3_url || imagePages?.[0]?.s3_url || "";

	return {
		previewImage,
		previewPage,
	};
};
