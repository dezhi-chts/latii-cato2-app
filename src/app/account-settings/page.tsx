"use client";

import { useUser } from "@/context/UserContext";
import { ConfigProvider, Tabs, TabsProps } from "antd";

import YourProfile from "./components/YourProfile";
import TeamMembers from "./components/TeamMembers";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const AccountSettings = () => {
  const { isAdmin } = useUser();

  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const defaultKey = useMemo(() => {
    if (tab === "team-management") return "2";
    return "1";
  }, [tab]);

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
    <div className="mt-10 flex flex-col gap-2 w-full">
      <div className="flex flex-col gap-1 pl-12">
        <p className="text-xl text-forumBlue-normal">Account Preferences</p>
        <p className="text-xs text-grey-normal">
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
          className="[&_.ant-tabs-tab]:w-36 [&_.ant-tabs-tab]:justify-center [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav::before]:border-b-primaryN30 [&_.ant-tabs-nav::before]:!opacity-100 [&_.ant-tabs-nav-wrap]:pl-12"
          defaultActiveKey={defaultKey}
          items={isAdmin ? itemsAdmin : items}
        />
      </ConfigProvider>
    </div>
  );
};

export default AccountSettings;
