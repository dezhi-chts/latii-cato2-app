"use client";
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { fetchProjects } from "@/services/projectService";
import { ProjectSettings } from "@/types/project";

interface ProjectsContextType {
  projects: ProjectSettings[];
  refetchProjects: () => Promise<void>;
  lastProjectId?: number | undefined;
  hasLoadedProjects: Boolean;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(
  undefined
);

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<ProjectSettings[]>([]);
  const [hasLoadedProjects, setHasLoadedProjects] = useState<Boolean>(false);

  const [lastProjectId, setLastProjectId] = useState<number | undefined>(
    undefined
  );

  const loadProjects = async () => {
    return;
    try {
      setHasLoadedProjects(false);
      const fetchedProjects = await fetchProjects();
      // const projectsWithOrder = addOrderToProjects(fetchedProjects);
      setProjects(fetchedProjects);
      if (fetchedProjects.length > 0) {
        const lastProject = fetchedProjects[0];
        if (lastProject) {
          setLastProjectId(lastProject.project_id);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setHasLoadedProjects(true);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const refetchProjects = async () => {
    await loadProjects();
  };

  // const addOrderToProjects = (projects: ProjectSettings[]) =>
  //   projects.reverse().map((p, i) => ({ ...p, order: i + 1 }));

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        refetchProjects,
        lastProjectId,
        hasLoadedProjects,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = (): ProjectsContextType => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
};
