"use client";

import Header from "@/app/brand-editor/components/header";
import Company from "./components/body-components/company";

const BrandEditor = () => {
  return (
    <div className="pt-8">
      <Header />
      <div className="w-full h-full pl-10 pt-10">
        <Company />
      </div>
    </div>
  );
};

export default BrandEditor;
