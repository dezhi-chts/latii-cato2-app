import {
  deleteContactById,
  updateContactById,
} from "@/services/contactsService";
import { bindUserToAdmin, unbindUserToAdmin } from "@/services/userService";
import { useUser } from "@/context/UserContext";
import { Contact } from "@/types/user";
import { Input, Popconfirm, Switch, Tooltip } from "antd";
import Image from "next/image";
import { useEffect, useState } from "react";
import { NAME_ONLY_REGEX } from "./NewUserForm";
import { notify } from "@/utils/notify";

type UserTableProps = {
  contacts: Contact[];
  refreshContacts: () => void;
  showActions?: boolean;
};

const UserTable = ({
  contacts,
  refreshContacts,
  showActions = true,
}: UserTableProps) => {
  const { email: currentUserEmail } = useUser();
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  const handleIndexChange = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(-1);
    } else {
      setEditingIndex(index);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="w-full rounded-t-xl bg-primaryN20 border-b border-primaryN30 flex text-grey-normal text-xs text-center py-3 gap-2">
        <p className="w-1/6">First Name</p>
        <p className="w-1/6">Last Name</p>
        <p className="w-1/6">Role</p>
        <p className="w-1/6">Email</p>
        <p className={`${showActions ? "w-[10%]" : "w-1/6"}`}>is_admin</p>
        <p className={`${showActions ? "w-[10%]" : "w-1/6"}`}>Permits</p>
        {showActions && <p className="w-[10%]">Actions</p>}
      </div>
      <div
        className={`${showActions ? "max-h-[70vh]" : "max-h-[30vh]"} overflow-auto scrollbar-hidden`}
      >
        {contacts
          ? contacts.map((user, index) => {
            return (
              <Row
                key={index}
                user={user}
                index={index}
                handleIndexChange={handleIndexChange}
                editingIndex={editingIndex}
                refreshContacts={refreshContacts}
                showActions={showActions}
                currentUserEmail={currentUserEmail || ""}
              />
            );
          })
          : null}
      </div>
    </div>
  );
};

export default UserTable;

type RowProps = {
  user: any;
  index: number;
  handleIndexChange: (i: number) => void;
  editingIndex: number;
  refreshContacts: () => void;
  showActions: boolean;
  currentUserEmail: string;
};

