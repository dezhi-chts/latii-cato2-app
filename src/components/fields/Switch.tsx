import { Switch as AntSwitch } from "antd";

type SwitchProps = {
  name: string;
  hint_text?: string;
  value?: string;
  onChange?: () => void;
};

const Switch = ({ name, hint_text = "", value, onChange }: SwitchProps) => {
  return (
    <div className="max-w-80">
      <div className="flex gap-2 items-center">
        <p className="text-sm">{name || hint_text}</p>
        <AntSwitch onChange={onChange} checked={!!value} />
      </div>
    </div>
  );
};

export default Switch;
