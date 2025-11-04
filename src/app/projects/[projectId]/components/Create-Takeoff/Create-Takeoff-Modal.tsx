import { Modal, UploadFile } from "antd";
import { CatoUploadFile } from "@/services/filesService";
import { useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { TakeOffCard } from "./Card";
import { SchedulesModal } from "./Schedules-Modal";

type CreateTakeOffModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setLoadingCato: (loadingCato: boolean) => void;
  handleCreateTakeOff: (
    files: UploadFile[],
    filesInfo: CatoUploadFile[]
  ) => Promise<void>;
};

export type TakeOffType = "base" | "deep";
const CreateTakeOffModal = ({
  isOpen,
  setIsOpen,
  setLoadingCato,
  handleCreateTakeOff,
}: CreateTakeOffModalProps) => {
  const [takeOffFiles, setTakeOffFiles] = useState<UploadFile[]>([]);
  const [filesInfo, setFilesInfo] = useState<CatoUploadFile[]>([]);

  const handleStartClick = () => {
    setIsOpen(false);
    setLoadingCato(true);
    handleCreateTakeOff(takeOffFiles, filesInfo);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={() => setIsOpen(false)}
      title={<Header selectedTakeOff={"base"} />}
      width={1100}
      footer={
        <Footer
          handleClick={handleStartClick}
          disabled={takeOffFiles.length === 0}
        />
      }
      centered
      closeIcon={null}
    >
      <div className="w-full flex gap-10 mb-10 justify-center">
        <TakeOffCard
          files={takeOffFiles}
          setFiles={(files) => setTakeOffFiles(files)}
          filesInfo={filesInfo}
          setFilesInfo={(filesInfo: CatoUploadFile[]) =>
            setFilesInfo(filesInfo)
          }
          InfoModal={SchedulesModal}
          imageUrl="/assets/cato-images/schedules-tables.png"
          title="Schedules & Tables"
          description="Single window and door schedules or tables from architectural drawing set. File with max of 10 pages for optimal results."
        />
      </div>
    </Modal>
  );
};

export default CreateTakeOffModal;
