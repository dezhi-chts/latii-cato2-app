import { Modal } from "antd";

const LogoutModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}> = ({ open, onClose, onLogout }) => {
  const handleOk = () => {
    onLogout();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      title="Logging Out"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Yes"
      cancelText="No"
    >
      <p>Are you sure you want to log out? You will need to sign in again.</p>
    </Modal>
  );
};

export default LogoutModal;
