"use client";

import { div } from "framer-motion/m";
import { useState } from "react";
import ProjectsSettings from "./settings-components/Projects-settings";

const Settings = () => {
  const [tabs, setTabs] = useState<any>([
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
  ]);
  const [selectedTab, setSelectedTab] = useState<any>({
    id: 1,
    text: "Projects",
  });

  const handleSelectTab = (msg: any) => {
    setSelectedTab(msg);
  };
  return (
    <div className="w-full h-full">
      <div className="flex gap-2 justify-start">
        {tabs.map((item: any) => {
          let style: any = {
            color: "#A3A3A3",
            width: "120px",
            height: "30px",
            borderRadius: "6px",
            background: "#fff",
            cursor: "pointer",
            fontSize: "12px",
          };

          if (item.id === selectedTab.id) {
            style = {
              ...style,
              color: "#555555",
              background: "#ECF2FA",
              fontWeight: "bolder",
            };
          }

          return (
            <div
              key={item.id}
              onClick={() => handleSelectTab(item)}
              style={style}
              className="flex items-center justify-center"
            >
              {item.text}
            </div>
          );
        })}
      </div>
      <div>{selectedTab.id === 1 && <ProjectsSettings />}</div>
    </div>
  );
};

export default Settings;
