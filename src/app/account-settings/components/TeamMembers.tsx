"use client";

import UserTable from "./UserTable";
import NewUserForm from "./NewUserForm";
import { getContactsByCompanyId } from "@/services/contactsService";
import { Contact } from "@/types/user";
import { useEffect, useState } from "react";

const TeamMembers = () => {
  const CONTACTS_TIMEOUT_MS = 10_000;

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
      const response = await getContactsByCompanyId({ company_id: 1 });

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
    fetchCompanyContacts();
  }, []);

  return (
    <div className="ml-4 flex flex-col gap-12 w-11/12">
      <div className="flex">
        <div className="w-8/12 pt-10">
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

        <NewUserForm refreshContacts={fetchCompanyContacts} />
      </div>
    </div>
  );
};

export default TeamMembers;
