"use client";

import { CheckCircleFilled, DownOutlined, UpOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { useLayoutEffect, useRef, useState } from "react";

interface LabelOption {
  key: string;
  label: string;
  isMerged?: boolean;
}

interface LabelSidebarProps {
  labels: LabelOption[];
  autoMergedLabels: LabelOption[];
  conflictLabels: LabelOption[];
  selectedLabel: string;
  collapsedAutoMergedLabels: boolean;
  collapsedConflictLabels: boolean;
  onToggleAutoMergedLabels: () => void;
  onToggleConflictLabels: () => void;
  onSwitchLabel: (label: string) => void;
}

function TruncatedLabelWithTooltip({ label }: { label: string }) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const element = labelRef.current;
    if (!element) return;
    setIsTruncated(element.scrollWidth > element.clientWidth);
  }, [label]);

  const content = (
    <span ref={labelRef} className="block w-full truncate">
      {label}
    </span>
  );

  if (!isTruncated) return content;
  return (
    <Tooltip title={label} placement="topLeft">
      {content}
    </Tooltip>
  );
}

export default function LabelSidebar({
  labels,
  autoMergedLabels,
  conflictLabels,
  selectedLabel,
  collapsedAutoMergedLabels,
  collapsedConflictLabels,
  onToggleAutoMergedLabels,
  onToggleConflictLabels,
  onSwitchLabel,
}: LabelSidebarProps) {
  return (
    <div className="w-[220px] shrink-0 rounded-xl border border-primaryN30 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-forumBlue-normal">Labels</span>
        <span className="text-xs text-grey-normal">{labels.length} Labels</span>
      </div>
      <div className="max-h-[calc(100vh-200px)] space-y-3 overflow-y-auto overflow-x-hidden">
        <div>
          <button
            type="button"
            className="pr-2 mb-2 flex w-full items-center justify-between text-left"
            onClick={onToggleAutoMergedLabels}
          >
            <span className="flex items-center gap-2 text-xs font-medium text-forumBlue-normal">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
              <span>Auto Merged ({autoMergedLabels.length})</span>
            </span>
            {collapsedAutoMergedLabels ? (
              <DownOutlined className="text-[10px] text-grey-normal" />
            ) : (
              <UpOutlined className="text-[10px] text-grey-normal" />
            )}
          </button>
          {!collapsedAutoMergedLabels && (
            <div className="space-y-2">
              {autoMergedLabels.map((item) => {
                const active = item.label === selectedLabel;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSwitchLabel(item.label)}
                    className={`w-full flex items-center rounded-md border px-3 py-2 text-left text-xs transition-all ${active ? "border-forumBlue-normal bg-primaryN30" : "border-primaryN30"
                      }`}
                  >
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                      {item.isMerged ? (
                        <CheckCircleFilled className="text-green-normal mr-1" />
                      ) : null}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="block min-w-0 text-left">
                        <TruncatedLabelWithTooltip label={item.label} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            className="pr-2 mb-2 flex w-full items-center justify-between text-left"
            onClick={onToggleConflictLabels}
          >
            <span className="flex items-center gap-2 text-xs font-medium text-forumBlue-normal">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#FFFF00]" />
              <span>Conflict ({conflictLabels.length})</span>
            </span>
            {collapsedConflictLabels ? (
              <DownOutlined className="text-[10px] text-grey-normal" />
            ) : (
              <UpOutlined className="text-[10px] text-grey-normal" />
            )}
          </button>
          {!collapsedConflictLabels && (
            <div className="space-y-2">
              {conflictLabels.map((item) => {
                const active = item.label === selectedLabel;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSwitchLabel(item.label)}
                    className={`w-full flex items-center rounded-md border px-3 py-2 text-left text-xs transition-all ${active ? "border-forumBlue-normal bg-primaryN30" : "border-primaryN30"
                      }`}
                  >
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                      {item.isMerged ? (
                        <CheckCircleFilled className="text-green-normal mr-1" />
                      ) : null}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="block min-w-0 text-left">
                        <TruncatedLabelWithTooltip label={item.label} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
