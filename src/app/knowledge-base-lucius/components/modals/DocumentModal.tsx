import { Input, Modal, Upload } from "antd";
import Title from "./Title";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import Image from "next/image";
import { ModalsFooter } from "./ModalsFooter";
import ImagePdfPreview from "@/app/projects/[projectId]/components/Image-Pdf-Preview";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import PdfPreviewModal from "@/app/projects/[projectId]/components/Pdf-Preview-Modal";

const DocumentModal = ({ isModalOpen, setIsModalOpen, data }: any) => {
  const [settings, setSettings] = useState<any>({
    name: data?.label || "",
    file: "",
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev: any) => ({
      ...prev,
      name: e.target.value,
    }));
  };

  const handleFileChange = (info?: any) => {
    if (!info) {
      setSettings((prev: any) => ({
        ...prev,
        file: undefined,
      }));
      return;
    }
    const latestFile = info.fileList[info.fileList.length - 1];
    setSettings((prev: any) => ({
      ...prev,
      file: latestFile,
    }));
  };

  return (
    <Modal
      width={500}
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      footer={
        <ModalsFooter
          disabled={!settings.name || !settings.file}
          onCancel={() => setIsModalOpen(false)}
          hasData={data}
        />
      }
      title={
        <Title
          title="Upload New Document"
          subtitle="Add documents that will give the CATO information for your Take Offs."
        />
      }
    >
      <div className="w-[450px] flex flex-col gap-3 pt-4">
        <p className="text-xs font-light">
          Name{" "}
          <span className="text-basicGray">
            (Use this to identify the file)
          </span>
        </p>
        <Input
          placeholder="Name"
          className="mb-4"
          onChange={handleNameChange}
          disabled={data}
          value={settings.name}
        />

        {data ? (
          <div className="flex gap-1 items-center text-xs font-light">
            <Image
              src={`/assets/icons/extensions/${data.extension}.svg`}
              alt={`${data.extension} icon`}
              width={16}
              height={16}
              className="h-4 w-4"
            />
            <p className="truncate">
              {data.label}.{data.extension}
            </p>
          </div>
        ) : (
          <Upload
            beforeUpload={() => false}
            onChange={handleFileChange}
            showUploadList={false}
            disabled={settings.file}
          >
            <div
              className={`w-[450px] h-60 rounded-lg flex gap-1 items-center justify-center flex-col ${
                !settings.file &&
                "hover:border-blue-500 cursor-pointer border border-dashed border-basicLightGray h-40"
              }`}
            >
              {settings.file ? (
                <FilePreview file={settings.file} />
              ) : (
                <>
                  <p className="text-forumBlue underline text-xs">Upload</p>
                  <p className="text-basicGray text-xxs">Drop a File.</p>
                </>
              )}
            </div>
          </Upload>
        )}
      </div>
    </Modal>
  );
};

export default DocumentModal;

const DeleteIcon = ({ handleDeleteFile }: any) => {
  return (
    <div
      className="text-basicLightGray hover:text-accentRed transition-colors duration-200 h-2 cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDeleteFile();
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 22 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0.5" width="21" height="21" rx="4" fill="none" />
        <path
          d="M4 6.125H18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.875 6.125L5.75 16.625C5.75 17.0891 5.93437 17.5342 6.26257 17.8624C6.59075 18.1906 7.03587 18.375 7.5 18.375H14.5C14.9641 18.375 15.4092 18.1906 15.7374 17.8624C16.0656 17.5342 16.25 17.0891 16.25 16.625L17.125 6.125"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.375 6.125V3.5C8.375 3.26793 8.46719 3.04538 8.63128 2.88128C8.79538 2.71719 9.01793 2.625 9.25 2.625H12.75C12.982 2.625 13.2046 2.71719 13.3687 2.88128C13.5328 3.04538 13.625 3.26793 13.625 3.5V6.125"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.25 10.5L12.75 14M12.75 10.5L9.25 14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const FilePreview = ({ file, handleDeleteFile }: any) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  useEffect(() => {
    if (file?.originFileObj) {
      const url = URL.createObjectURL(file.originFileObj);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);
  if (!previewUrl) return null;
  return (
    <div className="border border-primaryN30 rounded-lg flex flex-col w-52 overflow-hidden max-h-60 cursor-default ">
      <div className="flex gap-2 border-b items-center border-b-primaryN30 px-2">
        <p className="truncate text-basicLightGray text-xxs">
          {file?.name || "File Name"}
        </p>
        <div className="flex gap-3 py-1 px-2.5">
          <Image
            src="/assets/icons/preview.svg"
            alt="preview icon"
            width={17}
            height={17}
            className="cursor-pointer hover:opacity-80"
            onClick={() => setIsModalOpen(true)}
          />
          <DeleteIcon handleDeleteFile={handleDeleteFile} />
        </div>
      </div>
      <div className="max-h-40 flex justify-center">
        <Worker
          workerUrl={`https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`}
        >
          <Viewer fileUrl={previewUrl} />
        </Worker>
      </div>
      <PdfPreviewModal
        pdfUrl={previewUrl}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
