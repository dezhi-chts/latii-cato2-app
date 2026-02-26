"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useRef, useState } from "react";
import CreateProjectModal from "../projects/[projectId]/components/Create-Project-Modal";
import { formatUserDate, getGreetingByTime } from "@/lib/functions";
import { Input, Segmented, Spin, Modal } from "antd";
import Image from "next/image";
import Button from "@/components/Button";
import HomeProjectsTable from "./components/Home-Projects-Table";
import { ColumnView } from "./components/Column-View";
import { ProjectRow } from "@/types/home";
import CreateProjectTakeoffModal from "../projects/[projectId]/components/Create-Project-Takeoff-Modal";
import UploadFilesProgress from "../projects/[projectId]/components/Upload-Files-Progress";
import PdfParseModal from "../projects/[projectId]/components/Pdf-Parse-Modal";
import { useRouter } from "next/navigation";
import {
  fetchProjects,
  deleteProject,
  getAllProjects,
} from "@/services/projectService";
import {
  deleteTakeOffById,
  getAllTakeoffList,
} from "@/services/takeOffService";

import HomeTakeoffsTable from "./components/Home-Takeoffs-Table";
import { useCompany } from "@/context/CompanyContext";

const { confirm } = Modal;

const defaultFields: { field_name: string; Hint_text: string }[] = [
  {
    field_name: "project_name",
    Hint_text: "Project Name",
  },
  {
    field_name: "update_time",
    Hint_text: "Last Edit",
  },
  {
    field_name: "actions",
    Hint_text: "Actions",
  },
];

type Category = "Projects" | "Take Offs";

const Home = () => {
  const router = useRouter();

  const { first_name } = useUser();
  const [showCreateProjectModal, setShowCreateProjectModal] =
    useState<boolean>(false);
  const [showCreateProjectTakeOffModal, setShowCreateProjectTakeOffModal] =
    useState<boolean>(false);
  const [showColumnView, setShowColumnView] = useState<boolean>(false);
  const [category, setCategory] = useState<Category>("Projects");
  const [filterValue, setFilterValue] = useState<string>("");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [takeoffs, setTakeoffs] = useState<any>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    return defaultFields.map((field) => field.field_name);
  });

  const [showUploadProgess, setShowUploadProgess] = useState<boolean>(false);
  const [showPdfParseModal, setShowPdfParseModal] = useState<boolean>(false);
  const [projectLoading, setProjectLoading] = useState<boolean>(false);
  const [takeOffLoading, setTakeOffLoading] = useState<boolean>(false);

  const uploadFiles = useRef<any>(null);
  const projectInfo = useRef<any>(null);

  function handleValueChange(value: string) {
    setFilterValue(value);
  }

  function handleSegmentChange(category: Category) {
    setCategory(category);
    if (category === "Projects") {
      fetchProjects();
    } else if (category === "Take Offs") {
      getTakeoffs();
    }
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

  const getProjects = async () => {
    setProjectLoading(true);
    const response: any = await getAllProjects({ per_page: 40 });
    const projects = response?.items;
    setProjectLoading(false);
    if (projects?.length > 0) {
      setProjects(projects);
    } else {
      setProjects([]);
    }
  };

  const getTakeoffs = async () => {
    setTakeOffLoading(true);
    const res = await getAllTakeoffList();
    setTakeOffLoading(false);
    if (res?.status === "success") {
      let takeoffs = res?.data?.items ?? [];
      setTakeoffs(takeoffs);
    } else {
      setTakeoffs([]);
    }
  };

  const handleRemoveProject = async (record: ProjectRow) => {
    confirm({
      title: `Are you sure to delete this project: ${record.project_name}?`,
      okText: "Yes",
      onOk: async () => {
        const res = await deleteProject(record.project_id as string);
        getProjects();
      },
    });
  };

  const handleRemoveTakeoff = async (takeoff: any) => {
    confirm({
      title: `Are you sure to delete this takeoff: ${takeoff?.name}?`,
      okText: "Yes",
      onOk: async () => {
        const res = await deleteTakeOffById(takeoff?.id as string);
        getTakeoffs();
      },
    });
  };

  useEffect(() => {
    getProjects();
  }, []);

  return (
    <div className="w-full h-full">
      <div className="flex items-start gap-8 pt-10 pl-12 zoomed-container flex-col w-9/12">
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
                className="min-w-[400px] w-[20vw] rounded-xl"
                allowClear
                value={filterValue}
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
          {category === "Projects" ? (
            <HomeProjectsTable
              projects={projects}
              selectedColumns={selectedColumns}
              tableLoading={projectLoading}
              handleRemoveProject={handleRemoveProject}
            />
          ) : (
            <HomeTakeoffsTable
              tableLoading={takeOffLoading}
              takeoffs={takeoffs}
              selectedColumns={[]}
              handleRemoveTakeoff={handleRemoveTakeoff}
            />
          )}
        </div>

        {showCreateProjectModal && (
          <CreateProjectModal
            isOpen={showCreateProjectModal}
            closeModal={closeModal}
            onHandleUpload={(data: any) => {
              // 关闭Create-Project-Modal弹窗
              //closeModal();
              uploadFiles.current = data;
              // 打开Upload-Files-Progress弹窗
              setShowUploadProgess(true);
              //setShowCreateProjectTakeOffModal(true);
              //setShowPdfParseModal(true);
            }}
          />
        )}

        {showColumnView && (
          <ColumnView
            open={showColumnView}
            onClose={() => setShowColumnView(false)}
            columns={defaultFields}
            onColumnsChange={handleColumnsChange}
            selectedColumns={selectedColumns}
          />
        )}
        {showUploadProgess && (
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
        )}
        {showPdfParseModal && (
          <PdfParseModal
            isOpen={showPdfParseModal}
            closeModal={() => setShowPdfParseModal(false)}
            data={projectInfo.current}
            handleNext={(type: "takeoffModal" | "pageIndex") => {
              // 关闭Pdf-Parse-Modal弹窗
              setShowPdfParseModal(false);
              if (type === "takeoffModal") {
                // 打开Create-Project-Takeoff-Modal弹窗
                setShowCreateProjectTakeOffModal(true);
              } else if (type === "pageIndex") {
                // 跳转到Page-Index页面
                //router.push(`/projects/38/takeoff/15/identification-index`);
                router.push(
                  `/projects/${projectInfo.current.project_id}/takeoff/${projectInfo.current.take_off_id}/identification-index`,
                );
              }
            }}
            handleCancel={() => {
              // 关闭Pdf-Parse-Modal弹窗
              setShowPdfParseModal(false);
            }}
          />
        )}
        {showCreateProjectTakeOffModal && (
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
        )}
      </div>
    </div>
  );
};

export default Home;
