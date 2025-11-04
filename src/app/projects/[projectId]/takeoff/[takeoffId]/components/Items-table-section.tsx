"use client";

import Button from "@/components/Button";
import { Checkbox, Divider, Input } from "antd";
import Image from "next/image";
import { useState } from "react";

const columnsWidthPercentage = {
  checkbox: 4,
  state: 5,
  number: 3,
  label: 10,
  location: 10,
  quantity: 6,
  category: 7,
  type: 12,
  width: 5,
  height: 5,
  perimeter: 4,
  area: 4,
  finish: 5,
  glass_specifications: 10,
};

const ItemsTableSection = ({ takeOff }: any) => {
  const [filter, setFilter] = useState("");

  const items = takeOff?.take_off_result?.items;
  return (
    <div className="flex flex-col gap-4 w-full pt-8">
      <p className="text-forumBlue text-sm">Items</p>
      <div className="flex justify-between w-full">
        <Input
          className="rounded-full w-80 text-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          prefix={
            <Image
              src="/assets/icons/search.svg"
              alt="search icon"
              width={11}
              height={11}
            />
          }
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            borderColor="primaryN30"
            className="!text-basicGray text-xs"
          >
            Reconcile Items
          </Button>
          <Button variant="outline" borderColor="forumBlue" className="text-xs">
            Add Item
          </Button>
        </div>
      </div>
      <div>
        <Table />
        {items?.map((item: any, index: number) => {
          const data = JSON.parse(item?.result);

          if (!data) return null;
          if (
            filter &&
            !data?.Label?.toLowerCase().includes(filter.toLowerCase())
          )
            return null;

          return (
            <div className="pb-0 pt-2">
              <Row data={data} key={index} index={index} />
              <Divider className="mt-2 mb-0 bg-primaryN30" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ItemsTableSection;

const Table = () => {
  return (
    <div className="flex gap-2 text-basicGray text-xxs font-semibold text-center items-center bg-primaryN20 rounded-t-lg px-1 py-2">
      <Checkbox
        className={`w-[${columnsWidthPercentage.checkbox}%] flex justify-center`}
      />
      <p className={`w-[${columnsWidthPercentage.state}%]`}>State</p>
      <p className={`w-[${columnsWidthPercentage.number}%]`}>#</p>
      <p className={`w-[${columnsWidthPercentage.label}%]`}>Label</p>
      <p className={`w-[${columnsWidthPercentage.location}%]`}>Location</p>
      <p className={`w-[${columnsWidthPercentage.quantity}%]`}>Quantity</p>
      <p className={`w-[${columnsWidthPercentage.category}%]`}>Category</p>
      <p className={`w-[${columnsWidthPercentage.type}%]`}>Type</p>
      <p className={`w-[${columnsWidthPercentage.width}%]`}>Width</p>
      <p className={`w-[${columnsWidthPercentage.height}%]`}>Height</p>
      <p className={`w-[${columnsWidthPercentage.perimeter}%]`}>Perim.</p>
      <p className={`w-[${columnsWidthPercentage.area}%]`}>Area</p>
      <p className={`w-[${columnsWidthPercentage.finish}%]`}>Finish</p>
      <p
        className={`w-[${columnsWidthPercentage.glass_specifications}%] whitespace-nowrap`}
      >
        Glass Spec.
      </p>
    </div>
  );
};

const Row = ({ data, index }: any) => {
  console.log(data);
  return (
    <div className="flex gap-2 items-center text-xxs w-full text-center px-1">
      <Checkbox
        disabled
        className={`w-[${columnsWidthPercentage.checkbox}%] flex justify-center`}
      />
      <p className={`w-[${columnsWidthPercentage.state}%]`}>-</p>
      <p className={`w-[${columnsWidthPercentage.number}%]`}>{index + 1}</p>
      <p className={`w-[${columnsWidthPercentage.label}%] truncate`}>
        {data?.Label || "-"}
      </p>
      <p className={`w-[${columnsWidthPercentage.location}%]`}>
        {data?.Location || "-"}
      </p>
      <p className={`w-[${columnsWidthPercentage.quantity}%]`}>
        {data?.Quantity}
      </p>
      <p className={`w-[${columnsWidthPercentage.category}%]`}>
        {data?.Product || "Not found"}
      </p>
      <p className={`w-[${columnsWidthPercentage.type}%] truncate`}>
        {data?.["Product Type"] || "-"}
      </p>
      <p className={`w-[${columnsWidthPercentage.width}%]`}>{data?.Width}"</p>
      <p className={`w-[${columnsWidthPercentage.height}%]`}>{data?.Height}"</p>
      <p className={`w-[${columnsWidthPercentage.perimeter}%]`}>
        {data?.Perimeter || "-"}
      </p>
      <p className={`w-[${columnsWidthPercentage.area}%]`}>
        {data?.Area || "-"}
      </p>
      <p className={`w-[${columnsWidthPercentage.finish}%]`}>
        {data?.Finish || "-"}
      </p>
      <p className={`w-[${columnsWidthPercentage.glass_specifications}%]`}>
        {data?.["Glass Specifications"] || "-"}
      </p>
    </div>
  );
};
