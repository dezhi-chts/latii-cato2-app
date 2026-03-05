"use client";

import Button from "@/components/Button";
import FileManualMerge from "./file-manual-merge";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "./components/Header";

const ManualMerge = () => {
  const projectId = useParams().projectId;
  const takeoffId = useParams().takeoffId;

  const files = [
    {
      id: 1,
      file_name: "File 1",
      is_base: true,
      labels_amount: 12,
      type: "Architectural Drawing",
      labels: [
        {
          label: "a",
          sublabels: ["a, a1, a2, a3"],
        },
        {
          label: "b",
          sublabels: ["b, b1, b2"],
        },
        {
          label: "c",
          sublabels: ["c"],
        },
        {
          label: "d",
          sublabels: ["d1, d2"],
        },
      ],
    },
    {
      id: 2,
      file_name: "File 1",
      is_base: false,
      labels_amount: 12,
      type: "Architectural Drawing",
      labels: [
        {
          label: "a",
          sublabels: ["a, a1, a2, a3"],
        },
        {
          label: "b",
          sublabels: ["b, b1, b2"],
        },
        {
          label: "c",
          sublabels: ["c"],
        },
        {
          label: "d",
          sublabels: ["d1, d2"],
        },
      ],
    },
  ];

  return (
    <div className="w-full">
      <Header />
      <div className="flex justify-between px-20 pt-8">
        <div className="flex flex-col gap-1">
          <p className="text-forumBlue-normal">Multi File Merger</p>
          <p className="text-xs text-grey-normal">
            Review the merge methods for your file merge.
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <Button backgroundColor="primaryN20" className="!rounded-md">
            <p className="text-grey-normal">Item Compare</p>
          </Button>
          <Link
            href={`/projects/${projectId}/takeoff/${takeoffId}/manual-merge/item-review`}
          >
            <Button backgroundColor="primaryN20" className="!rounded-md">
              <p className="text-grey-normal">General Review Items</p>
            </Button>
          </Link>
        </div>
      </div>
      <div className="scrollbar-hidden flex overflow-auto gap-20 px-20">
        {files.map((file, index) => (
          <FileManualMerge
            key={file.id}
            file={file}
            isFirstFile={index === 0}
          />
        ))}
      </div>
    </div>
  );
};

export default ManualMerge;
