import { ProjectRow, ProjectStatus } from "@/types/home";
import Table, { ColumnsType } from "antd/es/table";
import { StarFilled, StarOutlined } from "@ant-design/icons";
import { ConfigProvider, Tooltip } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getTitleFromPropertyName } from "@/lib/functions";

const PAGE_SIZE = 20;

const TextCell = ({ value }: { value: unknown }) => {
  const text = value != null ? String(value) : "-";
  const ref = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setIsTruncated(el.scrollHeight > el.clientHeight);
  }, [text]);

  const clampedContent = (
    <div ref={ref} className="text-sm line-clamp-2 overflow-hidden">
      {text}
    </div>
  );

  return isTruncated ? (
    <Tooltip title={text} placement="topLeft">
      <div>{clampedContent}</div>
    </Tooltip>
  ) : (
    clampedContent
  );
};

const HomeTakeoffsTable = ({
  tableLoading,
  takeoffs,
  selectedColumns
}: any) => {
  const [page, setPage] = useState(1);
  const router = useRouter();

  const defaultColumns: ColumnsType<ProjectRow> = useMemo(
    () => [
      {
        title: (
          <span className="text-xs font-semibold text-basicGray">
            Take Off Name
          </span>
        ),
        dataIndex: "name",
        key: "name",
        align: "center",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (value) => <TextCell value={value} />,
      },
      {
        title: (
          <span className="text-xs font-semibold text-basicGray">
            Project Name
          </span>
        ),
        dataIndex: "project_name",
        key: "project_name",
        align: "center",
        sorter: (a, b) => a.project_name.localeCompare(b.project_name),
        render: (value) => <TextCell value={value} />,
      },
      {
        title: (
          <span className="text-xs font-semibold text-basicGray">
            Last Edit
          </span>
        ),
        dataIndex: "update_time",
        key: "update_time",
        align: "center",
        render: (value) => <TextCell value={value} />,
      },
    ],
    []
  );

  const allColumns = useMemo(
    () => [...defaultColumns],
    [defaultColumns]
  );

  const columns = useMemo(() => {
    if (!selectedColumns || selectedColumns.length === 0) {
      return allColumns;
    }
    return allColumns.filter(column => selectedColumns.includes(column.key as string));
  }, [allColumns, selectedColumns]);


  const handleRowClick = useCallback(
    (record: ProjectRow) => ({
      onClick: () => router.push(`/projects/${record.project_id}/takeoff/${record.id}/identification-index`),
      className: "cursor-pointer hover:bg-gray-50",
    }),
    [router]
  );

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: "#427CCE1A",
          },
        },
      }}
    >
      <Table<ProjectRow>
        rowKey={(r: any) => r.id}
        columns={columns}
        dataSource={takeoffs}
        onRow={handleRowClick}
        loading={tableLoading}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          showSizeChanger: false,
          showQuickJumper: false,
          itemRender: () => null,
          position: ["bottomRight"],
          showTotal: (total) => {
            const totalPages = Math.ceil(total / PAGE_SIZE);
            return (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Page</span>
                <select
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                  className="rounded-md border border-gray-200 px-2 py-1 text-sm focus:outline-none"
                >
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <span>of {totalPages}</span>
              </div>
            );
          },
        }}
        size="middle"
        sticky
        className="rounded-lg"
        rowClassName={() => "cursor-pointer transition-colors hover:bg-gray-50"}
      />
    </ConfigProvider>
  );
};

export default HomeTakeoffsTable;
