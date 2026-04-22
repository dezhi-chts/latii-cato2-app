import { Feedback, Message } from "@/types/ask-lucius";
import Image from "next/image";
import { useRef, useState } from "react";
import ThumbsContainer from "./ThumbsContainer";
import { Input } from "antd";

const mockMessages: Message[] = [
  {
    role: "user",
    content: "What's special about our Bellavista steel products?",
    creator: "user",
  },
  {
    role: "assistant",
    content: "Response to What's special about our Bellavista steel products",
    creator: "assistant",
  },
];

const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleChangeFeedback = (messageIndex: number, feedback: Feedback) => {
    setMessages((prev) => {
      const next = [...prev];
      const current = next[messageIndex].response_feedback;

      next[messageIndex].response_feedback =
        current === feedback ? undefined : feedback;

      return next;
    });
  };

  const handleSendMessage = () => {
    handleScrollToBottom();
    const newMessagesArray = [...messages];
    const newMessage: Message = {
      role: "user",
      content: inputValue,
      creator: "user",
    };
    setMessages([...newMessagesArray, newMessage]);
    setInputValue("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const newMessagesArray = [...messages, newMessage];
      const newResponse: Message = {
        role: "assistant",
        content: `Response to ${inputValue}`,
        creator: "assistant",
      };
      newMessagesArray.push(newResponse);
      setMessages(newMessagesArray);
      setIsLoading(false);
      handleScrollToBottom();
    }, 1500);
  };

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="h-full border-primaryN30 border rounded-xl">
      <div className="flex items-center justify-between w-full p-10 flex-col h-full">
        <div className="flex justify-center items-center max-w-[800px] w-full max-h-[90%] overflow-auto scrollbar-hidden flex-col gap-12">
          {messages.map((message, index) => {
            const isUserMessage = message.role === "user";
            const defaultClassName = "text-xs font-light text-black";

            if (isUserMessage)
              return (
                <div key={index} className="ml-auto">
                  <p className={defaultClassName}>{message.content}</p>
                </div>
              );

            return (
              <div key={index} className="mr-auto flex gap-4">
                <div>
                  <Image
                    src="/assets/logos/lucius-new-logo.png"
                    alt="Lucius Logo"
                    width={23}
                    height={23}
                  />
                </div>
                <div className="flex flex-col gap-4 pt-0.5">
                  <p className={defaultClassName}>{message.content}</p>
                  <ThumbsContainer
                    messageIndex={index}
                    handleChangeFeedback={handleChangeFeedback}
                    message={message}
                  />
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="mr-auto flex gap-4">
              <div>
                <Image
                  src="/assets/logos/lucius-new-logo.png"
                  alt="Lucius Logo"
                  width={23}
                  height={23}
                />
              </div>
              <div className="pt-0.5">
                <p className="text-xs font-light italic text-grey-normal animate-pulse">
                  Lucius is thinking…
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <Input
          value={inputValue}
          disabled={isLoading}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask any questions to test your sources"
          className="max-w-[800px] h-12 border-primaryN30 rounded-lg"
          suffix={
            <Image
              className={`${
                inputValue
                  ? "cursor-pointer hover:opacity-90"
                  : "cursor-default opacity-40"
              }`}
              onClick={() => {
                if (isLoading || !inputValue) return;
                handleSendMessage();
              }}
              src="/assets/icons/send-lucius-message.svg"
              alt="send message"
              width={21}
              height={21}
            />
          }
        />
      </div>
    </div>
  );
};

export default ChatContainer;
