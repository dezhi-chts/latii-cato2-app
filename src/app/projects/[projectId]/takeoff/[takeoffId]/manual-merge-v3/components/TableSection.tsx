"use client";

interface TableSectionProps {
  title: string;
  rows: any[];
  itemCount?: number;
  editable: boolean;
  withEvidenceAction: boolean;
  extra?: React.ReactNode;
  scrollY?: string;
  stretch?: boolean;
  renderTable: (
    title: string,
    rows: any[],
    editable: boolean,
    withEvidenceAction: boolean,
    scrollY?: string,
  ) => React.ReactNode;
}

export default function TableSection({
  title,
  rows,
  itemCount,
  editable,
  withEvidenceAction,
  extra,
  scrollY = "calc((100vh - 130px)/2 - 96px)",
  stretch = true,
  renderTable,
}: TableSectionProps) {
  return (
    <div
      className={`flex min-h-0 flex-col rounded-xl border border-primaryN30 bg-white p-3 ${stretch ? "h-full" : ""
        }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-forumBlue-normal">{title}</span>
          <span className="text-xs text-grey-normal">{itemCount ?? rows.length} items</span>
          {extra}
        </div>
      </div>
      <div className={stretch ? "min-h-0 flex-1" : ""}>
        {renderTable(title, rows, editable, withEvidenceAction, scrollY)}
      </div>
    </div>
  );
}
