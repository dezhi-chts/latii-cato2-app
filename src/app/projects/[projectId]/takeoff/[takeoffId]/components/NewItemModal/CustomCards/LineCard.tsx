import Image from "next/image";
import Card from "../Card";
import { CardProps } from "../types";
import { sanitizeNameForFile } from "@/lib/functions";
import { useState } from "react";
import { getDescriptionFromKey } from "./cardsDescriptions";

const LineCard = ({
  card,
  toggleSelectedOption,
  section,
  selectedValue,
}: CardProps) => {
  const imgSrc = `/assets/item-customization/line/${sanitizeNameForFile(
    card.text,
  )}.webp`;

  const handleSelectedOptionChange = () => {
    if (card.value === selectedValue) return;
    toggleSelectedOption(section, card?.value);
  };

  return (
    <Card
      size={"large"}
      isSelected={card.value === selectedValue}
      onClick={handleSelectedOptionChange}
    >
      <div className="flex items-center flex-col justify-around h-full">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-center">
            <Image src={imgSrc} alt="Card Image" width={86} height={86} />
          </div>
          <div className="text-grey-normal">
            <p className="font-semibold">{card?.text}</p>
          </div>
        </div>
        <div className="h-32">
          <p className="text-basicLightGray ">
            {getDescriptionFromKey(card.text) || card.text}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default LineCard;
