import { ProjectRow, ProjectStatus } from "@/types/home";
import Table, { ColumnsType } from "antd/es/table";
import { StarFilled, StarOutlined } from "@ant-design/icons";
import { ConfigProvider } from "antd";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const projectsColumns: ColumnsType<ProjectRow> = [
  {
    title: (
      <span className="text-xs font-semibold text-basicGray">Project Name</span>
    ),
    dataIndex: "projectName",
    key: "projectName",
    align: "center",
    sorter: (a, b) => a.projectName.localeCompare(b.projectName),
    render: (value: string) => (
      <span className="text-sm line-clamp-2">{value}</span>
    ),
  },
  {
    title: (
      <span className="text-xs font-semibold text-basicGray">Last Edit</span>
    ),
    dataIndex: "lastEdit",
    key: "lastEdit",
    align: "center",
    render: (value: string) => (
      <span className="text-sm line-clamp-2">{value}</span>
    ),
  },
  {
    title: (
      <span className="text-xs font-semibold text-basicGray">Budget Price</span>
    ),
    dataIndex: "budgetPrice",
    key: "budgetPrice",
    align: "center",
    render: (value: number) => (
      <span className="text-sm line-clamp-2">${value / 1000}K</span>
    ),
  },
  {
    title: (
      <span className="text-xs font-semibold text-basicGray">End Customer</span>
    ),
    dataIndex: "endCustomer",
    key: "endCustomer",
    align: "center",
    render: (value: string) => (
      <span className="text-sm line-clamp-2">{value}</span>
    ),
  },
  {
    title: <span className="text-xs font-semibold text-basicGray">Status</span>,
    dataIndex: "status",
    key: "status",
    align: "center",
    render: (status: ProjectStatus) => {
      const isTakeOff = status === "Take Off";
      return (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium
            ${
              isTakeOff
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-600"
            }
          `}
        >
          {status}
        </span>
      );
    },
  },
  {
    title: <span className="text-xs font-semibold text-basicGray">Notes</span>,
    dataIndex: "notes",
    key: "notes",
    align: "center",
    render: (value: string) => (
      <span className="text-sm line-clamp-2">{value}</span>
    ),
  },
  {
    title: "",
    dataIndex: "isFavorite",
    key: "favorite",
    align: "center",
    width: 40,
    render: (isFavorite: boolean) =>
      isFavorite ? (
        <StarFilled className="text-gray-900 text-sm" />
      ) : (
        <StarOutlined className="text-gray-300 text-sm" />
      ),
  },
];

const HomeProjectsTable = ({ projects }: { projects: ProjectRow[] }) => {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const router = useRouter();

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
      <Table
        onRow={(record) => ({
          onClick: () => {
            router.push(`/projects/${record.key}`);
          },
          className: "cursor-pointer hover:bg-gray-50",
        })}
        columns={projectsColumns}
        dataSource={projects}
        pagination={{
          current: page,
          pageSize,
          showSizeChanger: false,
          showQuickJumper: false,
          itemRender: () => null,
          position: ["bottomRight"],
          showTotal: (total) => {
            const totalPages = Math.ceil(total / pageSize);
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
        rowHoverable
        className="rounded-lg"
        rowClassName={() => "cursor-pointer transition-colors hover:bg-gray-50"}
        sticky
      />
    </ConfigProvider>
  );
};

export default HomeProjectsTable;
