import { Divider } from "antd";
import Image from "next/image";

const Header = () => {
  return (
    <div className="flex items-center">
      <Image
        src="/assets/logos/cato-with-text.svg"
        width={60}
        height={20}
        alt="Cato logo and name"
      />
      <Divider type="vertical" className="border h-5 mx-4 border-primaryN30" />
      <div className="flex flex-col gap-3">
        <p className="text-forumBlue-normal text-lg">Knowledge Base</p>
      </div>
    </div>
  );
};

export default Header;
