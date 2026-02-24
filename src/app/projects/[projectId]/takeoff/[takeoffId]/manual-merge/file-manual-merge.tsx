"use client";

import Button from "@/components/Button";
import { Input, Radio } from "antd";
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
    <div className="min-w-[25vw]">
      {/*  Title */}
      <div className="flex justify-between items-center">
        <div>
          <p>{file.file_name}</p>
          <div className="flex">
            <p>{file.labels_amount} Labels</p>
            <p>Type</p>
          </div>
        </div>
        <div>
          {!file.is_base && <p>Label match</p>}
          <p>Base</p> {/* cambiar los estilos dependiendo si es base o no*/}
        </div>
      </div>
      {/*  Table */}
      <div className="w-full">
        <div className="w-full flex flex-col">
          <div className="w-1/2">Label</div>
          <div className="w-1/2">Sublabel</div>
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
      <p>Edit in Detail Merge</p>
      {/*  Merge options */}
      <div className="w-full">
        <div className="flex justify-between items-center">
          <p>Merge Type</p>
          <p>Learn More</p>
        </div>
        {!file.is_base && (
          <div className="flex justify-between items-center">
            <p>Label</p>
            <Input />
          </div>
        )}

        <div className="flex justify-between items-center">
          <p>Row</p>
          <Input />
        </div>
        <div className="flex justify-between items-center">
          <p>Column</p>
          <Input />
        </div>
        <div>
          <Button>Merge All</Button>
        </div>
      </div>
    </div>
  );
};

export default FileManualMerge;
