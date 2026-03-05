import http from "@/lib/http";

export const getBoxTypes = async (companyId: string | number) => {
  const url = `/box_types/list/${companyId}`;
  try {
    const response = await http.get(url);
    return response; // o response.data, depende tu helper
  } catch (error) {
    console.error("Error getting box types:", error);
    throw error;
  }
};
