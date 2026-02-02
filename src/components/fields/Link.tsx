import { Button, Input, Space } from "antd";
import RequiredHint from "./RequiredHint";
import Image from "next/image";

type LinkProps = {
  name: string;
  required: boolean;
  hint_text?: string;
  value?: string;
  onBlur?: () => void;
};

const Weblink = ({
  name,
  required,
  hint_text = "",
  value,
  onBlur,
}: LinkProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <Space.Compact style={{ width: "100%" }} className="max-w-80">
        <Input defaultValue={value} placeholder={hint_text} onBlur={onBlur} />
        <Button onClick={() => window.open(value, "_blank")} className="px-1">
          <Image
            src="/assets/icons/fields/link_light.svg"
            alt="Link"
            width={24}
            height={24}
          />
        </Button>
      </Space.Compact>
    </div>
  );
};

export default Weblink;
