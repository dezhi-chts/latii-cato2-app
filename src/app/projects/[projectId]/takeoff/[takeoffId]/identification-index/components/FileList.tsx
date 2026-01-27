"use client";
import { Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { CloseOutlined } from "@ant-design/icons";
import Image from "next/image";


type FilePanelProps = {
  file: UploadFile;
  handleRemove?: (id: string) => void;
  canBeRemoved?: boolean;
  textClassName?: string;
  isSelected?: boolean;
  fileContainerStyle?: React.CSSProperties;
};

export const FilePanel = ({
  file,
  handleRemove,
  canBeRemoved = false,
  textClassName,
  isSelected = false,
  fileContainerStyle = {},
}: FilePanelProps) => {
  return (
    <div
      className={`relative w-32 h-20 rounded flex flex-row items-center justify-center p-1 ${!isSelected ? "border border-primaryN50" : "bg-baseLightGray"}`}
      style={fileContainerStyle}
    >
      {canBeRemoved && handleRemove && (
        <button
          onClick={() => handleRemove(file.id)}
          className="absolute top-0 right-1 text-gray-400 hover:text-red-500"
        >
          <CloseOutlined />
        </button>
      )}
      <Image
        src="/assets/icons/extensions/pdf.svg"
        alt="file pdf icon"
        width={18}
        height={21}
      />
      <p
        className={`${textClassName} text-center text-[7px] px-1 text-elusionDarkGrayTint text-ellipsis line-clamp-2 whitespace-normal max-w-full`}
      >
        {file.name}
      </p>
    </div>
  );
};

export const FileItem = ({
  selectedFileId,
  file,
  fileContainerStyle = {},
  handleClickFile,
  showStatus = false,
}: any) => {
  return (
    <div
      className={`rounded cursor-pointer`}
      onClick={() => handleClickFile(file)}
    >
      <FilePanel
        file={file}
        canBeRemoved={false}
        textClassName="text-xs"
        isSelected={selectedFileId === file.id}
        fileContainerStyle={fileContainerStyle}
      />
      {
        showStatus && (
          <div className={`my-2 w-[64px] h-[16px] flex items-center justify-center text-xxs rounded-md ${file.status === 'complete' ? 'bg-[#D9F2E7]' : 'bg-forumBlueLight'}`}>
            {file.status === 'complete' ? 'Completed' : 'Progress'}
          </div>
        )
      }
    </div>
  )
}

