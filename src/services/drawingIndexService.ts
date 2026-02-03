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
