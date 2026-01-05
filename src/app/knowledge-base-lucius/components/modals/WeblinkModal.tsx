import { Input, Modal } from "antd";
import Title from "./Title";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import { ModalsFooter } from "./ModalsFooter";

const WeblinkModal = ({ isModalOpen, setIsModalOpen, data }: any) => {
  const [settings, setSettings] = useState<any>({
    name: data?.label || "",
    link: data?.link || "",
  });
  const [isValidLink, setIsValidLink] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev: any) => ({
      ...prev,
      name: e.target.value,
    }));
  };

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
          disabled={!settings.name || !isValidLink || data}
          onCancel={() => setIsModalOpen(false)}
          hasData={data}
        />
      }
      title={
        <Title
          title="Add New Website"
          subtitle="Add Websites that will give the CATO information for your Take Offs."
        />
      }
    >
      <div className="w-[450px] flex flex-col gap-6 pt-4">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-light">
            Name{" "}
            <span className="text-basicGray">
              (Use this to identify the link)
            </span>
          </p>
          <Input
            placeholder="Name Link"
            className="mb-4"
            onChange={handleNameChange}
            value={settings.name}
            disabled={data}
          />
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-light">Link</p>
          <Input
            placeholder="Paste Link"
            className="mb-4"
            onChange={handleLinkChange}
            value={settings.link}
            disabled={data}
          />
        </div>
      </div>
    </Modal>
  );
};

export default WeblinkModal;
