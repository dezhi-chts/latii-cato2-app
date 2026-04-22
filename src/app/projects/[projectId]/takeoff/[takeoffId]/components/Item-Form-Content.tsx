/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import { Divider, Popover } from "antd";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import { NewItemModal, SectionName } from "./NewItemModal/Modal";
import { HandleMultipleChanges, LineSelectorStatus } from "../types/item";
import {
  getTextByOptionsValue,
  mmToInchesWithFraction,
  sanitizeKey,
  sanitizeName,
} from "@/lib/functions";
import InformationBadge from "./Info-Popups";

type ItemProps = {
  item: any;
  handleSelectChange?: (
    value: any,
    index: number,
    field: string | boolean,
    units?: boolean,
    $unit_index?: number,
  ) => void;
  index?: number;
  handleMultipleChanges?: HandleMultipleChanges;
  status?: LineSelectorStatus;
  hasBeenReviewed?: boolean;
  quoteStatus?: number | undefined;
};

const ContentHeader = ({ item, hasBeenReviewed }: ItemProps) => {
  const type = item?.units[0]?.product_type?.options.find(
    (option: any) =>
      option.value === item?.units[0]?.product_type?.selected_value,
  )?.text;

  const open = item?.units[0]?.operability?.options.find(
    (option: any) =>
      option.value === item?.units[0]?.operability?.selected_value,
  )?.text;

  const muntinText = item?.is_have_sdl
    ? "SDL"
    : item?.is_have_tdl
      ? "TDL"
      : "None";

  return (
    <div className="flex justify-between w-full mx-14 items-start text-sm">
      <div className="flex gap-2 items-start w-1/3">
        <Image
          src="/assets/icons/configuration.svg"
          alt="configuration icon"
          width={16}
          height={16}
          className="mt-0.5"
        />
        <div className="flex flex-col gap-1 pr-2">
          <p className="text-lushAqua font-semibold">Configuration</p>
          <p>
            <span className="text-grey-normal">Type</span> {type}
          </p>
          <p>
            <span className="text-grey-normal">Open</span> {open}
          </p>
        </div>
      </div>
      <Divider type="vertical" className="h-20 bg-primaryN30 m-0 mr-8" />
      <div className="flex flex-col gap-1 w-1/3">
        <p className="text-lushAqua font-semibold">Dimensions</p>
        <p>
          <span className="text-grey-normal">Width </span>
          {`${mmToInchesWithFraction(item?.width_input) || 0}`} |{" "}
          <span className="text-grey-normal">Height</span>{" "}
          {`${mmToInchesWithFraction(item?.height_input) || 0}`}
        </p>
      </div>
      <Divider type="vertical" className="h-20 bg-primaryN30 m-0 mr-8" />
      <div className="flex gap-2 text-sm items-start w-1/3">
        <Image
          src="/assets/icons/dividers.svg"
          alt="dividers icon"
          width={16}
          height={16}
          className="mt-0.5"
        />
        <div className="flex flex-col gap-1">
          <p className="text-lushAqua font-semibold">Dividers</p>
          <div className="flex gap-2">
            <p>
              <span className="text-grey-normal">Muntin</span> {muntinText}
            </p>
            {hasBeenReviewed && muntinText !== "None" && (
              <InformationBadge badge="sdl" title={muntinText} item={item} />
            )}
          </div>
          <p className="text-grey-normal text-xs">For arrangement see Image.</p>
        </div>
      </div>
    </div>
  );
};

