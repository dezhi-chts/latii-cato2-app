import { useState, ReactNode } from "react";
import { Modal, Input, Button } from "antd";
import { notify } from "@/utils/notify";

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
      notify.toastError("Please input label");
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
      width="500px"
    >
      <div className="flex flex-col font-nunito">
        <div className="text-lg text-forumBlue-normal">
          Label Confirm
        </div>
        <div className="flex flex-row gap-2 overflow-hidden">
          <div className="flex-1 flex flex-col">
            <div className="mt-6 flex flex-row">
              <div className="w-[100px] text-sm">Label:</div>
              <Input className="flex-1" value={formData?.Label} onChange={(e) => { setFormData({ ...formData, Label: e.target.value }) }} type="text" />
            </div>
            <div className="my-2 flex flex-row">
              <div className="w-[100px] text-sm">Sub Label:</div>
              <Input className="flex-1" value={formData?.['Sub Label']} onChange={(e) => { setFormData({ ...formData, ['Sub Label']: e.target.value }) }} type="text" />
            </div>
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
