"use client";

import { Button } from "antd";

interface FileHeaderProps {
  files: Array<{ id: string | number; file_name?: string }>;
  fileId: string;
  onSwitchFile: (fileId: string) => void;
  onCreateMergeResult: () => void;
}

export default function FileHeader({
  files,
  fileId,
  onSwitchFile,
  onCreateMergeResult,
}: FileHeaderProps) {
  return (
    <header className="flex h-[110px] shrink-0 items-center justify-between border-b border-primaryN30 bg-white px-10">
      <div className="flex items-center gap-3">
        {files.map((file) => (
          <button
            key={file.id}
            type="button"
            className={`flex h-[50px] min-w-[140px] flex-col items-start justify-center rounded-lg px-4 text-left transition-all ${String(file.id) === fileId ? "bg-primaryN30" : "border border-primaryN30"
              }`}
            onClick={() => onSwitchFile(String(file.id))}
          >
            <span className="max-w-[180px] truncate text-sm text-grey-dark">
              {file.file_name || `File ${file.id}`}
            </span>
          </button>
        ))}
      </div>
      <Button type="primary" className="custom-primary-btn !w-[150px]" onClick={onCreateMergeResult}>
        Create Merge Result
      </Button>
    </header>
  );
}
