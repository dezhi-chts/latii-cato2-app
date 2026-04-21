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

/**
 * Format nested object into readable string
 * e.g., { Type: "A", Size: "10" } => "Type: A, Size: 10"
 */
export const formatNestedObject = (obj: Record<string, unknown>): string => {
	const parts: string[] = [];
	for (const [key, val] of Object.entries(obj)) {
		if (val === null || val === undefined || val === "") {
			continue;
		}
		if (typeof val === "object" && val !== null) {
			const nestedStr = formatNestedObject(val as Record<string, unknown>);
			if (nestedStr && nestedStr !== "-") {
				parts.push(`${key}: ${nestedStr}`);
			}
		} else {
			parts.push(`${key}: ${String(val)}`);
		}
	}
	return parts.length > 0 ? parts.join(", ") : "-";
};

/**
 * Format value for display, handling arrays and nested objects
 */
export const formatDisplayValue = (value: unknown): string => {
	if (value === null || value === undefined || value === "") {
		return "-";
	}

	if (Array.isArray(value)) {
		return value
			.map((item) => {
				if (typeof item === "object" && item !== null) {
					return formatNestedObject(item as Record<string, unknown>);
				}
				return String(item);
			})
			.join(" / ");
	}

	if (typeof value === "object") {
		return formatNestedObject(value as Record<string, unknown>);
	}

	return String(value);
};

/**
 * Get value from nested object using dot notation path
 * e.g., getNestedValue(obj, "Glass.Type") => obj.Glass.Type
 */
export const getNestedValue = (
	obj: Record<string, unknown>,
	path: string,
): unknown => {
	const parts = path.split(".");
	let current: unknown = obj;

	for (const part of parts) {
		if (current === null || current === undefined) {
			return undefined;
		}
		if (typeof current !== "object") {
			return undefined;
		}
		current = (current as Record<string, unknown>)[part];
	}

	return current;
};

/**
 * Set value by field name, supporting dot notation path.
 * e.g., setResultValueByField(result, "Glass.Layer", "layer_1")
 * => { ..., Glass: { ..., Layer: "layer_1" } }
 */
export const setResultValueByField = (
	result: Record<string, unknown>,
	fieldName: string,
	value: unknown,
): Record<string, unknown> => {
	const nextResult: Record<string, unknown> = { ...(result || {}) };
	const pathParts = fieldName
		.split(".")
		.map((part) => part.trim())
		.filter(Boolean);

	if (pathParts.length <= 1) {
		nextResult[fieldName] = value;
		return nextResult;
	}

	// Prefer nested structure for dot notation fields.
	delete nextResult[fieldName];

	let currentLevel = nextResult;
	for (let index = 0; index < pathParts.length - 1; index += 1) {
		const key = pathParts[index];
		const existingNode = currentLevel[key];
		const nextNode =
			existingNode && typeof existingNode === "object" && !Array.isArray(existingNode)
				? { ...(existingNode as Record<string, unknown>) }
				: {};
		currentLevel[key] = nextNode;
		currentLevel = nextNode;
	}

	currentLevel[pathParts[pathParts.length - 1]] = value;
	return nextResult;
};

/**
 * Normalize field name to standard format
 */
export const normalizeFieldName = (fieldName: string) => {
	const lowered = fieldName.trim().toLowerCase();

	if (lowered === "label") {
		return "Label";
	}

	if (
		lowered === "sub-label" ||
		lowered === "sublabel" ||
		lowered === "sub_label" ||
		lowered === "sub label"
	) {
		return "Sub Label";
	}

	return fieldName;
};

/**
 * Get display value by field name, supporting:
 * 1. Direct field access
 * 2. Dot notation for nested fields (e.g., "Glass.Type")
 * 3. Searching in nested objects
 * 4. Alternative field name formats
 */
