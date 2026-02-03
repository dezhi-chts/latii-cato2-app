"use client";

import React from "react";
import Button from "@/components/Button";
import { FieldBox } from "./Field-Box";
import { ConfigProvider, Divider } from "antd";
import ShortText from "@/components/fields/ShortText";
import Selector from "@/components/fields/Selector";
import LongText from "@/components/fields/LongText";
import Numbers from "@/components/fields/Numbers";
import DateInput from "@/components/fields/DateInput";
import Switch from "@/components/fields/Switch";
import { ProjectInputTypesOptions } from "@/types/settings";
import Weblink from "@/components/fields/Link";
import Checkbox from "@/components/fields/Checkbox";
import Radio from "@/components/fields/Radio";
import Location from "@/components/fields/Location";
import UploadFiles from "@/components/fields/UploadFiles";

type MockField = {
  id: number;
  name: string;
  type: ProjectInputTypesOptions;
  required: boolean;
  has_hint_text: boolean;
  hint_text?: string;
  options?: string[];
};

const ProjectsSettings = () => {
  const mockedFields: MockField[] = [
    {
      id: 1,
      name: "Short Text Example",
      type: "short_text",
      required: true,
      has_hint_text: true,
      hint_text: "Write a short text here",
    },
    {
      id: 2,
      name: "Selector Example",
      type: "selector",
      required: true,
      has_hint_text: true,
      hint_text: "Select option here",
    },
    {
      id: 3,
      name: "Long Text Example",
      type: "long_text",
      required: false,
      has_hint_text: true,
      hint_text: "Write a description here",
    },
    {
      id: 4,
      name: "Numbers Example",
      type: "numbers",
      required: false,
      has_hint_text: false,
    },
    {
      id: 5,
      name: "Date Example",
      type: "date",
      required: true,
      has_hint_text: false,
    },
    {
      id: 6,
      name: "Is Active",
      type: "switch",
      required: false,
      has_hint_text: false,
      hint_text: "Switch",
    },
    {
      id: 7,
      name: "Web Link",
      type: "link",
      required: false,
      has_hint_text: true,
      hint_text: "Website",
    },
    {
      id: 8,
      name: "Checkbox",
      type: "checks",
      required: false,
      has_hint_text: false,
      options: ["option1", "option2", "option3"],
    },
    {
      id: 9,
      name: "Radios",
      type: "radios",
      required: false,
      has_hint_text: false,
      options: ["option1", "option2", "option3"],
    },
    {
      id: 10,
      name: "Location",
      type: "location",
      required: true,
      has_hint_text: false,
    },
    {
      id: 11,
      name: "Upload Files",
      type: "upload_files",
      required: true,
      has_hint_text: true,
      hint_text: "Upload files here",
    },
  ];

  const fieldsCount = mockedFields.length;

  const gridConfig =
    fieldsCount <= 7
      ? { cols: 1, rows: fieldsCount }
      : fieldsCount <= 10
      ? { cols: 2, rows: 5 }
      : { cols: 2, rows: Math.ceil(fieldsCount / 2) };

  const isWide = fieldsCount > 7;

  const FIELD_COMPONENTS: Record<
    ProjectInputTypesOptions,
    (props: any) => React.ReactNode
  > = {
    short_text: (props) => <ShortText {...props} />,
    selector: (props) => <Selector {...props} />,
    long_text: (props) => <LongText {...props} />,
    numbers: (props) => <Numbers {...props} />,
    date: (props) => <DateInput {...props} />,
    switch: (props) => <Switch {...props} />,
    link: (props) => <Weblink {...props} />,
    checks: (props) => <Checkbox {...props} />,
    radios: (props) => <Radio {...props} />,
    location: (props) => <Location {...props} />,
    upload_files: (props) => <UploadFiles {...props} />,
  };

  return (
    <div className="flex gap-20 mb-10 mt-[-20px]">
      <ConfigProvider
        theme={{
          components: {
            Switch: {
              colorPrimary: "#02A960",
              colorPrimaryHover: "#028C50",
            },
          },
        }}
      >
        <div className="w-5/12 flex flex-col gap-8">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <p className="text-baseDark text-base">Project Information</p>

              <p className="text-xs text-basicGray">
                This is the project information requested for all projects. Pick
                up to 10 fields.
              </p>
            </div>
            <Button
              backgroundColor="forumBlue"
              className="rounded-md !px-4 !py-1"
            >
              + Add Field
            </Button>
          </div>

          <div className="overflow-auto max-h-[65vh] scrollbar-hidden">
            <div className="flex flex-col gap-6">
              {mockedFields.map((field: any, index: number) => (
                <FieldBox
                  key={`${field.type}-${field.name}-${index}`}
                  {...field}
                />
                /* Falta agregar Onchange , etc de metodos*/
              ))}
            </div>
          </div>
        </div>

        <Divider type="vertical" className="h-auto" />

        <div className="w-7/12">
          <div className="flex flex-col gap-1">
            <p className="text-baseDark text-base">Preview</p>

            <p className="text-xs text-basicGray">
              This will be all available information from a project
            </p>
          </div>

          <div
            className={`mt-6 border-primaryN30 border rounded-lg p-6 transition-all
            ${isWide ? "w-5/6 max-w-4xl" : "w-4/6 max-w-2xl"}
          `}
          >
            <div className="flex gap-4 items-center pb-6">
              <svg
                width="26"
                height="26"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 4.5H13.5C13.8978 4.5 14.2794 4.65804 14.5607 4.93934C14.842 5.22064 15 5.60218 15 6V13.5C15 13.8978 14.842 14.2794 14.5607 14.5607C14.2794 14.842 13.8978 15 13.5 15H4.5"
                  stroke="#427CCE"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 13.5C3 13.8978 3.15804 14.2794 3.43934 14.5607C3.72064 14.842 4.10218 15 4.5 15C4.89782 15 5.27936 14.842 5.56066 14.5607C5.84196 14.2794 6 13.8978 6 13.5C6 13.1022 5.84196 12.7206 5.56066 12.4393C5.27936 12.158 4.89782 12 4.5 12C4.10218 12 3.72064 12.158 3.43934 12.4393C3.15804 12.7206 3 13.1022 3 13.5Z"
                  stroke="#427CCE"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 13.5V4.5C6 4.10218 5.84196 3.72064 5.56066 3.43934C5.27936 3.15804 4.89782 3 4.5 3C4.10218 3 3.72064 3.15804 3.43934 3.43934C3.15804 3.72064 3 4.10218 3 4.5V13.5"
                  stroke="#427CCE"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <p className="text-forumBlue">Create New Project</p>
            </div>

            {/* <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${gridConfig.rows}, auto)`,
                // ✅ 1 col: normal; 2 col: llena hacia abajo y salta de columna
                gridAutoFlow: gridConfig.cols === 1 ? "row" : "column",
              }}
            > */}
            <div
              className={
                gridConfig.cols === 1 ? "space-y-4" : "columns-2 gap-4"
              }
            >
              {mockedFields.map((field: any, index: number) => {
                const type = field.type as ProjectInputTypesOptions;
                const RenderComponent = FIELD_COMPONENTS[type];
                if (!RenderComponent) return null;

                const props = {
                  name: field.name,
                  required: field.required,
                  hint_text: field.hint_text,
                  options: field?.options || undefined,
                };

                return (
                  <div
                    key={`${field.type}-${field.name}-${index}`}
                    className="w-full break-inside-avoid mb-4"
                  >
                    {RenderComponent(props)}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end w-full mt-6 max-w-80">
              <Button
                backgroundColor="forumBlue"
                className="rounded-md !px-4 !py-1"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      </ConfigProvider>
    </div>
  );
};

export default ProjectsSettings;
