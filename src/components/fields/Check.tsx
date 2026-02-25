import { Option } from "@/types/project";
import { Checkbox as AntCheckbox } from "antd";

type CheckboxProps = {
  options: Option[];
  value?: string[];
  onChange?: () => void;
};

const Checkbox = ({ options, value, onChange }: CheckboxProps) => {
  console.log(options);
  return (
    <div className="max-w-80 max-h-36 overflow-auto">
      <AntCheckbox.Group
        className="flex flex-col gap-2"
        options={options}
        onChange={onChange}
        value={value}
      />
    </div>
  );
};

export default Checkbox;
