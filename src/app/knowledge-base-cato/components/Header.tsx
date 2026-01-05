import { Divider } from "antd";
import Image from "next/image";

const Header = () => {
  return (
    <div className="h-16 flex items-center zoomed-container">
      <Image
        src="/assets/logos/cato-with-text.svg"
        width={92}
        height={19}
        alt="Cato logo and name"
      />
      <Divider type="vertical" className="h-16 border mx-5 border-primaryN30" />
      <div className="flex flex-col gap-3">
        <h5 className="text-forumBlue text-xl">Knowledge Base</h5>
      </div>
    </div>
  );
};

export default Header;
