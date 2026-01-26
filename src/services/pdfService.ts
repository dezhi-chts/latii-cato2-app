import { http } from "@/lib/http";

export const pdfOcrDetect = async (file: File) => {
  try {
    const url = `/pdf/ocr/image`;
    const formData = new FormData();
    formData.append("image", file);
    const response = await http.post(url, formData, 5000, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error ocr detect text:", error);
    return { data: null, status: "error" };
  }
};
export const fetchCompanyByKeycloakUser = async () => {
  try {
    const url = `/company/get_company_by_keycloak_user/`;
    const response = await http.get(url);
    return { data: response.data as any, status: "success" };
  } catch (error) {
    console.error("Error fetchCompanyByKeycloakUser:", error);
    return { data: null, status: "error" };
  }
};

export const updateCompanyLogoByCompanyId = async (
  companyId: number,
  file: any,
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const url = `/company/${companyId}/photo`;
    const response = await http.put(url, formData);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error fetchCompanyByKeycloakUser:", error);
    return { data: null, status: "error" };
  }
};

export const updateCompanyByCompanyId = async (
  companyId: number,
  companyData: any,
) => {
  try {
    const url = `/company/${companyId}`;
    const response = await http.put(url, companyData);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error fetchCompanyByKeycloakUser:", error);
    return { data: null, status: "error" };
  }
};
