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
import PreAnalysisMdal from "./components/PreAnalysisMdal";
import IdentIndex from "../identification-index/page";
import IdentSummary from "../identification-summary/page";
import IdentLabel from "../identification-label/page";
import ManualMerge from "../manual-merge/page";
import { useTakeoff, TakeoffProvider, FileViewStep } from "@/context/TakeoffContext";


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
  const [boxTypeList, setBoxTypeList] = useState<any>([]);
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
  } = useTakeoff();

  const drawingIndexRef = useRef<any>(null);
  const drawingSummaryRef = useRef<any>(null);
  const drawingLabelRef = useRef<any>(null);
  const buildingStep = useRef('');

  useEffect(() => {
    if (takeOffId && company_id) {
      getTakeOffDetails();
      getBoxTypeList();
    }
  }, [takeOffId, company_id]);


  useEffect(() => {
    if (fileViewStep === FileViewStep.Second) {
      // 如果切换到second view界面，且此时boxTypeList为空，则需要重新获取box type list
      if (boxTypeList?.length === 0) {
        getBoxTypeList();
      }
    }
  }, [fileViewStep]);

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
          setSelectedFileId(-1);
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
    if (fileViewStep === FileViewStep.IndexDrawing) {
      // 如果是index视图，则返回到summary视图
      setFileViewStep(FileViewStep.IndexSummary);
    } else if (fileViewStep === FileViewStep.Second) {
      if (fileOperationType === FileOperationType.ArchitectureDrawing) {
        // 如果是label视图，则返回到summary视图
        setFileViewStep(FileViewStep.IndexSummary);
      } else {
        // 判断当前文件的前面是否存在其他文件，如果存在其他文件，则切换到其他文件
        // 如果文件是已完成状态，则切换到label视图，如果是Arch Drawing文件，且未完成状态，则切换到summary视图
        let findIndex = fileList.findIndex((file: any) => file.id === selectedFileId);
        if (findIndex > 0) {
          let prevFile = fileList[findIndex - 1];
          if (prevFile.status === FileStatus.Completed) {
            setSelectedFileId(prevFile.id);
            setFileViewStep(FileViewStep.Second);
          } else if (prevFile.operation_type === FileOperationType.ArchitectureDrawing) {
            setSelectedFileId(prevFile.id);
            setFileViewStep(FileViewStep.IndexSummary);
          }
          // 更新文件状态为processing
          setFileList((prev: any[]) => {
            return prev.map((file: any) => {
              if (file.id === prevFile.id) {
                // 下一个文件状态更改为操作中
                return { ...file, status: FileStatus.Processing };
              } else if (file.id === selectedFileId) {
                // 上一个文件状态更改为未完成
                return { ...file, status: FileStatus.Uploaded };
              }
              return file;
            });
          });
        } else {
          // 如果前面没有文件可以返回了，则直接执行goBack
          router.back();
        }
      }
    } else if (fileViewStep === FileViewStep.FileMerge) {
      // 如果是合并视图，返回的时候，返回最后一个文件
      let lastFile = fileList[fileList.length - 1];
      setSelectedFileId(lastFile.id);
      setFileViewStep(lastFile.status === FileStatus.Completed ? FileViewStep.Second : FileViewStep.IndexSummary);
      // 更新文件状态为processing
      setFileList((prev: any[]) => {
        return prev.map((file: any) => {
          if (file.id === lastFile.id) {
            return { ...file, status: FileStatus.Processing };
          }
          return file;
        });
      });
    } else {
      // 其他情况执行 goBack
      router.back();
    }
  }, [fileViewStep, selectedFileId]);


  // 右上角按钮的相关信息
  const nextButtonInfo = useMemo(() => {
    const hasMultipleFiles = fileList.length > 1;
    const allFilesCompleted = fileList.every((file: any) => file.status === FileStatus.Completed);
    const otherFilesComplete = fileList
      .filter((file: any) => file.id !== selectedFileId)
      .every((file: any) => file.status === FileStatus.Completed);
    const hasUnsavedCrops = indexBoxCount === 0;

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
  }, [fileList, selectedFileId, fileViewStep, indexBoxCount]);


  const fileOperationType = useMemo(() => {
    if (!fileList.length) return "";
    let file = fileList.find((file: any) => file.id === selectedFileId);
    return file?.operation_type || "";
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
          fileViewStep === FileViewStep.IndexDrawing &&
          <IdentIndex
            ref={drawingIndexRef}
          />
        }
        {
          fileViewStep === FileViewStep.IndexSummary &&
          <IdentSummary
            ref={drawingSummaryRef}
          />
        }
        {fileViewStep === FileViewStep.Second &&
          <IdentLabel
            ref={drawingLabelRef}
          />
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

const PageLabeling = () => {
  return <PageLabelingContent />;
};
export default PageLabeling;
