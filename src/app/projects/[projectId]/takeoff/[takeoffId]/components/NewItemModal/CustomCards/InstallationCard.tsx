/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import Card from "../Card";
import { CardProps } from "../types";
import { sanitizeNameForFile } from "@/lib/functions";
import { Key, useEffect, useState } from "react";
import { Radio } from "antd";
import { getDescriptionFromKey } from "./cardsDescriptions";

const NailingFinsLocation = ({
  nailingFinsOptions,
  handleSelectChange,
  index,
  initialOptions,
}: any) => {
  const directions = nailingFinsOptions.map(
    (item: { value: any }) => item.value,
  );

  const [selectedDirections, setSelectedDirections] = useState<string[]>(
    initialOptions || [],
  );

  useEffect(() => {
    if (!initialOptions) return;
    setSelectedDirections(initialOptions);
  }, [initialOptions]);

  const toggleDirection = (direction: string) => {
    setSelectedDirections((prev) => {
      const isSelected = prev.includes(direction);

      if (direction === "all") {
        handleSelectChange(["all"], index, "installation_nailing_fin", false);
        return ["all"];
      }

      let filtered: string[];
      if (Array.isArray(prev)) {
        filtered = prev.filter((d) => d !== "all");
      } else {
        filtered = [];
      }

      let newSelection: string[];

      if (!isSelected && filtered.length === 3) {
        newSelection = ["all"];
      } else if (isSelected && filtered.length === 1) {
        newSelection = prev;
      } else {
        newSelection = isSelected
          ? filtered.filter((d) => d !== direction)
          : [...filtered, direction];
      }

      handleSelectChange(
        newSelection,
        index,
        "installation_nailing_fin",
        false,
      );
      return newSelection;
    });
  };

  return (
    <div className="flex gap-2 items-center">
      {directions.map((direction: string, index: Key | null | undefined) => {
        const isSelected = selectedDirections.includes(direction);

        return (
          <div
            key={index}
            onClick={() => toggleDirection(direction)}
            className={`p-2 rounded-md cursor-pointer border border-primaryN20 hover:bg-primaryN20 ${
              isSelected ? "bg-primaryN30" : ""
            }`}
          >
            <Image
              src={`/assets/item-customization/installation/location/${direction}.svg`}
              alt={`${direction} nailing fin`}
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </div>
        );
      })}
    </div>
  );
};

const InstallationCard = ({
  card,
  toggleSelectedOption,
  section,
  selectedValue,
  item,
  handleSelectChange,
  index,
}: CardProps) => {
  const [imgSrc, setImgSrc] = useState(
    `/assets/item-customization/installation/${sanitizeNameForFile(
      card.text,
    )}.webp`,
  );

  const [isGlazed, setIsGlazed] = useState(
    item?.installation_glazed.selected_value,
  );

  useEffect(() => {
    setIsGlazed(item?.installation_glazed.selected_value);
  }, [item?.installation_glazed.selected_value]);

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
      <div className="flex items-center flex-col gap-10 h-full px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-center mb-2">
            <Image
              src={imgSrc}
              alt={imgSrc}
              height={112}
              width={210}
              className="h-24"
            />
          </div>
          <div className="text-grey-normal">
            <p className="font-semibold">{card?.text}</p>
          </div>
          <p className="text-basicLightGray">
            {getDescriptionFromKey(card.text) ||
              "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Voluptatum fugit suscipit debitis delectus libero, aperiam at ducimus omnis nihil numquam, quibusdam sed minima, dolores laboriosam ab molestiae adipisci itaque voluptate!"}
          </p>
        </div>
        <div className="w-full flex flex-col gap-4">
          {card.value === "nailing_fin" && card.value === selectedValue && (
            <div className="flex flex-col gap-2 w-full items-start">
              <p className="text-xs text-grey-normal font-semibold">Location</p>
              <NailingFinsLocation
                nailingFinsOptions={item?.installation_nailing_fin?.options}
                index={index}
                handleSelectChange={handleSelectChange}
                initialOptions={item?.installation_nailing_fin?.selected_value}
                item={item}
              />
            </div>
          )}
          {card.value === selectedValue && (
            <div className="flex flex-col gap-2 w-full items-start">
              <p className="text-xs text-grey-normal font-semibold">Glazed</p>
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Radio.Group
                  value={item.installation_glazed?.selected_value}
                  onChange={(e) =>
                    handleSelectChange(
                      e.target.value,
                      index,
                      "installation_glazed",
                      false,
                    )
                  }
                >
                  <Radio value="yes">
                    <p
                      onClick={() =>
                        handleSelectChange(
                          "yes",
                          index,
                          "installation_glazed",
                          false,
                        )
                      }
                    >
                      Yes
                    </p>
                  </Radio>
                  <Radio value="no">
                    <p
                      onClick={() =>
                        handleSelectChange(
                          "no",
                          index,
                          "installation_glazed",
                          false,
                        )
                      }
                    >
                      No
                    </p>
                  </Radio>
                </Radio.Group>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default InstallationCard;
