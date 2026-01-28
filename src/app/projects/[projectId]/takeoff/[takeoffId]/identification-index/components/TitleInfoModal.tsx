import { Modal, Button } from 'antd';
const TitleInfoModal = ({
  isOpen,
  closeModal
}: any) => {
  return (
    <Modal
      open={isOpen}
      onCancel={closeModal}
      title={null}
      closable={false}
      width={'800px'}
      footer={
        <div className='flex justify-end'>
          <div className='w-[76px] h-[28px] text-xs text-basicGray flex items-center justify-center bg-primaryN30 rounded-md cursor-pointer' onClick={closeModal}>Close</div>
        </div>
      }
    >
      <div className='flex flex-col'>
        <div className='flex flex-row gap-4'>
          <div className='w-[310px]'>
            <div className='text-lg text-forumBlue'>How to select a Label Example</div>
            <div className='my-4 text-xs font-light'>Add a single sheet number or page identifier inside the box you just drew.</div>
            <ul className='mb-4 list-disc ml-6 text-xs font-light'>
              <li>Select a "clean" example (e.g., click A-100 or 1.0).</li>
            </ul>
            <div className='text-xs font-light'>This teaches Cato the pattern of your numbering (e.g., "Letter-Number" vs. "Number-Only"). Once you pick one, Cato will find all similar matching text in all pages.</div>
          </div>
          <div className="w-[460px] h-[260px]">
            <img src="/assets/images/title-info.gif" alt="title info example" width={460} height={260} style={{ maxWidth: '100%' }} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TitleInfoModal;