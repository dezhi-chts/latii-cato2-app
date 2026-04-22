"use client";

import {
  Button,
  Empty,
  Input,
  Modal,
  Select,
  Table,
  Tooltip,
  Typography,
  notification,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import {
  createCompanyContact,
  deleteCompanyContact,
  getContactListByCompanyId,
  updateCompanyContact,
} from "@/services/companyService";
import ContactFormModal, { ContactFormValues } from "./ContactFormModal";
import { CompanyRow } from "./CompanyManagement";

type ContactRow = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  note?: string;
};

type Props = {
  companies: CompanyRow[];
  defaultCompanyId?: number;
};

const { confirm } = Modal;
const { Text } = Typography;

const ContactManagement = ({ companies, defaultCompanyId }: Props) => {
  const [companyId, setCompanyId] = useState<number | undefined>(
    defaultCompanyId,
  );
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingContact, setEditingContact] = useState<ContactRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!companyId && companies.length > 0) {
      setCompanyId(companies[0].id);
    }
  }, [companies, companyId]);

  const fetchContacts = async (cid: number) => {
    setLoading(true);
    const res = await getContactListByCompanyId({ companyId: cid });
    if (res.status === "success") {
      const list: ContactRow[] = (res.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        job_title: item.job_title,
        note: item.note,
      }));
      setContacts(list);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to fetch contacts",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (companyId) {
      fetchContacts(companyId);
    } else {
      setContacts([]);
    }
  }, [companyId]);

  const filteredContacts = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return contacts;
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(k) ||
        c.email?.toLowerCase().includes(k) ||
        c.phone?.toLowerCase().includes(k) ||
        c.job_title?.toLowerCase().includes(k),
    );
  }, [contacts, keyword]);

  const handleOpenCreate = () => {
    if (!companyId) {
      notification.warning({ message: "Please select a company first" });
      return;
    }
    setModalMode("create");
    setEditingContact(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (contact: ContactRow) => {
    setModalMode("edit");
    setEditingContact(contact);
    setModalOpen(true);
  };

  const handleDelete = (contact: ContactRow) => {
    if (!companyId) return;
    confirm({
      title: "Delete contact?",
      content: `"${contact.name}" will be permanently removed.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        const res = await deleteCompanyContact({
          companyId,
          contactId: contact.id,
        });
        if (res.status === "success") {
          notification.success({ message: "Contact deleted" });
          fetchContacts(companyId);
        } else {
          notification.error({
            message: "Error",
            description: "Failed to delete contact",
          });
        }
      },
    });
  };

  const handleSubmit = async (values: ContactFormValues) => {
    if (!companyId) return;
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        company_id: companyId,
      };
      let res;
      if (modalMode === "create") {
        res = await createCompanyContact({
          companyId,
          contactData: payload,
        });
      } else if (editingContact) {
        res = await updateCompanyContact({
          companyId,
          contactId: editingContact.id,
          contactData: payload,
        });
      }
      if (res?.status === "success") {
        notification.success({
          message: modalMode === "create" ? "Contact created" : "Contact updated",
        });
        setModalOpen(false);
        fetchContacts(companyId);
      } else {
        notification.error({
          message: "Error",
          description:
            res?.data?.response?.data?.detail ||
            `Failed to ${modalMode === "create" ? "create" : "update"} contact`,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<ContactRow> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      align:"center",
      render: (v: string) => <Text strong>{v || "-"}</Text>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      align:"center",
      render: (v: string) =>
        v ? (
          <a
            href={`mailto:${v}`}
            className="text-forumBlue-normal hover:underline"
          >
            {v}
          </a>
        ) : (
          <span className="text-grey-light-strong">-</span>
        ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 160,
      align:"center",
      render: (v: string) =>
        v || <span className="text-grey-light-strong">-</span>,
    },
    {
      title: "Job Title",
      dataIndex: "job_title",
      key: "job_title",
      align:"center",
      render: (v: string) =>
        v || <span className="text-grey-light-strong">-</span>,
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      align:"center",
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
      title: "Actions",
      key: "actions",
      width: 140,
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

  if (companies.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Empty description="Please create a company first" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-grey-normal">Company:</span>
          <Select
            value={companyId}
            onChange={setCompanyId}
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            style={{ width: 240 }}
            showSearch
            optionFilterProp="label"
            placeholder="Select a company"
          />
          <Input
            allowClear
            prefix={<SearchOutlined className="text-grey-light-strong" />}
            placeholder="Search contacts"
            className="!w-[260px]"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          New Contact
        </Button>
      </div>

      <div className="flex-1 overflow-auto rounded-md border border-primaryN30">
        <Table<ContactRow>
          rowKey="id"
          loading={loading}
          dataSource={filteredContacts}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            hideOnSinglePage: true,
          }}
          size="middle"
        />
      </div>

      <ContactFormModal
        open={modalOpen}
        loading={submitting}
        mode={modalMode}
        initialValues={editingContact || undefined}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ContactManagement;
