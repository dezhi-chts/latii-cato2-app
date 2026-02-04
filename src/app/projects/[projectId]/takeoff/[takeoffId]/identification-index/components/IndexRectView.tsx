import { useState } from 'react';
import { Button, Popconfirm, Popover } from 'antd';
import Image from 'next/image';
import { AddRectBoxControls } from '../../components/pdf/Pdf-Controls';
import DrawingIndexModal from './DrawingIndexModal';
import TitleInfoModal from './TitleInfoModal';
import { GroupType } from '../../types/evidence';
const IndexRectView = ({
  indexBoxList = [],
  labelList = [],
  cropsCount = 0,
  handleAddRectBox,
  handleDeleteEvidence }: any) => {
  const [selectedIndexId, setSelectedIndexId] = useState<number>(-1);
  const [selectedLabelId, setSelectedLabelId] = useState<number>(-1);
  const [showDrawingModal, setShowDrawingModal] = useState<boolean>(false);
  const [showTitleInfoModal, setShowTitleInfoModal] = useState<boolean>(false);

  const handleSelectIndex = (indexId: number) => {
    if (indexId !== selectedIndexId) {
      setSelectedIndexId(indexId);
    } else {
      setSelectedIndexId(-1);
    }
    setSelectedLabelId(-1);
  };

  const handleSelectLabel = (labelId: number) => {
    if (labelId !== selectedLabelId) {
      setSelectedLabelId(labelId);
    } else {
      setSelectedLabelId(-1);
    }
    setSelectedIndexId(-1);
  };


  return (
    <div className="pl-14 pr-6 pt-6">
      <div>
        <div className="flex flex-row gap-2 text-base text-forumBlue">Index Identification
          <Popover
            placement="rightBottom"
            title={null}
            content={
              <div className="py-1 w-[240px] flex flex-col">
                <div className="my-1 text-xs">About Index Identification</div>
                <div className="text-xs text-baseGray">This process maps your document structure for Cato. By manually defining the Page Index, you significantly improve the AI's accuracy when reading your files.</div>
              </div>
            }
            trigger="hover"
          >
            <Image src="/assets/icons/info-forum-blue.svg" alt="info circle icon" width={14} height={14}></Image>
          </Popover>
        </div>
      </div>

      <div className="mt-4 text-xs text-basicGray">Select the Page Index and label examples to improve CATO’s accuracy.</div>
      <div>
        <div className="mt-6 flex flex-row justify-between items-center">
          <div className="flex flex-row">
            <div className="w-[16px] h-[16px] rounded-full bg-baseGray text-xxs text-white flex justify-center items-center">
              <span>1</span>
            </div>
            <span className="ml-2 text-xs text-basicGray">Define Index Area</span>
          </div>
          <div className="underline text-baseGray text-xs cursor-pointer" onClick={() => setShowDrawingModal(true)}>Learn More</div>
        </div>
        <div className="mt-2 flex flex-row"><span className="ml-5 text-xs">Add a box around the entire Index or Table of Contents.</span></div>
        {/** index rect box  */}
        <div className="my-2 mx-4 flex flex-col gap-4">
          {indexBoxList.map((item: any) => {
            return <div key={item.id} className={`rounded-md relative`}>
              <Image
                src={'/assets/placeholder-images/example_2.png'}
                alt={''}
                width={100}
                height={50}
                style={{
                  width: "100%",
                  height: "auto",
                }}
                onClick={() => handleSelectIndex(item.id)}
              />
              {
                selectedIndexId === item.id &&
                <div className={`absolute left-0 top-0 w-full h-full border-2 border-solid rounded-md ${selectedIndexId === item.id ? 'border-forumBlue bg-forumBlue/15' : 'bg-transparent'}`}>
                  <div className='absolute right-1 top-1'>
                    <Popconfirm
                      title="Are you sure you want to delete this evidence?"
                      trigger="click"
                      onConfirm={() => { handleDeleteEvidence([item.id]) }}
                    >
                      <div className="w-[18px] h-[16px] flex items-center justify-center bg-white rounded-md cursor-pointer shadow-md">
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
              }
            </div>
          })}
        </div>
        <div className="mx-4 my-2 flex flex-row justify-center">
          <AddRectBoxControls
            theme={cropsCount > 0 ? "primary-light" : "primary"}
            fullWidth={true}
            handleAddRectBox={() => {
              cropsCount === 0 && handleAddRectBox(GroupType.DrawingIndex)
            }}
          />
        </div>
      </div>
      <div>
        <div className="mt-6 flex flex-row justify-between items-center">
          <div className="flex flex-row">
            <div className="w-[16px] h-[16px] rounded-full bg-baseGray text-xxs text-white flex justify-center items-center">
              <span>2</span>
            </div>
            <span className="ml-2 text-xs text-basicGray">Identify label Format</span>
          </div>
          <div className="underline text-baseGray text-xs cursor-pointer" onClick={() => setShowTitleInfoModal(true)}>Learn More</div>
        </div>
        {
          true &&
          (<>
            <div className="mt-2 flex flex-row"><span className="ml-5 text-xs">Add a box around the entire Index or Table of Contents.</span></div>
            {/** index rect box  */}
            <div className="my-2 mx-4">
              {labelList.map((item: any) => {
                return <div key={item.id} className={`rounded-md relative `}>
                  <Image
                    src={'/assets/placeholder-images/example_2.png'}
                    alt={''}
                    width={100}
                    height={50}
                    style={{
                      width: "100%",
                      height: "auto",
                    }}
                    onClick={() => handleSelectLabel(item.id)}
                  />
                  {
                    selectedLabelId === item.id &&
                    <div className={`absolute left-0 top-0 w-full h-full border-2 border-solid rounded-md ${selectedLabelId === item.id ? 'border-forumBlue bg-forumBlue/15' : 'bg-transparent'}`}>
                      <div className='absolute right-1 top-1'>
                        <Popconfirm
                          title="Are you sure you want to delete this evidence?"
                          trigger="click"
                          onConfirm={() => { handleDeleteEvidence([item.id]) }}
                        >
                          <div className="w-[18px] h-[16px] flex items-center justify-center bg-white rounded-md cursor-pointer shadow-md">
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
                  }
                </div>
              })}
            </div>
            <div className="my-2 mx-4 flex flex-row justify-center">
              <AddRectBoxControls
                theme={cropsCount > 0 ? "primary-light" : "primary"}
                text="Label"
                fullWidth={true}
                handleAddRectBox={() => {
                  cropsCount === 0 && handleAddRectBox(GroupType.TitleInfo)
                }}
              />
            </div>
          </>)
        }
      </div>
      {showDrawingModal && <DrawingIndexModal
        isOpen={showDrawingModal}
        closeModal={() => setShowDrawingModal(false)}
      />}
      {
        showTitleInfoModal &&
        <TitleInfoModal
          isOpen={showTitleInfoModal}
          closeModal={() => setShowTitleInfoModal(false)}
        />
      }
    </div>
  );
}

export default IndexRectView;