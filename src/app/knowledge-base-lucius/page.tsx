"use client";
import { useState } from "react";
import Header from "./components/Header";
import Sources from "./components/Sources";
import Chat from "./components/ChatContainer";

const Page = () => {
  const [isSourcesOpen, setIsSourcesOpen] = useState<boolean>(true);

  return (
    <div className="pl-10">
      <div className="flex items-center h-[15vh]">
        <Header />
      </div>
      <div className="h-[80vh] w-[90vw] flex gap-10">
        <Sources isOpen={isSourcesOpen} setIsOpen={setIsSourcesOpen} />
        <Chat isOpen={!isSourcesOpen} />
      </div>
    </div>
  );
};

export default Page;
