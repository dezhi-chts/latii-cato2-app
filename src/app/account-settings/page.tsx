"use client";

import { useUser } from "@/context/UserContext";
import { Divider, Input, notification, Popover, Spin } from "antd";
import Button from "@/components/Button";
import { useEffect, useState } from "react";
import { changePassword } from "@/services/userService";
import { passwordChangeData } from "@/types/user";

const AccountSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
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
      let errorMessage= "Something went wrong while changing your password."
      const detail = response?.data?.detail || response?.data?.response?.data?.detail;
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

  return (
    <div className="pl-32 mt-20 flex flex-col gap-12 text-sm w-full zoomed-container">
      <div className="w-1/2">
        <p className="text-xl text-neutral-900">Account Preferences</p>
        <p>Manage your data, privacy and security.</p>
        <Divider className="bg-primaryN30" />
      </div>

      <div className="flex flex-col gap-6 w-4/6">
        <p className="text-primaryN900 text-base">Password Security</p>

        <div className="flex gap-x-14 pl-10 w-full gap-y-10 flex-col">
          <div className="w-80 flex flex-col gap-1">
            <p>Current password</p>
            <Input.Password
              value={currentPassword}
              placeholder="Enter your current password"
              className="rounded-lg"
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-x-14 gap-y-10 flex-wrap">
            <div className="w-80 flex flex-col gap-1">
              <p>New password</p>
              <Input.Password
                value={newPassword}
                placeholder="Enter a new password"
                className="rounded-lg"
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="w-80 flex flex-col gap-1">
              <p>Confirm new password</p>
              <Input.Password
                value={confirmPassword}
                placeholder="Re-enter your new password"
                className="rounded-lg"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        <Popover content={errorMessage || ""} placement="right">
          <div></div>
          <Button
            className="w-40"
            onClick={handleChangePassword}
            disabled={loading || !areInputsValid}
          >
            {loading ? <Spin /> : "Change Password"}
          </Button>
        </Popover>
      </div>
    </div>
  );
};

export default AccountSettings;
