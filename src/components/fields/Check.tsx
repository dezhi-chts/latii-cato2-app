import { Option } from "@/types/project";
import { Checkbox as AntCheckbox } from "antd";
import RequiredHint from "./RequiredHint";

type CheckboxProps = {
  name: string;
  options: Option[];
  value?: string[];
  onChange?: () => void;
  required: boolean;
};

const Checkbox = ({
  options,
  value,
  onChange,
  name,
  required,
}: CheckboxProps) => {
  console.log(value);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <div className="max-w-80 max-h-36 overflow-auto">
        <AntCheckbox.Group
          className="flex flex-col gap-2"
          options={options}
          onChange={onChange}
          value={value}
        />
      </div>
    </div>
  );
};

export default Checkbox;
