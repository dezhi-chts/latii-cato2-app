"use client";

import AuthWrapper from "@/components/AuthWrapper";
import { SessionProvider } from "next-auth/react";
import { UserProvider } from "@/context/UserContext";
import { CompanyProvider } from "@/context/CompanyContext";
import { ProjectsProvider } from "@/context/ProjectsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthWrapper>
        <UserProvider>
          <CompanyProvider>
            <ProjectsProvider>{children}</ProjectsProvider>
          </CompanyProvider>
        </UserProvider>
      </AuthWrapper>
    </SessionProvider>
  );
}
