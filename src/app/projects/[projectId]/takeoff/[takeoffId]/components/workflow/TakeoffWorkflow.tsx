"use client";

import { Modal } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTakeOffMergeFlowsById,
  rollbackTakeOffByMergeFlowStatus,
} from "@/services/takeOffService";
import { notify } from "@/utils/notify";

export type TakeoffWorkflowStepKey =
  | "page-index"
  | "page-labeling"
  | "sources"
  | "schedules"
  | "final-items"
  | "export";

interface WorkflowStepDefinition {
  key: TakeoffWorkflowStepKey;
  label: string;
}

const TAKEOFF_WORKFLOW_STEPS: WorkflowStepDefinition[] = [
  { key: "page-index", label: "Page Index" },
  { key: "page-labeling", label: "Page Labeling" },
  { key: "sources", label: "Sources" },
  { key: "schedules", label: "Schedules" },
  { key: "final-items", label: "Final Items" },
  { key: "export", label: "Export" },
];

const STEP_TO_FLOW_NAME: Record<TakeoffWorkflowStepKey, string> = {
  "page-index": "Page Index/Labeling",
  "page-labeling": "Page Index/Labeling",
  sources: "Floor Plan/Elevation Source Review",
  schedules: "Schedules Review",
  "final-items": "Merge Control Room",
  export: "Result",
};

const normalizeFlowStatus = (status?: string) => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (normalized === "completed") return "completed";
  if (normalized === "in_progress") return "in_progress";
  return "not_started";
};

const resolveWorkflowPath = (
  stepKey: TakeoffWorkflowStepKey,
  projectId: string,
  takeoffId: string,
) => {
  const base = `/projects/${projectId}/takeoff/${takeoffId}`;
  switch (stepKey) {
    case "page-index":
      return `${base}/identification/index-summary`;
    case "page-labeling":
      return `${base}/identification/page-label`;
    case "sources":
      return `${base}/merge-before/floor-plan`;
    case "schedules":
      return `${base}/merge-before/schedule`;
    case "final-items":
      return `${base}/manual-merge-v3`;
    case "export":
      return `${base}/analyze-new`;
    default:
      return `${base}/identification/index-summary`;
  }
};

interface TakeoffWorkflowProps {
  currentStep: TakeoffWorkflowStepKey;
  projectId: string;
  takeoffId: string;
  className?: string;
}

