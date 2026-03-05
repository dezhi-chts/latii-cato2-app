"use client";

import Button from "@/components/Button";
import { boxesColors } from "@/lib/constants";
import Image from "next/image";
import { useState } from "react";
const BoxesType = () => {
  const boxes = [
    {
      name: "Item",
      description: "Item box",
      color: "blue",
      search_prompt: "",
      analysis_prompt: "",
      is_deleted: false,
      create_time: "2026-03-03T16:04:13",
      update_time: "2026-03-03T16:04:13",
      update_user: "yunlong@latii.com",
      create_user: "yunlong@latii.com",
      id: 1,
    },
    {
      name: "Table",
      description: "Table box",
      color: "teal",
      search_prompt: "",
      analysis_prompt: "",
      is_deleted: false,
      create_time: "2026-03-03T16:04:28",
      update_time: "2026-03-03T16:04:28",
      update_user: "yunlong@latii.com",
      create_user: "yunlong@latii.com",
      id: 2,
    },
    {
      name: "Context information",
      description: "Context information box",
      color: "",
      search_prompt: "orange",
      analysis_prompt: "",
      is_deleted: false,
      create_time: "2026-03-03T16:05:02",
      update_time: "2026-03-03T16:05:02",
      update_user: "yunlong@latii.com",
      create_user: "yunlong@latii.com",
      id: 3,
    },
    {
      name: "Keynotes",
      description: "Keynotes box",
      color: "red",
      search_prompt: "",
      analysis_prompt: "",
      is_deleted: false,
      create_time: "2026-03-03T16:06:08",
      update_time: "2026-03-03T16:06:08",
      update_user: "yunlong@latii.com",
      create_user: "yunlong@latii.com",
      id: 4,
    },
    {
      name: "test",
      description: "",
      color: "purple",
      search_prompt: "123",
      analysis_prompt: "456",
      is_deleted: false,
      create_time: "2026-03-04T10:37:12",
      update_time: "2026-03-04T10:37:12",
      update_user: "wangyuncong",
      create_user: "wangyuncong",
      id: 5,
    },
    {
      name: "Box1",
      description: "string",
      color: "green",
      search_prompt: "string",
      analysis_prompt: "string",
      is_deleted: false,
      create_time: "2026-03-04T13:51:05",
      update_time: "2026-03-04T13:51:05",
      update_user: "flor@latii.com",
      create_user: "flor@latii.com",
      id: 7,
    },
  ];

  const [isAddModalOpen, setIsAddModalOpen] = useState<Boolean>(false);

  const handleAddModalCancel = () => {
    setIsAddModalOpen(false);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  return (
    <div className="w-full h-full  text-xs pr-20">
      {/* titles */}
      <div className="flex justify-between items-center w-full mb-8">
        <div className="flex flex-col gap-1">
          <p className="text-base text-grey-base-dark">Box Information</p>
          <p className="text-grey-normal">
            This is the box information available for all takeoffs. Create up to
            20 options.
          </p>
        </div>
        <div>
          <Button backgroundColor={"forumBlue-normal"} className="rounded-md">
            + Add Box Type
          </Button>
        </div>
      </div>
      <div className="w-full">
        {/* encabezados */}
        <div className=" w-full flex bg-primaryN20 border-b border-b-primaryN30 text-grey-normal py-3 rounded-t-md ">
          <div className="w-2/12 text-center">Logic Name</div>
          <div className="w-1/12 text-center">Color</div>
          <div className="w-4/12 text-center">Search Prompt</div>
          <div className="w-5/12 text-center">Analysis Prompt</div>
        </div>
        {/*  Lineas */}
        {boxes?.map((box) => (
          <div
            key={`${box.id}-${box.name}`}
            className="w-full flex py-6 border-b border-primaryN30"
          >
            <div className="w-2/12 text-center">{box?.name}</div>
            <div className="w-1/12 flex justify-center items-center">
              <div
                className="w-4 h-4 rounded-full "
                style={{ backgroundColor: boxesColors[box?.color] }}
              />
            </div>
            <div className="w-4/12 px-2 ">{box.search_prompt}</div>
            <div className="w-5/12 px-2 flex space-between items-center">
              <p className="w-11/12"> {box.analysis_prompt}</p>
              <Image
                src="/assets/icons/three-dots.svg"
                alt=""
                width={20}
                height={10}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoxesType;
