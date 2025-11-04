import { http } from "@/lib/http";
import { Field } from "@/types/templates";

export const getTemplates = async (page: number = 1, perPage: number = 30) => {
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
    return { data: null, status: "error" };
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

export const createField = async (templateId: string, field: Field) => {
  try {
    const url = `/prompt-template/${templateId}/field`;
    const response = await http.post(url, field);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error creating field:", error);
    return { data: null, status: "error" };
  }
};

export const updateField = async (
  templateId: string,
  fieldId: string,
  field: Field
) => {
  try {
    const url = `/prompt-template/${templateId}/field/${fieldId}`;
    const response = await http.put(url, field);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error creating field:", error);
    return { data: null, status: "error" };
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
