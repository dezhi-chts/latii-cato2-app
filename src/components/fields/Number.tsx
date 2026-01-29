"use client";

import { InputNumber } from "antd";
import RequiredHint from "./RequiredHint";

type NumberProps = {
  name: string;
  required: boolean;
  hint_text?: string;
  value?: string;
  onBlur?: () => void;
};

const Number = ({
  name,
  required,
  hint_text = "",
  value,
  onBlur,
}: NumberProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <InputNumber
        placeholder={hint_text}
        className="max-w-80"
        value={value}
        onBlur={onBlur}
      />
    </div>
  );
};

export default Number;
