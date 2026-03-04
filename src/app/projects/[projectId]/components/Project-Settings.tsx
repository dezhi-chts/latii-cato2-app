import { useCompany } from "@/context/CompanyContext";
import { Input } from "antd";
import { useEffect, useState } from "react";
import { COMMIT_ON_BLUR, FIELD_COMPONENTS_BY_NUMBER } from "./Project-Form";
import RequiredHint from "@/components/fields/RequiredHint";

type ProjectSettingsProps = {
  project: any;
  handleUpdate: (settings: any) => void;
};

const ProjectSettings = ({ project, handleUpdate }: ProjectSettingsProps) => {
  const [settings, setSettings] = useState<any>({
    project_name: project?.project_name,
    is_favorite: false,
    project_desc: "",
    attributes: project?.attributes,
  });

  const { company } = useCompany();
  const attributes = company?.project_attributes ?? [];

  useEffect(() => {
    setSettings(project);
  }, [project]);

  const handleInputChange = (field: string, value: string) => {
    const fieldId = attributes.find((attr) => attr.label === field)?.uuid;

    setSettings((prev: any) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [fieldId]: value,
      },
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    const newSettings = { ...settings, is_favorite: false };
    newSettings[field] = value;
    setSettings(newSettings);
    handleUpdate(newSettings);
  };

  const updateProject = () => {
    const formattedSettings = {
      ...settings,
      is_favorite: false,
    };
    handleUpdate(formattedSettings);
  };

  function formatOptions(options: string[]) {
    if (!options.length) return [];
    const formatted = options.map((option: string) => ({
      value: option,
      label: option,
    }));
    return formatted;
  }

  return (
    <div className="py-4 flex">
      <div className="flex gap-6 flex-col flex-wrap max-h-[200px]">
        <div className="flex flex-col w-80 gap-2">
          <p className="text-sm">Project Name {RequiredHint(true)}</p>
          <Input
            placeholder="Input a recognizable name for you"
            className="rounded-md"
            value={settings?.project_name}
            onChange={(e) => handleInputChange("project_name", e.target.value)}
            onBlur={updateProject}
          />
        </div>

        {attributes.map((attr: any) => {
          if (!attr?.label) return null;

          const Component = FIELD_COMPONENTS_BY_NUMBER[attr?.type];
          if (!Component) return null;

          const options = attr?.metadata ?? [];
          const formattedOptions = formatOptions(options);
          const isNumber = attr?.type === 2;
          const value = settings?.attributes?.[attr?.uuid];
          const isBlur = COMMIT_ON_BLUR.has(attr?.type);

          return (
            <div key={attr.uuid} className="w-80">
              <Component
                name={attr.label}
                required={attr.required}
                hint_text={attr.has_hint_text ? attr.hint : undefined}
                options={formattedOptions}
                value={value}
                {...(isBlur
                  ? {
                      onChange: (e: any) => {
                        const value = isNumber
                          ? e.toString()
                          : (e.target.value ?? "");
                        handleInputChange(attr.label, value);
                      },
                      onBlur: () => updateProject(),
                    }
                  : {
                      onChange: (v: any) => handleSelectChange(attr.label, v),
                    })}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectSettings;
