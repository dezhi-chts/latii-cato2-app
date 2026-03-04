"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import DeleteModal from "./Delete-Modal";
import ProjectSettings from "./Project-Settings";
import Button from "@/components/Button";
import {
  deleteProject,
  toggleFavoriteProject,
  updateProject,
} from "@/services/projectService";
import { useProjects } from "@/context/ProjectsContext";
import { useRouter } from "next/navigation";
import { notification } from "antd";

type Status = {
  is_favorite: boolean | undefined;
  is_displayed: boolean;
  is_delete_modal_open: boolean;
  is_deleting: boolean;
  should_hide_overflow: boolean;
};

type HeaderProps = {
  project: any;
  refetchProject: () => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Header = ({ project, refetchProject }: HeaderProps) => {
  const router = useRouter();

  const [api, contextHolder] = notification.useNotification();

  const [status, setStatus] = useState<Status>({
    is_favorite: project?.is_favorite,
    is_displayed: false,
    is_delete_modal_open: false,
    is_deleting: false,
    should_hide_overflow: true,
  });

  const { refetchProjects } = useProjects();

  const toggleStatus = async (field: keyof Status) => {
    if (field === "is_favorite") {
      const newValue = !status.is_favorite;

      await toggleFavoriteProject(project);
      await refetchProjects();

      setStatus((prev) => ({
        ...prev,
        is_favorite: newValue,
      }));
    } else {
      setStatus((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    }

    if (field === "is_displayed") {
      setTimeout(
        () => {
          setStatus((prev) => ({
            ...prev,
            should_hide_overflow: !prev.should_hide_overflow,
          }));
        },
        status.should_hide_overflow ? 300 : 0,
      );
    }
  };

  useEffect(() => {
    setStatus((prev) => ({
      ...prev,
      is_favorite: project?.is_favorite,
    }));
  }, [project]);

  const handleDelete = async () => {
    const id = project?.project_id || undefined;
    if (!id) return;
    toggleStatus("is_deleting");
    await deleteProject(id);
    toggleStatus("is_delete_modal_open");
    toggleStatus("is_deleting");

    api.success({
      message: "Project deleted successfully",
      duration: 1,
    });

    setTimeout(() => {
      refetchProjects();
      router.push("/");
    }, 1000);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = async (updatedProject: any) => {
    if (!updatedProject?.project_id) return;
    await updateProject(updatedProject);
    await refetchProject();
  };

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;

      const clickedInsideDropdown =
        target.closest(".ant-picker-dropdown") ||
        target.closest(".ant-select-dropdown") ||
        target.closest(".ant-modal");

      if (
        ref.current &&
        !ref.current.contains(target) &&
        !clickedInsideDropdown
      ) {
        setStatus((prev) => ({
          ...prev,
          is_displayed: false,
          should_hide_overflow: true,
        }));
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className="pl-36 left-0 pt-6 pb-2 flex flex-col gap-2 pr-20 bg-white min-h-[10vh] absolute top-0 w-full z-40 border-b border-primaryN30 shadow-sm"
      ref={ref}
    >
      {contextHolder}
      <div className="flex justify-between">
        <div className="flex gap-6 items-center h-8">
          <p className="font-bold whitespace-nowrap">
            {project?.project_name || "My Dream House 123"}
          </p>

          <Image
            height={14}
            width={14}
            src={
              status.is_favorite
                ? "/assets/icons/favorite-filled.svg"
                : "/assets/icons/favorite.svg"
            }
            alt="favorite icon"
            style={{ width: "auto", height: "auto" }}
            className="cursor-pointer"
            onClick={() => toggleStatus("is_favorite")}
          />
          <Image
            height={14}
            width={14}
            src={
              status.is_displayed
                ? "/assets/icons/arrow-up.svg"
                : "/assets/icons/arrow-down.svg"
            }
            style={{ width: "auto", height: "auto" }}
            alt="arrow down icon"
            className="cursor-pointer"
            onClick={() => toggleStatus("is_displayed")}
          />
        </div>
        {status.is_displayed && (
          <Button
            backgroundColor="dragonOrange"
            color="white"
            onClick={() => toggleStatus("is_delete_modal_open")}
          >
            Delete
          </Button>
        )}
        {status.is_delete_modal_open && (
          <DeleteModal
            isDeleting={status.is_deleting}
            isOpen={status.is_delete_modal_open}
            setIsOpen={() => toggleStatus("is_delete_modal_open")}
            onSuccess={handleDelete}
            title="Delete Project"
            description="Are you sure you want to delete this project"
          />
        )}
      </div>

      <div
        className={`${status.is_displayed ? "max-h-[230px]" : "max-h-0"} ${
          status.should_hide_overflow ? "overflow-hidden" : ""
        } transition-all duration-500 ease-in-out `}
      >
        <ProjectSettings project={project} handleUpdate={handleUpdate} />
      </div>
    </div>
  );
};

export default Header;
