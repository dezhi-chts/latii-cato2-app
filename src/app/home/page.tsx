"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useRef, useState } from "react";
import CreateProjectModal from "../projects/[projectId]/components/Create-Project-Modal";
import { formatUserDate, getGreetingByTime } from "@/lib/functions";
import { Input, Segmented } from "antd";
import Image from "next/image";
import Button from "@/components/Button";
import HomeProjectsTable from "./components/Home-Projects-Table";
import { ColumnView } from "./components/Column-View";
import { ProjectRow } from "@/types/home";
import CreateProjectTakeoffModal from "../projects/[projectId]/components/Create-Project-Takeoff-Modal";
import type { UploadFile } from "antd/es/upload/interface";
import UploadFilesProgress from "../projects/[projectId]/components/Upload-Files-Progress";
import PdfParseModal from "../projects/[projectId]/components/Pdf-Parse-Modal";
import { useRouter } from 'next/navigation'


export const projects: ProjectRow[] = [
  {
    key: "1",
    project_name: "Project Name 1",
    last_edit: "2026-01-20",
    budget_price: 900000,
    end_customer: "End Customer",
    status: "Take Off",
    notes:
      "Personal Notes Added... Text long for testing purposes. Checking truncate capabilities. Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum ",
    is_favorite: true,
  },
  {
    key: "2",
    project_name: "Bogota Street 123",
    last_edit: "2025-11-17",
    end_customer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    is_favorite: false,
  },
  {
    key: "3",
    project_name: "Bogota Street 123",
    last_edit: "2026-01-04",
    end_customer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    is_favorite: false,
  },
  {
    key: "4",
    project_name: "Bogota Street 123",
    last_edit: "2025-12-20",
    budget_price: 900000,
    status: "Uploaded",
    notes: "End Customer",
    is_favorite: false,
  },
  {
    key: "5",
    project_name: "Amazing House Ranch",
    last_edit: "2026-03-06",
    budget_price: 900000,
    status: "Uploaded",
    notes: "End Customer",
    is_favorite: false,
  },
  {
    key: "6",
    project_name: "Building Street Happy",
    last_edit: "2026-04-10",
    status: "Uploaded",
    notes: "End Customer",
    is_favorite: false,
  },
  {
    key: "7",
    project_name: "Project Name 1",
    last_edit: "2026-01-20",
    end_customer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    is_favorite: false,
  },
  {
    key: "8",
    project_name: "Bogota Street 123",
    last_edit: "2025-11-17",
    status: "Uploaded",
    notes: "End Customer",
    is_favorite: false,
  },
  {
    key: "9",
    project_name: "Project Amazing",
    last_edit: "2026-01-04",
    budget_price: 900000,
    status: "Uploaded",
    notes: "End Customer",
    is_favorite: false,
  },
  {
    key: "10",
    project_name: "New Rehau Office's",
    last_edit: "2025-12-20",
    budget_price: 900000,
    end_customer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    is_favorite: false,
  },
  {
    key: "11",
    project_name: "Latii Canada Office's",
    last_edit: "2026-03-06",
    budget_price: 900000,
    end_customer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    is_favorite: false,
  },
  {
    key: "12",
    project_name: "Latii Canada Office's",
    last_edit: "2026-04-10",
    budget_price: 900000,
    end_customer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    is_favorite: false,
  },
];

const defaultFields: { field_name: string, Hint_text: string }[] = [{
  field_name: "project_name",
  Hint_text: "Project Name",
}, {
  field_name: "last_edit",
  Hint_text: "Last Edit",
}, {
  field_name: "status",
  Hint_text: "Status",
}, {
  field_name: "notes",
  Hint_text: "Notes",
}, {
  field_name: "is_favorite",
  Hint_text: "Favorite",
}]

type Filter = {
  value: string;
  category: Category;
};
type Category = "Projects" | "Take Offs";

