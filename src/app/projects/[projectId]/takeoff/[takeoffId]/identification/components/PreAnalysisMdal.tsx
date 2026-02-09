import { Modal, Button, Popover, Select, Table } from "antd";
import Image from "next/image";
const PreAnalysisMdal = ({
  isOpen,
  closeModal,
  handleAnalysis
}: any) => {
  const columns = [
    {
      title: <div className="text-center text-xxs font-semibold text-basicGray">Label</div>,
      dataIndex: 'label',
      key: 'label',
      align: 'center',
    },
    {
      title: <div className="text-center text-xxs font-semibold text-basicGray">Sub_Label</div>,
      dataIndex: 'sub_label',
      key: 'sub_label',
      align: 'center',
    },
    {
      title: <div className="text-center text-xxs font-semibold text-basicGray">Type</div>,
      dataIndex: 'type',
      key: 'type',
      align: 'center',
    },
    {
      title: <div className="text-center text-xxs font-semibold text-basicGray">Open</div>,
      dataIndex: 'open',
      key: 'open',
      align: 'center',
    },
    {
      title: <div className="text-center text-xxs font-semibold text-basicGray">Width</div>,
      dataIndex: 'width',
      key: 'width',
      align: 'center',
    },
    {
      title: <div className="text-center text-xxs font-semibold text-basicGray">Height</div>,
      dataIndex: 'height',
      key: 'height',
      align: 'center',
    },
    {
      title: <div className="text-center text-xxs font-semibold text-basicGray">Area</div>,
      dataIndex: 'area',
      key: 'area',
      align: 'center',
    },
  ];

  const data = [
    {
      key: '1',
      label: '',
      sub_label: '',
      type: '',
      open: '',
      width: '',
      height: '',
      area: '',
    },
  ];

  return (
    <Modal
      open={isOpen}
      title={null}
      centered={true}
      width={800}
      footer={null}
      onCancel={closeModal}
    >
      <div className="flex flex-col gap-3 font-nunito">
        <div className="text-sm text-forumBlue">Pre-Analysis State</div>
        <div className="text-xs">
          Confirm Prompt Template Before starting the pre-analysis, verify the prompt template Cato will use to extract your data. Please review the column preview below.
        </div>
        <div className="my-2 flex flex-row justify-center items-center gap-2">
          <div className="text-xs text-forumBlue">Reading Prompt</div>
          <Popover placement="rightBottom"
            title={<div className="text-xxs font-medium">About Page Labeling</div>}
            content={<div className="w-[300px] text-xxs text-baseGray">
              Review and analyze the sections identified by CATO. You can verify existing results or add new labels manually.
              Ensuring every section is correctly labeled guarantees the most accurate analysis from CATO.
            </div>}
            trigger="hover"
          >
            <Image src="/assets/icons/info-forum-blue.svg" alt="info circle icon" width={14} height={14}></Image>
          </Popover>
          <Select className="w-[240px] h-[26px] rounded-3xl"></Select>
        </div>
        <div className="my-2 text-xs text-basicGray">Preview Takeoff List</div>
        <div>
          <Table
            columns={columns}
            dataSource={data}
            bordered={true}
            pagination={false}
            size="small"
          />
        </div>
        <div className="my-4 text-xs">Once the pre-analysis begins, changing the prompt template will return you to the Page Labeling Step.</div>
        <div className="flex flex-row justify-end gap-2">
          <Button className="custom-default-btn !w-[110px]" onClick={closeModal}>Prompt Editing</Button>
          <Button className="custom-primary-btn !w-[74px]" onClick={handleAnalysis}>Analysis</Button>
        </div>
      </div>
    </Modal>
  );
};

export default PreAnalysisMdal;