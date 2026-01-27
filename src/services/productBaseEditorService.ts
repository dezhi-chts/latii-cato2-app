import { http } from "@/lib/http";

export const fetchProductTypesLibrary = async () => {
    try {
        const url = `/product_types_library/all`;
        const response = await http.get(url);
        return { data: response.data as any, status: "success" };
    } catch (error) {
        console.error("Error fetchProductTypesLibrary:", error);
        return { data: null, status: "error" };
    }
};

export const fetchOperabilityLibrary = async () => {
    try {
        const url = `/operability_library/all`;
        const response = await http.get(url);
        return { data: response.data as any, status: "success" };
    } catch (error) {
        console.error("Error fetchOperabilityLibrary:", error);
        return { data: null, status: "error" };
    }
};

export const fetchAllProfileByCompanyId = async (companyId: number) => {
	try {
        const url = `/profile/all/${companyId}`;
        const response = await http.get(url);
        return { data: response.data as any, status: "success" };
    } catch (error) {
        console.error("Error fetchOperabilityLibrary:", error);
        return { data: null, status: "error" };
    }
};

export const createProfile = async (params:Record<string, any>) => {
	try {
		const url = `/profile/create_profile_for_product_editor`;
		const body = params
		const response = await http.post(url, body);
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error createProfile:", error);
		return { data: error, status: "error" };
	}
};

export const updateProfile = async (profileId: number, name: string) => {
	try {
		const url = `/profile/update_profile_name_for_product_editor/${profileId}?name=${name}`;
		const response = await http.put(url);
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error updateProfile:", error);
		return { data: error, status: "error" };
	}
};

export const deleteProfile = async (profileId: number) => {
	try {
		const url = `/profile/delete/${profileId}`;
		const response = await http.delete(url);
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error deleteProfile:", error);
		return { data: error, status: "error" };
	}
};

export const createOption = async (params:Record<string, any>) => {
	try {
		const url = `/product_attribute/option/create`;
		const body = params
		const response = await http.post(url, body);
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error createOption:", error);
		return { data: error, status: "error" };
	}
};

export const fetchAllOptionLibraryByCompany = async (companyId: number) => {
	try {
		const url = `/product_attribute/option/option_library/${companyId}`;
		const response = await http.get(url);
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error fetchAllOptionLibraryByCompany:", error);
		return { data: error, status: "error" };
	}
};

export const createOptionLibraryByCompany = async (productAttributeId: number) => {
	try {
		const url = `/product_attribute/option/option_library/create/${productAttributeId}`;
		const response = await http.post(url);
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error createOptionLibraryByCompany:", error);
		return { data: error, status: "error" };
	}
};

export const deleteOptionLibraryByCompany = async (productAttributeId: number) => {
	try {
		const url = `/product_attribute/option/option_library/delete/${productAttributeId}`;
		const response = await http.delete(url);
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error deleteOptionLibraryByCompany:", error);
		return { data: error, status: "error" };
	}
};

export const fetchOptionsByProductAttrId = async (productAttributeId: number) => {
	try {
		const url = `/product_attribute/option/product_attribute_id/${productAttributeId}`;
		const response = await http.get(url);
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error fetchOptionsByProductAttrId:", error);
		return { data: error, status: "error" };
	}
};

export const updateOptionByOptionId = async (productAttributeOptionId: number, params:Record<string, any>) => {
	try {
		const url = `/product_attribute/option/${productAttributeOptionId}/update`;
		const body = params
		const response = await http.put(url, body);
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error updateOptionByOptionId:", error);
		return { data: error, status: "error" };
	}
};

export const deleteOptionByOptionId = async (productAttributeOptionId: number) => {
	try {
		const url = `/product_attribute/option/${productAttributeOptionId}/delete`;
		const response = await http.delete(url);
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error deleteOptionByOptionId:", error);
		return { data: error, status: "error" };
	}
};

export const updateFileForProductAttrOption = async (
	productAttributeId: number,
	file: any
) => {
	try {
		const formData = new FormData();
		formData.append("file", file);
		const url = `/product_attribute/option/upload_file/${productAttributeId}`;
		const response = await http.post(url, formData);
		return { data: response?.data as any, status: "success" };
	} catch (error) {
		console.error("Error updateFileForProductAttrOption:", error);
		return { data: null, status: "error" };
	}
};