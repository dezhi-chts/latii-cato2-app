"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import IdentificationIndex, { ButtonText } from "./identification-index/page";
import { FileOperationType, FileStatus } from "./types/evidence";
import { notification } from "antd";
import { getTakeOffById } from "@/services/takeOffService";
import { useParams, useRouter } from "next/navigation";
import PageLabeling from "./identification/page";

export type StepName =
  | "identification-index"
  | "page-labeling"
  | "pre-analysis";

const initialSteps: StepName[] = [
  "identification-index",
  "page-labeling",
  "pre-analysis",
];

const Quotii = () => {
  //Setup and Param Hooks
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;

  //States
  const [selectedFileId, setSelectedFileId] = useState<number>(-1);
  const [fileList, setFileList] = useState<any[]>([]);
  const steps: StepName[] = initialSteps;
  const [activeIndex, setActiveIndex] = useState(0);

  //Effects
  useEffect(() => {
    getTakeOffDetails();
  }, [takeOffId]);

  // Functions
  const getTakeOffDetails = async () => {
    const response = await getTakeOffById(takeOffId as string);
    if (response.status === "success") {
      const project_files = response?.data?.project_files ?? [];
      if (project_files?.length > 0) {
        setFileList(project_files);
        setSelectedFileId(project_files[0].id);
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
  };

  const handleNext = () => {
    setActiveIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const handleBack = () => {
    if (activeIndex === 0) {
      router.push(`/projects/${projectId}`);
      return;
    }
    setActiveIndex((i) => Math.max(i - 1, 0));
  };

  const nextButtonInfo = useMemo(() => {
    const currentFile = fileList.find(
      (file: any) => file.id === selectedFileId,
    );

    let buttonText = "";
    let buttonDisabled = false;

    if (currentFile?.status === FileStatus.Processing) {
      buttonText = ButtonText.RestartIndex;
    } else if (currentFile?.status === FileStatus.Completed) {
      const hasUnprocessedFiles = fileList.some(
        (file: any) =>
          file.operation_type !== FileOperationType.Quote &&
          (file.status === FileStatus.Processing ||
            file.status === FileStatus.Uploaded),
      );
      if (hasUnprocessedFiles) {
        buttonText = ButtonText.NextFile;
      } else {
        buttonText = ButtonText.Complete;
      }
    }

    return {
      text: buttonText,
      disabled: buttonDisabled,
    };
  }, [fileList, selectedFileId]);

  return (
    <div className="w-full h-[100vh]">
      <Header
        activeIndex={activeIndex}
        steps={steps}
        fileList={fileList}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
        nextButtonInfo={nextButtonInfo}
        handleNext={handleNext}
        handleBack={handleBack}
      />
      <div className="relative h-[90vh]">
        <div className={activeIndex === 0 ? "block h-full" : "hidden"}>
          <IdentificationIndex showHeader={false} />
        </div>

        <div className={activeIndex === 1 ? "block h-full" : "hidden"}>
          <PageLabeling showHeader={false} />
        </div>
      </div>
    </div>
  );
};

export default Quotii;
