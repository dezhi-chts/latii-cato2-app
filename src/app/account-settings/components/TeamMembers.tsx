"use client";

import UserTable from "./UserTable";
import NewUserForm from "./NewUserForm";
import { getContactsByCompanyId } from "@/services/contactsService";
import { Contact } from "@/types/user";
import { useEffect, useState } from "react";
import { Divider } from "antd";
import { useUser } from "@/context/UserContext";

export const CONTACTS_TIMEOUT_MS = 10_000;
const TeamMembers = () => {
  const { company_id = 0 } = useUser();

  const [usersData, setUsersData] = useState<Contact[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchCompanyContacts = async () => {
    setIsLoading(true);
    setHasError(false);

    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      setHasError(true);
      setIsLoading(false);
    }, CONTACTS_TIMEOUT_MS);

    try {
      const response = await getContactsByCompanyId({ company_id: company_id });

      if (timedOut) return;

      const mappedContacts: Contact[] = response.data.map((item: any) => ({
        name: item.name,
        email: item.email,
        phone: item.phone,
        job_title: item.job_title,
        id: item.id,
        note: item.note,
      }));

      clearTimeout(timeoutId);
      setUsersData(mappedContacts);
      setIsLoading(false);
    } catch (err) {
      if (timedOut) return;
      clearTimeout(timeoutId);
      setHasError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!company_id) return;
    fetchCompanyContacts();
  }, [company_id]);

  return (
    <div className="pl-16 flex flex-col gap-12 w-full">
      <div className="flex">
        <div className="w-8/12 pt-10 flex flex-col gap-5">
          <p className="text-kahuBlue text-base">User Panel</p>
          <div className="w-11/12">
            {isLoading ? (
              <p className="animate-pulse pt-4">
                Loading Contacts, please wait...
              </p>
            ) : hasError ? (
              <p className="pt-4 text-red-500">
                Error loading contacts. Please try again.
              </p>
            ) : (
              <UserTable
                refreshContacts={fetchCompanyContacts}
                contacts={usersData || []}
              />
            )}
          </div>
        </div>
        <Divider type="vertical" className="h-auto bg-primaryN20" />

        <div className="w-4/12">
          <NewUserForm refreshContacts={fetchCompanyContacts} />
        </div>
      </div>
    </div>
  );
};

export default TeamMembers;
