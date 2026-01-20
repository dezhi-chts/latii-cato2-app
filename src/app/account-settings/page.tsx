"use client";

import { useUser } from "@/context/UserContext";
import {
  ConfigProvider,
  Divider,
  Input,
  notification,
  Popover,
  Spin,
  Tabs,
  TabsProps,
} from "antd";
import Button from "@/components/Button";
import { useEffect, useState } from "react";
import { changePassword } from "@/services/userService";
import { passwordChangeData } from "@/types/user";
import YourProfile from "./components/YourProfile";
import TeamMembers from "./components/TeamMembers";

const AccountSettings = () => {
  /*   const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isPasswordValid = (password: string) => password.length >= 6;

  const validatePasswords = () => {
    let message = "";

    if (!currentPassword) {
      message = "Please enter your current password.";
    } else if (!isPasswordValid(newPassword)) {
      message = "Your new password must be at least 6 characters long.";
    } else if (newPassword !== confirmPassword) {
      message = "Your new passwords do not match.";
    }

    setErrorMessage(message);
    return !message;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) return;

    setLoading(true);
    const body: passwordChangeData = {
      current_password: currentPassword,
      new_password: newPassword,
    };

    const response = await changePassword(body);

    setLoading(false);

    if (response.status === "success") {
      notification.success({
        message: "Password updated",
        description: "Your password has been changed successfully.",
        duration: 5,
      });
    } else {
      let errorMessage = "Something went wrong while changing your password.";
      const detail =
        response?.data?.detail || response?.data?.response?.data?.detail;
      if (detail) {
        errorMessage = detail;
      }
      notification.error({
        message: "Error",
        description: errorMessage,
        duration: 5,
      });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorMessage("");
  };

  useEffect(() => {
    validatePasswords();
  }, [currentPassword, newPassword, confirmPassword]);

  const areInputsValid =
    currentPassword && newPassword && confirmPassword && !errorMessage;
 */
  const { isAdmin } = useUser();
  const onChange = (key: string) => {
    console.log(key);
  };

  const itemsAdmin: TabsProps["items"] = [
    {
      key: "1",
      label: "Your Profile",
      children: <YourProfile />,
    },
    {
      key: "2",
      label: "Team Management",
      children: <TeamMembers />,
    },
  ];

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Your Profile",
      children: <YourProfile />,
    },
  ];
  return (
    <div className="pl-32 mt-10 flex flex-col gap-4 w-full zoomed-container">
      <div className="flex flex-col gap-1">
        <p className="text-lg text-forumBlue">Account Preferences</p>
        <p className="text-xxs text-basicGray">
          Manage your data and your team members, privacy and security.
        </p>
      </div>

      <ConfigProvider
        theme={{
          components: {
            Tabs: {
              inkBarColor: "#555555",
              itemSelectedColor: "#555555",
              itemColor: "#A3A3A3",
              itemHoverColor: "#555555",
            },
          },
        }}
      >
        <Tabs
          className="[&_.ant-tabs-tab]:w-36 [&_.ant-tabs-tab]:justify-center"
          defaultActiveKey="1"
          items={isAdmin ? itemsAdmin : items}
          onChange={onChange}
        />
      </ConfigProvider>
    </div>
  );
};

export default AccountSettings;
