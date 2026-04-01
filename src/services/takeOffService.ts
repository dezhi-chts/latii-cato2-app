import { http } from "@/lib/http";

export const getAllTakeoffList = async (filterParams?: {
	per_page?: number;
	page?: number;
}) => {
	try {
		const url = `/project/take_off/list?page=${filterParams?.page || 1}&per_page=${filterParams?.per_page || 10}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error getting take off:", error);
		return { data: null, status: "error" };
	}
};
export const getTakeOffById = async (takeOffId: string) => {
	try {
		const url = `/project/take_off/take_off_id?take_off_id=${takeOffId}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error getting take off:", error);
		return { data: null, status: "error" };
	}
};

export const getTakeOffsByProjectId = async (projectId: string) => {
	try {
		const url = `/project/take_off/project_id?project_id=${projectId}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error getting take offs:", error);
		return { data: null, status: "error" };
	}
};

export const getTakeOffsDetails = async (takeOffId: string) => {
	try {
		const url = `/project/take_off/${takeOffId}/details`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error getting take offs detail:", error);
		return { data: null, status: "error" };
	}
};

export const updateTakeOffName = async (name: string, takeOffId: number) => {
	try {
		const url = `/project/take_off/edit/take_off_id`;
		const body = {
			id: takeOffId,
			name: name,
		};
		const response = await http.put(url, body);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error updating take off name:", error);
		return { data: null, status: "error" };
	}
};

export const deleteTakeOffById = async (takeOffId: string) => {
	try {
		const url = `/project/take_off/delete/take_off_id?take_off_id=${takeOffId}`;
		const response = await http.delete(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error("Error deleting take off:", error);
		return { data: null, status: "error" };
	}
};

export const getTakeOffResultItemWithEvidenceUrlsById = async (
	result_item_id: number,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/get_take_off_result_item_with_evidence_urls_by_id?result_item_id=${result_item_id}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error(
			"Error rolling back merge results by take off and file:",
			error,
		);
		return { data: null, status: "error" };
	}
};

export const getFileSourceMergeResultDetailById = async (result_id: number) => {
	try {
		const url = `/drawing-ai/drawing_ai/get_file_source_merge_result_detail_by_id?result_id=${result_id}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error(
			"Error rolling back merge results by take off and file:",
			error,
		);
		return { data: null, status: "error" };
	}
};

export const getSignalFileSourceMergeResultDetailById = async (
	result_id: number,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/get_single_file_merge_result_detail_by_id?result_id=${result_id}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error(
			"Error rolling back merge results by take off and file:",
			error,
		);
		return { data: null, status: "error" };
	}
};

export const getMultipleFilesMergeResultDetailById = async (
	result_id: number,
) => {
	try {
		const url = `/drawing-ai/drawing_ai/get_multiple_files_merge_result_detail_by_id?result_id=${result_id}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error(
			"Error rolling back merge results by take off and file:",
			error,
		);
		return { data: null, status: "error" };
	}
};

export const getMergeStatusByTakeOffId = async (take_off_id: number) => {
	try {
		const url = `/drawing-ai/drawing_ai/get_merge_status_by_take_off_id?take_off_id=${take_off_id}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error) {
		console.error(
			"Error rolling back merge results by take off and file:",
			error,
		);
		return { data: null, status: "error" };
	}
};

