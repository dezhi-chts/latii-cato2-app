/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal } from "antd";
import { useEffect, useState } from "react";
import Steps from "./Steps";
import CardsContainer from "./CardsContainer";
import Button from "@/components/Button";
import { HandleMultipleChanges } from "../../types/item";

export type Step = {
  name: SectionName;
  completed: boolean;
  is_current: boolean;
  id: number;
  selected_value: string;
  options?: any;
  is_disabled: boolean;
};

export type SectionName =
  | "profile_line"
  | "casting_style"
  | "material"
  | "glass_style"
  | "hardware_handle_style"
  | "installation_method"
  | "finish_method";

type NewItemModalProps = {
  closeModal: () => void;
  onCreate: () => void;
  item: any;
  handleSelectChange?: (
    value: any,
    index: number,
    field: string,
    units?: boolean,
    $unit_index?: number
  ) => void;
  isButtonEnabled?: boolean;
  index: number;
  handleMultipleChanges?: HandleMultipleChanges;
  defaultOpenSection?: SectionName;
};
export const NewItemModal = ({
  closeModal,
  onCreate,
  item,
  handleSelectChange,
  index,
  handleMultipleChanges,
  defaultOpenSection,
}: NewItemModalProps) => {
  const [stepsArray, setStepsArray] = useState<Step[]>([
    {
      name: "profile_line",
      completed: false,
      is_current: defaultOpenSection
        ? defaultOpenSection === "profile_line"
        : true,
      id: 1,
      selected_value: item.profile_line?.selected_value,
      options: item.profile_line.options,
      is_disabled: false,
    },
    {
      name: "casting_style",
      completed: false,
      is_current: defaultOpenSection === "casting_style" || false,
      id: 2,
      selected_value: item.casting_style?.selected_value,
      options: item.casting_style?.options,
      is_disabled: false,
    },
    {
      name: "material",
      completed: false,
      is_current: defaultOpenSection === "material" || false,
      id: 3,
      selected_value: item.material?.selected_value,
      options: item.material?.options,
      is_disabled: false,
    },
    {
      name: "glass_style",
      completed: false,
      is_current: defaultOpenSection === "glass_style" || false,
      id: 4,
      selected_value: item.glass_style?.selected_value,
      options: item.glass_style?.options,
      is_disabled: false,
    },
    {
      name: "hardware_handle_style",
      completed: false,
      is_current: defaultOpenSection === "hardware_handle_style" || false,
      id: 5,
      selected_value: "",

      is_disabled: false,
    },
    {
      name: "installation_method",
      completed: false,
      is_current: defaultOpenSection === "installation_method" || false,
      id: 6,
      selected_value: item.installation_method?.selected_value,
      options: item.installation_method?.options,
      is_disabled: false,
    },
  ]);

  useEffect(() => {
    refreshSteps();
  }, [item]);

  const checkIfStepIsCompleted = (name: SectionName): boolean => {
    switch (name) {
      case "profile_line":
        return !!item?.is_completed_profile_line;
      case "casting_style":
        return !!item?.is_completed_glazing_bead;
      case "material":
        return !!item?.is_completed_finish;
      case "glass_style":
        return !!item?.glass_style?.selected_value;
      case "hardware_handle_style":
        return !!item?.is_completed_hardware;
      case "installation_method":
        return !!item?.is_completed_installation;
      default:
        return false;
    }
  };

  const toggleCurrentStep = (id: number) => {
    const newStepsArray = stepsArray.map((step, index, arr) => {
      const isCurrent = step.id === id;

      const completed = checkIfStepIsCompleted(step.name);

      return {
        ...step,
        is_current: isCurrent,
        completed,
      };
    });

    setStepsArray(newStepsArray);
  };

  const refreshSteps = () => {
    const newStepsArray = stepsArray.map((step, index, arr) => {
      const isCompleted = checkIfStepIsCompleted(step.name);
      let isDisabled = false;

      if (index !== 0) {
        const prevStep = arr[index - 1];
        isDisabled = !checkIfStepIsCompleted(prevStep.name);
      }

      let updatedStep = { ...step };
      if (step.options?.length === 0) {
        const matched = getOptionsByStepName(step.name, item);
        if (matched) {
          updatedStep.options = matched.options ?? [];
          updatedStep.selected_value = matched.selectedValue;
        }
      }

      return {
        ...updatedStep,
        completed: isCompleted,
        is_disabled: isDisabled,
      };
    });
    setStepsArray(newStepsArray);
  };

  const getOptionsByStepName = (stepName: SectionName, item: any) => {
    const optionsArray = [
      {
        stepName: "casting_style",
        options: item.casting_style?.options,
        selectedValue: "",
      },
      {
        stepName: "material",
        options: item.material?.options,
        selectedValue: "",
      },
      {
        stepName: "glass_style",
        options: item.glass_style?.options,
        selectedValue: "",
      },
    ];

    return optionsArray.find((opt) => opt.stepName === stepName);
  };

  const setSelectedValue = (
    section: SectionName,
    value: string,
    isUnit: boolean = false
  ) => {
    const newStepsArray = stepsArray.map((step) => {
      if (step.options?.length === 0) {
        const matched = getOptionsByStepName(step.name, item);

        if (matched) {
          return {
            ...step,
            options: matched.options ?? [],
            selected_value: matched?.selectedValue,
          };
        }
      }

      if (step.name !== section)
        return {
          ...step,
        };

      return {
        ...step,
        selected_value: value,
      };
    });
    setStepsArray(newStepsArray);
    if (handleSelectChange) {
      handleSelectChange(value, index, section, isUnit);
    }
  };

  return (
    <Modal
      open={true}
      onOk={onCreate}
      onCancel={closeModal}
      title={
        <div className="text-sm">
          <p className="text-primaryN900 font-semibold">Item Customization</p>
          <p className="text-basicGray font-normal">
            Customize your frame, glass, hardware and installation adjusted to
            all your special needs. Select your options for each section.
          </p>
        </div>
      }
      footer={null}
      centered
      width={1300}
      styles={{
        content: { height: "90vh" },
        body: { overflowY: "auto", zoom: 0.8 },
      }}
    >
      <div className="h-[90vh] flex flex-col justify-between">
        <div className="pt-8">
          <Steps
            steps={stepsArray}
            toggleCurrentStep={toggleCurrentStep}
            isCortizo={
              item?.frame_material?.selected_value === "Spazio-Aluminum"
            }
            shouldShowHardware={item.units?.some(
              (unit: any) => unit?.is_have_hardware_section
            )}
          />
          <div className="w-full flex justify-center ">
            <CardsContainer
              section={
                stepsArray.find((step) => step.is_current)?.name ||
                "profile_line"
              }
              setSelectedValue={setSelectedValue}
              options={stepsArray.find((step) => step.is_current)?.options}
              selectedValue={
                stepsArray.find((step) => step.is_current)?.selected_value
              }
              item={item}
              index={index}
              handleSelectChange={handleSelectChange}
              handleMultipleChanges={handleMultipleChanges}
            />
          </div>
        </div>
        <div className="w-full flex justify-center">
          <Button
            onClick={() => {
              onCreate();
              closeModal();
            }}
          >
            Confirm Specifications
          </Button>
        </div>
      </div>
    </Modal>
  );
};
