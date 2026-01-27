"use client";

import Button from "@/components/Button";
import { createContact } from "@/services/contactsService";
import { Contact } from "@/types/user";
import { Input, notification, Spin } from "antd";
import { useEffect, useState } from "react";

export const NAME_ONLY_REGEX = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g;

const checkValidPassword = (password: string) => {
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password))
    return "Password must contain at least one lowercase letter";
  if (!/\d/.test(password)) return "Password must contain at least one number";
  return "";
};

const checkValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const NewUserForm = ({ refreshContacts }: { refreshContacts: () => void }) => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    company: "",
    role: "",
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({ email: false, password: false });
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [disabledButton, setDisabledButton] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "email" && !touched.email) {
      setTouched((prev) => ({ ...prev, email: true }));
    }
    if (name === "password" && !touched.password) {
      setTouched((prev) => ({ ...prev, password: true }));
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
      company: "",
      role: "",
      email: "",
      password: "",
    });
    setTouched({ email: false, password: false });
    setEmailError("");
    setPasswordError("");
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
        company_id: 1,
        password: form.password,
      };

      const response = await createContact({
        company_id: 1,
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
    const passwordErr =
      touched.password && form.password
        ? checkValidPassword(form.password)
        : "";

    const emailErr =
      touched.email && form.email
        ? checkValidEmail(form.email)
          ? ""
          : "Invalid email format"
        : "";

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    const requiredOk = Boolean(
      form.first_name && form.last_name && form.email && form.password
    );
    const hasErrors = Boolean(passwordErr || emailErr);

    setDisabledButton(!requiredOk || hasErrors);
  }, [form, touched.email, touched.password]);

  return (
    <div className="w-4/12 flex flex-col gap-6 border-l-2 pt-10 pl-12">
      <p className="text-kahuBlue text-base">New User</p>

      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm">
          First Name <span className="text-accentRed">*</span>
        </p>
        <Input
          className="w-7/12 rounded-xl"
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
          className="w-7/12 rounded-xl"
          name="last_name"
          size="large"
          value={form.last_name}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm">Company</p>
        <Input
          className="w-7/12 rounded-xl"
          name="company"
          size="large"
          value={form.company}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm">Role</p>
        <Input
          className="w-7/12 rounded-xl"
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
          className="w-7/12 rounded-xl"
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
          className="w-7/12 rounded-xl"
          name="password"
          size="large"
          value={form.password}
          onChange={handleChange}
        />
        <p className="text-accentRed h-1">{passwordError}</p>
      </div>

      <div className="flex justify-end w-7/12">
        <Button
          backgroundColor="forumBlue"
          onClick={handleCreateContact}
          disabled={disabledButton || isLoading}
        >
          {isLoading ? <Spin /> : "Create"}
        </Button>
      </div>
    </div>
  );
};

export default NewUserForm;
