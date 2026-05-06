"use client";

import { Button } from "antd";
import TakeoffFileWorkflowNav from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/workflow/TakeoffFileWorkflowNav";

interface FileHeaderProps {
  files: Array<{ id: string | number; file_name?: string; operation_type?: string }>;
  fileId: string;
  projectId: string;
  takeoffId: string;
  onSwitchFile: (fileId: string) => void;
  onCreateMergeResult: () => void;
}

export default function FileHeader({
  files,
  fileId,
  projectId,
  takeoffId,
  onSwitchFile,
  onCreateMergeResult,
}: FileHeaderProps) {
  return (
    <header className="flex h-[162px] shrink-0 items-start justify-between border-b border-primaryN30 bg-white px-10 pt-4">
      <TakeoffFileWorkflowNav
        className="flex-1"
        files={files}
        selectedFileId={fileId}
        onSelectFile={onSwitchFile}
        currentStep="final-items"
        projectId={projectId}
        takeoffId={takeoffId}
      />
      <Button type="primary" className="custom-primary-btn !w-[150px]" onClick={onCreateMergeResult}>
        Create Merge Result
      </Button>
    </header>
  );
}
