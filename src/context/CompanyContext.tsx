import { fetchCompanyByKeycloakUser } from "@/services/companyService";
import {
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

type CompanyContextType = {
  name: string;
  description: string;
  website: string;
  social_media: string;
  location: Location;
  id: number;
  photo_url: string;
  project_attributes: any[];
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [company, setCompany] = useState<CompanyContextType>({
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
  });

  const changeCompany = (updatedData: CompanyContextType) => {
    setCompany((prev) => {
      const updatedCompany = { ...prev, ...updatedData };
      return updatedCompany;
    });
  };

  const fetchCompanyData = async () => {
    try {
      const response = await fetchCompanyByKeycloakUser();
      if (response.status === "success") {
        changeCompany(response.data);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  return (
    <CompanyContext.Provider value={{ ...company }}>
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
