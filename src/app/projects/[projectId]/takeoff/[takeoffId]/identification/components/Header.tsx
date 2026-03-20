/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Divider,
  Input,
  notification,
  ConfigProvider,
  Select,
  Popover,
} from "antd";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "antd";

import { FileOperationType, FileStatus } from "../../types/evidence";
import { useTakeoff } from "@/context/TakeoffContext";
import LoadingScreen from "@/components/loading-screen";
import { getTakeOffById } from "@/services/takeOffService";
const ActiveCircle = ({ number }: any) => {
  return (
    <div className="w-[18px] h-[18px] rounded-full  bg-forumBlue-normal text-white text-xs flex justify-center items-center">
      {typeof number !== "undefined" ? number : ""}
    </div>
  );
};

const InActiveCircle = ({ number }: any) => {
  return (
    <div className="w-[18px] h-[18px] rounded-full bg-grey-light-hover text-grey-normal text-xs flex justify-center items-center">
      {typeof number !== "undefined" ? number : ""}
    </div>
  );
};

export const CompletedCirlce = () => {
  return (
    <div
      className={`w-[16px] h-[16px] rounded-full cursor-pointer flex items-center justify-center bg-green-normal`}
    >
      <div className=" text-white text-xxs font-sans">{"✓"}</div>
    </div>
  );
};


const fileStatusMap: any = {
  [FileStatus.Uploaded]: {
    icon: InActiveCircle,
    fileNameColor: "text-grey-normal",
  },
  [FileStatus.Processing]: {
    icon: ActiveCircle,
    fileNameColor: "text-forumBlue-normal",
  },
  [FileStatus.Completed]: {
    icon: CompletedCirlce,
    fileNameColor: "text-green-normal",
  },
}

const Header = ({
  onChangeFile,
  nextButtonInfo,
  handleNext,
  onHandleBack,
  fileViewStep,
}: any) => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;
  const [fullLoading, setFullLoading] = useState<boolean>(false);

  const {
    takeOff,
    setTakeOff,
    fileList,
    setFileList,
    selectedFileId,
    setSelectedFileId,
    setFileViewStep,
    loadFromStorage,
    mergeFileStatus
  } = useTakeoff();

  useEffect(() => {
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      const navEntry: any = navigationEntries[0] as PerformanceNavigationTiming;

      console.log('导航类型:', navEntry.type);
      // 可能的值: "navigate" | "reload" | "back_forward" | "prerender"

      if (navEntry.type === 'reload' || navEntry.type === 'back_forward' || navEntry.type === 'navigate') {
        if (fileList?.length === 0) {
          // 页面刷新的话，takeoffContext中的数据会被重置，此时需要重新获取数据
          getTakeOffDetails();
        }
      }
    }
  }, []);

  const getTakeOffDetails = async () => {
    setFullLoading(true);
    let res: any = await getTakeOffById(takeOffId as any);
    if (res.status === "success") {
      let project_files = res?.data?.project_files ?? [];
      setTakeOff(res?.data ?? {});
      // 同步sessionStorage中的数据
      let localData = loadFromStorage();
      if (localData?.fileList?.length > 0) {
        // 同步sessionStorage中的文件状态
        let list = mergeFileStatus(res?.data?.project_files);
        let findProcess = list.find((file: any) => file.status === FileStatus.Processing);
        if (findProcess) {
          setSelectedFileId(findProcess.id);
        }
      } else {
        // 如果本地数据中没有存储，则取第一个文件
        // 判断第一个文件的类型，如果文件时Arch Drawing，则跳转到IndexSummary页面
        const updatedFiles = project_files.map((file: any, index: number) =>
          index === 0 ? { ...file, status: FileStatus.Processing } : file,
        );
        setFileList(updatedFiles);
        setSelectedFileId(project_files[0].id);
      }
    } else {
      notification.error({
        message: "Error",
        description: "No files found in this take off",
      });
    }
    setFullLoading(false);
  }

  const filesData = useMemo(() => {
    if (!fileList) return [];
    return fileList ?? [];
  }, [fileList]);

  // 判断是否需要显示 Multi File Merger（文件数量大于1）
  const showMerger = filesData.length > 1;

  // 判断是否处于 FileMerge 步骤
  const isFileMergeStep = fileViewStep === 'FileMerge';

  // 判断所有文件是否都已完成（在 FileMerge 步骤时，也认为所有文件已完成）
  const allFilesCompleted = false; // filesData.every((file: any) => file.status === FileStatus.Completed) || isFileMergeStep;

  const handleClickFile = async (file: any) => {
    if (selectedFileId === file.id) return;
    onChangeFile(file.id);
  }

  const handleBack = () => {
    onHandleBack();
  };

  return (
    <div className="px-14 w-full h-[110px] border-b border-primaryN30">
      <div className="h-full flex flex-row justify-between items-center">
        <div className="cursor-pointer" onClick={handleBack}>
          <Image src="/assets/icons/arrow-back.svg" alt="logo" width={12} height={6} style={{ height: 'auto' }}></Image>
        </div>
        <div className="ml-5 h-full flex-1 flex flex-row gap-4 items-center">
          <div className="ml-4 mr-6 flex gap-4">
            {filesData?.map((file: any, index: number) => {
              const uploadFile: any = {
                id: file.id,
                name: file.file_name,
                status: file.status,
                operation_type: file.operation_type || FileOperationType.ArchitectureDrawing,
                url: file?.parse_detail?.uploaded_file_url,
                type: "application/pdf",
                size: 0,
              };
              const { icon: IconComponent, fileNameColor } = fileStatusMap[uploadFile.status] || fileStatusMap[FileStatus.Uploaded];
              return <div className="flex flex-row items-center gap-2" key={index} onClick={() => handleClickFile(file)}>
                <div>
                  <IconComponent number={index + 1} />
                </div>
                <div>
                  <p className={`${fileNameColor} text-xs break-all max-w-[200px]`}>{uploadFile.name}</p>
                  <p>
                    {
                      uploadFile.operation_type === FileOperationType.ArchitectureDrawing && uploadFile.status === FileStatus.Processing && <span className="text-xs text-grey-light-strong">Step A and B</span>
                    }
                    {
                      uploadFile.operation_type === FileOperationType.Quote && uploadFile.status === FileStatus.Processing && <span className="text-xs text-grey-light-strong">Step A</span>
                    }
                  </p>
                </div>
                {index < filesData.length - 1 && <div className="mx-3 w-[67px] h-[1px] bg-grey-light-strong"></div>}
              </div>;
            })}
            {/* Multi File Merger 步骤 */}
            {showMerger && (
              <div className="flex flex-row items-center gap-2">
                <div className="mx-6 w-[67px] h-[1px] bg-grey-light-strong"></div>
                <div className="flex flex-row items-center gap-2">
                  <div>
                    {isFileMergeStep ? (
                      <ActiveCircle number={filesData.length + 1} />
                    ) : allFilesCompleted ? (
                      <CompletedCirlce />
                    ) : (
                      <InActiveCircle number={filesData.length + 1} />
                    )}
                  </div>
                  <div>
                    <p className={`text-xs ${isFileMergeStep ? 'text-forumBlue-normal' : allFilesCompleted ? 'text-green-normal' : 'text-grey-normal'}`}>
                      Multi File Merger
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Button
          className="custom-primary-btn w-[102px] h-[26px] cursor-pointer"
          disabled={nextButtonInfo?.disabled}
          onClick={() => handleNext(nextButtonInfo)}
        >
          {nextButtonInfo?.text}
        </Button>
      </div>
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
    </div>
  );
};

export default Header;
