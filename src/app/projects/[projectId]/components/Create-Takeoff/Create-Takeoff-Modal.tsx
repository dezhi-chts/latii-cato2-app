import { Modal, UploadFile, Button } from "antd";
import { CatoUploadFile } from "@/services/filesService";
import { useState } from "react";
import Image from "next/image";
import TakeoffUpload from "./Takeoff-Upload";

type CreateTakeOffModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  handleCreateTakeOff: (
    files: UploadFile[],
    filesInfo: CatoUploadFile[]
  ) => Promise<void>;
};

export type TakeOffType = "base" | "deep";
const CreateTakeOffModal = ({
  isOpen,
  setIsOpen,
  handleCreateTakeOff,
}: CreateTakeOffModalProps) => {
  const [takeOffFiles, setTakeOffFiles] = useState<UploadFile[]>([]);
  const [filesInfo, setFilesInfo] = useState<CatoUploadFile[]>([]);

  const handleStartClick = () => {
    setIsOpen(false);
    handleCreateTakeOff(takeOffFiles, filesInfo);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={() => setIsOpen(false)}
      title={
        <div className="py-4 flex flex-col gap-2">
          <div className="text-forumBlue text-lg">Create a Quotii</div>
          <div className="text-sm text-basicGray">Use our AI Agent to create your quote, save time and prevent errors.</div>
          <div className="mt-4 text-xs">Name <span>工程名</span></div>
        </div>
      }
      closable={false}
      width={1130}
      footer={null}
      centered
    >
      <div className="mt-8 p-2 flex flex-row justify-between">
        <div className="p-4 w-[300px] flex flex-col border-2 border-baseLightGray rounded-lg">
          <div className="w-full h-[100px] overflow-hidden border border-primaryN30 rounded">
            <Image
              src="/assets/cato-images/architectural-drawings-new.png"
              alt="Architectural"
              width={250} height={100}
              style={{ width: '100%', height: 'auto' }}
            ></Image>
          </div>
          <div className="text-forumBlue my-4 text-lg">Blank Template</div>
          <div className="text-sm text-basicGray">Create a blank Quotii from zero.</div>
          <div className="mt-1 text-xs text-basicGray">We recommend you use this for small projects.</div>
          <div className="flex-1 flex items-end justify-center">
            <Button
              onClick={() => { }}
              className="w-full mt-4 mb-4 bg-[#ECF2FA]"
            >
              Create
            </Button>
          </div>
        </div>
        <div></div>
        <div className="p-4 w-[720px] flex flex-col border-2 border-baseLightGray rounded-lg">
          <TakeoffUpload
            showUploadTipLink={false}
            onHandleUpload={({ archFiles, quoteFiles }) => {
              setTakeOffFiles([...archFiles, ...quoteFiles]);
            }} />
        </div>

      </div>
    </Modal>
  );
};

export default CreateTakeOffModal;
