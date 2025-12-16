import { Input } from "antd";
import { CSSProperties, ElementType, ReactNode } from "react";
import { GlobalOutlined } from "@ant-design/icons";
import Image from "next/image";

type CompanyField = {
  name: string;
  Component: ElementType;
  isObligatory: boolean;
  placeholder?: string;
  className?: string;
  addonAfter?: ReactNode;
  style?: CSSProperties;
  rows?: number;
};

const companyFields: CompanyField[] = [
  {
    name: "Name",
    Component: Input,
    isObligatory: true,
    placeholder: "Input a recognizable name for you.",
    className: "w-[350px]",
  },
  {
    name: "Description",
    Component: Input.TextArea,
    isObligatory: false,
    placeholder: "Any additional notes, descriptions",
    className: "w-[350px]",
    style: { resize: "none" },
    rows: 4,
  },
  {
    name: "Location",
    Component: Input,
    isObligatory: false,
    placeholder: "State, City, Postal Code, Address.",
    className: "w-[350px]",
    addonAfter: (
      <div className="flex items-center justify-center w-4 h-6">
        <Image
          alt="location"
          src="/assets/icons/location.svg"
          width={16}
          height={16}
        />
      </div>
    ),
  },
  {
    name: "Website",
    Component: Input,
    isObligatory: false,
    placeholder: "Website",
    className: "w-[350px]",
    addonAfter: (
      <div className="flex items-center justify-center w-4 h-6">
        <Image
          alt="website"
          src="/assets/icons/website.svg"
          width={16}
          height={16}
        />
      </div>
    ),
  },
  {
    name: "Social Media",
    Component: Input,
    isObligatory: false,
    placeholder: "LinkedIn",
    className: "w-[350px]",
    addonAfter: (
      <div className="flex items-center justify-center w-4 h-6">
        <Image
          alt="Social Media"
          src="/assets/icons/website.svg"
          width={16}
          height={16}
        />
      </div>
    ),
  },
];

const Company = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="w-full flex gap-8 items-center">
        <div className="w-[100px] h-[100px] rounded-full bg-[#E8E8E8]" />
        <p className="text-basicGray">[Company Name]</p>
      </div>
      <div className="w-full flex gap-8">
        <div className="w-[100px]" />
        <div className="flex flex-col gap-10">
          {companyFields.map(
            ({ name, Component, isObligatory, ...inputProps }) => (
              <div key={name} className="flex flex-col gap-2">
                <p className="text-sm">
                  {name}{" "}
                  {isObligatory && <span className="text-accentRed">*</span>}
                </p>

                <Component {...inputProps} />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Company;
