import { Input } from "antd";
import QuestionsManagement from "./QuestionsManagement";
import Image from "next/image";
import { useRef, useState } from "react";

type ChatProps = {
  isOpen: boolean;
};

type Message = {
  creator: string;
  content: string;
};

const messages: Message[] = [
  {
    creator: "user",
    content: "What’s special about our Bellavista steel products?",
  },
  {
    creator: "lucius",
    content: "Response to what is special about our Bellavista steel products",
  },
];

const ChatContainer = ({ isOpen }: ChatProps) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [loadingResponse, setLoadingResponse] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const containerWidthClassname = isOpen
    ? "w-[calc(90vw-100px)]"
    : "w-[calc(90vw-430px)]";
  const chatWidthClassname = isOpen
    ? "w-[calc(90vw-450px)]"
    : "w-[calc(90vw-780px)]";

  const messageWidthClassname = isOpen
    ? "w-[calc(90vw-650px)]"
    : "w-[calc(90vw-980px)]";

  function handleSendMessage(message: string) {
    if (!message) return;
    setLoadingResponse(true);

    messages.push({
      creator: "user",
      content: message,
    });
    setTimeout(() => {
      handleScrollToBottom();
    }, 50);

    setTimeout(() => {
      messages.push({
        creator: "lucius",
        content: `Response to ${message}`,
      });
      setLoadingResponse(false);
      handleScrollToBottom();
    }, 2500);

    setInputValue("");
  }

  return (
    <div
      className={`${containerWidthClassname} border-primaryN30 border rounded-xl h-full flex transition-all duration-700 ease-in-out`}
    >
      <div
        className={`${chatWidthClassname} transition-all duration-700 ease-in-out flex flex-col`}
      >
        <div
          className={`w-full rounded-t-xl p-4 h-[42px] cursor-pointer border-b border-b-primaryN30 flex items-center`}
        >
          <p className="text-xs font-light  text-grey-normal">Chat</p>
        </div>
        <div className="flex flex-col gap-8 p-8 max-h-[60vh] overflow-auto scrollbar-hidden">
          {messages.map((message, index) => {
            const isAiMessage = message.creator === "lucius";

            if (isAiMessage) {
              return (
                <div key={index} className="flex gap-3 ">
                  <div className="h-8 w-8 rounded-full bg-primaryN20 flex justify-center items-center">
                    <Image
                      src="/assets/logos/lucius-new-logo.png"
                      alt="AI Lucius Logo"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p
                      className={`${messageWidthClassname} font-light text-xs transition-all duration-700 ease-in-out`}
                    >
                      {message.content}
                    </p>
                    {/* <div className="flex gap-1">
                      <Image
                        src="/assets/icons/thumbs-down.svg"
                        alt="thumbs down icon"
                        width={17}
                        height={16}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <Image
                        src="/assets/icons/thumbs-up.svg"
                        alt="thumbs up icon"
                        width={17}
                        height={16}
                        className="w-5 h-5 cursor-pointer"
                      />
                    </div> */}
                  </div>
                </div>
              );
            }

            return (
              <div key={index} className="flex justify-end text-end">
                <div
                  className={`${messageWidthClassname} font-light text-xs flex justify-end `}
                >
                  <p className="bg-primaryN20 py-1 px-2.5 rounded-lg w-fit">
                    {message.content}
                  </p>
                </div>
              </div>
            );
          })}
          {loadingResponse && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primaryN20 flex justify-center items-center">
                <Image
                  src="/assets/logos/lucius-new-logo.png"
                  alt="AI Lucius Logo"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </div>
              <p className="animate-pulse text-grey-normal text-xs">
                Lucius is thinking...
              </p>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
        <Input
          className="mt-auto mb-6 mx-6 w-11/12 text-sm py-2"
          placeholder="Ask any questions to test your sources"
          value={inputValue}
          disabled={loadingResponse}
          onChange={(e) => setInputValue(e.target.value)}
          suffix={
            <Image
              src="/assets/icons/send-lucius-message.svg"
              alt="send message button"
              width={21}
              height={21}
              className={`${
                !loadingResponse && "cursor-pointer hover:opacity-90"
              }`}
              onClick={() => handleSendMessage(inputValue)}
            />
          }
        />
      </div>
      <QuestionsManagement handleSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer;
