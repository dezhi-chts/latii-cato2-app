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
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "antd";

import { useParams } from "next/navigation";
import { PageAnalysisStepInActive, PageIndexStepActive, PageLabelingStepInActive } from "./HeaderStepProgress";
import { FileItem } from "./FileList";
import { FileStatus } from "../../types/evidence";
import { ButtonText } from "../page";

const Header = ({
  pdfRef,
  fileList,
  selectedFileId,
  setSelectedFileId,
  nextButtonInfo,
  handleNext,
  handleBack
}: any) => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;

  const [loading, setLoading] = useState(false);

  const filesData = useMemo(() => {
    if (!fileList) return [];
    return fileList ?? [];
  }, [fileList]);

  const handleClickFile = async (file: any) => {
    if (selectedFileId === file.id) return;
    // 切换文件
    setSelectedFileId(file.id);
  }

  return (
    <div className="px-14 w-full h-[110px] border-b border-primaryN30">
      <div className="h-full flex flex-row justify-between items-center">
        <div className="cursor-pointer" onClick={handleBack}>
          <Image src="/assets/icons/arrow-back.svg" alt="logo" width={12} height={8}></Image>
        </div>
        <div className="ml-10 h-full flex-1 flex flex-row gap-4 items-center">
          <PageIndexStepActive />

          <div className="ml-4 mr-14 flex gap-4">
            {filesData?.map((file: any, index: number) => {
              const uploadFile: UploadFile = {
                id: file.id,
                name: file.file_name,
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
                  width: "130px",
                  height: "30px",
                }}
              />;
            })}
          </div>
          <PageLabelingStepInActive />
          <PageAnalysisStepInActive />
        </div>
        <Button
          className="custom-primary-btn w-[102px] h-[26px]"
          onClick={() => handleNext(nextButtonInfo)}
          disabled={nextButtonInfo?.disabled}
        >
          {nextButtonInfo?.text}
        </Button>
      </div>
    </div>
  );
};

export default Header;
