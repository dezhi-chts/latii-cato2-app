"use client";

import { useUser } from "@/context/UserContext";
import { ConfigProvider } from "antd";

import YourProfile from "./components/YourProfile";
import TeamMembers from "./components/TeamMembers";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const AccountSettings = () => {
  const { isAdmin } = useUser();

  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  const defaultKey = useMemo(() => {
    if (tab === "team-management") return "2";
    return "1";
  }, [tab]);

  const tabs = [
    {
      id: "1",
      text: "Your Profile",
    },
  ];

  const adminTabs = [
    {
      id: "1",
      text: "Your Profile",
    },
    {
      id: "2",
      text: "Team Management",
    },
  ];

  const items = isAdmin ? adminTabs : tabs;

  const [selectedTabId, setSelectedTabId] = useState<any>(defaultKey);

  return (
    <div className="mt-10 flex flex-col gap-2 w-full">
      <div className="flex flex-col gap-1 pl-12 border-b border-grey-light-hover pb-6 mb-4">
        <p className="text-xl text-forumBlue-normal">Account Preferences</p>
        <p className="text-xs text-grey-normal">
          Manage your data and your team members, privacy and security.
        </p>
      </div>

      <div className="flex pl-12 gap-2">
        {items.map((item: any) => {
          return (
            <div
              key={item.id}
              onClick={() => setSelectedTabId(item.id)}
              className={`flex items-center justify-center w-32 h-8 rounded-md cursor-pointer text-xs ${
                item.id === selectedTabId
                  ? "bg-forumBlue-light text-grey-dark font-semibold"
                  : "bg-white text-grey-light-strong"
              }`}
            >
              {item.text}
            </div>
          );
        })}
      </div>
      <div className={selectedTabId === "1" ? "block" : "hidden"}>
        <YourProfile />
      </div>

      <div className={selectedTabId === "2" ? "block" : "hidden"}>
        <TeamMembers />
      </div>
    </div>
  );
};

export default AccountSettings;
