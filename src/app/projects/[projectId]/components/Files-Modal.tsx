import dayjs from "dayjs";
import { getQuoteFileList, markFileAsRead } from "@/services/projectService";
import { Modal, Popover, Spin } from "antd";
import Image from "next/image";
import { useEffect, useState } from "react";
import PdfPreviewModal from "./Pdf-Preview-Modal";
import ImagePdfPreview from "./Image-Pdf-Preview";

type FilesModalProps = {
  open: boolean;
  closeModal: () => void;
  quoteId: string;
  refreshProject: any;
};
type PreviewData = {
  url: string | null;
  isOpen: boolean;
  type: "pdf" | "image" | null;
};

const FilesModal = ({
  open,
  closeModal,
  quoteId,
  refreshProject,
}: FilesModalProps) => {
  const [files, setFiles] = useState<any[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<PreviewData>({
    url: null,
    isOpen: false,
    type: null,
  });

  useEffect(() => {
    if (!quoteId || Boolean(files?.length) || !open || error) return;

    const fetchFiles = async () => {
      try {
        const response: any = await getQuoteFileList(quoteId);
        setFiles(response);

        const hasNewFiles = response?.some((file: any) => file.is_new);
        if (!hasNewFiles) return;

        await markFileAsRead(response.map((file: any) => file.id));
        refreshProject();
      } catch (err) {
        setError(true);
        console.error("Error fetching files:", err);
      }
    };

    fetchFiles();
  }, [open, quoteId, files?.length, error]);

  const handleDownload = (url: string, filename = "file") => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (url: string, type: "pdf" | "image") => {
    setPreviewData({
      url,
      isOpen: true,
      type: type,
    });
  };

  const closePreview = () => {
    setPreviewData({
      url: null,
      isOpen: false,
      type: null,
    });
  };

  return (
    <Modal
      open={open}
      onCancel={closeModal}
      okButtonProps={{ className: "hidden" }}
      cancelText="Close"
    >
      <div className="flex flex-col gap-3 items-center">
        <div className="self-start">
          <p className="text-primaryN900 font-semibold">Files Shared</p>
          <p className="text-grey-normal text-sm">
            See all files you have shared wit Latii
          </p>
        </div>

        <div className="flex flex-col gap-8 w-[385px] h-[450px] overflow-auto scrollbar-hidden">
          {Boolean(files?.length) ? (
            files?.map((file: any, index: number) => {
              const isPdf = file.ext_name === "pdf";
              const isImage =
                file.ext_name === "jpg" || file.ext_name === "png";
              const showPreview = isPdf || isImage;
              return (
                <div key={index} className="flex gap-4 items-center w-full">
                  <div className="flex gap-2 items-start w-full">
                    <Image
                      src={`/assets/icons/extensions/${file.ext_name}.svg`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "/assets/icons/extensions/undefined.svg";
                      }}
                      alt="file icon"
                      width={52}
                      height={52}
                      className="w-9 h-9"
                    />
                    <div className="truncate w-9/12 flex flex-col">
                      <div className="flex items-center gap-2">
                        <p className="text-sm truncate">
                          {file.file_name}.{file.ext_name}
                        </p>
                        {file?.is_new && (
                          <div className="w-2 h-2 rounded-full bg-accentIndigo" />
                        )}
                      </div>
                      <p className="text-xs text-grey-normal font-light">
                        In Version {file.version}
                      </p>
                      <p className="text-basicLightGray font-light text-xs">
                        Send {dayjs(file.create_time).format("DD/MM/YY")}
                      </p>
                    </div>
                    <div className="flex items-center w-2/12 justify-around">
                      {showPreview && (
                        <Image
                          src="/assets/icons/eye.svg"
                          alt="eye icon"
                          width={52}
                          height={52}
                          className="w-5 h-5 cursor-pointer opacity-60 hover:opacity-100"
                          onClick={() =>
                            handlePreview(
                              file.file_url,
                              isPdf ? "pdf" : "image",
                            )
                          }
                        />
                      )}

                      <Image
                        src="/assets/icons/download.svg"
                        alt="download icon"
                        width={52}
                        height={52}
                        className="w-5 h-5 cursor-pointer opacity-60 hover:opacity-100"
                        onClick={() =>
                          handleDownload(file.file_url, file.file_name)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : error ? (
            <div>
              Error loading Files. Please check the console for more
              information.
            </div>
          ) : (
            <div className="flex gap-3 justify-center py-6">
              <Spin />
              Loading Files
            </div>
          )}
        </div>
      </div>
      {previewData.isOpen && previewData.url && (
        <ImagePdfPreview
          open={previewData.isOpen}
          onClose={closePreview}
          isPdf={previewData.type === "pdf"}
          fileUrl={previewData.url}
        />
      )}
    </Modal>
  );
};

export default FilesModal;
