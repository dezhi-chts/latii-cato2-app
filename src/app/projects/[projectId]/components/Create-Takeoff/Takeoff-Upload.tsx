import { useState } from "react";
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
};

type TakeoffUploadProps = {
  showUploadTipLink?: boolean; // 是否显示上传提示链接
  onHandleUpload?: (data: { archFiles: UploadFile[], quoteFiles: UploadFile[] }) => void;
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

export const ArchitecturalUpload = ({ files, setFiles }: UploadBoxProps) => {
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
  </div>;
};


export const QuoteUpload = ({ files, setFiles }: UploadBoxProps) => {
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
  </div>;
};


const TakeoffUpload = ({ showUploadTipLink = true, onHandleUpload }: TakeoffUploadProps) => {
  const [archFiles, setArchFiles] = useState<UploadFile[]>([]);
  const [quoteFiles, setQuoteFiles] = useState<UploadFile[]>([]);

  const handleUpload = () => {
    if (archFiles.length === 0 && quoteFiles.length === 0) {
      message.warning('Please upload at least one file.');
      return;
    }
    // 如果父组件有处理上传的函数，调用它
    if (onHandleUpload) {
      onHandleUpload({ archFiles, quoteFiles });
    }
  }

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="grid grid-cols-2 gap-4">
        <div className="">
          <ArchitecturalUpload files={archFiles} setFiles={setArchFiles} />
        </div>
        <div>
          <QuoteUpload files={quoteFiles} setFiles={setQuoteFiles} />
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
