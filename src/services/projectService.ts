import { Action } from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/QuickActionsModal/Modal";
import { http } from "@/lib/http";
import { ProjectSettings, QuickActionsForm } from "@/types/project";

export const fetchProjects = async (filterParams?: {
  project_name?: string;
}): Promise<ProjectSettings[]> => {
  const url = "/project/all?order_by=update_time&order=desc";

  try {
    const response = await http.get(url, { params: filterParams });
    return response as unknown as ProjectSettings[];
  } catch (error) {
    console.error("Error getting projects:", error);
    return [];
  }
};

export const fetchProject = async (id: string) => {
  try {
    const response = await http.get(`/project/${id}`);
    return { data: response, status: "success" };
  } catch (error) {
    console.error("Error getting project:", error);
    return { data: error, status: "error" };
  }
};

export const getAllProjects = async (filterParams?: {
  per_page?: number;
  page?: number;
  order_by?: "project_id" | "project_name" | "update_time";
  order?: "asc" | "desc";
  project_name?: string;
}) => {
  const url = `/project/list?page=${filterParams?.page || 1}&project_name=${filterParams?.project_name || ""}&per_page=${filterParams?.per_page || "10"}&order_by=${filterParams?.order_by || "project_id"}&order=${filterParams?.order || "desc"}`;

  try {
    const response = await http.get(url);
    return response;
  } catch (error) {
    console.error("Error getting projects:", error);
    return [];
  }
};

export const createProject = async (project: any) => {
  const url = "/project";

  try {
    const response = await http.post(url, project);
    return { data: response, status: "success" };
  } catch (error) {
    console.error("Error creating project:", error);
  }
};

export const togglePinProject = async (
  projectId: number | string,
  is_pin: boolean,
) => {
  const url = `/project/${projectId}/pin?is_pin=${is_pin}`;

  try {
    const response = await http.post(url);
    return response;
  } catch (error) {
    console.error("Error toggling pin:", error);
  }
};

export const toggleFavoriteProject = async (project: any) => {
  try {
    const previousValue = project.is_favorite;
    const newValue = !previousValue;
    const newProject = { ...project, is_favorite: newValue };

    const response = await updateProject(newProject);
    return response;
  } catch (error) {
    console.error("Error toggling favorite:", error);
  }
};

export const updateProject = async (project: any) => {
  try {
    const response = await http.put(`/project/${project.project_id}`, project);
    return response;
  } catch (error) {
    console.error("Error updating project:", error);
  }
};

export const deleteProject = async (projectId: number | string) => {
  if (!projectId) return;
  try {
    const url = `/project/${projectId}`;
    const response = await http.delete(url);
    return response;
  } catch (error) {
    console.error("Error deleting project:", error);
  }
};

// ******************************************************************* //
// ******************************************************************* //
// ******************************************************************* //
// ******************************************************************* //
// Todo lo que quede debajo de esto al final de todo, debe ser borrado //
// ******************************************************************* //
// ******************************************************************* //
// ******************************************************************* //
// ******************************************************************* //

export const rotateChange = async (
  project_file_id: number,
  isRotate: boolean,
  rotation_angle: number,
) => {
  const url = `/project/file/rotate/update?project_file_id=${project_file_id}&is_rotate=${isRotate}&rotation_angle=${rotation_angle}`;
  try {
    await http.put(url);
    return "success";
  } catch (error) {
    console.error("Error rotating change:", error);
    return "error";
  }
};

export const toggleQuotePin = async (quoteId: string, is_pinned: boolean) => {
  try {
    await http.put(`/dealer/quote/${quoteId}/pin`, {
      is_pinned,
    });
    return "success";
  } catch (error) {
    console.error("Error toggling quote pin:", error);
    return "error";
  }
};

export const updateQuotePersonalNotes = async (
  quoteId: string,
  personal_notes: string,
) => {
  try {
    await http.put(`/dealer/quote/${quoteId}/personal_notes`, {
      personal_notes,
    });
    return "success";
  } catch (error) {
    console.error("Error updating quote personal notes:", error);
    return "error";
  }
};

export const deleteQuote = async (quoteId: string) => {
  try {
    await http.delete(`/dealer/quote/${quoteId}`);
    return "success";
  } catch (err: any) {
    const errorDetail = err?.response?.data?.detail || "Unknown error";
    console.log(errorDetail);
    return errorDetail;
  }
};

export const getQuoteOptions = async (type: Action, itemIds: string[]) => {
  try {
    const response = await http.post(`/dealer/quote/get_options/${type}`, {
      item_ids: itemIds,
    });
    return response;
  } catch (error) {
    console.error("Error getting quote options:", error);
  }
};

