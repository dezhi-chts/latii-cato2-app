import { forwardRef, useImperativeHandle } from "react";
import FormFieldItem from "./Form-Field-Item";
import { CustomField, FieldType } from "@/types/project";

const testFields: CustomField[] = [{
  field_name: 'project_name',
  field_type: FieldType.INPUT_TEXT,
  Hint_text: "Project Name",
  required: true,
}, {
  field_name: 'project_address',
  field_type: FieldType.INPUT_TEXT,
  Hint_text: "Primary Location",
  required: true,
  suffixIcon: '/assets/icons/location.svg'
},
  // {
  //   field_name: 'project_end_customer',
  //   field_type: FieldType.INPUT_TEXT,
  //   Hint_text: "End Customer(Optional)",
  //   required: false,
  // },
  // {
  //   field_name: 'project_date',
  //   field_type: FieldType.DATE,
  //   Hint_text: "Client Expected Delivery Date",
  //   required: true,
  // },
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

// 定义组件的对外接口类型
type ProjectFormHandle = {
  isValidForm: () => boolean;
};

interface ProjectFormProps {
  projectSettings: any;
  setProjectSettings: any;
  showOCRIcon?: boolean;
  OCRFieldName?: string;
  handleAddOCRBox?: (fieldName: string) => void;
}

const ProjectForm = forwardRef<ProjectFormHandle, ProjectFormProps>(({ projectSettings, setProjectSettings, OCRFieldName = '', showOCRIcon = false, handleAddOCRBox }, ref) => {
  const isValidForm = () => {
    let isValid = true;
    for (const field of testFields) {
      if (field.required) {
        let notValid = projectSettings[field.field_name] === null || projectSettings[field.field_name] === '';
        if (notValid) {
          isValid = false;
          break;
        }
      }
    }
    return isValid;
  };

  // 暴露isValidForm方法给父组件
  useImperativeHandle(ref, () => ({
    isValidForm
  }));

  return <div className="flex flex-col gap-3">
    {testFields.map((field) => {
      return <div key={field.field_name}>
        <FormFieldItem
          field={field}
          OCRFieldName={OCRFieldName}
          showOCRIcon={showOCRIcon}
          projectSettings={projectSettings}
          setProjectSettings={setProjectSettings}
          handleAddOCRBox={handleAddOCRBox} />
      </div>;
    })}
  </div>
});

ProjectForm.displayName = 'ProjectForm';

export default ProjectForm;