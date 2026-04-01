import { http } from "@/lib/http";

const splitLabelAndSubLabel = (labelSubLabel: string) => {
	const [label = "", ...subLabelParts] = labelSubLabel.split("_____");
	return {
		label,
		subLabel: subLabelParts.join("_____"),
	};
};

const formatTakeOffResultByFileData = (rawData: any) => {
	if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
		return {};
	}

	return Object.entries(rawData).reduce<Record<string, any>>(
		(acc, [sourceKey, sourceValue]) => {
			// 已经是目标结构时直接透传
			if (
				sourceValue &&
				typeof sourceValue === "object" &&
				!Array.isArray(sourceValue) &&
				"Label" in sourceValue &&
				"Sub Label" in sourceValue
			) {
				acc[sourceKey] = sourceValue;
				return acc;
			}

			const groupedData =
				sourceValue &&
				typeof sourceValue === "object" &&
				!Array.isArray(sourceValue) &&
				"label_sublabel_group_data" in sourceValue
					? (sourceValue as any).label_sublabel_group_data
					: sourceValue;

			if (!groupedData || typeof groupedData !== "object" || Array.isArray(groupedData)) {
				acc[sourceKey] = [];
				return acc;
			}

			acc[sourceKey] = Object.entries(groupedData as Record<string, any>).map(
				([labelSubLabel, listLabel]) => {
					const { label, subLabel } = splitLabelAndSubLabel(labelSubLabel);
					return {
						"Label": label,
						"Sub Label": subLabel,
						"List": Array.isArray(listLabel) ? listLabel : [],
					};
				},
			);
			return acc;
		},
		{},
	);
};

// =============================获取原始数据列表=================================

/**
 * 获取解析出来的原始数据列表，按文件获取，上送take_off_id和file_id
 * /drawing-ai/drawing_ai/take_off_result_by_file
 * 返回格式:
 * { 
 *      data: {
 *          "Schedule":{
 *              "Label":"",
 *              "Sub Label":"",
 *              "List":[]
 *          },
 *          "Elevation":{
 *              "Label":"",
 *              "Sub Label":"",
 *              "List":[]
 *          }
 *          "Floor Plan":{
 *              "Label":"",
 *              "Sub Label":"",
 *              "List":[]
 *          }
 *          "window_door_unit_list": {
 *              "Label":"",
 *              "Sub Label":"",
 *              "List":[]
 *          }
 *      }, 
 *      status: "error" | "success"
 * }
 */
