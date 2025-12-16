"use client";
import Image from "next/image";
import Header from "./components/Header";
import { Input, Spin } from "antd";
import EmptyProject from "./components/Empty-Project";
import Button from "@/components/Button";
import { useState } from "react";

import TakeOffCard from "./components/Takeoff-Card";

const Project = () => {
  const takeOffs = undefined;
  const [filter, setFilter] = useState<string>("");
  const [showCreateTakeOffModal, setShowCreateTakeOffModal] = useState(false);
  const createQuotiiButton = (
    <Button
      backgroundColor="forumBlue"
      onClick={() => setShowCreateTakeOffModal(true)}
    >
      Create New Take Off
    </Button>
  );

  return (
    <div>
      <div className="flex flex-col gap-12 zoomed-container">
        <Header project={{}} />
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
            {false ? (
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
                    fetchTakeOffs={() => {}}
                  />
                );
              })
            ) : (
              <EmptyProject createQuotiiButton={createQuotiiButton} />
            )}
          </div>
        </div>

        {/* {showCreateTakeOffModal && (
          <CreateTakeOffModal
            isOpen={showCreateTakeOffModal}
            setIsOpen={setShowCreateTakeOffModal}
            setLoadingCato={setLoadingCato}
            handleCreateTakeOff={handleUploadFiles}
          />
        )} */}
      </div>
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
