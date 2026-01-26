/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Divider,
  Input,
  notification,
  UploadFile,
  ConfigProvider,
  Select,
  Popover,
} from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "antd";
import { FilePanel } from "@/app/projects/[projectId]/components/Create-Takeoff/Cato-Upload";
import { analyzeItem } from "@/services/DrawingAiService";

import { BuildingBackground } from "@/app/projects/[projectId]/components/Create-Takeoff/Building-Background";
import { useParams } from "next/navigation";
import ConfirmAnalyzeModal from "./ConfirmAnalyzeModal";

const Header = ({
  pdfRef,
  takeOff,
  selectedFileId,
  setSelectedFileId,
  showContentView
}: any) => {
  const router = useRouter();
  const projectId = useParams().projectId;

  const filesData = useMemo(() => {
    if (!takeOff) return [];
    return takeOff?.project_files ?? [];
  }, [takeOff]);

  const [loading, setLoading] = useState(false);
  const [hasFinishedAnalyzing, setHasFinishedAnalyzing] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState<boolean>(false);

  const handleAnalyze = async () => {
    console.log(' handleAnalyze');
    setShowAnalyzeModal(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // 跳转到识别结果页面
      router.push(`/projects/${projectId}/takeoff/${takeOff?.take_off_id}/identification`);
    }, 3000);
  };
  const handleAnalyzeClick = async () => {
    setShowAnalyzeModal(true);
  };

  return (
    <div className="w-full h-[110px]">
      <div className="px-14 h-full flex justify-between items-center border-b-neutralsN50 bg-white border-b">
        <div>
          <div className="flex flex-row text-base text-forumBlue">Page Labeling
          </div>
          <div className="text-xs text-baseGray">If available add your page index so CATO can perform a better reading.</div>
        </div>
        <div></div>
        <div className="flex items-center gap-4 h-20">
          <div className="flex gap-4">
            {filesData?.map((file: any, index: number) => {
              const uploadFile: UploadFile = {
                uid: String(file.id),
                name: file.file_name,
                status: "done",
                url: file.url,
                type: "application/pdf",
                size: 0,
              };
              return (
                <div
                  key={index}
                  className={`rounded cursor-pointer ${selectedFileId === file.id
                    ? "bg-primaryN20"
                    : "hover:bg-primaryN10"
                    }`}
                  onClick={async () => {
                    const unsaved =
                      await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
                    if (unsaved) {
                      console.log("########### file change");
                      // 没有未保存的crop，切换文件
                      setSelectedFileId(file.id);
                    }
                  }}
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
          </div>
          <Divider type="vertical" className="h-full m-0 bg-primaryN30" />
          <Button
            type="primary"
            className="w-[102px] bg-forumBlue text-white rounded-md"
            onClick={() => handleAnalyzeClick()}
          >
            Analyze
          </Button>
        </div>
      </div>
      {loading && (
        <BuildingBackground
          isDone={hasFinishedAnalyzing}
          totalDuration={90000}
          onFinish={() => setLoading(false)}
        />
      )}
      <ConfirmAnalyzeModal
        isOpen={showAnalyzeModal}
        setIsOpen={setShowAnalyzeModal}
        onConfirm={handleAnalyze}
      />
    </div>
  );
};

export default Header;
