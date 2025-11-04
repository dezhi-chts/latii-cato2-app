import { useEffect, useState } from "react";
import ProjectsCard from "./Projects-Card";

const HomeProjectsTable = ({ projects }: any) => {
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [favoriteProjects, setFavoriteProjects] = useState<any[]>([]);

  useEffect(() => {
    const recent = projects.slice(0, 5);
    const favorite = projects.filter((p: any) => p.is_favorite === true);
    setRecentProjects(recent);
    setFavoriteProjects(favorite);
  }, [projects]);

  return (
    <div className="flex gap-10">
      <ProjectsCard projects={recentProjects} type="recent" />
      <ProjectsCard projects={favoriteProjects} type="favorite" />
      <ProjectsCard projects={projects} type="all" />
    </div>
  );
};

export default HomeProjectsTable;
