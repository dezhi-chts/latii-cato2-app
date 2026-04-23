"use client";

import { useCallback, useEffect, useState } from "react";
import { notification } from "antd";
import Header from "./components/Header";
import CompanyManagement, {
  CompanyRow,
} from "./components/CompanyManagement";
import ContactManagement from "./components/ContactManagement";
import { getCompanyList } from "@/services/companyService";
import { useRouter } from "next/navigation";

enum MainTab {
  Companies = "Companies",
  Contacts = "Contacts",
}

const tabList = [MainTab.Companies, MainTab.Contacts];
const COMPANY_MANAGEMENT_ALLOWED_GROUPS = new Set([
  "LatiiCato2SuperAdmin",
  "LatiiCato2SuperAdmin_DEV",
  "LatiiCato2SuperAdmin_TEST",
]);

const hasCompanyManagementPermission = () => {
  if (typeof window === "undefined") return false;
  try {
    const userDataRaw = localStorage.getItem("userData");
    if (!userDataRaw) return false;
    const parsed = JSON.parse(userDataRaw);
    const groups = Array.isArray(parsed?.groups) ? parsed.groups : [];
    return groups.some((group: string) =>
      COMPANY_MANAGEMENT_ALLOWED_GROUPS.has(group),
    );
  } catch {
    return false;
  }
};

const Page = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MainTab>(MainTab.Companies);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [canAccessPage, setCanAccessPage] = useState(false);

  useEffect(() => {
    const allowed = hasCompanyManagementPermission();
    setCanAccessPage(allowed);
    setPermissionChecked(true);
    if (!allowed) {
      router.replace("/home");
    }
  }, [router]);

  const fetchCompanies = useCallback(async () => {
    const res = await getCompanyList({ page: 1, per_page: 1000 });
    if (res.status === "success") {
      const list: CompanyRow[] = (res.data?.items || res.data?.results || []).map(
        (item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          website: item.website,
        }),
      );
      setCompanies(list);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to fetch companies",
      });
    }
  }, []);

  useEffect(() => {
    if (!canAccessPage) return;
    fetchCompanies();
  }, [fetchCompanies, canAccessPage]);

  if (!permissionChecked || !canAccessPage) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="px-14 h-[110px] flex items-center border-b border-primaryN30">
        <Header />
      </div>

      <div className="px-14 py-6 w-full flex flex-row gap-4">
        {tabList.map((tab) => (
          <div
            key={tab}
            className={`w-[140px] h-[30px] flex items-center justify-center text-xs rounded-md cursor-pointer transition-colors ${
              tab === activeTab
                ? "font-bold text-grey-dark bg-forumBlue-light"
                : "text-grey-light-strong hover:bg-grey-light"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="px-14 pb-10 flex-1 overflow-hidden">
        {activeTab === MainTab.Companies ? (
          <CompanyManagement onChanged={fetchCompanies} />
        ) : (
          <ContactManagement companies={companies} />
        )}
      </div>
    </div>
  );
};

export default Page;
