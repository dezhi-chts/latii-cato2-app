"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal } from "antd";

import { evidenceBatchUpdate } from "@/services/evidenceService";
import { notify } from "@/utils/notify";

interface BatchEditEvidenceModalProps {
  open: boolean;
  evidenceIds: number[];
  evidences: any[];
  onCancel: () => void;
  onSuccess?: (updatedIds: number[]) => void;
}

export default function BatchEditEvidenceModal({
  open,
  evidenceIds,
  evidences,
  onCancel,
  onSuccess,
}: BatchEditEvidenceModalProps) {
  const [labelInput, setLabelInput] = useState("");
  const [subLabelInput, setSubLabelInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedItems = useMemo(() => {
    return evidences.filter((item: any) => evidenceIds.includes(Number(item.id)));
  }, [evidenceIds, evidences]);

  const selectedLabels = useMemo(() => {
    return selectedItems
      .map((item: any) => {
        try {
          return JSON.parse(item?.ocr_text || "{}")?.result?.Label;
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);
  }, [selectedItems]);

  useEffect(() => {
    if (!open) {
      setLabelInput("");
      setSubLabelInput("");
      setSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    const nextLabel = labelInput.trim();
    const nextSubLabel = subLabelInput.trim();
    if (!nextLabel && !nextSubLabel) {
      notify.warning({
        title: "Warning",
        description: "No modification options detected.",
      });
      return;
    }
    if (!selectedItems.length) {
      notify.warning({
        title: "Warning",
        description: "No matching evidence found.",
      });
      return;
    }

    const updatePayload = selectedItems.map((item: any) => {
      let parsed: any = {};
      try {
        parsed = item?.ocr_text ? JSON.parse(item.ocr_text) : {};
      } catch (error) {
        parsed = {};
      }
      const prevResult = parsed?.result || {};
      const nextResult = { ...prevResult };
      if (nextLabel) {
        nextResult.Label = nextLabel;
      }
      if (nextSubLabel) {
        nextResult["Sub Label"] = nextSubLabel;
      }
      return {
        ...item,
        id: item?.id,
        ocr_text: JSON.stringify({
          ...parsed,
          result: nextResult,
        }),
      };
    });

    setSubmitting(true);
    const res = await evidenceBatchUpdate(updatePayload);
    setSubmitting(false);

    if (res?.status === "success") {
      notify.success({
        title: "Success",
        description: "Labels updated successfully.",
      });
      onSuccess?.(evidenceIds);
      return;
    }

    notify.error({
      title: "Error",
      description: res?.data?.detail || "Failed to update labels.",
    });
  };

  return (
    <Modal
      title="Batch Edit Labels"
      open={open}
      onCancel={onCancel}
      width={560}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={submitting}
          onClick={handleConfirm}
        >
          Confirm
        </Button>,
      ]}
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-2 text-sm text-grey-normal">Selected Labels</div>
          <div className="max-h-[120px] overflow-y-auto rounded-md border border-primaryN30 bg-primaryN20 p-2 text-xs text-grey-dark">
            {selectedLabels.length > 0
              ? selectedLabels.join(", ")
              : "No labels detected"}
          </div>
        </div>
        <div>
          <div className="mb-1 text-sm text-grey-normal">Label</div>
          <Input
            value={labelInput}
            placeholder="Input Label"
            onChange={(event) => setLabelInput(event.target.value)}
            maxLength={120}
          />
        </div>
        {/* <div>
          <div className="mb-1 text-sm text-grey-normal">Sub Label</div>
          <Input
            value={subLabelInput}
            placeholder="Input Sub Label"
            onChange={(event) => setSubLabelInput(event.target.value)}
            maxLength={120}
          />
        </div> */}
      </div>
    </Modal>
  );
}
