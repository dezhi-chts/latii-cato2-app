import { Button, Input, Space } from "antd";
import Image from "next/image";
import RequiredHint from "./RequiredHint";

// To use Location component, use <LocationSelector/> directly. This is only for preview purposes.

type LocationProps = {
  name?: string;
  required: boolean;
  hint_text?: string;
};

const Location = ({ name, required, hint_text = "" }: LocationProps) => {
  return (
    <div className="max-w-80 flex flex-col gap-1">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <Space.Compact style={{ width: "100%" }} className="w-full max-w-80">
        <Input placeholder={hint_text || "State, City, Postal Code, Address"} />
        <Button className="px-1">
          <Image
            src="/assets/icons/fields/location_light.svg"
            alt="Link"
            width={24}
            height={24}
          />
        </Button>
      </Space.Compact>
    </div>
  );
};

export default Location;
