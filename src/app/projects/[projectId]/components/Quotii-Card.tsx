/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Button from "@/components/Button";
import {
  convertToCurrencyFormat,
  formatFullDate,
  formatPriceRange,
  getDaysAgoLabel,
} from "@/lib/functions";
import {
  archiveQuote,
  deleteQuote,
  duplicateQuote,
  sendToLatii,
  toggleQuotePin,
  updateQuotePersonalNotes,
} from "@/services/projectService";
import {
  Divider,
  Input,
  notification,
  Popconfirm,
  PopconfirmProps,
  Popover,
  Image as AntImage,
  Spin,
} from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SendLatiiModal from "../takeoff/[takeoffId]/components/Send-Latii-Modal";
import { PreviewImage } from "@/types/project";
import PdfPreviewModal from "./Pdf-Preview-Modal";
import FilesModal from "./Files-Modal";

const quoteStatusList = [
  { name: "All", value: "all", color: "#EBEDF0", isSelected: true, amount: 0 },
  {
    name: "Draft",
    value: "draft",
    color: "#FF931E",
    isSelected: false,
    amount: 0,
  },
  {
    name: "Latii Review",
    value: "latii_review",
    color: "#5856D7",
    isSelected: false,
    amount: 0,
  },
  {
    name: "Review",
    value: "review",
    color: "#F7CD4D",
    isSelected: false,
    amount: 0,
  },

  {
    name: "Approved",
    value: "approved",
    color: "#008ECE",
    isSelected: false,
    amount: 0,
  },
  {
    name: "Final",
    value: "final",
    color: "#2A845A",
    isSelected: false,
    amount: 0,
  },
  {
    name: "Archive",
    value: "archive",
    color: "#A3835F",
    isSelected: false,
    amount: 0,
  },
];

type QuotiiCardProps = {
  quote: any;
  refreshProject: (id: string | number) => Promise<void>;
  handlePreview: (quoteId: string) => void;
  handleClosePreview: (quoteId: string) => void;
  previewImage: PreviewImage | undefined;
  loading: boolean;
};

