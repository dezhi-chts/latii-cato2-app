"use client";

import Button from "@/components/Button";
import { div } from "framer-motion/m";
import { useEffect, useState } from "react";

const prompts = [
  {
    id: 1,
    label: "Generalities",
    needs_review: false,
  },
  {
    id: 2,
    label: "Label",
    needs_review: false,
  },
  {
    id: 3,
    label: "Location",
    needs_review: false,
  },
  {
    id: 4,
    label: "Quantity",
    needs_review: false,
  },
  {
    id: 5,
    label: "Installation",
    needs_review: true,
  },
  {
    id: 6,
    label: "Type",
    needs_review: false,
  },
  {
    id: 7,
    label: "Width",
    needs_review: false,
  },
];
const PromptLibraryTab = () => {
  const [promptList, setPromptList] = useState<any>(prompts);
  const [selectedPrompt, setSelectedPrompt] = useState<number>(0);
  const [needReview, setNeedReview] = useState<number>(0);

  useEffect(() => {
    const count = promptList.filter((p: any) => p.needs_review).length;
    setNeedReview(count);
  }, [promptList]);

  return (
    <div className="pl-16 pt-10 flex gap-2 w-[90vw]">
      <div className="w-1/5">
        <div className="flex justify-between items-center pb-4">
          <p>All Prompts</p>
          <Button backgroundColor="primaryN20" color="grey-normal">
            <div className="flex gap-2">
              <span>Review</span>
              {needReview > 0 && (
                <div className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-dragonOrange px-1 text-xs text-white">
                  {needReview}
                </div>
              )}
            </div>
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {promptList.map((prompt: any, index: number) => (
            <div
              key={index}
              className={`flex justify-between items-center cursor-pointer w-full border border-primaryN30 rounded-md p-2 text-sm ${
                selectedPrompt === index ? "bg-forumBlue-light" : ""
              }`}
              onClick={() => setSelectedPrompt(index)}
            >
              <p>{prompt.label}</p>
              {prompt.needs_review && (
                <div className="bg-dragonOrange rounded-full w-2 h-2"></div>
              )}
            </div>
          ))}
        </div>
        <div>
          <Button>Create Prompt</Button>
        </div>
      </div>
      <div className="w-4/5"></div>
    </div>
  );
};

export default PromptLibraryTab;
