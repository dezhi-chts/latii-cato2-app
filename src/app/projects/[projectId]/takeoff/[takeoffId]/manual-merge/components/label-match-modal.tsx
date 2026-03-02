"use client";

import { Input, Modal } from "antd";

type modalProps = {
  isOpen: boolean;
  setIsOpen: any;
  handleCancel: any;
  handleOk: any;
};

const LabelMatchModal = (props: modalProps) => {
  const { TextArea } = Input;
  <Modal
    closable={{ "aria-label": "Custom Close Button" }}
    open={props.isOpen}
    onCancel={props.handleCancel}
    onOk={props.handleOk}
    width={700}
  >
    <p className="mb-6 text-forumBlue-normal">Match to base Label</p>
    <p>
      CATO analyzes details like location, product type, measurements, and
      images to automatically sync labels across your files.{" "}
    </p>
    <p>
      This ensures all your documents perfectly correlate with your base file.
    </p>
    <p>Give CATO additional specific rules or context to improve accuracy.</p>
    <TextArea />
  </Modal>;
};

export default LabelMatchModal;
