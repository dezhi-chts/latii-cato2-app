"use client";

import dynamic from "next/dynamic";
import { Worker, ViewMode } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { thumbnailPlugin } from "@react-pdf-viewer/thumbnail";
import { useEffect, useState } from "react";
import Image from "next/image";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { Select } from "antd";

const Viewer = dynamic(
  () => import("@react-pdf-viewer/core").then((m) => m.Viewer),
  { ssr: false },
);

type PdfViewerProps = {
  pdfUrl: string;
  currentPage: number; // 1-based
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  isPanelOpen: boolean;
  setIsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function PdfViewer({
  pdfUrl,
  currentPage,
  setCurrentPage,
  isPanelOpen,
  setIsPanelOpen,
}: PdfViewerProps) {
  const pageNav = pageNavigationPlugin();
  const thumbs = thumbnailPlugin({ thumbnailWidth: 150 });
  const zoom = zoomPlugin();
  const { jumpToNextPage, jumpToPreviousPage, jumpToPage } = pageNav;
  const { Thumbnails } = thumbs;
  const { zoomTo } = zoom;

  const [maxPage, setMaxPage] = useState(1);
  const [pageZoom, setPageZoom] = useState(1);

  useEffect(() => {
    zoomTo(pageZoom);
  }, [pageZoom, zoomTo]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4">
        <div className="rounded-md border border-primaryN30 px-4 py-1.5 flex justify-center items-center gap-4 w-fit">
          <button
            onClick={jumpToPreviousPage}
            disabled={currentPage === 1}
            className="disabled:opacity-50"
          >
            <Image
              src="/assets/icons/arrow-left-gray.svg"
              alt="arrow back"
              width={8}
              height={8}
            />
          </button>

          <p className="text-grey-normal text-xxs">Page {currentPage}</p>

          <button
            onClick={jumpToNextPage}
            disabled={currentPage === maxPage}
            className="disabled:opacity-50"
          >
            <Image
              src="/assets/icons/arrow-right-gray.svg"
              alt="arrow back"
              width={8}
              height={8}
            />
          </button>
        </div>

        <div
          className={`${
            isPanelOpen
              ? "bg-primaryN30 border-forumBlue-normal"
              : "bg-primaryN20 hover:bg-primaryN30 border-transparent"
          }
          border rounded-md p-2 w-fit cursor-pointer transition-all duration-150`}
          onClick={() => setIsPanelOpen((prev) => !prev)}
        >
          <Image
            src="/assets/icons/open-panel.svg"
            alt="open panel icon"
            width={15}
            height={15}
          />
        </div>
        <div className="flex items-center text-grey-normal ml-auto gap-3">
          <div className="gap-0.5 flex">
            <button
              onClick={() =>
                setPageZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))
              }
              disabled={pageZoom === 0.5}
              className="bg-primaryN20 enabled:hover:bg-primaryN50 disabled:opacity-50 h-6 w-7 rounded-l-full"
            >
              -
            </button>
            <button
              onClick={() =>
                setPageZoom((z) => Math.min(4, +(z + 0.1).toFixed(2)))
              }
              className="bg-primaryN20 enabled:hover:bg-primaryN50 disabled:opacity-50 h-6 w-7 rounded-r-full"
              disabled={pageZoom === 3}
            >
              +
            </button>
          </div>

          <Select
            value={`${Math.round(pageZoom * 100)}%`}
            onChange={(value) => {
              const numeric = parseFloat(value.replace("%", ""));
              if (!isNaN(numeric)) {
                setPageZoom(numeric / 100);
              }
            }}
            options={[
              { value: "50%", label: "50%" },
              { value: "100%", label: "100%" },
              { value: "150%", label: "150%" },
              { value: "200%", label: "200%" },
              { value: "250%", label: "250%" },
              { value: "300%", label: "300%" },
            ]}
          />
        </div>
      </div>

      <div className="relative">
        <div
          className={`${isPanelOpen ? "max-w-[260px]" : "max-w-0"} fixed right-0 top-[110px] z-20 h-screen w-fit bg-white border-l shadow-xl overflow-auto transition-all duration-300`}
        >
          <div className="p-8">
            <Thumbnails
              renderThumbnailItem={(props) => {
                const isActive = props.pageIndex + 1 === currentPage;

                return (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(props.pageIndex + 1);
                      jumpToPage(props.pageIndex);
                    }}
                    className={`w-full text-left rounded-md mb-4 p-4 bg-primaryN20 border ${isActive ? "border-forumBlue-normal" : "border-transparent"}`}
                  >
                    <div className="text-grey-normal text-xxs mb-1">
                      {props.pageIndex + 1}
                    </div>

                    <div
                      className={`border border-primaryN30 rounded-md overflow-hidden w-fit`}
                    >
                      {props.renderPageThumbnail}
                    </div>
                  </button>
                );
              }}
            />
          </div>
        </div>

        <div className="h-[80vh] p-4 w-full overflow-hidden rounded border">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer
              fileUrl={pdfUrl}
              viewMode={ViewMode.SinglePage}
              plugins={[pageNav, thumbs, zoom]}
              onPageChange={(e) => setCurrentPage(e.currentPage + 1)}
              onDocumentLoad={(e) => setMaxPage(e.doc.numPages)}
              onZoom={(e) => {
                setPageZoom(e.scale);
              }}
            />
          </Worker>
        </div>
      </div>
    </div>
  );
}
