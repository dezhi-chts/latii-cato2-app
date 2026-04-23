"use client";

import {
  Button,
  Input,
  Modal,
  Table,
  Tooltip,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import {
  createCompany,
  deleteCompanyByCompanyId,
  getCompanyList,
  updateCompanyByCompanyId,
} from "@/services/companyService";
import CompanyFormModal, { CompanyFormValues } from "./CompanyFormModal";
import { notify } from "@/utils/notify";

type CompanyLocation = {
  state: string;
  city: string;
  address: string;
  postal_code: string;
  country: string;
};

export type CompanyRow = {
  id: number;
  name: string;
  description?: string;
  website?: string;
  location?: CompanyLocation;
};

type Props = {
  onChanged: () => void;
};

const { confirm } = Modal;
const { Text } = Typography;

const formatLocation = (location?: CompanyLocation) => {
  if (!location) return "";
  const values = [
    location.state,
    location.city,
    location.postal_code,
    location.address,
    location.country,
  ]
    .map((item) => (item || "").trim())
    .filter(Boolean);
  return values.join(" ");
};

const CompanyManagement = ({ onChanged }: Props) => {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const isFirstSearchEffect = useRef(true);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingCompany, setEditingCompany] = useState<CompanyRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCompanies = async ({
    page = pagination.page,
    perPage = pagination.per_page,
    name,
  }: {
    page?: number;
    perPage?: number;
    name?: string;
  } = {}) => {
    setLoading(true);
    const res = await getCompanyList({ page, per_page: perPage, name });
    if (res.status === "success") {
      const list: CompanyRow[] = (res.data?.items || res.data?.results || []).map(
        (item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          website: item.website,
          location: item.location,
        }),
      );
      const total = Number(
        res.data?.total ??
        res.data?.count ??
        res.data?.pagination?.total ??
        list.length,
      );
      setCompanies(list);
      setPagination((prev) => ({
        ...prev,
        page,
        per_page: perPage,
        total,
      }));
    } else {
      notify.error({
        title: "Error",
        description: res?.data?.detail || "Failed to fetch companies",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies({ page: 1, perPage: 20 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchCompanies({
        page: 1,
        perPage: pagination.per_page,
        name: keyword || undefined,
      });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingCompany(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (company: CompanyRow) => {
    setModalMode("edit");
    setEditingCompany(company);
    setModalOpen(true);
  };

  const handleDelete = (company: CompanyRow) => {
    confirm({
      title: "Delete company?",
      content: `"${company.name}" will be permanently removed.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        const res = await deleteCompanyByCompanyId({ companyId: company.id });
        if (res.status === "success") {
          notify.success({ title: "Company deleted" });
          fetchCompanies({
            page: pagination.page,
            perPage: pagination.per_page,
            name: keyword || undefined,
          });
          onChanged();
        } else {
          notify.error({
            title: "Error",
            description: res?.data?.detail || "Failed to delete company",
          });
        }
      },
    });
  };

  const handleSubmit = async (values: CompanyFormValues) => {
    setSubmitting(true);
    try {
      let res;
      if (modalMode === "create") {
        res = await createCompany({ companyData: { ...values, auth_provider_uid: null } });
      } else if (editingCompany) {
        res = await updateCompanyByCompanyId({
          companyId: editingCompany.id,
          companyData: {
            ...editingCompany,
            ...values,
            auth_provider_uid: null
          },
        });
      }
      if (res?.status === "success") {
        notify.success({
          title:
            modalMode === "create" ? "Company created" : "Company updated",
        });
        setModalOpen(false);
        fetchCompanies({
          page: pagination.page,
          perPage: pagination.per_page,
          name: keyword || undefined,
        });
        onChanged();
      } else {
        notify.error({
          title: "Error",
          description:
            res?.data?.detail ||
            `Failed to ${modalMode === "create" ? "create" : "update"} company`,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<CompanyRow> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      align: "center",
      render: (v: string) => <Text strong>{v || "-"}</Text>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      align: "center",
      render: (v: string) =>
        v ? (
          <Tooltip title={v} placement="topLeft">
            <span>{v}</span>
          </Tooltip>
        ) : (
          <span className="text-grey-light-strong">-</span>
        ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      align: "center",
      ellipsis: true,
      render: (v: CompanyLocation | undefined) => {
        const text = formatLocation(v);
        return text ? (
          <Tooltip title={text} placement="topLeft">
            <span>{text}</span>
          </Tooltip>
        ) : (
          <span className="text-grey-light-strong">-</span>
        );
      },
    },
    {
      title: "Website",
      dataIndex: "website",
      key: "website",
      align: "center",
      render: (v: string) =>
        v ? (
          <a
            href={v}
            target="_blank"
            rel="noreferrer"
            className="text-forumBlue-normal hover:underline"
          >
            {v}
          </a>
        ) : (
          <span className="text-grey-light-strong">-</span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-3">
          <Tooltip title="Edit">
            <EditOutlined
              className="text-forumBlue-normal cursor-pointer hover:opacity-80"
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <DeleteOutlined
              className="text-accentRed cursor-pointer hover:opacity-80"
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-grey-light-strong" />}
          placeholder="Search by company name"
          className="!w-[280px]"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
        >
          New Company
        </Button>
      </div>

      <div className="flex-1 overflow-auto rounded-md">
        <Table<CompanyRow>
          rowKey="id"
          loading={loading}
          dataSource={companies}
          columns={columns}
          pagination={{
            current: pagination.page,
            pageSize: pagination.per_page,
            total: pagination.total,
            showSizeChanger: false,
            onChange: (page, pageSize) => {
              fetchCompanies({
                page,
                perPage: pageSize,
                name: keyword || undefined,
              });
            },
          }}
          size="middle"
        />
      </div>

      <CompanyFormModal
        open={modalOpen}
        loading={submitting}
        mode={modalMode}
        initialValues={editingCompany || undefined}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CompanyManagement;