export const getTakeOffResultByFile = async (
	take_off_id: number,
	file_id: number,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/take_off_result_by_file?take_off_id=${take_off_id}&file_id=${file_id}`;
		const response = await http.get(url);
		const formattedData = formatTakeOffResultByFileData(response?.data);
		return {
			data: formattedData,
			status: "success",
		};
	} catch (error: any) {
		console.error("Error getting take off result by file:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error"
		};
	}
};

// ===============================单文件源内合并===================================

/**
 * 按文件和来源类型触发自动合并
 * /drawing-ai/drawing_ai/auto_merge_by_file_suorce
 * 参数:
 * - take_off_id: 算量任务ID
 * - file_id: 文件ID
 * - source_type: 来源类型
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const autoMergeByFileSource = async (
	take_off_id: number,
	file_id: number,
	source_type: string,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/auto_merge_by_file_suorce?take_off_id=${take_off_id}&file_id=${file_id}&source_type=${source_type}`;
		const response = await http.get(url);
		return {
			data: response?.data || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error auto merging by file source:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 按文件和来源类型获取合并结果
 * /drawing-ai/drawing_ai/get_merge_result_by_file_suorce
 * 参数:
 * - take_off_id: 算量任务ID
 * - file_id: 文件ID
 * - source_type: 来源类型
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const getMergeResultByFileSource = async (
	take_off_id: number,
	file_id: number,
	source_type: string,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/get_merge_result_by_file_suorce?take_off_id=${take_off_id}&file_id=${file_id}&source_type=${source_type}`;
		const response = await http.get(url);
		return {
			data: response?.data || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error getting merge result by file source:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 批量并发获取多个来源类型的合并结果
 * 使用 Promise.all 并发请求，并将返回数据按 source_type 分组
 * 参数:
 * - take_off_id: 算量任务ID
 * - file_id: 文件ID
 * - source_type_list: 来源类型列表
 * 返回:
 * - data: { [source_type]: 对应接口返回数据 }
 * - status: 只有全部成功才为 "success"，否则为 "error"
 */
export const getMergeResultByFileSourceList = async (
	take_off_id: number,
	file_id: number,
	source_type_list: string[],
) => {
	try {
		const tasks = source_type_list.map(async (source_type) => {
			const result = await getMergeResultByFileSource(
				take_off_id,
				file_id,
				source_type,
			);
			return {
				source_type,
				...result,
			};
		});
		const results = await Promise.all(tasks);
		const allSuccess = results.every((item) => item.status === "success");
		const dataBySourceType = results.reduce<Record<string, any>>((acc, item) => {
			acc[item.source_type] = item.data;
			return acc;
		}, {});

		return {
			data: dataBySourceType,
			status: allSuccess ? "success" : "error",
		};
	} catch (error: any) {
		console.error("Error getting merge result by file source list:", error);
		return {
			data: {},
			status: "error",
		};
	}
};

/**
 * 批量并发触发多个来源类型的自动合并
 * 使用 Promise.all 并发请求
 * 参数:
 * - take_off_id: 算量任务ID
 * - file_id: 文件ID
 * - source_type_list: 来源类型列表
 * 返回:
 * - data: 每次请求的结果数组
 * - status: 只有全部成功才为 "success"，否则为 "error"
 */
export const autoMergeByFileSourceList = async (
	take_off_id: number,
	file_id: number,
	source_type_list: string[],
) => {
	try {
		const tasks = source_type_list.map((source_type) =>
			autoMergeByFileSource(take_off_id, file_id, source_type),
		);
		const results = await Promise.all(tasks);
		const allSuccess = results.every((item) => item.status === "success");

		return {
			data: results,
			status: allSuccess ? "success" : "error",
		};
	} catch (error: any) {
		console.error("Error auto merging by file source list:", error);
		return {
			data: error?.response?.data?.data || [],
			status: "error",
		};
	}
};

/**
 * 按文件和来源类型进行手动合并
 * /drawing-ai/drawing_ai/manual_merge_by_file_source/{take_off_id}/{file_id}/{source_type}
 * 请求方式:
 * - POST
 * 参数:
 * - take_off_id: 算量任务ID
 * - file_id: 文件ID
 * - source_type: 来源类型
 * - merge_list: 手动合并数组对象，元素字段包含 result、take_off_result_item_ids
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const manualMergeByFileSource = async (
	take_off_id: number,
	file_id: number,
	source_type: string,
	merge_list: Array<{
		result: any;
		take_off_result_item_ids: number[];
	}>,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/manual_merge_by_file_source/${take_off_id}/${file_id}/${source_type}`;
		const body = merge_list.map((item) => ({
			...item,
			take_off_result_item_ids: item.take_off_result_item_ids
				.map((id) => `[${id}]`)
				.join(","),
		}));
		const response = await http.post(url, body);
		return {
			data: response?.data || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error manual merging by file source:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 根据 result_id 获取文件来源合并结果明细
 * /drawing-ai/drawing_ai/get_file_source_merge_result_detail_by_id
 * 参数:
 * - result_id: 合并结果ID
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const getFileSourceMergeResultDetailById = async (result_id: number) => {
	try {
		const url = `/drawing-ai/drawing_ai/get_file_source_merge_result_detail_by_id?result_id=${result_id}`;
		const response = await http.get(url);
		return {
			data: response?.data || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error getting file source merge result detail by id:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};


// ========================单文件源之间合并===================================

/**
 * 按文件自动合并全部 source_type
 * /drawing-ai/drawing_ai/auto_merge_all_source_types_by_file
 * 参数:
 * - take_off_id: 算量任务ID
 * - file_id: 文件ID
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const autoMergeAllSourceTypesByFile = async (
	take_off_id: number,
	file_id: number,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/auto_merge_all_source_types_by_file?take_off_id=${take_off_id}&file_id=${file_id}`;
		const response = await http.get(url);
		return {
			data: response?.data || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error auto merging all source types by file:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 按文件获取全部分组结果
 * /drawing-ai/drawing_ai/get_all_grouped_by_file
 * 参数:
 * - take_off_id: 算量任务ID
 * - file_id: 文件ID
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const getAllGroupedByFile = async (
	take_off_id: number,
	file_id: number,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/get_all_grouped_by_file?take_off_id=${take_off_id}&file_id=${file_id}`;
		const response = await http.get(url);
		return {
			data: response?.data || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error getting all grouped by file:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 按文件进行手动合并
 * /drawing-ai/drawing_ai/manual_merge_by_file/{take_off_id}/{file_id}
 * 请求方式:
 * - POST
 * 参数:
 * - take_off_id: 算量任务ID
 * - file_id: 文件ID
 * - merge_list: 手动合并数组对象，元素字段包含
 *   - result
 *   - take_off_result_item_ids
 *   - file_source_merge_result_ids
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const manualMergeByFile = async (
	take_off_id: number,
	file_id: number,
	merge_list: Array<{
		result: any;
		take_off_result_item_ids: number[];
		file_source_merge_result_ids: number[];
	}>,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/manual_merge_by_file/${take_off_id}/${file_id}`;
		const body = merge_list.map((item) => ({
			...item,
			take_off_result_item_ids: item.take_off_result_item_ids
				.map((id) => `[${id}]`)
				.join(","),
			file_source_merge_result_ids: item.file_source_merge_result_ids
				.map((id) => `[${id}]`)
				.join(","),
		}));
		const response = await http.post(url, body);
		return {
			data: response?.data || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error manual merging by file:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

