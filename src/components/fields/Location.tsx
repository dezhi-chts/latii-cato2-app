import { Button, Space } from "antd";
import LocationSelector from "../LocationSelector";
import Image from "next/image";
import RequiredHint from "./RequiredHint";

// To use Location component, use LocationSelector directly. This is only for preview purposes.

type LocationProps = {
  name?: string;
  required: boolean;
};

const Location = ({ name, required }: LocationProps) => {
  return (
    <div className="max-w-80 flex flex-col gap-1">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <Space.Compact style={{ width: "100%" }} className="w-80">
        <LocationSelector
          height="small"
          inputClassName="border-r-0 !w-[calc(20rem-33px)]"
        />
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
