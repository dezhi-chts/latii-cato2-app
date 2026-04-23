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
import { useCompany } from "@/context/CompanyContext";

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

  const { company } = useCompany();

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

      const response: any = await toggleFavoriteProject(project);

      if (response.status === "success") {
        await refetchProjects();
        setStatus((prev) => ({
          ...prev,
          is_favorite: newValue,
        }));
      } else {
        const errorMessage = response.data.response.data.detail;
        const isRequiredAttributeError =
          /^Attribute [0-9a-fA-F-]+ is required$/.test(errorMessage);

        notification.error({
          message: "Error toggling favorite",
          description: isRequiredAttributeError
            ? "This project has empty required fields. Please fill them first."
            : "",
          duration: 5,
        });
      }
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

    const normalizedProject = {
      ...updatedProject,
      attributes: Object.fromEntries(
        Object.entries(updatedProject.attributes ?? {}).map(([key, value]) => [
          key,
          Array.isArray(value) ? JSON.stringify(value) : value,
        ]),
      ),
    };

    await updateProject(normalizedProject);
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

  const getTitleByAttribueId = (attributeId: string) => {
    const attribute = company?.project_attributes?.find(
      (attr) => attr.uuid === attributeId,
    );
    if (!attribute) return null;
    return attribute.label;
  };

  const curateAttributes = (attributes: any) => {
    const validAttributesIds =
      company?.project_attributes.map((attr) => attr.uuid) ?? [];

    return Object.entries(attributes ?? {})
      .filter(([key]) => validAttributesIds.includes(key))
      .slice(0, 4);
  };

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

          {/* <Image
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
          /> */}
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
      {/* <div
        className={`${status.is_displayed ? "max-h-0 opacity-0" : "max-h-6 opacity-100"} transition-all duration-500 ease-in-out overflow-hidden flex gap-20 pt-1`}
      >
        {project?.attributes &&
          curateAttributes(project.attributes).map(([key, value]) => {
            const title = getTitleByAttribueId(key);

            let displayValue = value;

            if (Array.isArray(value)) {
              displayValue = value.join(", ");
            } else if (typeof value === "string" && value.startsWith("[")) {
              try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                  displayValue = parsed.join(", ");
                }
              } catch { }
            }

            return (
              <div key={key} className="flex gap-2 text-sm text-grey-normal">
                <span className="font-bold ">{title}</span>
                <span className="max-w-32 truncate">
                  {String(displayValue)}
                </span>
              </div>
            );
          })}
      </div>
      <div
        className={`${status.is_displayed ? "max-h-[230px]" : "max-h-0"} ${status.should_hide_overflow ? "overflow-hidden" : ""
          } transition-all duration-500 ease-in-out `}
      >
        <ProjectSettings project={project} handleUpdate={handleUpdate} />
      </div> */}
    </div>
  );
};

export default Header;
