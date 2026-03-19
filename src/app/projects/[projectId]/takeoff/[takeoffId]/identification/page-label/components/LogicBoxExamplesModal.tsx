"use client";
import { Modal, Button } from "antd";

interface LogicBoxExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const examples = [
  {
    logicName: "Context Information",
    searchPrompt: "Context Information",
    analysisPrompt: "Context Information",
  },
  {
    logicName: "Context Information",
    searchPrompt: "Context Information",
    analysisPrompt: "Context Information",
  },
];

export default function LogicBoxExamplesModal({
  isOpen,
  onClose,
}: LogicBoxExamplesModalProps) {
  return (
    <Modal
      open={isOpen}
      title={null}
      centered={true}
      width={800}
      footer={null}
      onCancel={onClose}
      destroyOnClose={true}
    >
      <div className="h-[420px] p-6 font-nunito">
        <h2 className="text-lg text-forumBlue-normal mb-6">
          Understanding Logic Box
        </h2>
        <p className="text-xs text-[#6B6B6B] mb-6">
          Creating a logic box will allow you to add specific information in your files and detail teh way CATO reads it.
          Preview some examples to create your prompt.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {examples.map((example, index) => (
            <div
              key={index}
              className="border border-primaryN30 rounded-md p-4 bg-white"
            >
              <div className="mb-6">
                <label className="text-xs text-grey-normal block mb-1">
                  Logic Name
                </label>
                <div className="text-sm">{example.logicName}</div>
              </div>

              <div className="mb-6">
                <label className="text-xs text-grey-normal block mb-1">
                  Search Prompt
                </label>
                <div className="text-sm">{example.searchPrompt}</div>
              </div>

              <div className="mb-6">
                <label className="text-xs text-grey-normal block mb-1">
                  Analysis Prompt
                </label>
                <div className="text-sm">{example.analysisPrompt}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            className="custom-default-btn !w-[76px]"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
