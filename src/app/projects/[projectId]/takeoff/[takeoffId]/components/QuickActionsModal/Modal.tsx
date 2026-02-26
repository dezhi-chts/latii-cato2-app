import Button from "@/components/Button";
import { getQuoteOptions } from "@/services/projectService";
import { QuickActionsForm } from "@/types/project";
import { ConfigProvider, Modal, Radio, Select, Spin } from "antd";
import { p } from "framer-motion/m";
import Image from "next/image";
import { Key, useEffect, useState } from "react";

type QuickActionsModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleQuickActions: (form: QuickActionsForm) => void;
  items?: any;
  loading?: boolean;
};

export type Action = "frame" | "glass" | "installation";
type Item = {
  value: string;
  text: string;
  children?: Item[];
  type?: string;
  type_text?: string;
};
const initialFormValues: QuickActionsForm = {
  item_ids: [],
  frame_brand: null,
  frame_brand_text: null,
  profile_line: null,
  profile_line_text: null,
  frame_material: null,
  frame_material_text: null,
  finish_method: null,
  finish_method_text: null,
  color: null,
  glass_style: null,
  glass_style_text: null,
  glass_specification: null,
  glass_specification_text: null,
  glass_air_type: null,
  glass_air_type_text: null,
  installation_method: null,
  installation_method_text: null,
  installation_glazed: null,
  installation_glazed_text: null,
  installation_nailing_fin: null,
  installation_nailing_fin_text: null,
};

type RecursiveSelectProps = {
  data: Item[];
  formValues: QuickActionsForm;
  setFormValues: React.Dispatch<React.SetStateAction<QuickActionsForm>>;
  selectedPath: string[];
  setSelectedPath: (path: string[]) => void;
};