export const sendToLatii = async (
  quoteId: string,
  action:
    | "QUOTE_SENT"
    | "QUOTE_ACCEPTED"
    | "QUOTE_APPROVED"
    | "QUOTE_SEND_REQUEST",
  platform: "internal" | "dealer",
  files?: any[] | null,
  description?: string | null,
  title?: string | null,
) => {
  try {
    const formData = new FormData();
    formData.append("action", action);
    formData.append("platform", platform);

    if (files?.length) {
      files.forEach((file) => {
        if (file.originFileObj) {
          formData.append("files", file.originFileObj);
        }
      });
    }

    formData.append("title", title ?? "");
    formData.append("description", description ?? "");

    const response = await http.post(`/quote/${quoteId}/transitions`, formData);

    return { data: response, status: "success" };
  } catch (error) {
    console.error("Error sending quote to Latii:", error);
    return { data: null, status: "error" };
  }
};

export const sendQuickActions = async (
  form: QuickActionsForm,
  quote_id: string,
) => {
  try {
    const response = await http.post(
      `/dealer/quote/edit/quote/${quote_id}`,
      form,
    );
    return { data: response, status: "success" };
  } catch (error) {
    console.error("Error sending quote to Latii:", error);
    return { data: null, status: "error" };
  }
};

export const archiveQuote = async (quote_id: string) => {
  try {
    const response = await http.post(`/quote/${quote_id}/archive`);
    return { data: response, status: "success" };
  } catch (error) {
    console.error("Error archiving quote:", error);
    return { data: null, status: "error" };
  }
};

export const duplicateQuote = async (quote_id: string) => {
  try {
    const response = await http.post(
      `/quote/duplicate/${quote_id}?is_swap=false`,
    );
    return { data: response, status: "success" };
  } catch (error) {
    console.error("Error archiving quote:", error);
    return { data: null, status: "error" };
  }
};

export const checkChanges = async (quoteId: string) => {
  try {
    const response = await http.get(`/dealer/quote/check_changes/${quoteId}`);
    return response.data;
  } catch (error) {
    console.error("Error checking changes:", error);
    return null;
  }
};

export const fetchPdfDownloadUrl = async (quoteId: string) => {
  try {
    const response: any = await http.post(
      `/dealer/quote/generate_pdf/${quoteId}`,
    );
    return response as string;
  } catch (error) {
    console.error("Error fetching PDF URL:", error);
    return null;
  }
};

export const duplicateItemOfQuote = async (itemId: string, quoteId: string) => {
  try {
    await http.post(`/quote/copy_quote_item/${quoteId}/${itemId}`);
    return "success";
  } catch (error) {
    console.error("Error duplicating item:", error);
    return "error";
  }
};

export const markChangesAsReadOfQuote = async (
  quoteId: string,
  itemId: string,
) => {
  try {
    await http.post(
      `/dealer/quote/quote_changes/mark_read/${quoteId}/${itemId}`,
    );
    return "success";
  } catch (error) {
    console.error("Error marking changes as read:", error);
    return "error";
  }
};

export const processPdfWithAi = async (
  projectId: string,
  name: string,
  file: File,
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await http.post(
      `/dealer/quote/pdf_process/${projectId}/${name}`,
      formData,
    );
    return response;
  } catch (error) {
    console.error("Error processing PDF:", error);
    return "error";
  }
};

export const generateCustomerLink = async (quoteId: string) => {
  const url = `/quote/customer_user_link?quote_id=${quoteId}`;

  try {
    const response = await http.post(url);
    return { data: response, ok: true };
  } catch (error) {
    console.error("Error generating customer link:", error);
    return { data: error, ok: false };
  }
};

export const getQuoteFileList = async (quoteId: string) => {
  const url = `/dealer/quote/share-files?quote_id=${quoteId}`;
  try {
    const response = await http.post(url);
    return response;
  } catch (error) {
    console.error("Error getting quote file list:", error);
  }
};

export const markFileAsRead = async (requisitionIds: number[]) => {
  const url = `/latii_project/requisition_files/read`;
  try {
    const response = await http.post(url, requisitionIds);
    return response;
  } catch (error) {
    console.error("Error marking files as read:", error);
  }
};
export const changeCheckedItem = async (itemId: string, checked: boolean) => {
  try {
    const url = `/project/take_off_result_item/check/result_id`;
    const body = {
      id: itemId,
      is_checked: checked,
    };
    const response = await http.put(url, body);
    return response;
  } catch (error) {
    console.error("Error changing checked item:", error);
  }
};

export const updateField = async (itemId: number, result: string) => {
  try {
    const url = `/project/take_off_result_item/edit/result_id`;
    const body = {
      id: itemId,
      result,
    };
    const response = await http.put(url, body);
    return response;
  } catch (error) {
    console.error("Error editing field:", error);
  }
};
