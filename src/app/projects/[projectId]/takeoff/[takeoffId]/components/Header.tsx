"use client";
import { UploadFile } from "antd";
import Image from "next/image";
import { JSX, useMemo } from "react";
import { Button } from "antd";
import { FileOperationType, FileStatus } from "../types/evidence";
import { StepName } from "../page";

type StepState = "active" | "inactive" | "completed";

const FileItem = () => {
  return <div></div>
};

const PageIndexStepActive = () => {
  return <div>Identification Index</div>
}

const PageIndexStepInActive = () => {
  return <div>Identification Index</div>
}

const PageIndexStepCompleted = () => {
  return <div>Identification Index</div>
}

const PageLabelingStepActive = () => {
  return <div> Page Labeling</div>
}

const PageLabelingStepInActive = () => {
  return <div> Page Labeling</div>
}

const PageLabelingStepCompleted = () => {
  return <div> Page Labeling</div>
}

const PagePreAnalysisStepActive = () => {
  return <div>Pre-Analysis</div>
}

const PagePreAnalysisStepInActive = () => {
  return <div>Pre-Analysis</div>
}

const PagePreAnalysisStepCompleted = () => {
  return <div>Pre-Analysis</div>
}

const PageAnalysisStepInActive = () => {
  return <div>Analysis</div>
}



const stepComponents: Record<
  StepName,
  Partial<Record<StepState, JSX.Element>>
> = {
  "identification-index": {
    active: <PageIndexStepActive />,
    inactive: <PageIndexStepInActive />,
    completed: <PageIndexStepCompleted />,
  },
  "page-labeling": {
    active: <PageLabelingStepActive />,
    inactive: <PageLabelingStepInActive />,
    completed: <PageLabelingStepCompleted />,
  },
  "pre-analysis": {
    active: <PagePreAnalysisStepActive />,
    inactive: <PageAnalysisStepInActive />,
    completed: <PagePreAnalysisStepCompleted />,
  },
};

const Header = ({
  steps,
  activeIndex,
  fileList,
  selectedFileId,
  setSelectedFileId,
  nextButtonInfo,
  handleNext,
  handleBack,
}: any) => {
  const filesData = useMemo(() => {
    if (!fileList) return [];
    return fileList ?? [];
  }, [fileList]);

  const handleClickFile = async (file: any) => {
    if (selectedFileId === file.id) return;

    if (file.operation_type === FileOperationType.Quote) return;

    setSelectedFileId(file.id);
  };

  const renderStep = (step: StepName) => {
    const stepIndex = steps.indexOf(step);
    const state = getStepState(stepIndex, activeIndex);

    return stepComponents[step][state] ?? stepComponents[step].active ?? null;
  };

  const getStepState = (stepIndex: number, activeIndex: number): StepState => {
    if (stepIndex === activeIndex) return "active";
    if (stepIndex < activeIndex) return "completed";
    return "inactive";
  };

  return (
    <div className="px-14 w-full h-[110px] border-b border-primaryN30">
      <div className="h-full flex flex-row justify-between items-center">
        <div className="cursor-pointer" onClick={handleBack}>
          <Image
            src="/assets/icons/arrow-back.svg"
            alt="logo"
            width={12}
            height={8}
          />
        </div>
        <div className="ml-10 h-full flex-1 flex flex-row gap-4 items-center">
          {renderStep("identification-index")}

          <div className="ml-4 mr-14 flex gap-4">
            {filesData?.map((file: any, index: number) => {
              const uploadFile: UploadFile = {
                uid: file.id,
                name: file.file_name,
                status:
                  file.operation_type === FileOperationType.Quote
                    ? FileStatus.NotApplicable
                    : file.status || FileStatus.Processing,
                url: file?.parse_detail?.uploaded_file_url,
                type: "application/pdf",
                size: 0,
              };
              return (
                <FileItem
                  key={file.id}
                  file={uploadFile}
                  selectedFileId={selectedFileId}
                  handleClickFile={handleClickFile}
                  showStatus={true}
                  fileContainerStyle={{
                    width: "130px",
                    height: "30px",
                  }}
                />
              );
            })}
          </div>
          {renderStep("page-labeling")}
          {renderStep("pre-analysis")}
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
