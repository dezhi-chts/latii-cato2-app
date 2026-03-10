"use client";
import React, { ReactNode } from "react";
import { useParams } from "next/navigation";
import { TakeoffProvider } from "@/context/TakeoffContext";

interface TakeoffLayoutProps {
  children: ReactNode;
}

export default function TakeoffLayout({ children }: TakeoffLayoutProps) {
  const { projectId, takeoffId } = useParams();

  return (
    <TakeoffProvider projectId={projectId as string} takeoffId={takeoffId as string}>
      {children}
    </TakeoffProvider>
  );
}