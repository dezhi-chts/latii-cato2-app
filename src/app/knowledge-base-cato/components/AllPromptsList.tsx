"use client";

import { PlusOutlined } from "@ant-design/icons";

interface PromptField {
  id: string;
  name: string;
  hasError?: boolean;
}

interface AllPromptsListProps {
  fields: PromptField[];
  selectedFieldId: string;
  onSelectField: (id: string) => void;
  onCreatePrompt: () => void;
}

export const AllPromptsList = ({
  fields,
  selectedFieldId,
  onSelectField,
  onCreatePrompt,
}: AllPromptsListProps) => {
  return (
    <div className="w-[300px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-base text-grey-normal">All Prompts</span>
        <div className="w-[96px] h-[24px] rounded-md flex justify-center items-center gap-2 bg-primaryN10">
          <span className="text-xxs text-grey-normal">Review</span>
          <span className="w-4 h-4 rounded-full bg-dragonOrange text-white text-[10px] flex items-center justify-center">
            3
          </span>
        </div>
      </div>

      {/* Field List */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2">
          {fields.map((field) => (
            <div
              key={field.name}
              className={`h-[30px] px-3 rounded-md cursor-pointer text-xs border border-primaryN30 flex items-center justify-between hover:bg-forumBlue-light ${selectedFieldId === field.name
                ? "bg-forumBlue-light-active"
                : ""
                }`}
              onClick={() => {
                onSelectField(field.name)
              }}
            >
              <span>{field.name}</span>
              {field.hasError && (
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Button */}
      <button
        className="mt-4 w-full py-2 bg-forumBlue-light rounded-md text-xs text-forumBlue-dark-active hover:border-forumBlue-normal hover:text-forumBlue-normal flex items-center justify-center gap-1"
        onClick={onCreatePrompt}
      >
        <PlusOutlined className="text-xs" />
        <span>Create Prompt</span>
      </button>
    </div>
  );
};
