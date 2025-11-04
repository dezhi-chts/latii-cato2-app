/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Divider, Input, UploadFile } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import { FilePanel } from "../../../components/Create-Takeoff/Cato-Upload";
import { updateTakeOffName } from "@/services/takeOffService";
import { analyzeItem } from "@/services/DrawingAiService";
import { BuildingBackground } from "../../../components/Create-Takeoff/Building-Background";
import { div } from "framer-motion/m";

const Header = ({
  project,
  takeOff,
  selectedFileId,
  setSelectedFileId,
  isNew,
}: any) => {
  const [takeOffData, setTakeOffData] = useState<any>();
  const [filesData, setFilesData] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [hasFinishedAnalyzing, setHasFinishedAnalyzing] = useState(false);

  useEffect(() => {
    const data = takeOff?.take_off_result;
    const files = takeOff?.project_files;
    setFilesData(files);
    setTakeOffData(data);
    setTakeOffName(data?.name || "");
  }, [takeOff]);

  const [takeOffName, setTakeOffName] = useState<string>(
    takeOffData?.name || ""
  );

  const handleUpdateTakeOffName = async (name: string) => {
    await updateTakeOffName(name, takeOffData?.id);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    // const templateId = takeOffData?.template_id;
    const templateId = "1"; // FOR NOW
    const response = await analyzeItem(
      takeOffData?.id as string,
      templateId as string
    );
    console.log(response);
    setHasFinishedAnalyzing(true);
    // setLoading(false);
  };

  return (
    <div>
      <div className="pt-6 pb-3 px-14 flex border-b-neutralsN50 bg-white border-b justify-between relative z-50 zoomed-container">
        <div className="flex gap-10 items-center">
          <Link
            href={`/projects/${project?.project_id}`}
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
            {!isNew && (
              <p className="text-lushAqua text-sm group-hover:underline">
                Project
              </p>
            )}
          </Link>
          {isNew && (
            <div>
              <p className="text-sm text-forumBlue">Item Identification</p>
              <p className="text-xs text-basicGray">
                Label pages information to improve AI analysis.
              </p>
            </div>
          )}
          <div className="flex gap-1.5 items-center">
            {isNew && <p className="text-xs">Take Off Name</p>}
            <Input
              placeholder="Add Take Off Name"
              className="bg-primaryN20 border-primaryN20 w-72"
              value={takeOffName}
              onChange={(e) => setTakeOffName(e.target.value)}
              onBlur={() => handleUpdateTakeOffName(takeOffName)}
            />
            {!isNew && (
              <div className="flex gap-2">
                <span className="text-kahuBlue">Summary</span>
                <Divider type="vertical" className="h-auto m-0 bg-primaryN30" />
                <p>
                  <span className="font-semibold">
                    {takeOffData?.items?.length}
                  </span>{" "}
                  Items
                </p>
                <p>
                  <span className="font-semibold">0</span> Products
                </p>
              </div>
            )}
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
                  selectedFileId === index
                    ? "bg-primaryN20"
                    : "hover:bg-primaryN10"
                }`}
                onClick={() => setSelectedFileId(index)}
              >
                <FilePanel
                  file={uploadFile}
                  canBeRemoved={false}
                  textClassName="text-xs"
                  isSelected={selectedFileId === index}
                />
              </div>
            );
          })}

          <Divider type="vertical" className="h-full m-0 bg-primaryN30" />
          <Button
            backgroundColor="forumBlue"
            className="px-8"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? "Wait..." : "Analyze"}
          </Button>
        </div>
      </div>
      {loading && (
        <BuildingBackground
          isDone={hasFinishedAnalyzing}
          totalDuration={30000}
          onFinish={() => setLoading(false)}
        />
      )}
    </div>
  );
};

export default Header;