const Home = () => {
  const router = useRouter();

  const { first_name } = useUser();
  const [showCreateProjectModal, setShowCreateProjectModal] = useState<boolean>(false);
  const [showCreateProjectTakeOffModal, setShowCreateProjectTakeOffModal] = useState<boolean>(false);
  const [showColumnView, setShowColumnView] = useState<boolean>(false);
  const [filter, setFilter] = useState<Filter>({
    value: "",
    category: "Projects",
  });
  const [filteredProjects, setFilteredProjects] = useState<ProjectRow[]>([
    ...projects,
  ]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    return defaultFields.map((field) => field.field_name)
  });

  const [showUploadProgess, setShowUploadProgess] = useState<boolean>(false);
  const [showPdfParseModal, setShowPdfParseModal] = useState<boolean>(false);

  const uploadFiles = useRef<any>(null);
  const projectInfo = useRef<any>(null);

  function handleValueChange(value: string) {
    setFilter((prev) => ({ ...prev, value }));
  }

  function handleSegmentChange(category: Category) {
    setFilter((prev) => ({ ...prev, category }));
  }

  function emptyFilterValue() {
    handleValueChange("");
  }

  function openModal() {
    setShowCreateProjectModal(true);
  }

  function closeModal() {
    setShowCreateProjectModal(false);
  }

  function handleColumnsChange(columns: string[]) {
    setSelectedColumns(columns);
  }

  useEffect(() => {
    if (filter.value === "") {
      setFilteredProjects([...projects]);
    } else {
      setFilteredProjects(
        projects.filter((project) =>
          project.project_name
            .toLowerCase()
            .includes(filter.value.toLowerCase())
        )
      );
    }
  }, [filter.value, projects]);

  return (
    <div className="flex items-start gap-8 pt-24 pl-32 zoomed-container flex-col w-9/12">
      <div className="flex flex-col gap-2">
        <p className="text-baseGray text-sm ">{formatUserDate()}</p>
        <p className="text-forumBlue text-[22px]">
          {getGreetingByTime()}, {first_name || "User"}
        </p>
      </div>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-4">
            <Input
              className="min-w-[400px] w-[20vw] rounded-2xl"
              allowClear
              value={filter.value}
              onChange={(e) => handleValueChange(e.target.value)}
              prefix={
                <Image
                  src="/assets/icons/search.svg"
                  alt="Search"
                  width={12}
                  height={12}
                />
              }
              placeholder="Project Name, Status, Client and More."
            />
            <Segmented
              options={["Projects", "Take Offs"] as Category[]}
              onChange={(value) => handleSegmentChange(value as Category)}
            />
          </div>
          <div className="flex gap-4">
            <div className="p-1 rounded-md border border-primaryN30">
              <Image
                src="/assets/icons/edit.svg"
                alt="Edit button"
                width={20}
                height={20}
                onClick={() => setShowColumnView(true)}
                className="cursor-pointer"
              />
            </div>

            <Button
              backgroundColor="forumBlue"
              className="rounded-md py-2 text-xs"
              onClick={openModal}
            >
              + Create Project
            </Button>
          </div>
        </div>
        <HomeProjectsTable
          projects={filteredProjects}
          selectedColumns={selectedColumns}
        />
      </div>

      {
        showCreateProjectModal && (
          <CreateProjectModal
            isOpen={showCreateProjectModal}
            closeModal={closeModal}
            onOpenTakeoffModal={(data: any) => {
              // 关闭Create-Project-Modal弹窗
              //closeModal();
              uploadFiles.current = data;
              // 打开Upload-Files-Progress弹窗
              setShowUploadProgess(true);
              //setShowCreateProjectTakeOffModal(true);
              //setShowPdfParseModal(true);
            }}
          />
        )
      }

      {
        showColumnView && (
          <ColumnView
            open={showColumnView}
            onClose={() => setShowColumnView(false)}
            columns={defaultFields}
            onColumnsChange={handleColumnsChange}
            selectedColumns={selectedColumns}
          />
        )
      }
      {
        showUploadProgess && (
          <UploadFilesProgress
            isOpen={showUploadProgess}
            closeModal={() => setShowUploadProgess(false)}
            uploadFilesData={uploadFiles.current}
            onSuccess={(data: any) => {
              // 关闭Upload-Files-Progress弹窗
              setShowUploadProgess(false);
              // 打开Pdf-Parse-Modal弹窗
              projectInfo.current = data;
              setShowPdfParseModal(true);
            }}
          />
        )
      }
      {
        showPdfParseModal && (
          <PdfParseModal
            isOpen={showPdfParseModal}
            closeModal={() => setShowPdfParseModal(false)}
            data={projectInfo.current}
            handleNext={(type: 'takeoffModal' | 'pageIndex') => {
              // 关闭Pdf-Parse-Modal弹窗
              setShowPdfParseModal(false);
              if (type === 'takeoffModal') {
                // 打开Create-Project-Takeoff-Modal弹窗
                setShowCreateProjectTakeOffModal(true);
              } else if (type === 'pageIndex') {
                // 跳转到Page-Index页面
                //router.push(`/projects/38/takeoff/15/identification-index`);
                router.push(`/projects/${projectInfo.current.project_id}/takeoff/${projectInfo.current.take_off_id}/identification-index`);
              }
            }}
            handleCancel={() => {
              // 关闭Pdf-Parse-Modal弹窗
              setShowPdfParseModal(false);
            }}
          />
        )
      }
      {
        showCreateProjectTakeOffModal && (
          <CreateProjectTakeoffModal
            isOpen={showCreateProjectTakeOffModal}
            closeModal={() => {
              // 关闭Create-Project-Takeoff-Modal弹窗
              setShowCreateProjectTakeOffModal(false);
            }}
            projectId={projectInfo.current?.project_id ?? null}
            takeOffId={projectInfo.current?.take_off_id ?? null}
          //projectId={'38'}
          //takeOffId={'15'}
          />
        )
      }
    </div>
  );
};

export default Home;
