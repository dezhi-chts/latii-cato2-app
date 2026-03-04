import { Attribute, ProjectRow } from "@/types/home";
import Table, { ColumnsType } from "antd/es/table";
import { ConfigProvider, Tooltip } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getTitleFromPropertyName } from "@/lib/functions";
import Image from "next/image";
import dayjs from "dayjs";
import "dayjs/locale/en";
import { useCompany } from "@/context/CompanyContext";

dayjs.locale("en");

export const PAGE_SIZE = 10;

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

type HomeProjectsTableProps = {
  tableLoading: boolean;
  projects: ProjectRow[];
  selectedColumns: string[];
  handleRemoveProject: (record: ProjectRow) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
};

const HomeProjectsTable = ({
  tableLoading,
  projects,
  selectedColumns,
  handleRemoveProject,
  currentPage,
  setCurrentPage,
  totalPages,
}: HomeProjectsTableProps) => {
  const router = useRouter();

  const { company } = useCompany();

  const dynamicColumns: ColumnsType<ProjectRow> = useMemo(() => {
    const attributeIds = [
      ...new Set(
        projects?.flatMap((p) => Object.keys(p.attributes ?? {})) ?? [],
      ),
    ];

    const columns = (attributeIds ?? []).map((attrId) => {
      const attr = company?.project_attributes?.find(
        (a: Attribute) => a.uuid === attrId,
      );

      const label = attr?.label ?? attrId;

      return {
        title: (
          <span className="text-xs font-semibold text-grey-normal">
            {label}
          </span>
        ),
        dataIndex: ["attributes", attrId],
        key: attrId,
        align: "center" as const,

        render: (_: any, record: any) => {
          const value = record.attributes?.[attrId] ?? "-";
          return <TextCell value={value} />;
        },
      };
    });

    return columns;
  }, [projects, company.project_attributes]);

  const defaultColumns: ColumnsType<ProjectRow> = useMemo(
    () => [
      {
        title: (
          <span className="text-xs font-semibold text-grey-normal">
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
          <span className="text-xs font-semibold text-grey-normal">
            Last Edit
          </span>
        ),
        dataIndex: "update_time",
        key: "update_time",
        align: "center",
        render: (value) => (
          <TextCell value={value && dayjs(value).format("MMMM D, YYYY")} />
        ),
      },
      {
        title: <span className="text-xs font-semibold text-grey-normal"></span>,
        dataIndex: "actions",
        key: "actions",
        align: "center",
        width: 160,
        render: (value, record) => (
          <div
            className="w-full flex justify-center items-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveProject(record);
            }}
          >
            <Image
              src="/assets/icons/delete.svg"
              alt="Delete"
              width={20}
              height={20}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const allColumns = useMemo(() => {
    const actions = defaultColumns[defaultColumns.length - 1];
    const defaultWithoutActions = defaultColumns.slice(0, -1);
    return [...defaultWithoutActions, ...dynamicColumns, actions];
  }, [defaultColumns, dynamicColumns]);

  const columns = useMemo(() => {
    if (!selectedColumns || selectedColumns.length === 0) {
      return allColumns;
    }
    return allColumns.filter((column) =>
      selectedColumns.includes(column.key as string),
    );
  }, [allColumns, selectedColumns]);

  const handleRowClick = useCallback(
    (record: ProjectRow) => ({
      onClick: () => router.push(`/projects/${record.project_id}`),
      className: "cursor-pointer hover:bg-gray-50",
    }),
    [router],
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
        rowKey={(r: any) => r.project_id}
        columns={columns}
        dataSource={projects}
        onRow={handleRowClick}
        loading={tableLoading}
        pagination={{
          current: currentPage,
          pageSize: PAGE_SIZE,
          showSizeChanger: false,
          showQuickJumper: false,
          itemRender: () => null,
          position: ["bottomRight"],
          showTotal: () => {
            return (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Page</span>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
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

export default HomeProjectsTable;
