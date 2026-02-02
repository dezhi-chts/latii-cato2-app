import { useEffect, useRef, useState } from "react";
import type { UploadFile } from "antd/es/upload/interface";
import Image from "next/image";
import { Button, Upload, message, Modal } from "antd";
import { CloseOutlined } from "@ant-design/icons";

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
    archFiles: UploadFile[];
    quoteFiles: UploadFile[];
    arcHingeMode?: "1" | "2";
    quoteHingeMode?: "1" | "2";
  }) => void;
};

type HingeModeProps = {
  onChangeHinegeStatus: (value: "1" | "2") => void;
};

export const UploadFileList = ({
  file,
  handleRemove,
  canBeRemoved = false,
  isSelected = false,
}: FilePanelProps) => {
  return (
    <div
      key={file.uid}
      className={`relative w-32 h-24 rounded flex flex-col items-center justify-center p-1 ${!isSelected && "border border-baseLightHover"
        }`}
    >
      {canBeRemoved && handleRemove && (
        <div
          onClick={() => handleRemove(file.uid)}
          className="w-[15px] h-[15px] rounded-full bg-primaryN20 absolute top-1 right-1 text-gray-400 hover:text-red-500 cursor-pointer flex items-center justify-center"
        >
          <CloseOutlined style={{ fontSize: 6, color: '#717171' }} />
        </div>
      )}
      <Image
        src="/assets/icons/extensions/pdf.svg"
        alt="file pdf icon"
        width={25}
        height={30}
        className="w-auto h-auto"
      />
      <p
        className={`text-center text-[9px] px-1 pt-2 text-elusionDarkGrayTint line-clamp-2 max-w-full`}
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
    <div className="w-full flex justify-center gap-4 rounded border border-dashed border-neutralsN50 px-2 h-[140px] items-center">
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
          <p className="text-baseGray text-center">
            Up to 2 files. Only the PDF format is accepted. Maximum weight of
            00MG
          </p>
        </div>
      )}
    </div>
  );
};

export const HingeMode = ({ onChangeHinegeStatus }: HingeModeProps) => {
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
      <p className="text-xxs text-baseGray">
        Select the orientation rule so Cato reads your file accurately.
      </p>
      <div className="flex gap-4">
        <div
          className={`w-[65px] h-[78px] ${hingeStatus === '1' ? 'bg-primaryN20' : ''} rounded-md cursor-pointer flex flex-col items-center justify-center`}
          onClick={() => handleHingeStatusChange("1")}
        >
          <Image src="/assets/icons/hinge-us.svg" alt="hinge mode icon" width={28} height={44}></Image>
          <p className="mt-1 text-xxs text-baseGray">US</p>
        </div>
        <div
          className={`w-[65px] h-[78px] ${hingeStatus === '2' ? 'bg-primaryN20' : ''} rounded-md cursor-pointer flex flex-col items-center justify-center`}
          onClick={() => handleHingeStatusChange("2")}
        >
          <Image src="/assets/icons/hinge-intl.svg" alt="hinge mode icon" width={28} height={44}></Image>
          <p className="mt-1 text-xxs text-baseGray">INTL</p>
        </div>
      </div>
    </div>
  );
};

export const ArchitecturalUpload = ({
  files,
  setFiles,
  onChangeHinegeStatus,
}: UploadBoxProps) => {
  return (
    <div className="p-4 pb-20 border border-baseLightHover rounded-lg">
      <div className="w-full h-[100px] overflow-hidden border border-primaryN30 rounded">
        <Image
          src="/assets/cato-images/architectural-drawings-new.png"
          alt="Architectural"
          width={250}
          height={100}
          style={{ width: "100%", height: "auto" }}
        ></Image>
      </div>
      <div className="text-forumBlue my-4 text-base">
        Architectural Drawings
      </div>

      <UploadBox files={files} setFiles={setFiles} />
      {files.length > 0 && (
        <HingeMode
          onChangeHinegeStatus={(value: "1" | "2") => {
            onChangeHinegeStatus?.(value);
          }}
        />
      )}
    </div>
  );
};

