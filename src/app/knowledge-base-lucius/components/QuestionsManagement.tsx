import Button from "@/components/Button";
import { useState } from "react";

type QuestionsManagementProps = {
  handleSendMessage: (message: string) => void;
};

type Set = {
  name: string;
  questions: Question[];
};

type Question = {
  text: string;
  id: number;
};

const sets: Set[] = [
  {
    name: "Common",
    questions: [
      { id: 1, text: "What’s special about our Bellavista steel products?" },
      {
        id: 2,
        text: "What’s the maximum height and width for our EBE sliding door?",
      },
      {
        id: 3,
        text: "Can you walk me through the checklist before I start installation of OS2 65 double swing door? Please use number to label each step and make sure if you found a corresponding video and paste that video link for each step",
      },
    ],
  },
  {
    name: "Technical Set",
    questions: [
      {
        id: 1,
        text: "What is the recommended torque for the OS2 65 door hinges during installation?",
      },
      {
        id: 2,
        text: "How do you troubleshoot alignment issues with Bellavista sliding doors?",
      },
      {
        id: 3,
        text: "Which safety standards must be checked before performing maintenance on OS2 65 double swing doors?",
      },
    ],
  },
];

const QuestionsManagement = ({
  handleSendMessage,
}: QuestionsManagementProps) => {
  const [selectedSet, setSelectedSet] = useState("Common");
  const [selectedQuestionId, setSelectedQuestionId] = useState(1);
  const currentSet = sets.find((s) => s.name === selectedSet);

  function handleAskQuestion() {
    const currentQuestion = currentSet?.questions.find(
      (q) => q.id === selectedQuestionId,
    );
    if (currentQuestion?.text) handleSendMessage(currentQuestion?.text);
  }

  return (
    <div className="w-[350px] border-l border-primaryN30 p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-forumBlue-normal font-light text-xs">
          Question Set Management
        </p>
        <p className="text-grey-normal font-light text-xxs">
          Add as many questions as needed to as CATO every time you are testing.
        </p>
      </div>
      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-3 items-center overflow-auto scrollbar-hidden">
          {sets.map((set, index) => {
            const isSelected = selectedSet === set.name;
            return (
              <div key={index} className="flex flex-col">
                <div
                  className={`${
                    isSelected && "bg-primaryN30"
                  } text-xs font-light rounded-lg p-2.5 cursor-pointer`}
                  onClick={() => setSelectedSet(set.name)}
                >
                  <p className="truncate whitespace-nowrap">{set.name}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="w-8 ">
          <p className="font-light text-xs ml-auto bg-primaryN20 rounded-lg flex justify-center items-center w-5 h-5 cursor-pointer hover:bg-primaryN30">
            +
          </p>
        </div>
      </div>
      <div className="max-h-[50vh] overflow-auto flex flex-col gap-4 scrollbar-hidden">
        {currentSet &&
          currentSet.questions.map((question, index) => {
            const isSelected = selectedQuestionId === question.id;
            return (
              <div
                key={index}
                className={`border border-primaryN30 rounded-lg p-2.5 text-xs font-light cursor-pointer ${
                  isSelected && "bg-primaryN20"
                }`}
                onClick={() => setSelectedQuestionId(question.id)}
              >
                {question.text}
              </div>
            );
          })}
      </div>
      <FooterButtons handleAskQuestion={handleAskQuestion} />
    </div>
  );
};

export default QuestionsManagement;

type FooterButtonsProps = {
  handleAskQuestion: () => void;
};

const FooterButtons = ({ handleAskQuestion }: FooterButtonsProps) => {
  return (
    <div className="mt-auto flex flex-col gap-3">
      <Button
        variant="outline"
        borderColor="basicLightGray"
        className="!py-0.5 text-xs !text-grey-normal font-light"
      >
        + Add Question
      </Button>
      <Button
        backgroundColor="forumBlue-normal"
        className="!py-0.5 text-xs font-light"
        onClick={handleAskQuestion}
      >
        Ask Questions
      </Button>
    </div>
  );
};
