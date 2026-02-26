"use client";
import { useUser } from "@/context/UserContext";
import {
  getChatMessages,
  streamAssistantMessage,
} from "@/services/assistantService";
import { Input } from "antd";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import Draggable from "react-draggable";

interface Message {
  role: "user" | "assistant";
  content: string;
  creator: string;
}

const AiChat = ({
  isChatOpen,
  closeChat,
  chatId,
  creator,
  currentItemId,
  retrieveData,
}: {
  isChatOpen: boolean;
  closeChat: () => void;
  chatId: number;
  creator: string;
  currentItemId?: string | null;
  retrieveData: () => void;
}) => {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputTextRef = useRef(inputText);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  const { first_name, company } = useUser();

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await getChatMessages(chatId);
        if (Array.isArray(data)) {
          const mapped: Message[] = data.map((msg) => ({
            role: msg.openai_role === "assistant" ? "assistant" : "user",
            content: msg.content,
            creator: msg.creator,
          }));
          setMessages(mapped);
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    };

    loadMessages();
  }, [chatId]);

  const handleSubmit = useCallback(
    async (input: string = inputTextRef.current) => {
      if (isLoadingMessages) return;
      const trimmed = input.trim();
      if (!trimmed) return;
      setIsLoadingMessages(true);

      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed, creator },
      ]);
      setInputText("");

      let assistantMessage = "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", creator },
      ]);

      await streamAssistantMessage(
        {
          chat_id: chatId,
          creator,
          content: trimmed,
          current_item_id: currentItemId ?? null,
        },
        (chunk) => {
          assistantMessage += chunk;
          setMessages((prev) =>
            prev.map((msg, index) =>
              index === prev.length - 1
                ? { ...msg, content: assistantMessage }
                : msg,
            ),
          );
        },
        () => {
          retrieveData();
        },
      );
      setIsLoadingMessages(false);
    },
    [chatId, creator, currentItemId],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSubmit]);

  return (
    <Draggable
      handle=".drag-handle"
      cancel="textarea, input, .no-drag"
      bounds={{
        left: -window.innerWidth + 260,
        right: 0,
        top: 0,
        bottom: 150,
      }}
      onStart={() => setIsDragging(true)}
      onStop={() => setIsDragging(false)}
    >
      <div className="drag-handle">
        <div
          className={`flex flex-col justify-between bg-white rounded-xl shadow-lg w-[500px] overflow-hidden z-[9999] transition-all duration-300 top-8 right-0 ${
            isChatOpen
              ? "h-[80vh] border border-primaryN20 shadow-md pt-8"
              : "h-0"
          }`}
          style={{
            position: "absolute",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          <div
            className="absolute flex items-center justify-center right-0 top-0 m-2 text-primaryN900 cursor-pointer hover:bg-primaryN20 h-6 w-6 rounded-full no-drag"
            onClick={closeChat}
          >
            x
          </div>
          <div
            className={`mx-10 mt-3 overflow-auto scrollbar-hidden flex flex-col gap-3 h-full no-drag cursor-default ${
              !messages.length && "justify-center"
            }`}
          >
            <div
              className={`flex gap-4 items-start w-11/12 mb-4 justify-self-start`}
            >
              <Image
                src="/assets/logos/lucius-circle-logo.svg"
                alt="logo"
                width={34}
                height={34}
                className="mt-4"
              />
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1 text-lg text-primaryN900">
                  <p>Hello, {first_name || "[Name]"}</p>
                  <p>How can I help you today?</p>
                </div>
                <div className="text-sm text-grey-normal ml-1 whitespace-pre-wrap ">
                  Im your AI Latii Assistant, you can ask me to do things like:
                  "change all frame material to steel and generate a new quote",
                  or questions about our brands
                </div>
              </div>
            </div>
            {messages.map((message, index) => {
              const companyLogoUrl =
                company?.photo_url || "/assets/logos/forum-logo.png";
              const logoUrl =
                message.role === "assistant"
                  ? "/assets/logos/lucius-circle-logo.svg"
                  : companyLogoUrl;

              return (
                <div
                  ref={index === messages.length - 1 ? lastMessageRef : null}
                  key={index}
                  className={`flex gap-4 items-start w-11/12 mb-4 justify-self-start`}
                >
                  <Image
                    src={logoUrl}
                    alt="logo"
                    width={34}
                    height={34}
                    className="rounded-full h-8 w-8 object-cover"
                  />
                  <div className="flex flex-col gap-1">
                    <div className="text-base text-primaryN900">
                      <p>
                        {message.role === "user"
                          ? message.creator || "[Name]"
                          : "Lucius"}
                      </p>
                    </div>
                    <div className="text-sm text-black ml-1 whitespace-pre-wrap ">
                      {!message.content && (
                        <span className="text-center text-xs text-gray-500 h-4 animate-pulse">
                          Assistant is typing...
                        </span>
                      )}
                      <div>
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-8 flex items-center gap-8">
            <div className="flex items-center gap-6 w-10">
              {/* <Image
                src="/assets/icons/arrow-left-gray.svg"
                alt="arrow left icon"
                width={8}
                height={16}
                className="w-auto h-auto"
              />
              <Image
                src="/assets/icons/arrow-right-gray.svg"
                alt="arrow right icon"
                width={8}
                height={16}
                className="w-auto h-auto"
              /> */}
            </div>
            <div className="w-full flex gap-4 items-center min-h-9">
              <Input.TextArea
                placeholder="Type your questions or requests here"
                onChange={(e) => setInputText(e.target.value)}
                value={inputText}
                disabled={isLoadingMessages}
                className="h-9 scrollbar-hidden"
                autoSize={{ minRows: 1, maxRows: 5 }}
              />
              <Image
                src="/assets/icons/upload-ai-file.svg"
                alt="upload file to ai"
                width={64}
                height={64}
                className={`h-9 no-drag transition-all w-9  ${
                  inputText.length > 0
                    ? "cursor-pointer hover:opacity-80 duration-150"
                    : "cursor-default opacity-50 duration-500"
                }`}
                onClick={() => handleSubmit(inputText)}
              />
            </div>
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default AiChat;
