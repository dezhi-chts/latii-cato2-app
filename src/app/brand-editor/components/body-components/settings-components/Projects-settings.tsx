"use client";

import Button from "@/components/Button";
import { div } from "framer-motion/m";
import { FieldBox } from "./Field-box";
import { ProjectField } from "@/types/settings";

const ProjectsSettings = () => {
  const mockedFields = [
    {
      id: 1,
      name: "Project Name",
      type: "short_text",
      required: true,
      has_hint_text: true,
      hint_text: "Project Name",
    },
    {
      id: 2,
      name: "Location",
      type: "location",
      required: true,
      has_hint_text: false,
    },
  ];

  return (
    <div className="flex gap-10">
      <div className="w-1/2">
        <p>Project Information</p>

        <div className="flex justify-between">
          <p>
            {" "}
            This is the project information requested for all projects. Pick up
            to 10 fields.
          </p>
          <Button>+ Add Field</Button>
        </div>
        <div className="flex flex-col gap-2">
          {mockedFields.map((field: any) => (
            <FieldBox key={field.id} {...field} />
            /* Falta agregar Onchange , etc de metodos*/
          ))}
        </div>
      </div>
      <div className="w-1/2">
        <p>Preview</p>

        <p>This will be all available information from a project.</p>

        <div>
          <p>Create New Project</p>
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
