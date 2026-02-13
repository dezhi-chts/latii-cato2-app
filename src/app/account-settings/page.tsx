"use client";

import { useUser } from "@/context/UserContext";
import { ConfigProvider, Tabs, TabsProps } from "antd";

import YourProfile from "./components/YourProfile";
import TeamMembers from "./components/TeamMembers";

const AccountSettings = () => {
  const { isAdmin } = useUser();

  const itemsAdmin: TabsProps["items"] = [
    {
      key: "1",
      label: "Your Profile",
      children: <YourProfile />,
    },
    {
      key: "2",
      label: "Team Management",
      children: <TeamMembers />,
    },
  ];

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Your Profile",
      children: <YourProfile />,
    },
  ];
  return (
    <div className="pl-12 mt-10 flex flex-col gap-4 w-full zoomed-container">
      <div className="flex flex-col gap-1">
        <p className="text-xl text-forumBlue">Account Preferences</p>
        <p className="text-xs text-basicGray">
          Manage your data and your team members, privacy and security.
        </p>
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
          className="[&_.ant-tabs-tab]:w-36 [&_.ant-tabs-tab]:justify-center [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav::before]:border-b-primaryN30 [&_.ant-tabs-nav::before]:!opacity-100"
          defaultActiveKey="1"
          items={isAdmin ? itemsAdmin : items}
        />
      </ConfigProvider>
    </div>
  );
};

export default AccountSettings;
