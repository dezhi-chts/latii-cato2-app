import { Input } from "antd";
import RequiredHint from "./RequiredHint";

type ShortTextProps = {
  name: string;
  required: boolean;
  hint_text?: string;
};

const ShortText = ({ name, required, hint_text = "" }: ShortTextProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <Input placeholder={hint_text} className="max-w-80" />
    </div>
  );
};

export default ShortText;