export default function TakeoffWorkflow({
  currentStep,
  projectId,
  takeoffId,
  className = "",
}: TakeoffWorkflowProps) {
  const router = useRouter();
  const [flowStatusMap, setFlowStatusMap] = useState<Record<string, string>>({});
  const [loadingFlows, setLoadingFlows] = useState(false);

  const currentStepIndex = useMemo(() => {
    const index = TAKEOFF_WORKFLOW_STEPS.findIndex((item) => item.key === currentStep);
    return index >= 0 ? index : 0;
  }, [currentStep]);

  const visibleSteps = useMemo(() => {
    return TAKEOFF_WORKFLOW_STEPS.filter((step) =>
      Object.prototype.hasOwnProperty.call(flowStatusMap, STEP_TO_FLOW_NAME[step.key]),
    );
  }, [flowStatusMap]);

  const fetchMergeFlows = useCallback(async () => {
    if (!takeoffId) return;
    setLoadingFlows(true);
    const response = await getTakeOffMergeFlowsById(takeoffId);
    setLoadingFlows(false);
    if (response.status !== "success") {
      notify.error({
        title: "Error",
        description: response?.data?.detail || "Failed to load workflow status.",
      });
      return;
    }
    const flowList = Array.isArray(response.data?.flows) ? response.data.flows : [];
    const nextMap = flowList.reduce((acc: Record<string, string>, flow: any) => {
      const flowName = String(flow?.name || "").trim();
      if (!flowName) return acc;
      acc[flowName] = normalizeFlowStatus(flow?.status);
      return acc;
    }, {});
    setFlowStatusMap(nextMap);
  }, [takeoffId]);

  useEffect(() => {
    fetchMergeFlows();
  }, [fetchMergeFlows]);

  const shouldSkipRollbackForPageIndexLabeling = useMemo(() => {
    const firstFlowStarted =
      flowStatusMap["Page Index/Labeling"] === "completed" ||
      flowStatusMap["Page Index/Labeling"] === "in_progress";
    const allOthersNotCompleted = [
      "Floor Plan/Elevation Source Review",
      "Schedules Review",
      "Merge Control Room",
      "Result",
    ].every((name) => flowStatusMap[name] !== "completed");
    return firstFlowStarted && allOthersNotCompleted;
  }, [flowStatusMap]);

  const handleStepClick = useCallback(
    (targetStep: TakeoffWorkflowStepKey) => {
      const targetPath = resolveWorkflowPath(targetStep, projectId, takeoffId);
      if (targetStep === currentStep) return;

      const targetFlowName = STEP_TO_FLOW_NAME[targetStep];
      const targetFlowStatus = flowStatusMap[targetFlowName];
      const isPageIndexOrLabeling =
        (currentStep === "page-index" || currentStep === "page-labeling") &&
        (targetStep === "page-index" || targetStep === "page-labeling");

      if (isPageIndexOrLabeling && shouldSkipRollbackForPageIndexLabeling) {
        router.push(targetPath);
        return;
      }

      if (targetFlowStatus !== "completed") return;

      const currentFlowName = STEP_TO_FLOW_NAME[currentStep];
      const rollbackFlowName = targetFlowName || currentFlowName;
      const rollbackDisplayName =
        TAKEOFF_WORKFLOW_STEPS.find((step) => step.key === targetStep)?.label ||
        rollbackFlowName;

      Modal.confirm({
        title: "Rollback Confirmation",
        content:
          `You are about to rollback to "${rollbackDisplayName}". This action will reset all following workflow data. Are you sure you want to continue?`,
        okText: "Confirm",
        cancelText: "Cancel",
        onOk: async () => {
          const rollbackResponse = await rollbackTakeOffByMergeFlowStatus(
            takeoffId,
            rollbackFlowName,
          );
          if (rollbackResponse.status !== "success") {
            notify.error({
              title: "Error",
              description:
                rollbackResponse?.data?.detail || "Failed to rollback workflow.",
            });
            return;
          }
          router.replace(targetPath);
        },
      });
    },
    [
      currentStep,
      flowStatusMap,
      projectId,
      router,
      shouldSkipRollbackForPageIndexLabeling,
      takeoffId,
    ],
  );

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className}`}>
      {visibleSteps.map((step, index) => {
        const isCurrent = step.key === currentStep;
        const flowName = STEP_TO_FLOW_NAME[step.key];
        const status = flowStatusMap[flowName];
        const isCompleted = status === "completed";
        const isInProgress = status === "in_progress";
        const isPageIndexOrLabelingStep =
          step.key === "page-index" || step.key === "page-labeling";
        const clickable =
          !loadingFlows &&
          (isCompleted ||
            (isPageIndexOrLabelingStep &&
              shouldSkipRollbackForPageIndexLabeling));
        return (
          <div key={step.key} className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded-full px-2 py-[2px] transition-all ${isCurrent
                ? "bg-forumBlue-normal text-white"
                : isCompleted
                  ? "bg-green-light text-green-normal cursor-pointer"
                  : isPageIndexOrLabelingStep &&
                    shouldSkipRollbackForPageIndexLabeling
                    ? "bg-[#EEF4FF] text-forumBlue-normal cursor-pointer"
                    : isInProgress
                      ? "bg-[#EEF4FF] text-forumBlue-normal cursor-not-allowed"
                      : "bg-grey-light text-grey-normal cursor-not-allowed"
                }`}
              disabled={!clickable}
              onClick={() => {
                if (!clickable) return;
                handleStepClick(step.key);
              }}
            >
              <span className="text-xs">{step.label}</span>
            </button>
            {index < visibleSteps.length - 1 && (
              <span className="text-grey-light-strong">{">"}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
