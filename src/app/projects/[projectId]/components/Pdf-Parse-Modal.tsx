import { Modal, Button } from 'antd';
import PdfParse from '../takeoff/[takeoffId]/components/pdf/PdfParse';
const PdfParseModal = ({
  isOpen,
  closeModal,
  data,
  handleNext,
  handleCancel
}: any) => {
  return (
    <Modal
      open={isOpen}
      onCancel={closeModal}
      title={null}
      closable={false}
      centered={true}
      width={'50vw'}
      footer={null}
      maskClosable={false}
    >
      <div className='h-[80vh]'>
        <PdfParse data={data} handleNext={handleNext} handleCancel={handleCancel} />
      </div>
    </Modal>
  );
};

export default PdfParseModal;