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

			if (
				!groupedData ||
				typeof groupedData !== "object" ||
				Array.isArray(groupedData)
			) {
				acc[sourceKey] = [];
				return acc;
			}

			acc[sourceKey] = Object.entries(groupedData as Record<string, any>).map(
				([labelSubLabel, listLabel]) => {
					const { label, subLabel } = splitLabelAndSubLabel(labelSubLabel);
					return {
						Label: label,
						"Sub Label": subLabel,
						List: Array.isArray(listLabel) ? listLabel : [],
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
		console.log("response:", response);
		const formattedData = formatTakeOffResultByFileData(response);
		return {
			data: formattedData,
			status: "success",
		};
	} catch (error: any) {
		console.error("Error getting take off result by file:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
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
			data: response || {},
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
			data: response || {},
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
		const dataBySourceType = results.reduce<Record<string, any>>(
			(acc, item) => {
				acc[item.source_type] = item.data;
				return acc;
			},
			{},
		);

		console.log("dataBySourceType", dataBySourceType);

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
			data: response || {},
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
			data: response || {},
			status: "success",
		};
	} catch (error: any) {
		console.error(
			"Error getting file source merge result detail by id:",
			error,
		);
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
			data: response || {},
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
			data: response || {},
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
			data: response || {},
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

/**
 * 根据 result_id 获取单文件合并结果明细
 * /drawing-ai/drawing_ai/get_single_file_merge_result_detail_by_id
 * 参数:
 * - result_id: 合并结果ID
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const getSingleFileMergeResultDetailById = async (result_id: number) => {
	try {
		const url = `/drawing-ai/drawing_ai/get_single_file_merge_result_detail_by_id?result_id=${result_id}`;
		const response = await http.get(url);
		return {
			data: response || {},
			status: "success",
		};
	} catch (error: any) {
		console.error(
			"Error getting single file merge result detail by id:",
			error,
		);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 根据 take_off_id 自动合并该算量下全部文件
 * /drawing-ai/drawing_ai/auto_merge_all_files_by_take_off/{take_off_id}
 * 参数:
 * - take_off_id: 算量任务ID
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const autoMergeAllFilesByTakeOff = async (take_off_id: number) => {
	try {
		const url = `/drawing-ai/drawing_ai/auto_merge_all_files_by_take_off/${take_off_id}`;
		const response = await http.post(url);
		return {
			data: response || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error auto merging all files by take off:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 按 take_off 获取全部分组结果
 * /drawing-ai/drawing_ai/get_all_grouped_by_take_off
 * 参数:
 * - take_off_id: 算量任务ID
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const getAllGroupedByTakeOff = async (take_off_id: number) => {
	try {
		const url = `/drawing-ai/drawing_ai/get_all_grouped_by_take_off?take_off_id=${take_off_id}`;
		const response = await http.get(url);
		return {
			data: response || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error getting all grouped by take off:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 按 take_off 进行手动合并
 * /drawing-ai/drawing_ai/manual_merge_by_take_off/{take_off_id}
 * 请求方式:
 * - POST
 * 参数:
 * - take_off_id: 算量任务ID
 * - merge_list: 手动合并数组对象，元素字段包含
 *   - result
 *   - single_file_merge_result_ids
 *   - take_off_result_item_ids
 *   - file_source_merge_result_ids
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const manualMergeByTakeOff = async (
	take_off_id: number,
	merge_list: Array<{
		result: any;
		single_file_merge_result_ids: number[];
		take_off_result_item_ids: number[];
		file_source_merge_result_ids: number[];
	}>,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/manual_merge_by_take_off/${take_off_id}`;
		const body = merge_list.map((item) => ({
			...item,
			single_file_merge_result_ids: item.single_file_merge_result_ids
				.map((id) => `[${id}]`)
				.join(","),
			take_off_result_item_ids: item.take_off_result_item_ids
				.map((id) => `[${id}]`)
				.join(","),
			file_source_merge_result_ids: item.file_source_merge_result_ids
				.map((id) => `[${id}]`)
				.join(","),
		}));
		const response = await http.post(url, body);
		return {
			data: response || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error manual merging by take off:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 根据 result_id 获取多文件合并结果明细
 * /drawing-ai/drawing_ai/get_multiple_files_merge_result_detail_by_id
 * 参数:
 * - result_id: 合并结果ID
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const getMultipleFilesMergeResultDetailById = async (
	result_id: number,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/get_multiple_files_merge_result_detail_by_id?result_id=${result_id}`;
		const response = await http.get(url);
		return {
			data: response || {},
			status: "success",
		};
	} catch (error: any) {
		console.error(
			"Error getting multiple files merge result detail by id:",
			error,
		);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 创建多文件合并结果
 * /drawing-ai/drawing_ai/create_multiple_files_merge_result
 * 请求方式:
 * - POST
 * 参数:
 * - take_off_id: 算量任务ID
 * - single_file_merge_result_ids: 单文件合并结果ID数组
 * - take_off_result_item_ids: 原始结果项ID数组
 * - file_source_merge_result_ids: 文件来源合并结果ID数组
 * - result: 合并结果
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const createMultipleFilesMergeResult = async (
	take_off_id: number,
	single_file_merge_result_ids: number[],
	take_off_result_item_ids: number[],
	file_source_merge_result_ids: number[],
	result: string,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/create_multiple_files_merge_result`;
		const body = {
			take_off_id,
			single_file_merge_result_ids: single_file_merge_result_ids
				.map((id) => `[${id}]`)
				.join(","),
			take_off_result_item_ids: take_off_result_item_ids
				.map((id) => `[${id}]`)
				.join(","),
			file_source_merge_result_ids: file_source_merge_result_ids
				.map((id) => `[${id}]`)
				.join(","),
			result,
		};
		const response = await http.post(url, body);
		return {
			data: response || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error creating multiple files merge result:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 根据 result_id 更新多文件合并结果
 * /drawing-ai/drawing_ai/update_multiple_files_merge_result_by_id/{result_id}
 * 请求方式:
 * - POST
 * 参数:
 * - result_id: 合并结果ID
 * - result: 更新后的结果对象
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const updateMultipleFilesMergeResultById = async (
	result_id: number,
	result: Record<string, any>,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/update_multiple_files_merge_result_by_id/${result_id}`;
		const response = await http.post(url, result);
		return {
			data: response || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error updating multiple files merge result by id:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

/**
 * 根据 result_id 删除多文件合并结果
 * /drawing-ai/drawing_ai/delete_multiple_files_merge_result_by_id
 * 请求方式:
 * - DELETE
 * 参数:
 * - result_id: 合并结果ID
 * 返回:
 * - data: 接口返回数据
 * - status: "error" | "success"
 */
export const deleteMultipleFilesMergeResultById = async (result_id: number) => {
	try {
		const url = `/drawing-ai/drawing_ai/delete_multiple_files_merge_result_by_id?result_id=${result_id}`;
		const response = await http.delete(url);
		return {
			data: response || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error deleting multiple files merge result by id:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};

export const rollbackMergeResultsByFile = async (
	take_off_id: number,
	file_id: number,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/rollback_merge_results_by_take_off_and_file?take_off_id=${take_off_id}&file_id=${file_id}`;
		const response = await http.get(url);
		return {
			data: response?.data || {},
			status: "success",
		};
	} catch (error: any) {
		console.error("Error resetting merge by take off:", error);
		return {
			data: error?.response?.data?.data || {},
			status: "error",
		};
	}
};
