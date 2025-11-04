import { http } from "@/lib/http";
import { passwordChangeData, UserDataForUpdate } from "@/types/user";
import qs from "qs";

export const fetchUser = async (username: string) => {
  const encodedUsername = encodeURIComponent(username);
  const url = `/admin/dealer/user/${encodedUsername}`;
  try {
    const response = await http.get(url);
    return {
      ...response,
      is_success: true,
      is_force_logout: false,
    };
  } catch (error: any) {
    const detail = error?.response?.data?.detail?.toLowerCase() || "";

    const isForceLogout = detail.includes("not found");

    return {
      data: error?.response?.data,
      is_success: false,
      is_force_logout: isForceLogout,
    };
  }
};

export const updateUser = async (
  auth_provider_uid: string,
  data: UserDataForUpdate,
  file?: File | null
) => {
  const url = `/admin/dealer/user/${auth_provider_uid}`;

  try {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as any);
      }
    });

    if (file) {
      formData.append("company_logo_file", file);
    }

    const response = await http.post(url, formData);

    return response;
  } catch (error) {
    console.error("Error updating user:", error);
  }
};

export const changePassword = async (data: passwordChangeData) => {
  const url = "/admin/dealer/user";

  try {
    const encoded = qs.stringify(data);

    const response = await http.post(url, encoded);

    return {
      data: response,
      status: "success",
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      data: error,
      status: "error",
    };
  }
};
