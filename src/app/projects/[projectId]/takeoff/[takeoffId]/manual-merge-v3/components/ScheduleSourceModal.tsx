"use client";

import { Empty, Modal } from "antd";
import { useRef } from "react";

import ScheduleEvidenceImage, {
  type NormalizedCoordinates,
  type ScheduleEvidenceImageRef,
} from "../../components/evidence/ScheduleEvidenceImage";
import { AddRectBoxControls } from "../../components/pdf/Pdf-Controls";

interface ScheduleSourceModalProps {
  open: boolean;
  /** 当前从 Source 卡片点击进入的 evidence。 */
  evidence: any | null;
  onClose: () => void;
  /** 点击框右上角确认按钮后回调，外层会继续打开 CreateItemModal。 */
  onConfirmSubItemBox: (coordinates: NormalizedCoordinates) => Promise<boolean | void> | boolean | void;
}

const getEvidenceUrl = (evidence: any) => {
  if (typeof evidence?.evidence_url === "string" && evidence.evidence_url) return evidence.evidence_url;
  if (typeof evidence?.url === "string" && evidence.url) return evidence.url;
  if (typeof evidence?.s3_url === "string" && evidence.s3_url) return evidence.s3_url;
  return "";
};

export default function ScheduleSourceModal({
  open,
  evidence,
  onClose,
  onConfirmSubItemBox,
}: ScheduleSourceModalProps) {
  /** 通过 ref 触发图片组件内部的 addSubItemBox 逻辑。 */
  const scheduleEvidenceImageRef = useRef<ScheduleEvidenceImageRef | null>(null);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="86vw"
      centered
      destroyOnClose
      title={null}
    >
      <div className="flex h-[80vh] min-h-[620px] flex-col overflow-hidden p-2">
        <div className="mb-2">
          <div className="text-base text-forumBlue-normal">Schedule Add Box</div>
          <div className="mt-1 text-xs text-grey-normal">
            Draw a new box on this source image, then confirm the box to create a new item.
          </div>
        </div>

        {evidence ? (
          <div className="min-h-0 flex-1 rounded-md border border-primaryN30 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <AddRectBoxControls
                theme="default"
                text="Add Box"
                /** 只在当前 evidence 上新增框，不切换图片列表。 */
                handleAddRectBox={() => scheduleEvidenceImageRef.current?.addSubItemBox()}
              />
            </div>
            <div className="h-[calc(100%-36px)] rounded-md border border-primaryN30 bg-[#FBFBFC]">
              <ScheduleEvidenceImage
                ref={scheduleEvidenceImageRef}
                imageUrl={getEvidenceUrl(evidence)}
                items={Array.isArray(evidence?.overlayItems) ? evidence.overlayItems : []}
                displayMode="contain"
                disableContainerScroll={true}
                onConfirmSubItemBox={(coordinates) => onConfirmSubItemBox(coordinates)}
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No schedule source image found." />
          </div>
        )}
      </div>
    </Modal>
  );
}
