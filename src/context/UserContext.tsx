import { fetchCompanyByKeycloakUser } from "@/services/companyService";
import { isUserAdmin } from "@/services/userService";
import { UserDataForUpdate } from "@/types/user";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

type UserContextType = {
  id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title: string;
  company?: any;
  company_contact?: any;
  company_id?: number;
  force_logout: boolean;
  changeUser: (updatedData: UserDataForUpdate) => void;
  clearLocalStorage: () => void;
  isAdmin: boolean;
  project_attributes?: any[];
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserContextType>({
    id: "",
    username: "Guest",
    first_name: "Guest",
    last_name: "",
    email: "guest@example.com",
    job_title: "",
    company: null,
    company_contact: null,
    company_id: 0,
    force_logout: false,
    changeUser: () => {},
    clearLocalStorage: () => {},
    isAdmin: false,
    project_attributes: [],
  });

  const changeUser = (updatedData: UserDataForUpdate) => {
    saveChangesOnLocalStorage(updatedData);
    setUser((prev) => {
      const updatedUser = { ...prev, ...updatedData };
      return updatedUser;
    });
  };

  const saveChangesOnLocalStorage = (updatedUser: UserDataForUpdate) => {
    try {
      const user = localStorage.getItem("userData");
      if (!user) return;
      const parsedUser = JSON.parse(user);
      const newUser = {
        ...parsedUser,
        email: updatedUser.email,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`,
      };
      localStorage.setItem("userData", JSON.stringify(newUser));
    } catch (error) {}
  };

  const clearLocalStorage = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
  };

  const fetchUserData = async () => {
    const savedUserRaw = localStorage.getItem("userData");
    if (!savedUserRaw) return;

    let savedUser;
    try {
      savedUser = JSON.parse(savedUserRaw);
    } catch (e) {
      console.error("Failed to parse userData:", e);
      return;
    }

    if (!savedUser?.username) return;

    const { companyId, projectAttributes, companyName } =
      await getCompanyInfo();

    const isAdmin = await isUserAdmin();
    let first_name = "Guest";
    let last_name = "";
    if (savedUser.name.split(" ").length == 2) {
      first_name = savedUser.name.split(" ")[0];
      last_name = savedUser.name.split(" ")[1];
    }
    setUser({
      id: "",
      username: savedUser.username,
      first_name: first_name,
      last_name: last_name,
      email: savedUser.email,
      company: companyName,
      company_contact: null,
      company_id: companyId,
      force_logout: false,
      changeUser: () => {},
      clearLocalStorage: () => {},
      isAdmin: isAdmin,
      job_title: savedUser.job_title,
      project_attributes: projectAttributes,
    });
    return;
  };

  const getCompanyInfo = async () => {
    try {
      const response = await fetchCompanyByKeycloakUser();
      return {
        companyId: response?.data.id || null,
        projectAttributes: response?.data.project_attributes || [],
        companyName: response?.data.name || "",
      };
    } catch (error) {
      console.log("Error fetching company id:", error);
      return {
        companyId: null,
        projectAttributes: [],
      };
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const savedUserRaw = localStorage.getItem("userData");
      if (savedUserRaw) {
        clearInterval(interval);
        fetchUserData();
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <UserContext.Provider value={{ ...user, changeUser, clearLocalStorage }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
