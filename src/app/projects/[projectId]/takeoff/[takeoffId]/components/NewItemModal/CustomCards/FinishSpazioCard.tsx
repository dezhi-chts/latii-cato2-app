/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Image from "next/image";
import Card from "../Card";
import { CardProps } from "../types";
import { Popover, Skeleton } from "antd";
import { Key, useEffect, useState } from "react";
import { sanitizeKey, sanitizeName } from "@/lib/functions";
import { getDescriptionFromKey } from "./cardsDescriptions";
import { FinishPopover } from "./HardwareCard";

const FinishSpazioCard = ({
  card,
  toggleSelectedOption,
  selectedValue,
  item,
  section,
  index,
  handleSelectChange,
}: CardProps) => {
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const isSelected = card.value === selectedValue;
  const isPowderCoating = selectedValue === "210";

  const handleSelectedOptionChange = () => {
    if (isSelected) return;
    toggleSelectedOption(section, card?.value);
  };

  const handleFinishColorChange = ({ colorValue }: any) => {
    handleSelectChange(colorValue, index, "color_input", false);
    return;
  };

  return (
    <Card
      size={"large"}
      isSelected={isSelected}
      onClick={handleSelectedOptionChange}
    >
      <div className="flex flex-col h-full w-full gap-4 px-4">
        <div className="relative flex justify-center items-center w-full">
          {isLoadingImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <Skeleton.Image active style={{ width: 216, height: 48 }} />
            </div>
          )}

          <Image
            src={`/assets/item-customization/cortizo/${sanitizeName(
              card.text
            )}.webp`}
            alt="Card Image"
            width={264}
            height={58}
            onLoadingComplete={() => setIsLoadingImage(false)}
            className={`${
              isLoadingImage ? "opacity-0" : "opacity-100"
            } transition-opacity duration-300 h-14 w-full rounded-lg object-cover object-center`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-base text-basicGray text-center">
            {card.text}
          </p>
          <p className="text-xs text-basicLightGray text-start">
            {getDescriptionFromKey(card.text) ||
              "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Voluptatum fugit suscipit debitis delectus libero, aperiam at ducimus omnis nihil numquam, quibusdam sed minima, dolores laboriosam ab molestiae adipisci itaque voluptate!"}
          </p>
        </div>

        <div className={`${isSelected ? "" : "hidden"}`}>
          <FinishContainer
            item={item}
            card={card}
            handleFinishColorChange={handleFinishColorChange}
            isPowderCoating={isPowderCoating}
            isSelected={isSelected}
          />
        </div>

        <p className="text-basicLightGray text-start text-xs">
          {card.description}
        </p>
      </div>
    </Card>
  );
};

export default FinishSpazioCard;

const FinishOption = ({
  card,
  option,
  item,
  handleFinishColorChange,
  i,
  onImageLoad,
}: any) => {
  const [loaded, setLoaded] = useState(false);

  const src = option.text
    ? `/assets/finishes/${sanitizeName(card.text)}/${sanitizeName(
        option.text
      )}.png`
    : `/assets/finish-colors/${sanitizeKey(option.name)}.webp`;

  const isSelected = item?.color_input === (option.value || option.id);

  const handleLoad = () => {
    onImageLoad();
    setLoaded(true);
  };

  return (
    <div key={i} className="flex items-center">
      <div className="relative h-5 w-5">
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 rounded-full" />
        )}
        <Popover
          styles={{
            body: {
              padding: 0,
              overflow: "hidden",
              borderWidth: 1,
            },
          }}
          content={
            <FinishPopover
              image={src}
              text={option.text || option.name}
              category={option?.material_text}
            />
          }
        >
          <Image
            src={src}
            alt="Finish Icon"
            width={22}
            height={22}
            className={`rounded-full h-5 w-5 transition-opacity duration-200 ${
              loaded ? "opacity-100" : "opacity-0"
            }
          ${isSelected ? "ring-4 ring-kahuBlue/80" : ""}`}
            onLoad={handleLoad}
            onClick={() =>
              handleFinishColorChange({
                colorValue: option.value || option.id,
                finish_method_value: option.finish_method_value || null,
              })
            }
          />
        </Popover>
      </div>
    </div>
  );
};

interface FinishContainerProps {
  item: any;
  card: any;
  handleFinishColorChange: any;
  isPowderCoating?: boolean;
  isSelected?: boolean;
}

const FinishContainer = ({
  item,
  card,
  handleFinishColorChange,
  isPowderCoating = false,
  isSelected,
}: FinishContainerProps) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const handleImageLoad = () => {
    if (!isSelected) return;
    setLoadedCount((prev) => prev + 1);
  };
  const allImagesLoaded = loadedCount === item?.color?.length;
  const totalImages = item?.color?.length;
  const progress =
    totalImages === 0 ? 0 : Math.max((loadedCount / totalImages) * 100, 1);

  useEffect(() => {
    setLoadedCount(0);
  }, [isSelected]);

  return (
    <div>
      {!allImagesLoaded && (
        <div className="w-full px-4 pt-10">
          <ProgressBar progress={progress} />
        </div>
      )}
      <div
        className={`flex flex-col gap-2 ${!allImagesLoaded ? "opacity-0" : ""}`}
      >
        <p className="text-basicGray text-xs font-semibold text-start">
          Finishes
          {isPowderCoating && (
            <span className="font-normal"> (Powder Coating)</span>
          )}
        </p>

        <div
          className={`flex flex-wrap gap-1 p-2 ${
            isPowderCoating ? "max-h-24 overflow-auto scrollbar-hidden" : ""
          }`}
        >
          {item?.color.map((color: any, i: Key | null | undefined) => (
            <FinishOption
              key={i}
              card={card}
              option={color}
              item={item}
              handleFinishColorChange={handleFinishColorChange}
              i={i}
              onImageLoad={handleImageLoad}
            />
          ))}
        </div>

        {isPowderCoating && (
          <p className="text-basicLightGray text-xs text-start pt-2">
            All compliant to AMMA 2604.
          </p>
        )}
      </div>
    </div>
  );
};

const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <div className="w-full h-2 bg-gray-200 rounded">
      <div
        className="h-2 bg-kahuBlue rounded transition-all duration-300"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
};
