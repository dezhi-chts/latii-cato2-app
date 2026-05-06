"use client";

import TakeoffWorkflow, { type TakeoffWorkflowStepKey } from "./TakeoffWorkflow";

interface WorkflowFileItem {
  id: string | number;
  file_name?: string;
  operation_type?: string;
}

interface TakeoffFileWorkflowNavProps {
  files: WorkflowFileItem[];
  selectedFileId: string | number | null | undefined;
  onSelectFile: (fileId: number) => void;
  currentStep: TakeoffWorkflowStepKey;
  projectId: string;
  takeoffId: string;
  className?: string;
}

export default function TakeoffFileWorkflowNav({
  files,
  selectedFileId,
  onSelectFile,
  currentStep,
  projectId,
  takeoffId,
  className = "",
}: TakeoffFileWorkflowNavProps) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="flex h-[50px] items-center gap-3 overflow-x-auto">
        {files.map((file) => {
          const active = String(file.id) === String(selectedFileId ?? "");
          return (
            <button
              key={file.id}
              type="button"
              className={`flex h-[50px] min-w-[140px] flex-col items-start justify-center rounded-lg px-4 text-left transition-all ${active ? "bg-primaryN30" : "border border-primaryN30"
                }`}
              onClick={() => onSelectFile(String(file.id))}
            >
              <span className="max-w-[180px] truncate text-sm text-grey-dark">
                {file.file_name || `File ${file.id}`}
              </span>
              {file.operation_type && (
                <span className="mt-1 text-xs text-grey-normal">
                  {file.operation_type}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <TakeoffWorkflow
        currentStep={currentStep}
        projectId={projectId}
        takeoffId={takeoffId}
        className="mt-2"
      />
    </div>
  );
}
