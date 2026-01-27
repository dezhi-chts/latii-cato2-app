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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "antd";

import { BuildingBackground } from "@/app/projects/[projectId]/components/Create-Takeoff/Building-Background";
import { useParams } from "next/navigation";
import ConfirmAnalyzeModal from "./ConfirmAnalyzeModal";
import { PageAnalysisStepActive, PageIndexStepActive, PageLebelingStepActive } from "./HeaderStepProgress";
import { FileItem } from "./FileList";

const Header = ({
  pdfRef,
  fileList,
  selectedFileId,
  setSelectedFileId,
  handleNext,
}: any) => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;

  const [loading, setLoading] = useState(false);
  const [hasFinishedAnalyzing, setHasFinishedAnalyzing] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState<boolean>(false);

  const filesData = useMemo(() => {
    if (!fileList) return [];
    return fileList ?? [];
  }, [fileList]);

  const handleAnalyze = async () => {
    console.log(' handleAnalyze');
    setShowAnalyzeModal(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // 跳转到识别结果页面
      router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification`);
    }, 3000);
  };
  const handleAnalyzeClick = async () => {
    setShowAnalyzeModal(true);
  };

  const handleClickFile = async (file: any) => {
    const unsaved =
      await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
    if (unsaved) {
      console.log("########### file change");
      // 没有未保存的crop，切换文件
      setSelectedFileId(file.id);
    }
  }

  return (
    <div className="px-14 w-full h-[110px]">
      <div className="h-full flex flex-row justify-between items-center">
        <div>
          <Image src="/assets/icons/arrow-left-gray.svg" alt="logo" width={12} height={8}></Image>
        </div>
        <div className="ml-10 h-full flex-1 flex flex-row gap-4 items-center">
          <PageIndexStepActive />

          <div className="mr-14 flex gap-4">
            {filesData?.map((file: any, index: number) => {
              const uploadFile: UploadFile = {
                id: file.id,
                name: file.file_name + file.file_name,
                status: file.status || 'undo',
                url: file?.parse_detail?.uploaded_file_url,
                type: "application/pdf",
                size: 0,
              };
              return <FileItem
                key={file.id}
                file={uploadFile}
                selectedFileId={selectedFileId}
                handleClickFile={handleClickFile}
                showStatus={true}
                fileContainerStyle={{
                  width: "150px",
                  height: "50px",
                }}
              />;
            })}
          </div>
          <PageLebelingStepActive />
          <PageAnalysisStepActive />
        </div>
        <Button
          type="primary"
          className="w-[100px] text-white rounded-md"
          onClick={() => handleNext()}
        >
          Next
        </Button>
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
