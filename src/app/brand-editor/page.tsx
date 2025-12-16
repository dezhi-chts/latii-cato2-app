"use client";

import { useState } from "react";
import Header from "./components/Header";
import Body from "./components/Body";

const BrandEditor = () => {
  const [selectedOptionId, setSelectedOptionId] = useState<number>(1);
  return (
    <div className="pt-14">
      <Header
        selectedOptionId={selectedOptionId}
        setSelectedOptionId={setSelectedOptionId}
      />
      <Body selectedOptionId={selectedOptionId} />
    </div>
  );
};

export default BrandEditor;
