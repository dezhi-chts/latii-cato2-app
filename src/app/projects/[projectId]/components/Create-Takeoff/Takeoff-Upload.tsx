import { useEffect, useRef, useState } from "react";
import type { UploadFile } from "antd/es/upload/interface";
import Image from "next/image";
import { Button, Upload, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

export type FilePanelProps = {
  file: UploadFile;
  handleRemove?: (uid: string) => void;
  canBeRemoved?: boolean;
  textClassName?: string;
  isSelected?: boolean;
};

export type UploadBoxProps = {
  files: UploadFile[];
  setFiles: (files: UploadFile[]) => void;
  onChangeHinegeStatus?: (value: "1" | "2") => void;
};

type TakeoffUploadProps = {
  showUploadTipLink?: boolean; // 是否显示上传提示链接
  onHandleUpload?: (data: {
    archFiles: UploadFile[],
    quoteFiles: UploadFile[],
    arcHingeMode?: "1" | "2",
    quoteHingeMode?: "1" | "2"
  }) => void;
};

type HingeModeProps = {
  onChangeHinegeStatus: (value: "1" | "2") => void;
};

export const UploadFileList = ({
  file,
  handleRemove,
  canBeRemoved = false,
  textClassName,
  isSelected = false,
}: FilePanelProps) => {
  return (
    <div
      key={file.uid}
      className={`relative w-32 h-24 rounded flex flex-col items-center justify-center p-1 ${!isSelected && "border border-primaryN50"
        }`}
    >
      {canBeRemoved && handleRemove && (
        <button
          onClick={() => handleRemove(file.uid)}
          className="absolute top-0 right-1 text-gray-400 hover:text-red-500"
        >
          <CloseOutlined style={{ fontSize: 12 }} />
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


export const UploadBox = ({ files, setFiles }: UploadBoxProps) => {
  const maxFileLimit = 2;

  const handleRemove = (uid: string) => {
    const newFiles = files.filter((file: UploadFile) => file.uid !== uid);
    setFiles(newFiles);
  };

  return (
    <div className="w-full flex justify-center gap-4 rounded border border-dashed border-neutralsN50 px-2 h-[120px] items-center">
      {files.map((file: UploadFile) => (
        <div key={file.uid}>
          <UploadFileList
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
            <p className="text-forumBlue underline cursor-pointer hover:opacity-80 active:opacity-60">
              Upload
            </p>
          </Upload>
          <p className="text-basicGray text-center">
            Up to 2 files. Only the PDF format is
            accepted. Maximum weight of 00MG
          </p>
        </div>
      )}
    </div>
  );
};

export const HingeMode = ({
  onChangeHinegeStatus,
}: HingeModeProps) => {
  const [hingeStatus, setHingeStatus] = useState<"1" | "2">("1");
  const handleHingeStatusChange = (value: "1" | "2") => {
    setHingeStatus(value);
  };

  useEffect(() => {
    onChangeHinegeStatus?.(hingeStatus);
  }, [hingeStatus]);

  return (
    <div className="w-full flex flex-col gap-1 ">
      <p className="mt-4 text-xs">Hinge Orientation</p>
      <p className="text-xxs text-baseGray">Select the orientation rule so Cato reads your file accurately.</p>
      <div className="flex gap-4">
        <div
          className="cursor-pointer"
          onClick={() => handleHingeStatusChange("1")}
        >
          <svg
            width="80"
            height="106"
            viewBox="0 0 62 87"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="0.5"
              y="0.5"
              width="61"
              height="86"
              rx="5.5"
              fill={hingeStatus === "1" ? "#DCDDDE" : "white"}
            />
            <rect
              x="0.5"
              y="0.5"
              width="61"
              height="86"
              rx="5.5"
              stroke="#DCDDDE"
            />
            <rect
              x="8.5"
              y="8.5"
              width="45"
              height="70"
              rx="1"
              stroke="#717171"
            />
            <rect
              x="11.5"
              y="11.5"
              width="39"
              height="64"
              rx="1"
              stroke="#717171"
            />
            <path
              d="M12 75L49.0713 44.2699C49.5537 43.87 49.5537 43.13 49.0713 42.7301L12 12"
              stroke="#B1B1B1"
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />
            <circle cx="12" cy="44" r="2" fill="#D9D9D9" />
            <rect
              x="11.5"
              y="43"
              width="10"
              height="2"
              rx="1"
              fill="#C6C6C6"
            />
          </svg>
        </div>
        <div
          className="cursor-pointer"
          onClick={() => handleHingeStatusChange("2")}
        >
          <svg
            width="80"
            height="106"
            viewBox="0 0 62 87"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="0.5"
              y="0.5"
              width="61"
              height="86"
              rx="5.5"
              fill={hingeStatus === "2" ? "#DCDDDE" : "white"}
            />
            <rect
              x="0.5"
              y="0.5"
              width="61"
              height="86"
              rx="5.5"
              stroke="#DCDDDE"
            />
            <rect
              x="8.5"
              y="8.5"
              width="45"
              height="70"
              rx="1"
              stroke="#717171"
            />
            <rect
              x="11.5"
              y="11.5"
              width="39"
              height="64"
              rx="1"
              stroke="#717171"
            />
            <path
              d="M50 12L12.9287 42.7301C12.4463 43.13 12.4463 43.87 12.9287 44.2699L50 75"
              stroke="#B1B1B1"
              strokeWidth="0.8"
              strokeDasharray="3 3"
            />
            <circle cx="12" cy="44" r="2" fill="#D9D9D9" />
            <rect
              x="11.5"
              y="43"
              width="10"
              height="2"
              rx="1"
              fill="#C6C6C6"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export const ArchitecturalUpload = ({ files, setFiles, onChangeHinegeStatus }: UploadBoxProps) => {
  return <div className="p-4 pb-16 border-2 border-baseLightGray rounded-lg">
    <div className="w-full h-[100px] overflow-hidden border border-primaryN30 rounded">
      <Image
        src="/assets/cato-images/architectural-drawings-new.png"
        alt="Architectural"
        width={250} height={100}
        style={{ width: '100%', height: 'auto' }}
      ></Image>
    </div>
    <div className="text-forumBlue my-4 text-base">Architectural Drawings</div>

    <UploadBox files={files} setFiles={setFiles} />
    {
      files.length > 0 && <HingeMode onChangeHinegeStatus={(value: "1" | "2") => {
        onChangeHinegeStatus?.(value);
      }} />
    }

  </div>;
};


export const QuoteUpload = ({ files, setFiles, onChangeHinegeStatus }: UploadBoxProps) => {
  return <div className="p-4 pb-16 border-2 border-baseLightGray rounded-lg">
    <div className="w-full h-[100px] overflow-hidden border border-primaryN30 rounded">
      <Image
        src="/assets/cato-images/product-quotes-new.png"
        alt="Quote"
        width={250} height={100}
        style={{ width: '100%', height: 'auto' }}
      ></Image>
    </div>
    <div className="text-forumBlue my-4 text-base">Quote Lists</div>
    <UploadBox files={files} setFiles={setFiles} />
    {
      files.length > 0 && <HingeMode onChangeHinegeStatus={(value: "1" | "2") => {
        onChangeHinegeStatus?.(value);
      }} />
    }
  </div>;
};


const TakeoffUpload = ({ showUploadTipLink = true, onHandleUpload }: TakeoffUploadProps) => {
  const [archFiles, setArchFiles] = useState<UploadFile[]>([]);
  const [quoteFiles, setQuoteFiles] = useState<UploadFile[]>([]);
  const arcHingeMode = useRef<"1" | "2">("1");
  const quoteHingeMode = useRef<"1" | "2">("1");

  const handleUpload = () => {
    if (archFiles.length === 0 && quoteFiles.length === 0) {
      message.warning('Please upload at least one file.');
      return;
    }
    // 如果父组件有处理上传的函数，调用它
    if (onHandleUpload) {
      onHandleUpload({ archFiles, quoteFiles, arcHingeMode: arcHingeMode.current, quoteHingeMode: quoteHingeMode.current });
    }
  }

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="grid grid-cols-2 gap-4">
        <div className="">
          <ArchitecturalUpload files={archFiles} setFiles={setArchFiles} onChangeHinegeStatus={(value: "1" | "2") => {
            arcHingeMode.current = value;
          }} />
        </div>
        <div>
          <QuoteUpload files={quoteFiles} setFiles={setQuoteFiles} onChangeHinegeStatus={(value: "1" | "2") => {
            quoteHingeMode.current = value;
          }} />
        </div>
      </div>
      {/* {showUploadTipLink && (
        <div className="mt-4 text-xs text-center text-basicGray underline cursor-pointer">Not sure what to upload?</div>
      )} */}
      <div className="flex-1 flex items-end justify-center">
        <Button type="primary" className="w-[124px] mt-4 mb-4" onClick={handleUpload}>Create</Button>
      </div>
    </div>
  );
};

export default TakeoffUpload;
