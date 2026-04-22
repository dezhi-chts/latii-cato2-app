import { ProjectRow } from "@/types/home";
import Table, { ColumnsType } from "antd/es/table";
import { ConfigProvider, Spin, Tooltip } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dayjs from "dayjs";
import { getMergeStatusByTakeOffId } from "@/services/takeOffService";
import { TakeOffFileStatus } from "@/types/home";
import { notify } from "@/utils/notify";

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

type HomeTakeoffsTableProps = {
  tableLoading: boolean;
  takeoffs: any[];
  selectedColumns: string[];
  handleRemoveTakeoff: (takeoff: any) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
};

const HomeTakeoffsTable = ({
  tableLoading,
  takeoffs,
  selectedColumns,
  handleRemoveTakeoff,
  currentPage,
  setCurrentPage,
  totalPages,
}: HomeTakeoffsTableProps) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageLoadingText, setPageLoadingText] = useState("Loading...");

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultColumns: ColumnsType<ProjectRow> = useMemo(
    () => [
      {
        title: (
          <span className="text-xs font-semibold text-grey-normal">
            Take Off Name
          </span>
        ),
        dataIndex: "name",
        key: "name",
        align: "center",
        sorter: (a: any, b: any) => a.name.localeCompare(b.name),
        render: (value) => <TextCell value={value} />,
      },
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
        title: (
          <span className="text-xs font-semibold text-grey-normal">
            Status
          </span>
        ),
        dataIndex: "status",
        key: "status",
        align: "center",
        render: (value) => <TextCell value={value === 2 ? "Analyzed" : "Uploaded"} />,
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
        title: (
          <span className="text-xs font-semibold text-grey-normal">
            Operation
          </span>
        ),
        dataIndex: "operation",
        key: "operation",
        align: "center",
        width: 160,
        render: (value, record) => (
          <div
            className="w-full flex justify-center items-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTakeoff(record);
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

  const allColumns = useMemo(() => [...defaultColumns], [defaultColumns]);

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
      onClick: async () => {
        if (pageLoading) return;

        let floorPlanUrl = `/projects/${record.project_id}/takeoff/${record.id}/merge-before/floor-plan`;
        let scheduleUrl = `/projects/${record.project_id}/takeoff/${record.id}/merge-before/schedule`;
        let manualMergeUrl = `/projects/${record.project_id}/takeoff/${record.id}/manual-merge-v3`;
        let analyzeUrl = `/projects/${record.project_id}/takeoff/${record.id}/analyze-new`;
        let identificationUrl = `/projects/${record.project_id}/takeoff/${record.id}/identification`;

        setPageLoading(true);
        // 获取takeoff文件状态
        const mergeResult: any = await getMergeStatusByTakeOffId(record.id as any);
        if (mergeResult.status === "success") {
          if (mergeResult.data.take_off_completed) {
            // 已合并完成，跳转到
            router.push(
              `/projects/${record.project_id}/takeoff/${record.id}/analyze-new`,
            );
          } else {
            const labelList = Object.values(mergeResult.data?.files || {});
            if (!labelList || labelList.length === 0) return;

            let firstFile = labelList[0];
            switch (firstFile?.status) {
              case TakeOffFileStatus.STATUS_UNPROCESSED:
                router.push(identificationUrl);
                break;
              case TakeOffFileStatus.STATUS_ELEVATION_FLOOR_REVIEWING:
                router.push(floorPlanUrl);
                break;
              case TakeOffFileStatus.STATUS_ELEVATION_FLOOR_REVIEWED:
              case TakeOffFileStatus.STATUS_SCHEDULE_REVIEWING:
                router.push(scheduleUrl);
                break;
              case TakeOffFileStatus.STATUS_SCHEDULE_REVIEWED:
              case TakeOffFileStatus.STATUS_MERGING:
                router.push(manualMergeUrl);
                break;
              case TakeOffFileStatus.STATUS_MERGED:
                router.push(analyzeUrl);
                break;
              default:
                setPageLoading(false);
                break;
            }
          }
        } else {
          setPageLoading(false);
          notify.error({
            title: "Error",
            description: "Failed to get takeoff merge status",
          });
        }
      },
      className: "cursor-pointer hover:bg-gray-50",
    }),
    [pageLoading, router],
  );

  return (
    <>
      {mounted &&
        pageLoading &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70">
            <Spin spinning size="large" />
          </div>,
          document.body,
        )}
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
            current: currentPage,
            pageSize: 10,
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
    </>
  );
};

export default HomeTakeoffsTable;
