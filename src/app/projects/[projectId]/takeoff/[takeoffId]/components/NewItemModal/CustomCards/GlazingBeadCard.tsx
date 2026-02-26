"use client";
import Image from "next/image";
import Card from "../Card";
import { CardProps } from "../types";
import { sanitizeName } from "@/lib/functions";
import { useState } from "react";

const GlazingBeadCard = ({
  card,
  toggleSelectedOption,
  section,
  selectedValue,
}: CardProps) => {
  const imgSrc = `/assets/item-customization/glazing-bead/images/${sanitizeName(
    card.text,
  )}.webp`;

  const iconSrc = `/assets/item-customization/glazing-bead/icons/${sanitizeName(
    card.text,
  )}.webp`;

  const handleSelectedOptionChange = () => {
    if (card.value === selectedValue) return;
    toggleSelectedOption(section, card?.value);
  };

  return (
    <Card
      size={"small"}
      isSelected={card.value === selectedValue}
      onClick={handleSelectedOptionChange}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Image src={iconSrc} alt="Card icon" width={62} height={62} />
          <p className="text-grey-normal font-semibold w-32 text-start">
            {card.text}
          </p>
        </div>
        <div className="flex items-center justify-center">
          <Image src={imgSrc} alt="Card Image" width={112} height={112} />
        </div>
      </div>
    </Card>
  );
};

export default GlazingBeadCard;
