"use client";

import { useState } from "react";
import { Button, Divider } from "antd";
import Image from "next/image";
import { RequestPromptHelpModal } from "./RequestPromptHelpModal";

const Header = () => {
  const [showRequestModal, setShowRequestModal] = useState(false);

  const handleOpenModal = () => {
    setShowRequestModal(true);
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
  };

  return (
    <div className="w-full flex flex-row justify-between">
      <div className="">
        <div className="flex flex-row items-center gap-2">
          <Image
            src="/assets/logos/cato-with-text.svg"
            width={60}
            height={20}
            alt="Cato logo and name"
          />
          <Divider type="vertical" className="border h-5 mx-4 border-primaryN30" />
          <div className="flex flex-col gap-3">
            <p className="text-grey-normal text-lg">Knowledge Base</p>
          </div>
        </div>
        <div className="text-sm text-grey-light-strong">Set the data you want to recollect from your projects, keep it organized.</div>
      </div>
      {/* <div>
        <Button
          className="custom-default-btn !w-[150px]"
          onClick={handleOpenModal}
        >
          Request Prompt Help
        </Button>
      </div> */}

      <RequestPromptHelpModal
        isOpen={showRequestModal}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Header;
