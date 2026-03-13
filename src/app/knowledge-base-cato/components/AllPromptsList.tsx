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
    <div className="w-[350px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-base text-grey-normal">All Prompts</span>
        <button
          className={`w-[80px] h-[26px] flex items-center text-xs justify-center rounded-lg transition-colors bg-forumBlue-light-hover text-forumBlue-dark-active`}
          onClick={onCreatePrompt}
        >
          <PlusOutlined className="text-xs" />
          <span className="ml-1">Prompt</span>
        </button>
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
    </div>
  );
};
