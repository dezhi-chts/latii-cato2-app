import { Input, Radio } from "antd";
import Image from "next/image";

export const Table = ({ file }: any) => {
  return (
    <div className="w-full mt-6">
      <div className="w-full flex flex-col">
        <div className="flex rounded-t-md text-basicGray bg-baseLight">
          <div className="w-1/2 flex justify-center items-center py-3">
            Label
          </div>
          <div className="w-1/2 flex justify-center items-center py-3">
            Sub-Label
          </div>
        </div>

        {file?.labels?.map((label: any) => (
          <div
            key={label.label}
            className="flex border-b border-r border-l border-primaryN30 "
          >
            <div className="w-1/2 flex justify-center items-center gap-4 border-r border-primaryN30 py-2">
              <Radio />{" "}
              <Input value={label.label} className="w-3/5 text-center " />
            </div>
            <div className="w-1/2 flex justify-center items-center gap-4 py-2">
              <Input value={label.label} className="w-3/5 text-center " />
              <Image
                src="/assets/icons/delete-merge-item.svg"
                alt="Delete"
                width={12}
                height={12}
              ></Image>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
