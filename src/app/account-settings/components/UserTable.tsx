import {
  deleteContactById,
  updateContactById,
} from "@/services/contactsService";
import { Contact } from "@/types/user";
import { Input, notification, Popconfirm } from "antd";
import Image from "next/image";
import { useState } from "react";
import { NAME_ONLY_REGEX } from "./NewUserForm";

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
      <div className="w-full rounded-t-xl bg-primaryN20 border-b border-primaryN30 flex text-basicGray text-xs text-center py-3 gap-2">
        <p className="w-1/5">First Name</p>
        <p className="w-1/5">Last Name</p>
        <p className="w-1/5">Role</p>
        <p className="w-1/5">Email</p>
        <p className={`${showActions ? "w-[10%]" : "w-1/5"}`}>Permits</p>
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
};

const Row = ({
  user,
  index,
  handleIndexChange,
  editingIndex,
  refreshContacts,
  showActions,
}: RowProps) => {
  const parts = user.name.split(/[\s-]+/);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";

  const [contact, setContact] = useState<Contact>({
    first_name: firstName,
    last_name: lastName,
    email: user.email,
    job_title: user.job_title,
  });

  const isEditing = editingIndex === index;

  const handleDeleteButtonClick = async () => {
    const response = await deleteContactById({
      company_id: 1,
      contact_id: user.id,
    });
    if (response.status === "success") {
      refreshContacts();
      notification.success({
        message: "Contact deleted successfully",
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
      notification.success({
        message: "Contact updated successfully",
      });
    } else {
      notification.error({
        message: "Error updating contact",
        description: `${
          response?.data?.response?.data?.detail || "Unknown error"
        }`,
      });
      setContact(user);
    }
  };

  const handleEditButtonClick = () => {
    if (editingIndex === index && contact !== user) {
      handleSubmitChanges();
    }

    handleIndexChange(index);
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

    return <p className="w-1/5">{value || "-"}</p>;
  };

  return (
    <div className="w-full h-14 items-center border-b border-primaryN30 flex text-xs gap-2 text-center">
      {renderField(contact.first_name, "first_name")}
      {renderField(contact.last_name, "last_name")}
      {renderField(contact.job_title, "job_title")}
      {renderField(contact.email, "email")}
      <p className={`${showActions ? "w-[10%]" : "w-1/5"} text-basicGray`}>
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
