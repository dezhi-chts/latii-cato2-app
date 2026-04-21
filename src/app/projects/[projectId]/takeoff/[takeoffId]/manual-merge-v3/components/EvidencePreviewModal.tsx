"use client";

import { Empty, Modal } from "antd";

import ImagePreviewWithExpand from "../../components/ImagePreviewWithExpand";

interface EvidencePreviewModalProps {
  open: boolean;
  previewUrls: string[];
  onCancel: () => void;
}

export default function EvidencePreviewModal({
  open,
  previewUrls,
  onCancel,
}: EvidencePreviewModalProps) {
  return (
    <Modal
      open={open}
      title={<span className="text-lg text-forumBlue-normal font-sans">Evidence Preview</span>}
      footer={null}
      width={1000}
      onCancel={onCancel}
    >
      {previewUrls.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {previewUrls.map((url) => (
            <ImagePreviewWithExpand key={url} src={url} alt="Evidence Preview" />
          ))}
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No evidence images." />
      )}
    </Modal>
  );
}
