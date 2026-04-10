"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, notification, Spin, Modal, Image } from "antd";
import { useParams, useRouter } from "next/navigation";

import {
  EvidenceType,
  FileOperationType,
  GroupType,
  PageType,
} from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";
import { ArchDrawingSummaryPageTypes } from "@/app/projects/[projectId]/takeoff/[takeoffId]/types/evidence";
import EvidenceThumbailList from "../floor-plan/components/EvidenceThumbailList";
import LoadingScreen from "@/components/loading-screen";
import ScheduleTable from "./components/ScheduleTable";
import {
  getTakeOffById,
  getEvidencesWindowTableQuoteWithUrlByProjectFileId,
  getTakeOffResultItemsByEvidenceIds,
  updateTakeOffResultItemResultById,
  deleteTakeOffResultItemById,
  reconcileTakeOffResultItemsByTakeOffAndFile
} from "@/services/takeOffService";
import { getTemplateById } from "@/services/templateService";
import {
  getDisplayValueByField,
  normalizeFieldName,
  parseItemResult as parseItemResultUtil,
} from "../../analyze-new/takeoffUtils";
import BuildingBackground from "../../identification/components/BuildingBackground";

export default function SchedulePage() {
  const router = useRouter();
  const projectId = useParams().projectId;
  const takeOffId = useParams().takeoffId;

  const pdfWrapperRef = useRef<any>(null);

  const [fullLoading, setFullLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [pageEvidenceId, setPageEvidenceId] = useState<number>(-1);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<any>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [itemBoxList, setItemBoxList] = useState<EvidenceType[]>([]);
  const [buildLoading, setBuildLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [buildingLoading, setBuildingLoading] = useState<boolean>(false);

  const selectedFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId) || null;
  }, [files, selectedFileId]);

  const fetchTakeoffData = useCallback(async () => {
    if (!takeOffId) return;

    setFullLoading(true);
    try {
      const response = await getTakeOffById(takeOffId as string);
      if (response.status === "success" && response.data) {
        const projectFiles: any[] =
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

  const fetchScheduleEvidenceList = useCallback(async (fileId: number) => {
    if (!fileId) return;
    const response = await getEvidencesWindowTableQuoteWithUrlByProjectFileId(
      fileId.toString(),
    );
    if (response.status === "success" && response.data) {
      let list = response.data || [];
      setScheduleList(list);
      if (list.length > 0) {
        setPageEvidenceId(list[0].id);
      }
    } else {
      notification.error({
        message: "Error",
        description: "Failed to load schedule evidence data.",
      });
    }
  }, []);

  const getItemsByPageEvidences = useCallback(
    async (id: number) => {
      if (id) {
        setItemBoxList([]);
        setTableLoading(true);
        let res = await getTakeOffResultItemsByEvidenceIds(id.toString());
        setTableLoading(false);
        if (res.status === "success" && res.data) {
          let values: any = Object.values(res.data || {}) || [];
          let list = values.flatMap((item: any) => item || []);
          setItemBoxList(list);
        } else {
          notification.error({
            message: "Error",
            description: "Failed to load evidence data.",
          });
        }
      }
    },
    [pageEvidenceId],
  );

  useEffect(() => {
    fetchTakeoffData();
    resolveColumnNames(1);
  }, []);

  useEffect(() => {
    if (selectedFileId) {
      fetchScheduleEvidenceList(selectedFileId);
    }
  }, [selectedFileId]);

  useEffect(() => {
    if (pageEvidenceId !== -1) {
      setImageUrl(scheduleList.find((item) => item.id === pageEvidenceId)?.evidence_url || "");
      getItemsByPageEvidences(pageEvidenceId);
    }
  }, [pageEvidenceId, scheduleList]);

  useEffect(() => {
    if (scheduleList.length > 0 && pageEvidenceId === -1) {
      setPageEvidenceId(scheduleList[0].id);
    }
  }, [scheduleList]);


  const handlePageEvidenceChange = useCallback(
    (evidenceId: any) => {
      setPageEvidenceId(evidenceId);
      let currentPage =
        scheduleList.find((item) => item.id === evidenceId)
          ?.project_file_page_number || 0;
      setCurrentPage(currentPage);
    },
    [currentPage, scheduleList],
  );

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

  const resolveColumnNames = useCallback(
    async (templateId: number = 1, forceRefresh: boolean = false) => {
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
            setColumns(orderedFields);
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
      setColumns(defaultFields);
      return defaultFields;
    },
    [],
  );

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

      setItemBoxList((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));

      const updateRes = await updateTakeOffResultItemResultById(
        itemId.toString(),
        updatedItem,
      );
      if (updateRes.status === "success") {
        notification.success({
          message: "Success",
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
      notification.error({
        message: "Error",
        description: "Failed to update item. Changes have been reverted.",
      });
      return false;
    },
    [],
  );

  const handleDeleteScheduleItem = useCallback(
    async (itemId: number) => {
      if (!itemId) return false;

      const deleteRes = await deleteTakeOffResultItemById(itemId.toString());
      if (deleteRes.status !== "success") {
        notification.error({
          message: "Error",
          description: "Failed to delete item.",
        });
        return false;
      }

      notification.success({
        message: "Success",
        description: "Item deleted successfully.",
      });
      await getItemsByPageEvidences(pageEvidenceId);
      return true;
    },
    [getItemsByPageEvidences, pageEvidenceId],
  );

  const handleReconcileTakeOff = async () => {
    setBuildingLoading(true);
    let res = await reconcileTakeOffResultItemsByTakeOffAndFile(takeOffId as string, selectedFileId as any)
    setBuildingLoading(false);
    if (res.status === "success") {
      notification.success({
        message: "Success",
        description: "Take off result items reconciled successfully.",
      });
      // 跳转到下一个take off result items
      router.push(`/projects/${projectId}/takeoff/${takeOffId}/manual-merge-v2`);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to reconcile take off result items.",
      });
    }
  }

  const handleNext = () => {
    handleReconcileTakeOff();
  };

  const handleBack = () => {
    router.push(`/projects/${projectId}/takeoff/${takeOffId}/merge-before/floor-plan`);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white font-nunito">
      {/* Header */}
      <header className="px-14 flex h-[110px] shrink-0 items-center justify-between border-b border-primaryN30 bg-white">
        <div>
          <div className="cursor-pointer" onClick={handleBack}>
            <Image src="/assets/icons/arrow-back.svg" alt="logo" width={12} height={6} style={{ height: 'auto' }}></Image>
          </div>
        </div>

        <div className="ml-6 flex-1 flex items-center gap-3">
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
      <div className="pl-6 pr-14 py-2 flex-1 min-h-0 flex flex-row overflow-hidden">
        {/* Left: Thumbnail */}
        <div
          className={`h-full shrink-0 transition-all duration-200 z-999 w-[250px]`}
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-medium text-grey-dark">Schedules</span>
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
            size={
              selectedFile?.operation_type === FileOperationType.Quote
                ? "larger"
                : "default"
            }
          />
        </div>
        {/* Right: PDF Viewer with Controls */}
        <div
          className={`min-w-0 flex-1 flex flex-col overflow-hidden`}
        >
          {/* Images */}
          <div className="min-h-0 flex-1 overflow-auto flex items-center justify-center">
            <Image src={imageUrl} alt="Schedule Evidence" preview={false} />
          </div>
        </div>
        {/** right view */}
        <div className="h-full w-[50%] shrink-0 border-l border-primaryN30 bg-white p-4 overflow-hidden">
          <div className="mb-2 text-xs text-grey-normal">{itemBoxList.length} items</div>
          <ScheduleTable
            columns={columns}
            sections={itemBoxList}
            tableLoading={tableLoading}
            onUpdateField={handleUpdateScheduleItemField}
            onDeleteItem={handleDeleteScheduleItem}
          />
        </div>
      </div>
      {fullLoading && <LoadingScreen isLoading={fullLoading} />}
      {buildingLoading && <BuildingBackground step={'page-merge'} />}
    </div>
  );
}
