import { http } from "@/lib/http";
import { Contact } from "@/types/user";

type ContactProps = {
  company_id: string | number;
  contact_data?: Contact;
  contact_id?: string | number;
};

export const getContactsByCompanyId = async ({ company_id }: ContactProps) => {
  try {
    const url = `/company/${company_id}/contacts`;
    const response = await http.get(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return { data: null, status: "error" };
  }
};

export const createContact = async ({
  company_id,
  contact_data,
}: ContactProps) => {
  try {
    const url = `/company/${company_id}/contact`;
    const response = await http.post(url, contact_data);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error creating contact:", error);
    return { data: error, status: "error" };
  }
};

export const updateContactById = async ({
  company_id,
  contact_id,
  contact_data,
}: ContactProps) => {
  try {
    const url = `/company/${company_id}/contact/${contact_id}`;
    const response = await http.put(url, contact_data);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error updating contact:", error);
    return { data: error, status: "error" };
  }
};

export const deleteContactById = async ({
  company_id,
  contact_id,
}: ContactProps) => {
  try {
    const url = `/company/${company_id}/contact/${contact_id}`;
    const response = await http.delete(url);
    return { data: response as any, status: "success" };
  } catch (error) {
    console.error("Error deleting contact:", error);
    return { data: null, status: "error" };
  }
};
