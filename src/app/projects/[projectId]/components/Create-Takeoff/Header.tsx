import { Segmented } from "antd";
import Image from "next/image";
import { TakeOffType } from "./Create-Takeoff-Modal";
import Link from "next/link";

type HeaderProps = {
  selectedTakeOff: TakeOffType;
};

export const Header = ({ selectedTakeOff }: HeaderProps) => {
  return (
    <div className="flex flex-col gap-4 mb-10 mt-4 zoomed-container">
      <Image
        src="/assets/logos/cato-with-text.svg"
        alt="Cato logo"
        width={103}
        height={33}
        className="h-8 w-auto"
      />
      <div className="text-center">
        <Segmented
          value={"base"}
          options={[
            { label: "Base Take Off", value: "base" },
            {
              label: (
                <Link
                  href="https://cato.latii.com/"
                  target="_blank"
                  className="flex items-center gap-2 hover:text-black"
                >
                  Deep Take Off{" "}
                  <span
                    className={`text-white bg-accentIndigo rounded px-2 text-[9px] h-3 flex items-center transition-all duration-500 font-light ${
                      selectedTakeOff === "deep" ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    BETA
                  </span>
                </Link>
              ),
              value: "deep",
            },
          ]}
        />
      </div>
    </div>
  );
};
