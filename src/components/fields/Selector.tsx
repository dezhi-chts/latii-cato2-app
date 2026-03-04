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
};

const Selector = ({
  name,
  required,
  hint_text = "",
  options = [],
  onChange,
  value,
}: SelectorProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <Select
        defaultValue={value}
        placeholder={hint_text}
        className="max-w-80"
        options={options}
        onChange={onChange}
      />
    </div>
  );
};

export default Selector;