const QuickActionsModal = ({
  open,
  setOpen,
  handleQuickActions,
  items,
  loading,
}: QuickActionsModalProps) => {
  const actions: Action[] = ["frame", "glass", "installation"];

  const [selectedAction, setSelectedAction] = useState<Action>("frame");

  const [frameOptions, setFrameOptions] = useState<any>([]);
  const [glassOptions, setGlassOptions] = useState<any>([]);
  const [installationOptions, setInstallationOptions] = useState<any>([]);
  const [selectedPaths, setSelectedPaths] = useState<Record<string, string[]>>({
    frame: [],
    glass: [],
    installation: [],
  });

  const [formValues, setFormValues] =
    useState<QuickActionsForm>(initialFormValues);

  useEffect(() => {
    if (!open) return;

    const optionsMap = {
      frame: { options: frameOptions, setter: setFrameOptions },
      glass: { options: glassOptions, setter: setGlassOptions },
      installation: {
        options: installationOptions,
        setter: setInstallationOptions,
      },
    };

    const current = optionsMap[selectedAction as keyof typeof optionsMap];

    if (current && current.options.length === 0) {
      fetchOptions(selectedAction, items, current.setter);
    }
  }, [open, selectedAction]);

  const fetchOptions = async (
    selectedAction: Action,
    items: any[],
    setFunction: any,
  ) => {
    const itemIds = items.map((item) => item.id);
    try {
      const newOptions = await getQuoteOptions(selectedAction, itemIds);
      setFunction(newOptions?.data || []);
    } catch (error) {
      console.error("Error fetching options", error);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      centered
      width={450}
    >
      <div className="flex flex-col gap-8 p-8 text-sm min-h-[350px] zoomed-container">
        <div>
          <p className="font-semibold text-primaryN900">Quick Actions Panel</p>
          <p className="font-light text-grey-normal">
            *Changes will be applied to all selected items.
          </p>
        </div>
        <div className="flex justify-around">
          {actions.map((action, index) => (
            <div
              key={index}
              className={`${
                selectedAction === action
                  ? "bg-primaryN900 text-white"
                  : "bg-primaryN20 text-grey-normal"
              } rounded-full px-6 text-center capitalize py-0.5 text-sm cursor-pointer font-light hover:opacity-80`}
              onClick={() => setSelectedAction(action)}
            >
              {action}
            </div>
          ))}
        </div>
        <div>
          <ConfigProvider
            theme={{
              components: {
                Select: {
                  borderRadius: 20,
                  fontSize: 12,
                  colorTextPlaceholder: "#717171",
                },
              },
            }}
          >
            {selectedAction == "frame" && (
              <RecursiveSelect
                data={frameOptions}
                formValues={formValues}
                setFormValues={setFormValues}
                selectedPath={selectedPaths.frame}
                setSelectedPath={(newPath) => {
                  setSelectedPaths((prev) => ({
                    ...prev,
                    frame: newPath,
                  }));
                }}
              />
            )}
            {selectedAction == "glass" && (
              <RecursiveSelect
                data={glassOptions}
                formValues={formValues}
                setFormValues={setFormValues}
                selectedPath={selectedPaths.glass}
                setSelectedPath={(newPath) =>
                  setSelectedPaths((prev) => ({
                    ...prev,
                    glass: newPath,
                  }))
                }
              />
            )}
            {selectedAction == "installation" && (
              <InstallationPanel
                data={installationOptions}
                formValues={formValues}
                setFormValues={setFormValues}
                selectedPath={selectedPaths.installation}
                setSelectedPath={(newPath) =>
                  setSelectedPaths((prev) => ({
                    ...prev,
                    installation: newPath,
                  }))
                }
              />
            )}
          </ConfigProvider>
        </div>
      </div>
      <div className="w-full flex justify-center self-end">
        <Button
          variant="outline"
          onClick={() => handleQuickActions(formValues)}
        >
          {loading ? <Spin /> : "Apply"}
        </Button>
      </div>
    </Modal>
  );
};

export default QuickActionsModal;

function RecursiveSelect({
  data,
  formValues,
  setFormValues,
  selectedPath,
  setSelectedPath,
}: RecursiveSelectProps) {
  if (data.length == 0) {
    return (
      <div className="w-full flex justify-center">
        <Spin size="large" />;
      </div>
    );
  }

  const getChildrenAtLevel = (level: number, items: Item[]): Item[] => {
    let currentItems = items;
    for (let i = 0; i < level; i++) {
      const selected = selectedPath[i];
      const found = currentItems.find((item) => item.value === selected);
      currentItems = found?.children ?? [];
    }
    return currentItems;
  };

  const getTypeTextAtLevel = (level: number, items: Item[]): string => {
    let currentItems = items;
    for (let i = 0; i < level; i++) {
      const selected = selectedPath[i];
      const found = currentItems.find((item) => item.value === selected);
      currentItems = found?.children ?? [];
    }
    return currentItems[0]?.type_text || "";
  };

  const handleChange = (level: number, value: string) => {
    const options = getChildrenAtLevel(level, data);
    const selectedItem = options.find((opt) => opt.value === value);

    const newPath = [...selectedPath.slice(0, level), value];
    setSelectedPath(newPath);

    if (selectedItem?.type) {
      const newValues = {
        ...formValues,
        [`${selectedItem.type}`]: selectedItem.value ?? null,
        [`${selectedItem.type}_text`]: selectedItem.text ?? null,
      };
      setFormValues(newValues);
    }
  };

  const levels = [];
  for (let i = 0; i <= selectedPath.length; i++) {
    const options = getChildrenAtLevel(i, data);
    if (!options || options.length === 0) break;
    const typeText = getTypeTextAtLevel(i, data);
    const type = getChildrenAtLevel(i, data)[0]?.type;
    const shouldBeEmpty = i === selectedPath.length;

    levels.push(
      <div key={i} className="flex items-center mb-2">
        <p className="w-5/12 text-xs text-grey-normal font-light">{typeText}</p>
        <Select
          style={{ width: 300 }}
          placeholder="Select option"
          value={
            type && !shouldBeEmpty
              ? formValues[type as keyof QuickActionsForm]
              : undefined
          }
          onChange={(value) => handleChange(i, value as string)}
        >
          {options.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.text}
            </Select.Option>
          ))}
        </Select>
      </div>,
    );
  }

  return <div>{levels}</div>;
}

