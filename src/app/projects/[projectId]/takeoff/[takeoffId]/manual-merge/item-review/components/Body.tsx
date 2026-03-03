"use client";

import { Divider } from "antd";
import { BodyOptions } from "./BodyOptions";
import PdfViewer from "./PdfViewer";
import { useState } from "react";
import { Table } from "./Table";

export type Sublabel = {
  id: string;
  label: string;
  category: string;
  type: string;
  open: string;
};

export type Label = {
  id: string;
  label: string;
  category: string;
  type: string;
  open: string;
  sublabels: Sublabel[];
};

const labels: Label[] = [
  {
    id: "1",
    label: "A",
    category: "Window",
    type: "Casement",
    open: "Inswing",
    sublabels: [
      {
        id: "1-1",
        label: "A1",
        category: "Window",
        type: "Double Casement",
        open: "Inswing",
      },
      {
        id: "1-2",
        label: "A2",
        category: "Door",
        type: "Sliding",
        open: "XO",
      },
    ],
  },
  {
    id: "2",
    label: "B",
    category: "System",
    type: "-",
    open: "-",
    sublabels: [
      {
        id: "2-1",
        label: "B1",
        category: "Window",
        type: "Awning",
        open: "Outswing",
      },
    ],
  },
  {
    id: "3",
    label: "C",
    category: "Door",
    type: "Single Swing",
    open: "Outswing",
    sublabels: [],
  },
  {
    id: "4",
    label: "D",
    category: "System",
    type: "-",
    open: "-",
    sublabels: [],
  },
  {
    id: "5",
    label: "E",
    category: "Window",
    type: "Casement",
    open: "Inswing",
    sublabels: [],
  },
  {
    id: "6",
    label: "F",
    category: "Door",
    type: "Single Swing",
    open: "Outswing",
    sublabels: [],
  },
  {
    id: "7",
    label: "G",
    category: "Window",
    type: "Direct Set",
    open: "-",
    sublabels: [
      {
        id: "7-1",
        label: "G1",
        category: "Window",
        type: "Direct Set",
        open: "-",
      },
    ],
  },
  {
    id: "8",
    label: "H",
    category: "Window",
    type: "Direct Set",
    open: "-",
    sublabels: [],
  },
  {
    id: "9",
    label: "I",
    category: "Window",
    type: "Direct Set",
    open: "-",
    sublabels: [],
  },
  {
    id: "10",
    label: "J",
    category: "Window",
    type: "Direct Set",
    open: "-",
    sublabels: [],
  },
];

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
        <div className="w-2/6">
          <Table labels={labels} />
        </div>
      </div>
    </div>
  );
};
