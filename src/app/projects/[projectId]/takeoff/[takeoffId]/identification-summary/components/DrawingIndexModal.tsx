import { Modal, Button } from "antd";
const DrawingIndexModal = ({ isOpen, closeModal }: any) => {
  return (
    <Modal
      open={isOpen}
      onCancel={closeModal}
      title={null}
      closable={false}
      centered={true}
      width={"auto"}
      footer={
        <div className="my-2 flex justify-end font-nunito">
          <Button className="custom-default-btn" onClick={closeModal}>
            Close
          </Button>
        </div>
      }
    >
      <div className="w-[784px] h-[302px] flex flex-col gap-y-4 font-nunito">
        <div className="flex flex-row justify-between">
          <div className="w-[300px]">
            <div className="text-lg text-forumBlue-normal">
              How to select the Index Area
            </div>
            <div className="my-4 text-xs font-light">
              Draw a box that encapsulates the entire Table of Contents or Sheet
              Index list.
            </div>
            <ul className="list-disc ml-6 text-xs font-light">
              <li>
                Include both the Sheet Numbers (e.g., A-101) and the Sheet
                Names.
              </li>
              <li>
                If the index spans multiple columns, draw a box around all
                columns.
              </li>
              <li>
                Cato will strictly limit its search to this area, anything
                outside this box may be ignored.
              </li>
            </ul>
          </div>
          <div className="w-[457px] h-[302px]">
            <img
              src="/assets/images/drawing-index.gif"
              alt="drawing index example"
              width={457}
              height={302}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DrawingIndexModal;
