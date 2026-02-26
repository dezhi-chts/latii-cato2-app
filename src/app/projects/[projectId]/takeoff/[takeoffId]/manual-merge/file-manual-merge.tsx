"use client";

import Button from "@/components/Button";
import { Input, Radio, Select } from "antd";
import Image from "next/image";

type Label = {
  label: string;
  sublabels: string[];
};

type MergeFile = {
  id: number;
  file_name: string;
  is_base: boolean;
  labels_amount: number;
  type: string;
  labels: Label[];
};

type FileManualMergeProps = {
  file: MergeFile;
};
const FileManualMerge = ({ file }: FileManualMergeProps) => {
  return (
    <div className="min-w-[25vw] text-sm pt-8">
      {/*  Title */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <p className="text-base"> {file.file_name}</p>
          <div className="flex gap-2">
            <div className="bg-grey-light-hover py-0.5 px-2 rounded-md text-xs flex justify-center items-center">
              <span>{file.labels_amount} Labels </span>
            </div>
            <div className="bg-grey-light-hover py-0.5 px-2 rounded-md text-xs flex justify-center items-center">
              <span>{file.type}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          {!file.is_base && (
            <div className=" text-xs py-1 px-2 rounded-md flex items-center justify-center gap-1 bg-orange-normal text-white">
              <Image
                src="/assets/icons/tag.svg"
                alt="tag"
                width={20}
                height={20}
              />
              <span className="text-xs">Label match</span>
            </div>
          )}
          <div
            className={` text-xs py-2 px-2 rounded-md flex items-center justify-center ${
              file.is_base
                ? "text-teal-dark-active bg-cyan-light-active "
                : "text-grey-light-strong bg-grey-light"
            }`}
          >
            <span> Base</span>
          </div>{" "}
        </div>
      </div>
      {/*  Table */}
      <div className="w-full mt-6">
        <div className="w-full flex flex-col">
          <div className="flex">
            <div className="w-1/2">Label</div>
            <div className="w-1/2">Sublabel</div>
          </div>

          {file?.labels?.map((label) => (
            <div key={label.label} className="flex">
              <div className="w-1/2 flex">
                <Radio></Radio> <Input value={label.label} />
              </div>
              <div className="w-1/2 flex">
                <Input value={label.label} />
                <Image
                  src="/assets/icons/delete-table.svg"
                  alt="Delete"
                  width={20}
                  height={20}
                ></Image>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="pt-1 underline text-forumBlue-normal">
        Edit in Detail Merge
      </p>
      {/*  Merge options */}
      <div className="w-full mt-3 flex justify-center">
        <div className="w-4/6 flex flex-col gap-4 ">
          <div className="flex justify-between items-center">
            <p className="text-forumBlue-normal">Merge Type</p>
            <p className="text-grey-light-strong underline">Learn More</p>
          </div>
          {!file.is_base && (
            <div className="flex justify-between items-center">
              <p>Label</p>
              <Input />
            </div>
          )}

          <div className="flex justify-between items-center">
            <p>Row</p>
            <Select />
          </div>
          <div className="flex justify-between items-center">
            <p>Column</p>
            <Select className="w-7/12" />
          </div>
          <div>
            <Button
              className="w-full rounded-md text-white"
              backgroundColor={"forumBlue-normal"}
            >
              Merge All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManualMerge;