function InstallationPanel({
  data,
  formValues,
  setFormValues,
}: RecursiveSelectProps) {
  const [selectedType, setSelectedType] = useState<string>(
    data[0]?.value || "",
  );

  useEffect(() => {
    if (selectedType || !data) return;
    setSelectedType(data[0]?.value || "");
  }, [data]);

  if (data.length == 0) {
    return (
      <div className="w-full flex justify-center">
        <Spin size="large" />;
      </div>
    );
  }

  const handleChange = (value: string, type: keyof QuickActionsForm) => {
    setFormValues((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleDirectionChange = (value: string[] | string) => {
    setFormValues((prev) => ({
      ...prev,
      installation_nailing_fin: value,
    }));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center">
        <p className="w-4/12 text-xs text-grey-normal font-light">Type</p>
        <Select
          placeholder="Select Option"
          className="w-8/12"
          value={formValues?.installation_method}
          onChange={(value) => handleChange(value, "installation_method")}
        >
          {data.map((item: any) => {
            return (
              <Select.Option key={item.value} value={item.value}>
                {item.text}
              </Select.Option>
            );
          })}
        </Select>
      </div>
      <div className="w-full flex justify-end">
        <div className="w-8/12">
          {formValues.installation_method === "nailing_fin" ? (
            <NailingFinsSelector
              onDirectionChange={handleDirectionChange}
              formValues={formValues}
            />
          ) : null}
        </div>
      </div>
      <div className="flex items-center mt-2">
        <p className="w-4/12 text-xs text-grey-normal font-light">Fixions</p>
        <Radio.Group
          onChange={(e) => handleChange(e.target.value, "installation_glazed")}
          value={formValues.installation_glazed}
          className="w-8/12"
        >
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
        </Radio.Group>
      </div>
    </div>
  );
}

const NailingFinsSelector = ({ onDirectionChange, formValues }: any) => {
  const directions = ["all", "top", "bottom", "left", "right"];
  const [selectedDirections, setSelectedDirections] = useState<string[]>(
    formValues?.installation_nailing_fin || ["all"],
  );

  const toggleDirection = (direction: string) => {
    setSelectedDirections((prev) => {
      const isSelected = prev.includes(direction);

      if (direction === "all") {
        onDirectionChange("all");
        return ["all"];
      }

      let filtered: string[];
      if (Array.isArray(prev)) {
        filtered = prev.filter((d) => d !== "all");
      } else {
        filtered = [];
      }

      let newSelection: string[];

      if (!isSelected && filtered.length === 3) {
        newSelection = ["all"];
      } else if (isSelected && filtered.length === 1) {
        newSelection = prev;
      } else {
        newSelection = isSelected
          ? filtered.filter((d) => d !== direction)
          : [...filtered, direction];
      }

      onDirectionChange(newSelection);
      return newSelection;
    });
  };

  return (
    <div className="flex gap-2 items-center">
      {directions.map((direction: string, index: Key | null | undefined) => {
        const isSelected = selectedDirections.includes(
          direction.trim().toLowerCase(),
        );
        console.log(direction, isSelected, selectedDirections);

        return (
          <div
            key={index}
            onClick={() => toggleDirection(direction)}
            className={`p-2 rounded-md cursor-pointer border border-primaryN20 hover:bg-primaryN20 ${
              isSelected ? "bg-primaryN30" : ""
            }`}
          >
            <Image
              src={`/assets/item-customization/installation/location/${direction}.svg`}
              alt={`${direction} nailing fin`}
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </div>
        );
      })}
    </div>
  );
};
