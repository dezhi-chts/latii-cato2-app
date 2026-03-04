"use client";

import Button from "@/components/Button";

const BoxesType = () => {
  return (
    <div className="w-full h-full  text-xs pr-20">
      {/* titles */}
      <div className="flex justify-between items-center w-full mb-8">
        <div className="flex flex-col gap-1">
          <p className="text-base text-grey-base-dark">Box Information</p>
          <p className="text-grey-normal">
            This is the box information available for all takeoffs. Create up to
            20 options.
          </p>
        </div>
        <div>
          <Button backgroundColor={"forumBlue-normal"} className="rounded-md">
            + Add Box Type
          </Button>
        </div>
      </div>
      <div>
        {/* encabezados */}
        <div className="w-full flex bg-primaryN20 border-b border-b-primaryN30 text-grey-basic">
          <div className="w-2/12 text-center">Logic Name</div>
          <div className="w-1/12 text-center">Color</div>
          <div className="w-4/12 text-center">Search Prompt</div>
          <div className="w-5/12 text-center">Analysis Prompt</div>
        </div>
      </div>
    </div>
  );
};

export default BoxesType;
