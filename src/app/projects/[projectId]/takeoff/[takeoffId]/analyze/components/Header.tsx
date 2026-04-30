/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Divider, Input, Popover, UploadFile, notification } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import Button from "@/components/Button";
import { FilePanel } from "@/app/projects/[projectId]/components/Create-Takeoff/Cato-Upload";
import { updateTakeOffInfo } from "@/services/takeOffService";
const Header = ({
  project,
  takeOff,
  selectedFileId,
  setSelectedFileId,
}: any) => {
  const order = Number(useParams().projectId);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("_pId") || "";

  const [takeOffData, setTakeOffData] = useState<any>();
  const [filesData, setFilesData] = useState<any>([]);

  useEffect(() => {
    const data = takeOff?.all_items?.[selectedFileId] || [];
    const files = takeOff?.project_files || [];
    setFilesData(files);
    setTakeOffData(data);
    setTakeOffName(takeOff?.take_off_result?.name || "");
  }, [takeOff]);

  const [takeOffName, setTakeOffName] = useState<string>(
    takeOffData?.name || ""
  );

  const handleUpdateTakeOffName = async (name: string) => {
    let response = await updateTakeOffInfo(takeOff?.take_off_result?.id, { name: name });
    if (response.status === "success") {
      notification.success({
        message: "Success",
        description: "Take off name updated successfully",
      });
    } else {
      notification.error({
        message: "Error",
        description: "Failed to update take off name",
      });
    }
  };

  const infoTooltipContent = (
    <div className="px-2 py-1 max-w-72 text-xs">
      <p className="text-grey-normal font-semibold mb-2">Summary data</p>
      <ul className="list-disc marker:text-grey-normal pl-4 flex flex-col gap-1">
        <li>
          <span className="font-semibold text-grey-normal">Items:</span>The
          total count of primary labels in your takeoff list (excludes sub-items
          inside systems).
        </li>
        <li>
          <span className="font-semibold text-grey-normal">Products:</span>The
          overall quantity (the sum of quantities across all labels).
        </li>
        <li>
          <span className="font-semibold text-grey-normal">Systems:</span>The
          number of labels that are classified as systems.
        </li>
        <li>
          <span className="font-semibold text-grey-normal">Items:</span>Items
          specifically marked within the boxing takeoff section.
        </li>
      </ul>
    </div>
  );

  return (
    <div>
      <div className="pt-6 pb-3 px-14 flex border-b-primaryN50 bg-white border-b justify-between relative z-50 zoomed-container">
        {/*   Project name */}
        <div className="flex gap-5 items-center">
          <Link
            href={`/projects/${projectId}`}
            className="flex gap-1.5 items-center group"
          >
            <Image
              src="/assets/icons/arrow-back.svg"
              alt="go back"
              width={20}
              height={20}
              style={{ width: "auto", height: "auto" }}
              className="cursor-pointer"
            />
            {/* <p className="text-lushAqua text-sm group-hover:underline">
                            Project
                        </p> */}
          </Link>
          <div className="flex gap-1.5 items-center">
            <Input
              placeholder="Add Take Off Name"
              className="w-72"
              value={takeOffName}
              onChange={(e) => setTakeOffName(e.target.value)}
              onBlur={() => handleUpdateTakeOffName(takeOffName)}
            />
          </div>
        </div>

        {/*  Summary */}
        <div className="flex ml-8 gap-8">
          <div className="flex items-center h-full gap-4">
            <div className="flex gap-1 items-center">
              <span className="text-kahuBlue">Summary</span>
              <Popover content={infoTooltipContent}>
                <Image
                  src="/assets/icons/info-forum-blue.svg"
                  alt="Info"
                  width={20}
                  height={20}
                />
              </Popover>
            </div>

            <Divider type="vertical" className="h-6 m-0 bg-primaryN30" />
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col gap-1 justify-center ">
              <span className="text-base">5</span>
              <span className="text-grey-normal"> Items</span>
            </div>
            <div className="flex flex-col gap-1 justify-center ">
              <span className="text-base">5</span>
              <span className="text-grey-normal"> Products</span>
            </div>
            <div className="flex flex-col gap-1 justify-center ">
              <span className="text-base">5</span>
              <span className="text-grey-normal"> Systems</span>
            </div>
            <div className="flex flex-col gap-1 justify-center ">
              <span className="text-base">5</span>
              <span className="text-grey-normal"> Boxed Items</span>
            </div>
          </div>
        </div>
        {/* Botones  */}
        <div className="flex items-center gap-4 h-20">
          <Button
            backgroundColor="grey-light"
            color="grey-dark"
            className=" rounded-md"
          >
            Reset Takeoff
          </Button>
          <Button
            backgroundColor="forumBlue-normal"
            className="rounded-md"
            onClick={() => { }}
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Header;
