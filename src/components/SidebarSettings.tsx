"use client";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { useEffect, useRef } from "react";

type SidebarSettingsProps = {
  open: boolean;
  expanded: boolean;
  toggleExpand: (field: "recent" | "favorite" | "sidebar") => void;
  toggleModal: (field: "settings" | "logout" | "createProject") => void;
  openLogoutModal: () => void;
};

export default function SidebarSettings({
  open,
  expanded,
  toggleExpand,
  toggleModal,
  openLogoutModal,
}: SidebarSettingsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { first_name, last_name, email } = useUser();

  const handleSignoutClick = () => {
    if (expanded) toggleExpand("sidebar");
    openLogoutModal();
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (open) toggleModal("settings");
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className={`absolute transition-all duration-700 ease-in-out ${
        expanded ? "left-24" : "left-6"
      } bottom-0 w-48 bg-white border border-baseLightHover  rounded-lg overflow-hidden z-50`}
      ref={containerRef}
    >
      <div
        className="h-fit w-full border-b cursor-default border-baseLightHover px-4 py-2 flex flex-col gap-1"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <p className="text-sm truncate">
          {first_name} {last_name}
        </p>
        <p className="text-xs text-basicGray truncate">{email}</p>
      </div>
      <ul className="text-sm">
        <li className="px-4 py-2 hover:bg-primaryN30 cursor-pointer">
          <Link href="/account-settings">Account Settings</Link>
        </li>
        <li
          className="px-4 py-2 hover:bg-primaryN30 cursor-pointer text-accentRed"
          onClick={handleSignoutClick}
        >
          Sign Out
        </li>
      </ul>
    </div>
  );
}
