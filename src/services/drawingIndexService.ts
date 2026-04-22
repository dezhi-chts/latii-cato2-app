import { http } from "@/lib/http";

export const recognizeDrawingIndex = async (
  projectId: string,
  fileId: string | number,
) => {
  try {
    const url = `/pdf/extract-drawing-index-from-project?project_id=${projectId}&file_id=${fileId}`;
    const response = await http.post(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error recognizing drawing index:", error);
    return { data: null, status: "error" };
  }
};

export const getDrawingIndexInfoById = async (
  projectId: string,
  fileId: string | number,
) => {
  try {
    const url = `/pdf/get-drawing-index-from-project?project_id=${projectId}&file_id=${fileId}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting drawing index:", error);
    return { data: null, status: "error" };
  }
};

export const getDrawingIndexTypeList = async () => {
  try {
    const url = `/pdf/project/drawing-index/types`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting drawing index type list:", error);
    return { data: null, status: "error" };
  }
};

export const updateDrawingIndexType = async (
  drawing_index_id: string | number,
  data: { new_type: string },
) => {
  try {
    const url = `/pdf/project/drawing-index/${drawing_index_id}/type`;
    const response = await http.put(url, data);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error updating drawing index type:", error);
    return { data: null, status: "error" };
  }
};

export const getPdfAnalyseProjectInfo = async (projectId: string) => {
  try {
    const url = `/pdf/pdf-analysis/project/${projectId}/project-info`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting pdf analyse project info:", error);
    return { data: null, status: "error" };
  }
};

export const getPdfAnalysePages = async (fileId: string) => {
  try {
    const url = `/pdf/pdf-analysis/${fileId}/pages`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting pdf analyse pages:", error);
    return { data: null, status: "error" };
  }
};

export const getPdfAnalyseSummary = async (fileId: string) => {
  try {
    const url = `/pdf/pdf-analysis/${fileId}/summary`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting pdf analyse summary:", error);
    return { data: null, status: "error" };
  }
};

export const updatePageType = async ({
  fileId,
  pageNum,
  newType,
}: {
  fileId: string;
  pageNum: number;
  newType: string;
}) => {
  try {
    let url = `/pdf/project/page/type?project_file_id=${fileId}&page_number=${pageNum}`;
    if(newType?.length > 0){
      url += `&new_page_type=${newType}`;
    }
    const response = await http.put(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error updating page type:", error);
    return { data: null, status: "error" };
  }
};

export const deleteDrawingIndex = async (drawingIndexId: string | number) => {
  try {
    const url = `/pdf/drawing-index/${drawingIndexId}`;
    const response = await http.delete(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error deleting drawing index:", error);
    return { data: null, status: "error" };
  }
};

export const getBoxTypes = async (company_id: string) => {
  try {
    const url = `/box_types/list?company_id=${company_id}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting box type list:", error);
    return { data: null, status: "error" };
  }
};

export const createBoxType = async (
  company_id: string,
  data: {
    name: string;
    description: string;
    color: string;
    search_prompt: string;
    analysis_prompt: string;
  },
) => {
  try {
    const url = `/box_types/create/${company_id}`;
    const response = await http.post(url, data);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    console.error("Error creating box type:", error);
    return { data: error?.response?.data || null, status: "error" };
  }
};

export const updateBoxType = async (
  company_id: string,
  box_id: string,
  data: {
    name: string;
    description: string;
    color: string;
    search_prompt: string;
    analysis_prompt: string;
  },
) => {
  try {
    const url = `/box_types/update/${company_id}/${box_id}`;
    const response = await http.put(url, data);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    return { data: error?.response?.data || null, status: "error" };
  }
};

export const deleteBoxType = async (company_id: string, box_id: string) => {
  try {
    const url = `/box_types/delete/${company_id}/${box_id}`;
    const response = await http.delete(url);
    return { data: response as any, status: "success" };
  } catch (error: any) {
    console.error("Error deleting box type:", error);
    console.error("Error response:", error?.response?.data);
    return { data: error?.response?.data || null, status: "error" };
  }
};
