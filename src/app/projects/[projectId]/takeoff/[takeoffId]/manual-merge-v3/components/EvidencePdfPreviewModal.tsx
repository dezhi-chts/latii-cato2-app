"use client";

import { Modal } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/utils/notify";

import PdfWrapper from "../../components/pdf/PdfWrapper";
import Thumbnail from "../../components/pdf/Thumbnail";
import LoadingScreen from "@/components/loading-screen";

import {
  AddRectBoxControls,
  SelectPagesControls,
  ZoomControls,
  ZOOM_MAX,
  ZOOM_MIN,
} from "../../components/pdf/Pdf-Controls";
import {
  FileOperationType,
  PdfWrapperRefMethods,
  itemBoxType,
} from "../../types/evidence";
import { saveNewListAndSyncFileSourceMergeResult } from "@/services/takeOffService";

interface EvidencePdfPreviewModalProps {
  selectLabel: string;
  open: boolean;
  fileInfo: any | null;
  panelType: string;
  panelEvidences: any[];
  warningPages?: number[];
  initialPageNumber?: number;
  onCancel: () => void;
  onConfirmSuccess: () => void;
}

const clampZoom = (value: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value));

const getPageNumber = (pageInfo: any, index: number): number => {
  const value = Number(pageInfo?.project_file_page_number || pageInfo?.page_number || index + 1);
  return Number.isFinite(value) && value > 0 ? value : index + 1;
};

export default function EvidencePdfPreviewModal({
  selectLabel,
  open,
  fileInfo,
  panelType,
  panelEvidences,
  warningPages = [],
  initialPageNumber = 1,
  onCancel,
  onConfirmSuccess
}: EvidencePdfPreviewModalProps) {
  const takeoffId = useParams().takeoffId as string;

  const pdfRef = useRef<PdfWrapperRefMethods | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(initialPageNumber);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [loading, setLoading] = useState(false);

  const pageInfos = useMemo(() => {
    return Array.isArray(fileInfo?.parse_detail?.image_page_infos)
      ? fileInfo.parse_detail.image_page_infos
      : [];
  }, [fileInfo]);

  const normalizedPages = useMemo(
    () =>
      pageInfos.map((pageInfo: any, index: number) => ({
        ...pageInfo,
        __pageNumber: getPageNumber(pageInfo, index),
      })),
    [pageInfos],
  );

  useEffect(() => {
    if (!open) return;
    const pageExists = normalizedPages.some((item: any) => item.__pageNumber === initialPageNumber);
    setPageNumber(pageExists ? initialPageNumber : 1);
    setTotalPages(Math.max(normalizedPages.length, 1));
    setZoom(1);
    setShowThumbnail(true);
  }, [initialPageNumber, normalizedPages, open]);

  const handleChangePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPageNumber(nextPage);
  };

  const handleZoomChange = (value: number) => {
    setZoom(clampZoom(value));
  };

  const onItemEvidenceConfirm = async (evidence: any) => {
    console.log(evidence);
    if (!evidence) return;

    let newEvidence = {
      ...evidence,
      ocr_text: JSON.stringify({
        result: {
          Label: selectLabel
        }
      })
    }

    setLoading(true);
    let res = await saveNewListAndSyncFileSourceMergeResult(takeoffId, fileInfo?.id, panelType, [newEvidence]);
    setLoading(false);
    if (res.status === "success") {
      notify.success({
        title: "Success",
        description: "Source data saved successfully.",
      })
      pdfRef.current?.removeCropSectionByIds([evidence?.groupId]);
      onConfirmSuccess();
    } else {
      notify.error({
        title: "Error",
        description: res?.data?.detail || "Failed to save source data.",
      })
    }
  };

  const pdfOperationType =
    fileInfo?.operation_type === FileOperationType.Quote
      ? FileOperationType.Quote
      : FileOperationType.ArchitectureDrawing;
  const addBoxType =
    panelType === "Elevation"
      ? itemBoxType.ElevationItem
      : itemBoxType.FloorPlanItem;

  return (
    <Modal
      open={open}
      title={fileInfo?.file_name || "PDF Preview"}
      width={'80vw'}
      footer={null}
      destroyOnClose
      onCancel={onCancel}
    >
      <div className="flex h-[72vh] min-h-0 gap-4 overflow-hidden">
        <div className="h-full w-[250px] shrink-0 overflow-hidden border-r border-primaryN30 pr-3">
          <Thumbnail
            pdfRef={pdfRef}
            showThumbnail={showThumbnail}
            setShowThumbnail={setShowThumbnail}
            data={normalizedPages}
            page={pageNumber}
            setPage={setPageNumber}
            showCategory={false}
            showShadow={false}
            size="default"
            warningPages={warningPages}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AddRectBoxControls
                theme="default"
                text="Add Box"
                handleAddRectBox={() => {
                  pdfRef.current?.addingRect?.({
                    type: addBoxType,
                    isSaveEvidence: false,
                  });
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <SelectPagesControls
                page={pageNumber}
                totalPages={totalPages}
                handlePageChange={handleChangePage}
              />
              <ZoomControls zoom={zoom} handleZoomChange={handleZoomChange} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-primaryN30">
            <PdfWrapper
              ref={pdfRef}
              operationMode="edit"
              project_id={fileInfo?.project_id || ""}
              project_file_id={Number(fileInfo?.id || 0)}
              pdfOperationType={pdfOperationType}
              pdfUrl={fileInfo?.parse_detail?.uploaded_file_url || ""}
              page={pageNumber}
              zoom={zoom}
              allEvidence={panelEvidences}
              showAddBtnOnBox={false}
              evidenceDraggable={false}
              onChangePage={setPageNumber}
              onTotalPages={setTotalPages}
              onChangeZoom={handleZoomChange}
              onItemEvidenceConfirm={onItemEvidenceConfirm}
            />
          </div>
        </div>
        {loading && (
          <LoadingScreen isLoading={loading} />
        )}
      </div>
    </Modal>
  );
}

