/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Image from "next/image";
import Card from "../Card";
import { CardProps } from "../types";
import { Radio, Skeleton } from "antd";
import { useState } from "react";
import { sanitizeNameForFile } from "@/lib/functions";

const GlassCard = ({
  card,
  toggleSelectedOption,
  section,
  selectedValue,
  item,
  handleSelectChange,
  index,
}: CardProps) => {
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  const imgSrc = `/assets/item-customization/glass/${sanitizeNameForFile(
    card.text
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
      <div className="flex items-center flex-col gap-4 h-full">
        <div className="relative flex justify-center items-center w-full">
          {isLoadingImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <Skeleton.Image active style={{ width: 256, height: 64 }} />
            </div>
          )}
          <Image
            src={imgSrc}
            alt="Card Image"
            width={256}
            height={64}
            onLoadingComplete={() => setIsLoadingImage(false)}
            className={`${
              isLoadingImage ? "opacity-0" : "opacity-100"
            } transition-opacity duration-300`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-base text-basicGray text-center">
            {card.text}
          </p>
          <p className="text-xs text-basicLightGray text-start">
            {card.details}
          </p>
        </div>
        {card.value === selectedValue && (
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2 w-full items-start">
              <p className="text-xs text-basicGray font-semibold">Glazing</p>
              <div>
                <Radio.Group
                  className="gap-2 flex flex-wrap justify-start gap-y-3"
                  value={item?.glass_specification.selected_value}
                  onChange={(e) => {
                    handleSelectChange(
                      e.target.value,
                      index,
                      "glass_specification",
                      false
                    );
                  }}
                >
                  {item?.glass_specification.options.map(
                    ({ value, text }: any) => (
                      <Radio
                        key={value}
                        value={value}
                        className="text-xs text-basicGray px-1"
                      >
                        {text}
                      </Radio>
                    )
                  )}
                </Radio.Group>
              </div>
            </div>
            {Boolean(item?.glass_air_type.options.length) && (
              <div className="flex flex-col gap-2 w-full items-start">
                <p className="text-xs text-basicGray font-semibold">Spacer</p>
                <div>
                  <Radio.Group
                    className="px-1 mb-2"
                    value={item?.glass_air_type.selected_value}
                    onChange={(e) => {
                      handleSelectChange(
                        e.target.value,
                        index,
                        "glass_air_type",
                        false
                      );
                    }}
                  >
                    {item?.glass_air_type.options.map(
                      ({ value, text }: any) => (
                        <Radio
                          key={value}
                          value={value}
                          className="text-xs text-basicGray px-1"
                        >
                          {text}
                        </Radio>
                      )
                    )}
                  </Radio.Group>
                </div>
              </div>
            )}
            {/* Glass Energy Rating hidden for now   
          <div className="w-full flex flex-col items-start gap-3">
              <p className="text-basicGray font-semibold text-xs">
                Glass Energy Rating
              </p>
              <div className="flex w-full justify-center">
                <div className="flex flex-col rounded-lg overflow-hidden border-primaryN30 border-2 text-basicGray text-xs w-5/6">
                  <div className="flex bg-primaryN30 pt-0.5 pb-1">
                    <p className="w-1/3">VLT (%)</p>
                    <p className="w-1/3">SGHGC</p>
                    <p className="w-1/3">U-Factor</p>
                  </div>
                  <div className="flex">
                    <p className="w-1/3 border-r-2 border-primaryN30 pt-1 pb-0.5">
                      {item?.energy_rating_vlt || 0}
                    </p>
                    <p className="w-1/3 border-r-2 border-primaryN30 pt-1 pb-0.5">
                      {item?.energy_rating_sghgc || 0}
                    </p>
                    <p className="w-1/3 pt-1 pb-0.5">
                      {item?.energy_rating_u_factor || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        )}
      </div>
    </Card>
  );
};

export default GlassCard;
