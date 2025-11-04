/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Divider, Input, UploadFile, notification } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import Button from "@/components/Button";
import { FilePanel } from "@/app/projects/[projectId]/components/Create-Takeoff/Cato-Upload";
import { updateTakeOffName } from "@/services/takeOffService";
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
    let response = await updateTakeOffName(name, takeOff?.take_off_result?.id);
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

  return (
    <div>
      <div className="pt-6 pb-3 px-14 flex border-b-neutralsN50 bg-white border-b justify-between relative z-50 zoomed-container">
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
            <div className="flex ml-8 gap-8">
              <span className="text-kahuBlue">Summary</span>
              <Divider type="vertical" className="h-auto m-0 bg-primaryN30" />
              <p>
                <span className="font-semibold">{takeOffData?.length}</span>{" "}
                Items
              </p>
              <p>
                <span className="font-semibold">
                  {takeOffData?.reduce((sum: number, item: any) => {
                    try {
                      if (!item.result) {
                        return sum;
                      } else {
                        let result = JSON.parse(item.result);
                        return sum + (1 * (result?.Quantity ?? 1));
                      }
                    } catch (e) {}
                  }, 0)}
                </span>{" "}
                Products
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 h-20">
          {filesData?.map((file: any, index: number) => {
            const uploadFile: UploadFile = {
              uid: String(file.id),
              name: file.file_name,
              status: "done",
              url: file.parse_detail?.uploaded_file_url,
              type: "application/pdf",
              size: 0,
            };
            return (
              <div
                key={index}
                className={`rounded cursor-pointer ${
                  selectedFileId === file.id
                    ? "bg-primaryN20"
                    : "hover:bg-primaryN10"
                }`}
                onClick={() => setSelectedFileId(file.id)}
              >
                <FilePanel
                  file={uploadFile}
                  canBeRemoved={false}
                  textClassName="text-xs"
                  isSelected={selectedFileId === file.id}
                />
              </div>
            );
          })}
          <Divider type="vertical" className="h-full m-0 bg-primaryN30" />
          <Button
            backgroundColor="forumBlue"
            className="px-8"
            onClick={() => {}}
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Header;
