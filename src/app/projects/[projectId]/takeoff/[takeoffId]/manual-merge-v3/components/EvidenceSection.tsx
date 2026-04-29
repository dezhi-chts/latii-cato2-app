"use client";

import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Empty, Modal, Select, Spin } from "antd";
import { useMemo, useState } from "react";

import {
  deleteFileSourceMergeResultsByEvidenceIds,
  updateSingleFileMergeResultsLabelByEvidenceIds,
} from "@/services/takeOffService";
import ImagePreviewWithExpand from "../../components/ImagePreviewWithExpand";
import { notify } from "@/utils/notify";
import EvidenceImagePreviewModal from "../../analyze-new/components/EvidenceImagePreviewModal";
import { EvidenceRecord } from "../../analyze-new/types";


interface EvidenceSectionProps {
  title: string;
  evidences: Array<{
    id: string;
    url: string;
    project_file_id?: number;
    project_file_page_number?: number;
    page_width_pdf?: number;
    page_height_pdf?: number;
    polygon?: any;
    [key: string]: any;
  }>;
  files: any[];
  currentLabel: string;
  allLabels: any[];
  isLabelMerged: boolean;
  onRefreshItemsAndEvidence: () => Promise<void>;
}

type PreviewEvidenceMode = "single" | "samePage";

const resolvePreviewEvidences = (
  mode: PreviewEvidenceMode,
  singleEvidence: EvidenceRecord,
  samePageEvidences: EvidenceRecord[],
) => {
  if (mode === "samePage") {
    return samePageEvidences.length > 0 ? samePageEvidences : [singleEvidence];
  }
  return [singleEvidence];
};

const toEvidenceRecord = (evidence: any): EvidenceRecord => {
  return {
    ...(evidence || {}),
    id: Number(evidence?.id || 0),
  } as EvidenceRecord;
};

