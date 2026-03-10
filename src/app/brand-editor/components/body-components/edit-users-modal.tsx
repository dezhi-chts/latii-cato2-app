import Button from "@/components/Button";
import { Modal } from "antd";
import { useRouter } from "next/navigation";

type EditUsersModalProps = {
  open: boolean;
  onClose: () => void;
};

const EditUsersModal = ({ open, onClose }: EditUsersModalProps) => {
  const router = useRouter();
  return (
    <Modal
      open={open}
      onCancel={onClose}
      closable={false}
      centered
      width={386}
      footer={
        <div className="mt-8 flex gap-2 justify-end">
          <Button
            backgroundColor="primaryN30"
            color="black"
            className="rounded-md"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            backgroundColor="forumBlue-normal"
            className="rounded-md"
            onClick={() => router.push("/account-settings?tab=team-management")}
          >
            Confirm
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-forumBlue-normal">Create New User</p>
        <p className="text-sm">
          You are leaving this current Page. Any progress will be saved, and you
          can return to review this any time.
        </p>
      </div>
    </Modal>
  );
};

export default EditUsersModal;
