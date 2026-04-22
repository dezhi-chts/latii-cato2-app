"use client";
import { Header } from "./components/Header";
import { Body } from "./components/Body";
import { useState } from "react";

export type HeaderFile = {
  id: string;
  name: string;
  type: "Architectural Drawing" | "Product List";
  file_extension?: "pdf";
};

const mockFilesData: HeaderFile[] = [
  {
    id: "1",
    name: "[NAME OF FILE 1]",
    type: "Architectural Drawing",
    file_extension: "pdf",
  },
  {
    id: "2",
    name: "[NAME OF FILE 2]",
    type: "Product List",
    file_extension: "pdf",
  },
];
const ItemReview = () => {
  const [selectedFileId, setSelectedFileId] = useState("1");

  const handleSelectFile = (id: string) => {
    setSelectedFileId(id);
  };

  return (
    <div>
      <Header
        filesData={mockFilesData}
        selectedFileId={selectedFileId}
        handleSelectFile={handleSelectFile}
      />
      <Body showOptions={selectedFileId === "1"} />
    </div>
  );
};

export default ItemReview;
