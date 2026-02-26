import { Button } from "antd";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex flex-col gap-2">
        <Image
          src="/assets/logos/lucius-with-name.svg"
          alt="Lucius logo"
          width={137}
          height={27}
        />
        <p className="text-grey-normal">Last Update June 2025</p>
      </div>
      <Link href="/knowledge-base-lucius">
        <Button className="h-10">Knowledge Base</Button>
      </Link>
    </div>
  );
};

export default Header;
