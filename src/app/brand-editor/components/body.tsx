"use client";

import { ComponentType } from "react";
import Company from "@/app/brand-editor/components/body-components/company";
import Libraries from "@/app/brand-editor/components/body-components/libraries";
// import ProductEditor from "@/app/brand-editor/components/body-components/product-editor";
import Settings from "./body-components/settings";

const bodyMap: Record<number, ComponentType> = {
  1: () => <Company />,
  2: () => <Libraries />,
  3: () => <div />,
  4: () => <div />,
  5: () => <Settings />,
};

const Body = ({ selectedOptionId }: { selectedOptionId: number }) => {
  const Component = bodyMap[selectedOptionId];

  return (
    <div className="w-full h-full pl-10 pt-10">
      {Component ? <Component /> : null}
    </div>
  );
};

export default Body;
