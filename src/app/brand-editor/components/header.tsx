"use client";

import React from "react";

const Header = () => {
  return (
    <div className="w-full flex flex-col gap-2 border-b-primaryN30 border-b">
      <div className="flex flex-col gap-1.5 pl-10 pb-4">
        <p className="text-[#717171] text-lg" style={{ fontSize: "18px" }}>
          Your Company
        </p>
        <p className="text-baseGray text-sm">
          Save all the information of your company
        </p>
      </div>
    </div>
  );
};

export default Header;
