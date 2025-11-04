import Image from "next/image";
import Link from "next/link";

type ProjectsCardProps = {
  projects: any[];
  type?: "recent" | "favorite" | "all";
};

const ProjectsCard = ({ projects, type }: ProjectsCardProps) => {
  const icon =
    type === "recent"
      ? "/assets/icons/recent.svg"
      : type === "favorite"
      ? "/assets/icons/yellow-favorite.svg"
      : "/assets/icons/projects.svg";

  return (
    <div className="h-[500px] w-[350px] border-primaryN30 border rounded-lg p-5 flex items-start gap-2">
      <Image src={icon} alt="icon" width={14} height={14} className="mt-0.5" />
      <div className="flex flex-col gap-2 h-full w-full">
        <p className="capitalize font-semibold text-sm pl-2">
          {type === "all" ? "All Projects" : type}
        </p>
        <div className="flex flex-col w-11/12 overflow-auto scrollbar-hidden h-full">
          {projects.map((project: any, index: number) => (
            <Link
              href={`/projects/${project?.project_id}`}
              key={index}
              className="text-sm flex gap-1.5 hover:bg-primaryN20 cursor-pointer p-1 px-2 rounded-lg transition-all duration-150 ease-in-out w-full"
            >
              {/*<p>{project.order}</p>-*/}
              {project?.quotes_ready_for_process > 0 && (
                <p className="rounded px-1 bg-accentIndigo text-white text-xs h-fit">
                  {project.quotes_ready_for_process}
                </p>
              )}
              <p className="truncate max-w-64">{project.project_name}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectsCard;
