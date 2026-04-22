"use client";

import { useState } from "react";
import ProjectsSettings from "./settings-components/Projects-settings";
import QuoteSettings from "./settings-components/Quote-settings";

const Settings = () => {
  const tabs = [
    {
      id: 1,
      text: "Projects",
    },
    {
      id: 2,
      text: "Quotes",
    },
    {
      id: 3,
      text: "Items",
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
      <div className="flex gap-2 justify-start">
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
        {selectedTab.id === 2 && <QuoteSettings />}
      </div>
    </div>
  );
};

export default Settings;
