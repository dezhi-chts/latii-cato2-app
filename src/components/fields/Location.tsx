import RequiredHint from "./RequiredHint";
import LocationSelector from "../LocationSelector";
import { useState } from "react";
import ProjectSettings from "@/app/projects/[projectId]/components/Project-Settings";

// To use Location component, use <LocationSelector/> directly. This is only for preview purposes.

type LocationProps = {
  name?: string;
  required: boolean;
  hint_text?: string;
};

const Location = ({ name, required, hint_text = "" }: LocationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mockSettings, setMockSettings] = useState<any>({});

  const handleInputChange = (field: string, value: string) => {
    setMockSettings((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDropdownChange =
    <K extends keyof ProjectSettings["location"]>(field: K) =>
    (value: ProjectSettings["location"][K]) => {
      setMockSettings((prev: any) => ({
        ...prev,
        [field]: value,
      }));
    };

  return (
    <div className="max-w-80 flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <LocationSelector
        height="small"
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        projectSettings={mockSettings}
        handleInputChange={handleInputChange}
        handleDropdownChange={handleDropdownChange}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

export default Location;
