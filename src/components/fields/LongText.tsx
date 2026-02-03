import { Input } from "antd";
import RequiredHint from "./RequiredHint";

type LongTextProps = {
  name: string;
  required: boolean;
  hint_text?: string;
  value?: string;
  onBlur?: () => void;
};

const LongText = ({
  name,
  required,
  hint_text = "",
  value,
  onBlur,
}: LongTextProps) => {
  const { TextArea } = Input;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <div className="max-w-80">
        <TextArea
          rows={4}
          placeholder={hint_text}
          value={value}
          onBlur={onBlur}
          style={{
            resize: "none",
          }}
        />
      </div>
    </div>
  );
};

export default LongText;
