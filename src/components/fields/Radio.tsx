import { Option } from "@/types/project";
import { Radio as AntRadio } from "antd";
import RequiredHint from "./RequiredHint";

type RadioProps = {
  options: Option[];
  onChange?: () => void;
  name: string;
  required: boolean;
};

const Radio = ({ options, onChange, name, required }: RadioProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <div className="max-w-80 overflow-auto">
        <AntRadio.Group
          className="flex gap-2"
          options={options}
          onChange={onChange}
          defaultValue={options[0]?.value}
        />
      </div>
    </div>
  );
};

export default Radio;
