import { Select } from "antd";
import RequiredHint from "./RequiredHint";
import { Option } from "@/types/project";

type SelectorProps = {
  name: string;
  required: boolean;
  hint_text?: string;
  options?: Option[];
  onChange?: () => void;
  value?: string;
  is_multiple?: boolean;
};

const Selector = ({
  name,
  required,
  hint_text = "",
  options = [],
  onChange,
  value,
  is_multiple = false,
}: SelectorProps) => {
  const tryToParseValue = (value: any) => {
    try {
      const newValue = JSON.parse(value);
      if (Array.isArray(newValue)) {
        return newValue;
      }
    } catch (error) {
      return value;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <Select
        mode={is_multiple ? "multiple" : undefined}
        value={tryToParseValue(value)}
        placeholder={hint_text}
        className="max-w-80"
        options={options}
        onChange={onChange}
      />
    </div>
  );
};

export default Selector;
