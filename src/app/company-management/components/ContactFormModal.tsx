"use client";

import { Modal, Form, Input, Button } from "antd";
import { useEffect } from "react";

const { TextArea } = Input;
const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;

export type ContactFormValues = {
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  password?: string;
  note?: string;
};

type Props = {
  open: boolean;
  loading?: boolean;
  initialValues?: Partial<ContactFormValues>;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (values: ContactFormValues) => void | Promise<void>;
};

const ContactFormModal = ({
  open,
  loading,
  initialValues,
  mode,
  onCancel,
  onSubmit,
}: Props) => {
  const [form] = Form.useForm<ContactFormValues>();

  useEffect(() => {
    if (open) {
      let formData: any = {
        name: initialValues?.name || "",
        email: initialValues?.email || "",
        phone: initialValues?.phone || "",
        job_title: initialValues?.job_title || "",
        note: initialValues?.note || "",
      }
      if (mode === 'create') {
        formData.password = "";
      }
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    // For edit mode, only send password if user actually filled it in.
    if (mode === "edit" && !values.password) {
      delete values.password;
    }
    await onSubmit(values);
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Create Contact" : "Edit Contact"}
      onCancel={onCancel}
      centered
      destroyOnClose
      width={520}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" loading={loading} onClick={handleOk}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" requiredMark className="pt-2">
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please input contact name" }]}
        >
          <Input placeholder="Contact name" size="large" disabled={mode === "edit"} />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please input email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="name@example.com" size="large" />
        </Form.Item>

        <div className="flex gap-3">
          <Form.Item label="Phone" name="phone" className="flex-1">
            <Input placeholder="Phone number" size="large" />
          </Form.Item>

          <Form.Item label="Job Title" name="job_title" className="flex-1">
            <Input placeholder="e.g. Project Manager" size="large" />
          </Form.Item>
        </div>

        {mode === "create" &&
          <Form.Item
            label={mode === "create" ? "Password" : "Password (leave blank to keep unchanged)"}
            name="password"
            rules={
              mode === "create"
                ? [
                  { required: true, message: "Please input password" },
                  { min: 8, message: "At least 8 characters" },
                  {
                    pattern: passwordComplexityRegex,
                    message:
                      "Password must include uppercase, lowercase and number",
                  },
                ]
                : [
                  { min: 8, message: "At least 8 characters" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (passwordComplexityRegex.test(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          "Password must include uppercase, lowercase and number",
                        ),
                      );
                    },
                  },
                ]
            }
          >
            <Input.Password
              placeholder={mode === "create" ? "Set a password" : "New password"}
              size="large"
              autoComplete="new-password"
            />
          </Form.Item>
        }

        <Form.Item label="Note" name="note">
          <TextArea
            rows={3}
            placeholder="Optional note"
            style={{ resize: "none" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ContactFormModal;
