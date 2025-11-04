/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Image from "next/image";
import Card from "../Card";
import { CardProps } from "../types";
import { Popover, Skeleton, Spin } from "antd";
import { useEffect, useState } from "react";
import { sanitizeKey, sanitizeName } from "@/lib/functions";
import { getDescriptionFromKey } from "./cardsDescriptions";
import { FinishPopover } from "./HardwareCard";

const FinishCard = ({
  card,
  toggleSelectedOption,
  section,
  selectedValue,
  item,
  index,
  handleMultipleChanges,
}: CardProps) => {
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [loadingCardFinishes, setLoadingCardFinishes] = useState(false);

  const handleSelectedOptionChange = () => {
    if (card.value === selectedValue) return;
    toggleSelectedOption(section, card?.value);
  };

  useEffect(() => {
    if (card.value === selectedValue) {
      setLoadingCardFinishes(true);
      setTimeout(() => {
        setLoadingCardFinishes(false);
      }, 400);
    }
  }, [card.value, selectedValue]);

  const handleFinishColorChange = ({ colorValue, finishMethodValue }: any) => {
    const changesArray = [];

    if (finishMethodValue) {
      changesArray.push(
        {
          value: finishMethodValue,
          field: "finish_method",
          units: false,
        },
        {
          value: colorValue,
          field: "color_input",
          units: false,
        }
      );
    } else {
      changesArray.push({
        value: colorValue,
        field: "finish_method",
        units: false,
      });
    }
    if (handleMultipleChanges) handleMultipleChanges(index, changesArray);
  };

  return (
    <Card
      size={"large"}
      isSelected={card.value === selectedValue}
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
            src={`/assets/item-customization/finish/${sanitizeName(
              card.text
            )}/image.webp`}
            alt="Card Image"
            width={216}
            height={48}
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
            {getDescriptionFromKey(card.text) ||
              "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Voluptatum fugit suscipit debitis delectus libero, aperiam at ducimus omnis nihil numquam, quibusdam sed minima, dolores laboriosam ab molestiae adipisci itaque voluptate!"}
          </p>
        </div>
        {loadingCardFinishes ? (
          <Spin />
        ) : (
          <div className="flex flex-col gap-2">
            {card.value === selectedValue && (
              <div className="flex flex-col gap-2">
                {item?.finish_method.options?.some(
                  (opt: any) =>
                    !Array.isArray(opt.color) || opt.color.length === 0
                ) && (
                  <p className="text-basicGray text-xs font-semibold text-start">
                    Finishes
                  </p>
                )}

                <div className="flex gap-1.5 flex-wrap">
                  {(() => {
                    let writtenTitle = false;

                    return [...(item?.finish_method.options ?? [])]
                      .sort((a, b) => {
                        const aHasColor =
                          Array.isArray(a.color) && a.color.length > 0;
                        const bHasColor =
                          Array.isArray(b.color) && b.color.length > 0;
                        return Number(aHasColor) - Number(bHasColor);
                      })
                      .map((option, i) => {
                        const hasColors =
                          Array.isArray(option.color) &&
                          option.color.length > 0;

                        if (hasColors) {
                          const titleSection = !writtenTitle ? (
                            <>
                              <p className="text-basicGray text-xs font-semibold text-start">
                                Finishes{" "}
                                <span className="font-normal">
                                  (Powder Coating)
                                </span>
                              </p>
                              <div className="flex gap-1.5 items-center flex-wrap overflow-auto max-h-32 p-2 scrollbar-hidden ">
                                {option.color.map((c: any) => {
                                  const isSelected =
                                    item?.color_input === c.id &&
                                    item?.finish_method.selected_value ===
                                      option.value;

                                  if (!c.color) return null;

                                  return (
                                    <Popover
                                      key={c.id}
                                      styles={{
                                        body: {
                                          padding: 0,
                                          overflow: "hidden",
                                          borderWidth: 1,
                                        },
                                      }}
                                      content={
                                        <FinishPopover
                                          color={c.color}
                                          text={c.name}
                                        />
                                      }
                                    >
                                      <div
                                        className={`h-5 w-5 rounded-full cursor-pointer ${
                                          isSelected
                                            ? "ring-4 ring-kahuBlue/80"
                                            : ""
                                        }`}
                                        style={{
                                          backgroundColor: `#${c.color}`,
                                        }}
                                        onClick={() =>
                                          handleFinishColorChange({
                                            colorValue: c.id,
                                            finishMethodValue:
                                              c.finish_method_value,
                                          })
                                        }
                                      />
                                    </Popover>
                                  );
                                })}
                              </div>
                              <p className="text-basicLightGray text-xs text-start pt-2">
                                All compliant to AMMA 2604.
                              </p>
                            </>
                          ) : null;

                          writtenTitle = true;

                          return (
                            <div key={i} className="flex flex-col gap-1">
                              {titleSection}
                            </div>
                          );
                        }

                        return (
                          <FinishOption
                            key={i}
                            card={card}
                            option={option}
                            item={item}
                            handleFinishColorChange={handleFinishColorChange}
                            i={i}
                          />
                        );
                      });
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-basicLightGray text-start text-xs">
          {card.description}
        </p>
      </div>
    </Card>
  );
};

export default FinishCard;

const FinishOption = ({
  card,
  option,
  item,
  handleFinishColorChange,
  i,
}: any) => {
  const [loaded, setLoaded] = useState(false);

  const src = option.text
    ? `/assets/finishes/${sanitizeName(card.text)}/${sanitizeName(
        option.text
      )}.webp`
    : `/assets/finish-colors/${sanitizeKey(option.name)}.webp`;

  const isSelected =
    item?.finish_method.selected_value === (option.value || option.id);

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
            onLoad={() => setLoaded(true)}
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
