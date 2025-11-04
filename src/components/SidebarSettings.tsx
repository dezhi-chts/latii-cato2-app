"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

type SidebarSettingsProps = {
  open: boolean;
  expanded: boolean;
  setOpen: (open: boolean) => void;
  toggleExpand: (field: "recent" | "favorite" | "sidebar") => void;
};

export default function SidebarSettings({
  open,
  expanded,
  setOpen,
  toggleExpand,
}: SidebarSettingsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [open, setOpen]);

  const handleClose = () => {
    setTimeout(() => {
      setOpen(false);
      if (expanded) {
        toggleExpand("sidebar");
      }
    }, 10);
  };

  if (!open) return null;
  return (
    <div
      className={`absolute transition-all duration-700 ease-in-out ${
        expanded ? "left-24" : "left-6"
      } bottom-0 w-48 bg-white shadow-lg rounded-lg overflow-hidden z-50`}
      ref={containerRef}
    >
      <ul className="space-y-1">
        <li>
          <Link
            href="/account-settings"
            onClick={handleClose}
            className="px-2 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-1"
          >
            <Image
              src="/assets/icons/account.svg"
              alt="profile icon"
              width={20}
              height={20}
            />
            <p className="text-sm">Account Settings</p>
          </Link>
        </li>
        {/*<li className="px-2 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-1">*/}
        {/*  <Image*/}
        {/*    src="/assets/icons/logout-orange.svg"*/}
        {/*    alt="profile icon"*/}
        {/*    width={20}*/}
        {/*    height={20}*/}
        {/*  />*/}
        {/*  <p className="text-dragonOrange text-sm">Logout</p>*/}
        {/*</li>*/}
      </ul>
    </div>
  );
}
