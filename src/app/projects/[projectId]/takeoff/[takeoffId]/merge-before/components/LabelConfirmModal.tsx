import { useState, ReactNode } from "react";
import { Modal, Input, Button, message } from "antd";

interface LabelConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (formData: any) => void;
  children?: ReactNode;
}

const LabelConfirmModal = ({
  open,
  onCancel,
  onSubmit,
  children,
}: LabelConfirmModalProps) => {
  const [formData, setFormData] = useState<any>({
    Label: '',
    'Sub Label': '',
  });

  const handleSubmit = () => {
    // 检验表单数据
    if (formData.Label.trim() === "") {
      message.error("Please input label");
      return;
    }
    onSubmit(formData);
  }

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={true}
      width="60%"
    >
      <div className="h-[80vh] max-h-[80vh] flex flex-col">
        <div className="text-lg text-forumBlue-normal">
          Label Confirm
        </div>
        <div className="flex flex-row gap-2 overflow-hidden">
          <div className="w-[50%] font-nunito">
            <div className="mt-6 flex flex-row">
              <div className="w-[100px] text-sm">Label:</div>
              <Input value={formData?.Label} onChange={(e) => { setFormData({ ...formData, Label: e.target.value }) }} type="text" />
            </div>
            <div className="my-2 flex flex-row">
              <div className="w-[100px] text-sm">Sub Label:</div>
              <Input value={formData?.['Sub Label']} onChange={(e) => { setFormData({ ...formData, ['Sub Label']: e.target.value }) }} type="text" />
            </div>
          </div>
          <div className="flex">
            {children}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button className="custom-default-btn" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="custom-primary-btn" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default LabelConfirmModal;
