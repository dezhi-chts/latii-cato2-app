"use client";

import { DatePicker } from "antd";
import RequiredHint from "./RequiredHint";

type DateInputProps = {
  name: string;
  required: boolean;
  is_ranged_date: boolean;
  hint_text?: string;
  value?: string;
  onChange?: () => void;
};

const DateInput = ({
  name,
  required,
  hint_text = "",
  value,
  is_ranged_date = false,
  onChange,
}: DateInputProps) => {
  const { RangePicker } = DatePicker;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      {is_ranged_date ? (
        <RangePicker onChange={onChange} className="max-w-80" />
      ) : (
        <DatePicker
          onChange={onChange}
          value={value}
          placeholder={hint_text}
          className="max-w-80"
        />
      )}
    </div>
  );
};

export default DateInput;
