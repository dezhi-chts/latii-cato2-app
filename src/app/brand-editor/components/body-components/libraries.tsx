"use client";

import { useState, ComponentType } from "react";
import Parameter from "@/app/brand-editor/components/body-components/parameter";
import ParameterBaseEditor from "@/app/brand-editor/components/body-components/product-base-editor";
import ParameterOption from "@/app/brand-editor/components/body-components/parameter-option";

const parameterMap: Record<number, ComponentType> = {
  2.1: () => <Parameter />,
  2.2: () => <ParameterBaseEditor />,
  2.3: () => <ParameterOption />,
};

type HeaderOption = {
  id: number;
  text: string;
};

const Libraries = () => {
  const [tabs, setTabs] = useState<HeaderOption[]>([
    {
      id: 2.1, // Please avoid using float numbers as ids, Using decimal numbers as IDs is generally considered a bad practice, because it can cause precision and comparison issues later on.
      text: "Parameters",
    },
    {
      id: 2.2, // Please avoid using float numbers as ids, Using decimal numbers as IDs is generally considered a bad practice, because it can cause precision and comparison issues later on.
      text: "Base",
    },
    {
      id: 2.3, // Please avoid using float numbers as ids, Using decimal numbers as IDs is generally considered a bad practice, because it can cause precision and comparison issues later on.
      text: "Options",
    },
  ]);
  const [selectedTab, setSelectedTab] = useState<HeaderOption>({
    id: 2.1,
    text: "Parameters",
  });

  const handleSelectTab = (msg: HeaderOption) => {
    setSelectedTab(msg);
  };

  return (
    <div className="w-full h-full" style={{ marginTop: "-20px" }}>
      <div className="flex">
        {tabs.map((item) => {
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
              color: "#555555",
              width: "120px",
              height: "30px",
              background: "#ECF2FA",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bolder",
            };
          }
          return (
            <div
              onClick={() => handleSelectTab(item)}
              style={style}
              className="flex items-center justify-center"
              key={item.id}
            >
              {item.text}
            </div>
          );
        })}
      </div>
      <div className="mt-5">
        {selectedTab?.id &&
          (() => {
            const Component = parameterMap[selectedTab.id];
            return Component ? <Component /> : null;
          })()}
      </div>
    </div>
  );
};

export default Libraries;
