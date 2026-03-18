import { http } from "@/lib/http";

export const analyzeItem = async (take_off_id: string, template_id: string) => {
  try {
    const url = `/drawing-ai/analyze_item?take_off_id=${take_off_id}&template_id=${template_id}`;
    const response = await http.post(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error analyzing item:", error);
    return { data: null, status: "error" };
  }
};

export const reconcileItems = async (take_off_id: number) => {
  try {
    const url = `/drawing-ai/reconcile_candidates/${take_off_id}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return { data: null, status: "error" };
  }
};

export const reconcileDefault = async (body: object) => {
  try {
    const url = `/drawing-ai/reconcile_items_default`;
    const response = await http.post(url, body);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error defaulting item:", error);
    return { data: null, status: "error" };
  }
};

export const reconcilePreview = async (body: object) => {
  try {
    const url = `/drawing-ai/reconcile_items_preview`;
    const response = await http.post(url, body);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error previewing item:", error);
    return { data: null, status: "error" };
  }
};

export const reconcliePreviewKeepAll = async (body: object) => {
  try {
    const url = `/drawing-ai/keepall_items_preview`;
    const response = await http.post(url, body);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error previewing item:", error);
    return { data: null, status: "error" };
  }
};

export const reconcileConfirm = async (body: object) => {
  try {
    const url = `/drawing-ai/reconcile_items_confirm`;
    const response = await http.post(url, body);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error completing item:", error);
    return { data: null, status: "error" };
  }
};

export const reconcileKeepAllConfirm = async (body: object) => {
  try {
    const url = `/drawing-ai/keepall_items_confirm`;
    const response = await http.post(url, body);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error completing item:", error);
    return { data: null, status: "error" };
  }
};

export const analyzeItemByGeminiSdk = async (
  take_off_id: string,
  template_id: number,
) => {
  try {
    const url = `/drawing-ai/analyze_item?take_off_id=${take_off_id}&template_id=${template_id}`;
    const response = await http.post(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error analyzing item:", error);
    return { data: null, status: "error" };
  }
};
