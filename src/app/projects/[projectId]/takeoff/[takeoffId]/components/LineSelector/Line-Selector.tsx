import { Divider, Popover } from "antd";
import Image from "next/image";
import { LineSelectorProps } from "../../types/item";
import HoverCard from "./Hover-Card";

const LineSelector = ({
  productLine,
  index,
  onSelectChange,
  lineSelectorStatus,
}: LineSelectorProps) => {
  return (
    <div className="w-full h-20 border-2 border-primaryN20 rounded-xl overflow-hidden flex items-center justify-between">
      <Popover
        content={
          lineSelectorStatus === "enabled" ? (
            <HoverCard brand="BELLAVISTA-Steel" />
          ) : null
        }
        placement="bottom"
        trigger="hover"
        styles={{ body: { padding: 0, boxShadow: "none" } }}
      >
        <div
          className={`flex items-center justify-center w-1/2 h-full ${
            lineSelectorStatus !== "enabled"
              ? "bg-white"
              : productLine === "BELLAVISTA-Steel"
              ? "bg-primaryN20"
              : "bg-white hover:bg-primaryN20 cursor-pointer"
          }
          `}
          onClick={() => {
            lineSelectorStatus === "enabled" &&
              onSelectChange(
                "BELLAVISTA-Steel",
                index,
                "frame_material",
                false
              );
          }}
        >
          <Image
            src="/assets/logos/bellavista-logo.svg"
            alt="bellavista logo"
            width={117}
            height={20}
          />
        </div>
      </Popover>
      <Divider type="vertical" className="m-0 h-20 bg-primaryN20" />
      <Popover
        content={
          lineSelectorStatus === "enabled" ? (
            <HoverCard brand="Spazio-Aluminum" />
          ) : null
        }
        placement="bottom"
        trigger="hover"
        styles={{ body: { padding: 0, boxShadow: "none" } }}
      >
        <div
          className={`flex items-center justify-center w-1/2 h-full ${
            lineSelectorStatus !== "enabled"
              ? "bg-white"
              : productLine === "Spazio-Aluminum"
              ? "bg-primaryN20"
              : "bg-white hover:bg-primaryN20 cursor-pointer"
          }
          `}
          onClick={() =>
            lineSelectorStatus === "enabled" &&
            onSelectChange("Spazio-Aluminum", index, "frame_material", false)
          }
        >
          <Image
            src="/assets/logos/spazio-logo.svg"
            alt="spazio logo"
            width={73}
            height={18}
          />
        </div>
      </Popover>
    </div>
  );
};

export default LineSelector;
