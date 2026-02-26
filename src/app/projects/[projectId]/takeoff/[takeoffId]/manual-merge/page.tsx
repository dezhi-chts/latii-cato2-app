"use client";

import Button from "@/components/Button";
import FileManualMerge from "./file-manual-merge";

const ManualMerge = () => {
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
    <div className="ml-20 mt-20 w-[80vw]">
      <div className="flex">
        <Button>Review Items</Button>
        <Button>Compare</Button>
      </div>
      <div className="w-full scrollbar-hidden flex overflow-auto gap-8">
        {files.map((file) => (
          <FileManualMerge key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
};

export default ManualMerge;