export default function EvidenceSection({
  title,
  evidences,
  files,
  currentLabel,
  allLabels,
  isLabelMerged,
  onRefreshItemsAndEvidence,
}: EvidenceSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvidenceUrl, setEditingEvidenceUrl] = useState("");
  const [targetLabel, setTargetLabel] = useState<string>();
  const [apiLoading, setApiLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<{
    fileName?: string;
    pageNumber: number;
    imageUrl: string;
    pageEvidences: EvidenceRecord[];
  }>({
    fileName: "",
    pageNumber: 1,
    imageUrl: "",
    pageEvidences: [],
  });
  // Keep this mode switch for future requirement:
  // - "single": only highlight clicked evidence (current behavior)
  // - "samePage": highlight all evidences on the same page
  const previewEvidenceMode = "single" as PreviewEvidenceMode;

  const availableTargetLabels = useMemo(() => {
    const seen = new Set<string>();
    return (allLabels || [])
      .map((item: any) => String(item?.label || "").trim())
      .filter((label: string) => label && label !== currentLabel)
      .filter((label: string) => {
        if (seen.has(label)) return false;
        seen.add(label);
        return true;
      });
  }, [allLabels, currentLabel]);

  const handleDeleteEvidence = (evidenceId: string, evidenceUrl: string) => {
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
      onOk: async () => {
        setApiLoading(true);
        try {
          const response = await deleteFileSourceMergeResultsByEvidenceIds(evidenceId);
          if (response.status !== "success") {
            notify.error({
              title: "Error",
              description: response?.data?.detail || "Failed to delete evidence.",
            });
            return;
          }
          notify.success({
            title: "Success",
            description: "Evidence deleted successfully.",
          });
          await onRefreshItemsAndEvidence();
        } finally {
          setApiLoading(false);
        }
      },
    });
  };

  const [editingEvidenceId, setEditingEvidenceId] = useState("");

  const handleOpenEnvironmentPreview = (evidence: {
    id: string;
    url: string;
    project_file_id?: number;
    project_file_page_number?: number;
    page_width_pdf?: number;
    page_height_pdf?: number;
    polygon?: any;
  }) => {
    const fileId = Number(evidence?.project_file_id || 0);
    const pageNumber = Number(evidence?.project_file_page_number || 1) || 1;
    const matchedFile = (files || []).find((item) => Number(item?.id) === fileId);
    const pageInfos = matchedFile?.parse_detail?.image_page_infos || [];
    const matchedPageInfo =
      pageInfos.find(
        (pageInfo: any, pageIndex: number) =>
          Number(pageInfo?.project_file_page_number || pageInfo?.page_number || pageIndex + 1) ===
          pageNumber,
      ) || null;
    const imageUrl = matchedPageInfo?.s3_url || evidence?.url || "";
    const samePageEvidences = evidences
      .filter(
        (item) =>
          Number(item?.project_file_id || 0) === fileId &&
          Number(item?.project_file_page_number || 1) === pageNumber,
      )
      .map((item) => toEvidenceRecord(item));
    const clickedEvidence = toEvidenceRecord(evidence);

    const previewEvidences = resolvePreviewEvidences(
      previewEvidenceMode,
      clickedEvidence,
      samePageEvidences,
    );

    setPreviewPayload({
      fileName: matchedFile?.file_name || "Unnamed file",
      pageNumber,
      imageUrl,
      pageEvidences: previewEvidences,
    });
    setPreviewOpen(true);
  };

  const handleOpenEdit = (evidenceId: string, evidenceUrl: string) => {
    setEditingEvidenceId(evidenceId);
    setEditingEvidenceUrl(evidenceUrl);
    setTargetLabel(undefined);
    setIsEditModalOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!targetLabel) {
      notify.warning({
        title: "Label Required",
        description: "Please select a target label.",
      });
      return;
    }

    setApiLoading(true);
    try {
      const response = await updateSingleFileMergeResultsLabelByEvidenceIds(editingEvidenceId, targetLabel);
      if (response.status !== "success") {
        notify.error({
          title: "Error",
          description: response?.data?.detail || "Failed to update evidence label.",
        });
        return;
      }
      notify.success({
        title: "Success",
        description: "Evidence label updated successfully.",
      });
      setIsEditModalOpen(false);
      await onRefreshItemsAndEvidence();
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <>
      <div className="relative flex h-full min-h-0 flex-col rounded-xl border border-primaryN30 bg-white p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-forumBlue-normal">{title}</span>
          <span className="text-xs text-grey-normal">{evidences.length} images</span>
        </div>
        {evidences.length > 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              {evidences.map((evidence, index) => (
                <div
                  key={`${evidence.id}-${index}`}
                  className="group relative h-[220px] overflow-hidden rounded-md border border-primaryN30 bg-white"
                >
                  <div className="absolute left-1 top-1 rounded z-10 flex h-[15px] w-[15px] text-xxs items-center justify-center bg-forumBlue-light-active text-xs font-medium text-white shadow-sm">
                    {index + 1}
                  </div>
                  <div className="absolute right-1 top-1 z-10 items-center gap-1 hidden group-hover:flex">
                    {!isLabelMerged && (
                      <>
                        <div
                          className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
                          onClick={() => {
                            handleOpenEdit(evidence.id, evidence.url);
                          }}
                        >
                          <EditOutlined className="text-[12px]" />
                        </div>
                        <div
                          className="w-[20px] h-[20px] flex justify-center items-center bg-forumBlue-normal rounded-full cursor-pointer shadow-md text-white"
                          onClick={() => {
                            handleDeleteEvidence(evidence.id, evidence.url);
                          }}
                        >
                          <DeleteOutlined className="text-[12px]" />
                        </div>
                      </>
                    )}
                  </div>
                  <div
                    className="flex h-full w-full items-center justify-center p-2"
                    onClick={() => {
                      handleOpenEnvironmentPreview(evidence);
                    }}
                  >
                    {/* <ImagePreviewWithExpand
                      src={evidence.url}
                      alt={`${title} Evidence`}
                      className="h-full w-full"
                      imageClassName="max-h-full max-w-full object-contain"
                    /> */}
                    <img
                      src={evidence.url}
                      alt={`${title} Evidence`}
                      className="block max-h-full max-w-full cursor-zoom-in object-contain"
                      loading="lazy"
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

        {apiLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white/40">
            <Spin />
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
        confirmLoading={apiLoading}
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
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                String(option?.label || "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={availableTargetLabels.map((label) => ({
                label,
                value: label,
              }))}
            />
          </div>
        </div>
      </Modal>

      <EvidenceImagePreviewModal
        open={previewOpen}
        fileName={previewPayload.fileName}
        pageNumber={previewPayload.pageNumber}
        imageUrl={previewPayload.imageUrl}
        pageEvidences={previewPayload.pageEvidences}
        onCancel={() => setPreviewOpen(false)}
      />
    </>
  );
}
