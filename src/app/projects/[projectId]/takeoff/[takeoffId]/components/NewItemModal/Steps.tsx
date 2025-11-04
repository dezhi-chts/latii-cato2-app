import { Checkbox, ConfigProvider } from "antd";
import { Step } from "./Modal";

type StepsProps = {
  steps: Step[];
  toggleCurrentStep: (id: number) => void;
  isCortizo?: boolean;
  shouldShowHardware?: boolean;
};

const labelMap: Record<string, string> = {
  profile_line: "Line",
  casting_style: "Glazing Bead",
  material: "Finish",
  glass_style: "Glass",
  hardware_handle_style: "Hardware",
  installation_method: "Installation",
};

export const getLabelFromKey = (key: string): string => {
  return labelMap[key] || key;
};

const Steps = ({
  steps,
  toggleCurrentStep,
  isCortizo = false,
  shouldShowHardware = true,
}: StepsProps) => {
  const getItemName = (step: Step) => {
    return step.options?.find(
      (option: { value: string }) => option.value === step.selected_value
    )?.text;
  };

  return (
    <div className="flex gap-4 text-sm justify-center">
      {steps.map((step, index) => {
        if (isCortizo && step.name === "casting_style") return null;
        if (!shouldShowHardware && step.name === "hardware_handle_style")
          return null;
        return (
          <div
            key={index}
            className={`
            ${
              step.is_disabled
                ? "opacity-60 bg-gray-200 cursor-not-allowed"
                : step.is_current
                ? "bg-primaryN900 hover:opacity-90 cursor-pointer"
                : "bg-white border border-primaryN30 hover:bg-gray-100 cursor-pointer"
            } rounded-lg flex items-center gap-2.5 w-44 px-3 py-2`}
            onClick={() => {
              if (step.is_disabled) return;
              toggleCurrentStep(step.id);
            }}
          >
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: "#2A845A",
                },
              }}
            >
              <Checkbox checked={step.completed} disabled={step.is_disabled} />
            </ConfigProvider>
            <div className="flex flex-col gap-1">
              <p
                className={`${step.completed && "text-accentGreen"} ${
                  step.is_current ? "text-white" : "text-lushAqua"
                } font-semibold`}
              >
                {getLabelFromKey(step.name)}
              </p>
              <p
                className={`${
                  step.is_current ? "text-white" : "text-basicGray"
                }`}
              >
                {step.selected_value ? getItemName(step) : "Select"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Steps;
