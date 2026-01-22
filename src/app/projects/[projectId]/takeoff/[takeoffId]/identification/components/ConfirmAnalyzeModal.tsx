import Button from "@/components/Button";
import { Modal } from "antd";

type ConfirmAnalyzeModalProps = {
  onConfirm: any;
  isOpen: boolean;
  setIsOpen: any;
};

const ConfirmAnalyzeModal = ({
  onConfirm,
  isOpen,
  setIsOpen,
}: ConfirmAnalyzeModalProps) => {
  return (
    <Modal
      width={460}
      centered
      footer={
        <div className="flex w-full justify-end gap-3">
          <Button
            variant="outline"
            borderColor="dragonOrange"
            onClick={() => setIsOpen(false)}
            className="!py-0"
          >
            Back
          </Button>
          <Button
            backgroundColor="forumBlue"
            color="white"
            onClick={onConfirm}
            className="!py-0"
          >
            Analyze
          </Button>
        </div>
      }
      open={isOpen}
      onCancel={() => setIsOpen(false)}
    >
      <div className="flex flex-col gap-2 px-11 py-7">
        <p className="text-forumBlue mb-2 text-base font-normal">
          Are you ready to Analyze these files?
        </p>
        <p className="font-light text-xs">
          CATO will analyze all uploaded files to build your Takeoff List.
        </p>
        <p className="font-light text-xs w-10/12">
          Ensure you have boxed all items and tables before proceeding.
        </p>
      </div>
    </Modal>
  );
};

export default ConfirmAnalyzeModal;
