"use client";

import { useProjects } from "@/context/ProjectsContext";
import { Spin } from "antd";
import Image from "next/image";
import HomeProjectsTable from "./Home-Projects-Table";
import { useUser } from "@/context/UserContext";
import Button from "@/components/Button";
import { useState } from "react";
import CreateProjectModal from "../projects/[projectId]/components/Create-Project-Modal";

const Home = () => {
  const { projects, hasLoadedProjects } = useProjects();
  const { username, first_name } = useUser();
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  const hasProjects = hasLoadedProjects && Boolean(projects.length);

  return (
    <div className="flex items-start gap-4 pt-24 pl-32 zoomed-container">
      <div className="flex flex-col gap-6">
        <>
          <div className="flex gap-4 items-center ">
            <Image
              src="/assets/logos/forum-with-text.svg"
              alt="logo"
              width={240}
              height={42}
              className="h-5 w-auto"
            />
            <p className="bg-primaryN20 text-primaryN200 text-[9px] rounded-md py-1 px-2.5">
              TAKE-OFF
            </p>
          </div>
          <div className="text-2xl text-primaryN900 flex flex-col gap-1">
            <p>Welcome {first_name || username || "Guest"},</p>
          </div>
        </>
        {hasLoadedProjects ? (
          <>
            {!hasProjects ? (
              <>
                <div className="flex flex-col">
                  <p className="max-w-[750px]">
                    Here you will be able to create all tour project take offs,
                    have a record for each one of them, edit and download as
                    many as you want.
                  </p>
                  <br />
                  <p>To start create your first projects and Take Off</p>
                </div>
                <div>
                  <Button
                    backgroundColor="forumBlue"
                    color="white"
                    onClick={() => setShowCreateProjectModal(true)}
                  >
                    <p className="text-sm">Create New Project</p>
                  </Button>
                </div>
              </>
            ) : (
              <div>
                <p className="text-basicGray">
                  Your recent and favorite projects are ready to continue
                  customize your take offs with ease.
                </p>
                <p className="text-primaryN900">Bring your view to life.</p>
              </div>
            )}

            {hasProjects && (
              <div>
                <HomeProjectsTable projects={projects} />
              </div>
            )}
          </>
        ) : (
          <div className="ml-8 mt-8">
            <Spin size="large" />
          </div>
        )}
      </div>
      <CreateProjectModal
        isOpen={showCreateProjectModal}
        setIsOpen={() => setShowCreateProjectModal(true)}
        onSuccess={() => setShowCreateProjectModal(false)}
      />
    </div>
  );
};

export default Home;
