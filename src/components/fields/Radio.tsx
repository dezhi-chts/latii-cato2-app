import { getTitleFromPropertyName } from "@/lib/functions";
import { Radio as AntRadio } from "antd";

type RadioProps = {
  options: string[];
  value?: string[];
  onChange?: () => void;
};

const Radio = ({ options, value, onChange }: RadioProps) => {
  const mappedOptions = options?.map((option) => ({
    label: getTitleFromPropertyName(option),
    value: option,
  }));

  return (
    <div className="max-w-80 overflow-auto">
      <AntRadio.Group
        className="flex gap-2"
        options={mappedOptions}
        onChange={onChange}
        value={value}
      />
    </div>
  );
};

export default Radio;
