import React from "react";

const Header = () => {
  return (
    <div className="w-full flex flex-col gap-2 border-b-primaryN30 border-b">
      <div className="flex flex-col gap-2 pl-12 mb-4">
        <p className="text-forumBlue-normal text-lg">Your Company</p>
        <p className="text-grey-light-strong text-sm">
          Save all the information of your company
        </p>
      </div>
    </div>
  );
};

export default Header;
