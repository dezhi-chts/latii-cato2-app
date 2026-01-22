import { useState } from "react";
import { Input, Select, Checkbox, Radio, Switch, DatePicker } from "antd";
import { FieldType } from "@/types/project";
import LocationSelector from "@/components/LocationSelector";
import Image from "next/image";

const { Option } = Select;
const { TextArea } = Input;

const FormFieldItem = ({ field, OCRFieldName = '', showOCRIcon = false, projectSettings, setProjectSettings, handleAddOCRBox }: any) => {
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const handleFieldChange = (field: string, value: any) => {
    setProjectSettings((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddOCRRect = (fieldName: string) => {
    handleAddOCRBox?.(fieldName);
  };

  //console.log('######## OCRFieldName', OCRFieldName, 'field.field_name', field.field_name)

  switch (field.field_type) {
    case FieldType.INPUT_TEXT:
      return (
        <div>
          <div className="flex justify-between items-center">
            <label className="text-sm">{field.Hint_text}
              {field.required && <label className="text-red-500">*</label>}
            </label>
            {
              showOCRIcon && (
                <div className="px-2 border border-primaryN30 rounded-md" onClick={() => handleAddOCRRect(field.field_name)} >
                  <Image src={
                    OCRFieldName === field.field_name ? '/assets/icons/ocr-text-focus.svg' : '/assets/icons/ocr-text-blur.svg'
                  }
                    alt={field.Hint_text} width={24} height={24} className="cursor-pointer" />
                </div>
              )
            }
          </div>
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
              style={{}}
            ></LocationSelector>
          </div>
        </div>
      )
    default:
      return null;
  }

};

export default FormFieldItem;