const QuotiiCard = ({
  quote,
  refreshProject,
  handlePreview,
  handleClosePreview,
  previewImage,
  loading,
}: QuotiiCardProps) => {
  const router = useRouter();
  const projectId = useParams().projectId;
  const [isPinned, setIsPinned] = useState(quote?.is_pinned);
  const [modals, setModals] = useState({
    sendToLatii: false,
    files: false,
  });
  const [loadingAccept, setLoadingAccept] = useState(false);
  const isArchived = quote?.quote_status_text === "Archive";
  const isDraft = quote?.quote_status_text === "Draft";

  const [api, contextHolder] = notification.useNotification();

  const { TextArea } = Input;

  const togglePin = async () => {
    const newIsPinned = !isPinned;

    setIsPinned(newIsPinned);
    const response = await toggleQuotePin(quote?.quote_id, newIsPinned);

    if (response === "error") {
      setIsPinned(!newIsPinned);
      return;
    }
    if (typeof projectId === "string") {
      refreshProject(projectId);
    }
  };

  const confirmDelete: PopconfirmProps["onConfirm"] = async () => {
    const response = await deleteQuote(quote?.quote_id);
    if (response === "success") {
      refreshProject(projectId as string);
      api.success({
        message: "Quote deleted successfully",
      });
    } else {
      api.error({
        message: "Error deleting quote",
        description: response,
      });
    }
  };

  const hasBeenReviewed = Number(quote?.quote_status) > 200;

  useEffect(() => {
    setIsPinned(quote?.is_pinned);
  }, [quote]);

  const getColorByStatusName = (name: string) => {
    const status = quoteStatusList.find((s) => s.name === name);
    if (!status) return { color: "#EBEDF0", bgColor: "#EBEDF020" };
    return { color: status.color, bgColor: `${status.color}33` };
  };

  const isReadyToAccept = quote?.process_state === "READY_ACCEPT";

  function handleModalChange(field: keyof typeof modals, value?: boolean) {
    setModals((prev) => ({ ...prev, [field]: value }));
  }

  const handleSendToLatii = async (
    files: any[] | null = [],
    description: string = "",
    title: string = "",
  ) => {
    const isSendRequest = quote?.quote_status_text === "Latii Review";

    const response = await sendToLatii(
      quote?.quote_id,
      isSendRequest ? "QUOTE_SEND_REQUEST" : "QUOTE_SENT",
      "dealer",
      files,
      description,
      title,
    );
    if (response.status === "success") {
      handleModalChange("sendToLatii", false);

      await refreshProject(projectId as string);
      if (isSendRequest) {
        api.success({
          message: "Quote re-sent successfully",
          description: "The quote was be re-sent to Latii for review.",
          duration: 5,
        });
        return "success";
      }
    }
    return "error";
  };

  const handleAcceptQuote = async () => {
    setLoadingAccept(true);

    const response = await sendToLatii(
      quote?.quote_id,
      "QUOTE_ACCEPTED",
      "dealer",
    );
    if (response.status === "success") {
      const data = response?.data?.data as any;
      const url = data?.quote_id;
      router.push(`/projects/${projectId}/takeoff/${url}?isNewAccept=true`);
    }
    setTimeout(() => {
      setLoadingAccept(false);
    }, 1000);
  };

  const handleArchive = async () => {
    const response = await archiveQuote(quote?.quote_id);
    if (response.status === "success") {
      refreshProject(projectId as string);
    }
  };

  const handleDuplicate = async () => {
    const response = await duplicateQuote(quote?.quote_id);
    if (response.status === "success") {
      refreshProject(projectId as string);
    }
  };

  const whiteSpinner = (
    <LoadingOutlined style={{ fontSize: 32, color: "#fff" }} spin />
  );

  const hasFiles = quote?.file_count > 0;

  return (
    <div>
      {contextHolder}
      <Link
        href={`/projects/${projectId}/takeoff/${quote?.quote_id}`}
        onClick={(e) => {
          if (isReadyToAccept) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className={`${
          isReadyToAccept ? "cursor-default" : "hover:bg-gray-50 cursor-pointer"
        } relative transition-all duration-150 flex rounded-[30px] justify-around items-start border border-neutralsN40 text-sm gap-4 py-8 h-52 pl-6 w-full`}
        key={quote.quote_id}
      >
        {isReadyToAccept && (
          <span className="z-10 absolute -top-2 left-10 bg-accentIndigo text-white text-xs px-2 py-0.5 rounded-full shadow-md">
            New
          </span>
        )}
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="relative inline-block group"
        >
          <AntImage
            src={"/assets/images/pdf-preview.png"}
            alt="Image placeholder"
            width={100}
            height={126}
            className="rounded-xl"
            preview={false}
          />
          <div
            className="absolute flex gap-2 justify-center items-center bg-black/50 top-0  w-full h-full opacity-0 group-hover:opacity-100 transition-all duration-300 ease-linea rounded-xl"
            onClick={() => {
              !loading && handlePreview(quote?.quote_id);
            }}
          >
            {loading ? (
              <Spin indicator={whiteSpinner} />
            ) : (
              <>
                <Image
                  src="/assets/icons/preview.svg"
                  width={20}
                  height={20}
                  alt="Preview icon"
                  className=""
                />
                <p className="text-white">Preview</p>
              </>
            )}
          </div>
          <Image
            src="/assets/icons/preview.svg"
            width={20}
            height={20}
            alt="Preview icon"
            className="absolute top-1 right-1 w-5 h-5 group-hover:opacity-0 transition-all duration-100 ease-linear pointer-events-none"
          />
        </div>
        <div className="flex flex-col justify-between h-full">
          <div className="flex gap-2 items-center  w-52">
            <p className="truncate ...">{quote?.quote_name}</p>
          </div>
          <div>
            <p className="text-grey-normal text-sm">Version {quote?.version}</p>
          </div>
          <div
            style={{
              backgroundColor: getColorByStatusName(quote.quote_status_text)
                .bgColor,
            }}
            className="flex items-center justify-center gap-2.5 rounded-full py-1 px-4 w-fit "
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: getColorByStatusName(quote.quote_status_text)
                  .color,
              }}
            />
            <p className="text-xs font-light">{quote.quote_status_text}</p>
          </div>
          <p className="text-sm flex items-center gap-1">
            {getDaysAgoLabel(quote?.last_edited_time)}
            <span className="text-xs text-grey-normal">
              Last edit | {formatFullDate(quote?.last_edited_time)}
            </span>
          </p>
        </div>
        <div className="flex gap-4 h-full">
          <div className="flex flex-col justify-between gap-2 h-full">
            {hasBeenReviewed ? (
              <div className="border border-primaryN30 rounded-2xl flex flex-col items-center justify-center py-3 w-48 px-4 ">
                <p className="text-sm">
                  {convertToCurrencyFormat(quote?.total_price, {
                    noDecimals: true,
                  })}
                </p>
                <p className="text-xs text-grey-normal w-fit">Current Price</p>
              </div>
            ) : (
              <div className="border border-primaryN30 rounded-2xl flex justify-center gap-3 py-3 w-48 px-4 ">
                <p className="text-sm text-grey-normal w-fit">Price</p>
                <div className="w-4/6">
                  <p className="text-sm">
                    {convertToCurrencyFormat(quote?.total_price, {
                      noDecimals: true,
                    })}
                  </p>
                  <p className="text-xs text-grey-normal">
                    {formatPriceRange(quote.total_price_range, {
                      withSymbol: true,
                      noDecimals: true,
                    })}
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-1 w-full">
              <div className="border w-4/5 border-primaryN30 rounded-xl flex items-center justify-evenly text-sm h-full ">
                <div className="flex flex-col gap-1 items-center justify-center py-2 w-1/2">
                  <p>{quote?.items_count}</p>
                  <p className="text-xs text-grey-normal"># items</p>
                </div>
                <Divider type="vertical" className="w-1 h-full m-0" />
                <div className="flex flex-col gap-1 items-center justify-center w-1/2">
                  <p>{quote?.products_count}</p>
                  <p className="text-xs text-grey-normal">Products</p>
                </div>
              </div>
              <div
                className={`border w-1/5 relative border-primaryN30 rounded-lg flex flex-col gap-2 items-center justify-center text-sm h-full ${
                  hasFiles
                    ? "opacity-100 cursor-pointer hover:bg-primaryN20"
                    : "opacity-60 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (hasFiles) {
                    handleModalChange("files", true);
                  }
                }}
              >
                <Image
                  src="/assets/icons/files-search.svg"
                  alt="files icon"
                  width={14}
                  height={14}
                />
                <p className="text-xs text-grey-normal">Files</p>
                {Boolean(quote?.new_file_count) && (
                  <div className="absolute bg-accentIndigo rounded-full h-4 w-4 text-xs flex items-center justify-center text-white text-center -top-2 -right-1/4">
                    {quote?.new_file_count}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="h-full">
            <TextArea
              className="rounded-2xl w-80 py-2 px-4 scrollbar-hidden text-xs"
              placeholder="Personal Notes"
              style={{ height: "100%", resize: "none" }}
              defaultValue={quote?.personal_notes}
              onClickCapture={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onBlur={(e) => {
                updateQuotePersonalNotes(quote?.quote_id, e.target.value);
              }}
            />
          </div>
        </div>
        <div className="h-full flex items-center justify-center w-1/6 pl-4">
          <div className="gap-4 flex flex-col items-center justify-center w-fit">
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              {isReadyToAccept ? (
                <Button
                  backgroundColor="accentBananas"
                  color="primaryN900"
                  onClick={handleAcceptQuote}
                  disabled={loadingAccept}
                >
                  {loadingAccept ? <Spin /> : "Start Review"}
                </Button>
              ) : (
                quote?.quote_status_text === "Latii Review" && (
                  <Button
                    variant="outline"
                    onClick={() => handleModalChange("sendToLatii", true)}
                  >
                    Send Request
                  </Button>
                )
              )}
            </div>

            <div className="flex justify-around w-full">
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Popover content={<p>Duplicate</p>}>
                  <Popconfirm
                    title="Are you sure you want to duplicate this quote?"
                    onConfirm={handleDuplicate}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Image
                      src="/assets/icons/duplicate.svg"
                      alt="duplicate icon"
                      width={22}
                      height={22}
                      style={{ width: "auto", height: "auto" }}
                    />
                  </Popconfirm>
                </Popover>
              </div>
              {isDraft && (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Popover content={<p>Delete</p>}>
                    <Popconfirm
                      title="Are you sure you want to delete this quote?"
                      onConfirm={confirmDelete}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Image
                        src="/assets/icons/delete.svg"
                        alt="delete icon"
                        width={22}
                        height={22}
                        style={{ width: "auto", height: "auto" }}
                      />
                    </Popconfirm>
                  </Popover>
                </div>
              )}
              <Popover
                content={<p className="opacity-30 cursor-not-allowed">View</p>}
              >
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Image
                    src="/assets/icons/eye.svg"
                    alt="view icon"
                    width={22}
                    height={22}
                    style={{ width: "auto", height: "auto" }}
                    className="opacity-30 cursor-not-allowed"
                  />
                </div>
              </Popover>
              {!isArchived && (
                <Popover
                  content={
                    <p className="opacity-30 cursor-not-allowed">Download</p>
                  }
                >
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Image
                      src="/assets/icons/download.svg"
                      alt="download icon"
                      width={22}
                      height={22}
                      style={{ width: "auto", height: "auto" }}
                      className="opacity-30 cursor-not-allowed"
                    />
                  </div>
                </Popover>
              )}
              {!isArchived && (
                <Popover content={null}>
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Image
                      src="/assets/icons/account-rounded-gray.svg"
                      alt="account icon"
                      width={22}
                      height={22}
                      style={{ width: "auto", height: "auto" }}
                      className="opacity-30 cursor-not-allowed"
                    />
                  </div>
                </Popover>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col h-full justify-between">
          <Image
            src={`/assets/icons/${isPinned ? "pin-filled" : "pin"}.svg`}
            alt="pin icon"
            width={18}
            height={18}
            onClickCapture={(e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePin();
            }}
            className="cursor-pointer"
          />
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Popover content="Archive" placement="left">
              <Popconfirm
                title="Are you sure you want to archive this quote?"
                onConfirm={handleArchive}
                okText="Yes"
                cancelText="No"
                placement="left"
              >
                <Image
                  src="/assets/icons/archive.svg"
                  alt="archive icon"
                  width={20}
                  height={20}
                  style={{ width: "auto", height: "auto" }}
                  className="cursor-pointer"
                />
              </Popconfirm>
            </Popover>
          </div>
        </div>
      </Link>
      <SendLatiiModal
        open={modals.sendToLatii}
        closeModal={() => handleModalChange("sendToLatii", false)}
        onSuccess={handleSendToLatii}
        quote={quote}
        showSummary={false}
        isSendRequest={quote?.quote_status_text === "Latii Review"}
      />
      <FilesModal
        open={modals.files}
        closeModal={() => handleModalChange("files", false)}
        quoteId={quote?.quote_id}
        refreshProject={() => refreshProject(projectId as string)}
      />

      {previewImage?.is_open && (
        <PdfPreviewModal
          pdfUrl={previewImage?.image_url}
          isOpen={previewImage?.is_open}
          onClose={() => handleClosePreview(quote?.quote_id)}
        />
      )}
    </div>
  );
};

export default QuotiiCard;
