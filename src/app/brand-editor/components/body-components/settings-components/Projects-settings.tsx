"use client";

import Button from "@/components/Button";
import { FieldBox } from "./Field-Box";
import { Divider } from "antd";
import ShortText from "@/components/fields/ShortText";
import Selector from "@/components/fields/Selector";

const ProjectsSettings = () => {
  const mockedFields = [
    {
      id: 1,
      name: "Project Name",
      type: "short_text",
      required: true,
      has_hint_text: true,
      hint_text: "Input a recognizable name for you.",
    },
    {
      id: 2,
      name: "Selector",
      type: "selector",
      required: true,
      has_hint_text: false,
      options: ["option1", "option2", "option3"],
    },
  ];

  const FIELD_COMPONENTS: Record<string, (props: any) => React.ReactNode> = {
    short_text: (props) => <ShortText {...props} />,
    selector: (props) => <Selector {...props} />,
  };

  return (
    <div className="flex gap-20">
      <div className="w-1/2 flex flex-col gap-8">
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
            className="rounded-md !px-4 !py-2"
          >
            + Add Field
          </Button>
        </div>
        <div className="overflow-auto max-h-[65vh] scrollbar-hidden">
          <div className="flex flex-col gap-6">
            {mockedFields.map((field: any) => (
              <FieldBox key={field.id} {...field} />
              /* Falta agregar Onchange , etc de metodos*/
            ))}
          </div>
        </div>
      </div>
      <Divider type="vertical" className="h-auto" />
      <div className="w-1/2">
        <p>Preview</p>
        <p>This will be all available information from a project.</p>
        <div>
          <p>Create New Project</p>
          {mockedFields.map((field) => {
            const RenderComponent = FIELD_COMPONENTS[field.type];

            if (!RenderComponent) {
              return null;
            }

            const props = {
              name: field.name,
              required: field.required,
              hint_text: field.hint_text,
              options: field?.options || undefined,
            };

            return <div key={field.id}>{RenderComponent(props)}</div>;
          })}

          <div className="flex gap-4 flex-col"></div>
          <div className="flex flex-end w-full">
            <Button>Create</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsSettings;
