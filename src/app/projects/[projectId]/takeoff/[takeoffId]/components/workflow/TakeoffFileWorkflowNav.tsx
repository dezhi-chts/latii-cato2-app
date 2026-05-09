"use client";

import { Tooltip } from "antd";
import { useLayoutEffect, useRef, useState } from "react";
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

function TruncatedFileName({ fileName }: { fileName: string }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const updateTruncateState = () => {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    };

    updateTruncateState();
    window.addEventListener("resize", updateTruncateState);
    return () => window.removeEventListener("resize", updateTruncateState);
  }, [fileName]);

  const content = (
    <span ref={textRef} className="max-w-[180px] truncate text-sm text-grey-dark">
      {fileName}
    </span>
  );

  return isTruncated ? (
    <Tooltip title={fileName} placement="topLeft">
      {content}
    </Tooltip>
  ) : (
    content
  );
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
          const fileName = file.file_name || `File ${file.id}`;
          return (
            <button
              key={file.id}
              type="button"
              className={`flex h-[50px] min-w-[140px] flex-col items-start justify-center rounded-lg px-4 text-left transition-all ${active ? "bg-primaryN30" : "border border-primaryN30"
                }`}
              onClick={() => onSelectFile(Number(file.id))}
            >
              <TruncatedFileName fileName={fileName} />
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
