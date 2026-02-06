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

import { useParams } from "next/navigation";
import { FileItem } from '../../identification-index/components/FileList';
import { PageIndexStepInActive, PageLabelingStepActive, PageAnalysisStepInActive } from '../../identification-index/components/HeaderStepProgress';

const Header = ({
  pdfRef,
  fileList,
  selectedFileId,
  setSelectedFileId,
  nextButtonInfo,
  handleNext
}: any) => {
  const router = useRouter();
  const projectId = useParams().projectId;

  const filesData = useMemo(() => {
    if (!fileList) return [];
    return fileList ?? [];
  }, [fileList]);

  const [loading, setLoading] = useState(false);

  const handleClickFile = async (file: any) => {
    if (selectedFileId === file.id) return;
    // 切换文件
    setSelectedFileId(file.id);
  }

  const handleBack = () => {
    router.push(`/projects/${projectId}/takeoff/${selectedFileId}/identification-index`);
  };

  return (
    <div className="px-14 w-full h-[110px] border-b border-primaryN30">
      <div className="h-full flex flex-row justify-between items-center">
        <div className="cursor-pointer" onClick={handleBack}>
          <Image src="/assets/icons/arrow-back.svg" alt="logo" width={12} height={6} style={{ height: 'auto' }}></Image>
        </div>
        <div className="ml-10 h-full flex-1 flex flex-row gap-4 items-center">
          <PageIndexStepInActive />
          <PageLabelingStepActive />
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
                handleClickFile={() => { handleClickFile(file) }}
                showStatus={true}
                showBorder={true}
                fileContainerStyle={{
                  width: "130px",
                  height: "30px",
                }}
              />;
            })}
          </div>
          <PageAnalysisStepInActive />
        </div>
        <Button
          className="custom-primary-btn w-[102px] h-[26px] cursor-pointer"
          onClick={() => handleNext(nextButtonInfo)}
        >
          {nextButtonInfo?.text}
        </Button>
      </div>
    </div>
  );
};

export default Header;
