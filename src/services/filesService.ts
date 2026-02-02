import { http } from "@/lib/http";
import { UploadFile } from "antd";

export type CatoUploadFile = {
  file_name: string;
  operation_type:
    | "Architecture_drawing"
    | "Quote"
    | "Evidence"
    | "Email"
    | "Others";
  file_type: string;
  country_of_origin: ValidCountryOfOrigin;
  hinge_status?: "1" | "2" | undefined;
};

export type ValidCountryOfOrigin =
  | "United States"
  | "Spain"
  | "Canada"
  | "Morocco";

export const uploadFiles = async (
  filesInfo: CatoUploadFile[],
  files: UploadFile[],
  projectId: number | string,
  hinge_status?: "1" | "2" | undefined,
) => {
  const url = `/project/file/upload_files?project_id=${projectId}${
    hinge_status ? `&hinge_status=${hinge_status}` : ""
  }`;

  const metas = JSON.stringify(filesInfo);
  const formData = new FormData();

  files.forEach((file) => {
    if (file.originFileObj) {
      formData.append("files", file.originFileObj);
    }
  });

  formData.append("metas", metas);

  try {
    const response = await http.post(url, formData);
    return { data: response, status: "success" };
  } catch (error) {
    console.error("Error uploading files:", error);
    return { data: null, status: "error" };
  }
};

export const uploadFilesNoProjectId = async (
  filesInfo: CatoUploadFile[],
  files: UploadFile[],
  hinge_status?: "1" | "2" | undefined,
  onUploadProgress?: (progressEvent: any) => void,
) => {
  const url = `/project/file/create_and_upload_files?${
    hinge_status ? `&hinge_status=${hinge_status}` : ""
  }`;

  const metas = JSON.stringify(filesInfo);
  const formData = new FormData();

  files.forEach((file) => {
    if (file.originFileObj) {
      formData.append("files", file.originFileObj);
    }
  });

  formData.append("metas", metas);

  try {
    const response = await http.post(url, formData, undefined, {
      onUploadProgress,
    });
    return { data: response, status: "success" };
  } catch (error) {
    console.error("Error uploading files:", error);
    return { data: null, status: "error" };
  }
};
