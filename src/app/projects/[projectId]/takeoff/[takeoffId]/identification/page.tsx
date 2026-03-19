"use client";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  ConfigProvider,
  Divider,
  message,
  Modal,
  notification,
  Popover,
  Select,
  Spin,
} from "antd";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getTakeOffById } from "@/services/takeOffService";
import { useUser } from "@/context/UserContext";

import { FileOperationType, FileStatus } from "../types/evidence";

import {
  useTakeoff,
  TakeoffProvider,
  FileViewStep,
} from "@/context/TakeoffContext";
import LoadingScreen from "@/components/loading-screen";

const { confirm } = Modal;

export enum ButtonText {
  NextFile = "Next File",
  Complete = "Complete",
  Analysis = "Analysis",
  NextStep = "Next Step",
  FileMerge = "File Merge",
  CreateTakeoff = "Create Takeoff",
}

const PageLabelingContent = () => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;

  //const [selectedFileId, setSelectedFileId] = useState<number>(-1);
  //const [takeOff, setTakeOff] = useState<any>();

  //const [fileList, setFileList] = useState<any>([]);
  const [fullLoading, setFullLoading] = useState<boolean>(false);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);
  //const [fileViewStep, setFileViewStep] = useState<FileViewStep | ''>('');
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const { company_id } = useUser();

  const {
    selectedFileId,
    setSelectedFileId,
    fileList,
    setFileList,
    takeOff,
    setTakeOff,
    fileViewStep,
    setFileViewStep,
    indexBoxCount,
    loadFromStorage,
    clearStorage,
    mergeFileStatus,
  } = useTakeoff();

  const drawingIndexRef = useRef<any>(null);
  const drawingSummaryRef = useRef<any>(null);
  const drawingLabelRef = useRef<any>(null);
  const buildingStep = useRef("");

  useEffect(() => {
    if (takeOffId && company_id) {
      getTakeOffDetails();
    }
  }, [takeOffId, company_id]);

  const getTakeOffDetails = async () => {
    setFullLoading(true);
    let res: any = await getTakeOffById(takeOffId as any);
    if (res.status === "success") {
      let project_files = res?.data?.project_files ?? [];
      setTakeOff(res?.data ?? {});
      if (project_files?.length > 0) {
        // 判断第一个文件的类型，如果文件时Arch Drawing，则跳转到IndexSummary页面
        const updatedFiles = project_files.map((file: any, index: number) =>
          index === 0 ? { ...file, status: FileStatus.Processing } : file,
        );
        setFileList(updatedFiles);
        setSelectedFileId(project_files[0].id);
        if (project_files[0].operation_type === FileOperationType.ArchitectureDrawing) {
          router.replace(`/projects/${projectId}/takeoff/${takeOffId}/identification/index-summary`);
        } else {
          router.replace(`/projects/${projectId}/takeoff/${takeOffId}/identification/page-label`);
        }
      }
    } else {
      notification.error({
        message: "Error",
        description: "No files found in this take off",
      });
    }
    setFullLoading(false);
  }

  const getTakeOffDetails2 = async () => {
    setFullLoading(true);
    let res: any = await getTakeOffById(takeOffId as any);
    if (res.status === "success") {
      let project_files = res?.data?.project_files ?? [];
      setTakeOff(res?.data ?? {});
      if (project_files?.length > 0) {
        let loadedFiles = loadFromStorage();
        if (loadedFiles?.fileList?.length > 0) {
          // 将本地保存的文件状态同步到项目文件状态
          let list = mergeFileStatus(project_files);
          setFileList(list);

          // 检查是否所有文件都已完成
          const allCompleted = list.every(
            (file: any) => file.status === FileStatus.Completed,
          );
          if (allCompleted) {
            // 如果所有文件都已完成，不设置选中文件id，设置为合并页面
            setSelectedFileId(-1);
            setFileViewStep(FileViewStep.FileMerge);
          } else {
            // 检查是否只有一个文件为处理中
            const processFiles = list.filter(
              (file: any) => file.status === FileStatus.Processing,
            );
            if (processFiles.length === 1) {
              // 如果只有一个处理中的文件，设置为选中文件
              const processFile = processFiles[0];
              setSelectedFileId(processFile.id);
              setFileViewStep(
                processFile.operation_type ===
                  FileOperationType.ArchitectureDrawing
                  ? FileViewStep.IndexSummary
                  : FileViewStep.Second,
              );
            } else {
              // 其他情况默认设置第一个文件为当前操作文件
              setSelectedFileId(project_files[0].id);
              setFileViewStep(
                project_files[0].operation_type ===
                  FileOperationType.ArchitectureDrawing
                  ? FileViewStep.IndexSummary
                  : FileViewStep.Second,
              );
            }
          }
        } else {
          // 如果loadedFiles?.fileList为空，取第一个文件的设置逻辑
          const updatedFiles = project_files.map((file: any, index: number) =>
            index === 0 ? { ...file, status: FileStatus.Processing } : file,
          );
          setFileList(updatedFiles);
          setSelectedFileId(project_files[0].id);
          setFileViewStep(
            project_files[0].operation_type ===
              FileOperationType.ArchitectureDrawing
              ? FileViewStep.IndexSummary
              : FileViewStep.Second,
          );
        }
      } else {
        notification.error({
          message: "Error",
          description: "No files found in this take off",
        });
      }
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get take off",
      });
    }
    setFullLoading(false);
  };

  return (
    <div className={`w-full flex flex-col relative h-[100vh]`}>
      {/* <Header
        fileList={fileList}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
        onChangeFile={(fileId: number) => handleChangeFile(fileId)}
        nextButtonInfo={nextButtonInfo}
        handleNext={handleNext}
        onHandleBack={handleBack}
        fileViewStep={fileViewStep}
      />
      <div className="flex-1 flex overflow-hidden">
        {fileViewStep === FileViewStep.IndexDrawing && (
          <IdentIndex ref={drawingIndexRef} />
        )}
        {fileViewStep === FileViewStep.IndexSummary && (
          <IdentSummary ref={drawingSummaryRef} />
        )}
        {fileViewStep === FileViewStep.Second && (
          <IdentLabel ref={drawingLabelRef} />
        )}
        {fileViewStep === FileViewStep.FileMerge && <ManualMerge></ManualMerge>}
      </div>
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
      {buildLoading && <BuildingBackground step={buildingStep.current} />}
      {showAnalysisModal && (
        <PreAnalysisMdal
          isOpen={showAnalysisModal}
          closeModal={() => setShowAnalysisModal(false)}
          handleAnalysis={() => {
            setShowAnalysisModal(false);
          }}
        ></PreAnalysisMdal>
      )} */}
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
    </div>
  );
};

const PageLabeling = () => {
  return <PageLabelingContent />;
};
export default PageLabeling;
