import React from "react";

interface EmptyProjectProps {
  createQuotiiButton: React.ReactNode;
}

const EmptyProject: React.FC<EmptyProjectProps> = ({ createQuotiiButton }) => {
  return (
    <div className="flex flex-col rounded-3xl border border-primaryN50 items-center justify-center border-dashed text-sm gap-4 p-9 w-full">
      <p className="text-grey-normal ">
        To start create the first Take Off with Latii
      </p>
      {createQuotiiButton}
    </div>
  );
};

export default EmptyProject;
