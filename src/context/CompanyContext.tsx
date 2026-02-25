"use client";

import { fetchCompanyByKeycloakUser } from "@/services/companyService";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type Location = {
  state: string;
  city: string;
  address: string;
  postal_code: string;
  country: string;
};

type CompanyData = {
  name: string;
  description: string;
  website: string;
  social_media: string;
  location: Location;
  id: number;
  photo_url: string;
  project_attributes: any[];
};

type CompanyContextType = {
  company: CompanyData;
  changeCompany: (updatedData: Partial<CompanyData>) => void;
  refreshCompany: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const initialCompany: CompanyData = {
  name: "",
  description: "",
  website: "",
  social_media: "",
  location: {
    state: "",
    city: "",
    address: "",
    postal_code: "",
    country: "",
  },
  id: 0,
  photo_url: "",
  project_attributes: [],
};

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [company, setCompany] = useState<CompanyData>(initialCompany);

  const changeCompany = (updatedData: Partial<CompanyData>) => {
    setCompany((prev) => ({ ...prev, ...updatedData }));
  };

  const refreshCompany = async () => {
    try {
      const response = await fetchCompanyByKeycloakUser();
      if (response.status === "success") {
        setCompany(response.data); // pisa todo con lo del backend
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  };

  useEffect(() => {
    refreshCompany();
  }, []);

  return (
    <CompanyContext.Provider value={{ company, changeCompany, refreshCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
};
