"use client";

import { useUser } from "@/context/UserContext";
import { updateUser } from "@/services/userService";
import { UserDataForUpdate } from "@/types/user";
import { Input, notification } from "antd";
import { useEffect, useState } from "react";

const YourProfile = () => {
  const { first_name, last_name, email, job_title, changeUser } = useUser();

  const [localUser, setLocalUser] = useState<UserDataForUpdate>({
    first_name: first_name,
    last_name: last_name,
    email: email,
    current_password: "",
    new_password: "",
    job_title: job_title,
  });

  useEffect(() => {
    setLocalUser({
      first_name: first_name,
      last_name: last_name,
      email: email,
      current_password: "",
      new_password: "",
      job_title: job_title,
    });
  }, [first_name, last_name, email, job_title]);

  const handleOnBlur = async (event: any) => {
    const field = event.target.name;
    const value = event.target.value;

    if (!hasChanges(field, value)) return;

    const data: UserDataForUpdate = {
      [field]: value,
    };
    const response: any = await updateUser(data);

    if (response.status === "success") {
      notification.success({
        message: "Success",
        description: "Your profile has been updated successfully.",
      });

      changeUser(localUser);
    } else {
      const errorMessage =
        response?.data?.response?.data.detail || "Unknown error";
      notification.error({
        message: "Failed to update your profile",
        description: errorMessage,
      });
    }
  };

  const handleOnChange = (event: any) => {
    const field = event.target.name;
    const value = event.target.value;

    setLocalUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const hasChanges = (field: keyof UserDataForUpdate, value: string) => {
    return localUser[field] !== value;
  };

  return (
    <div className="mt-8 ml-4 flex flex-col gap-12 w-[800px]">
      <div className="flex flex-col gap-5 w-full">
        <p className="text-basicGray text-base">General Information</p>
        <div className="flex flex-col gap-8 w-full">
          <div className="flex gap-6 w-full items-center">
            <p className="w-2/12 text-sm">
              First Name <span className="text-accentRed">*</span>
            </p>
            <Input
              className="w-5/12 rounded-xl"
              name="first_name"
              size="large"
              value={localUser.first_name}
              onChange={(e) => handleOnChange(e)}
              onBlur={(e) => handleOnBlur(e)}
            />
          </div>
          <div className="flex gap-6 w-full items-center">
            <p className="w-2/12 text-sm">
              Last Name <span className="text-accentRed">*</span>
            </p>
            <Input
              className="w-5/12 rounded-xl"
              name="last_name"
              size="large"
              value={localUser.last_name}
              onChange={(e) => handleOnChange(e)}
              onBlur={(e) => handleOnBlur(e)}
            />
          </div>
          <div className="flex gap-6 w-full items-center">
            <p className="w-2/12 text-sm">
              Email <span className="text-accentRed">*</span>
            </p>
            <Input
              className="w-5/12 rounded-xl"
              name="email"
              size="large"
              value={localUser.email}
              onChange={(e) => handleOnChange(e)}
              onBlur={(e) => handleOnBlur(e)}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 w-full">
        <p className="text-basicGray text-base">Password Security</p>
        <div className="flex flex-col gap-1">
          <div className="flex gap-6 w-full items-center">
            <p className="w-2/12 text-sm">Password</p>
            <Input.Password
              className="w-5/12 rounded-xl"
              name="new_password"
              size="large"
              value={localUser.new_password}
              onChange={(e) => handleOnChange(e)}
              // onBlur={(e) => handleOnBlur(e)}
            />
          </div>
          <div className="flex justify-start gap-6">
            <div className="w-2/12" />
            <p className="text-forumBlue hover:opacity-80 active:opacity-70 cursor-pointer text-xs w-5/12 text-end">
              Reset Password
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 w-full">
        <p className="text-basicGray text-base">Company Information</p>
        <div className="flex flex-col gap-8 w-full">
          <div className="flex gap-6 w-full items-center">
            <p className="w-2/12 text-sm">Role</p>
            <Input
              className="w-5/12 rounded-xl"
              name="job_title"
              size="large"
              value={localUser.job_title}
              onChange={(e) => handleOnChange(e)}
              onBlur={(e) => handleOnBlur(e)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YourProfile;
