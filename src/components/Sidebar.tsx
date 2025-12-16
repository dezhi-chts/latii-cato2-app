"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SidebarSettings from "./SidebarSettings";
import CreateProjectModal from "@/app/projects/[projectId]/components/Create-Project-Modal";
import { useUser } from "@/context/UserContext";
import { ProjectSettings } from "@/types/project";
import { signOut } from "next-auth/react";
import LogoutModal from "./Logout-Modal";
import { usePathname } from "next/navigation";
import { UserDataForUpdate } from "@/types/user";

export default function Sidebar() {
  const { email, first_name, force_logout, clearLocalStorage } = useUser();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [expanded, setExpanded] = useState({
    sidebar: false,
    recent: false,
    favorite: false,
    all: false,
  });
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const [showModal, setShowModal] = useState({
    createProject: false,
    settings: false,
  });
  const [loadingExpansion, setLoadingExpansion] = useState(false);
  const [showInitialStyles, setShowInitialStyles] = useState(false);
  const [userData, setUserData] = useState<UserDataForUpdate>({
    first_name: first_name,
    last_name: "",
    email: email,
  });

  useEffect(() => {
    setUserData((prev) => ({
      ...prev,
      first_name: first_name,
      email: email,
    }));
  }, [first_name, email]);

  const toggleExpand = useCallback(
    (field: "recent" | "favorite" | "sidebar" | "all") => {
      if (field === "recent") {
        setExpanded((prev) => ({
          ...prev,
          recent: !prev.recent,
        }));
        if (expanded.sidebar) return;
      }
      if (field === "favorite") {
        setExpanded((prev) => ({
          ...prev,
          favorite: !prev.favorite,
        }));
        if (expanded.sidebar) return;
      }
      if (field === "all") {
        setExpanded((prev) => ({
          ...prev,
          all: !prev.all,
        }));
        if (expanded.sidebar) return;
      }

      setLoadingExpansion((prev) => !prev);

      if (expanded.sidebar) {
        setTimeout(() => {
          setExpanded({
            recent: false,
            favorite: false,
            sidebar: false,
            all: false,
          });
        }, 100);
        setTimeout(() => {
          setShowInitialStyles(false);
        }, 700);
        return;
      }

      setShowInitialStyles(true);
      setTimeout(() => {
        setExpanded((prev) => ({
          ...prev,
          sidebar: !prev.sidebar,
        }));
      }, 250);
    },
    [expanded.sidebar]
  );

  const sidebarIcon = expanded.sidebar
    ? "/assets/icons/collapse.svg"
    : "/assets/icons/expand.svg";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        if (expanded.sidebar) toggleExpand("sidebar");
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [expanded.sidebar, toggleExpand]);

  const openModal = () => {
    setLogoutModalVisible(true);
  };

  const closeModal = () => {
    setLogoutModalVisible(false);
  };

  const handleLogout = async () => {
    clearLocalStorage();
    await signOut();
    closeModal();
  };

  useEffect(() => {
    if (force_logout) {
      console.log(force_logout);
      handleLogout();
    }
  }, [force_logout]);

  const activePage = usePathname();

  if (activePage.startsWith("/public")) return null;

  return (
    <div>
      <div
        className={`sidebar-container border-r border-primaryN30 shadow-md ${
          loadingExpansion ? "w-[486px] px-8" : "w-16"
        } 
      ${!expanded.sidebar && "cursor-pointer"}
      top-0 z-[9999] fixed flex h-screen flex-col justify-between  bg-white p-3 text-primaryN900 transition-all linear duration-700`}
        ref={sidebarRef}
        onClick={() => {
          !expanded.sidebar && toggleExpand("sidebar");
        }}
      >
        <div>
          <div className={`mb-6 pr-2 flex justify-end `}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand("sidebar");
              }}
              className="h-8"
            >
              <Image
                src={sidebarIcon}
                alt="Sidebar icon"
                width={30}
                height={30}
                style={{ width: "auto", height: "auto" }}
              />
            </button>
          </div>
          <div className="mb-10 flex gap-4 h-12">
            <div className={`h-10`}>
              <Image
                src={"/assets/logos/forum-logo.png"}
                alt="Latii logo"
                width={40}
                height={40}
                priority
              />
            </div>

            {expanded.sidebar && (
              <div className="flex flex-col">
                <span className="font-light capitalize">
                  {userData.first_name || "User"}
                </span>
                <span className="text-xs font-light">
                  {userData.email || "user@example.com"}
                </span>
              </div>
            )}
          </div>
          <div
            className="flex flex-col gap-1.5 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={`${
                expanded.sidebar ? "px-3.5 mr-8" : ""
              } h-6 border-primaryN900 text-sm border rounded-xl  flex items-center justify-center gap-2.5 mb-2`}
              onClick={(e) => {
                e.stopPropagation();
                setShowModal((prev) => ({ ...prev, createProject: true }));
              }}
            >
              <Image
                src="/assets/icons/add.svg"
                alt="add icon"
                width={8}
                height={8}
                style={{ width: "auto", height: "auto" }}
              />
              {expanded.sidebar && "New Project"}
            </button>
            <Link href="/home">
              <div
                className={`flex gap-4 rounded-xl ${
                  showInitialStyles ? "" : " justify-start"
                } h-8 w-10 items-center pl-2.5 cursor-pointer gap-4`}
              >
                <div className="relative w-fit flex gap-4 h-5 items-center">
                  <div className="w-[18px] h-[18px]">
                    <HomeIcon showInitialStyles={showInitialStyles} />
                  </div>

                  {expanded.sidebar && "Home"}
                </div>
              </div>
            </Link>
            <Link href="/brand-editor">
              <div
                className={`flex gap-4 rounded-xl ${
                  showInitialStyles ? "" : " justify-start"
                } h-8 w-10 items-center pl-2.5 cursor-pointer gap-4`}
              >
                <div className="w-[18px] h-[18px]">
                  <EditIcon showInitialStyles={showInitialStyles} />
                </div>
                <p className="whitespace-nowrap">
                  {expanded.sidebar && "Brand & Price Editor"}
                </p>
              </div>
            </Link>
            <Link href="/knowledge-base">
              <div
                className={`flex gap-4 rounded-xl ${
                  showInitialStyles ? "" : " justify-start"
                } h-8 w-10 items-center pl-2.5 cursor-pointer gap-4`}
              >
                <div className="relative w-fit flex gap-4 h-5 items-center">
                  <div className="w-[18px] h-[18px]">
                    <KnowledgeBaseIcon showInitialStyles={showInitialStyles} />
                  </div>

                  <p className="whitespace-nowrap">
                    {expanded.sidebar && "Knowledge Base"}
                  </p>
                </div>
              </div>
            </Link>
            <Link href="/ask-lucius">
              <div
                className={`flex gap-4 rounded-xl ${
                  showInitialStyles ? "" : " justify-start"
                } h-8 w-10 items-center pl-2.5 cursor-pointer gap-4`}
              >
                <Image
                  src="/assets/logos/lucius-new-logo.png"
                  alt="Lucius logo"
                  width={18}
                  height={18}
                  className="w-[18px] h-[18px]"
                />
                <p className="whitespace-nowrap">
                  {expanded.sidebar && "Ask Lucius"}
                </p>
              </div>
            </Link>
          </div>
        </div>
        <div
          className="flex flex-col pl-3 h-14 justify-around text-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`flex items-center cursor-pointer hover:underline w-fit relative ${
              expanded.sidebar && "gap-2"
            }`}
            onClick={() =>
              setShowModal((prev) => ({ ...prev, settings: !prev.settings }))
            }
          >
            <Image
              src="/assets/icons/settings.svg"
              alt="Settings"
              width={20}
              height={20}
            />
            <span className=""> {expanded.sidebar ? "Settings" : ""} </span>{" "}
            <SidebarSettings
              open={showModal.settings}
              setOpen={() =>
                setShowModal((prev) => ({ ...prev, settings: false }))
              }
              expanded={loadingExpansion}
              toggleExpand={toggleExpand}
            />
          </div>
          <div
            className={`flex items-center cursor-pointer hover:underline w-fit ${
              expanded.sidebar && "gap-2"
            }`}
            onClick={openModal}
          >
            <Image
              src="/assets/icons/logout.svg"
              alt="Logout"
              width={20}
              height={20}
            />
            <span className=""> {expanded.sidebar ? "Log Out" : ""} </span>{" "}
          </div>
        </div>
      </div>
      <CreateProjectModal
        isOpen={showModal.createProject}
        setIsOpen={() =>
          setShowModal((prev) => ({ ...prev, createProject: false }))
        }
        onSuccess={() => {
          setShowModal((prev) => ({ ...prev, createProject: false }));
        }}
      />
      <LogoutModal
        open={logoutModalVisible}
        onClose={closeModal}
        onLogout={handleLogout}
      />
    </div>
  );
}

type IconProps = {
  showInitialStyles: boolean;
};

const HomeIcon = ({ showInitialStyles }: IconProps) => {
  const strokeColor = showInitialStyles ? "#717171" : "#091E42";

  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_26112_105273)">
        <path
          d="M13.4582 6.17007L9.6807 3.2319C9.34919 2.97401 8.94117 2.83398 8.52116 2.83398C8.10115 2.83398 7.69312 2.97401 7.36162 3.2319L3.58337 6.17007C3.35631 6.34665 3.1726 6.57278 3.04628 6.83119C2.91995 7.08961 2.85436 7.37347 2.85449 7.66111V12.7611C2.85449 13.1368 3.00375 13.4972 3.26942 13.7628C3.5351 14.0285 3.89544 14.1778 4.27116 14.1778H12.7712C13.1469 14.1778 13.5072 14.0285 13.7729 13.7628C14.0386 13.4972 14.1878 13.1368 14.1878 12.7611V7.66111C14.1878 7.07815 13.9187 6.52778 13.4582 6.17007Z"
          stroke={strokeColor}
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_26112_105273">
          <rect width="17" height="17" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

const EditIcon = ({ showInitialStyles }: IconProps) => {
  const strokeColor = showInitialStyles ? "#717171" : "#091E42";

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.83203 5.8335H4.9987C4.55667 5.8335 4.13275 6.00909 3.82019 6.32165C3.50763 6.63421 3.33203 7.05814 3.33203 7.50016V15.0002C3.33203 15.4422 3.50763 15.8661 3.82019 16.1787C4.13275 16.4912 4.55667 16.6668 4.9987 16.6668H12.4987C12.9407 16.6668 13.3646 16.4912 13.6772 16.1787C13.9898 15.8661 14.1654 15.4422 14.1654 15.0002V14.1668"
        stroke={strokeColor}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M16.9875 5.48759C17.3157 5.15938 17.5001 4.71424 17.5001 4.25009C17.5001 3.78594 17.3157 3.34079 16.9875 3.01259C16.6593 2.68438 16.2142 2.5 15.75 2.5C15.2858 2.5 14.8407 2.68438 14.5125 3.01259L7.5 10.0001V12.5001H10L16.9875 5.48759Z"
        stroke={strokeColor}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M13.332 4.1665L15.832 6.6665"
        stroke={strokeColor}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const KnowledgeBaseIcon = ({ showInitialStyles }: IconProps) => {
  const strokeColor = showInitialStyles ? "#717171" : "#091E42";

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.625 10.5H3.5M10.5 2.625V3.5M17.5 10.5H18.375M4.9 4.9L5.5125 5.5125M16.1 4.9L15.4875 5.5125"
        stroke={strokeColor}
        stroke-width="0.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M7.875 14C7.14041 13.4491 6.59779 12.681 6.324 11.8045C6.05022 10.928 6.05914 9.98762 6.34951 9.1165C6.63988 8.24539 7.19698 7.48772 7.94189 6.95082C8.6868 6.41391 9.58176 6.125 10.5 6.125C11.4182 6.125 12.3132 6.41391 13.0581 6.95082C13.803 7.48772 14.3601 8.24539 14.6505 9.1165C14.9409 9.98762 14.9498 10.928 14.676 11.8045C14.4022 12.681 13.8596 13.4491 13.125 14C12.7834 14.3382 12.5261 14.752 12.3741 15.208C12.2221 15.6641 12.1796 16.1495 12.25 16.625C12.25 17.0891 12.0656 17.5342 11.7374 17.8624C11.4092 18.1906 10.9641 18.375 10.5 18.375C10.0359 18.375 9.59075 18.1906 9.26256 17.8624C8.93437 17.5342 8.75 17.0891 8.75 16.625C8.8204 16.1495 8.77787 15.6641 8.62586 15.208C8.47385 14.752 8.21663 14.3382 7.875 14Z"
        stroke={strokeColor}
        stroke-width="0.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M8.48828 14.875H12.5133"
        stroke={strokeColor}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};
