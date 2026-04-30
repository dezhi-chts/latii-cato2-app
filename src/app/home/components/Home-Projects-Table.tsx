"use client";

import { Attribute, ProjectRow } from "@/types/home";
import Table, { ColumnsType } from "antd/es/table";
import { ConfigProvider, Modal, Tooltip, notification } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dayjs from "dayjs";
import "dayjs/locale/en";
import { useCompany } from "@/context/CompanyContext";
import { deleteProject, updateProject } from "@/services/projectService";
import EditProjectModal from "./EditProjectModal";
import { notify } from "@/utils/notify";

dayjs.locale("en");

const DEFAULT_PAGE_SIZE = 30;

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
  totalProjects: number;
  totalProjectPages: number;
  selectedColumns: string[];
  currentPage: number;
  sortOrder: "ascend" | "descend" | null;
  onPageChange: (page: number) => void;
  onSortOrderChange: (order: "ascend" | "descend" | null) => void;
  onRefreshProjects: () => Promise<void> | void;
};

const HomeProjectsTable = ({
  tableLoading,
  projects,
  totalProjects,
  totalProjectPages,
  selectedColumns,
  currentPage,
  sortOrder,
  onPageChange,
  onSortOrderChange,
  onRefreshProjects,
}: HomeProjectsTableProps) => {
  const router = useRouter();
  const { company } = useCompany();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

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
            } catch { }
          }

          return <TextCell value={value} />;
        },
      };
    });
  }, [projects, company?.project_attributes]);

  const defaultColumns: ColumnsType<ProjectRow> = useMemo(
    () => [
      {
        title: <span className="text-xs font-semibold text-grey-normal">
          Project Name
        </span>,
        dataIndex: "project_name",
        key: "project_name",
        align: "center",
        sorter: true,
        sortOrder,
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
        title: (
          <span className="text-xs font-semibold text-grey-normal">Actions</span>
        ),
        dataIndex: "actions",
        key: "actions",
        align: "center",
        width: 120,
        render: (_: unknown, record: ProjectRow) => {
          return (
            <div className="flex w-full items-center justify-center gap-3">
              <EditOutlined
              className="cursor-pointer text-[15px] text-grey-light-strong"
              onClick={(event) => {
                event.stopPropagation();
                setEditingProject(record);
                setEditModalOpen(true);
              }}
            />
              <Image
                src="/assets/icons/delete.svg"
                alt="Delete project"
                width={16}
                height={16}
                className="cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  Modal.confirm({
                    title: "Delete Project",
                    content: `Are you sure you want to delete "${String(record.project_name || "")}"?`,
                    okText: "Delete",
                    cancelText: "Cancel",
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      const projectId = String((record as any).project_id || "");
                      if (!projectId) return;
                      let res = await deleteProject(projectId);
                      if (res.status === 'success') {
                        notify.success({
                          title: "Success",
                          description: "Project deleted successfully",
                        });
                        await onRefreshProjects();
                      } else {
                        notify.error({
                          title: "Error",
                          description: res?.data?.detail || "Failed to delete project",
                        });
                      }
                    },
                  });
                }}
              />
            </div>
          );
        },
      },
    ],
    [onRefreshProjects],
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
        className="overflow-hidden rounded-lg border border-primaryN30 [&_.ant-table-tbody>tr>td]:border-b-primaryN30"
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
            rowKey={(record: any) => String(record.project_id || record.key)}
            columns={columns}
            dataSource={projects}
            onRow={handleRowClick}
            loading={tableLoading}
            onChange={(pagination, _filters, sorter, extra) => {
              if (extra?.action === "paginate") {
                const nextPage = Number(pagination?.current || 1);
                onPageChange(nextPage);
                return;
              }
              if (extra?.action === "sort") {
              if (Array.isArray(sorter)) {
                const firstSorter = sorter[0];
                onSortOrderChange(
                  (firstSorter?.order as "ascend" | "descend" | null) || null,
                );
                return;
              }
              onSortOrderChange(
                (sorter?.order as "ascend" | "descend" | null) || null,
              );
              }
            }}
            pagination={{
              current: currentPage,
              pageSize: DEFAULT_PAGE_SIZE,
              total: totalProjects,
              showSizeChanger: false,
              hideOnSinglePage: false,
              position: ["bottomRight"],
              showTotal: () =>
                `Page ${currentPage} of ${Math.max(
                  1,
                  Math.ceil((totalProjects || 0) / DEFAULT_PAGE_SIZE),
                )}`,
            }}
            size="middle"
            sticky
            scroll={{ y: 'calc(100vh - 150px)' }}
            rowClassName="cursor-pointer hover:bg-gray-50"
          />
        </ConfigProvider>
      </div>
      <EditProjectModal
        open={editModalOpen}
        loading={submittingEdit}
        projectName={String(editingProject?.project_name || "")}
        projectDescription={String(
          (editingProject as any)?.project_description ??
          (editingProject as any)?.project_desc ??
          "",
        )}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingProject(null);
        }}
        onConfirm={async ({ projectName, projectDescription }) => {
          if (!editingProject) return;
          const projectId = String((editingProject as any).project_id || "");
          if (!projectId || !projectName.trim()) return;
          setSubmittingEdit(true);
          try {
            await updateProject({
              project_id: projectId,
              project_name: projectName.trim(),
              project_description: projectDescription.trim(),
              is_favorite: false,
              attributes: {},
            });
            setEditModalOpen(false);
            setEditingProject(null);
            await onRefreshProjects();
            notification.success({
              message: "Project updated successfully",
            });
          } finally {
            setSubmittingEdit(false);
          }
        }}
      />
    </div>
  );
};

export default HomeProjectsTable;
