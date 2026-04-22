"use client";

import { useState } from "react";
import ProjectsSettings from "./settings-components/Projects-settings";
import BoxesType from "./settings-components/ Boxes-Type";
import Libraries from "@/app/brand-editor/components/body-components/libraries";
import ProductEditor from "@/app/brand-editor/components/body-components/product-editor";

const Settings = () => {
  const tabs = [
    {
      id: 1,
      text: "Projects",
    },
    {
      id: 2,
      text: "Boxes Type",
    },
    {
      id: 3,
      text: "Libraries",
    },
    {
      id: 4,
      text: "Product Editor",
    },
  ];

  const [selectedTab, setSelectedTab] = useState<any>({
    id: 1,
    text: "Projects",
  });

  const handleSelectTab = (msg: any) => {
    setSelectedTab(msg);
  };
  return (
    <div className="w-full h-full pl-6">
      <div className="flex gap-2 justify-start sticky top-[110px] pt-8 w-full bg-white z-50">
        {tabs.map((item: any) => {
          return (
            <div
              key={item.id}
              onClick={() => handleSelectTab(item)}
              className={`flex items-center justify-center w-32 h-8 rounded-md cursor-pointer text-xs ${
                item.id === selectedTab.id
                  ? "bg-forumBlue-light text-grey-dark font-semibold"
                  : "bg-white text-grey-light-strong"
              }`}
            >
              {item.text}
            </div>
          );
        })}
      </div>
      <div className="pl-6 pt-10">
        {selectedTab.id === 1 && <ProjectsSettings />}
        {selectedTab.id === 2 && <BoxesType />}
        {selectedTab.id === 3 && <Libraries />}
        {selectedTab.id === 4 && <ProductEditor />}
      </div>
    </div>
  );
};

export default Settings;
