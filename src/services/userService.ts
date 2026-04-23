import { http } from "@/lib/http";
import { PasswordChangeData, UserDataForUpdate } from "@/types/user";
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
    const params = new URLSearchParams();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value);
      }
    });

    const response = await http.post(url, params.toString());

    return { status: "success", data: response };
  } catch (error) {
    console.error("Error updating user:", error);
    return { status: "error", data: error };
  }
};
export const changePassword = async (data: PasswordChangeData) => {
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


/**
 * 绑定用户为管理员
 * @param userId 用户ID
 * @param userId 
 * @returns 
 */
export const bindUserToAdmin = async (userId: number | string) => {
  const url = `/auth/bind_user_to_admin?user_id=${userId}`;
  try {
    const response: any = await http.post(url);
    return response;
  } catch (error:any) {
    console.error("Error binding user to admin:", error);
    return { data: error?.response?.data, status: "error" };
  }
};

/**
 * 解绑用户为管理员
 * @param userId 用户ID
 * @param userId 
 * @returns 
 */
export const unbindUserToAdmin = async (userId: number | string) => {
  const url = `/auth/unbind_user_from_admin?user_id=${userId}`;
  try {
    const response: any = await http.post(url);
    return response;
  } catch (error:any) {
    console.error("Error unbinding user from admin:", error);
    return { data: error?.response?.data, status: "error" };
  }
};


/**
 * 绑定用户为超级管理员
 * @param userId 用户ID
 * @param userId 
 * @returns 
 */
export const bindUserToSuperAdmin = async (userId: number | string) => {
  const url = `/auth/bind_user_to_super_admin?user_id=${userId}`;
  try {
    const response: any = await http.post(url);
    return response;
  } catch (error:any) {
    console.error("Error binding user to super admin:", error);
    return { data: error?.response?.data, status: "error" };
  }
};

/**
 * 解绑用户为超级管理员
 * @param userId 用户ID
 * @param userId 
 * @returns 
 */
export const unbindUserFromSuperAdmin = async (userId: number | string) => {
  const url = `/auth/unbind_user_from_super_admin?user_id=${userId}`;
  try {
    const response: any = await http.post(url);
    return response;
  } catch (error:any) {
    console.error("Error unbinding user from super admin:", error);
    return { data: error?.response?.data, status: "error" };
  }
}

export const isUserSuperAdmin = async () => {
  try {
    const url = "/auth/is_super_admin";
    const response: any = await http.get(url);
    return response?.is_super_admin || false;
  } catch (error) {
    console.error("Error checking if user is super admin:", error);
  }
}
