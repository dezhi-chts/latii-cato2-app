"use client";
import Image from "next/image";
import Header from "./components/Header";
import { Input, Spin, Button } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import EmptyProject from "./components/Empty-Project";
import { useState } from "react";

import CreateTakeOffModal from "./components/Create-Takeoff/Create-Takeoff-Modal";


const Project = () => {
  const takeOffs = undefined;
  const [filter, setFilter] = useState<string>("");
  const [showCreateTakeOffModal, setShowCreateTakeOffModal] = useState(false);
  const [takeoffsList, setTakeoffsList] = useState<any[]>([
    // {
    //   id: '1',
    //   status: 1,
    //   name: '123'
    // }
  ]);
  const createQuotiiButton = (
    <Button
      type="primary"
      onClick={() => setShowCreateTakeOffModal(true)}
    >
      Create Quote
    </Button>
  );

  const handleUploadFiles = async (data: { archFiles: UploadFile[], quoteFiles: UploadFile[] }) => {
  };

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
                return <div key={index} className="p-5 h-[140px] flex flex-row rounded-2xl border border-primaryN30">
                  <div>
                    <Image src="/assets/cato-images/schedules-tables.png" alt="info icon" width={156} height={100} />
                  </div>
                  <div className="ml-[50px] flex flex-col gap-2">
                    <div className="text-base">Quote Name</div>
                    <div className="w-[100px] h-[26px] bg-[#008ECE4C] rounded-xl text-center font-light">takeoff</div>
                    <div className="text-xs text-basicGray">Last edit | October 21, 2025</div>
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
            handleCreateTakeOff={handleUploadFiles}
          />
        )}
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
