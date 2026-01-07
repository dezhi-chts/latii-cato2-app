import { http } from "@/lib/http";

export const fetchProfileMsgByVersionId = async (versionId: string) => {
	try {
		const url = `/profile/version_id/${versionId}`;
		const response = await http.get(url);
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error fetchProfileMsgByVersionId:", error);
		return { data: null, status: "error" };
	}
};


export const fetchProjectAttributesWithOptionsByVersionId = async (versionId: string) => {
	try {
		const url = `/product_attribute/option/project/tree`;
		const response = await http.get(url, { version_id: versionId });
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error fetchProjectAttributesWithOptionsByVersionId:", error);
		return { data: null, status: "error" };
	}
};

export const fetchQuoteAttributesWithOptionsByVersionId = async (versionId: string) => {
	try {
		const url = `/product_attribute/option/quote/tree`;
		const response = await http.get(url, { version_id: versionId });
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error fetchQuoteAttributesWithOptionsByVersionId:", error);
		return { data: null, status: "error" };
	}
};

export const fetchItemAttributesWithOptionsByVersionId = async (versionId: string) => {
	try {
		const url = `/product_attribute/option/item/tree`;
		const response = await http.get(url, { version_id: versionId });
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error fetchItemAttributesWithOptionsByVersionId:", error);
		return { data: null, status: "error" };
	}
};

export const fetchUnitAttributesWithOptionsByVersionId = async (versionId: string) => {
	try {
		const url = `/product_attribute/option/unit/tree`;
		const response = await http.get(url, { version_id: versionId });
		return { data: response.data as any, status: "success" };
	} catch (error) {
		console.error("Error fetchUnitAttributesWithOptionsByVersionId:", error);
		return { data: null, status: "error" };
	}
};
