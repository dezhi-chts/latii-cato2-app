"use client";

import Button from "@/components/Button";
import { Modal } from "antd";

type ModalProps = {
  isOpen: boolean;
  handleCancel: () => void;
};

const ExploreExamplesModal = (props: ModalProps) => {
  const footer = (
    <div className="flex justify-end">
      <Button
        onClick={props.handleCancel}
        backgroundColor="grey-light"
        color="grey-dark"
        className="rounded-md text-grey-dark bg-grey-light border-none !hover:text-grey-dark-hover hover:bg-grey-light-hover"
      >
        Close
      </Button>
    </div>
  );

  return (
    <Modal
      open={props.isOpen}
      onCancel={props.handleCancel}
      okButtonProps={{ style: { display: "none" } }}
      cancelText="Close"
      width={600}
      closable={false}
      cancelButtonProps={{ style: { display: "none" } }}
      footer={footer}
    >
      <div className="flex flex-col gap-6">
        <h2 className="text-forumBlue-normal">Understanding Logic Box</h2>
        <p>
          Creating a logic box will allow you to add specific information in
          your files and detail teh way CATO reads it. Preview some examples to
          create your prompt.
        </p>
        <div className="flex gap-4 w-full">
          <div className="border rounded-md border-grey-light-hover w-1/2 p-4">
            sample text
          </div>
          <div className="border rounded-md border-grey-light-hover w-1/2 p-4">
            sample text
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExploreExamplesModal;
