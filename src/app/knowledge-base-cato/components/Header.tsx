import { Divider } from "antd";
import Image from "next/image";

const Header = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center gap-2">
        <Image
          src="/assets/logos/cato-with-text.svg"
          width={60}
          height={20}
          alt="Cato logo and name"
        />
        <Divider type="vertical" className="border h-5 mx-4 border-primaryN30" />
        <div className="flex flex-col gap-3">
          <p className="text-grey-normal text-lg">Knowledge Base</p>
        </div>
      </div>
      <div className="text-sm text-grey-light-strong">Set the data you want to recollect from your projects, keep it organized.</div>
    </div>
  );
};

export default Header;
