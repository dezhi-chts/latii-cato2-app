import { Input } from "antd";
import RequiredHint from "./RequiredHint";
import { text } from "stream/consumers";

type SwitchProps = {
  name: string;
  required: boolean;
  text: string;
  hint_text?: string;
  value?: string;
  onChange?: () => void;
};

const Switch = ({
  name,
  required,
  text,
  hint_text = "",
  value,
  onChange,
}: SwitchProps) => {
  const { TextArea } = Input;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <div className="max-w-80">
        <div className="flex gap-4 items-center">
          <p>{text}</p>
        </div>
      </div>
    </div>
  );
};

export default Switch;
