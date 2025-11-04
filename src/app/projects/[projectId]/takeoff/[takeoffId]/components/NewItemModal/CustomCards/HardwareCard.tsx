/* eslint-disable @typescript-eslint/no-explicit-any */

import { sanitizeKey, sanitizeName } from "@/lib/functions";
import { Checkbox, Popover, Radio, Spin } from "antd";
import Image from "next/image";
import { useEffect, useState } from "react";

export const FinishPopover = ({ color, image, text, category }: any) => {
  const formattedText = text.replace(/-/g, " ");

  if (color) {
    return (
      <div className="h-24 w-32 flex flex-col">
        <div className="h-14 w-full" style={{ backgroundColor: `#${color}` }} />
        <div className="flex flex-col gap-2 h-10 w-full text-xs justify-center items-center text-center px-1 text-basicGray font-light">
          <p>{text}</p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="h-28 w-48 flex">
        {image && (
          <Image
            alt="finish"
            src={image}
            height={16}
            width={16}
            className="w-[30%] h-full"
          />
        )}
        <div className="flex flex-col justify-center px-2 font-light text-xs">
          <p className="text-basicLightGray">{category}</p>
          <p className="text-basicGray">{formattedText}</p>
        </div>
      </div>
    );
  }
};
const HardwareCard = ({
  handleSelectChange,
  item,
  index,
  selectedCategory,
  handleMultipleChanges,
  toggleSelectedOption,
}: any) => {
  const [loading, setLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [isCortizo, setIsCortizo] = useState(false);
  const [canMatch, setCanMatch] = useState(false);

  const handleFinishColorChange = ({
    materialValue,
    finishValue,
    colorInput,
  }: any) => {
    const changesArray = [
      {
        value: materialValue,
        field: "hardware_material",
        units: true,
      },
      {
        value: finishValue,
        field: "hardware_finish",
        units: true,
      },
    ];

    if (colorInput) {
      changesArray.push({
        value: colorInput,
        field: "hardware_color_input",
        units: true,
      });
    }

    handleMultipleChanges(index, changesArray);
  };

  const FinishRender = ({ item }: any) => {
    const [localItem, setLocalItem] = useState(item);

    useEffect(() => {
      setLocalItem(item);
    }, [item]);

    const selectedFinishColor = {
      material: localItem?.units[0]?.hardware_material?.selected_value,
      finish: localItem?.units[0]?.hardware_finish?.selected_value,
      color: localItem?.units[0]?.hardware_color_input,
    };

    const options = localItem?.units[0].hardware_finish?.options ?? [];
    if (isCortizo) {
      const cortizoOptions = options[0]?.color;
      return (
        <div className="flex flex-wrap gap-0.5">
          {cortizoOptions.map((option: any, i: number) => {
            const isSelected =
              localItem?.units[0]?.hardware_color_input === option.id;
            return (
              <div
                key={i}
                className={`flex items-center justify-center rounded-full w-6 h-6 border-2 overflow-hidden cursor-pointer ${
                  isSelected ? "border-kahuBlue" : "border-transparent"
                }`}
                onClick={() => {
                  if (isSelected) return;
                  handleSelectChange(
                    option.id,
                    index,
                    "hardware_color_input",
                    true
                  );
                }}
              >
                <Popover
                  styles={{
                    body: { padding: 0, overflow: "hidden", borderWidth: 1 },
                  }}
                  content={
                    <FinishPopover
                      image={`/assets/finish-colors/${sanitizeKey(
                        option.name
                      )}.webp`}
                      text={option.name}
                    />
                  }
                >
                  <Image
                    src={`/assets/finish-colors/${sanitizeKey(
                      option.name
                    )}.webp`}
                    alt={option.name}
                    width={120}
                    height={120}
                    className="h-full"
                  />
                </Popover>
              </div>
            );
          })}
        </div>
      );
    }

    const normalizedOptions = options.flatMap((option: any) => {
      if (Array.isArray(option.color) && option.color.length > 1) {
        return option.color.map((color: any) => ({
          ...option,
          color,
        }));
      }
      return option;
    });

    return (
      <div className="flex flex-wrap gap-y-2 w-10/12">
        {normalizedOptions.map((option: any, index: number) => (
          <div key={index}>
            {!Array.isArray(option.color) ? (
              option.color.color && (
                <Popover
                  styles={{ body: { padding: 0, overflow: "hidden" } }}
                  content={
                    <FinishPopover
                      color={option.color.color}
                      text={option.color.name}
                    />
                  }
                >
                  <div
                    style={{ backgroundColor: `#${option.color.color}` }}
                    className={`w-5 h-5 mr-2 rounded-full cursor-pointer  ${
                      option.color.id === selectedFinishColor.color
                        ? "ring-4 ring-kahuBlue/80"
                        : "hover:ring-1"
                    }`}
                    onClick={() =>
                      handleFinishColorChange({
                        materialValue: option.hardware_material_value,
                        finishValue: option.value,
                        colorInput: option.color.id,
                      })
                    }
                  />
                </Popover>
              )
            ) : (
              <Popover
                styles={{
                  body: { padding: 0, overflow: "hidden", borderWidth: 1 },
                }}
                content={
                  <FinishPopover
                    image={`/assets/finishes/${sanitizeName(
                      option.hardware_material_text
                    )}/${sanitizeName(option.text)}.webp`}
                    text={option.text}
                    category={option.hardware_material_text}
                  />
                }
              >
                <Image
                  alt="finish"
                  src={`/assets/finishes/${sanitizeName(
                    option.hardware_material_text
                  )}/${sanitizeName(option.text)}.webp`}
                  height={16}
                  width={16}
                  className={`w-5 h-5 mr-2 rounded-full cursor-pointer  ${
                    selectedFinishColor.finish === option.value &&
                    selectedFinishColor.material ===
                      option.hardware_material_value
                      ? "ring-4 ring-kahuBlue/80"
                      : "hover:ring-1"
                  }`}
                  onClick={() =>
                    handleFinishColorChange({
                      materialValue: option.hardware_material_value,
                      finishValue: option.value,
                      colorInput: null,
                    })
                  }
                />
              </Popover>
            )}
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 200);
  }, [selectedCategory]);

  const matchToFrameFinish = () => {
    if (isMatching) return;

    let changesArray = [];
    if (isCortizo) {
      changesArray = [
        {
          value: "212",
          field: "hardware_finish",
          units: true,
        },
        {
          value: item.color_input,
          field: "hardware_color_input",
          units: true,
        },
      ];
    } else {
      changesArray = [
        {
          value: item.finish_method.selected_value,
          field: "hardware_finish",
          units: true,
        },
        {
          value: item.color_input,
          field: "hardware_color_input",
          units: true,
        },
      ];
    }

    handleMultipleChanges(index, changesArray);

    setIsMatching(true);
  };

  useEffect(() => {
    const hardwareColors = item?.units[0]?.hardware_finish_color;
    const canMatchColors = hardwareColors?.some((color: any) => {
      return color.id === item?.color_input;
    });
    setCanMatch(canMatchColors);
    const isItemCortizo =
      item?.frame_material.selected_value === "Spazio-Aluminum";

    setIsCortizo(isItemCortizo);

    if (isItemCortizo) {
      setIsMatching(
        item?.units[0]?.hardware_finish?.selected_value === "212" &&
          item?.units[0]?.hardware_color_input === item?.color_input
      );
    } else {
      setIsMatching(
        item?.units[0]?.hardware_finish?.selected_value ===
          item?.finish_method.selected_value &&
          item?.units[0]?.hardware_color_input === item?.color_input
      );
    }
  }, [item]);

  return (
    <div className="w-[612px] h-[456px] overflow-auto scrollbar-hidden py-6 px-12 border border-primaryN30 rounded-lg flex flex-col gap-7">
      {loading ? (
        <Spin size="large" />
      ) : (
        <div className={`flex flex-col gap-3`}>
          <div className="flex flex-col gap-3">
            <p className="text-basicGray font-semibold text-sm">Styles</p>
            {isCortizo ? (
              <div className="rounded-lg border border-kahuBlue overflow-hidden w-32 h-32 flex justify-center items-center cursor-pointer">
                <Image
                  src={`/assets/item-customization/hardware/cortizo/${item?.units[0].hardware_handle_style.selected_value}.webp`}
                  alt="handle picture"
                  width={120}
                  height={120}
                />
              </div>
            ) : (
              <div className="flex gap-4">
                {item?.units[0].hardware_handle_latii_style?.options.map(
                  (option: any, i: number) => {
                    const isSelected =
                      item?.units[0]?.hardware_handle_latii_style
                        ?.selected_value === option?.value;
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-center rounded-lg border overflow-hidden cursor-pointer ${
                          isSelected ? "border-kahuBlue" : "border-primaryN30"
                        }`}
                        onClick={() => {
                          if (isSelected) return;
                          handleSelectChange(
                            option.value,
                            index,
                            "hardware_handle_latii_style",
                            true
                          );
                        }}
                      >
                        <Image
                          src={`/assets/item-customization/hardware/${selectedCategory}/${option.value}.webp`}
                          alt={option.text}
                          width={120}
                          height={120}
                        />
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-basicGray font-semibold text-sm">Finishes</p>
            <FinishRender item={item} />
            {canMatch && (
              <Checkbox
                checked={isMatching}
                // onChange={() => setIsMatching(!isMatching)}
                disabled={isMatching}
                onChange={matchToFrameFinish}
              >
                <p className="text-xs pl-2 text-basicGray">
                  Match to Frame Finish
                </p>
              </Checkbox>
            )}
          </div>
          {Boolean(item?.units[0].hardware_fixion?.options.length) && (
            <div className="flex flex-col gap-3">
              <p className="text-basicGray font-semibold text-sm">Fixions</p>
              <Radio.Group
                onChange={(e) => {
                  handleSelectChange(
                    e.target.value,
                    index,
                    "hardware_fixion",
                    true
                  );
                }}
                value={item?.units[0].hardware_fixion?.selected_value}
              >
                {item?.units[0].hardware_fixion?.options.map(
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
          )}
          {Boolean(item?.units[0].hardware_key_yes_no?.options.length) && (
            <div className="flex flex-col gap-3">
              <p className="text-basicGray font-semibold text-sm">Key</p>
              <Radio.Group
                disabled={item?.units[0].hardware_key_yes_no?.disabled}
                onChange={(e) => {
                  handleSelectChange(
                    e.target.value,
                    index,
                    "hardware_key_yes_no",
                    true
                  );
                }}
                value={item?.units[0].hardware_key_yes_no?.selected_value}
              >
                {item?.units[0].hardware_key_yes_no?.options.map(
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
          )}
          {Boolean(
            item?.units[0].hardware_keyed_aliked_yes_no?.options.length
          ) && (
            <div className="flex flex-col gap-3">
              <p className="text-basicGray font-semibold text-sm">K. Alike</p>
              <Radio.Group
                disabled={item?.units[0].hardware_keyed_aliked_yes_no?.disabled}
                onChange={(e) => {
                  handleSelectChange(
                    e.target.value,
                    index,
                    "hardware_keyed_aliked_yes_no",
                    true
                  );
                }}
                value={
                  item?.units[0].hardware_keyed_aliked_yes_no?.selected_value
                }
              >
                {item?.units[0].hardware_keyed_aliked_yes_no?.options.map(
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
          )}
        </div>
      )}
    </div>
  );
};

export default HardwareCard;
