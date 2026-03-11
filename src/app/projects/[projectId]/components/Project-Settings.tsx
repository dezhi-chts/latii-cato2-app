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
    is_favorite: project?.is_favorite,
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
    const fieldId = attributes.find((attr) => attr.label === field)?.uuid;
    if (!fieldId) return;

    const newSettings = {
      ...settings,
      attributes: {
        ...settings.attributes,
        [fieldId]: value,
      },
    };
    setSettings(newSettings);
    if (isThereEmptyRequiredFields(newSettings)) return;
    handleUpdate(newSettings);
  };

  const updateProject = () => {
    if (isThereEmptyRequiredFields(settings)) return;
    handleUpdate(settings);
  };

  const isThereEmptyRequiredFields = (newSettings: any) => {
    const requiredFields = attributes.filter((attr) => attr.required);
    const requiredFieldsValues = requiredFields.map(
      (attr) => newSettings?.attributes?.[attr.uuid],
    );

    const hasEmptyFields = requiredFieldsValues.some((value) => !value);

    return hasEmptyFields;
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

          const isNumber = attr?.type === 2;
          const value = settings?.attributes?.[attr?.uuid];
          const isBlur = COMMIT_ON_BLUR.has(attr?.type);

          const metadata = attr?.metadata ?? [];

          const hasOptions = metadata.length > 0;

          const options = hasOptions ? JSON.parse(metadata[0]) : [];

          console.log(options);

          const isMultiple = metadata.length > 1 && metadata[1] === "multiple";

          const isRadio = attr.type === 5;

          return (
            <div key={attr.uuid} className="w-80">
              <Component
                name={attr.label}
                required={attr.required}
                hint_text={attr.has_hint_text ? attr.hint : undefined}
                options={options}
                value={value}
                is_multiple={isMultiple}
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
                      onChange: (v: any) =>
                        handleSelectChange(
                          attr.label,
                          isRadio ? v.target.value : v,
                        ),
                    })}
              />
              {attr.required && !value && (
                <p className="text-red-normal pt-1 text-xs">
                  * This field can't be empty
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectSettings;
