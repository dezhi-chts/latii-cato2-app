"use client";

import Header from "./components/Header";
import { ConfigProvider, Tabs } from "antd";
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
    <div className="pt-12 flex flex-col gap-4">
      <div className="flex items-center pl-12 pb-1">
        <Header />
      </div>
      <ConfigProvider
        theme={{
          components: {
            Tabs: {
              inkBarColor: "#555555",
              itemSelectedColor: "#555555",
              itemColor: "#A3A3A3",
              itemHoverColor: "#555555",
            },
          },
        }}
      >
        <Tabs
          className="[&_.ant-tabs-tab]:w-36 [&_.ant-tabs-tab]:justify-center [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav::before]:border-b-primaryN30 [&_.ant-tabs-nav::before]:!opacity-100 [&_.ant-tabs-nav-wrap]:pl-12"
          defaultActiveKey="1"
          items={items}
        />
      </ConfigProvider>
    </div>
  );
};

export default Page;
