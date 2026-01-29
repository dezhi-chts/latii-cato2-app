import { Select } from "antd";
import RequiredHint from "./RequiredHint";
import { formatLabel } from "@/lib/functions";

type SelectorProps = {
  name: string;
  required: boolean;
  hint_text?: string;
  options?: string[];
  onChange?: () => void;
};

const Selector = ({
  name,
  required,
  hint_text = "",
  options = [],
  onChange,
}: SelectorProps) => {
  const inputTypeOptions = options.map((t) => ({
    value: t,
    label: formatLabel(t),
  }));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <Select
        placeholder={hint_text}
        className="max-w-80"
        options={inputTypeOptions}
        onChange={onChange}
      />
    </div>
  );
};

export default Selector;