type ContentBodyProps = {
  item: any;
  openModal: () => void;
  setDefaultOpenSection: (section: SectionName) => void;
  quoteStatus?: number | undefined;
  hasBeenReviewed?: boolean;
};
const ContentBody = ({
  item,
  openModal,
  setDefaultOpenSection,
  hasBeenReviewed,
}: ContentBodyProps) => {
  const renderNailingFinsText = (locationsArray: string[] | string) => {
    if (typeof locationsArray === "string")
      return locationsArray.charAt(0).toUpperCase() + locationsArray.slice(1);
    return !Boolean(locationsArray?.length)
      ? "-"
      : locationsArray
          .map((loc) => loc.charAt(0).toUpperCase() + loc.slice(1))
          .join(", ");
  };

  const [images, setImages] = useState<Record<string, string>>({
    frame: "/assets/images/frame_example.png",
    hardware: "/assets/images/hardware_example.png",
  });

  type Option = {
    value: any;
    text?: string;
    details?: string;
  };

  const getSelectedOption = (field?: {
    options?: Option[];
    selected_value?: any;
  }): Option | undefined => {
    return field?.options?.find((opt) => opt.value === field.selected_value);
  };

  const frameTitle = getSelectedOption(item?.profile)?.text;
  const glassArragement = getSelectedOption(item?.glass_arrangement);
  const glassType = getSelectedOption(item?.glass_type);
  const glassCoating = getSelectedOption(item?.glass_coating);

  useEffect(() => {
    const isCortizo =
      item?.frame_material?.selected_value === "Spazio-Aluminum";
    let frameMaterial;
    let finishMethod;
    let frameUrl = "";
    let hardwareUrl = "";

    if (isCortizo) {
      hardwareUrl = `/assets/item-customization/hardware/cortizo/${item?.units[0]?.hardware_handle_style?.selected_value}.webp`;
      const colorName = item?.color.find(
        (c: any) => c.id === item?.color_input,
      )?.name;
      frameUrl = colorName
        ? `/assets/finish-colors/${sanitizeKey(colorName)}.webp`
        : "/assets/images/frame_example.png";
    } else {
      hardwareUrl = `/assets/item-customization/hardware/${item?.units[0]?.hardware_handle_style?.selected_value}/${item?.units[0]?.hardware_handle_latii_style?.selected_value}.webp`;
      if (item?.finish_method?.selected_value !== "126") {
        frameMaterial = getTextByOptionsValue(item?.material);
        finishMethod = getTextByOptionsValue(item?.finish_method);
        frameUrl = `/assets/finishes/${sanitizeName(
          frameMaterial,
        )}/${sanitizeName(finishMethod)}.webp`;
      }
    }

    setImages((prev) => ({
      ...prev,
      frame: frameUrl,
      hardware: hardwareUrl,
    }));
  }, [item]);

  return (
    <div
      className={`w-full border pl-6 pr-14 py-6 rounded-xl border-primaryN30 text-sm flex cursor-pointer`}
      onClick={() => {
        setTimeout(() => {
          openModal();
        }, 50);
      }}
    >
      <div className="flex flex-col gap-4 w-8/12">
        <div className="flex gap-2 items-start">
          <Image
            src="/assets/icons/frame.svg"
            alt="Frame Icon"
            width={16}
            height={16}
            className="mt-0.5"
          />
          <div
            className="flex flex-col gap-2"
            onClick={() => setDefaultOpenSection("profile_line")}
          >
            <p className="text-lushAqua font-semibold">Frame</p>
            <div className="flex gap-6">
              {images.frame ? (
                <Image
                  src={images.frame}
                  alt="Frame Image"
                  width={45}
                  height={45}
                  className="w-12 h-12 rounded-lg"
                />
              ) : (
                <div
                  style={{
                    backgroundColor: `#${
                      item?.color?.find((c: any) => c.id === item?.color_input)
                        ?.color
                    }`,
                  }}
                  className="w-12 h-12 rounded-lg"
                />
              )}

              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <p>
                    <span className="text-grey-normal">Line </span>
                    {getTextByOptionsValue(item?.profile_line)}
                  </p>
                  {hasBeenReviewed && (
                    <InformationBadge badge="frame" title={frameTitle} />
                  )}
                </div>
                <p>
                  <span className="text-grey-normal">Material </span>
                  {getTextByOptionsValue(item?.material)}
                </p>
                <p>
                  <span className="text-grey-normal">Finish </span>
                  {getTextByOptionsValue(item?.finish_method) ===
                    "Powder Coating" ||
                  getTextByOptionsValue(item?.finish_method) ===
                    "Color Catalog - Powder Coating"
                    ? item?.color?.find((c: any) => c.id === item?.color_input)
                        ?.name
                    : getTextByOptionsValue(item?.finish_method)}
                </p>
                {item?.frame_material?.selected_value === "Spazio-Aluminum" &&
                  item?.color_input && (
                    <p>
                      <span className="text-grey-normal">Finish II </span>
                      {
                        item?.color?.find(
                          (c: any) => c.id === item?.color_input,
                        )?.name
                      }
                    </p>
                  )}

                {(item?.finish_method?.selected_value === "126" ||
                  item?.finish_method?.selected_value === "210") && (
                  <p className="text-grey-normal text-xs">
                    AAMA 2604 certified
                  </p>
                )}

                {item?.frame_material?.selected_value ===
                  "BELLAVISTA-Steel" && (
                  <p>
                    <span className="text-grey-normal">G. Bead </span>
                    {getTextByOptionsValue(item?.casting_style)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        {item?.units[0].is_have_hardware_section && (
          <div
            className="flex gap-2 items-start"
            onClick={() => setDefaultOpenSection("hardware_handle_style")}
          >
            <Image
              src="/assets/icons/hardware.svg"
              alt="Frame Icon"
              width={16}
              height={16}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-2">
              <p className="text-lushAqua font-semibold">Hardware</p>
              <div className="flex gap-2">
                <Image
                  src={images.hardware}
                  alt="Hardware Image"
                  width={45}
                  height={45}
                  className="w-16 h-16"
                />
                <div className="flex flex-col gap-1">
                  <p>
                    <span className="text-grey-normal">Style </span>
                    {`${getTextByOptionsValue(
                      item?.units[0].hardware_handle_style,
                    )} | ${getTextByOptionsValue(
                      item?.units[0].hardware_handle_latii_style,
                    )}`}
                  </p>
                  <p>
                    <span className="text-grey-normal">Finish </span>
                    {getTextByOptionsValue(item?.units[0].hardware_finish)}
                  </p>
                  {item?.units[0].hardware_fixion?.selected_value && (
                    <p>
                      <span className="text-grey-normal">Fixions </span>
                      {getTextByOptionsValue(item?.units[0].hardware_fixion)}
                    </p>
                  )}
                  {item?.units[0].hardware_key_yes_no?.selected_value && (
                    <p>
                      <span className="text-grey-normal">Key </span>
                      {getTextByOptionsValue(
                        item?.units[0].hardware_key_yes_no,
                      )}
                    </p>
                  )}
                  {item?.units[0].hardware_keyed_aliked_yes_no
                    ?.selected_value && (
                    <p>
                      <span className="text-grey-normal">K. Alike </span>
                      {getTextByOptionsValue(
                        item?.units[0].hardware_keyed_aliked_yes_no,
                      )}
                    </p>
                  )}
                  <p className="text-grey-normal text-xs">
                    We use a Multi-lock system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Divider type="vertical" className=" h-auto bg-primaryN30 mr-8" />
      <div className="flex flex-col gap-4 w-4/12 items-end">
        <div
          className="flex gap-2 items-start"
          onClick={() => setDefaultOpenSection("glass_style")}
        >
          <Image
            src="/assets/icons/glass.svg"
            alt="Glass Icon"
            width={16}
            height={16}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <p className="text-lushAqua font-semibold">Glass</p>
            <p>
              <span className="text-grey-normal">Brand </span>
              {getTextByOptionsValue(item?.glass_brand)}
            </p>
            <p>
              <span className="text-grey-normal">Type </span>
              {getTextByOptionsValue(item?.glass_style)}
            </p>
            <p className="text-grey-normal text-xs">
              All our glass is tempered.
            </p>
            <p>
              <span className="text-grey-normal">Low-E Coating </span>
              {getTextByOptionsValue(item?.glass_coating)}
            </p>
            <div className="flex gap-2">
              <p>
                <span className="text-grey-normal">Arrangement </span>

                {item?.glass_is_custom_arrangment
                  ? `Custom [${item?.glass_custom_arrangment}]`
                  : getTextByOptionsValue(item?.glass_specification)}
              </p>
              {hasBeenReviewed && (
                <InformationBadge
                  badge="glass"
                  title={glassArragement?.text?.split(" - ")[0]}
                  details={glassArragement?.details}
                  type={glassType?.text}
                  coating={glassCoating?.text}
                  customGlass={item?.glass_custom_arrangment}
                  isGlassCustom={item?.glass_is_custom_arrangment}
                />
              )}
            </div>
          </div>
        </div>
        <div
          className="flex gap-2 items-start"
          onClick={() => setDefaultOpenSection("installation_method")}
        >
          <Image
            src="/assets/icons/installation.svg"
            alt="Glass Icon"
            width={16}
            height={16}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <p className="text-lushAqua font-semibold">Installation</p>
            <p>
              <span className="text-grey-normal">Method </span>
              {getTextByOptionsValue(item?.installation_method)}
            </p>
            {item?.installation_method?.selected_value === "nailing_fin" && (
              <p>
                <span className="text-grey-normal">Location </span>
                {renderNailingFinsText(
                  item?.installation_nailing_fin?.selected_value,
                )}
              </p>
            )}
            <p>
              <span className="text-grey-normal">Glazed </span>
              {getTextByOptionsValue(item?.installation_glazed)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const NewBody = ({
  openModal,
  isDisabled,
}: {
  openModal: () => void;
  isDisabled: boolean;
}) => {
  const handleBodyClick = () => {
    if (isDisabled) return;

    openModal();
  };

  return (
    <Popover
      content={<p className="text-xs">Draw or upload an image</p>}
      trigger="hover"
      placement="bottom"
      open={isDisabled ? undefined : false}
    >
      <div
        className={`w-full h-72 border items-center justify-center py-5 rounded-xl border-primaryN30 border-dashed flex flex-col gap-2.5  ${
          isDisabled ? "opacity-70" : "cursor-pointer"
        }`}
        onClick={handleBodyClick}
      >
        <Image
          src="/assets/icons/pencil-plus.svg"
          alt="Add Item Icon"
          height={24}
          width={24}
        />
        <p className="text-grey-normal text-sm">
          Personalize your item specifications
        </p>
        <Button variant="outline" disabled={isDisabled}>
          Start
        </Button>
      </div>
    </Popover>
  );
};

const UploadBody = () => {
  return (
    <div
      className={`w-full justify-center items-center h-full border cursor-default border-dashed px-14 py-6 rounded-xl border-primaryN50 text-sm flex`}
    >
      <div className="w-[250px] flex flex-col gap-2.5 items-center justify-center">
        <Image
          src="/assets/icons/pencil-plus-orange.svg"
          alt="Latii Waiting for Upload"
          width={24}
          height={24}
        />
        <p className="text-grey-normal text-sm text-center">
          Latii will fill and Personalize your item specifications based on your
          uploaded information.
        </p>
      </div>
    </div>
  );
};

const ContentBodySystem = ({
  item,
  openModal,
  setDefaultOpenSection,
  hasBeenReviewed,
}: ContentBodyProps) => {
  const renderNailingFinsText = (locationsArray: string[] | string) => {
    if (typeof locationsArray === "string")
      return locationsArray.charAt(0).toUpperCase() + locationsArray.slice(1);
    return !Boolean(locationsArray?.length)
      ? "-"
      : locationsArray
          .map((loc) => loc.charAt(0).toUpperCase() + loc.slice(1))
          .join(", ");
  };

  type Option = {
    value: any;
    text?: string;
    details?: string;
  };

  const getSelectedOption = (field?: {
    options?: Option[];
    selected_value?: any;
  }): Option | undefined => {
    return field?.options?.find((opt) => opt.value === field.selected_value);
  };

  const frameTitle = getSelectedOption(item?.profile)?.text;
  const glassArragement = getSelectedOption(item?.glass_arrangement);
  const glassType = getSelectedOption(item?.glass_type);
  const glassCoating = getSelectedOption(item?.glass_coating);

  const [images, setImages] = useState<Record<string, string>>({
    frame: "/assets/images/frame_example.png",
    hardware: "/assets/images/hardware_example.png",
  });

  useEffect(() => {
    const isCortizo =
      item?.frame_material?.selected_value === "Spazio-Aluminum";
    let frameMaterial;
    let finishMethod;
    let frameUrl = "";
    let hardwareUrl = "";

    if (isCortizo) {
      hardwareUrl = `/assets/item-customization/hardware/cortizo/${item?.units[0]?.hardware_handle_style?.selected_value}.webp`;
      const colorName = item?.color.find(
        (c: any) => c.id === item?.color_input,
      )?.name;

      frameUrl = colorName
        ? `/assets/finish-colors/${sanitizeKey(colorName)}.webp`
        : "/assets/images/frame_example.png";
    } else {
      hardwareUrl = `/assets/item-customization/hardware/${item?.units[0]?.hardware_handle_style?.selected_value}/${item?.units[0]?.hardware_handle_latii_style?.selected_value}.webp`;
      if (item?.finish_method?.selected_value !== "126") {
        frameMaterial = getTextByOptionsValue(item?.material);
        finishMethod = getTextByOptionsValue(item?.finish_method);
        frameUrl = `/assets/finishes/${sanitizeName(
          frameMaterial,
        )}/${sanitizeName(finishMethod)}.webp`;
      }
    }

    setImages((prev) => ({
      ...prev,
      frame: frameUrl,
      hardware: hardwareUrl,
    }));
  }, [item]);

  return (
    <div
      className={`w-full px-7 py-6 rounded-xl text-sm flex gap-8 cursor-pointer`}
      onClick={() => {
        setTimeout(() => {
          openModal();
        }, 50);
      }}
    >
      <div className="flex flex-col gap-6 w-1/2 h-[380px] overflow-auto scrollbar-hidden">
        {item?.units?.map((unit: any, index: number) => {
          let jsonArray = [];
          try {
            jsonArray = JSON.parse(unit?.divider_data || "[]");
          } catch (e) {
            console.error("Error parsing divider_data", e);
          }
          const muntinText = jsonArray[0]?.divided_lite_type_text;
          return (
            <div key={index}>
              <div className="bg-primaryN20 px-2 py-1 text-lushAqua rounded-md mb-2 font-semibold">
                Sub Item {index + 1}
              </div>
              <div className="flex w-full justify-between ">
                <div className="flex flex-col gap-2">
                  <p className="font-semibold">Configuration</p>
                  <p>
                    <span className="text-grey-normal"> Category</span>{" "}
                    {getTextByOptionsValue(unit?.product)}
                  </p>
                  <p>
                    <span className="text-grey-normal"> Type </span>
                    {getTextByOptionsValue(unit?.product_type)}
                  </p>
                  <p>
                    <span className="text-grey-normal"> Open </span>{" "}
                    {getTextByOptionsValue(unit?.operability)}
                  </p>
                </div>
                <div className="w-1/2">
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold">Dimensions</p>
                    <p>
                      <span className="text-grey-normal"> Width </span>{" "}
                      {mmToInchesWithFraction(unit?.width_input)} |
                      <span className="text-grey-normal"> Height </span>
                      {mmToInchesWithFraction(unit?.height_input)}
                    </p>
                    <p className="font-semibold">Dividers</p>
                    <p className="flex gap-2">
                      {" "}
                      <span className="text-grey-normal"> Muntin </span>{" "}
                      {muntinText}
                      {hasBeenReviewed &&
                        muntinText &&
                        muntinText !== "None" && (
                          <InformationBadge
                            badge="sdl"
                            title={muntinText}
                            item={item}
                          />
                        )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-4 w-1/2 border border-primaryN30 rounded-xl px-7 py-5 max-h-[380px] overflow-auto scrollbar-hidden">
        <div className="flex gap-2 items-start">
          <Image
            src="/assets/icons/frame.svg"
            alt="Frame Icon"
            width={16}
            height={16}
            className="mt-0.5"
          />
          <div
            className="flex flex-col gap-2"
            onClick={() => setDefaultOpenSection("profile_line")}
          >
            <p className="text-lushAqua font-semibold">Frame</p>
            <div className="flex gap-2">
              {images.frame ? (
                <Image
                  src={images.frame}
                  alt="Frame Image"
                  width={45}
                  height={45}
                  className="w-12 h-12 rounded-lg"
                />
              ) : (
                <div
                  style={{
                    backgroundColor: `#${
                      item?.color?.find((c: any) => c.id === item?.color_input)
                        ?.color
                    }`,
                  }}
                  className="w-12 h-12 rounded-lg"
                />
              )}

              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <p>
                    <span className="text-grey-normal">Line </span>
                    {getTextByOptionsValue(item?.profile_line)}
                  </p>
                  {hasBeenReviewed && (
                    <InformationBadge badge="frame" title={frameTitle} />
                  )}
                </div>
                <p>
                  <span className="text-grey-normal">Material </span>
                  {getTextByOptionsValue(item?.material)}
                </p>
                <p>
                  <span className="text-grey-normal">Finish </span>
                  {getTextByOptionsValue(item?.finish_method) ===
                    "Powder Coating" ||
                  getTextByOptionsValue(item?.finish_method) ===
                    "Color Catalog - Powder Coating"
                    ? item?.color?.find((c: any) => c.id === item?.color_input)
                        ?.name
                    : getTextByOptionsValue(item?.finish_method)}
                </p>
                {(item?.finish_method?.selected_value === "126" ||
                  item?.finish_method?.selected_value === "210") && (
                  <p className="text-grey-normal text-xs">
                    AAMA 2604 certified
                  </p>
                )}
                {item?.frame_material === "BELLAVISTA-Steel" && (
                  <p>
                    <span className="text-grey-normal">G. Bead </span>
                    {getTextByOptionsValue(item?.casting_style)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex gap-2 items-start"
          onClick={() => setDefaultOpenSection("glass_style")}
        >
          <Image
            src="/assets/icons/glass.svg"
            alt="Glass Icon"
            width={16}
            height={16}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <p className="text-lushAqua font-semibold">Glass</p>
            <p>
              <span className="text-grey-normal">Brand </span>
              {getTextByOptionsValue(item?.glass_brand)}
            </p>
            <p>
              <span className="text-grey-normal">Type </span>
              {getTextByOptionsValue(item?.glass_style)}
            </p>
            <p className="text-grey-normal text-xs">
              All our glass is tempered.
            </p>
            <p>
              <span className="text-grey-normal">Low-E Coating </span>
              {getTextByOptionsValue(item?.glass_coating)}
            </p>
            <div className="flex gap-2">
              <p>
                <span className="text-grey-normal">Arrangement </span>

                {item?.glass_is_custom_arrangment
                  ? `Custom [${item?.glass_custom_arrangment}]`
                  : getTextByOptionsValue(item?.glass_specification)}
              </p>
              {hasBeenReviewed && (
                <InformationBadge
                  badge="glass"
                  title={glassArragement?.text}
                  details={glassArragement?.details}
                  type={glassType?.text}
                  coating={glassCoating?.text}
                  customGlass={item?.glass_custom_arrangment}
                  isGlassCustom={item?.glass_is_custom_arrangment}
                />
              )}
            </div>
          </div>
        </div>
        {item.units?.some((unit: any) => unit?.is_have_hardware_section) && (
          <div
            className="flex gap-2 items-start"
            onClick={() => setDefaultOpenSection("hardware_handle_style")}
          >
            <Image
              src="/assets/icons/hardware.svg"
              alt="Frame Icon"
              width={16}
              height={16}
              className="mt-0.5"
            />

            <div className="flex flex-col gap-2">
              <p className="text-lushAqua font-semibold">Hardware</p>
              <div className="flex gap-2">
                <Image
                  src={images.hardware}
                  alt="Hardware Image"
                  width={45}
                  height={45}
                  className="w-12 h-12"
                />
                <div className="flex flex-col gap-1">
                  <p>
                    <span className="text-grey-normal">Style </span>
                    {`${getTextByOptionsValue(
                      item?.units[0].hardware_handle_style,
                    )} | ${getTextByOptionsValue(
                      item?.units[0].hardware_handle_latii_style,
                    )}`}
                  </p>
                  <p>
                    <span className="text-grey-normal">Finish </span>
                    {getTextByOptionsValue(item?.units[0].hardware_finish)}
                  </p>
                  {item?.units[0].hardware_fixion?.selected_value && (
                    <p>
                      <span className="text-grey-normal">Fixions </span>
                      {getTextByOptionsValue(item?.units[0].hardware_fixion)}
                    </p>
                  )}
                  {item?.units[0].hardware_key_yes_no?.selected_value && (
                    <p>
                      <span className="text-grey-normal">Key </span>
                      {getTextByOptionsValue(
                        item?.units[0].hardware_key_yes_no,
                      )}
                    </p>
                  )}
                  {item?.units[0].hardware_keyed_aliked_yes_no
                    ?.selected_value && (
                    <p>
                      <span className="text-grey-normal">K. Alike </span>
                      {getTextByOptionsValue(
                        item?.units[0].hardware_keyed_aliked_yes_no,
                      )}
                    </p>
                  )}
                  <p className="text-grey-normal text-xs">
                    We use a Multi-lock system.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div
          className="flex gap-2 items-start"
          onClick={() => setDefaultOpenSection("installation_method")}
        >
          <Image
            src="/assets/icons/installation.svg"
            alt="Glass Icon"
            width={16}
            height={16}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <p className="text-lushAqua font-semibold">Installation</p>
            <p>
              <span className="text-grey-normal">Method </span>
              {getTextByOptionsValue(item?.installation_method)}
            </p>
            <p>
              <span className="text-grey-normal">Location </span>
              {renderNailingFinsText(
                item?.installation_nailing_fin?.selected_value,
              )}
            </p>
            <p>
              <span className="text-grey-normal">Glazed </span>
              {getTextByOptionsValue(item?.installation_glazed)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderBody = ({
  isNew,
  showHeader,
  isNewBodyDisabled,
  setIsModalOpen,
  status,
  isSystem,
  item,
  hasBeenReviewed,
  setDefaultOpenSection,
}: any) => {
  if (status === "upload" && !item?.is_started) {
    return <UploadBody />;
  }

  if (isNew) {
    return (
      <div className={`${!showHeader && "mt-28"}`}>
        <NewBody
          openModal={() => {
            setIsModalOpen(true);
          }}
          isDisabled={isNewBodyDisabled}
        />
      </div>
    );
  }

  if (isSystem) {
    return (
      <ContentBodySystem
        item={item}
        openModal={() => {
          setIsModalOpen(true);
        }}
        setDefaultOpenSection={setDefaultOpenSection}
        hasBeenReviewed={hasBeenReviewed}
      />
    );
  }

  return (
    <ContentBody
      item={item}
      openModal={() => {
        setIsModalOpen(true);
      }}
      setDefaultOpenSection={setDefaultOpenSection}
      hasBeenReviewed={hasBeenReviewed}
    />
  );
};

const ItemFormContent = ({
  item,
  handleSelectChange,
  index,
  handleMultipleChanges,
  status,
  quoteStatus,
}: ItemProps) => {
  const [isNew, setIsNew] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [defaultOpenSection, setDefaultOpenSection] =
    useState<SectionName>("casting_style");

  const [isNewBodyDisabled, setIsNewBodyDisabled] = useState(false);

  const hasBeenReviewed = Number(quoteStatus) > 200;

  const isSystem = item?.is_system;

  useEffect(() => {
    const shouldDisable = item?.profile_line?.disabled;
    setIsNewBodyDisabled(shouldDisable);
  }, [item?.profile_line]);

  useEffect(() => {
    if (!item) return;
    setIsNew(!item?.is_started);
    return;
  }, [item?.is_started]);

  useEffect(() => {
    console.log("current selected mode", item?.image?.current_selected_mode);

    if (
      item?.image?.current_selected_mode === "drawing" ||
      item?.image?.current_selected_mode === "extract" ||
      item?.image?.current_selected_mode === "upload"
    ) {
      setShowHeader(true);
    } else {
      setShowHeader(false);
    }
  }, [item?.image?.current_selected_mode]);

  useEffect(() => {
    if (isModalOpen) return;
    setDefaultOpenSection("profile_line");
  }, [isModalOpen]);

  const handleConfirm = () => {
    if (!handleSelectChange) return;
    handleSelectChange(true, index || 0, "is_started", false);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {showHeader && !isSystem && item?.is_started && (
        <ContentHeader item={item} hasBeenReviewed={hasBeenReviewed} />
      )}

      {renderBody({
        isNew,
        showHeader,
        isNewBodyDisabled,
        setIsModalOpen,
        status,
        isSystem,
        item,
        hasBeenReviewed,
        setDefaultOpenSection,
      })}

      {isModalOpen && (
        <NewItemModal
          closeModal={() => setIsModalOpen(false)}
          onCreate={() => handleConfirm()}
          item={item}
          handleSelectChange={handleSelectChange}
          index={index || 0}
          handleMultipleChanges={handleMultipleChanges}
          defaultOpenSection={defaultOpenSection}
        />
      )}
    </div>
  );
};

export default ItemFormContent;
