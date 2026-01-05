"use client";

import Header from "./components/Header";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import YourTemplatesTab from "./components/YourTemplatesTab";
import PromptLibraryTab from "./components/PromptLibraryTab";
const Page = () => {
  const onChange = (key: string) => {
    console.log(key);
  };

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Your Templates",
      children: <YourTemplatesTab />,
    },
    {
      key: "2",
      label: "Prompt Library",
      children: <PromptLibraryTab />,
    },
  ];
  return (
    <div className="pl-10">
      <div className="flex items-center h-[15vh]">
        <Header />
      </div>
      <div className="h-[80vh] w-[90vw] flex gap-10">
        <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
      </div>
    </div>
  );
};

export default Page;
