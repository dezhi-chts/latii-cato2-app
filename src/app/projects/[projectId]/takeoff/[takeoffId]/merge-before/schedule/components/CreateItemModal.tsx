"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Modal } from "antd";

import { addTakeOffResultItemByEvidenceId } from "@/services/takeOffService";
import { notify } from "@/utils/notify";

interface CreateItemModalProps {
  open: boolean;
  columns: string[];
  takeOffId: string;
  selectedFileId: number | null;
  pageEvidenceId: number;
  defaultLabel: string;
  onCancel: () => void;
  onSuccess: () => Promise<void> | void;
}

export default function CreateItemModal({
  open,
  columns,
  takeOffId,
  selectedFileId,
  pageEvidenceId,
  defaultLabel,
  onCancel,
  onSuccess,
}: CreateItemModalProps) {
  const [form] = Form.useForm<Record<string, string>>();
  const [submitLoading, setSubmitLoading] = useState(false);

  const initialValues = useMemo(() => {
    const nextValues: Record<string, string> = {};
    columns.forEach((fieldName) => {
      nextValues[fieldName] = fieldName === "Label" ? defaultLabel : "";
    });
    return nextValues;
  }, [columns, defaultLabel]);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(initialValues);
  }, [form, initialValues, open]);

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      const normalizedLabel = String(values?.Label || "").trim();
      if (!normalizedLabel) {
        form.setFields([
          {
            name: "Label",
            errors: ["Label is required."],
          },
        ]);
        return;
      }

      const normalizedResult: Record<string, string> = {};
      columns.forEach((fieldName) => {
        normalizedResult[fieldName] = String(values?.[fieldName] || "").trim();
      });
      normalizedResult.Label = normalizedLabel;

      setSubmitLoading(true);
      const response = await addTakeOffResultItemByEvidenceId(
        takeOffId,
        String(selectedFileId || ""),
        String(pageEvidenceId),
        normalizedResult,
      );
      setSubmitLoading(false);
      if (response.status !== "success") {
        notify.error({
          title: "Error",
          description: response?.data?.detail || "Failed to create item.",
        });
        return;
      }

      notify.success({
        title: "Success",
        description: "Item created successfully.",
      });
      form.resetFields();
      onCancel();
      await onSuccess();
    } catch (error: any) {
      setSubmitLoading(false);
      if (error?.errorFields?.length) return;
      notify.error({
        title: "Error",
        description: error?.message || "Failed to create item.",
      });
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      width={720}
      destroyOnClose
    >
      <div className="bg-white p-5">
        <div className="mb-1 text-base font-semibold text-forumBlue-normal">Create Item</div>
        <div className="mb-4 text-xs text-grey-normal">
          Fill the fields below to manually create a new item.
        </div>
        <div className="rounded-xl border border-primaryN30 px-4 py-3">
          <Form form={form} layout="vertical" requiredMark={false}>
            <div className="max-h-[52vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {columns.map((fieldName) => (
                  <Form.Item
                    key={fieldName}
                    name={fieldName}
                    label={<span className="text-xs text-grey-dark">{fieldName}</span>}
                    rules={
                      fieldName === "Label"
                        ? [
                          {
                            validator: async (_, value) => {
                              if (String(value || "").trim()) return;
                              throw new Error("Label is required.");
                            },
                          },
                        ]
                        : undefined
                    }
                  >
                    <Input
                      size="middle"
                      placeholder={`Enter ${fieldName}`}
                      className="!rounded-md !border-primaryN30 !text-xs"
                    />
                  </Form.Item>
                ))}
              </div>
            </div>
          </Form>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button onClick={onCancel} className="custom-default-btn">
            Cancel
          </Button>
          <Button
            loading={submitLoading}
            onClick={handleConfirm}
            className="custom-primary-btn !w-[90px]"
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
