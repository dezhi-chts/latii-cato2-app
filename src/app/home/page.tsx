"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import { formatUserDate, getGreetingByTime } from "@/lib/functions";
import { Input, Segmented, Modal, notification } from "antd";
import Image from "next/image";
import Button from "@/components/Button";
import HomeProjectsTable from "./components/Home-Projects-Table";
import { ColumnView } from "./components/Column-View";
import { ProjectRow } from "@/types/home";
import {
  fetchProjects,
  deleteProject,
  getAllProjects,
  toggleFavoriteProject,
} from "@/services/projectService";
import {
  deleteTakeOffById,
  getAllTakeoffList,
} from "@/services/takeOffService";

import HomeTakeoffsTable from "./components/Home-Takeoffs-Table";
import { useCompany } from "@/context/CompanyContext";
import CreateProjectFlowModal from "@/components/CreateProjectFlowModal";

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
];
const actionsField = {
  field_name: "actions",
  Hint_text: "Actions",
};

type Category = "Projects" | "Take Offs";

// import { getTakeOffResultByFile } from "@/services/mergeService";
// (async () => {
//   const res =  await getTakeOffResultByFile(300, 392);
//   console.log(res);
// })();

const Home = () => {
  const { company } = useCompany();

  let dynamicFields = []
  dynamicFields = company.project_attributes && company.project_attributes.map((attr) => ({
    field_name: attr.uuid,
    Hint_text: attr.label,
  })) || [];

  const allFields = [...defaultFields, ...dynamicFields, actionsField];

  const { first_name, name } = useUser();
  const [showCreateProjectModal, setShowCreateProjectModal] =
    useState<boolean>(false);
  const [showColumnView, setShowColumnView] = useState<boolean>(false);
  const [category, setCategory] = useState<Category>("Projects");
  const [filterValue, setFilterValue] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const [projectLoading, setProjectLoading] = useState<boolean>(false);
  const [takeOffLoading, setTakeOffLoading] = useState<boolean>(false);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectRow[]>([]);
  const [currentProjectsPage, setCurrentProjectsPage] = useState(1);

  //const [takeoffsCache, setTakeoffsCache] = useState<Record<number, any[]>>({});
  const [takeoffsCache, setTakeoffsCache] = useState<any>([]);
  const [currentTakeoffsPage, setCurrentTakeoffsPage] = useState(1);
  const [totalTakeoffsPages, setTotalTakeoffsPages] = useState(1);

  function handleValueChange(value: string) {
    setFilterValue(value);
  }

  function handleSegmentChange(category: Category) {
    setCategory(category);
    if (category === "Projects") {
      fetchProjects();
    } else if (category === "Take Offs") {
      getTakeoffs(currentTakeoffsPage);
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
    const response: any = await getAllProjects();
    const projects = response;
    setProjectLoading(false);
    setProjects(projects);
  };

  const getTakeoffs = async (page: number) => {
    // if (takeoffsCache[page]) {
    //   return;
    // }
    const params = {
      per_page: 10,
      page: currentTakeoffsPage,
    };

    setTakeOffLoading(true);
    const res = await getAllTakeoffList(params);
    const takeoffs = res?.data?.items ?? [];
    setTotalTakeoffsPages(res?.data?.total_pages ?? 1);
    setTakeOffLoading(false);
    if (res?.status === "success") {
      //setTakeoffsCache((prev) => ({ ...prev, [page]: takeoffs }));
      setTakeoffsCache((prev) => takeoffs);
    } else {
      //setTakeoffsCache((prev) => ({ ...prev, [page]: [] }));
      setTakeoffsCache((prev) => []);
    }
  };

  useEffect(() => {
    if (currentTakeoffsPage > 0) {
      getTakeoffs(currentTakeoffsPage);
    }
  }, [currentTakeoffsPage]);

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
        getTakeoffs(1);
      },
    });
  };

  const handleFavoriteClick = async (project: any) => {
    const response: any = await toggleFavoriteProject(project);
    if (response.status === "success") {
      await getProjects();
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
  };

  useEffect(() => {
    setSelectedColumns(allFields.map((field) => field.field_name));
  }, [company.project_attributes]);

  useEffect(() => {
    getProjects();
  }, []);

  useEffect(() => {
    setFilteredProjects(
      projects.filter((project) =>
        project.project_name.toLowerCase().includes(filterValue.toLowerCase()),
      ),
    );
  }, [projects, filterValue]);

  return (
    <div className="w-full h-full">
      <div className="flex items-start gap-8 pt-10 px-12 zoomed-container flex-col w-full">
        <div className="flex flex-col gap-2">
          <p className="text-grey-light-strong text-sm ">{formatUserDate()}</p>
          <p className="text-forumBlue-normal text-[22px]">
            {getGreetingByTime()}, {name || "User"}
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-4">
              <Input
                className="min-w-[400px] w-[20vw] rounded-md"
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
              {/* <div className="p-1 rounded-md border border-primaryN30">
                <Image
                  src="/assets/icons/edit.svg"
                  alt="Edit button"
                  width={20}
                  height={20}
                  onClick={() => setShowColumnView(true)}
                  className="cursor-pointer"
                />
              </div> */}

              <Button
                backgroundColor="forumBlue-normal"
                className="rounded-md py-2 text-xs"
                onClick={openModal}
              >
                + Create Project
              </Button>
            </div>
          </div>

          {category === "Projects" ? (
            <HomeProjectsTable
              projects={filteredProjects}
              selectedColumns={selectedColumns}
              tableLoading={projectLoading}
              currentPage={currentProjectsPage}
              setCurrentPage={setCurrentProjectsPage}
              handleFavoriteClick={handleFavoriteClick}
            />
          ) : (
            <HomeTakeoffsTable
              tableLoading={takeOffLoading}
              //takeoffs={takeoffsCache[currentTakeoffsPage]}
              takeoffs={takeoffsCache}
              selectedColumns={[]}
              handleRemoveTakeoff={handleRemoveTakeoff}
              currentPage={currentTakeoffsPage}
              setCurrentPage={setCurrentTakeoffsPage}
              totalPages={totalTakeoffsPages}
            />
          )}
        </div>

        <CreateProjectFlowModal
          isOpen={showCreateProjectModal}
          onClose={closeModal}
          refreshProjects={getProjects}
        />

        {showColumnView && (
          <ColumnView
            open={showColumnView}
            onClose={() => setShowColumnView(false)}
            columns={allFields}
            onColumnsChange={handleColumnsChange}
            selectedColumns={selectedColumns}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
