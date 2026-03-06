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
import { getBoxTypes } from "@/services/drawingIndexService";
import { useUser } from "@/context/UserContext";

import {
  FileOperationType,
  FileStatus,
} from "../types/evidence";

import LoadingScreen from "@/components/loading-screen";
import Header from "./components/Header";
import BuildingBackground from "./components/BuildingBackground";
import DrawingIndex from "./components/drawing-index/Index";
import DrawingLabel from "./components/drawing-label/Index";
import ManualMerge from "../manual-merge/page";
import PreAnalysisMdal from "./components/drawing-label/PreAnalysisMdal";


const { confirm } = Modal;

enum BuildLoadingStep {
  PageLabel = "page-label",
  PageMerge = "page-merge",
  PageTakeOff = "page-takeoff",
}

export enum ButtonText {
  NextFile = "Next File",
  Complete = "Complete",
  Analysis = "Analysis",
  NextStep = "Next Step",
  FileMerge = "File Merge",
  CreateTakeoff = "Create Takeoff",
}

// 文件视图步骤
export enum FileViewStep {
  IndexDrawing = "IndexDrawing",
  IndexSummary = "IndexSummary",
  Second = "Second",
  FileMerge = "FileMerge"
}

const PageLabeling = () => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;

  const [selectedFileId, setSelectedFileId] = useState<number>(-1);
  const [takeOff, setTakeOff] = useState<any>();

  const [fileList, setFileList] = useState<any>([]);
  const [fullLoading, setFullLoading] = useState<boolean>(false);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);
  const [fileViewStep, setFileViewStep] = useState<FileViewStep | ''>('');
  const [indexBox, setIndexBox] = useState<{ indexBoxList: any[], labelList: any[] }>({ indexBoxList: [], labelList: [] });
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const [showContentView, setShowContentView] = useState<boolean>(true);
  const [boxTypeList, setBoxTypeList] = useState<any>([]);
  const { company_id } = useUser();

  const drawingIndexRef = useRef<any>(null);
  const drawingLabelRef = useRef<any>(null);
  const buildingStep = useRef('');

  useEffect(() => {
    if (takeOffId && company_id) {
      getTakeOffDetails();
      getBoxTypeList();
    }
  }, [takeOffId, company_id]);

  useEffect(() => {
    if (showContentView) {
      setFileViewStep(FileViewStep.IndexSummary);
    } else {
      setFileViewStep(FileViewStep.IndexDrawing);
    }
  }, [showContentView]);

  const getTakeOffDetails = async () => {
    setFullLoading(true);
    let res: any = await getTakeOffById(takeOffId as any);
    if (res.status === "success") {
      let project_files = res?.data?.project_files ?? [];
      setTakeOff(res?.data ?? {});
      if (project_files?.length > 0) {
        // 将第一个文件状态设置为处理中
        const updatedFiles = project_files.map((file: any, index: number) =>
          index === 0 ? { ...file, status: FileStatus.Processing } : file,
        );
        setFileList(updatedFiles);
        setSelectedFileId(project_files[0].id); // 设置默认选中文件ID
        if (project_files[0].operation_type === FileOperationType.ArchitectureDrawing) {
          setFileViewStep(FileViewStep.IndexSummary);
        } else if (project_files[0].operation_type === FileOperationType.Quote) {
          setFileViewStep(FileViewStep.Second);
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
  const getBoxTypeList = async () => {
    if (!company_id) return;
    let res: any = await getBoxTypes(company_id.toString());
    if (res.status === "success") {
      let boxTypes = res?.data ?? [];
      // 为每个 box type 添加 company_id
      boxTypes = boxTypes.map((item: any) => ({
        ...item,
        company_id: company_id.toString(),
      }));
      setBoxTypeList(boxTypes);
    } else {
    }
  };

  const handleChangeFile = async (fileId: number) => {
    if (selectedFileId === fileId) return;
    // 切换文件, 判断当前是否有未保存的crop，如果有则显示提示框并且保存
    const unsaved = await drawingLabelRef?.current?.getUnsavedCrops?.();
    if (!drawingLabelRef.current || unsaved) {
      // 判断fileId的文件是否是已完成状态，已完成的文件才可以点击，未完成的文件不允许点击
      const file = fileList.find((file: any) => file.id === fileId);
      if (file?.status === FileStatus.Completed) {
        handleFileStatus(selectedFileId, fileId);
      }
    }
  }

  const handleFileStatus = (oldFileId: number, newFileId: number) => {
    setSelectedFileId(newFileId);
    setFileList(prev => {
      return prev.map((file: any) => {
        if (file.id === oldFileId) {
          if (file.operation_type === FileOperationType.ArchitectureDrawing && fileViewStep === FileViewStep.Second) {
            return { ...file, status: FileStatus.Completed }
          } else if (file.operation_type === FileOperationType.Quote && fileViewStep === FileViewStep.Second) {
            return { ...file, status: FileStatus.Completed }
          }
          return { ...file, status: FileStatus.Uploaded };
        } else if (file.id === newFileId) {
          return { ...file, status: FileStatus.Processing };
        }
        return file;
      });
    });

    let fileInfo = fileList.find((file: any) => file.id === newFileId);
    if (fileInfo?.operation_type === FileOperationType.ArchitectureDrawing) {
      setFileViewStep(fileInfo.status === FileStatus.Completed ? FileViewStep.Second : FileViewStep.IndexSummary);
    } else if (fileInfo?.operation_type === FileOperationType.Quote) {
      setFileViewStep(FileViewStep.Second);
    }
  }

  const handleNext = async (buttonInfo: { text: string }) => {
    if (buttonInfo.text === ButtonText.NextFile) {
      let filterFiles = fileList.filter(
        (file: any) => file.id !== selectedFileId,
      );
      let nextFile = filterFiles.find(
        (file: any) => file.status !== FileStatus.Completed,
      );
      if (nextFile) {
        // 切换下一个文件时，先判断是否有未保存的crop
        const unsaved = await drawingLabelRef?.current?.getUnsavedCrops();
        if (!drawingLabelRef?.current || unsaved) {
          // 没有未保存的crop，切换文件
          handleFileStatus(selectedFileId, nextFile.id);
        }
      }
    } else if (buttonInfo.text === ButtonText.Analysis) {
      // 调用手动分析接口
      drawingIndexRef?.current?.recognizeDrawingIndexData();
    } else if (buttonInfo.text === ButtonText.NextStep) {
      // 跳转到完成页面
      if (fileViewStep === FileViewStep.IndexSummary) {
        setFileViewStep(FileViewStep.Second);
      }
    } else if (buttonInfo.text === ButtonText.FileMerge) {
      // 切换到合并页面的时候，判断是否有未保存的crop
      const unsaved = await drawingLabelRef?.current?.getUnsavedCrops();
      if (!drawingLabelRef?.current || unsaved) {
        // 先将当前文件状态标记为 Completed
        setFileList((prev: any[]) => {
          return prev.map((file: any) => {
            if (file.id === selectedFileId) {
              return { ...file, status: FileStatus.Completed };
            }
            return file;
          });
        });

        buildingStep.current = BuildLoadingStep.PageMerge;
        setBuildLoading(true);
        setTimeout(() => {
          setBuildLoading(false);
          setFileViewStep(FileViewStep.FileMerge);
        }, 5000);
      }
    } else if (buttonInfo.text === ButtonText.CreateTakeoff) {
      buildingStep.current = BuildLoadingStep.PageTakeOff;
      setBuildLoading(true);
      setTimeout(() => {
        setBuildLoading(false);
      }, 5000);
    }
  }

  // 处理返回按钮的点击事件
  const handleBack = useCallback(() => {
    if (fileOperationType === FileOperationType.ArchitectureDrawing) {
      if (fileViewStep === FileViewStep.Second) {
        setFileViewStep(FileViewStep.IndexSummary);
        setShowContentView(true);
      } else if (fileViewStep === FileViewStep.IndexDrawing) {
        setFileViewStep(FileViewStep.IndexSummary);
        setShowContentView(true);
      } else {
        router.push(`/home`);
      }
    } else {
      router.push(`/home`);
    }
  }, [fileViewStep, selectedFileId]);


  // 右上角按钮的相关信息
  const nextButtonInfo = useMemo(() => {
    const hasMultipleFiles = fileList.length > 1;
    const allFilesCompleted = fileList.every((file: any) => file.status === FileStatus.Completed);
    const otherFilesComplete = fileList
      .filter((file: any) => file.id !== selectedFileId)
      .every((file: any) => file.status === FileStatus.Completed);
    const hasUnsavedCrops = indexBox.indexBoxList.length === 0 && indexBox.labelList.length === 0;

    // FileMerge 步骤：显示 Create Takeoff
    if (fileViewStep === FileViewStep.FileMerge) {
      return {
        text: ButtonText.CreateTakeoff,
        disabled: false,
      };
    }

    // IndexDrawing 步骤：公共逻辑
    if (fileViewStep === FileViewStep.IndexDrawing) {
      return {
        text: ButtonText.Analysis,
        disabled: hasUnsavedCrops,
      };
    }

    // IndexSummary 步骤：公共逻辑
    if (fileViewStep === FileViewStep.IndexSummary) {
      return {
        text: ButtonText.NextStep,
        disabled: false,
      };
    }

    // Second 步骤：根据文件数量区分逻辑
    if (fileViewStep === FileViewStep.Second) {
      if (hasMultipleFiles) {
        // 关键逻辑：如果其他文件都已完成（无论当前文件状态如何），则进入合并步骤
        if (otherFilesComplete) {
          return {
            text: ButtonText.FileMerge, // 进入 File Merge
            disabled: false,
          };
        } else {
          // 还有其他未完成的文件
          return {
            text: ButtonText.NextFile,
            disabled: false,
          };
        }
      } else {
        // 单个文件完成
        return {
          text: ButtonText.CreateTakeoff,
          disabled: false,
        };
      }
    }

    return { text: ButtonText.NextStep, disabled: false };
  }, [fileList, selectedFileId, fileViewStep, indexBox]);


  const fileOperationType = useMemo(() => {
    if (!fileList.length) return "";
    let file = fileList.find((file: any) => file.id === selectedFileId);
    return file.operation_type || "";
  }, [fileList, selectedFileId]);

  return (
    <div
      className={`w-full flex flex-col relative h-[100vh]`}
    >
      <Header
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
        {
          fileOperationType === FileOperationType.ArchitectureDrawing
          && (fileViewStep === FileViewStep.IndexDrawing || fileViewStep === FileViewStep.IndexSummary)
          &&
          <DrawingIndex
            ref={drawingIndexRef}
            fileList={fileList}
            setFileList={setFileList}
            selectedFileId={selectedFileId}
            onChangeIndexBox={(indexBoxList, labelList) => setIndexBox({ indexBoxList, labelList })}
            showContentView={showContentView}
            setShowContentView={setShowContentView}
          >
          </DrawingIndex>
        }
        {fileViewStep === FileViewStep.Second &&
          <DrawingLabel
            ref={drawingLabelRef}
            fileList={fileList}
            setFileList={setFileList}
            selectedFileId={selectedFileId}
            setSelectedFileId={setSelectedFileId}
            setShowAnalysisModal={setShowAnalysisModal}
            boxTypeList={boxTypeList}
            onRefreshBoxTypeList={getBoxTypeList}
          >
          </DrawingLabel>
        }
        {fileViewStep === FileViewStep.FileMerge &&
          <ManualMerge></ManualMerge>
        }
      </div>
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
      {buildLoading && (
        <BuildingBackground step={buildingStep.current} />
      )}
      {showAnalysisModal && (
        <PreAnalysisMdal
          isOpen={showAnalysisModal}
          closeModal={() => setShowAnalysisModal(false)}
          handleAnalysis={() => {
            setShowAnalysisModal(false);
          }}
        ></PreAnalysisMdal>
      )}
    </div>
  );
};

export default PageLabeling;
