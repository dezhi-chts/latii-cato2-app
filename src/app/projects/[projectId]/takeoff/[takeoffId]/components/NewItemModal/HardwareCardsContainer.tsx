/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect } from "react";
import HardwareCard from "./CustomCards/HardwareCard";

const HandleButton = ({
  option,
  isSelected = false,
  handleSelectChange,
  index,
}: {
  option: any;
  isSelected?: boolean;
  handleSelectChange: any;
  index: number;
}) => {
  return (
    <div
      className={`w-60 h-14 flex items-center justify-center rounded-xl border ${
        isSelected ? "border-kahuBlue" : "border-primaryN30 hover:border-none"
      }  hover:bg-primaryN10 cursor-pointer bg-white `}
      onClick={() => {
        !isSelected &&
          handleSelectChange(
            option.value,
            index,
            "hardware_handle_style",
            true,
          );
      }}
    >
      <p className="text-grey-normal font-semibold">{option.text}</p>
    </div>
  );
};

const HardwareCardsContainer = ({
  item,
  index,
  handleSelectChange,
  toggleSelectedOption,
  handleMultipleChanges,
}: any) => {
  const options = item?.units?.find(
    (unit: any) => unit?.hardware_handle_style?.options?.length > 0,
  )?.hardware_handle_style?.options;
  console.log(options);

  return (
    <div className="flex gap-10">
      <div className="flex flex-col gap-4">
        {options?.map((option: any, i: number) => (
          <HandleButton
            key={i}
            option={option}
            isSelected={
              item?.units[0]?.hardware_handle_style?.selected_value ===
              option?.value
            }
            handleSelectChange={handleSelectChange}
            index={index}
          />
        ))}
      </div>
      <div>
        <HardwareCard
          handleSelectChange={handleSelectChange}
          item={item}
          index={index}
          selectedCategory={
            item?.units[0]?.hardware_handle_style?.selected_value
          }
          handleMultipleChanges={handleMultipleChanges}
          toggleSelectedOption={toggleSelectedOption}
        />
      </div>
    </div>
  );
};

export default HardwareCardsContainer;
