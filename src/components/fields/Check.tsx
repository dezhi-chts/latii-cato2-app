import { getTitleFromPropertyName } from "@/lib/functions";
import { Checkbox as AntCheckbox } from "antd";

type CheckboxProps = {
  options: string[];
  value?: string[];
  onChange?: () => void;
};

const Checkbox = ({ options, value, onChange }: CheckboxProps) => {
  const mappedOptions = options?.map((option) => ({
    label: getTitleFromPropertyName(option),
    value: option,
  }));

  return (
    <div className="max-w-80 max-h-36 overflow-auto">
      <AntCheckbox.Group
        className="flex flex-col gap-2"
        options={mappedOptions}
        onChange={onChange}
        value={value}
      />
    </div>
  );
};

export default Checkbox;
