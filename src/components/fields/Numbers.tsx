"use client";

import { InputNumber } from "antd";
import RequiredHint from "./RequiredHint";

type NumbersProps = {
  name: string;
  required: boolean;
  hint_text?: string;
  value?: string;
  onBlur?: () => void;
  onChange?: (e: any) => void;
};

const Numbers = ({
  name,
  required,
  hint_text = "",
  value,
  onBlur,
  onChange,
}: NumbersProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <InputNumber
        placeholder={hint_text}
        className="w-full max-w-80"
        value={value}
        onBlur={onBlur}
        onChange={onChange}
        controls={false}
      />
    </div>
  );
};

export default Numbers;
