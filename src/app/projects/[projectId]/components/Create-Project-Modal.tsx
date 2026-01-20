"use client";
import { useEffect, useState } from "react";
import LocationSelector from "@/components/LocationSelector";
import { useProjects } from "@/context/ProjectsContext";
import { createProject } from "@/services/projectService";
import {
  CreateProjectModalProps,
  defaultProjectSettings,
  ProjectSettings,
  FieldType,
  CustomField,
} from "@/types/project";
import { Button, DatePicker, Input, Modal, Radio, Spin, Select, Checkbox, Switch, message } from "antd";
import type { UploadFile } from "antd/es/upload/interface";

import { useRouter } from "next/navigation";
import TakeoffUpload from "./Create-Takeoff/Takeoff-Upload";

const { Option } = Select;


const testFields: CustomField[] = [{
  field_name: 'project_name',
  field_type: FieldType.INPUT_TEXT,
  Hint_text: "Project Name",
  required: true,
}, {
  field_name: 'project_location',
  field_type: FieldType.LOCATION,
  Hint_text: "Primary Location",
  required: true,
}, {
  field_name: 'project_end_customer',
  field_type: FieldType.INPUT_TEXT,
  Hint_text: "End Customer(Optional)",
  required: false,
},
{
  field_name: 'project_date',
  field_type: FieldType.DATE,
  Hint_text: "Client Expected Delivery Date",
  required: true,
},
  // {
  //   field_name: 'project_award',
  //   field_type: FieldType.DROPDOWN,
  //   Hint_text: "Project Award Likelihood",
  //   field_options: ['High', 'Medium', 'Low'],
  //   required: false,
  // }, {
  //   field_name: 'project_desc',
  //   field_type: FieldType.TEXTAREA,
  //   Hint_text: "Project Description",
  //   required: false,
  // }, 
  // {
  //   field_name: 'project_number_test',
  //   field_type: FieldType.INPUT_NUMBER,
  //   Hint_text: "Project Number Test",
  //   required: false,
  // }, {
  //   field_name: 'project_radio_test',
  //   field_type: FieldType.RADIO,
  //   Hint_text: "Project Radio Test",
  //   field_options: ['test1', 'test2', 'test3'],
  //   required: false,
  // }, {
  //   field_name: 'project_checkbox_test',
  //   field_type: FieldType.CHECKBOX,
  //   Hint_text: "Project Checkbox Test",
  //   field_options: ['test1', 'test2', 'test3'],
  //   required: false,
  // }, {
  //   field_name: 'project_switch_test',
  //   field_type: FieldType.SWITCH,
  //   Hint_text: "Project Switch Test",
  //   required: false,
  // }
]
const CreateProjectModal = ({
  isOpen,
  closeModal,
  onSuccess,
}: CreateProjectModalProps) => {
  const { TextArea } = Input;
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    ...defaultProjectSettings,
  });
  const [loading, setLoading] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  const router = useRouter();

  const { refetchProjects, lastProjectId } = useProjects();

  const handleFieldChange = (field: string, value: any) => {
    setProjectSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isValidForm = () => {
    // 检测所有必填选项是否已经填写
    for (const field of testFields) {
      if (field.required && !projectSettings[field.field_name]) {
        return false;
      }
    }
    return true;
  }

  // 创建工程
  const handleProjectSubmit = async () => {
    console.log('######### handleProjectSubmit', projectSettings);
    if (!isValidForm()) {
      message.warning('Please fill in all required fields.');
      return;
    }
    return;
    setLoading(true);

    const keysToRemove = ["project_id", "order"];
    const newSettings = Object.fromEntries(
      Object.entries(projectSettings).filter(
        ([key]) => !keysToRemove.includes(key)
      )
    ) as ProjectSettings;

    try {
      const response = await createProject(newSettings);
      await refetchProjects();
      if (onSuccess) onSuccess();

      if (response?.status === "success" && lastProjectId) {
        setProjectSettings({ ...defaultProjectSettings });
        router.push(`/projects/${lastProjectId + 1}`);
      }
    } catch (error) {
      console.log(error);
    } finally {
      closeModal();
      setLoading(false);
    }
  };

  const renderField = (field: any) => {
    switch (field.field_type) {
      case FieldType.INPUT_TEXT:
        return (
          <div>
            <label className="text-sm">{field.Hint_text}
              {field.required && <label className="text-red-500">*</label>}
            </label>
            <div className="py-2">
              <Input
                className="rounded-md text-sm"
                value={projectSettings[field.field_name]}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                placeholder={field.Hint_text}
              />
            </div>
          </div>
        );
      case FieldType.INPUT_NUMBER:
        return (
          <div>
            <label className="text-sm">{field.Hint_text}
              {field.required && <label className="text-red-500">*</label>}
            </label>
            <div className="py-2">
              <Input
                className="rounded-md text-sm"
                type="number"
                value={projectSettings[field.field_name]}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                placeholder={field.Hint_text}
              />
            </div>
          </div>
        );
      case FieldType.TEXTAREA:
        return (
          <div>
            <label className="text-sm">{field.Hint_text}
              {field.required && <label className="text-red-500">*</label>}
            </label>
            <div className="py-2">
              <TextArea
                className="rounded-md text-ms"
                value={projectSettings[field.field_name]}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                placeholder={field.Hint_text}
                rows={4}
              />
            </div>
          </div>
        );
      case FieldType.DROPDOWN:
        return (
          <div>
            <label className="text-sm">{field.Hint_text}
              {field.required && <label className="text-red-500">*</label>}
            </label>
            <div className="py-2">
              <Select
                className="w-full rounded-full text-ms"
                value={projectSettings[field.field_name]}
                onChange={(value) => handleFieldChange(field.field_name, value)}
              >
                {field.field_options?.map((option: any) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        );
      case FieldType.CHECKBOX:
        return (
          <div>
            <label className="text-sm">{field.Hint_text}
              {field.required && <label className="text-red-500">*</label>}
            </label>
            <div className="py-2">
              <Checkbox.Group>
                {field.field_options?.map((option: any) => {
                  return (
                    <Checkbox
                      key={option}
                      value={option}
                      className="text-ms text-basicGray px-1"
                    >
                      {option}
                    </Checkbox>
                  );
                })}
              </Checkbox.Group>
            </div>

          </div>
        );
      case FieldType.RADIO:
        return (
          <div>
            <label className="text-sm">{field.Hint_text}
              {field.required && <label className="text-red-500">*</label>}
            </label>
            <div className="py-2">
              <Radio.Group
                value={projectSettings[field.field_name]}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              >
                {field.field_options?.map((option: any) => (
                  <Radio
                    key={option}
                    value={option}
                    className="text-ms text-basicGray px-1"
                  >
                    {option}
                  </Radio>
                ))}
              </Radio.Group>
            </div>
          </div>
        )
      case FieldType.SWITCH:
        return (
          <div>
            <label className="text-sm">{field.Hint_text}
              {field.required && <label className="text-red-500">*</label>}
            </label>
            <div className="py-2">
              <Switch
                className="text-ms text-basicGray px-1"
                checked={projectSettings[field.field_name]}
                onChange={(checked) => handleFieldChange(field.field_name, checked)}
              />
            </div>
          </div>
        )
      case FieldType.DATE:
        return (
          <div>
            <label className="text-sm">{field.Hint_text}
              {field.required && <label className="text-red-500">*</label>}
            </label>
            <div className="py-2">
              <DatePicker
                className="w-full"
                type="date"
                onChange={(date, dateString) => handleFieldChange(field.field_name, dateString)}
              />
            </div>
          </div>
        )
      case FieldType.LINK:
        return (
          <div>
            <label className="text-sm">{field.Hint_text}
              {field.required && <label className="text-red-500">*</label>}
            </label>
            <div className="py-2">
              <Input
                className="rounded-md text-ms"
                value={projectSettings[field.field_name]}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                placeholder={field.Hint_text}
              />
            </div>
          </div>
        )
      case FieldType.LOCATION:
        return (
          <div>
            <label className="text-sm">{field.Hint_text}
              {field.required && <label className="text-red-500">*</label>}
            </label>
            <div className="py-2">
              <LocationSelector
                handleInputChange={(locationField: any) => (event: any) => {
                  handleFieldChange(locationField, event.target.value)
                }}
                handleDropdownChange={(locationField: any) => (value: any) => {
                  handleFieldChange(locationField, value)
                }}
                projectSettings={projectSettings}
                isOpen={showLocationSelector}
                setIsOpen={setShowLocationSelector}
                onClose={() => setShowLocationSelector(false)}
                height="medium"
              ></LocationSelector>
            </div>
          </div>
        )
      default:
        return null;
    }
  };

  const handleUpload = (data: { archFiles: UploadFile[], quoteFiles: UploadFile[] }) => {
    console.log('######### handleUpload', data);
  }


  return (
    <Modal
      open={isOpen}
      title={
        <p className="ml-1 text-forumBlue text-lg font-semibold">Create New Project</p>
      }
      width={1250}
      footer={null}
      onCancel={closeModal}
    >
      <div className="mt-8 p-2 flex flex-row justify-between">
        <div className="w-[400px] max-h-[80vh] flex flex-col border border-basicLightGray rounded-md overflow-hidden">
          <div className="px-5 my-4 text-lg text-baseGray">Blank Template</div>
          <div className="px-5 py-2 overflow-y-auto">
            {
              <div className="flex flex-col gap-3">
                {testFields.map((field) => {
                  return <div key={field.field_name}>{renderField(field)}</div>;
                })}
              </div>
            }

          </div>
          <div className="flex-1 flex items-end justify-center">
            <Button
              onClick={handleProjectSubmit}
              type="primary"
              className="w-[124px] mb-4"
            >
              Create
            </Button>
          </div>
        </div>
        <div className="px-5 w-[720px] flex flex-col border border-basicLightGray rounded-md overflow-y-auto">
          <div className="my-4 text-lg text-baseGray">From Takeoff</div>
          <div className="flex-1">
            <TakeoffUpload onHandleUpload={handleUpload} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateProjectModal;
