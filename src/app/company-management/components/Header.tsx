"use client";

import { Divider } from "antd";
import Image from "next/image";

const Header = () => {
  return (
    <div className="w-full flex flex-row justify-between">
      <div>
        <div className="flex flex-row items-center gap-2">
          <Image
            src="/assets/logos/cato-with-text.svg"
            width={60}
            height={20}
            alt="Cato logo and name"
          />
          <Divider
            type="vertical"
            className="border h-5 mx-4 border-primaryN30"
          />
          <div className="flex flex-col gap-3">
            <p className="text-grey-normal text-lg">Company Management</p>
          </div>
        </div>
        <div className="text-sm text-grey-light-strong">
          Manage your companies and their contacts in one place.
        </div>
      </div>
    </div>
  );
};

export default Header;
