"use client";

import Sidebar from "@/components/Sidebar";
import { GlobalLoadingProvider } from "@/context/GlobalLoadingContext";
import { ProjectsProvider } from "@/context/ProjectsContext";
import { UserProvider } from "@/context/UserContext";
import { SessionProvider } from "next-auth/react";
import AuthWrapper from "@/components/AuthWrapper";
const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <UserProvider>
        <AuthWrapper>
          <GlobalLoadingProvider>
            <ProjectsProvider>
              <Sidebar />
              <div className="pl-16">{children}</div>
            </ProjectsProvider>
          </GlobalLoadingProvider>
        </AuthWrapper>
      </UserProvider>
    </SessionProvider>
  );
};

export default ClientLayout;
