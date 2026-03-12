import { Divider, Select } from "antd";
import { Label } from "../../item-review/components/Body";
import { Table } from "./Table";

const mockOptions = [
  {
    label: "[File Name 1] - [Type of File]",
    value: "1",
  },
  {
    label: "[File Name 2] - [Architectural Drawings]",
    value: "2",
  },
  {
    label: "[File Name 3] - [Product List]",
    value: "3",
  },
];

const mockLabels: Label[] = [
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

const Body = () => {
  return (
    <div className="w-full flex p-20 pt-0 gap-8 overflow-hidden">
      <div className="min-w-0 flex-1 flex flex-col gap-4 pt-20">
        <Select options={mockOptions} className="w-80" defaultValue="1" />
        <div className="w-full min-w-0">
          <Table labels={mockLabels} />
        </div>
      </div>

      <Divider
        type="vertical"
        className="bg-grey-light-hover h-auto shrink-0"
      />

      <div className="min-w-0 flex-1 flex flex-col gap-4 pt-20">
        <Select options={mockOptions} className="w-80" defaultValue="2" />
        <div className="w-full min-w-0">
          <Table labels={mockLabels} />
        </div>
      </div>
    </div>
  );
};

export default Body;
