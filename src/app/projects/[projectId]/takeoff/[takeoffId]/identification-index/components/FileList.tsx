"use client";
import { Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { CloseOutlined } from "@ant-design/icons";
import Image from "next/image";
import { FileStatus } from "../../types/evidence";

interface File {
  id: string;
  name: string;
  status: FileStatus;
}

type FilePanelProps = {
  file: File;
  handleRemove?: (id: string) => void;
  canBeRemoved?: boolean;
  textClassName?: string;
  isSelected?: boolean;
  fileContainerStyle?: React.CSSProperties;
  showBorder?: boolean;
  flexRow?: boolean;
  switchBgColor?: boolean; // 选中时，是否切换背景颜色
  switchTextColor?: boolean; // 选中时，是否切换文字颜色
};

export const FilePanel = ({
  file,
  handleRemove,
  canBeRemoved = false,
  isSelected = false,
  fileContainerStyle = {},
  showBorder = true,
  flexRow = true,
  switchBgColor = true, // 选中时，是否切换背景颜色
  switchTextColor = false, // 选中时，是否切换文字颜色
}: FilePanelProps) => {
  const imageSize = flexRow ? { width: 18, height: 21 } : { width: 25, height: 30 };
  return (
    <div
      className={`relative w-32 h-20 rounded flex ${flexRow ? 'flex-row' : 'flex-col'}  items-center justify-center p-1 ${isSelected && switchBgColor ? "bg-baseLightHover" : ''} ${showBorder ? 'border border-baseLightHover' : ''}`}
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
        width={imageSize.width}
        height={imageSize.height}
      />
      <div
        className={`${flexRow ? 'px-2' : 'pt-3'} break-all line-clamp-2 text-center text-[8px] ${isSelected && switchTextColor ? 'text-forumBlue' : 'text-basicGray'} `}
      >
        {file.name}
      </div>
    </div>
  );
};

export const FileItem = ({
  selectedFileId,
  file,
  fileContainerStyle = {},
  handleClickFile,
  showStatus = false,
  showBorder = true,
}: any) => {
  const statusMapInfo: any = {
    [FileStatus.Completed]: {
      text: "Completed",
      bgColor: "bg-[#D9F2E7]",
      textColor: "text-[#02A960]",
    },
    [FileStatus.Processing]: {
      text: "Progress",
      bgColor: "bg-[#C4D6F0]",
      textColor: "text-forumBlue",
    },
    'default': {
      text: "Not Applicable",
      bgColor: "bg-[#DCDCDC]",
      textColor: "text-basicGray",
    }
  };
  const statusInfo = statusMapInfo[file.status] || statusMapInfo[FileStatus.Processing];
  return (
    <div
      className={`rounded cursor-pointer`}
      onClick={() => handleClickFile(file)}
    >
      <FilePanel
        file={file}
        canBeRemoved={false}
        isSelected={selectedFileId === file.id}
        fileContainerStyle={fileContainerStyle}

      />
      {showStatus && (
        <div
          className={`my-2 h-[16px] flex items-center`}
        >
          <div className={`px-2 text-xxs rounded-md ${statusInfo.bgColor} ${statusInfo.textColor}`}>
            {statusInfo.text}
          </div>

        </div>
      )}
    </div>
  );
};
