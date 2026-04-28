import { Modal, UploadFile, Button } from "antd";
import { CatoUploadFile } from "@/services/filesService";
import { useState } from "react";
import Image from "next/image";
import TakeoffUpload from "./Takeoff-Upload";

type CreateTakeOffModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onHandleUpload?: (data: {
    archFiles: UploadFile[];
    quoteFiles: UploadFile[];
    arcHingeMode?: "1" | "2";
    quoteHingeMode?: "1" | "2";
  }) => void;
};

export type TakeOffType = "base" | "deep";
const CreateTakeOffModal = ({
  isOpen,
  setIsOpen,
  onHandleUpload,
}: CreateTakeOffModalProps) => {
  const [takeOffFiles, setTakeOffFiles] = useState<UploadFile[]>([]);
  const [filesInfo, setFilesInfo] = useState<CatoUploadFile[]>([]);

  const handleUpload = (data: {
    archFiles: UploadFile[];
    quoteFiles: UploadFile[];
  }) => {
    console.log("######### handleUpload", data);
    //打开Create-Project-Takeoff-Modal弹窗
    onHandleUpload?.(data);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={() => setIsOpen(false)}
      title={
        <div className="pt-4 flex flex-col gap-2 font-nunito">
          <div className="text-forumBlue-normal text-lg">Create a Take Off</div>
          <div className="text-sm text-grey-normal">
            Use our AI Agent to create your Take Off…
          </div>
          {/* <div className="mt-4 text-xs">
            Name <span>project name</span>
          </div> */}
        </div>
      }
      closable={false}
      width={'auto'}
      footer={null}
      centered
    >
      <div className="mt-8 p-2 flex flex-row justify-between font-nunito">
        {/* <div className="p-4 w-[300px] flex flex-col border-2 border-grey-light-hover rounded-lg">
          <div className="w-full h-[100px] overflow-hidden border border-primaryN30 rounded">
            <Image
              src="/assets/cato-images/architectural-drawings-new.png"
              alt="Architectural"
              width={250}
              height={100}
              style={{ width: "100%", height: "auto" }}
            ></Image>
          </div>
          <div className="text-forumBlue-normal my-4 text-lg">
            Blank Template
          </div>
          <div className="text-sm text-grey-normal">
            Create a blank Quotii from zero.
          </div>
          <div className="mt-1 text-xs text-grey-normal">
            We recommend you use this for small projects.
          </div>
          <div className="flex-1 flex items-end justify-center">
            <Button
              onClick={() => {}}
              className="w-full mt-4 mb-4 bg-[#ECF2FA]"
            >
              Create
            </Button>
          </div>
        </div>
        <div></div> */}
        <div className="p-4 w-[720px] flex flex-col border-2 border-grey-light-hover rounded-lg">
          <TakeoffUpload
            showUploadTipLink={false}
            onHandleUpload={handleUpload}
          />
        </div>
      </div>
    </Modal>
  );
};

export default CreateTakeOffModal;
