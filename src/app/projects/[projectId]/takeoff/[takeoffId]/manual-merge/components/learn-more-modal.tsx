"use client";

import Button from "@/components/Button";
import { Divider, Modal, Select } from "antd";
import LearnMoreTable from "./learn-more-table";

type modalProps = {
  isOpen: boolean;
  setIsOpen: any;
  handleCancel: any;
};

const LearnMoreModal = (props: modalProps) => {
  const footer: React.ReactNode = (
    <div className="flex">
      <Button
        onClick={() => props.setIsOpen(false)}
        className="bg-grey-light text-grey-dark rounded-md hover:bg-grey-light-hover" // revisar el hover con tomi
        color="grey-dark"
        backgroundColor="grey-light"
      >
        Close
      </Button>
    </div>
  );
  return (
    <Modal
      closable={{ "aria-label": "Custom Close Button" }}
      open={props.isOpen}
      onCancel={props.handleCancel}
      footer={footer}
      width={1400}
    >
      <h1 className="mb-4 text-forumBlue-normal text-lg ">Merging Types</h1>
      <div className="flex gap-8 pb-8">
        {/* Types */}
        <div className="w-1/4 flex flex-col gap-3">
          <p>
            This phase will be conducted by CATO it’s objective is to march all
            files and condensed all information to facilitate user review.
          </p>
          <div>
            <p>Types of Merges:</p>
            <ul>
              <li>
                <span className="font-semibold">Outer Merge:</span> Keep all
                data between datasets, adding new info if applies.
              </li>
              <li>
                <span className="font-semibold">Base Merge:</span> Prioritize
                the BASE information and discard the additional information of
                other dataset.
              </li>
            </ul>
          </div>
          <div>
            <p>Merges will be applied to:</p>
            <ul>
              <li>
                <span className="font-semibold">Rows</span> are all data
                information for an specific label.
              </li>
              <li>
                <span className="font-semibold">Columns</span> prompts and
                attributes of the Takeoff list.
              </li>
            </ul>
          </div>
        </div>
        {/* Preview Examples */}
        <div>
          <p className="mb-4 text-forumBlue-normal">Preview Examples</p>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between w-[15vw]">
              <span>Row</span>
              <Select className="w-40" />
            </div>
            <div className="flex justify-between w-[15vw]">
              <span>Column</span>
              <Select className="w-40" />
            </div>
          </div>
          <Divider />
          {/* tablas */}
          <LearnMoreTable />
        </div>
      </div>
    </Modal>
  );
};

export default LearnMoreModal;
