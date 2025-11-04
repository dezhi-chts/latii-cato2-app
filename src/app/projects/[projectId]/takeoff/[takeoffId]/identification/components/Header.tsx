/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Divider, Input, notification, UploadFile } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import { FilePanel } from "@/app/projects/[projectId]/components/Create-Takeoff/Cato-Upload";
import { updateTakeOffName } from "@/services/takeOffService";
import { analyzeItem } from "@/services/DrawingAiService";
import { BuildingBackground } from "@/app/projects/[projectId]/components/Create-Takeoff/Building-Background";
import { useParams, useSearchParams } from "next/navigation";
const Header = ({
  project,
  takeOff,
  selectedFileId,
  setSelectedFileId,
}: any) => {
  const router = useRouter();
  const order = Number(useParams().projectId);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("_pId") || "";

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
    const response = await updateTakeOffName(name, takeOffData?.id);
    if (response.status === "success") {
      notification.success({
        message: "Success",
        description: "Take off name updated successfully",
      });
      setTakeOffName(name);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to update take off name",
      });
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    // const templateId = takeOffData?.template_id;
    const templateId = "1"; // FOR NOW
    const response = await analyzeItem(
      takeOffData?.id as string,
      templateId as string
    );
    setLoading(false);
    if (response.status === "success") {
      notification.success({
        message: "Success",
        description: "Item analyzed successfully",
      });
      //跳转到分析结果页面
      router.replace(
        `/projects/${order}/takeoff/${takeOffData?.id}/analyze?_pId=${projectId}`
      );
      return;
    } else {
      notification.error({
        message: "Error",
        description: "Failed to analyze item. Please try again.",
      });
    }
  };

  return (
    <div>
      <div className="pt-6 pb-3 px-14 flex border-b-neutralsN50 bg-white border-b justify-between relative z-50 zoomed-container">
        <div className="flex gap-10 items-center">
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
          </Link>
          <div>
            <p className="text-sm text-forumBlue">Item Identification</p>
            <p className="text-xs text-basicGray">
              Label pages information to improve AI analysis.
            </p>
          </div>
          <div className="flex gap-1.5 items-center">
            <p className="text-xs">Take Off Name</p>
            <Input
              placeholder="Add Take Off Name"
              className="bg-primaryN20 border-primaryN20 w-72"
              value={takeOffName}
              onChange={(e) => setTakeOffName(e.target.value)}
              onBlur={() => handleUpdateTakeOffName(takeOffName)}
            />
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