const Row = ({
  user,
  index,
  handleIndexChange,
  editingIndex,
  refreshContacts,
  showActions,
  currentUserEmail,
}: RowProps) => {
  const buildContactState = (rawUser: any) => {
    const parts = String(rawUser?.name || "").split(/[\s-]+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";
    return {
      ...rawUser,
      first_name: rawUser?.first_name ?? firstName,
      last_name: rawUser?.last_name ?? lastName,
      email: rawUser?.email || "",
      job_title: rawUser?.job_title || "",
      is_admin: Boolean(rawUser?.is_admin),
    };
  };

  const [contact, setContact] = useState<
    Contact & { is_admin?: boolean; auth_provider_uid?: string; id?: number | string }
  >(
    buildContactState(user),
  );
  const [adminUpdating, setAdminUpdating] = useState(false);

  useEffect(() => {
    setContact(buildContactState(user));
  }, [user]);

  const isEditing = editingIndex === index;
  const isCurrentLoginUser =
    (currentUserEmail || "").trim().toLowerCase() ===
    String(user?.email || "").trim().toLowerCase();

  const handleDeleteButtonClick = async () => {
    const response = await deleteContactById({
      company_id: 1,
      contact_id: user.id,
    });
    if (response.status === "success") {
      refreshContacts();
      notify.success({
        title: "Success",
        description: "Contact deleted successfully",
      });
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    const newValue =
      name === "first_name" || name === "last_name"
        ? value.replace(NAME_ONLY_REGEX, "")
        : value;

    setContact((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmitChanges = async () => {
    const mappedContact: Contact = {
      name: `${contact.first_name} ${contact.last_name}`.trim(),
      email: contact.email,
      job_title: contact.job_title,
      company_id: 1,
    };

    const response = await updateContactById({
      company_id: 1,
      contact_id: user.id,
      contact_data: mappedContact,
    });
    if (response.status === "success") {
      refreshContacts();
      notify.success({
        title: "Success",
        description: "Contact updated successfully",
      });
    } else {
      notify.error({
        title: "Error",
        description: `${response?.data?.response?.data?.detail || "Unknown error"
          }`,
      });
      setContact(buildContactState(user));
    }
  };

  const handleEditButtonClick = () => {
    if (editingIndex === index && contact !== user) {
      handleSubmitChanges();
    }

    handleIndexChange(index);
  };

  const handleAdminSwitchChange = async (checked: boolean) => {
    const previousValue = Boolean(contact?.is_admin);
    setContact((prev) => ({ ...prev, is_admin: checked }));
    setAdminUpdating(true);
    const targetUserId: any =
      contact?.auth_provider_uid ||
      contact?.id ||
      user?.auth_provider_uid ||
      user?.id;
    if (!targetUserId) {
      setContact((prev) => ({ ...prev, is_admin: previousValue }));
      setAdminUpdating(false);
      notify.error({
        title: "Error",
        description: "Failed to update admin permission",
      });
      return;
    }
    const response = checked
      ? await bindUserToAdmin(targetUserId)
      : await unbindUserToAdmin(targetUserId);
    const isSuccess = response?.status !== "error";
    if (!isSuccess) {
      setContact((prev) => ({ ...prev, is_admin: previousValue }));
      notify.error({
        title: "Error",
        description: response?.data?.detail || "Failed to update admin permission",
      });
    } else {
      notify.success({
        title: "Success",
        description: `admin permission ${checked ? "enabled" : "disabled"} successfully`,
      });
    }
    setAdminUpdating(false);
  };

  const renderField = (value: string | undefined, name?: any) => {
    if (isEditing) {
      return (
        <Input
          className="w-1/5 text-center"
          value={value || ""}
          name={name}
          onChange={handleChange}
        />
      );
    }

    return <p className="w-1/6 px-[1px] break-words whitespace-pre-wrap">{value || "-"}</p>;
  };

  return (
    <div className="w-full min-h-14 items-center border-b border-primaryN30 flex text-xs text-center">
      {renderField(contact.first_name, "first_name")}
      {renderField(contact.last_name, "last_name")}
      {renderField(contact.job_title, "job_title")}
      {renderField(contact.email, "email")}
      <div className={`${showActions ? "w-[10%]" : "w-1/6"} flex justify-center`}>
        {isCurrentLoginUser ? (
          <Tooltip title="Unable to modify permissions. To avoid accidental loss of feature access, please contact the relevant personnel for assistance.">
            <span>
              <Switch checked={Boolean(contact?.is_admin)} disabled loading={adminUpdating} size="small"></Switch>
            </span>
          </Tooltip>
        ) : (
          <Switch
            checked={Boolean(contact?.is_admin)}
            loading={adminUpdating}
            size="small"
            disabled={isCurrentLoginUser}
            onChange={handleAdminSwitchChange}
          />
        )}
      </div>
      <p className={`${showActions ? "w-[10%]" : "w-1/5"} text-grey-normal`}>
        Owner
      </p>

      {showActions && (
        <div className="w-[10%] flex justify-center gap-1.5 items-center">
          <Image
            src={`/assets/icons/edit-table${isEditing ? "-active" : ""}.svg`}
            alt="contact edit icon"
            width={25}
            height={18}
            className="cursor-pointer hover:opacity-80"
            onClick={handleEditButtonClick}
          />
          <Popconfirm
            title="Are you sure you want to delete this contact?"
            onConfirm={handleDeleteButtonClick}
            okText="Yes"
            cancelText="No"
          >
            <Image
              src="/assets/icons/delete-table.svg"
              alt="contact delete icon"
              width={25}
              height={18}
              className="cursor-pointer hover:opacity-80"
            />
          </Popconfirm>
        </div>
      )}
    </div>
  );
};
