import { useCallback, useMemo, useState } from "react";

const validatePassword = (password: string) => {
  return (
    password.length >= 8 &&
    !!password.match(/[A-Z]/) &&
    !!password.match(/[0-9]/)
  );
};

export type Warning = {
  name: string;
  label: string;
  completed: boolean;
};

export const usePasswordForm = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    verifyNewPassword: "",
  });

  const allFieldsFilled =
    formData.currentPassword &&
    formData.newPassword &&
    formData.verifyNewPassword;

  const passwordsMatch = formData.newPassword === formData.verifyNewPassword;

  const isNewPasswordValid = validatePassword(formData.newPassword);

  const isFormValid = allFieldsFilled && passwordsMatch && isNewPasswordValid;

  const newPasswordWarnings = useMemo(() => {
    const hasUppercase: boolean = !!formData.newPassword.match(/[A-Z]/);
    const hasNumber: boolean = !!formData.newPassword.match(/[0-9]/);
    const hasLength: boolean = formData.newPassword.length >= 8;

    const warnings: Warning[] = [
      {
        name: "uppercase",
        label: "Lower and uppercase characters.",
        completed: hasUppercase,
      },
      {
        name: "number",
        label: "At least one number or symbol.",
        completed: hasNumber,
      },
      {
        name: "length",
        label: "Be at least 8 characters long.",
        completed: hasLength,
      },
    ];

    return warnings;
  }, [formData.newPassword]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isFormValid) return;
    console.log("Form data:", formData);
  }, [formData, isFormValid]);

  return {
    formData,
    handleChange,
    handleSubmit,
    isFormValid,
    passwordsMatch,
    isNewPasswordValid,
    newPasswordWarnings,
  };
};
