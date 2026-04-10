"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, notification, Spin, Modal } from "antd";
import { useParams, useRouter } from "next/navigation";

import PdfWrapper from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/PdfWrapper";
import {
  ZoomControls,
  SelectPagesControls,
  AddRectBoxControls,
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/Pdf-Controls";
import {
  getEvidenceBySubTextEvidenceIds,
} from "@/services/takeOffService";

import {
  ProjectFileRecord,
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/analyze-new/types";
import {
  EvidenceType,
  FileOperationType,
  GroupType,
  PageType,
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";
import Image from "next/image";
import LabelTable from "./components/LabelTable";
import ImageList from "./components/ImageList";
import { ArchDrawingSummaryPageTypes } from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";
import EvidenceThumbailList from "./components/EvidenceThumbailList";
import LabelConfirmModal from "./components/LabelConfirmModal";
import { evidenceBatchSubmit } from "@/services/evidenceService";
import LoadingScreen from "@/components/loading-screen";
import BuildingBackground from "../../identification/components/BuildingBackground";
import {
  getTakeOffById,
  getEvidencesWindowTableQuoteWithUrlByProjectFileId,
  getEvidencesElevationFloorPlanWithUrlByProjectFileId,
} from "@/services/takeOffService";

import { AnalyzeItemBySourceTypeSSE } from "@/services/DrawingAiService";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

interface ExtendedProjectFile extends ProjectFileRecord {
  operation_type?: string;
}

export default function FloorPlanPage() {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;

  const pdfWrapperRef = useRef<any>(null);

  const [fullLoading, setFullLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showThumbnail, setShowThumbnail] = useState(true);


  const [pageEvidenceId, setPageElevationId] = useState<number>(-1);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<any>(null);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [files, setFiles] = useState<ExtendedProjectFile[]>([]);
  const [thumbnailData, setThumbnailData] = useState<any[]>([]);
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [itemBoxList, setItemBoxList] = useState<EvidenceType[]>([]);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);
  const eventSourceRef = useRef<{ close: () => void } | null>(null);

  const selectedFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId) || null;
  }, [files, selectedFileId]);


  const fetchTakeoffData = useCallback(async () => {
    if (!takeOffId) return;

    setFullLoading(true);
    try {
      const response = await getTakeOffById(takeOffId as string);
      if (response.status === "success" && response.data) {
        const projectFiles: ExtendedProjectFile[] =
          response.data.project_files || [];
        setFiles(projectFiles);

        if (projectFiles.length > 0) {
          setSelectedFileId(projectFiles[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching takeoff data:", error);
      notification.error({
        message: "Error",
        description: "Failed to load takeoff data.",
      });
    } finally {
      setFullLoading(false);
    }
  }, [takeOffId]);

  const fetchFloorPlanAndElevation = useCallback(async () => {
    if (!selectedFileId) return;
    const response = await getEvidencesElevationFloorPlanWithUrlByProjectFileId(
      selectedFileId.toString(),
    );
    if (response.status === "success" && response.data) {
      let data = response.data || [];
      data.sort(
        (a: any, b: any) =>
          (a?.project_file_page_number || 0) -
          (b?.project_file_page_number || 0),
      );
      console.log('########### thumbnailData', thumbnailData);
      setThumbnailData(data);
      if (data.length > 0) {
        setCurrentPage(data[0].project_file_page_number || 0);
        setPageElevationId(data[0].id);
      }
    } else {
      notification.error({
        message: "Error",
        description: "Failed to load floor plan and elevation data.",
      });
    }
  }, [selectedFileId]);

  const fetchScheduleEvidenceList = useCallback(async () => {
    if (!selectedFileId) return;
    const response = await getEvidencesWindowTableQuoteWithUrlByProjectFileId(
      selectedFileId.toString(),
    );
    if (response.status === "success" && response.data) {
      setScheduleList(response.data || []);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to load schedule evidence data.",
      });
    }
  }, [selectedFileId]);


  const confirmItem = useRef<any>(null);

  const pdfUrl = useMemo(() => {
    return selectedFile?.parse_detail?.uploaded_file_url || "";
  }, [selectedFile]);

  const floorPlanData = useMemo<any[]>(() => {
    return (itemBoxList || []).filter(
      (item: any) => item?.type === "Floor Plan Item",
    );
  }, [itemBoxList]);

  const elevationData = useMemo<any[]>(() => {
    return (itemBoxList || []).filter(
      (item: any) => item?.type === "Elevation Item",
    );
  }, [itemBoxList]);

  const getItemsByPageEvidences = useCallback(
    async (id: number) => {
      if (id) {
        let res = await getEvidenceBySubTextEvidenceIds(id.toString());
        if (res.status === "success" && res.data) {
          let currentPageEvidence = thumbnailData.find(
            (item: any) => item.id === id,
          );
          if (currentPageEvidence) {
            currentPageEvidence.isParentEvidence = true;
          }

          let list = res.data || [];
          if (currentPageEvidence) {
            list.unshift(currentPageEvidence);
          }
          setItemBoxList(list);
        } else {
          notification.error({
            message: "Error",
            description: "Failed to load evidence data.",
          });
        }
      }
    },
    [currentPage, thumbnailData],
  );

  useEffect(() => {
    fetchTakeoffData();
  }, []);

  useEffect(() => {
    if (selectedFileId) {
      fetchFloorPlanAndElevation();
      fetchScheduleEvidenceList();
    }
  }, [selectedFileId]);

  useEffect(() => {
    if (selectedFileId) {
      // 调用pdf的resetAllInfo方法
      pdfWrapperRef.current?.resetAllInfo?.();
    }
  }, [selectedFileId]);

  useEffect(() => {
    if (pageEvidenceId) {
      getItemsByPageEvidences(pageEvidenceId);
      setSelectedEvidenceIds([pageEvidenceId]);
    }
  }, [pageEvidenceId]);

  useEffect(() => {
    if (thumbnailData.length > 0 && pageEvidenceId === -1) {
      setPageElevationId(thumbnailData[0].id);
    }
  }, [thumbnailData]);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);


  const handleZoomChange = (value: number) => {
    const clampedValue = Math.max(ZOOM_MIN, Math.min(value, ZOOM_MAX));
    setZoom(clampedValue);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageEvidenceChange = useCallback(
    (evidenceId: any) => {
      setPageElevationId(evidenceId);
      let currentPage =
        thumbnailData.find((item) => item.id === evidenceId)
          ?.project_file_page_number || 0;
      setCurrentPage(currentPage);
    },
    [currentPage, thumbnailData],
  );

  const handleTotalPages = (total: number) => {
    setTotalPages(total);
  };

  const handleAddBox = useCallback(() => {
    if (!pageEvidenceId || thumbnailData.length === 0) return;

    if (pdfWrapperRef.current) {
      let evid = thumbnailData.find((item) => item.id === pageEvidenceId);
      if (!evid) return;
      let evidType = evid.type + " Item";
      pdfWrapperRef.current.addingRect({
        type: evidType,
        isSaveEvidence: false,
      });
    }
  }, [pageEvidenceId, thumbnailData]);

  const handleDeleteEvidence = (data: any) => {
    // 刷新数据
    getItemsByPageEvidences(pageEvidenceId);
  };

  const handleUpdateEvidence = (data: any) => {
    if (data?.evidences) {
      setItemBoxList((prev) =>
        prev.map((e) => {
          const updated = data.evidences.find((u: any) => u.id === e.id);
          return updated ? { ...e, ...updated } : e;
        }),
      );
    }
  };

  const handleSelectFile = (id: number) => {
    setSelectedFileId(id);
  };

  const handleSelectFloorPlan = (item: { id: string | number }) => {
    setSelectedEvidenceIds([item.id]);
  };

  const handleSelectElevation = (item: { id: string | number }) => {
    setSelectedEvidenceIds([item.id]);
  };

  const handleUpdateItemByLabelTable = useCallback((updatedItem: any) => {
    setItemBoxList((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  }, []);

  const handleDeleteItemByLabelTable = useCallback(
    async (deletedId: number) => {
      setSelectedEvidenceIds((prev: number[] | null) =>
        prev?.includes(deletedId) ? null : prev,
      );
      await getItemsByPageEvidences(pageEvidenceId);
    },
    [getItemsByPageEvidences, pageEvidenceId],
  );

  const handleItemEvidenceConfirm = useCallback((item: any) => {
    console.log("item", item);
    // show confirm modal
    confirmItem.current = item;
    setShowLabelModal(true);
  }, []);

  const evidenceType = useMemo(() => {
    return (
      thumbnailData.find((item) => item.id === pageEvidenceId)?.type || ""
    );
  }, [pageEvidenceId]);

  const handleItemSubmit = useCallback(
    async (formData: any) => {
      // submit form data
      let ocr_text = {
        result: {
          Label: formData.Label,
          "Sub Label": formData["Sub Label"],
        },
      };

      let count =
        evidenceType === PageType.FloorPlan
          ? floorPlanData.length
          : elevationData.length;

      let itemInfo = { ...confirmItem.current };
      if (itemInfo.groupId) {
        delete itemInfo.groupId;
      }

      let data = [
        {
          ...itemInfo,
          ocr_text: JSON.stringify(ocr_text),
          sub_text: `${pageEvidenceId}:${count + 1}`,
        },
      ];
      console.log("data", data);

      setFullLoading(true);

      // 组装数据
      let res = await evidenceBatchSubmit(data);
      setFullLoading(false);
      if (res.status === "success") {
        notification.success({
          message: "Confirm success",
        });
        // 关闭弹窗
        setShowLabelModal(false);
        // 清除裁剪区域
        pdfWrapperRef.current?.clearCropSections?.();
        // 刷新数据
        getItemsByPageEvidences(pageEvidenceId);
      } else {
        notification.error({
          message: res?.data?.detail || "Confirm failed",
        });
      }
    },
    [evidenceType, floorPlanData, elevationData],
  );

  const handleNext = () => {
    handleAnaylize();
  };

  const handleChangeSelectedEvidence = (evidenceIds: number[]) => {
    // 获取evidenceIds
    if (evidenceIds.length > 0) {
      setSelectedEvidenceIds(evidenceIds);
    }
  };

  const handleAnaylize = async () => {
    setBuildLoading(true);

    // Close existing SSE connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const sseConnection = AnalyzeItemBySourceTypeSSE(takeOffId as string, 1, {
      onConnected: () => {
        console.log("[SSE] Connected to analyze service");
      },
      onHeartbeat: (data) => {
        console.log("[SSE] Heartbeat received:", data);
      },
      onCompleted: (result: any) => {
        console.log("[SSE] Analysis completed:", result);
        eventSourceRef.current = null;
        router.push(
          `/projects/${projectId}/takeoff/${takeOffId}/merge-before/schedule`,
        );
      },
      onError: (error: string) => {
        console.error("[SSE] Analysis error:", error);
        setBuildLoading(false);
        eventSourceRef.current = null;
        notification.error({
          message: "Error",
          description: error || "Failed to analyze the file",
        });
      },
    });

    eventSourceRef.current = sseConnection;
  };

  const handleBack = () => {
    router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification/page-label`);
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-white font-nunito">
      {/* Header */}
      <header className="px-14 flex h-[110px] shrink-0 items-center justify-between border-b border-primaryN30 bg-white">
        <div className="cursor-pointer" onClick={handleBack}>
          <Image src="/assets/icons/arrow-back.svg" alt="logo" width={12} height={6} style={{ height: 'auto' }}></Image>
        </div>
        <div className="flex-1 ml-6 flex items-center gap-3">
          {files.map((file) => (
            <button
              key={file.id}
              type="button"
              className={`flex h-[50px] min-w-[140px] flex-col items-start justify-center rounded-lg px-4 text-left transition-all ${file.id === selectedFileId
                ? "bg-primaryN30"
                : "border border-primaryN30"
                }`}
              onClick={() => handleSelectFile(file.id)}
            >
              <span className="max-w-[180px] truncate text-sm text-grey-dark">
                {file.file_name || `File ${file.id}`}
              </span>
              {file.operation_type && (
                <span className="mt-1 text-xs text-grey-normal">
                  {file.operation_type}
                </span>
              )}
            </button>
          ))}
        </div>
        <Button
          type="primary"
          className="custom-primary-btn"
          onClick={handleNext}
        >
          Next
        </Button>
      </header>
      {/* Content */}
      <div className="pl-6 pr-14 py-2 flex-1 flex flex-row overflow-hidden">
        {/* Left: Thumbnail */}
        <div
          className={`h-full shrink-0 transition-all duration-200 z-999 overflow-y-auto ${showThumbnail ? "w-[250px]" : "w-0"
            }`}
        >
          <EvidenceThumbailList
            pdfRef={pdfWrapperRef}
            data={thumbnailData}
            evidenceId={pageEvidenceId}
            onChangeEvidenceId={handlePageEvidenceChange}
            showShadow={false}
            showCategory={true}
            categoryList={ArchDrawingSummaryPageTypes}
            size={
              selectedFile?.operation_type === FileOperationType.Quote
                ? "larger"
                : "default"
            }
          />
        </div>
        {/* Right: PDF Viewer with Controls */}
        <div
          className={`min-w-0 flex-1 flex flex-col overflow-hidden ${showThumbnail ? "pl-0" : "pl-6"}`}
        >
          {/* PDF Controls Bar */}
          <div className="flex h-12 shrink-0 items-center justify-between">
            <div className="flex flex-row items-center gap-2">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-md bg-grey-light text-grey-normal transition-all hover:bg-primaryN30"
                onClick={() => setShowThumbnail(!showThumbnail)}
              >
                <Image
                  src="/assets/icons/thumbnail.svg"
                  width={16}
                  height={16}
                  alt="thumbnail icon"
                />
              </button>
              <AddRectBoxControls
                text="Add Box"
                handleAddRectBox={handleAddBox}
              />
            </div>
            <ZoomControls zoom={zoom} handleZoomChange={handleZoomChange} />
          </div>

          {/* PDF Viewer */}
          <div className="min-h-0 flex-1 overflow-hidden relative">
            <PdfWrapper
              ref={pdfWrapperRef}
              operationMode="edit"
              project_id={projectId as string}
              project_file_id={selectedFile?.id || 0}
              pdfUrl={pdfUrl}
              page={currentPage}
              zoom={zoom}
              allEvidence={itemBoxList}
              selectedEvidenceIds={selectedEvidenceIds}
              typeList={[]}
              pdfOperationType={
                selectedFile?.operation_type === "Quote"
                  ? FileOperationType.Quote
                  : FileOperationType.ArchitectureDrawing
              }
              evidenceDraggable={false}
              onChangePage={handlePageChange}
              onTotalPages={handleTotalPages}
              onDeleteEvidence={handleDeleteEvidence}
              onUpdateEvidence={handleUpdateEvidence}
              onItemEvidenceConfirm={handleItemEvidenceConfirm}
              onChangeSelectedEvidence={handleChangeSelectedEvidence}
            />
          </div>
        </div>
        {/** right view */}
        <div className="h-full w-[320px] shrink-0 border-l border-primaryN30 bg-white p-4 overflow-hidden">
          {evidenceType === PageType.FloorPlan && (
            <div className="w-[300px]">
              <LabelTable
                title="Floor Plan"
                data={floorPlanData}
                selectedId={selectedEvidenceIds?.[0] || ""}
                setShowScheduleModal={setShowScheduleModal}
                onSelect={handleSelectFloorPlan}
                onUpdateItem={handleUpdateItemByLabelTable}
                onDeleteSuccess={handleDeleteItemByLabelTable}
              />
            </div>
          )}

          {evidenceType === PageType.Elevation && (
            <div className="w-[300px]">
              <LabelTable
                title="Elevation"
                data={elevationData}
                selectedId={selectedEvidenceIds?.[0] || ""}
                setShowScheduleModal={setShowScheduleModal}
                onSelect={handleSelectElevation}
                onUpdateItem={handleUpdateItemByLabelTable}
                onDeleteSuccess={handleDeleteItemByLabelTable}
              />
            </div>
          )}
        </div>
      </div>
      {showLabelModal && (
        <LabelConfirmModal
          open={showLabelModal}
          onCancel={() => setShowLabelModal(false)}
          onSubmit={handleItemSubmit}
        >
        </LabelConfirmModal>
      )}
      {showScheduleModal && (
        <Modal
          title={null}
          open={showScheduleModal}
          onCancel={() => setShowScheduleModal(false)}
          width={"50vw"}
          centered={true}
          footer={null}
        >
          <div className="h-[80vh] flex flex-col overflow-hidden">
            <ImageList imagesData={scheduleList} showPreview={false} />
          </div>
        </Modal>
      )}
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
      {buildLoading && (
        <BuildingBackground step={"page-merge"} durationSeconds={20 * 60} />
      )}
    </div>
  );
}
