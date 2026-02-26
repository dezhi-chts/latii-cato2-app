import { Checkbox, Divider, Input } from "antd";

import { FooterProps } from "../types/item";
import { convertToCurrencyFormat } from "@/lib/functions";
import { useEffect, useState } from "react";

const ItemFormFooter = ({
  item,
  handleSelectChange,
  index,
  isFormDisabled,
  status,
}: FooterProps) => {
  const isUpload = status === "upload" && !item?.is_started;

  const [settings, setSettings] = useState<any>({
    quantity: item?.quantity,
    installation_location: item?.installation_location,
  });

  const handleSettingsChange = (field: keyof typeof settings, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    setSettings((prev: any) => ({
      ...prev,
      quantity: item?.quantity,
      installation_location: item?.installation_location,
    }));
  }, [item?.quantity, item?.installation_location]);

  return (
    <div className="border-t border-primaryN30 px-8 py-4 flex justify-between items-center">
      <div className="flex items-center gap-7">
        <div className="flex items-center gap-4">
          <p className="text-sm">Quantity</p>
          <Input
            className="w-16 rounded-2xl"
            value={settings.quantity}
            disabled={isFormDisabled}
            onChange={(e) => {
              if (isFormDisabled) return;
              handleSettingsChange("quantity", Number(e.target.value));
            }}
            onBlur={(e) => {
              if (isFormDisabled) return;
              handleSelectChange(
                Number(e.target.value),
                index,
                "quantity",
                false,
              );
            }}
          />
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm">Location</p>
          <Input.TextArea
            className="w-56 rounded-2xl "
            value={settings.installation_location}
            disabled={isFormDisabled}
            autoSize={{ minRows: 1, maxRows: 3 }}
            onChange={(e) => {
              if (isFormDisabled) return;
              handleSettingsChange("installation_location", e.target.value);
            }}
            onBlur={(e) => {
              if (isFormDisabled) return;
              handleSelectChange(
                e.target.value,
                index,
                "installation_location",
                false,
              );
            }}
          />
        </div>
      </div>
      <div
        className={`flex py-1 px-4 rounded-lg gap-6 items-center ${
          isUpload && "bg-dragonOrange/10"
        }`}
      >
        {item?.discount < 0 && (
          <div className="text-sm">
            <p>{isUpload ? "$-" : convertToCurrencyFormat(item?.discount)}</p>
            <p className="text-grey-normal text-xs">Discount</p>
          </div>
        )}
        <div className="text-sm">
          <p>{isUpload ? "$-" : convertToCurrencyFormat(item?.item_price)}</p>
          <p className="text-grey-normal text-xs">Per Item</p>
        </div>
        <div className="text-sm">
          <p>{isUpload ? "0" : Number(item?.area).toFixed(0) || 0}</p>
          <p className="text-grey-normal text-xs">sf</p>
        </div>
        <div className="text-sm">
          <p>{isUpload ? "$-" : convertToCurrencyFormat(item?.price_sqft)}</p>
          <p className="text-grey-normal text-xs">$/sq</p>
        </div>
        <Divider type="vertical" className=" h-10 bg-primaryN30" />
        <div className="text-sm">
          <p className={`${isUpload ? "text-dragonOrange" : "text-kahuBlue"}`}>
            {isUpload ? "$-" : convertToCurrencyFormat(item?.item_total_price)}
          </p>

          <p className="text-grey-normal text-xs">Total</p>
        </div>
      </div>
    </div>
  );
};

export default ItemFormFooter;
