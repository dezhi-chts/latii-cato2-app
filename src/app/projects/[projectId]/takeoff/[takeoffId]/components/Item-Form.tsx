/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";

import ItemFormFooter from "./Item-Form-Footer";
import ImageSelector from "./Image-Selector";
import ItemFormContent from "./Item-Form-Content";
import LineSelector from "./LineSelector/Line-Selector";
import { LineSelectorStatus } from "../types/item";

type ItemFormProps = {
  item: any;
  index: number;
  handleSelectChange: (
    value: any,
    index: number,
    field: string | boolean,
    units?: boolean,
    $unit_index?: number
  ) => void;
  handleItemChange: (index: number, changeInfos: Array<any>) => void;
  quoteStatus: number | undefined;
  quoteTypeOfDataSource: number;
};

const ItemForm = ({
  item,
  index,
  handleItemChange,
  handleSelectChange,
  quoteStatus,
  quoteTypeOfDataSource,
}: ItemFormProps) => {
  const handleValue = (value: any) => {
    handleItemChange(index, [
      {
        value: value.item_type?.selected_value,
        field: "item_type",
        units: false,
      },
      {
        value: value?.image,
        field: "image",
        units: false,
      },
      { value: true, field: "is_page_edit", units: false },
      { value: value.units, field: "units", units: false },
    ]);
  };

  const handleImageCurrentSelectedMode = (value: any) => {
    handleItemChange(index, [
      {
        value: value?.image,
        field: "image",
        units: false,
      },
    ]);
  };

  const [lineSelectorStatus, setLineSelectorStatus] =
    useState<LineSelectorStatus>("enabled");

  useEffect(() => {
    const hasUploadedImage = item?.image?.current_selected_mode === "upload";
    if (hasUploadedImage) {
      setLineSelectorStatus("upload");
      return;
    } else {
      setLineSelectorStatus("enabled");
    }
  }, [item?.image]);

  return (
    <div className="border border-primaryN30 rounded-xl">
      <div className="flex gap-3 px-16 pt-6 pb-16">
        <div className="w-2/6 flex flex-col gap-4">
          <LineSelector
            productLine={item?.frame_material?.selected_value}
            onSelectChange={handleSelectChange}
            index={index}
            lineSelectorStatus={lineSelectorStatus}
          />
          <ImageSelector
            onValueChange={handleValue}
            handleImageCurrentSelectedMode={handleImageCurrentSelectedMode}
            item={item}
            quoteTypeOfDataSource={quoteTypeOfDataSource}
          />
        </div>
        <div className="w-full">
          <ItemFormContent
            item={item}
            handleSelectChange={handleSelectChange}
            index={index}
            handleMultipleChanges={handleItemChange}
            status={lineSelectorStatus}
            quoteStatus={quoteStatus}
          />
        </div>
      </div>
      <ItemFormFooter
        item={item}
        handleSelectChange={handleSelectChange}
        index={index}
        status={lineSelectorStatus}
      />
    </div>
  );
};

export default ItemForm;
