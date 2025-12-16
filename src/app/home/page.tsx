"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import CreateProjectModal from "../projects/[projectId]/components/Create-Project-Modal";
import { formatUserDate, getGreetingByTime } from "@/lib/functions";
import { Input, Segmented } from "antd";
import Image from "next/image";
import Button from "@/components/Button";
import HomeProjectsTable from "./components/Home-Projects-Table";
import { ProjectRow } from "@/types/home";

export const projects: ProjectRow[] = [
  {
    key: "1",
    projectName: "Project Name 1",
    lastEdit: "2026-01-20",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Take Off",
    notes:
      "Personal Notes Added... Text long for testing purposes. Checking truncate capabilities. Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum ",
    isFavorite: true,
  },
  {
    key: "2",
    projectName: "Bogota Street 123",
    lastEdit: "2025-11-17",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    isFavorite: false,
  },
  {
    key: "3",
    projectName: "Bogota Street 123",
    lastEdit: "2026-01-04",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    isFavorite: false,
  },
  {
    key: "4",
    projectName: "Bogota Street 123",
    lastEdit: "2025-12-20",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    isFavorite: false,
  },
  {
    key: "5",
    projectName: "Amazing House Ranch",
    lastEdit: "2026-03-06",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    isFavorite: false,
  },
  {
    key: "6",
    projectName: "Building Street Happy",
    lastEdit: "2026-04-10",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    isFavorite: false,
  },
  {
    key: "7",
    projectName: "Project Name 1",
    lastEdit: "2026-01-20",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    isFavorite: false,
  },
  {
    key: "8",
    projectName: "Bogota Street 123",
    lastEdit: "2025-11-17",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    isFavorite: false,
  },
  {
    key: "9",
    projectName: "Project Amazing",
    lastEdit: "2026-01-04",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    isFavorite: false,
  },
  {
    key: "10",
    projectName: "New Rehau Office's",
    lastEdit: "2025-12-20",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    isFavorite: false,
  },
  {
    key: "11",
    projectName: "Latii Canada Office's",
    lastEdit: "2026-03-06",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    isFavorite: false,
  },
  {
    key: "12",
    projectName: "Latii Canada Office's",
    lastEdit: "2026-04-10",
    budgetPrice: 900000,
    endCustomer: "End Customer",
    status: "Uploaded",
    notes: "End Customer",
    isFavorite: false,
  },
];

type Filter = {
  value: string;
  category: Category;
};
type Category = "Projects" | "Take Offs";

const Home = () => {
  const { first_name } = useUser();
  const [showCreateProjectModal, setShowCreateProjectModal] =
    useState<boolean>(false);
  const [filter, setFilter] = useState<Filter>({
    value: "",
    category: "Projects",
  });
  const [filteredProjects, setFilteredProjects] = useState<ProjectRow[]>([
    ...projects,
  ]);

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

  useEffect(() => {
    if (filter.value === "") {
      setFilteredProjects([...projects]);
    } else {
      setFilteredProjects(
        projects.filter((project) =>
          project.projectName.toLowerCase().includes(filter.value.toLowerCase())
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
        <p className="text-[22px]">Home</p>
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-4">
            <Input
              className="min-w-[400px] w-[20vw] rounded-2xl"
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
              suffix={
                filter && (
                  <p
                    onClick={emptyFilterValue}
                    className="text-baseGray text-sm cursor-pointer"
                  >
                    X
                  </p>
                )
              }
              placeholder="Project Name, Status, Client and More."
            />
            <Segmented
              options={["Projects", "Take Offs"] as Category[]}
              onChange={(value) => handleSegmentChange(value as Category)}
            />
          </div>
          <div className="flex gap-4">
            <Image
              src="/assets/icons/edit.svg"
              alt="Edit button"
              width={20}
              height={20}
            />
            <Button
              backgroundColor="forumBlue"
              className="rounded-md py-2 text-xs w-32"
              onClick={openModal}
            >
              + Create Project
            </Button>
          </div>
        </div>
        <HomeProjectsTable projects={filteredProjects} />
      </div>

      <CreateProjectModal
        isOpen={showCreateProjectModal}
        closeModal={closeModal}
      />
    </div>
  );
};

export default Home;
