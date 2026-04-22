"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

export const Header = () => {
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
          <p className="text-lg text-forumBlue-normal">Compare Review</p>
          <p className="text-xs text-grey-light-strong font-light">
            Select the item to compare between two files.
          </p>
        </div>
      </div>
    </div>
  );
};
