"use client";

import ChatContainer from "./components/ChatContainer";
import Header from "./components/Header";

const AskLucius = () => {
  return (
    <div className="px-20 pb-10 pt-14 h-screen">
      <div className="flex flex-col gap-10 ">
        <div className="h-[4vh]">
          <Header />
        </div>
        <div className="h-[85vh]">
          <ChatContainer />
        </div>
      </div>
    </div>
  );
};

export default AskLucius;
