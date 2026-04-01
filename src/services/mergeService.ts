import { http } from "@/lib/http";

/**
 * 获取解析出来的原始数据列表，按文件获取，上送take_off_id和file_id
 * /drawing-ai/drawing_ai/take_off_result_by_file
 * 返回格式:
 * { 
 *      data: {
 *          "Schedule":{
 *              "Label":"",
 *              "Sub Label":"",
 *              "List Label":[]
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
		return {
			data: response?.data || {},
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


