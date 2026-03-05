import http from "@/lib/http";

export type BoxTypePayload = {
  name: string;
  description?: string;
  color?: string;
  search_prompt?: string;
  analysis_prompt?: string;
};

export const getBoxTypes = async () => {
  const url = `/box_types/list`;
  try {
    const response = await http.get(url);
    return response;
  } catch (error) {
    console.error("Error getting box types:", error);
    throw error;
  }
};

export const createBoxType = async (
  companyId: string | number,
  payload: BoxTypePayload
) => {
  const url = `/box_types/create/${companyId}`;
  try {
    const response = await http.post(url, payload);
    return response;
  } catch (error) {
    console.error("Error creating box type:", error);
    throw error;
  }
};

export const updateBoxType = async (
  companyId: string | number,
  boxId: string | number,
  payload: Partial<BoxTypePayload>
) => {
  const url = `/box_types/update/${companyId}/${boxId}`;
  try {
    const response = await http.put(url, payload);
    return response;
  } catch (error) {
    console.error("Error updating box type:", error);
    throw error;
  }
};

export const deleteBoxType = async (
  companyId: string | number,
  boxId: string | number
) => {
  const url = `/box_types/delete/${companyId}/${boxId}`;
  try {
    const response = await http.delete(url);
    return response;
  } catch (error) {
    console.error("Error deleting box type:", error);
    throw error;
  }
};
