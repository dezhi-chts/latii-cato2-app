"use client";

import Button from "@/components/Button";
import { Divider, Input } from "antd";

const TeamMembers = () => {
  return (
    <div className="mt-8 ml-4 flex flex-col gap-12 w-full">
      <div className="flex">
        <div className="w-8/12">User Panel</div>

        <div className="w-4/12 flex flex-col gap-6 border-l-2 pl-12">
          <p className="py-2 text-kahuBlue text-base">New User</p>
          <div className="flex flex-col gap-2 w-full ">
            <p className=" text-sm">
              First Name <span className="text-accentRed">*</span>
            </p>
            <Input
              className="w-7/12 rounded-xl"
              name="first_name"
              size="large"
              value=""
              onChange={(e) => console.log(e)}
            />
          </div>
          <div className="flex flex-col gap-2 w-full ">
            <p className=" text-sm">
              Last Name <span className="text-accentRed">*</span>
            </p>
            <Input
              className="w-7/12 rounded-xl"
              name="first_name"
              size="large"
              value=""
              onChange={(e) => console.log(e)}
            />
          </div>
          <div className="flex flex-col gap-2 w-full ">
            <p className=" text-sm">Company</p>
            <Input
              className="w-7/12 rounded-xl"
              name="first_name"
              size="large"
              value=""
              onChange={(e) => console.log(e)}
            />
          </div>
          <div className="flex flex-col gap-2 w-full ">
            <p className=" text-sm">Role</p>
            <Input
              className="w-7/12 rounded-xl"
              name="first_name"
              size="large"
              value=""
              onChange={(e) => console.log(e)}
            />
          </div>
          <div className="flex flex-col gap-2 w-full ">
            <p className=" text-sm">
              Email <span className="text-accentRed">*</span>
            </p>
            <Input
              className="w-7/12 rounded-xl"
              name="first_name"
              size="large"
              value=""
              onChange={(e) => console.log(e)}
            />
          </div>
          <div className="flex flex-col gap-2 w-full ">
            <p className=" text-sm">
              Password <span className="text-accentRed">*</span>
            </p>
            <Input.Password
              className="w-7/12 rounded-xl"
              name="first_name"
              size="large"
              value=""
              onChange={(e) => console.log(e)}
            />
          </div>
          <div className="flex justify-end w-7/12">
            <Button backgroundColor={"forumBlue"}> Create </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMembers;
