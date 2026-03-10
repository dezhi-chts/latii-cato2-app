import { useState } from "react";
import { Button, Popconfirm, Popover } from "antd";
import Image from "next/image";
import { AddRectBoxControls } from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/Pdf-Controls";
import DrawingIndexModal from "./DrawingIndexModal";
import TitleInfoModal from "./TitleInfoModal";
import { GroupType } from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";
const IndexRectView = ({
  indexBoxList = [],
  labelList = [],
  cropsCount = 0,
  handleAddRectBox,
  handleDeleteEvidence,
}: any) => {
  const [selectedIndexId, setSelectedIndexId] = useState<number>(-1);
  const [selectedLabelId, setSelectedLabelId] = useState<number>(-1);
  const [showDrawingModal, setShowDrawingModal] = useState<boolean>(false);
  const [showTitleInfoModal, setShowTitleInfoModal] = useState<boolean>(false);

  return (
    <div className="pl-14 pr-6 pt-6">
      <div>
        <div className="flex flex-row gap-2 text-base text-forumBlue-normal">
          Index Identification
          <Popover
            placement="rightBottom"
            title={null}
            content={
              <div className="py-1 w-[240px] flex flex-col">
                <div className="my-1 text-xs">About Index Identification</div>
                <div className="text-xs text-grey-light-strong">
                  This process maps your document structure for Cato. By
                  manually defining the Page Index, you significantly improve
                  the AI's accuracy when reading your files.
                </div>
              </div>
            }
            trigger="hover"
          >
            <Image
              src="/assets/icons/info-forum-blue.svg"
              alt="info circle icon"
              width={14}
              height={14}
            ></Image>
          </Popover>
        </div>
      </div>

      <div className="mt-2 mb-10 text-xs text-grey-normal">
        Define the areas CATO needs to read for determine the Index of your File.
      </div>
      <div>
        <div className="mt-8 flex flex-row justify-between items-center">
          <div className="flex flex-row">
            {
              indexBoxList.length === 0 ?
                <div className="w-[16px] h-[16px] rounded-full bg-grey-normal text-xxs text-white flex justify-center items-center">
                  <span>1</span>
                </div> : <div className="w-[16px] h-[16px] rounded-full bg-green-normal text-xxs text-white flex justify-center items-center">
                  <span className="font-sans">{"✓"}</span>
                </div>
            }

            <span className="ml-2 text-xs">
              Define Index Area
            </span>
          </div>
          <div
            className="underline text-grey-light-strong text-xs cursor-pointer"
            onClick={() => setShowDrawingModal(true)}
          >
            Learn More
          </div>
        </div>
        <div className="ml-5 mt-2 mb-5 flex flex-row">
          <span className="text-xs text-grey-normal">
            Add a box around the entire Index or Table of Contents.
          </span>
        </div>
        {/** index rect box  */}
        <div className="my-2 mx-4 flex flex-col gap-2">
          {indexBoxList.map((item: any, index: number) => {
            return (
              <div key={item.id}>
                <div className="px-4 w-full h-[30px] flex items-center justify-between rounded-full text-xs text-grey-normal bg-grey-light">
                  <div className="flex-1">
                    Page Index {index + 1}
                  </div>
                  <div>
                    <Popconfirm
                      title="Are you sure you want to delete this evidence?"
                      trigger="click"
                      onConfirm={() => {
                        handleDeleteEvidence([item.id]);
                      }}
                    >
                      <div className="w-[18px] h-[16px] flex items-center justify-center cursor-pointer">
                        <Image
                          src="/assets/icons/delete-dark.svg"
                          alt="delete icon"
                          width={15}
                          height={15}
                        />
                      </div>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mx-4 my-3 flex flex-row justify-center">
          <AddRectBoxControls
            theme={cropsCount > 0 ? "primary-light" : "primary"}
            fullWidth={true}
            handleAddRectBox={() => {
              cropsCount === 0 && handleAddRectBox(GroupType.DrawingIndex);
            }}
          />
        </div>
      </div>
      <div>
        <div className="mt-6 flex flex-row justify-between items-center">
          <div className="flex flex-row">
            {
              labelList.length === 0 ?
                <div className="w-[16px] h-[16px] rounded-full bg-grey-normal text-xxs text-white flex justify-center items-center">
                  <span>2</span>
                </div> : <div className="w-[16px] h-[16px] rounded-full bg-green-normal text-xxs text-white flex justify-center items-center">
                  <span className="font-sans">{"✓"}</span>
                </div>
            }
            <span className="ml-2 text-xs">
              Identify label Format
            </span>
          </div>
          <div
            className="underline text-grey-light-strong text-xs cursor-pointer"
            onClick={() => setShowTitleInfoModal(true)}
          >
            Learn More
          </div>
        </div>
        {true && (
          <>
            <div className="ml-5 mt-2 mb-5 flex flex-row">
              <span className="text-xs text-grey-normal">
                Add a box around the entire Index or Table of Contents.
              </span>
            </div>
            {/** index rect box  */}
            <div className="my-2 mx-4 flex flex-col gap-2">
              {labelList.map((item: any, index: number) => {
                return (
                  <div key={item.id}>
                    <div className="px-4 w-full h-[30px] flex items-center justify-between rounded-full text-xs text-grey-normal bg-grey-light">
                      <div className="flex-1">
                        Label {index + 1}
                      </div>
                      <div>
                        <Popconfirm
                          title="Are you sure you want to delete this evidence?"
                          trigger="click"
                          onConfirm={() => {
                            handleDeleteEvidence([item.id]);
                          }}
                        >
                          <div className="w-[18px] h-[16px] flex items-center justify-center cursor-pointer">
                            <Image
                              src="/assets/icons/delete-dark.svg"
                              alt="delete icon"
                              width={15}
                              height={15}
                            />
                          </div>
                        </Popconfirm>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mx-4 my-3 flex flex-row justify-center">
              <AddRectBoxControls
                theme={cropsCount > 0 ? "primary-light" : "primary"}
                text="Label"
                fullWidth={true}
                handleAddRectBox={() => {
                  cropsCount === 0 && handleAddRectBox(GroupType.TitleInfo);
                }}
              />
            </div>
          </>
        )}
      </div>
      {showDrawingModal && (
        <DrawingIndexModal
          isOpen={showDrawingModal}
          closeModal={() => setShowDrawingModal(false)}
        />
      )}
      {showTitleInfoModal && (
        <TitleInfoModal
          isOpen={showTitleInfoModal}
          closeModal={() => setShowTitleInfoModal(false)}
        />
      )}
    </div>
  );
};

export default IndexRectView;
