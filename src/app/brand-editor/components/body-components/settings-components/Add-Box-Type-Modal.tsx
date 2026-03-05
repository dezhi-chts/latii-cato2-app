"use client";

import { Input, Modal, Select } from "antd";

type ModalProps = {
  isOpen: boolean;
  handleCancel: () => void;
  onOk: () => void;
};

const AddBoxTypeModal = (props: ModalProps) => {
  const { TextArea } = Input;

  return (
    <Modal open={props.isOpen} onCancel={props.handleCancel} onOk={props.onOk}>
      <div className="flex flex-col gap-7">
        {/* titulo y subtitulo */}
        <div className="flex flex-col gap-2">
          <h2 className="text-forumBlue-normal text-lg ">New Logic Box</h2>
          <p className="text-grey-normal">
            Create a new set of instructions to tell CATO which specific details
            to find in your files.
          </p>
        </div>

        {/* secction de input + select */}
        <div className="flex items-center w-full gap-8">
          <div className="w-7/12 flex flex-col">
            <div className="flex items-center gap-1">
              <span>Logic Name</span> <span className="text-red-normal">*</span>{" "}
            </div>
            <Input placeholder="Item, Table, Glass Table, etc." />
          </div>
          <div className="w-5/12 flex flex-col">
            <div className="flex items-center gap-1 text-sm">
              <span>Color</span> <span className="text-red-normal">*</span>{" "}
            </div>
            <Select />
          </div>
        </div>
        {/* Seccion de search prompt */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-sm">Search Prompt</span>{" "}
            <span className="text-red-normal">*</span>{" "}
          </div>
          <p className="text-xs text-grey-normal mb-4">
            Describe what this type of information typically look like so CATO
            can find it in the future on its own.
          </p>
          <TextArea rows={3} />
        </div>
        {/* Seccion de analysis prompt */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-sm">Analysis Prompt</span>{" "}
            <span className="text-red-normal">*</span>{" "}
          </div>
          <p className="text-xs text-grey-normal mb-4">
            Once the information is found, describe how you want CATO to analyze
            the information and correlate to the other information.
          </p>
          <TextArea rows={3} />
        </div>
      </div>
    </Modal>
  );
};

export default AddBoxTypeModal;
