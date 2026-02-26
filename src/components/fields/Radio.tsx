import { Option } from "@/types/project";
import { Radio as AntRadio } from "antd";

type RadioProps = {
  options: Option[];
  onChange?: () => void;
};

const Radio = ({ options, onChange }: RadioProps) => {
  return (
    <div className="max-w-80 overflow-auto">
      <AntRadio.Group
        className="flex gap-2"
        options={options}
        onChange={onChange}
        defaultValue={options[0].value}
      />
    </div>
  );
};

export default Radio;
