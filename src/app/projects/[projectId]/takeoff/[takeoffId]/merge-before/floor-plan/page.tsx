"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Spin, Modal, Popover, Select, Tooltip } from "antd";
import { useParams, useRouter } from "next/navigation";

import PdfWrapper from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/PdfWrapper";
import {
  ZoomControls,
  SelectPagesControls,
  AddRectBoxControls,
  ClearAllControls
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/Pdf-Controls";
import {
  getEvidenceBySubTextEvidenceIds,
} from "@/services/takeOffService";

import {
  getEvidenceByFileId,
} from "@/services/evidenceService";

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
import BatchEditEvidenceModal from "./components/BatchEditEvidenceModal";
import { ArchDrawingSummaryPageTypes } from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";
import EvidenceThumbailList from "./components/EvidenceThumbailList";
import LabelConfirmModal from "./components/LabelConfirmModal";
import { evidenceBatchDelete, evidenceBatchSubmit } from "@/services/evidenceService";
import LoadingScreen from "@/components/loading-screen";
import BuildingBackground from "../../identification/components/BuildingBackground";
import {
  getTakeOffById,
  getEvidencesWindowTableQuoteWithUrlByProjectFileId,
  getEvidencesElevationFloorPlanWithUrlByProjectFileId,
  getGroupedEvidencesByTakeOffAndFile,
} from "@/services/takeOffService";

import { AnalyzeItemBySourceTypeSSE } from "@/services/DrawingAiService";
import { getTemplates } from "@/services/templateService";
import { useUser } from "@/context/UserContext";
import { notify } from "@/utils/notify";
import { div } from "framer-motion/m";
const { confirm } = Modal;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

interface ExtendedProjectFile extends ProjectFileRecord {
  operation_type?: string;
}

interface PromptTemplateOption {
  id: number;
  name: string;
  description?: string;
  is_default?: boolean;
}

const EllipsisTooltipText = ({ text }: { text: string }) => {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const element = textRef.current;
      if (!element) return;
      setShowTooltip(element.scrollWidth > element.clientWidth);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    const observer = new ResizeObserver(() => {
      checkOverflow();
    });
    if (textRef.current) {
      observer.observe(textRef.current);
    }

    return () => {
      window.removeEventListener("resize", checkOverflow);
      observer.disconnect();
    };
  }, [text]);

  return (
    <Tooltip title={showTooltip ? text : null} placement="topLeft">
      <span ref={textRef} className="block max-w-full truncate">
        {text}
      </span>
    </Tooltip>
  );
};

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
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplateOption[]>(
    [],
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(1);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);
  const [areaEditModalOpen, setAreaEditModalOpen] = useState(false);
  const [areaEditEvidenceIds, setAreaEditEvidenceIds] = useState<number[]>([]);
  const eventSourceRef = useRef<{ close: () => void } | null>(null);
  const { username } = useUser();
  const [evidenceList, setEvidenceList] = useState<EvidenceType[]>([]);

  const promptHintText =
    "Customize the fields Cato uses to read your PDF. Create specialized templates to accurately capture data for different takeoff types (e.g., steel vs. aluminum).";

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
      notify.error({
        title: "Error",
        description: "Failed to load takeoff data.",
      });
    } finally {
      setFullLoading(false);
    }
  }, [takeOffId]);

  const fetchPromptTemplates = useCallback(async () => {
    const response = await getTemplates();
    if (response.status !== "success") {
      notify.error({
        title: "Error",
        description: "Failed to load prompt templates.",
      });
      return;
    }

    const list = response.data?.items || [];
    setPromptTemplates(list);

    let myTemplates = list?.filter((template: any) => template.create_user === username);

    const defaultTemplate =
      myTemplates.find((template: any) => template.is_default);
    if (defaultTemplate?.id) {
      setSelectedTemplateId(defaultTemplate.id);
    } else {
      if (list.length > 0) {
        setSelectedTemplateId(list[0].id);
      }
    }
  }, [username]);

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
      setThumbnailData(data);
      if (data.length > 0) {
        setCurrentPage(data[0].project_file_page_number || 0);
        setPageElevationId(data[0].id);
      }
    } else {
      notify.error({
        title: "Error",
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
      notify.error({
        title: "Error",
        description: "Failed to load schedule evidence data.",
      });
    }
  }, [selectedFileId]);

  // 获取当前文件的evidence，并按照type进行分类
  const getFileEvidences = useCallback(async () => {
    if (selectedFileId === -1) return;

    const response = await getEvidenceByFileId(
      projectId as string,
      selectedFileId as number,
      { filter_type: 'ArchDrawingLabel' },
    );
    if (response.status === "success") {
      const evidenceList = response?.data ?? [];
      if (evidenceList.length > 0) {
        let filter = evidenceList.filter((item: any) => item?.type === "Floor Plan" || item?.type === "Elevation");
        setEvidenceList(filter);
      } else {
        setEvidenceList([]);
      }
    } else {
      notify.error({
        title: "Error",
        description: "Failed to get file evidence",
      });
    }
  }, [selectedFileId]);


  const confirmItem = useRef<any>(null);

  const pdfUrl = useMemo(() => {
    return selectedFile?.parse_detail?.uploaded_file_url || "";
  }, [selectedFile]);

  const labelTableData = useMemo<any[]>(() => {
    return (itemBoxList || []).filter((item: any) => {
      return item?.type === "Floor Plan Item" || item?.type === "Elevation Item";
    });
  }, [itemBoxList]);

  const getItemsByPageEvidences = useCallback(
    async (id: number) => {
      if (id) {
        setItemBoxList([])
        let res = await getEvidenceBySubTextEvidenceIds(id.toString());
        if (res.status === "success" && res.data) {
          const removeParentFlags = (item: any) => {
            if (!item) return item;
            const { isParentEvidence, isOtherParentEvidence, ...rest } = item;
            return rest;
          };

          const currentPageEvidenceRaw = thumbnailData.find(
            (item: any) => item.id === id,
          );
          const currentPageEvidence = currentPageEvidenceRaw
            ? { ...removeParentFlags(currentPageEvidenceRaw), isParentEvidence: true }
            : null;

          let otherEvidence = thumbnailData.filter(
            (item: any) => item.id !== id,
          );
          let OtherPageEvidence = otherEvidence.map((item: any) => ({
            ...removeParentFlags(item),
            isOtherParentEvidence: true,
          }));

          let list = res.data || [];
          if (currentPageEvidence) {
            list.unshift(currentPageEvidence);
          }
          if (OtherPageEvidence.length > 0) {
            list.unshift(...OtherPageEvidence);
          }
          setItemBoxList(list);
        } else {
          notify.error({
            title: "Error",
            description: "Failed to load evidence data.",
          });
        }
      }
    },
    [currentPage, thumbnailData],
  );

  useEffect(() => {
    fetchTakeoffData();
    fetchPromptTemplates();
  }, [fetchTakeoffData, fetchPromptTemplates]);

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

  const handleSelectLabelItem = (item: { id: string | number }) => {
    setSelectedEvidenceIds([item.id]);
  };

  const getLabelFromOcrText = useCallback((ocrText: any): string => {
    if (!ocrText) return "";
    try {
      const parsed = typeof ocrText === "string" ? JSON.parse(ocrText) : ocrText;
      return String(parsed?.result?.Label || "").trim();
    } catch (error) {
      return "";
    }
  }, []);

  const hasEmptyLabelInCurrentEvidence = useMemo(() => {
    return labelTableData.some((item: any) => {
      const label = getLabelFromOcrText(item?.ocr_text);
      return !label;
    });
  }, [getLabelFromOcrText, labelTableData]);

  useEffect(() => {
    if (!pageEvidenceId) return;
    setThumbnailData((prev) =>
      prev.map((item) => {
        if (item.id !== pageEvidenceId) return item;
        if (Boolean(item?.has_empty_label) === hasEmptyLabelInCurrentEvidence) return item;
        return {
          ...item,
          has_empty_label: hasEmptyLabelInCurrentEvidence,
        };
      }),
    );
  }, [hasEmptyLabelInCurrentEvidence, pageEvidenceId]);

  const handleUpdateItemByLabelTable = useCallback(
    (updatedItem: any) => {
      setItemBoxList((prev) =>
        prev.map((item) => {
          if (item.id !== updatedItem.id) return item;
          return updatedItem;
        }),
      );
    },
    [],
  );

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

      let count = labelTableData.length;

      let itemInfo = { ...confirmItem.current };
      let groupId = itemInfo.groupId;
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
        notify.success({
          title: "Confirm success",
          duration: 1,
        });
        // 关闭弹窗
        setShowLabelModal(false);
        // 清除裁剪区域
        pdfWrapperRef.current?.removeCropSectionByIds?.([groupId]);
        // 刷新数据
        getItemsByPageEvidences(pageEvidenceId);
      } else {
        notify.error({
          title: res?.data?.detail || "Confirm failed",
        });
      }
    },
    [evidenceType, labelTableData],
  );

  const handleNext = async () => {
    if (!selectedFileId) return;

    let findLabelEmpty = (data: any) => {
      return data.find((item: any) => {
        try {
          let label = JSON.parse(item?.ocr_text)?.result?.Label;
          return label === "" || label === null;
        } catch (error) {
          console.log('error', error);
          return false;
        }
      });
    };
    if (
      (evidenceType === PageType.FloorPlan || evidenceType === PageType.Elevation) &&
      labelTableData?.length > 0 &&
      findLabelEmpty(labelTableData)
    ) {
      notify.error({
        title: "Please fill in all the labels.",
      });
      return;
    }

    handleAnaylize();
  };

  const formatAnalyzeErrorMessage = useCallback((error: unknown) => {
    if (!error) return "Failed to analyze the file.";

    const parseServerError = (payload: any) => {
      if (payload?.status === "error") {
        return payload?.err?.message || payload?.message || "Failed to analyze the file.";
      }
      return payload?.message || payload?.error || "";
    };

    if (typeof error === "string") {
      try {
        const parsed = JSON.parse(error);
        const parsedError = parseServerError(parsed);
        if (parsedError) return parsedError;
      } catch {
        return error;
      }
      return error;
    }

    if (typeof error === "object") {
      const parsedError = parseServerError(error);
      if (parsedError) return parsedError;
    }

    return "Failed to analyze the file.";
  }, []);

  const handleChangeSelectedEvidence = (evidenceIds: number[]) => {
    // 获取evidenceIds
    if (evidenceIds.length > 0) {
      setSelectedEvidenceIds(evidenceIds);
    }
  };

  const handleGetGroupedEvidences = useCallback(async () => {
    const groupedResponse = await getGroupedEvidencesByTakeOffAndFile(
      takeOffId as string,
      selectedFileId as any,
    );
    setFullLoading(false);
    if (groupedResponse.status !== "success") {
      notify.error({
        title: "Error",
        description:
          groupedResponse?.data?.detail ||
          "Failed to get grouped evidences by takeoff and file",
      });
      return;
    }
    const groupedData = groupedResponse?.data || {};
    const schedule = Array.isArray(groupedData?.schedule)
      ? groupedData.schedule
      : [];
    if (schedule.length === 0) {
      router.push(
        `/projects/${projectId}/takeoff/${takeOffId}/manual-merge-v3`,
      );
      return;
    } else {
      router.push(
        `/projects/${projectId}/takeoff/${takeOffId}/merge-before/schedule`,
      );
      return;
    }
  }, [takeOffId, selectedFileId]);

  const handleAnaylize = useCallback(async () => {
    if (!selectedTemplateId) {
      notify.error({
        title: "Error",
        description: "Please select a reading prompt before analysis.",
      });
      return;
    }

    setBuildLoading(true);
    // Close existing SSE connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const sseConnection = AnalyzeItemBySourceTypeSSE(takeOffId as string, selectedTemplateId, {
      onConnected: () => {
        console.log("[SSE] Connected to analyze service");
      },
      onHeartbeat: (data) => {
        console.log("[SSE] Heartbeat received:", data);
      },
      onCompleted: (result: any) => {
        console.log("[SSE] Analysis completed:", result);
        eventSourceRef.current = null;
        handleGetGroupedEvidences();
      },
      onError: (error: string) => {
        console.error("[SSE] Analysis error:", error);
        setBuildLoading(false);
        eventSourceRef.current = null;
        const formattedError = formatAnalyzeErrorMessage(error);
        notify.error({
          title: "Error",
          description: formattedError,
        });
      },
    });

    eventSourceRef.current = sseConnection;
  }, [selectedTemplateId, takeOffId, projectId, router, formatAnalyzeErrorMessage]);

  const handleBack = () => {
    router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification/page-label`);
  };

  const handleClearAllCrop = () => {
    if (!pdfWrapperRef.current) return;

    // 调用删除接口
    pdfWrapperRef?.current?.handleBatchDelete(false);
  };

  const handleCancelAreaEditModal = useCallback(() => {
    setAreaEditModalOpen(false);
    //setAreaEditEvidenceIds([]);
  }, []);

  const handleAreaEditSuccess = useCallback(async () => {
    handleCancelAreaEditModal();
    pdfWrapperRef.current?.clearAreaSelection?.();
    await getItemsByPageEvidences(pageEvidenceId);
  }, [getItemsByPageEvidences, handleCancelAreaEditModal, pageEvidenceId]);

  const getLabelsByEvidenceIds = useCallback((evidenceIds: number[]) => {
    return itemBoxList
      .filter((item: any) => evidenceIds.includes(item.id))
      .map((item: any) => {
        try {
          return JSON.parse(item.ocr_text)?.result?.Label;
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);
  }, [itemBoxList]);

  const handleOpenBatchEditByIds = useCallback((evidenceIds: number[]) => {
    setAreaEditEvidenceIds(evidenceIds);
    setAreaEditModalOpen(true);
  }, []);

  const handleDeleteByEvidenceIds = useCallback((evidenceIds: number[]) => {
    const labels = getLabelsByEvidenceIds(evidenceIds);
    confirm({
      title: <div>Are you sure you want to delete labels:<br /> {labels.join(', ') + "?"} </div>,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        let res = await evidenceBatchDelete(evidenceIds);
        if (res?.status === 'success') {
          notify.success({
            title: "Success",
            description: "Labels deleted successfully.",
          });
          pdfWrapperRef.current?.clearAreaSelection();
          getItemsByPageEvidences(pageEvidenceId);
        } else {
          notify.error({
            title: res?.data?.detail || "Failed to delete labels.",
          });
        }
      },
    });
  }, [getItemsByPageEvidences, getLabelsByEvidenceIds, pageEvidenceId]);

  const handleAreaSelectionAction = useCallback(({ action, evidenceIds }: { action: 'edit' | 'delete', evidenceIds: number[] }) => {
    if (action === 'edit') {
      handleOpenBatchEditByIds(evidenceIds);
    } else if (action === 'delete') {
      handleDeleteByEvidenceIds(evidenceIds);
    }
  }, [handleDeleteByEvidenceIds, handleOpenBatchEditByIds]);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-white font-nunito">
      {/* Header */}
      <header className="px-14 flex h-[110px] shrink-0 items-center justify-between border-b border-primaryN30 bg-white">
        {/* <div className="cursor-pointer" onClick={handleBack}>
          <Image src="/assets/icons/arrow-back.svg" alt="logo" width={12} height={6} style={{ height: 'auto' }}></Image>
        </div> */}
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
        <div className="flex flex-row items-end gap-2">
          <div className="mr-3 flex items-center gap-2">
            <span className="text-sm text-forumBlue-normal">Reading Prompt</span>
            <Popover
              placement="bottomLeft"
              title={null}
              content={
                <div className="w-[360px] rounded-2xl p-2">
                  <div className="text-sm text-grey-dark">
                    Reading Prompt
                  </div>
                  <div className="mt-1 text-xs leading-[1.4] text-grey-normal">
                    {promptHintText}
                  </div>
                </div>
              }
              trigger="hover"
            >
              <Image
                src="/assets/icons/info-forum-blue.svg"
                alt="prompt hint"
                className="cursor-pointer"
                width={14}
                height={14}
              />
            </Popover>
            <Select
              className="w-[200px]"
              value={selectedTemplateId}
              onChange={(value: number | string) => {
                console.log("value", value);
                setSelectedTemplateId(Number(value));
              }}
              options={promptTemplates.map((template) => ({
                label: <EllipsisTooltipText text={template.name} />,
                value: template.id,
              }))}
              dropdownRender={(menu: ReactNode) => (
                <div>
                  {menu}
                  <div
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-forumBlue-normal hover:bg-primaryN20"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => router.push("/knowledge-base-cato")}
                  >
                    <span>Edit Prompts</span>
                    <span className="text-[18px] leading-none">+</span>
                  </div>
                </div>
              )}
            />
          </div>
          <Popover
            placement="rightBottom"
            title={null}
            content={
              <div className="py-1 w-[240px] flex flex-col text-grey-normal">
                The templates created by others can only be viewed and no other operations can be performed on them.
              </div>
            }
            trigger="hover"
          >
            <Image
              src="/assets/icons/info-forum-blue.svg"
              alt="info circle icon"
              className="cursor-pointer"
              width={14}
              height={14}
            ></Image>
          </Popover>
          <Button
            type="primary"
            className="custom-primary-btn"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
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
            showDownload={true}
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
          <div className="px-2 flex h-12 shrink-0 items-center justify-between">
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
              <ClearAllControls handleClearAll={handleClearAllCrop} />
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
              evidenceDraggable={true}
              showAddBtnOnBox={true}
              enableAreaSelection={true}
              onChangePage={handlePageChange}
              onTotalPages={handleTotalPages}
              onDeleteEvidence={handleDeleteEvidence}
              onUpdateEvidence={handleUpdateEvidence}
              onItemEvidenceConfirm={handleItemEvidenceConfirm}
              onChangeSelectedEvidence={handleChangeSelectedEvidence}
              onChangeZoom={handleZoomChange}
              onAreaSelectionAction={handleAreaSelectionAction}
            />
          </div>
        </div>
        {/** right view */}
        <div className="h-full w-[350px] shrink-0 border-l border-primaryN30 bg-white p-4 overflow-hidden">
          <div className="w-[300px]">
            <LabelTable
              title="Labels"
              data={labelTableData}
              selectedId={selectedEvidenceIds?.[0] || ""}
              setShowScheduleModal={setShowScheduleModal}
              onSelect={handleSelectLabelItem}
              onUpdateItem={handleUpdateItemByLabelTable}
              onDeleteSuccess={handleDeleteItemByLabelTable}
              onBatchEditRequest={handleOpenBatchEditByIds}
              onBatchDeleteRequest={({ evidenceIds }) => {
                handleDeleteByEvidenceIds(evidenceIds);
              }}
            />
          </div>
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
            <ImageList imagesData={scheduleList} />
          </div>
        </Modal>
      )}
      <BatchEditEvidenceModal
        open={areaEditModalOpen}
        evidenceIds={areaEditEvidenceIds}
        evidences={itemBoxList as any[]}
        onCancel={handleCancelAreaEditModal}
        onSuccess={handleAreaEditSuccess}
      />
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
      {buildLoading && (
        <BuildingBackground step={"page-merge"} durationSeconds={20 * 60} />
      )}
    </div>
  );
}
