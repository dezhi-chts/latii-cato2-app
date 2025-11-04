import Button from "@/components/Button";
import { Divider, Input, Modal, Popconfirm, Spin, UploadFile } from "antd";
import { useEffect, useMemo, useState } from "react";
import CustomUpload from "./NewItemModal/Custom-Upload";
import { convertToCurrencyFormat } from "@/lib/functions";

type SendLatiiModalProps = {
  open: boolean;
  closeModal: () => void;
  onSuccess: (
    files?: UploadFile[],
    description?: string,
    title?: string
  ) => Promise<any>;
  quote: any;
  showSummary?: boolean;
  isSendRequest?: boolean;
};

type Settings = {
  title: string;
  description: string;
};

const SendLatiiModal = ({
  open,
  closeModal,
  onSuccess,
  quote,
  showSummary = true,
  isSendRequest = false,
}: SendLatiiModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [settings, setSettings] = useState<Settings>({
    title: "",
    description: "",
  });

  const isDraft = quote?.status === 100;

  function getUnpricedCount(quote: {
    items: { is_priced: boolean }[];
  }): number {
    const unpricedCount = quote?.items?.filter(
      (item) => !item.is_priced
    ).length;
    return unpricedCount;
  }

  const unpricedCount = useMemo(() => {
    if (!quote?.items) return 0;
    return getUnpricedCount(quote);
  }, [quote]);

  const handleOkClick = async (fileList: UploadFile[], settings: Settings) => {
    setLoading(true);
    const response = await onSuccess(
      fileList,
      settings.description,
      settings.title
    );
    if (response === "success") resetForm();
  };

  const resetForm = () => {
    setLoading(false);
    setFileList([]);
    setSettings({
      title: "",
      description: "",
    });
  };

  const changeField = (field: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (!quote) return null;

  return (
    <Modal
      width={showSummary ? 1100 : 400}
      open={open}
      onCancel={closeModal}
      footer={null}
      centered
    >
      <div
        className={`${
          showSummary ? "p-12 pb-7 gap-10" : "px-12 py-6 gap-4"
        } flex flex-col zoomed-container`}
      >
        <div className="flex gap-10 items-start h-[300px] ">
          {showSummary && (
            <div className="w-full flex flex-col gap-9">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-primaryN900">
                  Summary of your Quotii
                </p>
                {unpricedCount === 0 ? (
                  <p className="py-1 px-4 text-accentGreen bg-accentGreen/5 font-light text-xs rounded-lg">
                    *All items were priced.
                  </p>
                ) : (
                  <p className="py-1 px-4 text-dragonOrange bg-dragonOrange/5 font-light text-xs rounded-lg">
                    {unpricedCount === 1
                      ? "1 item was"
                      : `${unpricedCount} items were`}{" "}
                    not priced. Latii team will review.
                  </p>
                )}
              </div>
              <div className="flex gap-10 items-center h-11">
                <p className="text-sm text-basicGray font-medium w-10">Items</p>
                <Divider type="vertical" className="h-full m-0 bg-primaryN30" />
                <div className="flex flex-col gap-1 text-xs">
                  <p>
                    {quote?.item_count}{" "}
                    <span className="text-basicGray">Item Cards</span>
                  </p>
                  <p>
                    {quote?.unit_count}{" "}
                    <span className="text-basicGray">Products</span>
                  </p>
                </div>
                <Divider type="vertical" className="h-full m-0 bg-primaryN30" />
                <div className="flex gap-4 items-center">
                  <div className="flex flex-col gap-1 w-14">
                    <p>{quote?.window_count}</p>
                    <p className="text-xs text-basicGray">Windows</p>
                  </div>
                  <div className="flex flex-col gap-1 w-14">
                    <p>{quote?.door_count}</p>
                    <p className="text-xs text-basicGray">Doors</p>
                  </div>
                  <div className="flex flex-col gap-1 w-14">
                    <p>{quote?.system_count}</p>
                    <p className="text-xs text-basicGray">Systems</p>
                  </div>
                </div>
              </div>
              <div className="h-28 flex gap-10">
                <p className="text-sm text-basicGray font-medium w-10">Price</p>
                <Divider type="vertical" className="h-full m-0 bg-primaryN30" />
                <div className="flex flex-col gap-4">
                  <div className="h-1/2 flex items-center gap-6">
                    {isDraft && (
                      <div className="flex flex-col gap-1 w-fit min-w-20">
                        <p className="text-kahuBlue">
                          {convertToCurrencyFormat(quote?.total_price)}
                        </p>
                        <p className="text-basicGray text-xs">
                          Estimated Price
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col gap-1 w-fit min-w-20">
                      <p className="text-kahuBlue">
                        {isDraft
                          ? `${convertToCurrencyFormat(
                              quote?.min_total_price
                            )} - ${convertToCurrencyFormat(
                              quote?.max_total_price
                            )}`
                          : convertToCurrencyFormat(quote?.total_price)}
                      </p>
                      <p className="text-basicGray text-xs">
                        Total Price {isDraft && "Range"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 w-20">
                      <p className="text-kahuBlue">
                        {convertToCurrencyFormat(quote?.price_sqft)}
                      </p>
                      <p className="text-basicGray text-xs">Total Price/sf</p>
                    </div>
                  </div>
                  <div className="h-1/2 flex items-center gap-6">
                    <div className="flex flex-col gap-1 min-w-20 w-fit">
                      <p>
                        {isDraft
                          ? `${convertToCurrencyFormat(
                              quote?.min_product_price
                            )} - ${convertToCurrencyFormat(
                              quote?.max_product_price
                            )}`
                          : convertToCurrencyFormat(quote?.product_price)}
                      </p>
                      <p className="text-basicGray text-xs">
                        Product Price {isDraft && "Range"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 w-20">
                      <p>{convertToCurrencyFormat(quote?.max_custom_fee)}</p>
                      <p className="text-basicGray text-xs">Max Tariff</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p>
                        {convertToCurrencyFormat(quote?.transportation_fee)}
                      </p>
                      <p className="text-basicGray text-xs">
                        Shipping & Packaging
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showSummary && (
            <Divider type="vertical" className="m-0 h-full bg-primaryN30" />
          )}
          <div
            className={` ${
              showSummary ? "w-[500px]" : "w-[340px]"
            } flex flex-col gap-4`}
          >
            {showSummary && (
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-primaryN900">
                  Additional Information
                </p>
                <p className="font-light text-xs">
                  If needed, please send additional documentation—this may
                  include images, text, PDFs, architectural plans, or other
                  drawings—for the team to add consider.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold">
                Title{" "}
                <span className="font-normal text-basicLightGray">
                  Optional
                </span>
              </p>
              <Input
                placeholder="Name your requisition, for example, Architect Drawing."
                className="w-full rounded-xl py-2"
                onChange={(e) => changeField("title", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <p className="text-xs font-semibold">
                {showSummary ? "Files" : "Add Additional File"}{" "}
                <span className="font-normal text-basicLightGray">
                  Optional
                </span>
              </p>
              <CustomUpload
                fileList={fileList}
                setFileList={setFileList}
                showSummary={showSummary}
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold">
                {!showSummary && "Add Additional "}Description{" "}
                <span className="font-normal text-basicLightGray">
                  Optional
                </span>
              </p>
              <Input
                placeholder="Additional Information"
                className="w-full rounded-xl py-2"
                onChange={(e) => changeField("description", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <Popconfirm
            title={`Are you sure you want to send this ${
              isSendRequest ? "request" : "quote"
            } to Latii?`}
            description={
              isSendRequest
                ? " The quote will be re-sent to Latii for review."
                : "The quote will become non-editable and will be submitted to Latii for review."
            }
            onConfirm={() => handleOkClick(fileList, settings)}
            placement="right"
            okText="Yes"
            cancelText="No"
            styles={{ root: { maxWidth: 420 } }}
          >
            {showSummary ? (
              <Button className="w-32" disabled={loading}>
                <p
                  className={`${loading && "w-full flex justify-center px-5"}`}
                >
                  {loading ? <Spin /> : "Send to Latii"}
                </p>
              </Button>
            ) : (
              <div className="w-full flex justify-end">
                <Button className="w-20" disabled={loading}>
                  <div
                    className={`${
                      loading && "w-full flex justify-center px-5"
                    }`}
                  >
                    {loading ? <Spin /> : "Send"}
                  </div>
                </Button>
              </div>
            )}
          </Popconfirm>
        </div>
      </div>
    </Modal>
  );
};

export default SendLatiiModal;
