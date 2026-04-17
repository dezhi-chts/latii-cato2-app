import request, { http } from "@/lib/http";
import { Field } from "@/types/templates";

export const getTemplates = async (page: number = 1, perPage: number = 1000) => {
  try {
    const url = `/prompt-template/list?page=${page}&per_page=${perPage}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting templates:", error);
    return { data: null, status: "error" };
  }
};

export const getTemplateById = async (templateId: number) => {
  try {
    const url = `/prompt-template/${templateId}`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting template:", error);
    return { data: null, status: "error" };
  }
};

export const createTemplate = async (settings: any) => {
  try {
    const url = `/prompt-template`;
    const response = await http.post(url, settings);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error creating template:", error);
    return { data: error?.response?.data || null, status: "error" };
  }
};

export const deleteTemplate = async (templateId: number) => {
  try {
    const url = `/prompt-template/${templateId}`;
    const response = await http.delete(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { data: null, status: "error" };
  }
};

export const updateTemplate = async (templateId: string, settings: any) => {
  try {
    const url = `/prompt-template/${templateId}`;
    const response = await http.put(url, settings);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error updating template:", error);
    return { data: null, status: "error" };
  }
};

export const createField = async (templateId: number, field: Field) => {
  try {
    const url = `/prompt-template/${templateId}/field`;
    const response = await http.post(url, field);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error creating field:", error);
    return { data: error?.response?.data || null, status: "error" };
  }
};

export const updateField = async (
  templateId: number,
  fieldId: string,
  field: Field,
) => {
  try {
    const url = `/prompt-template/${templateId}/field/${fieldId}`;
    const response = await http.put(url, field);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error creating field:", error);
    return { data: error?.response?.data || null, status: "error" };
  }
};

export const deleteField = async (templateId: string, fieldId: string) => {
  try {
    const url = `/prompt-template/${templateId}/field/${fieldId}`;
    const response = await http.delete(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error deleting field:", error);
    return { data: null, status: "error" };
  }
};

export const getFieldsByTemplateId = async (templateId: string) => {
  try {
    const url = `/prompt-template/${templateId}/fields`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error getting fields:", error);
    return { data: null, status: "error" };
  }
};

export const setTemplateDefault = async (
  templateId: number,
  company_id: number,
) => {
  try {
    const url = `/prompt-template/${templateId}/set-default?company_id=${company_id}`;
    const response = await http.post(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error updating template default:", error);
    return { data: null, status: "error" };
  }
};

export const copyTemplate = async (
  templateId: number,
  company_id: number,
  name: string,
) => {
  try {
    const url = `/prompt-template/${templateId}/copy`;
    const response = await http.post(url, { company_id, name });
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error copying template:", error);
    return { data: null, status: "error" };
  }
};

export const copyField = async (templateId: number, fieldId: string) => {
  try {
    const url = `/prompt-template/${templateId}/field/${fieldId}/copy`;
    const response = await http.post(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error copying field:", error);
    return { data: null, status: "error" };
  }
};

/**
 * 导入模版
 * @param company_id 公司ID
 * @param file 模版JSON文件
 * @returns 导入结果
 */
export const importTemplate = async (company_id: number, file: File) => {
  try {
    const formData = new FormData();
    formData.append("company_id", `${company_id}`);
    formData.append("template_json_file", file);
    const url = `/prompt-template/import-json`;
    const response = await http.post(url, formData, undefined, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { data: response as any, status: "success" };
  } catch (error:any) {
    console.error("Error importing template:", error);
    return { data: error?.response?.data || null, status: "error" };
  }
}

/**
 * 下载模版JSON文件
 * @param template_id 模版ID
 * @returns 
 */
export const downloadTemplateJson = async (template_id: number) => {
  try{
    const url = `/prompt-template/${template_id}/download-json?template_id=${template_id}`;
    const response = await request.get(url, { responseType: "blob" });
    return { data: response as any, status: "success" };
  } catch (error:any) {
    console.error("Error downloading template JSON:", error);
    return { data: error?.response?.data || null, status: "error" };
  }
}

/**
 * 更新模版字段索引
 * @param template_id 模版ID
 * @param field_id 字段ID
 * @param field_index 字段索引
 * @returns 
 */
export const updateFieldIndex = async (template_id: number, field_id: string, field_index: number)=>{
  try{
    const url = `/prompt-template/${template_id}/field_index/${field_id}/${field_index}`;
    const response = await request.put(url, { responseType: "blob" });
    return { data: response as any, status: "success" };
  } catch (error:any) {
    console.error("Error updating field index:", error);
    return { data: error?.response?.data || null, status: "error" };
  }
}
