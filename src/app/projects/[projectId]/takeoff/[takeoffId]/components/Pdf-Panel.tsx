import { Viewer, Worker } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import Image from "next/image";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import { useEffect, useState } from "react";
import http from "@/lib/http";
import Link from "next/link";

type PdfPanelProps = {
  quoteId: String;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const PdfPanel = ({ quoteId, isOpen, setIsOpen }: PdfPanelProps) => {
  const eyeIcon = `/assets/icons/${isOpen ? "eye" : "eye-closed"}.svg`;
  const [pdfUrl, setPdfUrl] = useState<any>();
  const zoomPluginInstance = zoomPlugin();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    getPdfUrl();
  }, []);

  useEffect(() => {
    if (isOpen) {
      zoomPluginInstance.zoomTo(1);
      setScale(1);
    } else {
      zoomPluginInstance.zoomTo(0.3);
      setScale(0.3);
    }
  }, [isOpen]);

  const handleZoom = (method: "in" | "out") => {
    if (!isOpen) return;
    if (method === "in") {
      const newScale = Math.min(scale + 0.1, 2);
      zoomPluginInstance.zoomTo(newScale);
      setScale(newScale);
    } else {
      const newScale = Math.max(scale - 0.1, 0.3);
      zoomPluginInstance.zoomTo(newScale);
      setScale(newScale);
    }
  };

  const getPdfUrl = () => {
    let url = `/dealer/quote/view_pdf/${quoteId}`;
    http
      .get(url)
      .then((data: any) => {
        if (data.is_success) {
          setPdfUrl(data.data);
        }
      })
      .catch((error: any) => {
        console.error("Error fetching data:", error);
      });
  };

  return (
    <div
      className={`bg-white h-screen overflow-auto overflow-x-hidden scrollbar-hidden z-10 transition-all duration-500 py-28 ${
        isOpen ? "w-[700px]" : "w-[200px] px-0"
      } border-l border-primaryN30 shadow-sm absolute right-0 top-0 zoomed-container`}
    >
      <div className="flex justify-end px-10 gap-2 mb-4">
        {pdfUrl && (
          <Link href={pdfUrl} target="_blank">
            <Image
              src="/assets/icons/export.svg"
              alt="Export Icon"
              width={20}
              height={20}
              className="cursor-pointer opacity-80 hover:opacity-100"
            />
          </Link>
        )}
        <Image
          src={eyeIcon}
          alt="Eye Icon"
          width={20}
          height={20}
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer opacity-80 hover:opacity-100"
        />
      </div>
      {isOpen && (
        <div className="flex justify-end pr-10 pb-4 ">
          <div className=" text-xs flex items-center w-fit text-primaryN70">
            <button
              className="bg-primaryN30 rounded-l-full pl-4 pr-3 py-1 hover:bg-primaryN50 active:bg-primaryN70 hover:text-white transition-all duration-150"
              onClick={() => handleZoom("out")}
            >
              -
            </button>
            <button
              className="bg-primaryN30 rounded-r-full pr-4 pl-3 py-1 hover:bg-primaryN50 active:bg-primaryN70 hover:text-white transition-all duration-150"
              onClick={() => handleZoom("in")}
            >
              +
            </button>
          </div>
        </div>
      )}
      {pdfUrl && (
        <Worker
          workerUrl={`https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`}
        >
          <Viewer fileUrl={pdfUrl} plugins={[zoomPluginInstance]} />
        </Worker>
      )}
    </div>
  );
};

export default PdfPanel;
