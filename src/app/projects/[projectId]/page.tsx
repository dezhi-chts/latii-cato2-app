"use client";
import Image from "next/image";
import Header from "./components/Header";
import { Input, Spin, UploadFile } from "antd";
import EmptyProject from "./components/Empty-Project";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/Button";
import { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@/context/NavigationContext";
import Link from "next/link";
import { fetchProject } from "@/services/projectService";
import CreateTakeOffModal from "./components/Create-Takeoff/Create-Takeoff-Modal";
import { BuildingBackground } from "./components/Create-Takeoff/Building-Background";
import { useProjects } from "@/context/ProjectsContext";
import { CatoUploadFile, uploadFiles } from "@/services/filesService";
import { getTakeOffsByProjectId } from "@/services/takeOffService";
import TakeOffCard from "./components/Takeoff-Card";

const Project = () => {
  const order = Number(useParams().projectId);

  const router = useRouter();

  const { projects } = useProjects();

  const id = projects.find((p) => p.project_id === order)?.project_id;

  const { from } = useNavigation();
  const [backUrl, setBackUrl] = useState<URL>();
  const [project, setProject] = useState<any | undefined>();
  const [projectNotFound, setProjectNotFound] = useState(false);
  const [loadingCato, setLoadingCato] = useState(false);
  const [isCreateTakeOffDone, setIsCreateTakeOffDone] = useState(false);
  const [takeOffs, setTakeOffs] = useState<any[]>();
  const [hasLoadedTakeOffs, setHasLoadedTakeOffs] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string>();
  const [filter, setFilter] = useState<string>("");

  const [showCreateTakeOffModal, setShowCreateTakeOffModal] = useState(false);

  const getProject = useCallback(
    async (id: string | number) => {
      const response = await fetchProject(id as string);
      if (response == "error") {
        setProjectNotFound(true);
        return;
      }
      setProject(response);
    },
    [id]
  );

  const getTakeOffs = useCallback(
    async (id: string | number) => {
      const response = await getTakeOffsByProjectId(id as string);
      if (response.status === "success") {
        setTakeOffs(response.data);
      }
      setHasLoadedTakeOffs(true);
    },
    [id]
  );

  const handleUploadFiles = async (
    files: UploadFile[],
    filesInfo: CatoUploadFile[]
  ) => {
    const response: any = await uploadFiles(filesInfo, files, id as number);

    const takeOffId = response?.data?.take_off_result?.id || null;

    if (takeOffId) {
      setIsCreateTakeOffDone(true);
      const url = `/projects/${order}/takeoff/${takeOffId}/identification?_pId=${id}`;
      setRedirectUrl(url);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBackUrl(new URL(from, window.location.origin));
    }
  }, [from]);

  useEffect(() => {
    if (id) {
      getProject(id);
      getTakeOffs(id);
    }
  }, [id]);

  const createQuotiiButton = (
    <Button
      backgroundColor="forumBlue"
      onClick={() => setShowCreateTakeOffModal(true)}
    >
      Create New Take Off
    </Button>
  );
  if (!project?.project_id)
    return projectNotFound ? (
      <div className="w-full m-20">
        <p className="">- Project with id &quot;{id}&quot; not found</p>
        <Link
          href={backUrl?.pathname || "/"}
          className="flex items-center gap-2 cursor-pointer w-fit hover:opacity-80 mb-4"
        >
          <p className="text-lushAqua">Go back</p>
        </Link>
      </div>
    ) : (
      <Spin fullscreen tip="Loading..." />
    );

  return (
    <div>
      <div className="flex flex-col gap-12 zoomed-container">
        <Header
          project={project}
          refetchProject={() => getProject(id as number)}
        />
        <div className="flex flex-col gap-8 mt-36 pl-20 ">
          <div className="flex gap-2.5 items-center">
            <Image
              src="/assets/logos/cato.svg"
              alt="Cato logo"
              width={24}
              height={24}
            />
            <div className="flex flex-col">
              <p>Take Offs</p>
              <p className="text-sm text-basicGray">
                See all your Latii Take Off files, create new, edit, comment and
                share.
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center w-11/12">
            <div className="w-[400px]">
              <Input
                placeholder="Project Name, Status, Client and More."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                prefix={
                  <Image
                    src="/assets/icons/search.svg"
                    alt="search icon"
                    width={11}
                    height={11}
                  />
                }
              />
            </div>
            <Button
              backgroundColor={"forumBlue"}
              onClick={() => setShowCreateTakeOffModal(true)}
            >
              Create New Take Off
            </Button>
          </div>
          <div className="w-11/12 flex flex-col gap-4 pb-10 overflow-auto pt-4 h-[80vh] scrollbar-hidden">
            {!hasLoadedTakeOffs ? (
              <Spin />
            ) : takeOffs ? (
              takeOffs.map((takeOff: any, index: number) => {
                const name = takeOff?.take_off_result?.name || "";
                if (!name.toLowerCase().includes(filter.toLowerCase()))
                  return null;
                return (
                  <TakeOffCard
                    key={index}
                    takeOff={takeOff}
                    fetchTakeOffs={() => {
                      if (!id) return;
                      getTakeOffs(id);
                    }}
                  />
                );
              })
            ) : (
              <EmptyProject createQuotiiButton={createQuotiiButton} />
            )}
          </div>
        </div>

        {showCreateTakeOffModal && (
          <CreateTakeOffModal
            isOpen={showCreateTakeOffModal}
            setIsOpen={setShowCreateTakeOffModal}
            setLoadingCato={setLoadingCato}
            handleCreateTakeOff={handleUploadFiles}
          />
        )}
      </div>
      {loadingCato && (
        <BuildingBackground
          isDone={isCreateTakeOffDone}
          onFinish={() => {
            if (!redirectUrl) return;
            router.push(redirectUrl);
          }}
        />
      )}
    </div>
  );
};

export default Project;
