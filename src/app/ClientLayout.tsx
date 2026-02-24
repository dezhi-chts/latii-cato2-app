"use client";

import Sidebar from "@/components/Sidebar";
import { Providers } from "./providers";
const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Providers>
      <Sidebar />
      <div className="pl-12">{children}</div>
    </Providers>
  );
};

export default ClientLayout;
