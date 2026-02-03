"use client";

import { InputNumber } from "antd";
import RequiredHint from "./RequiredHint";

type NumbersProps = {
  name: string;
  required: boolean;
  hint_text?: string;
  value?: string;
  onBlur?: () => void;
};

const Numbers = ({
  name,
  required,
  hint_text = "",
  value,
  onBlur,
}: NumbersProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <InputNumber
        placeholder={hint_text}
        className="min-w-80 max-w-80"
        value={value}
        onBlur={onBlur}
        controls={false}
      />
    </div>
  );
};

export default Numbers;
