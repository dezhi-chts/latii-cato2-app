"use client";

import { DatePicker } from "antd";
import RequiredHint from "./RequiredHint";

type DateInputProps = {
  name: string;
  required: boolean;
  hint_text?: string;
  value?: string;
  onChange?: () => void;
};

const DateInput = ({
  name,
  required,
  hint_text = "",
  value,
  onChange,
}: DateInputProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <DatePicker
        onChange={onChange}
        value={value}
        placeholder={hint_text}
        className="max-w-80"
      />
    </div>
  );
};

export default DateInput;
