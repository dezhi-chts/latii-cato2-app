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

export const getTakeOffEvidenceUrlsByIds = async (result_item_ids: string) => {
  try {
    const url = `/drawing-ai/drawing_ai/get_evidence_urls_by_take_off_result_item_ids?take_off_result_item_ids=${result_item_ids}`;
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

export const downloadTakeOffResult = async (take_off_id: string) => {
  try {
    const url = `/project/take_off_result/download?take_off_id=${take_off_id}`;
    const response = await http.post(url);
    return { data: response, status: "success" };
  } catch (error: any) {
    console.error("Error downloading take off result:", error);
    return { data: error?.response?.data, status: "error" };
  }
};

export const resetTakeOff = async (take_off_id: string, file_ids: string) => {
  try {
    const url = `/drawing-ai/drawing_ai/reset_take_off_and_hard_delete_by_take_off_and_files?take_off_id=${take_off_id}&file_ids=${file_ids}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error(
      "Error resetting take off and hard deleting by take off and files:",
      error,
    );
    return { data: null, status: "error" };
  }
};

export const updateTakeOffResultItem = async (result_id: string, data: any) => {
  try {
    const url = `/drawing-ai/drawing_ai/update_multiple_files_merge_result_by_id?result_id=${result_id}`;
    const response = await http.post(url, data);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error updating take off result item:", error);
    return { data: null, status: "error" };
  }
};

export const addTakeOffResultItem = async (data: any) => {
  try {
    const url = `/drawing-ai/drawing_ai/create_multiple_files_merge_result`;
    const response = await http.post(url, data);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error adding take off result item:", error);
    return { data: null, status: "error" };
  }
};

export const deleteTakeOffResultItem = async (result_id: string) => {
  try {
    const url = `/drawing-ai/drawing_ai/delete_multiple_files_merge_result_by_id?result_id=${result_id}`;
    const response = await http.delete(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error deleting take off result item:", error);
    return { data: null, status: "error" };
  }
};

export const getTakeOffSummaryStats = async (take_off_id: any) => {
  try {
    const url = `/project/take_off_result/stats?take_off_id=${take_off_id}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error copying take off result item:", error);
    return { data: null, status: "error" };
  }
};

export const getEvidenceByProjectFileAndPage = async (
  project_file_id: number,
  project_file_page_number: number,
) => {
  try {
    const url = `/drawing-ai/drawing_ai/get_evidence_by_project_file_and_page?project_file_id=${project_file_id}&project_file_page_number=${project_file_page_number}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting evidence by project file and page:", error);
    return { data: null, status: "error" };
  }
};

export const analyzeNewEvidencesByProjectFile = async (
  take_off_id: string,
  project_file_id: string,
  evidenceList: object[],
) => {
  try {
    const url = `/drawing-ai/drawing_ai/analyze_new_evidences_by_project_file?take_off_id=${take_off_id}&project_file_id=${project_file_id}`;
    const response = await http.post(url, evidenceList);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error analyze new evidences by project file:", error);
    return { data: null, status: "error" };
  }
};

/**
 * 根据file_id生成所有立面图，平面图，schedule，key note框对应的s3_key
 * @param project_file_ids
 * @returns
 */
export const generateFileKeysByProjectFileIds = async (
  project_file_ids: string,
) => {
  try {
    const url = `/drawing-ai/drawing_ai/generate_file_keys_by_project_file_ids?project_file_ids=${project_file_ids}`;
    const response = await http.post(url);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    console.error("Error generating file keys by project file ids:", error);
    return { data: error?.response?.data, status: "error" };
  }
};

/**
 * 根据evidence_ids获取立面图，平面图里的小item存到evidences表
 * @param evidence_idsevidence_ids
 * @returns
 */
export const enrichElevationFloorPlanByEvidenceIds = async (
  evidence_ids: string,
) => {
  try {
    const url = `/drawing-ai/drawing_ai/enrich_elevation_floor_plan_by_evidence_ids?evidence_ids=${evidence_ids}`;
    const response = await http.post(url);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    console.error(
      "Error enriching elevation floor plan by evidence ids:",
      error,
    );
    return { data: error?.response?.data, status: "error" };
  }
};

/**
 * 获取立面图，平面图evidence对应小item
 * @param evidence_ids
 * @returns
 */
export const getEvidenceBySubTextEvidenceIds = async (evidence_ids: string) => {
  try {
    const url = `/drawing-ai/drawing_ai/get_evidence_by_sub_text_evidence_ids?evidence_ids=${evidence_ids}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    console.error("Error getting evidence by sub text evidence ids:", error);
    return { data: error?.response?.data, status: "error" };
  }
};

export const getEvidenceUrlsByEvidenceIds = async (evidence_ids: string) => {
  try {
    const url = `/drawing-ai/drawing_ai/get_evidence_urls_by_evidence_ids?evidence_ids=${evidence_ids}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    console.error("Error getting evidence urls by evidence ids:", error);
    return { data: error?.response?.data, status: "error" };
  }
};

/**
 * 获取项目文件下的所有立面图，平面图evidenced大框
 * @param project_file_id
 * @returns
 */
export const getEvidencesElevationFloorPlanWithUrlByProjectFileId = async (
  project_file_id: string,
) => {
  try {
    const url = `/drawing-ai/drawing_ai/get_evidences_elevation_floor_plan_with_url_by_project_file_id?project_file_id=${project_file_id}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    console.error(
      "Error getting evidences elevation floor plan with url by project file id:",
      error,
    );
    return { data: error?.response?.data, status: "error" };
  }
};

/**
 * 获取项目文件下的所有schedule类型的evidenced大框
 * @param project_file_id
 * @returns
 */
export const getEvidencesWindowTableQuoteWithUrlByProjectFileId = async (
  project_file_id: string,
) => {
  try {
    const url = `/drawing-ai/drawing_ai/get_evidences_window_table_quote_with_url_by_project_file_id?project_file_id=${project_file_id}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    console.error(
      "Error getting evidences window table quote with url by project file id:",
      error,
    );
    return { data: error?.response?.data, status: "error" };
  }
};

/**
 * 获取evidence_ids对应的take off result items
 * @param evidence_ids
 * @returns
 */
export const getTakeOffResultItemsByEvidenceIds = async (
  evidence_id: string,
) => {
  try {
    const url = `/drawing-ai/drawing_ai/get_take_off_result_items_by_evidence_ids?evidence_id=${evidence_id}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    console.error("Error getting take off result items by evidence ids:", error);
    return { data: error?.response?.data, status: "error" };
  }
}
/**
 * 更新take off result item result
 * @param take_off_result_item_id
 * @returns
 */
export const updateTakeOffResultItemResultById = async (
  take_off_result_item_id: string,
  data: any,
) => {
  try {
    const url = `/drawing-ai/drawing_ai/update_take_off_result_item_result_by_id?take_off_result_item_id=${take_off_result_item_id}`;
    const response = await http.post(url, data);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    console.error("Error updating take off result item result by id:", error);
    return { data: error?.response?.data, status: "error" };
  }
}

/**
 * 删除take off result item
 * @param take_off_result_item_id
 * @returns
 */
export const deleteTakeOffResultItemById = async (
  take_off_result_item_id: string,
) => {
  try {
    const url = `/drawing-ai/drawing_ai/delete_take_off_result_item_by_id?take_off_result_item_id=${take_off_result_item_id}`;
    const response = await http.delete(url);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    console.error("Error deleting take off result item by id:", error);
    return { data: error?.response?.data, status: "error" };
  }
}

/**
 * 合并take off result items
 * @param take_off_id 
 * @param file_id 
 * @returns 
 */
export const reconcileTakeOffResultItemsByTakeOffAndFile = async (
  take_off_id: string | number, 
  file_id: string | number
) => {
  try{
    const url = `/drawing-ai/drawing_ai/reconcile_take_off_result_items_by_take_off_and_file?take_off_id=${take_off_id}&file_id=${file_id}`;
    const response = await http.post(url);
    return { data: response as any, status: "success" };
  }catch(error: any){
    console.error("Error reconciling take off result items by take off and file:", error);
    return { data: error?.response?.data, status: "error" };
  }
}

/**
 * 获取take off result items的合并label
 * @param take_off_id 
 * @param file_id 
 * @returns 
 */
export const getGroupedLabelsByFileAndTakeOff = async (take_off_id: string, file_id: string) => {
  try{
    const url = `/drawing-ai/drawing_ai/get_grouped_labels_by_file_and_take_off?take_off_id=${take_off_id}&file_id=${file_id}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  }catch(error: any){
    console.error("Error getting grouped labels by file and take off:", error);
    return { data: error?.response?.data, status: "error" };
  }
}

/**
 * 获取take off result items的合并label对应的文件源合并结果
 * @param label 
 * @returns 
 */
export const getFileSourceMergeResultsByLabel = async (
  take_off_id: string,
  file_id: string,
  label: string) => {
  try{
    const url = `/drawing-ai/drawing_ai/get_file_source_merge_results_by_label?take_off_id=${take_off_id}&file_id=${file_id}&label=${label}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  }catch(error: any){
    console.error("Error getting file source merge results by label:", error);
    return { data: error?.response?.data, status: "error" };
  }
}

/**
 * 检查文件源合并结果并创建单文件结果
 * @param data 
 * @returns 
 */
export const checkFileSourceMergeResultsAndCreateSingleFileResults = async (
  take_off_id: string,
  file_id: string,
  ids: string,
  data: any) => {
  try{
    const url = `/drawing-ai/drawing_ai/check_file_source_merge_results_and_create_single_file_results?take_off_id=${take_off_id}&file_id=${file_id}&ids=${ids}`;
    const response = await http.post(url, data);
    return { data: response as any, status: "success" };
  }catch(error: any){
    console.error("Error checking file source merge results and create single file results:", error);
    return { data: error?.response?.data, status: "error" };
  }
}

/**
 * 自动创建多个文件的合并结果
 * @param take_off_id 
 * @returns 
 */
export const autoCreateMultipleFilesMergeResultByTakeOffId = async (take_off_id: string | number) => {
  try{
    const url = `/drawing-ai/drawing_ai/auto_create_multiple_files_merge_result_by_take_off_id?take_off_id=${take_off_id}`;
    const response = await http.post(url);
    return { data: response as any, status: "success" };
  }catch(error: any){
    console.error("Error auto creating multiple files merge result by take off id:", error);
    return { data: error?.response?.data, status: "error" };
  }
}

/**
 * 获取take off result items
 * @param take_off_id 
 * @returns 
 */
export const getAllTakeOffResultItemsByTakeOffId = async (take_off_id: string) => {
  try{
    const url = `/drawing-ai/drawing_ai/get_all_multiple_files_merge_results_sorted_by_label?take_off_id=${take_off_id}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  }catch(error: any){
    console.error("Error getting all take off result items by take off id:", error);
    return { data: error?.response?.data, status: "error" };
  }
}




