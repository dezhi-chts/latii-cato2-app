"use client";

import { Attribute, ProjectRow } from "@/types/home";
import Table, { ColumnsType } from "antd/es/table";
import { ConfigProvider, Tooltip } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dayjs from "dayjs";
import "dayjs/locale/en";
import { useCompany } from "@/context/CompanyContext";

dayjs.locale("en");

const DEFAULT_TABLE_HEIGHT = 560;
const TABLE_HEADER_HEIGHT = 40;
const ROW_HEIGHT = 40;
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
  currentPage: number;
  setCurrentPage: (page: number) => void;
  handleFavoriteClick: (record: ProjectRow) => void;
};

const HomeProjectsTable = ({
  tableLoading,
  projects,
  selectedColumns,
  currentPage,
  setCurrentPage,
  handleFavoriteClick,
}: HomeProjectsTableProps) => {
  const router = useRouter();
  const { company } = useCompany();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tableHeight, setTableHeight] = useState(DEFAULT_TABLE_HEIGHT);
  const [hasTableBeenResized, setHasTableBeenResized] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setTableHeight(entry.contentRect.height * 0.8);
      setHasTableBeenResized(true);
    });

    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (hasTableBeenResized) {
      if (!containerRef.current) return;

      const currentHeight = containerRef.current.getBoundingClientRect().height;

      const unzoomedHeight = currentHeight / 0.8;

      const newHeight = Math.floor(unzoomedHeight / 40) * 40;

      containerRef.current.style.height = `${newHeight}px`;
    }
  }, [hasTableBeenResized]);

  const pageSize = useMemo(() => {
    const bodyHeight = tableHeight - TABLE_HEADER_HEIGHT;
    return Math.max(1, Math.floor(bodyHeight / ROW_HEIGHT)) + 1;
  }, [tableHeight]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(projects.length / pageSize));
  }, [projects.length, pageSize]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return projects.slice(start, end);
  }, [projects, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  const dynamicColumns: ColumnsType<ProjectRow> = useMemo(() => {
    const attributeIds = [
      ...new Set(
        projects?.flatMap((p) => Object.keys(p.attributes ?? {})) ?? [],
      ),
    ];

    return attributeIds.map((attrId) => {
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
        render: (_: unknown, record: any) => {
          const value = record.attributes?.[attrId] ?? "-";

          if (Array.isArray(value)) {
            return <TextCell value={value.join(", ")} />;
          }

          if (typeof value === "string" && value.startsWith("[")) {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                return <TextCell value={parsed.join(", ")} />;
              }
            } catch {}
          }

          return <TextCell value={value} />;
        },
      };
    });
  }, [projects, company?.project_attributes]);

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
          <TextCell value={value ? dayjs(value).format("MMMM D, YYYY") : "-"} />
        ),
      },
      {
        title: <span className="text-xs font-semibold text-grey-normal"></span>,
        dataIndex: "actions",
        key: "actions",
        align: "center",
        width: 160,
        render: (_: unknown, record: ProjectRow) => {
          const isFavorite = record.is_favorite;
          const imgSrc = isFavorite
            ? "/assets/icons/favorite-filled.svg"
            : "/assets/icons/favorite.svg";

          return (
            <div
              className="flex w-full cursor-pointer items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                handleFavoriteClick(record);
              }}
            >
              <Image
                src={imgSrc}
                alt="Favorite Icon"
                width={20}
                height={20}
                className="h-6 w-6"
              />
            </div>
          );
        },
      },
    ],
    [handleFavoriteClick],
  );

  const allColumns = useMemo(() => {
    const actions = defaultColumns[defaultColumns.length - 1];
    const defaultWithoutActions = defaultColumns.slice(0, -1);

    return [...defaultWithoutActions, ...dynamicColumns, actions];
  }, [defaultColumns, dynamicColumns]);

  const columns = useMemo(() => {
    if (!selectedColumns?.length) return allColumns;

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
    <div className="w-full my-4">
      <div
        ref={containerRef}
        className={`overflow-hidden rounded-lg border border-primaryN30 [&_.ant-table-tbody>tr>td]:border-b-primaryN30 ${paginatedProjects.length === pageSize ? "border-b-0" : ""}`}
        style={{ height: "90vh" }}
      >
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
            rowKey={(r: any, index) => `${r.project_id}-${index}`}
            columns={columns}
            dataSource={paginatedProjects}
            onRow={handleRowClick}
            loading={tableLoading}
            pagination={false}
            size="middle"
            sticky
            rowClassName="cursor-pointer hover:bg-gray-50"
          />
        </ConfigProvider>
      </div>

      <div className="mt-4 flex justify-end">
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
};

export default HomeProjectsTable;

type PaginationProps = {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
};

const Pagination = ({
  currentPage,
  setCurrentPage,
  totalPages,
}: PaginationProps) => {
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
};
