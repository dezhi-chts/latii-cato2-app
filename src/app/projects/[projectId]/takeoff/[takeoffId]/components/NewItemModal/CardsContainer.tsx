/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Key, useEffect, useRef, useState } from "react";
import { SectionName } from "./Modal";
import LineCard from "./CustomCards/LineCard";
import GlazingBeadCard from "./CustomCards/GlazingBeadCard";
import { CardsOptions } from "./types";
import FinishCard from "./CustomCards/FinishCard";
import GlassCard from "./CustomCards/GlassCard";
import HardwareCardsContainer from "./HardwareCardsContainer";
import InstallationCard from "./CustomCards/InstallationCard";
import { HandleMultipleChanges } from "../../types/item";
import FinishSpazioCard from "./CustomCards/FinishSpazioCard";

const renderCards = (
  section: SectionName,
  toggleSelectedOption: (section: SectionName, value: string) => void,
  options: any,
  selectedValue: string | undefined | null,
  item?: any,
  index?: any,
  handleSelectChange?: any,
  handleMultipleChanges?: HandleMultipleChanges
) => {
  const cards = options;

  if (!cards && !item) return <p>An error has occurred</p>;

  switch (section) {
    case "profile_line":
      return cards.map((card: CardsOptions, i: Key | null | undefined) => (
        <LineCard
          key={i}
          card={card}
          toggleSelectedOption={toggleSelectedOption}
          section={section}
          selectedValue={selectedValue}
          item={item}
        />
      ));
    case "casting_style":
      return cards.map((card: CardsOptions, i: Key | null | undefined) => (
        <GlazingBeadCard
          key={i}
          card={card}
          toggleSelectedOption={toggleSelectedOption}
          section={section}
          selectedValue={selectedValue}
          item={item}
        />
      ));
    case "material":
      const isSpazio =
        item?.frame_material?.selected_value === "Spazio-Aluminum";

      if (isSpazio)
        return item?.finish_method?.options.map(
          (card: any, i: Key | null | undefined) => (
            <FinishSpazioCard
              key={i}
              card={card}
              toggleSelectedOption={toggleSelectedOption}
              selectedValue={item?.finish_method?.selected_value}
              item={item}
              section="finish_method"
              index={index}
              handleSelectChange={handleSelectChange}
              handleMultipleChanges={handleMultipleChanges}
            />
          )
        );

      return cards.map((card: CardsOptions, i: Key | null | undefined) => (
        <FinishCard
          key={i}
          card={card}
          toggleSelectedOption={toggleSelectedOption}
          section={section}
          selectedValue={selectedValue}
          item={item}
          index={index}
          handleSelectChange={handleSelectChange}
          handleMultipleChanges={handleMultipleChanges}
        />
      ));

    case "glass_style":
      return cards.map((card: CardsOptions, i: Key | null | undefined) => (
        <GlassCard
          key={i}
          card={card}
          toggleSelectedOption={toggleSelectedOption}
          section={section}
          selectedValue={selectedValue}
          item={item}
          handleSelectChange={handleSelectChange}
          index={index}
        />
      ));
    case "hardware_handle_style":
      return (
        <HardwareCardsContainer
          item={item}
          index={index}
          handleSelectChange={handleSelectChange}
          toggleSelectedOption={toggleSelectedOption}
          cards={cards}
          section={section}
          handleMultipleChanges={handleMultipleChanges}
        />
      );
    case "installation_method":
      return cards.map((card: CardsOptions, i: Key | null | undefined) => (
        <InstallationCard
          key={i}
          card={card}
          toggleSelectedOption={toggleSelectedOption}
          section={section}
          selectedValue={selectedValue}
          item={item}
          handleSelectChange={handleSelectChange}
          index={index}
        />
      ));
    default:
      return null;
  }
};

type CardsContainerProps = {
  section: SectionName;
  setSelectedValue: (section: SectionName, value: string) => void;
  options: any;
  selectedValue: string | undefined | null;
  item?: any;
  index?: any;
  handleSelectChange?: any;
  handleMultipleChanges?: HandleMultipleChanges;
};
const CardsContainer = ({
  section,
  setSelectedValue,
  options,
  selectedValue,
  item,
  index,
  handleSelectChange,
  handleMultipleChanges,
}: CardsContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasLeftOverflow, setHasLeftOverflow] = useState(false);
  const [hasRightOverflow, setHasRightOverflow] = useState(false);

  const shouldScroll =
    section !== "casting_style" &&
    section !== "hardware_handle_style" &&
    section !== "installation_method";

  const checkOverflow = () => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    setHasLeftOverflow(scrollLeft > 0);
    setHasRightOverflow(scrollLeft + clientWidth < scrollWidth);
  };

  useEffect(() => {
    checkOverflow();
    const handleResize = () => checkOverflow();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={`relative w-9/12 ${shouldScroll ? "w-9/12" : "w-full"}`}>
      {shouldScroll && (
        <>
          {hasLeftOverflow && (
            <div className="pointer-events-none absolute left-0 top-10 h-[460px] w-6 z-10 bg-gradient-to-r from-black/10 to-transparent" />
          )}
          {hasRightOverflow && (
            <div className="pointer-events-none absolute right-0 top-10 h-[460px] w-6 z-10 bg-gradient-to-l from-black/10 to-transparent" />
          )}
        </>
      )}

      <div
        ref={containerRef}
        onScroll={checkOverflow}
        className="overflow-x-auto scrollbar-hidden"
      >
        <div
          className={`flex ${
            options?.length > 3 && shouldScroll
              ? "justify-start"
              : "justify-center"
          } gap-4 py-10 w-full`}
        >
          {renderCards(
            section,
            (section, value) => setSelectedValue(section, value),
            options,
            selectedValue,
            item,
            index,
            handleSelectChange,
            handleMultipleChanges
          )}
        </div>
      </div>
    </div>
  );
};

export default CardsContainer;
