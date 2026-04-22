"use client";

import LocationSelector from "@/components/LocationSelector";
import { EnvironmentOutlined } from "@ant-design/icons";
import { Modal, Form, Input, Button, Space } from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;

type CompanyLocation = {
  state: string;
  city: string;
  address: string;
  postal_code: string;
  country: string;
};

export type CompanyFormValues = {
  name: string;
  description: string;
  website: string;
  location: CompanyLocation;
};

type Props = {
  open: boolean;
  loading?: boolean;
  initialValues?: Partial<CompanyFormValues>;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (values: CompanyFormValues) => void | Promise<void>;
};

const defaultLocation: CompanyLocation = {
  state: "",
  city: "",
  address: "",
  postal_code: "",
  country: "",
};

const CompanyFormModal = ({
  open,
  loading,
  initialValues,
  mode,
  onCancel,
  onSubmit,
}: Props) => {
  const [form] = Form.useForm<CompanyFormValues>();
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [location, setLocation] = useState<CompanyLocation>(defaultLocation);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initialValues?.name || "",
        description: initialValues?.description || "",
        website: initialValues?.website || "",
      });
      setLocation({
        ...defaultLocation,
        ...(initialValues?.location || {}),
      });
      setLocationError("");
    } else {
      form.resetFields();
      setLocation(defaultLocation);
      setShowLocationSelector(false);
      setLocationError("");
    }
  }, [open, initialValues, form]);

  const handleInputChange = (field: keyof CompanyLocation, value: string) => {
    setLocation((prev) => ({
      ...prev,
      [field]: value,
    }));
    setLocationError("");
  };

  const handleDropdownChange =
    (field: keyof CompanyLocation) => (value: CompanyLocation[typeof field]) => {
      setLocation((prev) => ({
        ...prev,
        [field]: value,
      }));
      setLocationError("");
    };

  const handleOk = async () => {
    const values = await form.validateFields();
    const hasRequiredLocation =
      !!location.state?.trim() &&
      !!location.city?.trim() &&
      !!location.address?.trim();
    if (!hasRequiredLocation) {
      setLocationError(
        "Please complete location (state, city and detailed address).",
      );
      return;
    }
    await onSubmit({
      ...values,
      location,
    });
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Create Company" : "Edit Company"}
      onCancel={onCancel}
      centered
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" loading={loading} onClick={handleOk}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark
        className="pt-2"
        initialValues={{ name: "", description: "", website: "" }}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please input company name" }]}
        >
          <Input placeholder="Company name" size="large" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { required: true, message: "Please input description" },
            { whitespace: true, message: "Description cannot be empty" },
          ]}
        >
          <TextArea
            rows={3}
            placeholder="A short description of the company"
            style={{ resize: "none" }}
          />
        </Form.Item>

        <Form.Item label="Location">
          <Space.Compact size="large" className="w-full">
            <LocationSelector
              style={{ width: "100%" }}
              onClose={() => setShowLocationSelector(false)}
              handleInputChange={handleInputChange}
              handleDropdownChange={handleDropdownChange}
              projectSettings={location}
              isOpen={showLocationSelector}
              setIsOpen={setShowLocationSelector}
              height="medium"
            />
            <Space.Addon className="bg-white border-l-0">
              <EnvironmentOutlined style={{ color: "#C6C6C6" }} />
            </Space.Addon>
          </Space.Compact>
          {locationError ? (
            <p className="text-accentRed text-xs mt-1">{locationError}</p>
          ) : null}
        </Form.Item>

        <Form.Item
          label="Website"
          name="website"
          rules={[
            {
              required: true,
              message: "Please input website",
            },
            { whitespace: true, message: "Website cannot be empty" },
          ]}
        >
          <Input placeholder="Website" size="large" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CompanyFormModal;
