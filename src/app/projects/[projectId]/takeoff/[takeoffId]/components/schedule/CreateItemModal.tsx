"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Modal } from "antd";

import { addTakeOffResultItemManual } from "@/services/takeOffService";
import { notify } from "@/utils/notify";
import ScheduleEvidenceImage, {
  type NormalizedCoordinates,
} from "../evidence/ScheduleEvidenceImage";

interface CreateItemModalProps {
  open: boolean;
  columns: string[];
  takeOffId: string;
  selectedFileId: number | null;
  pageEvidenceId: number;
  defaultLabel: string;
  previewImageUrl: string;
  previewCoordinates: NormalizedCoordinates | null;
  /** 不同页面可以传入不同创建接口；未传时默认使用 schedule 阶段的新增接口。 */
  onSubmitCreateItem?: (body: any) => Promise<{ data: any; status: string }>;
  onCancel: () => void;
  /** 创建成功后把本次提交 body 回传给父组件，便于父组件按 Label 决定刷新范围。 */
  onSuccess: (createdBody?: any) => Promise<void> | void;
}

export default function CreateItemModal({
  open,
  columns,
  takeOffId,
  selectedFileId,
  pageEvidenceId,
  defaultLabel,
  previewImageUrl,
  previewCoordinates,
  onSubmitCreateItem,
  onCancel,
  onSuccess,
}: CreateItemModalProps) {
  const [form] = Form.useForm<Record<string, string>>();
  const [submitLoading, setSubmitLoading] = useState(false);

  const formColumns = useMemo(() => {
    if (columns.includes("Label")) return columns;
    // Label 是创建 item 的必填字段，确保表单里始终可编辑。
    return ["Label", ...columns];
  }, [columns]);

  const initialValues = useMemo(() => {
    const nextValues: Record<string, string> = {};
    formColumns.forEach((fieldName) => {
      nextValues[fieldName] = fieldName === "Label" ? defaultLabel : "";
    });
    return nextValues;
  }, [defaultLabel, formColumns]);

  const previewItems = useMemo(() => {
    if (!previewCoordinates) return [];
    /**
     * 这里只传当前正在创建的框，避免弹窗里出现其他可干扰的框。
     */
    return [
      {
        id: 1,
        coordinates: previewCoordinates,
      },
    ];
  }, [previewCoordinates]);

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
      formColumns.forEach((fieldName) => {
        normalizedResult[fieldName] = String(values?.[fieldName] || "").trim();
      });
      normalizedResult.Label = normalizedLabel;

      setSubmitLoading(true);
      let body: any = {
        take_off_id: takeOffId,
        project_file_id: selectedFileId,
        evidence_id: pageEvidenceId,
        result: normalizedResult,
        // 复用用户刚刚确认的框坐标，确保创建结果与预览一致。
        coordinates: previewCoordinates || null,
      };
      /**
       * 创建接口由父组件按页面阶段决定：
       * schedule 页面默认调用 addTakeOffResultItemManual，
       * manual merge 页面可传入 addTakeOffResultItemManualMerge。
       */
      const submitCreateItem = onSubmitCreateItem || addTakeOffResultItemManual;
      const response = await submitCreateItem(body);
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
      await onSuccess(body);
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
      width="80%"
      destroyOnClose
    >
      <div className="bg-white p-5">
        <div className="mb-1 text-base font-semibold text-forumBlue-normal">Create Item</div>
        <div className="mb-4 text-xs text-grey-normal">
          Fill the fields below to manually create a new item.
        </div>
        {/* 左侧只读图片预览，右侧可编辑表单。 */}
        <div className="mb-4 flex min-h-0 flex-row gap-4">
          <div className="h-[58vh] w-[48%] min-w-0 rounded-xl border border-primaryN30 bg-grey-light">
            <ScheduleEvidenceImage
              imageUrl={previewImageUrl}
              items={previewItems}
            />
          </div>
          <div className="min-h-0 flex-1 rounded-xl border border-primaryN30 px-4 py-3">
            <div className="mb-3 text-xs text-forumBlue-normal">
              Please fill in the selected box details
            </div>
            <Form form={form} requiredMark={false}>
              <div className="max-h-[54vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {formColumns.map((fieldName) => (
                    <Form.Item
                      key={fieldName}
                      className="mb-2"
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
                      {/* 表单项采用左右结构：左边字段名，右边输入值；每行两列字段。 */}
                      <div className="flex items-center gap-2">
                        <span
                          className="w-[98px] shrink-0 truncate text-xs text-grey-dark"
                          title={fieldName}
                        >
                          {fieldName}
                        </span>
                        {/* 使用 noStyle 让 Input 成为真正的受控字段，确保默认值能正确回填。 */}
                        <Form.Item name={fieldName} noStyle>
                          <Input
                            size="middle"
                            placeholder={`Enter ${fieldName}`}
                            className="!rounded-md !border-primaryN30 !text-xs"
                          />
                        </Form.Item>
                      </div>
                    </Form.Item>
                  ))}
                </div>
              </div>
            </Form>
          </div>
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
