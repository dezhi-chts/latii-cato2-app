import { Divider } from "antd";
import Image from "next/image";

const Header = () => {
  return (
    <div className="h-16 flex items-center zoomed-container">
      <Image
        src="/assets/logos/lucius-with-name.svg"
        width={92}
        height={19}
        alt="Lucius logo and name"
      />
      <Divider type="vertical" className="h-16 border mx-5 border-primaryN30" />
      <div className="flex flex-col gap-3">
        <h5 className="text-forumBlue text-xl">Knowledge Base</h5>
        <p className="text-sm">
          Source all your data, teach Lucius all the knowledge.
        </p>
      </div>
    </div>
  );
};

export default Header;
