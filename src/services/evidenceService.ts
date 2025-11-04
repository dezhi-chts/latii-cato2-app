import { http } from "@/lib/http";

export const saveEvidence = async (evidence: FormData) => {
  try {
    const url = `/evidence/save/form`;
    const response = await http.post(url, evidence);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error saving evidence:", error);
    return { data: null, status: "error" };
  }
};

export const getEvidencesByProjectId = async (projectId: string) => {
  try {
    const url = `/evidence/all?project_id=${projectId}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting evidences:", error);
    return { data: null, status: "error" };
  }
};

export const getEvidenceByFileId = async (projectId:string, fileId: number) => {
  try {
    const url = `/evidence/all/project_file?project_id=${projectId}&project_file_id=${fileId}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting evidence by file id:", error);
    return { data: null, status: "error" };
  }
};

export const deleteEvidenceById = async (evidenceId: string) => {
  try {
    const url = `/evidence/delete?evidence_id=${evidenceId}`;
    const response = await http.delete(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error deleting evidence:", error);
    return { data: null, status: "error" };
  }
};

export const changeEvidenceType = async (
  evidenceId: string,
  type: "Table" | "Item"
) => {
  try {
    const body = {
      id: evidenceId,
      type: JSON.stringify({name: type}),
    };

    const url = `/evidence/update/type`;
    const response = await http.put(url, body);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error changing evidence type:", error);
    return { data: null, status: "error" };
  }
};
