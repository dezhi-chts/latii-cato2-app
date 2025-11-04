import Button from "@/components/Button";
import { Modal, Spin } from "antd";

export type DeleteModalProps = {
  isOpen: boolean;
  isDeleting: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  onSuccess: () => void;
  title: string;
  description: string;
};

const DeleteModal = ({
  isOpen,
  isDeleting,
  setIsOpen,
  onSuccess,
  title,
  description,
}: DeleteModalProps) => {
  return (
    <Modal
      open={isOpen}
      onCancel={() => {
        if (setIsOpen) setIsOpen(false);
      }}
      width={290}
      footer={null}
      closeIcon={null}
    >
      <div className="flex flex-col gap-4 px-4 justify-center items-center text-sm">
        <p className="font-bold">{title}</p>
        <p className="text-center">{description}</p>
        <div className="flex gap-2.5 justify-center">
          <Button
            variant="outline"
            onClick={() => {
              if (setIsOpen) setIsOpen(false);
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            backgroundColor="dragonOrange"
            onClick={onSuccess}
            disabled={isDeleting}
          >
            {isDeleting ? <Spin size="small" /> : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteModal;
