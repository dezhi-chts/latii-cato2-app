import { http } from "@/lib/http";

export const getContactsByCompanyId = async ({
  company_id,
}: {
  company_id: string | number;
}) => {
  try {
    const url = `/company/${company_id}/contacts`;
    const response = await http.get(url);
    return { data: response.data as any, status: "success" };
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return { data: null, status: "error" };
  }
};
