"use client";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { useProjects } from "@/context/ProjectsContext";
import { useEffect } from "react";

const NotFound = () => {
  const router = useRouter();

  const { projects } = useProjects();

  useEffect(() => {
    const lastProject = projects[projects.length - 1];
    if (!lastProject) return;
    router.push(`/projects/${lastProject?.project_id}`);
  }, [router, projects]);

  return (
    <div className="flex items-center justify-center h-screen bg-slate-800">
      <div className="text-center flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold text-red-400">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-gray-200">
          {"Sorry, we couldn't find the page you're looking for."}
        </p>
        <p className="text-gray-300">
          {"You'll be redirected to the homepage in a few seconds."}
        </p>
        <Button
          variant="outline"
          className="px-10"
          disabled={true}
          onClick={() => router.push("/")}
        >
          Go Home
        </Button>
        <p className="text-basicLightGray">
          For testing, go to a project in the sidebar. (This message will be
          deleted in future versions)
        </p>
      </div>
    </div>
  );
};

export default NotFound;
