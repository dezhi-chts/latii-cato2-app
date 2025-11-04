"use client";

import { Input } from "antd";

type Props = {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isError?: boolean;
};

const PasswordInputField = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  isError,
}: Props) => {
  return (
    <div className="ml-1 flex flex-col gap-1">
      <label htmlFor={name} className="text-primaryN900 font-semibold">
        {label}
      </label>
      <Input.Password
        id={name}
        name={name}
        placeholder={placeholder}
        className="rounded-xl"
        value={value}
        onChange={onChange}
        status={isError ? "error" : undefined}
      />
    </div>
  );
};

export default PasswordInputField;