export const QuoteUpload = ({
  files,
  setFiles,
  onChangeHinegeStatus,
}: UploadBoxProps) => {
  return (
    <div className="p-4 pb-20 border border-baseLightHover rounded-lg">
      <div className="w-full h-[100px] overflow-hidden border border-primaryN30 rounded">
        <Image
          src="/assets/cato-images/product-quotes-new.png"
          alt="Quote"
          width={250}
          height={100}
          style={{ width: "100%", height: "auto" }}
        ></Image>
      </div>
      <div className="text-forumBlue my-4 text-base">Quote Lists</div>
      <UploadBox files={files} setFiles={setFiles} />
      {files.length > 0 && (
        <HingeMode
          onChangeHinegeStatus={(value: "1" | "2") => {
            onChangeHinegeStatus?.(value);
          }}
        />
      )}
    </div>
  );
};

export const ArchitecturalDrawingModal = ({
  isOpen,
  setIsOpen,
}: any) => {
  return (
    <Modal
      width={800}
      open={isOpen}
      onCancel={() => setIsOpen(false)}
      footer={null}
      centered
      closable={false}
    >
      <div className="p-4 flex flex-col gap-8 font-nunito">
        <div className="flex flex-col gap-2.5">
          <p className="text-forumBlue text-lg">Not sure what to drop?</p>
          <p className="font-light text-xs">
            To ensure accurate AI reading and faster processing, please follow these guidelines when uploading your PDFs.
          </p>
        </div>
        <div className="w-full flex gap-8">
          <Image
            src="/assets/cato-images/schedules-tables-2.png"
            alt="architectural drawings image"
            width={290}
            height={180}
            className="w-1/2 h-auto"
          />
          <div className="w-1/2 text-xs font-light flex flex-col gap-4">
            <ul className="list-disc list-inside flex flex-col gap-1">
              <li>CATO only reads PDFs, with architectural schedules and tables.</li>
              <li>
                All text must be typed and legible — no handwritten notes.
              </li>
              <li>
                Upload files in the reading Orientation of the PDF
              </li>
            </ul>
            <div>
              <p>⚠️ Important:</p>
              <ul className="list-disc list-inside">
                <li>
                  Do not place drawings or marks on top of the plans, as they may interfere with AI recognition.
                </li>
              </ul>
            </div>
            <div>
              <p>💡 Pro Tip (Preferred):</p>
              <ul className="list-disc list-inside">
                <li>
                  Remove any unnecessary pages before uploading to reduce processing time and improve quoting accuracy.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 mt-3 mb-2 w-full flex justify-end">
        <Button className="custom-default-btn" onClick={() => setIsOpen(false)}>Close</Button>
      </div>
    </Modal>
  );
};

const TakeoffUpload = ({
  showUploadTipLink = true,
  onHandleUpload,
}: TakeoffUploadProps) => {
  const [archFiles, setArchFiles] = useState<UploadFile[]>([]);
  const [quoteFiles, setQuoteFiles] = useState<UploadFile[]>([]);
  const arcHingeMode = useRef<"1" | "2">("1");
  const quoteHingeMode = useRef<"1" | "2">("1");
  const [showDrawingModal, setShowDrawingModal] = useState(false);

  const handleUpload = () => {
    if (archFiles.length === 0 && quoteFiles.length === 0) {
      message.warning("Please upload at least one file.");
      return;
    }
    // 如果父组件有处理上传的函数，调用它
    if (onHandleUpload) {
      onHandleUpload({
        archFiles,
        quoteFiles,
        arcHingeMode: arcHingeMode.current,
        quoteHingeMode: quoteHingeMode.current,
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="grid grid-cols-2 gap-4">
        <div className="">
          <ArchitecturalUpload
            files={archFiles}
            setFiles={setArchFiles}
            onChangeHinegeStatus={(value: "1" | "2") => {
              arcHingeMode.current = value;
            }}
          />
        </div>
        <div>
          <QuoteUpload
            files={quoteFiles}
            setFiles={setQuoteFiles}
            onChangeHinegeStatus={(value: "1" | "2") => {
              quoteHingeMode.current = value;
            }}
          />
        </div>
      </div>
      {showUploadTipLink && (
        <div className="mt-5 text-xs text-center text-basicGray underline cursor-pointer" onClick={() => { setShowDrawingModal(true) }}>Not sure what to upload?</div>
      )}
      <div className="flex-1 flex items-end justify-center">
        <Button
          className="mt-4 mb-4 custom-primary-btn"
          onClick={handleUpload}
        >
          Create
        </Button>
      </div>
      {showDrawingModal && (
        <ArchitecturalDrawingModal
          isOpen={showDrawingModal}
          setIsOpen={setShowDrawingModal}
        />
      )}
    </div>
  );
};

export default TakeoffUpload;
