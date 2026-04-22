"use client";

import Button from "@/components/Button";
import { useUser } from "@/context/UserContext";
import { getContactByKeycloakUser } from "@/services/contactsService";
import { updateUser } from "@/services/userService";
import { UserDataForUpdate } from "@/types/user";
import { Input, notification } from "antd";
import { useEffect, useState } from "react";
import PasswordForm from "./PasswordForm";

const YourProfile = () => {
  const { first_name, last_name, email, company, changeUser } = useUser();

  const [localUser, setLocalUser] = useState<UserDataForUpdate>({
    first_name: first_name,
    last_name: last_name,
    email: email,
    current_password: "",
    new_password: "",
    job_title: "",
  });
  const [job_title, setJobTitle] = useState("");

  const fetchUser = async () => {
    const response = await getContactByKeycloakUser();
    if (response.status === "success") {
      setLocalUser((prev) => ({
        ...prev,
        job_title: response.data.data.job_title,
      }));
      setJobTitle(response.data.data.job_title);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    setLocalUser((prev) => ({
      ...prev,
      first_name: first_name,
      last_name: last_name,
      email: email,
    }));
  }, [first_name, last_name, email]);

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
    if (field === "first_name") {
      return first_name !== value;
    }
    if (field === "last_name") {
      return last_name !== value;
    }
    if (field === "email") {
      return email !== value;
    }
    if (field === "job_title") {
      return job_title !== value;
    }
    return false;
  };

  return (
    <div className="pt-10 pl-16 flex flex-col gap-12 max-w-[1200px] w-full">
      <div className="flex w-full">
        <div className="flex flex-col gap-5 w-1/2">
          <p className="text-grey-normal text-base">General Information</p>
          <div className="flex flex-col gap-8 w-full">
            <div className="flex gap-6 w-full items-center">
              <p className="w-3/12 text-sm">
                First Name <span className="text-accentRed">*</span>
              </p>
              <Input
                className="w-7/12 rounded-xl"
                name="first_name"
                size="large"
                value={localUser.first_name}
                onChange={(e) => handleOnChange(e)}
                onBlur={(e) => handleOnBlur(e)}
              />
            </div>
            <div className="flex gap-6 w-full items-center">
              <p className="w-3/12 text-sm">
                Last Name <span className="text-accentRed">*</span>
              </p>
              <Input
                className="w-7/12 rounded-xl"
                name="last_name"
                size="large"
                value={localUser.last_name}
                onChange={(e) => handleOnChange(e)}
                onBlur={(e) => handleOnBlur(e)}
              />
            </div>
            <div className="flex gap-6 w-full items-center">
              <p className="w-3/12 text-sm">
                Email <span className="text-accentRed">*</span>
              </p>
              <Input
                className="w-7/12 rounded-xl"
                name="email"
                size="large"
                value={localUser.email}
                onChange={(e) => handleOnChange(e)}
                onBlur={(e) => handleOnBlur(e)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-5 w-1/2">
          <p className="text-grey-normal text-base">Company Information</p>
          <div className="flex flex-col gap-8 w-full">
            <div className="flex gap-6 w-full items-center">
              <p className="w-3/12 text-sm">Company</p>
              <Input
                className="w-7/12 rounded-xl"
                name="company_name"
                size="large"
                value={company}
                disabled
              />
            </div>
            <div className="flex flex-col gap-8 w-full">
              <div className="flex gap-6 w-full items-center">
                <p className="w-3/12 text-sm">Role</p>
                <Input
                  className="w-7/12 rounded-xl"
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
      </div>
      <PasswordForm />
    </div>
  );
};

export default YourProfile;
