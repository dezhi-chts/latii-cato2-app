"use client";

import Button from "@/components/Button";
import { useUser } from "@/context/UserContext";
import { createContact } from "@/services/contactsService";
import { Contact } from "@/types/user";
import { Input, notification, Spin } from "antd";
import { useEffect, useState } from "react";

export const NAME_ONLY_REGEX = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g;

type PasswordErrors = {
  message: string;
  code: "min_length" | "case" | "number";
  is_valid: boolean;
};

const initialPasswordErrors: PasswordErrors[] = [
  {
    message: "Include lower and upper case characters.",
    code: "case",
    is_valid: false,
  },
  {
    message: "Include at least one number or symbol.",
    code: "number",
    is_valid: false,
  },
  {
    message: "Be at least 8 characters long.",
    code: "min_length",
    is_valid: false,
  },
];

const validatePassword = (password: string): PasswordErrors[] => {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumberOrSymbol = /[\d\W]/.test(password);

  return [
    {
      message: "Include lower and upper case characters.",
      code: "case",
      is_valid: hasUpper && hasLower,
    },
    {
      message: "Include at least one number or symbol.",
      code: "number",
      is_valid: hasNumberOrSymbol,
    },
    {
      message: "Be at least 8 characters long.",
      code: "min_length",
      is_valid: hasMinLength,
    },
  ];
};

const checkValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const NewUserForm = ({ refreshContacts }: { refreshContacts: () => void }) => {
  const { company_id = 0 } = useUser();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    role: "",
    email: "",
    password: "",
  });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [touchedEmail, setTouchedEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors[]>([
    ...initialPasswordErrors,
  ]);

  const [disabledButton, setDisabledButton] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "email" && !touchedEmail) {
      setTouchedEmail(true);
    }

    const newValue =
      name === "first_name" || name === "last_name"
        ? value.replace(NAME_ONLY_REGEX, "")
        : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));
  };

  const resetForm = () => {
    setForm({
      first_name: "",
      last_name: "",
      role: "",
      email: "",
      password: "",
    });
    setTouchedEmail(false);
    setEmailError("");
    setPasswordErrors([...initialPasswordErrors]);
    setDisabledButton(true);
  };

  const handleCreateContact = async () => {
    setIsLoading(true);
    try {
      const mappedForm: Contact = {
        name: `${form.first_name} ${form.last_name}`.trim(),
        email: form.email,
        phone: "",
        job_title: form.role,
        company_id: company_id,
        password: form.password,
      };

      const response = await createContact({
        company_id: company_id,
        contact_data: mappedForm,
      });
      setIsLoading(false);

      if (response.status === "success") {
        notification.success({ message: "Contact created successfully" });
        resetForm();
        refreshContacts();
        return;
      }

      notification.error({
        message: "Error creating contact",
        description: `${
          response?.data?.response?.data?.detail || "Unknown error"
        }`,
      });
    } catch (err: any) {
      setIsLoading(false);
      notification.error({
        message: "Error creating contact",
        description: "Unexpected error creating contact",
      });
    }
  };

  useEffect(() => {
    const newPasswordErrors = validatePassword(form.password);
    setPasswordErrors(newPasswordErrors);

    const passwordErr = newPasswordErrors.some((error) => !error.is_valid);
    const emailErr =
      touchedEmail && form.email
        ? checkValidEmail(form.email)
          ? ""
          : "Invalid email format"
        : "";

    setEmailError(emailErr);

    const requiredOk = Boolean(
      form.first_name && form.last_name && form.email && form.password,
    );

    const hasErrors = Boolean(emailErr || passwordErr);
    setDisabledButton(!requiredOk || hasErrors);
  }, [form, touchedEmail]);

  const areTherePasswordErrors = Object.values(passwordErrors).some(
    (error) => !error.is_valid,
  );

  return (
    <div className="w-full flex flex-col gap-6 pt-10 pl-12">
      <p className="text-forumBlue-normal text-base">Add New User</p>

      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm">
          First Name <span className="text-accentRed">*</span>
        </p>
        <Input
          className="w-9/12 rounded-xl"
          name="first_name"
          size="large"
          value={form.first_name}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm">
          Last Name <span className="text-accentRed">*</span>
        </p>
        <Input
          className="w-9/12 rounded-xl"
          name="last_name"
          size="large"
          value={form.last_name}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm">Role</p>
        <Input
          className="w-9/12 rounded-xl"
          name="role"
          size="large"
          value={form.role}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm">
          Email <span className="text-accentRed">*</span>
        </p>
        <Input
          className="w-9/12 rounded-xl"
          name="email"
          size="large"
          value={form.email}
          onChange={handleChange}
        />
        <p className="text-accentRed h-1">{emailError}</p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm">
          Password <span className="text-accentRed">*</span>
        </p>
        <Input.Password
          className="w-9/12 rounded-xl"
          name="password"
          size="large"
          value={form.password}
          onChange={handleChange}
          onFocus={() => setIsPasswordFocused(true)}
          // onBlur={() => setIsPasswordFocused(false)}
        />
        <ul
          className={`list-disc pl-5 ${isPasswordFocused && areTherePasswordErrors ? "" : "opacity-0"}`}
        >
          {passwordErrors.map((error, index) => {
            const isValid = error.is_valid;
            const color = isValid ? "text-green-normal" : "text-grey-normal";
            return (
              <li key={index} className={`${color}`}>
                <p className="text-xs">{error.message}</p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex justify-end w-9/12">
        <Button
          backgroundColor="forumBlue-normal"
          onClick={handleCreateContact}
          disabled={disabledButton || isLoading}
          className="rounded-md w-28"
        >
          {isLoading ? <Spin /> : "Create"}
        </Button>
      </div>
    </div>
  );
};

export default NewUserForm;
