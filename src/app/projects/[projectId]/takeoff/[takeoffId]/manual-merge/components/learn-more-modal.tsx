"use client";

import Button from "@/components/Button";
import { Divider, Modal, Select } from "antd";

type modalProps = {
  isOpen: boolean;
  setIsOpen: any;
  handleCancel: any;
};
const LearnMoreModal = (props: modalProps) => {
  return (
    <Modal
      closable={{ "aria-label": "Custom Close Button" }}
      open={props.isOpen}
      onCancel={props.handleCancel}
      footer={null} //agregar footer con el boton de close
      width={1000}
    >
      <h1 className="mb-4 text-forumBlue text-lg">Merging Types</h1>
      <div className="flex gap-4">
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
          <p>Preview Examples</p>
          <div className="flex flex-col gap-2">
            <div>
              <span>Row</span>
              <Select />
            </div>
            <div>
              <span>Column</span>
              <Select />
            </div>
          </div>
          <Divider />
          {/* tablas */}
          <div></div>
        </div>
      </div>
    </Modal>
  );
};

export default LearnMoreModal;
