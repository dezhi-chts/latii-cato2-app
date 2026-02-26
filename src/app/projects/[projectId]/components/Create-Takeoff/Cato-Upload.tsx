"use client";
import { Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { CloseOutlined } from "@ant-design/icons";
import Image from "next/image";

type CatoUploadProps = {
  files: UploadFile<any>[];
  setFiles: (files: UploadFile<any>[]) => void;
};

export const CatoUpload = ({ files, setFiles }: CatoUploadProps) => {
  const maxFileLimit = 2;

  const handleRemove = (uid: string) => {
    const newFiles = files.filter((file) => file.uid !== uid);
    setFiles(newFiles);
  };

  return (
    <div className="w-full flex justify-center gap-4 rounded border border-dashed border-primaryN50 px-2 h-24 items-center">
      {files.map((file: UploadFile) => (
        <div key={file.uid}>
          <FilePanel
            file={file}
            handleRemove={handleRemove}
            canBeRemoved={true}
          />
        </div>
      ))}

      {files.length < maxFileLimit && (
        <div className="flex w-full flex-col justify-center items-center gap-2 text-xs">
          <Upload
            accept=".pdf"
            fileList={files}
            maxCount={maxFileLimit}
            onChange={({ fileList }) => setFiles(fileList)}
            showUploadList={false}
          >
            <p className="text-forumBlue-normal underline cursor-pointer hover:opacity-80 active:opacity-60">
              Upload
            </p>
          </Upload>
          <p className="text-grey-normal">
            Up to {maxFileLimit} files. Only PDF format is accepted.
          </p>
        </div>
      )}
    </div>
  );
};

type FilePanelProps = {
  file: UploadFile;
  handleRemove?: (uid: string) => void;
  canBeRemoved?: boolean;
  textClassName?: string;
  isSelected?: boolean;
};

export const FilePanel = ({
  file,
  handleRemove,
  canBeRemoved = false,
  textClassName,
  isSelected = false,
}: FilePanelProps) => {
  return (
    <div
      key={file.uid}
      className={`relative w-32 h-20 rounded flex flex-col items-center justify-center p-1 ${
        !isSelected && "border border-primaryN50"
      }`}
    >
      {canBeRemoved && handleRemove && (
        <button
          onClick={() => handleRemove(file.uid)}
          className="absolute top-0 right-1 text-gray-400 hover:text-red-500"
        >
          <CloseOutlined />
        </button>
      )}
      <Image
        src="/assets/icons/extensions/pdf.svg"
        alt="file pdf icon"
        width={20}
        height={20}
        className="w-auto h-auto"
      />
      <p
        className={`${textClassName} text-center text-[7px] px-1 text-elusionDarkGrayTint line-clamp-2 max-w-full`}
      >
        {file.name}
      </p>
    </div>
  );
};
