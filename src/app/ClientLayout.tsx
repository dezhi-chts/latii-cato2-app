"use client";

import Sidebar from "@/components/Sidebar";
import { ProjectsProvider } from "@/context/ProjectsContext";
import { UserProvider } from "@/context/UserContext";
import { SessionProvider } from "next-auth/react";
import AuthWrapper from "@/components/AuthWrapper";
const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <UserProvider>
        <AuthWrapper>
          <ProjectsProvider>
            <Sidebar />
            <div className="pl-12">{children}</div>
          </ProjectsProvider>
        </AuthWrapper>
      </UserProvider>
    </SessionProvider>
  );
};

export default ClientLayout;
