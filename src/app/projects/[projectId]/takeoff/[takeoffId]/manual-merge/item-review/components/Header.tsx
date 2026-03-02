"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { HeaderFile } from "../page";
import { useState } from "react";
import { Divider } from "antd";
import { PagePreAnalysisStepActive } from "../../../identification-index/components/HeaderStepProgress";

type FilePreviewProps = {
  file: HeaderFile;
  isSelected: boolean;
  handleSelect: (id: string) => void;
};

type HeaderProps = {
  filesData: HeaderFile[];
  selectedFileId: string;
  handleSelectFile: (id: string) => void;
};

export const Header = ({
  filesData,
  handleSelectFile,
  selectedFileId,
}: HeaderProps) => {
  const projectId = useParams().projectId;
  const takeoffId = useParams().takeoffId;

  return (
    <div className="px-14 w-full h-[110px] border-b border-primaryN30">
      <div className="h-full flex items-center">
        <Link
          className="cursor-pointer"
          href={`/projects/${projectId}/takeoff/${takeoffId}/manual-merge`}
        >
          <Image
            src="/assets/icons/arrow-back.svg"
            alt="logo"
            width={12}
            height={8}
          />
        </Link>
        <div className="ml-8 flex flex-col gap-1">
          <p className="text-lg text-forumBlue-normal">Item Review</p>
          <p className="text-xs text-grey-light-strong font-light">
            Review edit and add items, tables, etc.
          </p>
        </div>
        <div className="ml-20 h-full flex gap-4 items-center">
          <div className="ml-4 mr-14 flex gap-4">
            {filesData?.map((file: HeaderFile, index: number) => {
              return (
                <FilePreview
                  file={file}
                  key={index}
                  isSelected={selectedFileId === file.id}
                  handleSelect={handleSelectFile}
                />
              );
            })}
          </div>
        </div>
        <Divider type="vertical" className="h-16 bg-grey-light-hover" />
        <div className="flex flex-col gap-2">
          <PagePreAnalysisStepActive />
          <p className="ml-16 text-forumBlue-normal bg-forumBlue-light-active rounded-md py-0.5 px-2 w-fit text-xxs">
            Progress
          </p>
        </div>
      </div>
    </div>
  );
};

const FilePreview = ({ file, isSelected, handleSelect }: FilePreviewProps) => {
  return (
    <div
      className={`${isSelected ? "bg-grey-light" : "bg-white"} w-56 border-grey-light-hover border rounded-md py-2 px-4 flex items-center cursor-pointer gap-3`}
      onClick={() => handleSelect(file.id)}
    >
      <div>
        <Image
          src="/assets/icons/extensions/pdf.svg"
          alt="pdf icon"
          width={22}
          height={26}
        />
      </div>
      <div>
        <p
          className={`${isSelected ? "text-black" : "text-grey-normal"} text-xs`}
        >
          {file.name}
        </p>
        <p className="text-grey-light-strong text-xxs">{file.type}</p>
      </div>
    </div>
  );
};
