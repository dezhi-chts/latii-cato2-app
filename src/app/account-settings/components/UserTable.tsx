import { fetchCompanyByKeycloakUser } from "@/services/companyService";
import { Input } from "antd";
import Image from "next/image";
import { useEffect, useState } from "react";

const mockData = [
  {
    name: "Yunlong Deng",
    email: "yunlong@latii.com",
    phone: "+1",
    job_title: "Software",
    company_id: 1,
    note: "",
    auth_provider_uid: "cf86c750-8d64-4bf3-9ea8-69bd453b6751",
    id: 1,
    warning: null,
  },
  {
    name: "Harvey",
    email: "harvey@latii.com",
    phone: "",
    job_title: "Software",
    company_id: 1,
    note: "",
    auth_provider_uid: "cef2e067-7608-470b-a781-c760b44a6454",
    id: 2,
    warning: null,
  },
  {
    name: "Florencia",
    email: "flor@latii.com",
    phone: "",
    job_title: "Software",
    company_id: 1,
    note: "",
    auth_provider_uid: "1c2407ab-f845-4ce7-9d60-d364858ab6ea",
    id: 3,
    warning: null,
  },
  {
    name: "Guona",
    email: "guona0020@gmail.com",
    phone: "",
    job_title: "Software",
    company_id: 1,
    note: "",
    auth_provider_uid: "90911f15-e56a-48b6-a3a3-14e21c8e4900",
    id: 4,
    warning: null,
  },
  {
    name: "792913045-01@qq.com",
    email: "792913045-01@qq.com",
    phone: "",
    job_title: "Software",
    company_id: 1,
    note: "",
    auth_provider_uid: "af3b7e2e-fe1a-466a-9f66-536ef96ab3bb",
    id: 5,
    warning: null,
  },
  {
    name: "Yiran",
    email: "yiran@latii.com",
    phone: "",
    job_title: "VP",
    company_id: 1,
    note: "",
    auth_provider_uid: "d3fe3073-10f7-4f33-8c46-cbce00dfc1ee",
    id: 6,
    warning: null,
  },
  {
    name: "Benson",
    email: "benson@latii.com",
    phone: "",
    job_title: "VP",
    company_id: 1,
    note: "",
    auth_provider_uid: "882b62da-5ee4-4141-99f7-f061795fef0a",
    id: 7,
    warning: null,
  },
  {
    name: "792913045-test@qq.com",
    email: "792913045-test@qq.com",
    phone: "",
    job_title: "Software",
    company_id: 1,
    note: "",
    auth_provider_uid: "b9404ed3-dec0-45f7-b31e-7cb0b85d0ead",
    id: 8,
    warning: null,
  },
  {
    name: "Yuhan",
    email: "yuhan@latii.com",
    phone: "",
    job_title: "DEVOPS",
    company_id: 1,
    note: "",
    auth_provider_uid: "76d176bd-c399-48a9-8a66-3f7f0296863d",
    id: 9,
    warning: null,
  },
  {
    name: "Juan",
    email: "juan@latii.com",
    phone: "",
    job_title: "Sales Team",
    company_id: 1,
    note: "",
    auth_provider_uid: "414b904d-2700-4c3f-9b03-14c998b75282",
    id: 10,
    warning: null,
  },
  {
    name: "Karyme",
    email: "karyme@latii.com",
    phone: "",
    job_title: "Sales Team",
    company_id: 1,
    note: "",
    auth_provider_uid: "4dc5dec6-2e76-4001-b6d8-3da02fd155a4",
    id: 11,
    warning: null,
  },
  {
    name: "Suneru",
    email: "suneru@latii.com",
    phone: "",
    job_title: "Software",
    company_id: 1,
    note: "",
    auth_provider_uid: "c58219b7-8a77-43ce-a85e-3e86cf2ae66c",
    id: 12,
    warning: null,
  },
  {
    name: "Derek",
    email: "derek@latii.com",
    phone: "",
    job_title: "Data",
    company_id: 1,
    note: "",
    auth_provider_uid: "23d9594e-b5ff-4b84-b247-df80820588a7",
    id: 13,
    warning: null,
  },
  {
    name: "Yuncong Wang",
    email: "wangyuncong9@gmail.com",
    phone: null,
    job_title: "Software",
    company_id: 1,
    note: null,
    auth_provider_uid: "db795275-f676-4cd2-9765-fd9e1a143936",
    id: 14,
    warning: null,
  },
];

const UserTable = () => {
  const [usersData, setUsersData] = useState(mockData);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  const getCompanyId = () => {
    const response = fetchCompanyByKeycloakUser();
    console.log("COMPANY RESPONSE", response);
  };

  //   useEffect(() => {
  //     getCompanyId(); //Cors error pending
  //   }, []);

  const handleEditButtonClick = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(-1);
    } else {
      setEditingIndex(index);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="w-full rounded-t-xl bg-primaryN20 border-b border-primaryN30 flex text-basicGray text-xs text-center py-3">
        <p className="w-1/5">First Name</p>
        <p className="w-1/5">Last Name</p>
        <p className="w-1/5">Role</p>
        <p className="w-1/5">Email</p>
        <p className="w-[10%]">Permits</p>
        <p className="w-[10%]">Actions</p>
      </div>
      <div className="max-h-[70vh] overflow-auto scrollbar-hidden">
        {usersData.map((user, index) => {
          return (
            <Row
              user={user}
              index={index}
              handleEditButtonClick={handleEditButtonClick}
              editingIndex={editingIndex}
            />
          );
        })}
      </div>
    </div>
  );
};

export default UserTable;

type RowProps = {
  user: any;
  index: number;
  handleEditButtonClick: (i: number) => void;
  editingIndex: number;
};

const Row = ({
  user,
  index,
  handleEditButtonClick,
  editingIndex,
}: RowProps) => {
  const [name = "", lastName = ""] = user.name.split(" ");
  const isEditing = editingIndex === index;

  const renderField = (
    value: string | undefined,
    defaultValue = "-",
    props?: any
  ) => {
    if (isEditing) {
      return (
        <Input
          className="w-1/5"
          defaultValue={value || defaultValue}
          {...props}
        />
      );
    }

    return <p className="w-1/5">{value || defaultValue}</p>;
  };

  return (
    <div
      key={index}
      className="w-full py-3 border-b border-primaryN30 flex text-xs gap-2 text-center"
    >
      {renderField(name)}
      {renderField(lastName)}
      {renderField(user.job_title)}
      {renderField(user.email)}
      <p className="w-[10%] text-basicGray">Owner</p>
      <div className="w-[10%] flex justify-center gap-1.5 items-center">
        <Image
          src={`/assets/icons/edit-table${isEditing ? "-active" : ""}.svg`}
          alt="contact edit icon"
          width={25}
          height={18}
          className="cursor-pointer hover:opacity-80"
          onClick={() => handleEditButtonClick(index)}
        />
        <Image
          src="/assets/icons/delete-table.svg"
          alt="contact delete icon"
          width={25}
          height={18}
          className="cursor-pointer hover:opacity-80"
        />
      </div>
    </div>
  );
};
