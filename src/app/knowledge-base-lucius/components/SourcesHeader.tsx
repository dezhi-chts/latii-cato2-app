import { SourcesHeaderProps } from "@/types/sources";
import Image from "next/image";

const SourcesHeader = ({ handleToggle, isOpen }: SourcesHeaderProps) => {
  return (
    <div
      className={`rounded-t-xl p-4 cursor-pointer border-b border-b-primaryN30 flex items-center ${
        isOpen ? "justify-between" : "justify-center"
      }`}
      onClick={handleToggle}
    >
      <p
        className={`text-xs font-light h-2.5 text-grey-normal ${
          isOpen ? "" : "hidden"
        }`}
      >
        Your Sources
      </p>
      <Image
        src="/assets/icons/arrow-left-gray.svg"
        alt="arrow icon"
        width={5}
        height={10}
        className="h-2.5 w-auto"
      />
    </div>
  );
};

export default SourcesHeader;
