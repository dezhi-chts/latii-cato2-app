"use client";

import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Empty, Modal, Select, notification } from "antd";
import { useMemo, useState } from "react";

import ImagePreviewWithExpand from "../../components/ImagePreviewWithExpand";

interface EvidenceSectionProps {
  title: string;
  evidenceUrls: string[];
  currentLabel: string;
  labelOptions: string[];
}

export default function EvidenceSection({
  title,
  evidenceUrls,
  currentLabel,
  labelOptions,
}: EvidenceSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvidenceUrl, setEditingEvidenceUrl] = useState("");
  const [targetLabel, setTargetLabel] = useState<string>();

  const availableTargetLabels = useMemo(
    () => labelOptions.filter((label) => label !== currentLabel),
    [currentLabel, labelOptions],
  );

  const handleDeleteEvidence = (evidenceUrl: string) => {
    Modal.confirm({
      title: "Delete Evidence",
      content: (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-grey-normal">
            Are you sure you want to delete this evidence?
          </div>
          <div className="text-sm text-grey-normal flex items-center">
            <div className="">Current Label:</div>
            <span className="ml-2 font-medium text-grey-dark">{currentLabel || "-"}</span>
          </div>
          <div className="h-[180px] w-full overflow-hidden rounded-md border border-primaryN30 bg-primaryN20 p-2">
            <ImagePreviewWithExpand
              src={evidenceUrl}
              alt={`${title} Evidence`}
              showExpand={false}
              className="h-full w-full"
              imageClassName="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      ),
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: () => {
        notification.info({
          message: "Delete Confirmed",
          description: "Delete API is not available yet, no data has been changed.",
        });
      },
    });
  };

  const handleOpenEdit = (evidenceUrl: string) => {
    setEditingEvidenceUrl(evidenceUrl);
    setTargetLabel(undefined);
    setIsEditModalOpen(true);
  };

  const handleConfirmEdit = () => {
    if (!targetLabel) {
      notification.warning({
        message: "Label Required",
        description: "Please select a target label.",
      });
      return;
    }

    notification.info({
      message: "Update Prepared",
      description: `Will move evidence from "${currentLabel}" to "${targetLabel}" after API is ready.`,
    });
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col rounded-xl border border-primaryN30 bg-white p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-forumBlue-normal">{title}</span>
          <span className="text-xs text-grey-normal">{evidenceUrls.length} images</span>
        </div>
        {evidenceUrls.length > 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              {evidenceUrls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="group relative h-[220px] overflow-hidden rounded-md border border-primaryN30 bg-white"
                >
                  <div className="absolute left-1 top-1 rounded z-10 flex h-[15px] w-[15px] text-xxs items-center justify-center bg-forumBlue-light-active text-xs font-medium text-white shadow-sm">
                    {index + 1}
                  </div>
                  <div className="absolute right-1 top-1 z-10 items-center gap-1  hidden group-hover:flex">
                    <div
                      className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
                      onClick={() => {
                        handleOpenEdit(url);
                      }}
                    >
                      <EditOutlined className="text-[12px]" />
                    </div>
                    <div
                      className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
                      onClick={() => {
                        handleDeleteEvidence(url);
                      }}
                    >
                      <DeleteOutlined className="text-[12px]" />
                    </div>
                  </div>
                  <div className="flex h-full w-full items-center justify-center p-2">
                    <ImagePreviewWithExpand
                      src={url}
                      alt={`${title} Evidence`}
                      className="h-full w-full"
                      imageClassName="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No evidence images." />
          </div>
        )}
      </div>

      <Modal
        open={isEditModalOpen}
        title="Edit Evidence Label"
        okText="Update"
        cancelText="Cancel"
        onOk={handleConfirmEdit}
        onCancel={() => setIsEditModalOpen(false)}
      >
        <div className="flex flex-col gap-3">
          <div className="h-[260px] w-full overflow-hidden rounded-md border border-primaryN30 bg-primaryN20 p-2">
            <ImagePreviewWithExpand
              src={editingEvidenceUrl}
              alt={`${title} Evidence`}
              showExpand={false}
              className="h-full w-full"
              imageClassName="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="text-sm text-grey-normal flex flex-row items-center">
            <div className="w-[140px] text-right">Current Label：</div><span className="font-medium">{currentLabel || "-"}</span>
          </div>
          <div className="flex flex-row items-center">
            <div className="w-[140px] text-right mb-1 text-sm text-grey-normal">Update To Label：</div>
            <Select
              value={targetLabel}
              onChange={(value) => setTargetLabel(value)}
              placeholder="Select target label"
              className="flex-1"
              options={availableTargetLabels.map((label) => ({
                label,
                value: label,
              }))}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
