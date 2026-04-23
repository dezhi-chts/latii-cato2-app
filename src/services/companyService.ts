import { http } from "@/lib/http";

export const fetchCompanyByKeycloakUser = async () => {
	try {
		const url = `/company/get_company_by_keycloak_user/`;
		const response = await http.get(url);
		return { data: response.data as any, status: "success" };
	} catch (error:any) {
		console.error("Error fetchCompanyByKeycloakUser:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

export const updateCompanyLogoByCompanyId = async (
	companyId: number,
	file: any
) => {
	try {
		const formData = new FormData();
		formData.append("file", file);
		const url = `/company/${companyId}/photo`;
		const response = await http.put(url, formData);
		return { data: response as any, status: "success" };
	} catch (error:any) {
		console.error("Error updateCompanyLogoByCompanyId:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

export const updateCompanyByCompanyId = async (
	companyIdOrParams: number | { companyId: number; companyData: any },
	companyDataArg?: any
) => {
	const companyId =
		typeof companyIdOrParams === "number"
			? companyIdOrParams
			: companyIdOrParams.companyId;
	const companyData =
		typeof companyIdOrParams === "number"
			? companyDataArg
			: companyIdOrParams.companyData;
	try {
		const url = `/company/${companyId}`;
		const response = await http.put(url, companyData);
		return { data: response as any, status: "success" };
	} catch (error:any) {
		console.error("Error updateCompanyByCompanyId:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

export const getCompanyList = async ({
	page,
	per_page,
	name
}: {
	page: number;
	per_page: number;
	name?: string;
}) => {
	try {
		const params = new URLSearchParams({
			page: String(page),
			per_page: String(per_page),
		});
		if (name && name.trim()) {
			params.append("name", name.trim());
		}
		const url = `/company/list?${params.toString()}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error:any) {
		console.error("Error getCompanyList:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

export const getCompanyById = async (companyId: number) => {
	try {
		const url = `/company/${companyId}`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error:any) {
		console.error("Error getCompanyById:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

export const createCompany = async (
	companyDataOrParams: any | { companyData: any }
) => {
	const companyData =
		companyDataOrParams && "companyData" in companyDataOrParams
			? companyDataOrParams.companyData
			: companyDataOrParams;
	try {
		const url = `/company`;
		const response = await http.post(url, companyData);
		return { data: response as any, status: "success" };
	} catch (error: any) {
		console.error("Error createCompany:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

export const deleteCompanyByCompanyId = async (
	companyIdOrParams: number | { companyId: number }
) => {
	const companyId =
		typeof companyIdOrParams === "number"
			? companyIdOrParams
			: companyIdOrParams.companyId;
	try {
		const url = `/company/${companyId}`;
		const response = await http.delete(url);
		return { data: response as any, status: "success" };
	} catch (error:any) {
		console.error("Error deleteCompanyById:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

// Keep compatibility with old callers.
export const deleteCompanyById = async (companyId: number) =>
	deleteCompanyByCompanyId({ companyId });


/**
 * 获取公司联系人
 * @param companyId 公司ID
 * @returns 联系人列表
 */
export const getContactListByCompanyId = async ({
	companyId,
}: {
	companyId: number;
}) => {
	try {
		const url = `/company/${companyId}/contacts`;
		const response = await http.get(url);
		return { data: response as any, status: "success" };
	} catch (error:any) {
		console.error("Error getCompanyContacts:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

/**
 * 新增公司联系人
 * @param companyId 公司ID
 * @param contactData 联系人数据
 * @returns 
 */
export const createCompanyContact = async ({
	companyId,
	contactData,
}: {
	companyId: number;
	contactData: any;
}) => {
	try {
		const url = `/company/${companyId}/contact`;
		const response = await http.post(url, contactData);
		return { data: response as any, status: "success" };
	} catch (error:any) {
		console.error("Error createContact:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

/**
 * 删除公司联系人
 * @param companyId 公司ID
 * @param contactId 联系人ID
 * @returns 
 */
export const deleteCompanyContact = async ({
	companyId,
	contactId,
}: {
	companyId: number;
	contactId: number;
}) => {
	try {
		const url = `/company/${companyId}/contact/${contactId}`;
		const response = await http.delete(url);
		return { data: response as any, status: "success" };
	} catch (error:any) {
		console.error("Error deleteCompanyContact:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

/**
 * 更新公司联系人
 * @param companyId 公司ID
 * @param contactId 联系人ID
 * @param contactData 联系人数据
 * @returns 
 */
export const updateCompanyContact = async ({
	companyId,
	contactId,
	contactData,
}: {
	companyId: number;
	contactId: number;
	contactData: any;
}) => {
	try {
		const url = `/company/${companyId}/contact/${contactId}`;
		const response = await http.put(url, contactData);
		return { data: response as any, status: "success" };
	} catch (error:any) {
		console.error("Error updateCompanyContact:", error);
		return { data: error?.response?.data || null, status: "error" };
	}
};

// Keep compatibility with old callers.
export const getCompanyContacts = async (companyId: number) =>
	getContactListByCompanyId({ companyId });
