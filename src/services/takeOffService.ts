import { http } from "@/lib/http";

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