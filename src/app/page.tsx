"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/context/ProjectsContext";

export default function Home() {
  const router = useRouter();

  const { projects } = useProjects();

  useEffect(() => {
    const firstProject = projects[0];
    if (firstProject) {
      router.push(`/projects/${firstProject.project_id}`);
      return;
    }
  }, [projects, router]);

  return <div className=""></div>;
}
