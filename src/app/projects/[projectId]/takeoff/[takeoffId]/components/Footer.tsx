/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Button from "@/components/Button";
import { Divider, notification, Popover, Spin } from "antd";
import Image from "next/image";
import { useState } from "react";
import SendLatiiModal from "./Send-Latii-Modal";
import {
  fetchPdfDownloadUrl,
  generateCustomerLink,
  sendToLatii,
} from "@/services/projectService";
import { useParams, useRouter } from "next/navigation";
import { LoadingOutlined } from "@ant-design/icons";
import { QuotiiToManufacturerPopover } from "@/components/coming-soon-popovers/Popovers";

type FooterProps = {
  quote: any;
  handleUpdateQuoteSettings?: (updatedQuote: any) => void;
};

const Footer = ({ quote }: FooterProps) => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const [sendToLatiiModalOpen, setSendToLatiiModalOpen] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({
    download: false,
    end_customer_link: false,
  });

  const handleSendToLatii = async (
    files: any[] | null = [],
    description: string = "",
  ) => {
    const response = await sendToLatii(
      quote?.id,
      "QUOTE_SENT",
      "dealer",
      files,
      description,
    );
    if (response.status === "success") {
      setSendToLatiiModalOpen(false);
      router.push(`/projects/${projectId}/`);
    }
  };

  const handleDownload = async () => {
    setLoading((prev) => {
      return { ...prev, download: true };
    });
    const url = await fetchPdfDownloadUrl(quote?.id);
    if (typeof url === "string") {
      const a = document.createElement("a");
      a.href = url;
      a.download = "quote.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      notification.error({
        message: "Error downloading quote",
        description: "Please try again later",
      });
    }
    setLoading((prev) => {
      return { ...prev, download: false };
    });
  };

  const handleEndCustomerClick = async () => {
    setLoading((prev) => {
      return { ...prev, end_customer_link: true };
    });
    const response = await generateCustomerLink(quote?.id);
    setLoading((prev) => {
      return { ...prev, end_customer_link: false };
    });
    if (!response.ok) return;

    const isProduction = process.env.NODE_ENV === "production";
    const isDevSubdomain = window.location.hostname.includes("dev");
    const shouldUseDev = !isProduction || isDevSubdomain;

    const baseDomain = shouldUseDev
      ? "https://internal.dev.latii.com"
      : "https://internal.latii.com";

    const url = `${baseDomain}/public/end-customer-link/${response.data}`;
    window.open(url, "_blank");
  };

  const buttonLabel = "Send to Latii";
  const isAnyLoading = Object.values(loading).some(Boolean);

  return (
    <div className="flex border-t border-primaryN50 fixed bottom-0 min-h-20 py-8 xl:px-32 px-10 w-full gap-2.5 justify-evenly bg-white z-50 max-h-24">
      <div className="flex items-center gap-6">
        <div className="text-xs flex flex-col gap-2">
          <p>
            {quote?.item_count}{" "}
            <span className="text-grey-normal">Item Cards</span>
          </p>
          <p>
            {quote?.unit_count}{" "}
            <span className="text-grey-normal">Products</span>
          </p>
        </div>
        <Divider type="vertical" className="h-full m-0 bg-primaryN30" />
        <div>
          <p>{quote?.window_count}</p>
          <p className="text-grey-normal text-xs">Windows</p>
        </div>
        <div>
          <p>{quote?.door_count}</p>
          <p className="text-grey-normal text-xs">Doors</p>
        </div>
        <div>
          <p>{quote?.system_count}</p>
          <p className="text-grey-normal text-xs">Systems</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <p className="text-sm text-grey-normal font-semibold">Price</p>
        <Divider type="vertical" className="h-full m-0 bg-primaryN30" />
        <div>
          <p className="text-kahuBlue">
            ${quote?.total_price.toLocaleString("en-US")}
          </p>
          <p className="text-xs text-grey-normal">Price</p>
        </div>
        <div>
          <p className="text-kahuBlue">
            ${quote?.price_sqft.toLocaleString("en-US")}
          </p>
          <p className="text-xs text-grey-normal">Price/sf</p>
        </div>

        <Divider type="vertical" className="h-full m-0 bg-primaryN30" />
        <div>
          <p>${quote?.product_price.toLocaleString("en-US")}</p>
          <p className="text-xs text-grey-normal">Product Price</p>
        </div>

        <div>
          <p>${quote?.max_custom_fee.toLocaleString("en-US")}</p>
          <p className="text-xs text-grey-normal">Max Tariff</p>
        </div>
        <div>
          <p>${quote?.transportation_fee.toLocaleString("en-US")}</p>
          <p className="text-xs text-grey-normal">Shipping & Packaging</p>
        </div>
        {quote?.custom_fee !== 0 && (
          <div>
            <p>${quote?.custom_fee.toLocaleString("en-US")}</p>
            <p className="text-xs text-grey-normal">Sales Tax</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={() => setSendToLatiiModalOpen(true)}>
          {buttonLabel}
        </Button>

        <Button
          variant="outline"
          className="flex gap-2"
          onClick={handleDownload}
          disabled={isAnyLoading}
        >
          {loading.download ? (
            <Spin indicator={<LoadingOutlined spin />} />
          ) : (
            <Image
              src="/assets/icons/download-colored.svg"
              alt="download icon"
              width={20}
              height={20}
              style={{ width: "auto", height: "auto" }}
            />
          )}
        </Button>
        <Button
          variant="outline"
          className="flex gap-2"
          onClick={handleEndCustomerClick}
          disabled={isAnyLoading}
        >
          {loading.end_customer_link ? (
            <Spin indicator={<LoadingOutlined spin />} />
          ) : (
            <Image
              src="/assets/icons/account-rounded.svg"
              alt="end customer icon"
              width={20}
              height={20}
              style={{ width: "auto", height: "auto" }}
            />
          )}
        </Button>
        <Popover content={<QuotiiToManufacturerPopover />} placement="topLeft">
          <div>
            <Button disabled>Lucius to Manufacturer</Button>
          </div>
        </Popover>
      </div>
      <SendLatiiModal
        open={sendToLatiiModalOpen}
        closeModal={() => setSendToLatiiModalOpen(false)}
        onSuccess={handleSendToLatii}
        quote={quote}
      />
    </div>
  );
};

export default Footer;
