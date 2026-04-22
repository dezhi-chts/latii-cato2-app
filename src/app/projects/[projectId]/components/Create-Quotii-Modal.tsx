import Button from "@/components/Button";
import { ArchitecturalDrawingPopover } from "@/components/coming-soon-popovers/Popovers";
import { Modal, Popover, Spin, Upload } from "antd";
import Image from "next/image";
import { useState } from "react";

type CreateQuotiiModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onBlankTemplateClick: () => void;
  handleFileUpload: (file: File) => void;
  loadingAiQuote: boolean;
  loadingCreateQuotii: boolean;
};

const CreateQuotiiModal = ({
  isOpen,
  setIsOpen,
  onBlankTemplateClick,
  handleFileUpload,
  loadingAiQuote,
  loadingCreateQuotii,
}: CreateQuotiiModalProps) => {
  const [file, setFile] = useState<File | null>(null);

  return (
    <Modal
      open={isOpen}
      onCancel={() => setIsOpen(false)}
      title={
        <div className="flex flex-col mb-10 zoomed-container">
          <p className="text-primaryN900 font-bold text-sm">New Quotii</p>
          <p className="text-grey-normal text-xs font-normal">
            Create your Quotii using a blank template or our AI agent: CATO.
          </p>
        </div>
      }
      width={920}
      footer={null}
      centered
      closeIcon={null}
    >
      <div className="w-full flex gap-10 my-4 justify-center zoomed-container !h-80">
        <div
          className={`border-primaryN30 border rounded-xl h-full w-4/12 flex flex-col gap-4 items-center justify-center cursor-default shadow-md ${
            !loadingAiQuote && "hover:bg-primaryN10"
          }`}
        >
          <Image
            src="/assets/icons/blank_template.svg"
            alt="blank template icon"
            width={40}
            height={40}
            style={{ width: "auto", height: "auto" }}
          />
          <div className="text-center">
            <p className="text-primaryN900 font-bold">Blank Template</p>
            <p className="text-sm text-black">Create a Blank Latii Form</p>
          </div>

          <Button
            disabled={loadingAiQuote || loadingCreateQuotii}
            className="mt-4 text-sm w-24"
            onClick={onBlankTemplateClick}
          >
            {loadingCreateQuotii ? <Spin /> : "Generate"}
          </Button>
        </div>

        <div
          className={`border-primaryN30 border rounded-xl h-full w-5/12 flex flex-col gap-6 items-center justify-center shadow-md ${
            !loadingAiQuote && "hover:bg-primaryN10"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/assets/icons/cato-quote.svg"
              alt="ai quote icon"
              width={40}
              height={40}
              style={{ width: "auto", height: "auto" }}
            />
            <div className="text-center">
              <p className="text-primaryN900 font-bold">
                CATO for Product Quote
              </p>
              <p className="text-sm text-center px-4">
                Drop a Product List for our AI
              </p>
            </div>
          </div>
          {loadingAiQuote ? (
            <div className="py-4  flex flex-col gap-2 items-center justify-center border border-transparent rounded-xl border-dashed">
              <div className="flex items-center gap-2">
                <p className="animate-pulse">Processing file...</p>
              </div>
              <p className="text-xxs">This may take a few seconds.</p>
            </div>
          ) : !file ? (
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                setFile(file);
                return false;
              }}
              accept=".pdf"
            >
              <div className="py-4 w-60 cursor-pointer flex flex-col gap-2 items-center justify-center border border-primaryN50 rounded-xl border-dashed hover:border-kahuBlue font-light">
                <p>
                  Drop or{" "}
                  <span className="text-kahuBlue underline hover:opacity-80 transition-all duration-150">
                    Choose file
                  </span>{" "}
                  to upload
                </p>
                <p className="text-xxs text-primaryN200">Accepts .PDF</p>
              </div>
            </Upload>
          ) : (
            <div className="py-4 w-60 cursor-default flex flex-col gap-2 items-center justify-center border border-primaryN50 rounded-xl border-dashed font-light text-center px-8 bg-white">
              <p>File uploaded correctly</p>
              <p className="max-w-48 truncate">{file?.name}</p>
            </div>
          )}
          <Button
            disabled={!file || loadingAiQuote || loadingCreateQuotii}
            onClick={() => {
              if (!file) return;
              handleFileUpload(file);
            }}
            className="w-24"
          >
            {loadingAiQuote ? <Spin /> : "Generate"}
          </Button>
          {/* <p className="text-kahuBlue text-xs">
            Not sure what to drop? See examples.
          </p> */}
        </div>
        <Popover content={<ArchitecturalDrawingPopover />} placement="left">
          <div
            className={`border-primaryN30 border rounded-xl h-full w-5/12 flex flex-col gap-2 items-center justify-center cursor-not-allowed shadow-md opacity-30`}
          >
            <div className="flex flex-col items-center gap-3">
              <Image
                src="/assets/icons/cato-quote.svg"
                alt="ai quote icon"
                width={40}
                height={40}
                style={{ width: "auto", height: "auto" }}
              />
              <div className="text-center">
                <p className="text-primaryN900 font-bold">
                  CATO for Architectural Drawing
                </p>
                <p className="text-sm text-center px-4">
                  Drop an Architectural set of plans for our AI
                </p>
                <p className="text-kahuBlue text-sm">Not sure what to drop?</p>
              </div>
            </div>
            <Upload
              disabled
              showUploadList={false}
              beforeUpload={(file) => {
                setFile(file);
                return false;
              }}
              accept=".pdf"
            >
              <div className="py-4 w-60 flex flex-col gap-2 items-center justify-center border border-primaryN50 rounded-xl border-dashed font-light">
                <p>
                  Drop or{" "}
                  <span className="text-kahuBlue underline  transition-all duration-150">
                    Choose file
                  </span>{" "}
                  to upload
                </p>
                <p className="text-xxs text-primaryN200">Accepts .PDF</p>
              </div>
            </Upload>
            <Button variant="outline" className="pointer-events-none">
              Generate
            </Button>
          </div>
        </Popover>
      </div>
    </Modal>
  );
};

export default CreateQuotiiModal;
