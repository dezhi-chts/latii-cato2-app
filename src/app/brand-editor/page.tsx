"use client";

import { useState } from "react";
import Header from "@/app/brand-editor/components/header";
import Body from "@/app/brand-editor/components/body";
import Company from "./components/body-components/company";

const BrandEditor = () => {
  const [selectedOptionId, setSelectedOptionId] = useState<number>(1);
  return (
    <div className="pt-8">
      <Header
        selectedOptionId={selectedOptionId}
        setSelectedOptionId={setSelectedOptionId}
      />
      {/* <Body selectedOptionId={selectedOptionId} /> */}
      <div className="w-full h-full pl-10 pt-10">
        <Company />
      </div>
    </div>
  );
};

export default BrandEditor;
