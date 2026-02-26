import { Input } from "antd";
import RequiredHint from "./RequiredHint";

type ShortTextProps = {
  name: string;
  required: boolean;
  hint_text?: string;
  value?: string;
  onBlur?: () => void;
  onChange?: (e: any) => void;
};

const ShortText = ({
  name,
  required,
  hint_text = "",
  value,
  onBlur,
  onChange,
}: ShortTextProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <Input
        placeholder={hint_text}
        className="max-w-80"
        value={value}
        onBlur={onBlur}
        onChange={onChange}
      />
    </div>
  );
};

export default ShortText;
