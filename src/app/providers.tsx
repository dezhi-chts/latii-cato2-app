"use client";

import React from "react";
import AuthWrapper from "@/components/AuthWrapper";
import { SessionProvider } from "next-auth/react";
import { UserProvider } from "@/context/UserContext";
import { CompanyProvider } from "@/context/CompanyContext";
import { ProjectsProvider } from "@/context/ProjectsContext";

type Wrapper = React.ComponentType<{ children: React.ReactNode }>;

// If you create another provider, add it here, below the last, so we can ensure the correct order of providers.
// The order is important, for example, the AuthWrapper needs to be inside the SessionProvider, so it can access the session context.
const wrappers: Wrapper[] = [
  SessionProvider,
  AuthWrapper,
  UserProvider,
  CompanyProvider,
  ProjectsProvider,
];

export function Providers({ children }: { children: React.ReactNode }) {
  return wrappers.reduceRight(
    (acc, WrapperComp) => <WrapperComp>{acc}</WrapperComp>,
    children,
  );
}
