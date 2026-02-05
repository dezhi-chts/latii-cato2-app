"use client";
import Image from "next/image";
import Header from "./components/Header";
import { Input, Spin, Button, Modal } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import EmptyProject from "./components/Empty-Project";
import { useEffect, useState } from "react";

import CreateTakeOffModal from "./components/Create-Takeoff/Create-Takeoff-Modal";
import { getTakeOffsByProjectId, deleteTakeOffById } from "@/services/takeOffService";
import { useParams, useRouter } from "next/navigation";

const { confirm } = Modal;

const Project = () => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const [filter, setFilter] = useState<string>("");
  const [showCreateTakeOffModal, setShowCreateTakeOffModal] = useState(false);
  const [takeoffsList, setTakeoffsList] = useState<any[]>([]);
  const [fullLoading, setFullLoading] = useState(false);

  useEffect(() => {
    getProjectTakeoffs();
  }, [projectId]);

  const createQuotiiButton = (
    <Button
      type="primary"
      onClick={() => setShowCreateTakeOffModal(true)}
    >
      Create Quote
    </Button>
  );

  const getProjectTakeoffs = async () => {
    setFullLoading(true);
    let res = await getTakeOffsByProjectId(projectId as string);
    setFullLoading(false);
    if (res.status === 'success') {
      setTakeoffsList(res.data ?? []);
    } else {
      setTakeoffsList([]);
    }
  }


  const handleUploadFiles = async (data: { archFiles: UploadFile[], quoteFiles: UploadFile[] }) => {
  };

  const onClickTakeOff = (takeOff: any) => {
    router.push(`/projects/${projectId}/takeoff/${takeOff?.take_off_result?.id}/identification-index`);
  }

  const handleRemoveTakeoff = async (takeoff: any) => {
    confirm({
      title: `Are you sure to delete this takeoff: ${takeoff?.name}?`,
      okText: "Yes",
      onOk: async () => {
        setFullLoading(true);
        const res = await deleteTakeOffById(takeoff?.id as string);
        setFullLoading(false);
        getProjectTakeoffs();
      },
    })
  }

  return (
    <div>
      <div className="flex flex-col gap-12 zoomed-container">
        <Header project={{}} />
        <div className="flex flex-col gap-8 mt-36 pl-20 ">
          <div className="flex text-lg text-forumBlue">
            Takeoffs & Quotiis
          </div>
          {takeoffsList?.length > 0 &&
            <div className="flex justify-between items-center w-11/12">
              <div className="flex h-[34px] flex-row gap-5">
                <Input
                  className="w-[400px] h-full rounded-3xl"
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
                <div className="w-[100px] h-full text-center rounded-md bg-primaryN30 flex justify-center items-center">
                  <label className="mr-2 text-ms font-light">All</label>
                  <span className="px-[6px] py-[1px] text-xs text-white bg-primaryN70 rounded">1</span>
                </div>
                <div className="w-[100px] h-full text-center rounded-md bg-[#FF931E4C] flex justify-center items-center">
                  <label className="mr-2 text-ms font-light">Upload</label>
                  <span className="px-[6px] py-[1px] text-xs text-dragonOrange bg-white rounded">0</span>
                </div>
                <div className="w-[100px] h-full text-center rounded-md bg-[#008ECE4C] flex justify-center items-center">
                  <label className="mr-2 text-ms font-light">Takeoff</label>
                  <span className="px-[6px] py-[1px] text-xs text-kahuBlue bg-white rounded">1</span>
                </div>
                <div className="w-[100px] h-full text-center rounded-md bg-[#F7CD4D4C] flex justify-center items-center">
                  <label className="mr-2 text-ms font-light">Quoting</label>
                  <span className="px-[6px] py-[1px] text-xs text-[#F7CD4D] bg-white rounded">1</span>
                </div>
              </div>
              <Button
                type="primary"
                onClick={() => setShowCreateTakeOffModal(true)}
              >
                Create Quote
              </Button>
            </div>
          }

          <div className="w-11/12 flex flex-col gap-4 pb-10 overflow-auto pt-4 h-[80vh] scrollbar-hidden">
            {false ? (
              <Spin />
            ) : takeoffsList?.length > 0 ? (
              takeoffsList.map((takeOff: any, index: number) => {
                // const name = takeOff?.take_off_result?.name || "";
                // if (!name.toLowerCase().includes(filter.toLowerCase()))
                //   return null;
                // return (
                //   <TakeOffCard
                //     key={index}
                //     takeOff={takeOff}
                //     fetchTakeOffs={() => { }}
                //   />
                // );
                return <div key={index} className="p-5 h-[140px] flex flex-row rounded-2xl border border-primaryN30" onClick={() => onClickTakeOff(takeOff)}>
                  <div>
                    <Image src="/assets/cato-images/schedules-tables.png" alt="info icon" width={156} height={100} />
                  </div>
                  <div className="ml-[50px] flex-1 flex flex-col gap-2">
                    <div className="text-base">{takeOff?.take_off_result?.name || ''}</div>
                    <div className="w-[100px] h-[26px] bg-[#008ECE4C] rounded-xl text-center font-light">takeoff</div>
                    <div className="text-xs text-basicGray">Last edit | {takeOff?.take_off_result?.update_time || ''}</div>
                  </div>
                  <div className="flex justify-center items-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTakeoff(takeOff.take_off_result);
                    }}>
                    <Image src="/assets/icons/delete.svg" alt="Delete" width={20} height={20} />
                  </div>
                </div>
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
            onHandleUpload={handleUploadFiles}
          />
        )}
      </div>
      {fullLoading && <Spin fullscreen />}
      {/* {loadingCato && (
        <BuildingBackground
          isDone={isCreateTakeOffDone}
          onFinish={() => {
            if (!redirectUrl) return;
            router.push(redirectUrl);
          }}
        />
      )} */}
    </div>
  );
};

export default Project;
