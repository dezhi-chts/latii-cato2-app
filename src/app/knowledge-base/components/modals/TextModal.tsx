import { Input, Modal } from "antd";
import Title from "./Title";
import { useState } from "react";
import Button from "@/components/Button";

const TextModal = ({ isModalOpen, setIsModalOpen, data }: any) => {
  const { TextArea } = Input;

  const [settings, setSettings] = useState<any>({
    name: data?.label || "",
    text: data?.text || "",
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev: any) => ({
      ...prev,
      name: e.target.value,
    }));
  };

  const handleTextChange = (value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      text: value,
    }));
  };

  return (
    <Modal
      width={500}
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      footer={null}
      title={
        <Title
          title="Add New Text"
          subtitle="Add Text that will give the CATO information for your Take Offs."
        />
      }
    >
      <div className="w-[450px] flex flex-col gap-4 pt-4">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-light">
            Name{" "}
            <span className="text-basicGray">
              (Use this to identify the text)
            </span>
          </p>
          <Input
            placeholder="Name Link"
            className="mb-4"
            onChange={handleNameChange}
            value={settings.name}
            disabled={data}
          />
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-light">Text</p>
          <TextArea
            placeholder="Add Text"
            className="mb-4"
            rows={8}
            onChange={(e) => handleTextChange(e.target.value)}
            style={{ resize: "none" }}
            value={settings.text}
            disabled={data}
          />
        </div>

        <div className="flex justify-end">
          <Button
            className="w-20"
            backgroundColor="forumBlue"
            disabled={!settings.name || !settings.text}
          >
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TextModal;
