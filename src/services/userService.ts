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

export const updateUser = async (data: UserDataForUpdate) => {
  const url = `/admin/dealer/user`;

  try {
    const params = new URLSearchParams(data).toString();

    const response = await http.post(url, params);

    return { status: "success", data: response };
  } catch (error) {
    console.error("Error updating user:", error);
    return { status: "error", data: error };
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

export const isUserAdmin = async () => {
  const url = "/auth/is_admin";
  try {
    const response: any = await http.get(url);
    return response?.is_admin || false;
  } catch (error) {
    console.error("Error checking if user is admin:", error);
  }
};
