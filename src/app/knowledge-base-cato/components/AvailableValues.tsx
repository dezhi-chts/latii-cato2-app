"use client";

import { useState } from "react";
import { PlusOutlined, DeleteOutlined, StarOutlined, StarFilled } from "@ant-design/icons";
import Image from "next/image";

interface ValueItem {
  id: string;
  value: string;
  isDefault?: boolean;
}

interface AvailableValuesProps {
  values: ValueItem[];
  onChange: (values: ValueItem[]) => void;
}

export const AvailableValues = ({ values, onChange }: AvailableValuesProps) => {
  const [newValue, setNewValue] = useState("");

  const handleAddValue = () => {
    if (newValue.trim()) {
      const newItem: ValueItem = {
        id: Date.now().toString(),
        value: newValue.trim(),
        isDefault: values.length === 0,
      };
      onChange([...values, newItem]);
      setNewValue("");
    }
  };

  const handleDeleteValue = (id: string) => {
    onChange(values.filter((v) => v.id !== id));
  };

  const handleSetDefault = (id: string) => {
    onChange(
      values.map((v) => ({
        ...v,
        isDefault: v.id === id,
      }))
    );
  };

  return (
    <div className="flex-1">
      <div className={`flex flex-col gap-2 rounded-md ${values.length > 0 ? "border border-primaryN30 " : ""}`}>
        {values.map((item) => (
          <div
            key={item.id}
            className="px-4 flex items-center justify-between py-2 border-b border-primaryN30"
          >
            <span className="text-xs text-grey-normal">{item.value}</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-lg cursor-pointer ${item.isDefault ? "text-forumBlue-normal bg-[#5856D733]" : "text-basicLightGray bg-primaryN20"
                  }`}
                onClick={() => handleSetDefault(item.id)}
              >
                Default
              </span>
              <button
                className="text-grey-normal hover:text-red-500"
                onClick={() => handleDeleteValue(item.id)}
              >
                <Image src="/assets/icons/delete.svg" alt="plus icon" width={15} height={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Add New Value */}
      <div className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Enter new value"
          className="flex-1 px-3 py-1.5 border border-primaryN30 rounded-md text-xs focus:outline-none focus:border-forumBlue-normal"
          onKeyDown={(e) => e.key === "Enter" && handleAddValue()}
        />
        <button
          className="px-3 py-1.5 bg-forumBlue-light text-forumBlue-normal rounded-md text-xs hover:bg-forumBlue-light-active flex items-center gap-1"
          onClick={handleAddValue}
        >
          <PlusOutlined className="text-xs" />
          <span>Value</span>
        </button>
      </div>
    </div>

  );
};
