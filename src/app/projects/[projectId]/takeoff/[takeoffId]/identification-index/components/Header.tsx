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
import { useEffect, useState } from "react";
import { Button } from "antd";
import { FilePanel } from "@/app/projects/[projectId]/components/Create-Takeoff/Cato-Upload";
import { analyzeItem } from "@/services/DrawingAiService";

import { BuildingBackground } from "@/app/projects/[projectId]/components/Create-Takeoff/Building-Background";
import { useParams } from "next/navigation";
import ConfirmAnalyzeModal from "./ConfirmAnalyzeModal";

const Header = ({
  pdfRef,
  project,
  takeOff,
  selectedFileId,
  setSelectedFileId,
  showContentView
}: any) => {
  const router = useRouter();
  const projectId = useParams().projectId;

  const [takeOffData, setTakeOffData] = useState<any>();
  const [filesData, setFilesData] = useState<any>(() => {
    let data = [
      {
        id: 1,
        file_name: 'Architectural-example.pdf',
        upload_status: 'done',
        url: 'https://latii-automation-dev.s3.amazonaws.com/s3_evidences/original/6a0f8d76ba474ddcae31e942e9c3cbb2_24_6004.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260121%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260121T062920Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=a5dbd176be9ca1a3a68968a225545686f103dfa79d78d71adc26fc1bb18eaa2f'
      },
      {
        id: 2,
        file_name: 'Quote-example.pdf',
        upload_status: 'done',
        url: 'https://latii-automation-dev.s3.amazonaws.com/s3_evidences/original/935d889f8e954ad29fd0f7205dab5bd8_1107_114353.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260121%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260121T063110Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=15e3a5d67fd627179a8abae980b2becb38fe4f897c886b96b090f1af61496f96',
      },
    ];
    return data;
  });
  const [loading, setLoading] = useState(false);
  const [hasFinishedAnalyzing, setHasFinishedAnalyzing] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState<boolean>(false);


  const handleAnalyze = async () => {

  };

  const handleAnalyzeClick = async () => {
    await pdfRef?.current?.checkAndHandleUnsavedCrops?.(true);
    setShowAnalyzeModal(true);
  };

  return (
    <div className="h-[110px]">
      <div className="px-14 flex justify-between items-center border-b-neutralsN50 bg-white border-b  z-50 zoomed-container">
        <div>
          <div className="flex flex-row  gap-3 text-base text-forumBlue">Page Index
            <Popover
              placement="rightBottom"
              title={null}
              content={
                <div className="w-[200px] flex flex-col gap-2">
                  <div className="text-xxs">Page Index</div>
                  <div className="text-xxs text-baseGray">If the drawing includes a section that outlines the pages in the drawing, CATO will improve the accuracy to filter to the window and door pages you need.</div>
                </div>
              }
              trigger="hover"
            >
              <Image src="/assets/icons/info-forum-blue.svg" alt="info circle icon" width={14} height={14}></Image>            </Popover>
          </div>
          <div className="mt-2 text-sm text-baseGray">If available add your page index so CATO can perform a better reading.</div>
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
          {
            showContentView ? <Button
              className="w-[124px] bg-forumBlue text-white rounded-md"
              onClick={() => handleAnalyzeClick()}
            >
              Next
            </Button> : <Button
              className="w-[76px] bg-primaryN30 rounded-md"
              onClick={() => handleAnalyzeClick()}
            >
              Skip
            </Button>
          }

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
