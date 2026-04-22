"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SidebarSettings from "./SidebarSettings";
import CreateProjectModal from "@/app/projects/[projectId]/components/Create-Project-Modal";
import { useUser } from "@/context/UserContext";
import { signOut } from "next-auth/react";
import LogoutModal from "./Logout-Modal";
import { usePathname } from "next/navigation";
import { UserDataForUpdate } from "@/types/user";
import { Tooltip } from "antd";

const COMPANY_MANAGEMENT_ALLOWED_GROUPS = new Set([
  "LatiiCato2SuperAdmin",
  "LatiiCato2SuperAdmin_DEV",
  "LatiiCato2SuperAdmin_TEST",
]);

const hasCompanyManagementPermission = () => {
  if (typeof window === "undefined") return false;
  try {
    const userDataRaw = localStorage.getItem("userData");
    if (!userDataRaw) return false;
    const parsed = JSON.parse(userDataRaw);
    const groups = Array.isArray(parsed?.groups) ? parsed.groups : [];
    return groups.some((group: string) =>
      COMPANY_MANAGEMENT_ALLOWED_GROUPS.has(group),
    );
  } catch {
    return false;
  }
};

export default function Sidebar() {
  const {
    email,
    first_name,
    force_logout,
    clearLocalStorage,
    last_name,
    isAdmin,
  } = useUser();
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
    logout: false,
  });
  const [loadingExpansion, setLoadingExpansion] = useState(false);
  const [showInitialStyles, setShowInitialStyles] = useState(false);
  const [canAccessCompanyManagement, setCanAccessCompanyManagement] =
    useState(false);
  const [userData, setUserData] = useState<UserDataForUpdate>({
    first_name: first_name,
    last_name: last_name,
    email: email,
  });

  useEffect(() => {
    setUserData((prev) => ({
      ...prev,
      first_name: first_name,
      email: email,
    }));
  }, [first_name, email]);

  useEffect(() => {
    const syncPermissionFromLocalStorage = () => {
      setCanAccessCompanyManagement(hasCompanyManagementPermission());
    };

    syncPermissionFromLocalStorage();
    window.addEventListener("storage", syncPermissionFromLocalStorage);
    return () => {
      window.removeEventListener("storage", syncPermissionFromLocalStorage);
    };
  }, []);

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
    [expanded.sidebar],
  );

  const sidebarIcon = expanded.sidebar
    ? "/assets/icons/sidebar-arrow-left.svg"
    : "/assets/icons/sidebar-arrow-right.svg";

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

  const openLogoutModal = () => {
    setLogoutModalVisible(true);
  };

  const closeLogoutModal = () => {
    setLogoutModalVisible(false);
  };

  const toggleModal = (field: "settings" | "logout" | "createProject") => {
    setShowModal((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleLogout = async () => {
    clearLocalStorage();
    await signOut();
    closeLogoutModal();
  };

  useEffect(() => {
    if (force_logout) {
      handleLogout();
    }
  }, [force_logout]);

  const getFullName = () => {
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    return "Guest";
  };

  const activePage = usePathname();
  const firstSegment = activePage.split("/")[1];

  if (activePage.startsWith("/public")) return null;

  return (
    <div>
      <div
        className={`sidebar-container border-r border-primaryN30 shadow-md pt-9 ${loadingExpansion ? "w-[340px] px-9" : "w-16"
          } 
      ${!expanded.sidebar && "cursor-pointer"}
      top-0 z-[999] fixed flex h-screen flex-col justify-between  bg-white p-3 text-black transition-all linear duration-700 font-nunito`}
        ref={sidebarRef}
        onClick={() => {
          !expanded.sidebar && toggleExpand("sidebar");
        }}
      >
        <div className="flex flex-col gap-7 text-sm">
          <div className={`flex justify-end pr-2 items-center`}>
            {expanded.sidebar && (
              <div className="w-full">
                <Image
                  src={"/assets/logos/forum-sidebar.svg"}
                  alt="Latii logo"
                  width={250}
                  height={40}
                  priority
                />
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand("sidebar");
              }}
              className="h-7 w-7 rounded-full border border-grey-light-hover flex items-center justify-center"
            >
              <Image
                src={sidebarIcon}
                alt="Sidebar icon"
                width={4}
                height={8}
                style={{ width: "auto", height: "auto" }}
              />
            </button>
          </div>
          <button
            className={`${expanded.sidebar ? "px-3.5" : " w-7 h-7 self-center"
              } h-7 bg-forumBlue-light text-forumBlue-dark-hover hover:bg-forumBlue-normal hover:text-white text-sm transition-all duration-300 rounded-lg flex items-center justify-center gap-2.5`}
            onClick={(e) => {
              e.stopPropagation();
              setShowModal((prev) => ({ ...prev, createProject: true }));
            }}
          >
            {expanded.sidebar ? (
              <p>+ Create Project</p>
            ) : (
              <Image
                src="/assets/icons/add-sidebar-blue.svg"
                alt="add icon"
                width={8}
                height={8}
                style={{ width: "auto", height: "auto" }}
              />
            )}
          </button>
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (expanded.sidebar) toggleExpand("sidebar");
            }}
            className={`${firstSegment === "home" ? "bg-grey-light" : ""} hover:bg-grey-light rounded-md transition-all duration-150 ease-in-out`}
          >
            <Link href="/home">
              <div
                className={`flex gap-3 rounded-xl ${showInitialStyles ? "" : " justify-start"
                  } h-8 w-10 items-center pl-2.5 cursor-pointer`}
              >
                <Tooltip
                  title={expanded.sidebar ? "" : "Home"}
                  placement="right"
                  zIndex={9999}
                  color="#ffffff"
                >
                  <Image
                    src={`/assets/icons/navbar/home${`${firstSegment}` === "home" ? "-selected" : ""}.svg`}
                    alt="Home icon"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                </Tooltip>

                <p className="whitespace-nowrap">
                  {expanded.sidebar && "Home"}
                </p>
              </div>
            </Link>
          </div>
          {/* For now, Lucius Chat has been removed from the sidebar. Don't delete the code below, it's just commented out. */}
          {/* <div
            onClick={(e) => {
              e.stopPropagation();
              if (expanded.sidebar) toggleExpand("sidebar");
            }}
            className="hover:bg-grey-light rounded-md transition-all duration-150 ease-in-out"
          >
            <Link href="/ask-lucius">
              <div
                className={`flex gap-3 rounded-xl ${
                  showInitialStyles ? "" : " justify-start"
                } h-8 w-10 items-center pl-2.5 cursor-pointer`}
              >
                <Image
                  src="/assets/logos/lucius-new-logo.png"
                  alt="Lucius logo"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <p className="whitespace-nowrap">
                  {expanded.sidebar && "Lucius Chat"}
                </p>
              </div>
            </Link>
          </div> */}
          {expanded.sidebar && (
            <div className="pl-2.5 pt-4 flex flex-col gap-4">
              <p className="text-grey-light-strong text-sm ">Management</p>
              {isAdmin && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (expanded.sidebar) toggleExpand("sidebar");
                  }}
                  className={`${firstSegment === "brand-editor" ? "bg-grey-light" : ""} hover:bg-grey-light rounded-md transition-all duration-150 ease-in-out`}
                >
                  <Link href="/brand-editor">
                    <div
                      className={`flex gap-3 ${showInitialStyles ? "" : "justify-start"
                        } h-8 min-w-10 items-center cursor-pointer`}
                    >
                      <Image
                        src={`/assets/icons/navbar/your-company${`${firstSegment}` === "brand-editor" ? "-selected" : ""}.svg`}
                        alt="brand management icon"
                        width={20}
                        height={20}
                        className="w-4 h-4 ml-2"
                      />
                      <p className="whitespace-nowrap text-black text-sm">
                        {expanded.sidebar && "Your Company"}
                        {/* Please let this title. It's according to the figma. If you have any question, please ask me or the UX/UI team. */}
                      </p>
                    </div>
                  </Link>
                </div>
              )}
              {/* <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (expanded.sidebar) toggleExpand("sidebar");
                }}
                className={`${firstSegment === "brand-settings" ? "bg-grey-light" : ""} hover:bg-grey-light rounded-md transition-all duration-150 ease-in-out`}
              >
                <Link href="/brand-settings">
                  <div
                    className={`flex gap-3 ${
                      showInitialStyles ? "" : "justify-start"
                    } h-8 min-w-10 items-center cursor-pointer`}
                  >
                    <Image
                      src={`/assets/icons/navbar/settings${`${firstSegment}` === "brand-settings" ? "-selected" : ""}.svg`}
                      alt="brand management icon"
                      width={20}
                      height={20}
                      className="w-4 h-4 ml-2"
                    />
                    <p className="whitespace-nowrap text-black text-sm">
                      {expanded.sidebar && "Project Settings"}
                    </p>
                  </div>
                </Link>
              </div> */}

              {canAccessCompanyManagement && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (expanded.sidebar) toggleExpand("sidebar");
                  }}
                  className={`${firstSegment === "company-management" ? "bg-grey-light" : ""} hover:bg-grey-light rounded-md transition-all duration-150 ease-in-out`}
                >
                  <Link href="/company-management">
                    <div
                      className={`flex gap-3 ${showInitialStyles ? "" : "justify-start"
                        } h-8 min-w-10 items-center cursor-pointer`}
                    >
                      <Image
                        src={`/assets/icons/navbar/your-company${`${firstSegment}` === "company-management" ? "-selected" : ""}.svg`}
                        alt="company management icon"
                        width={20}
                        height={20}
                        className="w-4 h-4 ml-2"
                      />
                      <p className="whitespace-nowrap text-black text-sm">
                        {expanded.sidebar && "Company Management"}
                      </p>
                    </div>
                  </Link>
                </div>
              )}

              {/* For now, Lucius Knowledge Base has been removed from the sidebar. Don't delete the code below, it's just commented out. */}
              {/* <Link href="/knowledge-base-lucius">
                <div
                  className={`flex gap-3 rounded-xl ${
                    showInitialStyles ? "" : " justify-start"
                  } h-8 w-10 items-center pl-1 cursor-pointer`}
                >
                  <Image
                    src="/assets/icons/lucius-knowledge-sidebar.svg"
                    alt="Lucius Knowledge Base icon"
                    width={20}
                    height={20}
                    className="w-4 h-4"
                  />

                  <p className="whitespace-nowrap text-black text-sm">
                    {expanded.sidebar && "LUCIUS | Knowledge Base"}
                  </p>
                </div>
              </Link> */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (expanded.sidebar) toggleExpand("sidebar");
                }}
                className={`${firstSegment === "knowledge-base-cato" ? "bg-grey-light" : ""} hover:bg-grey-light rounded-md transition-all duration-150 ease-in-out`}
              >
                <Link href="/knowledge-base-cato">
                  <div
                    className={`flex gap-2 rounded-xl ${showInitialStyles ? "" : " justify-start"
                      } h-8 w-10 items-center pl-1 cursor-pointer`}
                  >
                    <Image
                      src={`/assets/icons/navbar/cato-knowledge-base${`${firstSegment}` === "knowledge-base-cato" ? "-selected" : ""}.svg`}
                      alt="Cato Knowledge Base icon"
                      width={20}
                      height={20}
                      className="w-5 h-5 ml-1"
                    />

                    <p className="whitespace-nowrap text-black text-sm">
                      {expanded.sidebar && "CATO | Knowledge Base"}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        <div
          className="flex flex-col pl-3 gap-3 text-sm w-full mb-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* <div
            className={`flex items-center cursor-pointer hover:underline w-fit relative ${
              expanded.sidebar && "gap-2"
            }`}
          >
            <Tooltip
              title={expanded.sidebar ? "" : "Support"}
              placement="right"
              zIndex={9999}
              color="#ffffff"
            >
              <Image
                src={`/assets/icons/navbar/support${firstSegment === "support" ? "-selected" : ""}.svg`}
                alt="Support icon"
                width={20}
                height={20}
              />
            </Tooltip>
            <span> {expanded.sidebar ? "Support" : ""} </span>
          </div> */}
          <div
            className={`flex items-center cursor-pointer hover:underline w-fit relative ${expanded.sidebar && "gap-2"
              }`}
            onClick={() => {
              setTimeout(() => {
                setShowModal((prev) => ({ ...prev, settings: !prev.settings }));
              }, 10);
            }}
          >
            <Image
              src={`/assets/icons/navbar/profile${firstSegment === "account-settings" ? "-selected" : ""}.svg`}
              alt="User Settings"
              width={20}
              height={20}
            />
            <span> {expanded.sidebar ? getFullName() : ""} </span>
            <SidebarSettings
              open={showModal.settings}
              expanded={loadingExpansion}
              toggleExpand={toggleExpand}
              toggleModal={toggleModal}
              openLogoutModal={openLogoutModal}
            />
          </div>
        </div>
      </div>
      <CreateProjectModal
        isOpen={showModal.createProject}
        closeModal={() => {
          setShowModal((prev) => ({ ...prev, createProject: false }));
        }}
      />
      <LogoutModal
        open={logoutModalVisible}
        onClose={closeLogoutModal}
        onLogout={handleLogout}
      />
    </div>
  );
}
