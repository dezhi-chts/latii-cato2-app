import { Modal, Button } from "antd";
import Image from "next/image";
import { Group } from "react-konva";
import { GroupType } from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";
const SkipTipModal = ({
  isOpen,
  closeModal,
  skipType,
  handleSkip,
  handleAddRectBox,
}: any) => {
  const skipList = [
    {
      type: "index",
      title: "Identify Index",
      description: [
        "Index identification improves CATO recognition of your Architectural Drawing.",
        "Are you sure you want to skip this step and go to Page labeling?",
      ],
      buttonText: "Index Box",
      buttonPress: () => {
        handleAddRectBox(GroupType.DrawingIndex);
      },
    },
    {
      type: "label",
      title: "Identify Label Format",
      description: [
        "Label format improves CATO recognition of your Index Page, improving its accuracy.",
        "Are you sure you want to skip this step and go to Index creation?",
      ],
      buttonText: "Label",
      buttonPress: () => {
        handleAddRectBox(GroupType.TitleInfo);
      },
    },
  ];

  const skipInfo =
    skipList.find((item) => item.type === skipType) ?? skipList[0];

  return (
    <Modal
      open={isOpen}
      onCancel={closeModal}
      title={null}
      closable={false}
      centered={true}
      width={"auto"}
      footer={null}
    >
      <div className="p-2 w-[340px]  flex flex-col gap-y-4 font-nunito">
        <div className="text-base text-forumBlue-normal">{skipInfo.title}</div>
        <div className="text-sm">
          {skipInfo.description.map((item, index) => (
            <div key={index} className="py-2 text-sm">
              {item}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <Button
            className="custom-primary-btn !w-[228px]"
            onClick={skipInfo.buttonPress}
          >
            {skipInfo.buttonText}
            <Image
              src="/assets/icons/add-table-white.svg"
              alt="arrow right icon"
              width={14}
              height={14}
              className="ml-2"
            />
          </Button>
          <Button
            className="custom-default-btn !bg-[#FF931D] !text-white hover:!bg-[#FF931D]"
            onClick={handleSkip}
          >
            Skip
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SkipTipModal;
