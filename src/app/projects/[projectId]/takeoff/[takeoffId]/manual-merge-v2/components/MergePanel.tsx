"use client";

import { Button, Empty, Image, Segmented, Tag } from "antd";

type ViewMode = "items" | "evidence";

interface MergePanelProps {
  type: "schedule" | "floorPlan" | "elevation";
  title: string;
  rows: any[];
  evidenceUrls: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  renderTable: (rows: any[], editable: boolean, showActions: boolean) => React.ReactNode;
  isMerged?: boolean;
  submitting?: boolean;
  onSubmit?: () => void;
  showTag?: boolean;
}

export default function MergePanel({
  type,
  title,
  rows,
  evidenceUrls,
  viewMode,
  onViewModeChange,
  renderTable,
  isMerged = false,
  submitting = false,
  onSubmit,
  showTag = false,
}: MergePanelProps) {
  const isSchedule = type === "schedule";

  return (
    <div className="w-[800px] h-[calc(100vh-150px)] shrink-0 rounded-xl border border-primaryN30 bg-white p-3 flex flex-col">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${isSchedule ? "w-1/3" : ""}`}>
          {showTag && <Tag color="blue">Base</Tag>}
          <span className="text-sm font-medium text-forumBlue-normal">{title}</span>
          <span className="text-xs text-grey-normal">{rows.length} items</span>
        </div>

        {/* Schedule 特有的 Merge Complete 按钮 */}
        {isSchedule && (
          <div className="mr-2 flex flex-1 flex-row justify-end items-center gap-2">
            {!isMerged ? (
              <Button
                type="primary"
                size="small"
                className="custom-primary-btn"
                loading={submitting}
                onClick={onSubmit}
              >
                Merge Complete
              </Button>
            ) : null}
          </div>
        )}

        {/* View Mode Switcher */}
        <div className="flex justify-end gap-2">
          <Segmented
            size="small"
            value={viewMode}
            onChange={(value) => onViewModeChange(value as ViewMode)}
            options={[
              { label: "Items", value: "items" },
              { label: "Evidence", value: "evidence" },
            ]}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "items" ? (
          <div className="h-full">
            {renderTable(rows, isSchedule && !isMerged, true)}
          </div>
        ) : evidenceUrls.length > 0 ? (
          <div className="h-full overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-5">
              {evidenceUrls.map((url, index) => (
                <Image
                  key={`${url}-${index}`}
                  src={url}
                  alt={`${title} Evidence`}
                  className="w-full rounded-md border border-primaryN30"
                  preview={false}
                />
              ))}
            </div>
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No evidence images." />
        )}
      </div>
    </div>
  );
}
