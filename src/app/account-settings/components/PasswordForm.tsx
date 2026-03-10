import Button from "@/components/Button";
import { changePassword } from "@/services/userService";
import { PasswordChangeData } from "@/types/user";
import { Input, notification, Tooltip } from "antd";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type PasswordFields = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const INITIAL_PASSWORD_FIELDS: PasswordFields = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const PasswordForm = () => {
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordFields, setPasswordFields] = useState<PasswordFields>(
    INITIAL_PASSWORD_FIELDS,
  );

  useEffect(() => {
    if (!isEditingPassword) {
      setPasswordFields(INITIAL_PASSWORD_FIELDS);
    }
  }, [isEditingPassword]);

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setPasswordFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const hasValidPasswordFormat = (password: string) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumberOrSymbol = /[\d\W]/.test(password);

    return hasUppercase && hasLowercase && hasNumberOrSymbol;
  };

  const confirmButtonErrorMessage = useMemo(() => {
    const { currentPassword, newPassword, confirmPassword } = passwordFields;

    if (!currentPassword) {
      return "Current password is required";
    }

    if (!newPassword) {
      return "New password is required";
    }

    if (!confirmPassword) {
      return "Please confirm your new password";
    }

    if (newPassword.length < 8) {
      return "Password must be at least 8 characters long";
    }

    if (!hasValidPasswordFormat(newPassword)) {
      return "Password must include at least one number or symbol, and both lower and upper case characters";
    }

    if (newPassword !== confirmPassword) {
      return "Passwords do not match";
    }

    if (currentPassword === newPassword) {
      return "New password must be different from current password";
    }

    return "";
  }, [passwordFields]);

  const isConfirmDisabled = !!confirmButtonErrorMessage;

  const handleStartPasswordReset = () => {
    setIsEditingPassword(true);
  };

  const handleCancelPasswordReset = () => {
    setIsEditingPassword(false);
  };

  const handleConfirmPasswordReset = async () => {
    if (isConfirmDisabled) return;

    const payload: PasswordChangeData = {
      new_password: passwordFields.newPassword,
      current_password: passwordFields.currentPassword,
    };

    const response = await changePassword(payload);

    if (response.status === "success") {
      notification.success({
        message: "Success",
        description: "Password has been changed successfully",
      });
      setIsEditingPassword(false);
    } else {
      notification.error({
        message: "There was an error",
        description: "Password could not be changed. Please try again.",
      });
    }
  };

  return (
    <div className="flex w-1/2 flex-col gap-5">
      <p className="text-base text-grey-normal">Password Security</p>

      <div className="flex flex-col gap-1">
        <div className="flex w-full items-center gap-6">
          <p className="w-3/12 text-sm">Current Password</p>
          <Input.Password
            className="w-7/12 rounded-xl"
            name="currentPassword"
            size="large"
            value={passwordFields.currentPassword}
            onChange={handleFieldChange}
          />
        </div>
      </div>

      <div
        className={`flex w-full items-center gap-6 ${
          isEditingPassword ? "" : "hidden"
        }`}
      >
        <p className="w-3/12 text-sm">New Password</p>
        <Input.Password
          className="w-7/12 rounded-xl"
          name="newPassword"
          size="large"
          value={passwordFields.newPassword}
          onChange={handleFieldChange}
        />
      </div>

      <div
        className={`flex w-full items-center gap-6 ${
          isEditingPassword ? "" : "hidden"
        }`}
      >
        <p className="w-3/12 text-sm">Confirm Password</p>
        <Input.Password
          className="w-7/12 rounded-xl"
          name="confirmPassword"
          size="large"
          value={passwordFields.confirmPassword}
          onChange={handleFieldChange}
        />
      </div>

      <div className="flex justify-start gap-6 -mt-4">
        <div className="w-3/12" />
        <div className="flex w-7/12 justify-end">
          {isEditingPassword ? (
            <div className="mt-3 flex gap-2">
              <Button
                backgroundColor="primaryN30"
                color="black"
                className="rounded-md"
                onClick={handleCancelPasswordReset}
              >
                Cancel
              </Button>

              <Tooltip
                title={isConfirmDisabled ? confirmButtonErrorMessage : ""}
              >
                <div>
                  <Button
                    backgroundColor="forumBlue-normal"
                    className={`rounded-md ${
                      isConfirmDisabled ? "cursor-not-allowed opacity-60" : ""
                    }`}
                    onClick={handleConfirmPasswordReset}
                    disabled={isConfirmDisabled}
                  >
                    Confirm
                  </Button>
                </div>
              </Tooltip>
            </div>
          ) : (
            <p
              className="cursor-pointer text-end text-xs text-forumBlue-normal hover:opacity-80 active:opacity-70"
              onClick={handleStartPasswordReset}
            >
              Reset Password
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordForm;
