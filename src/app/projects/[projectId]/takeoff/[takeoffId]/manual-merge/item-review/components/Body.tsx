"use client";

import { Divider } from "antd";
import { BodyOptions } from "./BodyOptions";

import PdfViewer from "./PdfViewer";
import { useState } from "react";

type BodyProps = {
  showOptions: boolean;
};

export const Body = ({ showOptions }: BodyProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  return (
    <div className="px-14 pt-8 flex flex-col gap-4">
      <div
        className={`${showOptions ? "max-h-6" : "max-h-0"} overflow-auto scrollbar-hidden transition-all duration-500 ease-in-out`}
      >
        <BodyOptions />
      </div>
      <div className="flex gap-10">
        <div className="w-4/6">
          <PdfViewer
            pdfUrl="/assets/placeholder_takeoff.pdf"
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            isPanelOpen={isPanelOpen}
            setIsPanelOpen={setIsPanelOpen}
          />
        </div>
        <Divider type="vertical" className="bg-grey-light-hover h-auto" />
        <p className="w-2/6">Table (WIP)</p>
      </div>
    </div>
  );
};