export const getDisplayValueByField = (
	result: Record<string, unknown>,
	fieldName: string,
): string => {
	// Handle Sub Label variations
	if (fieldName === "Sub Label") {
		return formatDisplayValue(
			result["Sub Label"] ??
				result["Sub-Label"] ??
				result["Sublabel"] ??
				result["sub_label"],
		);
	}

	// 1. Direct field access (exact match)
	if (result[fieldName] !== undefined) {
		return formatDisplayValue(result[fieldName]);
	}

	// 2. Check if fieldName contains dot notation (nested field path)
	if (fieldName.includes(".")) {
		const value = getNestedValue(result, fieldName);
		if (value !== undefined) {
			return formatDisplayValue(value);
		}
	}

	// 3. Try to find the field in nested objects
	for (const [key, val] of Object.entries(result)) {
		if (typeof val === "object" && val !== null && !Array.isArray(val)) {
			const nestedResult = val as Record<string, unknown>;
			if (nestedResult[fieldName] !== undefined) {
				return formatDisplayValue(nestedResult[fieldName]);
			}
			// Recursively search deeper nested objects
			for (const [, nestedVal] of Object.entries(nestedResult)) {
				if (
					typeof nestedVal === "object" &&
					nestedVal !== null &&
					!Array.isArray(nestedVal)
				) {
					const deepNestedResult = nestedVal as Record<string, unknown>;
					if (deepNestedResult[fieldName] !== undefined) {
						return formatDisplayValue(deepNestedResult[fieldName]);
					}
				}
			}
		}
	}

	// 4. Try alternative field name formats for dot notation
	if (fieldName.includes(".")) {
		const parts = fieldName.split(".");
		for (let i = parts.length - 1; i >= 0; i--) {
			const partialPath = parts.slice(i).join(".");
			const value = getNestedValue(result, partialPath);
			if (value !== undefined) {
				return formatDisplayValue(value);
			}
			if (i === parts.length - 1 && result[parts[i]] !== undefined) {
				return formatDisplayValue(result[parts[i]]);
			}
		}
	}

	return "-";
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

const getPdfjsViewportDimensions = (
	viewBox: number[] | null,
	pageWidth: number,
	pageHeight: number,
	rotation: number,
) => {
	const normalizedRotation = ((rotation % 360) + 360) % 360;
	const baseWidth = viewBox
		? Math.abs(Number(viewBox[2] || 0) - Number(viewBox[0] || 0))
		: pageWidth;
	const baseHeight = viewBox
		? Math.abs(Number(viewBox[3] || 0) - Number(viewBox[1] || 0))
		: pageHeight;

	if (!baseWidth || !baseHeight) {
		return { width: pageWidth, height: pageHeight };
	}

	if (normalizedRotation === 90 || normalizedRotation === 270) {
		return { width: baseHeight, height: baseWidth };
	}

	return { width: baseWidth, height: baseHeight };
};

const pdfjsToImageCoords = (
	x: number,
	y: number,
	pageWidth: number,
	pageHeight: number,
	rotation: number,
) => {
	const normalizedRotation = ((rotation % 360) + 360) % 360;
	switch (normalizedRotation) {
		case 0:
			return { x: x, y: pageHeight - y };
		case 90:
			return { x: y, y: x };
		case 180:
			return { x: pageWidth - x, y: y };
		case 270:
			return { x: pageWidth - y, y: pageHeight - x };
		default:
			return { x, y };
	}
};

export const getEvidenceBounds = (
	evidence?: EvidenceRecord,
): EvidenceBoxBounds | null => {
	const polygon = parsePolygon(evidence?.polygon);
	const pageWidth = Number(evidence?.page_width_pdf || 0);
	const pageHeight = Number(evidence?.page_height_pdf || 0);
	const viewBox = parseViewBox(evidence?.view_box);
	const rotationAngle = Number(evidence?.rotation_angle || 0);
	const viewport = getPdfjsViewportDimensions(
		viewBox,
		pageWidth,
		pageHeight,
		rotationAngle,
	);

	if (!polygon.length || !pageWidth || !pageHeight) {
		return null;
	}

	const imagePoints = polygon.map((point) => {
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

		return pdfjsToImageCoords(
			adjustedPoint.x,
			adjustedPoint.y,
			viewport.width,
			viewport.height,
			rotationAngle,
		);
	});

	const xValues = imagePoints.map((point) => point?.x || 0);
	const yValues = imagePoints.map((point) => point?.y || 0);
	const left = Math.min(...xValues);
	const top = Math.min(...yValues);
	const right = Math.max(...xValues);
	const bottom = Math.max(...yValues);

	return {
		id: evidence?.id || 0,
		left: Math.max(0, left),
		top: Math.max(0, top),
		width: Math.max(0, right - left),
		height: Math.max(0, bottom - top),
		source_width: viewport.width,
		source_height: viewport.height,
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
