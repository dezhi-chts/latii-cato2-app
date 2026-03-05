import { Divider } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

const mockFiles = ["[File Name]", "[File Name]", "[File Name]"];

const Header = () => {
  const projectId = useParams().projectId;
  const takeoffId = useParams().takeoffId;

  return (
    <div className="px-14 w-full h-[110px] border-b border-primaryN30 flex items-center">
      <Link
        className="cursor-pointer"
        href={`/projects/${projectId}/takeoff/${takeoffId}`}
      >
        <Image
          src="/assets/icons/arrow-back.svg"
          alt="logo"
          width={12}
          height={8}
        />
      </Link>

      <div className="flex gap-8 pl-14">
        {mockFiles.map((fileName, index) => (
          <div key={index} className="flex items-center gap-8">
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-normal-active">
                <div className="text-white text-xxs font-sans">{"✓"}</div>
              </div>
              <p className="text-sm text-green-normal-active text-nowrap">
                {fileName}
              </p>
            </div>
            <div className="w-24 h-[1px] bg-grey-light-hover" />
          </div>
        ))}
        <div className="flex gap-3">
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-forumBlue-normal">
            <div className="text-white text-xxs font-sans">4</div>
          </div>
          <p className="text-sm text-forumBlue-normal text-nowrap">
            Multi File Merger
          </p>
        </div>
      </div>
    </div>
  );
};

export default Header;
