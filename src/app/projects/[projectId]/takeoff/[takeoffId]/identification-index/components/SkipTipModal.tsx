import { Modal, Button } from 'antd';
const SkipTipModal = ({
  isOpen,
  closeModal,
  handleSkip,
}: any) => {
  return (
    <Modal
      open={isOpen}
      onCancel={closeModal}
      title={null}
      closable={false}
      centered={true}
      width={'auto'}
      footer={null}
    >
      <div className='w-[320px]  flex flex-col gap-y-4 font-nunito'>
        <div className='text-sm text-forumBlue'>Skip Page Index Step</div>
        <div className='text-sm'>Are you sure you want to skip this step for this file?</div>
        <div className='flex justify-end gap-x-2'>
          <Button className='custom-default-btn' onClick={closeModal}>Cancel</Button>
          <Button
            className='custom-default-btn !bg-[#FF931D] !text-white'
            onClick={handleSkip}>Skip</Button>
        </div>
      </div>
    </Modal>
  );
};

export default SkipTipModal;