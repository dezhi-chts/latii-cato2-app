"use client";

import { Menu, Dropdown } from "antd";
import React from "react";

type HeaderOption = {
  id: number;
  text: string;
};

const headerOptions: HeaderOption[] = [
  {
    id: 1,
    text: "Your Company",
  },
  {
    id: 2,
    text: "Libraries",
  },
  {
    id: 5,
    text: "Settings",
  },
];

type HeaderProps = {
  selectedOptionId: number;
  setSelectedOptionId: React.Dispatch<React.SetStateAction<number>>;
};

const Header = ({ selectedOptionId, setSelectedOptionId }: HeaderProps) => {
  const handleOptionClick = (id: number) => {
    if (id === selectedOptionId) return;
    setSelectedOptionId(id);
  };

  return (
    <div className="w-full flex flex-col gap-2 border-b-primaryN30 border-b">
      <div className="flex flex-col gap-1.5 pl-10">
        <p className="text-forumBlue" style={{ fontSize: "18px" }}>
          Brand Management
        </p>
      </div>

      <div className="flex pl-10 relative" style={{ bottom: "-1px" }}>
        {headerOptions.map((option, index) => {
          let isSelected = option.id === selectedOptionId;
          const conditionalStyle = isSelected
            ? {
                color: "#427CCE",
                borderBottom: "2px solid #427CCE",
                fontWeight: "border",
              }
            : {
                color: "#A3A3A3",
              };
          return (
            <div
              className="p-4 cursor-pointer text-xs"
              style={conditionalStyle}
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
            >
              {option.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Header;
