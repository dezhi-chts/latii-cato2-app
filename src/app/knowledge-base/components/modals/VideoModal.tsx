import { Input, Modal } from "antd";
import Title from "./Title";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import Image from "next/image";
import { ModalsFooter } from "./ModalsFooter";

const VideoModal = ({ isModalOpen, setIsModalOpen, data }: any) => {
  const [settings, setSettings] = useState<any>({
    link: data?.label || "",
  });
  const [isValidLink, setIsValidLink] = useState(false);

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev: any) => ({
      ...prev,
      link: e.target.value,
    }));
  };

  useEffect(() => {
    const link = settings?.link?.trim();
    if (!link) {
      setIsValidLink(false);
      return;
    }

    const candidate = link.match(/^https?:\/\//i) ? link : `https://${link}`;

    try {
      const url = new URL(candidate);
      const hasDomain = /\.[a-z]{2,}$/i.test(url.hostname);
      setIsValidLink(hasDomain);
    } catch {
      setIsValidLink(false);
    }
  }, [settings?.link]);

  return (
    <Modal
      width={500}
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      footer={
        <ModalsFooter
          disabled={!isValidLink || data}
          onCancel={() => setIsModalOpen(false)}
          hasData={data}
        />
      }
      title={
        <Title
          title="Add New Video Links"
          subtitle="Add videos that will give the CATO information for your Take Offs."
        />
      }
    >
      <div className="w-[450px] flex flex-col gap-6 pt-4">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-light">Link</p>
          <Input
            placeholder="Link"
            className="mb-4"
            onChange={handleLinkChange}
            value={settings.link}
            disabled={data}
          />
        </div>

        {data && (
          <div className="w-full rounded-lg overflow-hidden">
            <Image
              src={data.image}
              alt="Video placeholder"
              width={328}
              height={174}
              className="w-full h-36 object-cover"
            />
            <p className="text-xxs truncate px-3 py-2 border border-t-0 border-primaryN30 rounded-xl rounded-t-none">
              {data.label}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default VideoModal;
