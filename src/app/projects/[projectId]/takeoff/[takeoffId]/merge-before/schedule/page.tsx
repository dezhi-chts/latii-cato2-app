"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Image, Popover, Modal, Tooltip } from "antd";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";

import {
  EvidenceType,
  FileOperationType,
  GroupType,
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";
import { ArchDrawingSummaryPageTypes } from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";
import EvidenceThumbailList from "../floor-plan/components/EvidenceThumbailList";
import LoadingScreen from "@/components/loading-screen";
import {
  getTakeOffById,
  getEvidencesWindowTableQuoteWithUrlByProjectFileId,
  getTakeOffResultItemsByEvidenceIds,
  updateTakeOffResultItemResultById,
  deleteTakeOffResultItemById,
  reconcileTakeOffResultItemsByTakeOffAndFile,
  deleteTakeOffResultItemByEvidenceId,
  validateScheduleSubLabelsByTakeOffAndFile,
  addTakeOffResultItemByEvidenceId,
} from "@/services/takeOffService";
import { getTemplateById } from "@/services/templateService";
import {
  getDisplayValueByField,
  normalizeFieldName,
  parseItemResult as parseItemResultUtil,
} from "../../analyze-new/takeoffUtils";
import { EvidenceRecord } from "../../analyze-new/types";
import BuildingBackground from "../../identification/components/BuildingBackground";
import DisplayColumnsModal from "./components/DisplayColumnsModal";
import ScheduleEvidenceImage, {
  type NormalizedCoordinates,
  type ScheduleEvidenceImageRef,
} from "./components/ScheduleEvidenceImage";
import EvidenceImagePreviewModal from "../../analyze-new/components/EvidenceImagePreviewModal";
import { notify } from "@/utils/notify";
import ScheduleTable from "./components/ScheduleTable";
import { useBrowserBackToHome } from "@/app/projects/[projectId]/takeoff/[takeoffId]/hooks/useBrowserBackToHome";
import TakeoffFileWorkflowNav from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/workflow/TakeoffFileWorkflowNav";
const { confirm } = Modal;

const REQUIRED_VISIBLE_COLUMNS: readonly string[] = [];

export default function SchedulePage() {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;

  const pdfWrapperRef = useRef<any>(null);
  const scheduleEvidenceImageRef = useRef<ScheduleEvidenceImageRef | null>(null);

  const [fullLoading, setFullLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [pageEvidenceId, setPageEvidenceId] = useState<number>(-1);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<any>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [itemBoxList, setItemBoxList] = useState<EvidenceType[]>([]);
  const [itemBoxEvidenceId, setItemBoxEvidenceId] = useState<number>(-1);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);
  const [templateColumns, setTemplateColumns] = useState<string[]>([]);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnDraft, setColumnDraft] = useState<string[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [buildingLoading, setBuildingLoading] = useState<boolean>(false);
  useBrowserBackToHome({
    disableBrowserNavigation: buildingLoading,
  });
  const [focusedItemId, setFocusedItemId] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isSingleLabelUpdatingRef = useRef(false);
  const isBatchLabelUpdatingRef = useRef(false);

  const selectedFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId) || null;
  }, [files, selectedFileId]);

  const currentScheduleEvidence = useMemo(() => {
    return scheduleList.find((item) => item.id === pageEvidenceId) || null;
  }, [scheduleList, pageEvidenceId]);

  const previewImageUrl = useMemo(() => {
    const pageNumber =
      Number(currentScheduleEvidence?.project_file_page_number || currentPage || 0) || 0;
    const pageInfo = selectedFile?.parse_detail?.image_page_infos?.find(
      (item: any, index: number) =>
        Number(item?.project_file_page_number || item?.page_number || index + 1) === pageNumber,
    );
    return pageInfo?.s3_url || imageUrl;
  }, [currentPage, currentScheduleEvidence, imageUrl, selectedFile]);

  const previewPageEvidences = useMemo<EvidenceRecord[]>(() => {
    if (!currentScheduleEvidence) return [];
    return [currentScheduleEvidence as EvidenceRecord];
  }, [currentScheduleEvidence]);

  const fetchTakeoffData = useCallback(async () => {
    if (!takeOffId) return;

    setFullLoading(true);
    const response = await getTakeOffById(takeOffId as string);
    setFullLoading(false);
    if (response.status === "success") {
      const projectFiles: any[] =
        response.data?.project_files || [];
      setFiles(projectFiles);
      if (projectFiles?.length > 0) {
        setSelectedFileId(projectFiles[0].id);
      }
      resolveColumnNames(response.data?.take_off_result?.template_id || 1);
    } else {
      notify.error({
        title: "Error",
        description: response?.data?.detail || "Failed to load takeoff data.",
      });
    }
  }, [takeOffId]);

  const fetchScheduleEvidenceList = useCallback(async (fileId: number) => {
    if (!fileId) return;
    const response = await getEvidencesWindowTableQuoteWithUrlByProjectFileId(
      fileId.toString(),
    );
    if (response.status === "success" && response.data) {
      let list = response.data || [];
      setScheduleList(list);
      if (list.length > 0) {
        let existingScheduleEvidence = list.find(
          (item: any) => item.id === pageEvidenceId,
        );
        const nextEvidence = existingScheduleEvidence || list[0];
        setPageEvidenceId(nextEvidence.id);
        setCurrentPage(nextEvidence?.project_file_page_number || 0);
        setImageUrl(nextEvidence?.evidence_url || "");
      }
    } else {
      notify.error({
        title: "Error",
        description: response?.data?.detail || "Failed to load schedule source data.",
      });
    }
  }, [pageEvidenceId]);

  const getItemsByPageEvidences = useCallback(
    async (id: number) => {
      if (id) {
        setFullLoading(true);
        let res = await getTakeOffResultItemsByEvidenceIds(id.toString());
        setFullLoading(false);
        if (res.status === "success" && res.data) {
          let values: any = Object.values(res.data || {}) || [];
          let list = values.flatMap((item: any) => item || []);
          setItemBoxList(list);
          setColumns(resolveColumnsWithValue(list, templateColumns));
          setItemBoxEvidenceId(id);
        } else {
          setItemBoxList([]);
          setColumns([]);
          setItemBoxEvidenceId(id);
          notify.error({
            title: "Error",
            description: res?.data?.detail || "Failed to load source data.",
          });
        }
      }
    },
    [resolveColumnsWithValue, templateColumns],
  );

  useEffect(() => {
    fetchTakeoffData();
  }, []);

  useEffect(() => {
    if (selectedFileId) {
      fetchScheduleEvidenceList(selectedFileId);
    }
  }, [selectedFileId]);

  useEffect(() => {
    if (pageEvidenceId !== -1) {
      getItemsByPageEvidences(pageEvidenceId);
    }
  }, [pageEvidenceId]);

  useEffect(() => {
    if (pageEvidenceId !== -1) {
      setImageUrl(scheduleList.find((item) => item.id === pageEvidenceId)?.evidence_url || "");
    }
  }, [pageEvidenceId, scheduleList]);

  useEffect(() => {
    setFocusedItemId(null);
  }, [pageEvidenceId, selectedFileId]);

  useEffect(() => {
    if (focusedItemId === null) return;
    const exists = itemBoxList.some((item: any) => Number(item?.id) === focusedItemId);
    if (!exists) {
      setFocusedItemId(null);
    }
  }, [focusedItemId, itemBoxList]);


  const handlePageEvidenceChange = useCallback(
    (evidenceId: any) => {
      setPageEvidenceId(evidenceId);
      const selectedEvidence = scheduleList.find((item) => item.id === evidenceId);
      setCurrentPage(selectedEvidence?.project_file_page_number || 0);
      setImageUrl(selectedEvidence?.evidence_url || "");
      setFocusedItemId(null);
    },
    [scheduleList],
  );

  const handleSelectOverlayItem = useCallback((itemId: number) => {
    setFocusedItemId(itemId);
  }, []);

  const handleFocusItemFromTable = useCallback(
    (itemId: number) => {
      setFocusedItemId(itemId);
    },
    [],
  );

  // Ensure Label and Sub Label are always at the beginning and adjacent
  const ensureLabelFieldsFirst = (fields: string[]): string[] => {
    const hasLabel = fields.includes("Label");
    const hasSubLabel = fields.includes("Sub Label");
    const otherFields = fields.filter(
      (f) => f !== "Label" && f !== "Sub Label",
    );

    const result: string[] = [];
    if (hasLabel) result.push("Label");
    if (hasSubLabel) result.push("Sub Label");
    result.push(...otherFields);

    return result;
  };

  function hasDisplayValue(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed !== "" && trimmed !== "-";
    }
    if (typeof value === "number") {
      return Number.isFinite(value);
    }
    if (typeof value === "boolean") {
      return true;
    }
    if (Array.isArray(value)) {
      return value.some((item) => hasDisplayValue(item));
    }
    if (typeof value === "object") {
      return Object.values(value as Record<string, unknown>).some((item) =>
        hasDisplayValue(item),
      );
    }
    return false;
  }

  function resolveColumnsWithValue(rows: any[], orderedTemplateColumns: string[]) {
    const fieldSet = new Set<string>();
    (rows || []).forEach((row) => {
      const parsedResult = parseItemResultUtil((row as any)?.result as any) || {};
      Object.entries(parsedResult).forEach(([fieldName, fieldValue]) => {
        if (!fieldName) return;
        if (hasDisplayValue(fieldValue)) {
          fieldSet.add(normalizeFieldName(fieldName));
        }
      });
    });

    const availableFields = Array.from(fieldSet);
    const templateOrder = orderedTemplateColumns.filter((field) =>
      fieldSet.has(field),
    );
    const extraFields = availableFields.filter(
      (field) => !orderedTemplateColumns.includes(field),
    );
    return ensureLabelFieldsFirst([...templateOrder, ...extraFields]);
  }

  const normalizeVisibleColumns = useCallback(
    (candidateColumns: string[], allTemplateColumns: string[]) => {
      const allSet = new Set(allTemplateColumns);
      const candidateSet = new Set(
        candidateColumns.map((field) => normalizeFieldName(field)),
      );
      const orderedFromTemplate = allTemplateColumns.filter((field) =>
        candidateSet.has(field),
      );
      const extraFields = Array.from(candidateSet).filter(
        (field) => !allSet.has(field),
      );
      return ensureLabelFieldsFirst([...orderedFromTemplate, ...extraFields]);
    },
    [],
  );

  const resolveColumnNames = useCallback(
    async (templateId: number, forceRefresh: boolean = false) => {
      try {
        const result = await getTemplateById(templateId);
        if (result.status === "success" && result.data) {
          const template = result.data;
          // Extract field names from template fields
          const fields = template.fields || [];
          const fieldNames = fields
            .map((field: any) => field.name || field.field_name)
            .filter(Boolean)
            .map(normalizeFieldName);

          if (fieldNames.length > 0) {
            // Ensure Label and Sub Label are first
            const orderedFields = ensureLabelFieldsFirst(fieldNames);
            setTemplateColumns(orderedFields);
            return orderedFields;
          }
        }
      } catch (error) {
        console.error("Error fetching template:", error);
      }

      // Fallback to default fields if template fetch fails
      const defaultFields = [
        "Label",
        "Sub Label",
        "Product",
        "Product Type",
        "Operability",
        "Width",
        "Height",
        "Width_mm",
        "Height_mm",
        "Quantity",
        "Glass Layer",
        "Glass Width",
        "Glass Brand",
        "Glass Type",
        "Glass Arrangement Configuration",
        "Glass Arrangement Spacer Type",
        "Location",
        "Source Type",
      ];
      setTemplateColumns(defaultFields);
      return defaultFields;
    },
    [],
  );

  const handleOpenColumnModal = useCallback(() => {
    setColumnDraft(columns);
    setColumnModalOpen(true);
  }, [columns]);

  const handleCancelColumnModal = useCallback(() => {
    setColumnModalOpen(false);
    setColumnDraft([]);
  }, []);

  const handleToggleColumnDraft = useCallback((fieldName: string, checked: boolean) => {
    setColumnDraft((prev) => {
      const nextSet = new Set(prev);
      if (checked) {
        nextSet.add(fieldName);
      } else {
        nextSet.delete(fieldName);
      }
      return templateColumns.filter((field) => nextSet.has(field));
    });
  }, [templateColumns]);

  const handleConfirmColumnModal = useCallback(() => {
    const nextColumns = normalizeVisibleColumns(columnDraft, templateColumns);
    setColumns(nextColumns);
    setColumnModalOpen(false);
    setColumnDraft([]);
  }, [columnDraft, normalizeVisibleColumns, templateColumns]);

  const handleSelectFile = (fileId: number) => {
    // Implement logic to select a file
    setSelectedFileId(fileId);
  };

  const handleUpdateScheduleItemField = useCallback(
    async (
      updatedItem: any,
      fieldName: string,
      oldValue: string,
      newValue: string,
    ) => {
      const itemId = Number(updatedItem?.id);
      if (!itemId) return false;
      if (oldValue === newValue) return true;
      if (fieldName === "Label" && !String(newValue || "").trim()) {
        notify.error({
          title: "Error",
          description: "Label cannot be empty.",
        });
        return false;
      }

      setItemBoxList((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));

      isSingleLabelUpdatingRef.current = true;
      let updateRes: any = null;
      try {
        updateRes = await updateTakeOffResultItemResultById(
          itemId.toString(),
          updatedItem?.result || {},
        );
      } finally {
        isSingleLabelUpdatingRef.current = false;
      }
      if (updateRes.status === "success") {
        notify.success({
          title: "Success",
          description: `${fieldName} updated successfully.`,
        });
        return true;
      }

      setItemBoxList((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const parsedResult = parseItemResultUtil((item as any)?.result as any);
          return {
            ...item,
            result: {
              ...parsedResult,
              [fieldName]: oldValue,
            },
          };
        }),
      );
      notify.error({
        title: "Error",
        description: updateRes?.data?.detail || "Failed to update item. Changes have been reverted.",
      });
      return false;
    },
    [],
  );

  const handleBatchLabelUpdatingChange = useCallback((isUpdating: boolean) => {
    isBatchLabelUpdatingRef.current = isUpdating;
  }, []);

  const hasEmptyLabelInTable = useMemo(() => {
    return itemBoxList.some((item) => {
      const parsedResult = parseItemResultUtil((item as any)?.result as any);
      const labelValue = String(parsedResult?.Label ?? "").trim();
      return !labelValue || labelValue === "-";
    });
  }, [itemBoxList]);

  const dedupedLabelsInCurrentEvidence = useMemo(() => {
    const labelSet = new Set<string>();
    itemBoxList.forEach((item) => {
      const parsedResult = parseItemResultUtil((item as any)?.result as any);
      const labelValue = String(parsedResult?.Label ?? "").trim();
      if (!labelValue || labelValue === "-") return;
      labelSet.add(labelValue);
    });
    return Array.from(labelSet).sort((a, b) => a.localeCompare(b));
  }, [itemBoxList]);

  useEffect(() => {
    if (pageEvidenceId === -1) return;
    if (itemBoxEvidenceId !== pageEvidenceId) return;
    setScheduleList((prev) => {
      let hasChanged = false;
      const next = prev.map((item) => {
        if (item.id !== pageEvidenceId) return item;
        const prevLabels = Array.isArray(item?.label_list) ? item.label_list : [];
        const labelsChanged =
          prevLabels.length !== dedupedLabelsInCurrentEvidence.length ||
          prevLabels.some((label: string, index: number) => label !== dedupedLabelsInCurrentEvidence[index]);
        const emptyChanged = Boolean(item?.has_empty_label) !== hasEmptyLabelInTable;

        if (!labelsChanged && !emptyChanged) {
          return item;
        }
        hasChanged = true;
        return {
          ...item,
          has_empty_label: hasEmptyLabelInTable,
          label_list: dedupedLabelsInCurrentEvidence,
        };
      });
      return hasChanged ? next : prev;
    });
  }, [dedupedLabelsInCurrentEvidence, hasEmptyLabelInTable, pageEvidenceId]);

  const handleDeleteScheduleItem = useCallback(
    async (itemId: number) => {
      if (!itemId) return false;

      const deleteRes = await deleteTakeOffResultItemById(itemId.toString());
      if (deleteRes.status !== "success") {
        notify.error({
          title: "Error",
          description: deleteRes?.data?.detail || "Failed to delete item.",
        });
        return false;
      }

      notify.success({
        title: "Success",
        description: "Item deleted successfully.",
      });
      await getItemsByPageEvidences(pageEvidenceId);
      return true;
    },
    [getItemsByPageEvidences, pageEvidenceId],
  );

  const handleDeleteScheduleEvidence = useCallback(
    async (evidenceInfo: any) => {
      confirm({
        title: "Delete Schedule Evidence",
        content: `Are you sure you want to delete this schedule evidence?`,
        okText: "Delete",
        okType: "danger",
        cancelText: "Cancel",
        onOk: async () => {
          let res = await deleteTakeOffResultItemByEvidenceId(evidenceInfo.id);
          if (res.status === "success") {
            notify.success({
              title: "Success",
              description: "source deleted successfully.",
            });
            // 刷新take off result items
            if (selectedFileId) {
              fetchScheduleEvidenceList(selectedFileId);
            }
          } else {
            notify.error({
              title: "Error",
              description: res?.data?.detail || "Failed to delete source.",
            });
          }
        }
      })
    },
    [getItemsByPageEvidences, pageEvidenceId],
  );

  const handleCreateItem = useCallback(async () => {
    if (!takeOffId || !selectedFileId || pageEvidenceId === -1) {
      notify.error({
        title: "Error",
        description: "Missing takeoff context, unable to create item.",
      });
      return;
    }

    let firstItem = null;
    let firstLabel = '';

    // if (!itemBoxList.length) {
    //   notify.error({
    //     title: "Error",
    //     description: "No reference label found in current item list.",
    //   });
    //   return;
    // }
    if (itemBoxList?.length === 0) {
      firstLabel = 'Label';
    } else {
      firstItem = itemBoxList[0] as any;
      firstLabel = String(getDisplayValueByField(firstItem?.result || {}, "Label") || "")
        .replace(/^-$/, "")
        .trim();
      if (!firstLabel) {
        notify.error({
          title: "Error",
          description: "The first item's Label is empty. Unable to create item.",
        });
        return;
      }
    }

    setFullLoading(true);
    const response = await addTakeOffResultItemByEvidenceId(
      String(takeOffId),
      String(selectedFileId),
      String(pageEvidenceId),
      { Label: firstLabel },
    );
    setFullLoading(false);
    if (response.status !== "success") {
      notify.error({
        title: "Error",
        description: response?.data?.detail || "Failed to create item.",
      });
      return;
    }

    await getItemsByPageEvidences(pageEvidenceId);
  }, [getItemsByPageEvidences, itemBoxList, pageEvidenceId, selectedFileId, takeOffId]);

  const resolveCurrentLabel = useCallback(() => {
    const focusedItem = itemBoxList.find((item: any) => Number(item?.id) === focusedItemId);
    const fallbackItem = itemBoxList[0];
    const targetItem = focusedItem || fallbackItem;
    if (!targetItem) return "";
    const label = String(getDisplayValueByField((targetItem as any)?.result || {}, "Label") || "")
      .replace(/^-$/, "")
      .trim();
    return label;
  }, [focusedItemId, itemBoxList]);

  const resolveCurrentLabelForCreateItem = useCallback(() => {
    const currentLabel = resolveCurrentLabel();
    return currentLabel || "Label";
  }, [resolveCurrentLabel]);

  const extractLabelFromCreateResponse = useCallback((payload: any) => {
    if (!payload) return "";
    return String(payload?.result?.Label || "").trim();
  }, []);

  const isCurrentEvidenceTable = useMemo(() => {
    return String(currentScheduleEvidence?.type || "").trim() === GroupType.Table;
  }, [currentScheduleEvidence]);

  const handleConfirmSubItemBox = useCallback(
    async (coordinates: NormalizedCoordinates) => {
      if (!takeOffId || !selectedFileId || pageEvidenceId === -1) {
        notify.error({
          title: "Error",
          description: "Missing takeoff context, unable to create sub item.",
        });
        return false;
      }
      if (isCurrentEvidenceTable) {
        setFullLoading(true);
        const ocrResponse = await addTakeOffResultItemByEvidenceId(
          String(takeOffId),
          String(selectedFileId),
          String(pageEvidenceId),
          {},
          coordinates,
        );
        setFullLoading(false);
        if (ocrResponse.status !== "success") {
          notify.error({
            title: "Error",
            description: ocrResponse?.data?.detail || "Failed to OCR and create sub item.",
          });
          return false;
        }
        const currentLabel = resolveCurrentLabel();
        const recognizedLabel = extractLabelFromCreateResponse(ocrResponse?.data);
        notify.success({
          title: "Success",
          description: "OCR recognition completed.",
        });
        if (
          currentLabel &&
          recognizedLabel &&
          recognizedLabel.toLowerCase() === currentLabel.toLowerCase()
        ) {
          await getItemsByPageEvidences(pageEvidenceId);
          return true;
        }
        await fetchScheduleEvidenceList(selectedFileId);
        return true;
      }

      // Non-Table: keep +Item behavior, but persist coordinates for replay.
      const nextLabel = resolveCurrentLabelForCreateItem();
      setFullLoading(true);
      const createResponse = await addTakeOffResultItemByEvidenceId(
        String(takeOffId),
        String(selectedFileId),
        String(pageEvidenceId),
        { Label: nextLabel },
        coordinates,
      );
      setFullLoading(false);
      if (createResponse.status !== "success") {
        notify.error({
          title: "Error",
          description: createResponse?.data?.detail || "Failed to create sub item.",
        });
        return false;
      }
      notify.success({
        title: "Success",
        description: "Sub item created successfully.",
      });
      await getItemsByPageEvidences(pageEvidenceId);
      return true;
    },
    [
      extractLabelFromCreateResponse,
      fetchScheduleEvidenceList,
      getItemsByPageEvidences,
      isCurrentEvidenceTable,
      pageEvidenceId,
      resolveCurrentLabel,
      resolveCurrentLabelForCreateItem,
      selectedFileId,
      takeOffId,
    ],
  );

  const handleAddSubItems = useCallback(() => {
    scheduleEvidenceImageRef.current?.addSubItemBox();
  }, []);

  const handleReconcileTakeOff = async () => {
    setBuildingLoading(true);
    // 先检测当前文件是否存在schedule sub label
    const validateRes = await validateScheduleSubLabelsByTakeOffAndFile(takeOffId as string, selectedFileId as any);
    if (validateRes.status !== "success") {
      setBuildingLoading(false);
      let detail = validateRes?.data?.detail;
      if (detail?.invalid_count > 0) {
        let groups: any = {};
        if (detail?.invalid_items?.length > 0) {
          // 统计相同的Label数量
          detail?.invalid_items?.forEach((item: any) => {
            let label = item?.label || "";
            if (!groups[label]) groups[label] = 0;
            groups[label]++;
          })
        }
        // 存在schedule sub label，则提示用户
        confirm({
          title: `Warning: ${detail?.message}`,
          content: <div>
            <div>Invalid Count: {detail?.invalid_count}</div>
            <div>{Object.keys(groups).map((label) => <div key={label}>Label: {label}: {groups[label]}</div>)}</div>
          </div>,
          okText: "Continue",
          okType: "danger",
          cancelText: "Cancel",
          onOk: async () => {
            // 跳转到groups中第一个label的schedule sub label页面
            let firstLabel = Object.keys(groups)?.[0] || "";
            if (!firstLabel) return;
            let targetEvidence = scheduleList.find((item: any) => item?.label_list?.includes(firstLabel));
            if (targetEvidence) {
              setPageEvidenceId(targetEvidence.id);
            }
          }
        })
      } else {
        notify.error({
          title: "Error",
          description: validateRes?.data?.detail || "Failed to validate schedule sub labels.",
        });
      }
      return;
    }

    let res = await reconcileTakeOffResultItemsByTakeOffAndFile(takeOffId as string, selectedFileId as any)
    setBuildingLoading(false);
    if (res.status === "success") {
      notify.success({
        title: "Success",
        description: "Take off result items reconciled successfully.",
      });
      // 跳转到下一个take off result items
      router.replace(`/projects/${projectId}/takeoff/${takeOffId}/manual-merge-v3`);
    } else {
      notify.error({
        title: "Error",
        description: res?.data?.detail || "Failed to reconcile take off result items.",
      });
    }
  }

  const handleNext = () => {
    if (isSingleLabelUpdatingRef.current || isBatchLabelUpdatingRef.current) {
      notify.warning({
        title: "Warning",
        description: "Label is currently being updated. Please wait..",
      });
      return;
    }
    if (hasEmptyLabelInTable) {
      notify.warning({
        title: "Label Required",
        description: "Please make sure all labels are not empty before clicking Next.",
      });
      return;
    }
    handleReconcileTakeOff();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white font-nunito">
      {/* Header */}
      <header className="px-14 flex h-[110px] shrink-0 items-start justify-between border-b border-primaryN30 bg-white pt-4">
        {/* <div>
          <div className="cursor-pointer" onClick={handleBack}>
            <Image src="/assets/icons/arrow-back.svg" alt="logo" width={12} height={6} style={{ height: 'auto' }}></Image>
          </div>
        </div> */}

        <TakeoffFileWorkflowNav
          className="ml-6 flex-1"
          files={files}
          selectedFileId={selectedFileId}
          onSelectFile={(id) => handleSelectFile(Number(id))}
          currentStep="schedules"
          projectId={String(projectId || "")}
          takeoffId={String(takeOffId || "")}
        />
        <div className="h-full flex flex-row items-center gap-2">
          <Popover
            placement="rightBottom"
            title={null}
            content={
              <div className="py-1 w-[300px] flex flex-col gap-1 text-xs text-grey-normal">
                <div>1.Please make sure all labels are not empty.</div>
                <div>2.System: <br></br>
                  If there are multiple pieces of data, it indicates that it is a system. Here, it refers to the components of the reviewed system.<br></br>
                  Example: If this system is composed of two types of windows, then there should only be two pieces of data here.<br></br>
                  If it is not "system", the "Sub Label" must be empty. <br></br>
                  If it is "system", the "Sub Label" cannot be empty.
                </div>
                <div>
                  3.Sub Label Naming Convention Suggestions：<br></br>
                  Example: Label_suffix。 <br></br>
                  suffix = “L”, “R”, “1”, “2”, or based on reading order
                </div>
              </div>
            }
            trigger="hover"
          >
            <Image
              src="/assets/icons/info-forum-blue.svg"
              alt="info circle icon"
              className="cursor-pointer"
              preview={false}
            ></Image>
          </Popover>
          <Button
            className="custom-primary-btn"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="pl-6 pr-14 py-2 flex-1 min-h-0 flex flex-row overflow-hidden">
        {/* Left: Thumbnail */}
        <div
          className={`h-full shrink-0 transition-all duration-200 z-999 w-[250px]`}
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-medium text-grey-dark">Source</span>
            <span className="text-xs text-grey-normal">{scheduleList.length} items</span>
          </div>
          <EvidenceThumbailList
            pdfRef={pdfWrapperRef}
            data={scheduleList}
            evidenceId={pageEvidenceId}
            onChangeEvidenceId={handlePageEvidenceChange}
            showShadow={false}
            showCategory={true}
            categoryList={ArchDrawingSummaryPageTypes}
            onClickDelete={handleDeleteScheduleEvidence}
          />
        </div>
        {/* Right: PDF Viewer with Controls */}
        <div
          className={`min-w-0 flex-1 flex flex-col overflow-hidden`}
        >
          <div className="mr-2 mb-1 flex items-center justify-end">
            {/* <Tooltip title="Add Sub Items">
              <div className="mr-2 px-1 bg-forumBlue-normal rounded-full">
                <PlusOutlined
                  onClick={handleAddSubItems}
                  className="cursor-pointer text-white"
                />
              </div>
            </Tooltip> */}
            <Tooltip title="Preview PDF Context">
              <div className="px-1 bg-forumBlue-normal rounded-full">
                <EyeOutlined
                  onClick={() => setPreviewOpen(true)}
                  disabled={!previewImageUrl}
                  className="cursor-pointer text-white" />
              </div>
            </Tooltip>
          </div>
          {/* Images */}
          <div className="min-h-0 flex-1 overflow-auto flex items-center justify-center relative group">
            <ScheduleEvidenceImage
              ref={scheduleEvidenceImageRef}
              imageUrl={imageUrl}
              items={itemBoxList}
              activeItemId={focusedItemId}
              onSelectItem={handleSelectOverlayItem}
              onConfirmSubItemBox={handleConfirmSubItemBox}
            />
          </div>
        </div>
        {/** right view */}
        <div className="h-full w-[50%] shrink-0 border-l border-primaryN30 bg-white p-4 overflow-hidden">
          <ScheduleTable
            columns={columns}
            sections={itemBoxList}
            takeOffId={String(takeOffId || "")}
            selectedFileId={selectedFileId}
            pageEvidenceId={pageEvidenceId}
            onUpdateField={handleUpdateScheduleItemField}
            onDeleteItem={handleDeleteScheduleItem}
            onOpenColumnSelector={handleOpenColumnModal}
            onCreateItem={handleCreateItem}
            onBatchActionSuccess={() => getItemsByPageEvidences(pageEvidenceId)}
            onBatchLabelUpdatingChange={handleBatchLabelUpdatingChange}
            focusedItemId={focusedItemId}
            onFocusItemChange={handleFocusItemFromTable}
          />
        </div>
      </div>
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
      {buildingLoading && <BuildingBackground step={'page-merge'} />}
      <DisplayColumnsModal
        open={columnModalOpen}
        templateColumns={templateColumns}
        selectedColumns={columnDraft}
        requiredColumns={REQUIRED_VISIBLE_COLUMNS}
        onToggleColumn={handleToggleColumnDraft}
        onCancel={handleCancelColumnModal}
        onConfirm={handleConfirmColumnModal}
      />
      <EvidenceImagePreviewModal
        open={previewOpen}
        fileName={selectedFile?.file_name || "Unnamed file"}
        pageNumber={Number(currentScheduleEvidence?.project_file_page_number || currentPage || 1)}
        imageUrl={previewImageUrl}
        pageEvidences={previewPageEvidences}
        onCancel={() => setPreviewOpen(false)}
      />
    </div>
  );
}
