"use client";

import { Select } from "antd";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  pdfUrl: string;
  isPanelOpen: boolean;
  setIsPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

type PdfJs = typeof import("pdfjs-dist");
type PDFDocumentProxy =
  import("pdfjs-dist/types/src/display/api").PDFDocumentProxy;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
  return URL.createObjectURL(blob);
}

export default function PdfAsImagesViewer({
  pdfUrl,
  isPanelOpen = true,
  setIsPanelOpen,
  currentPage = 1,
  setCurrentPage,
}: Props) {
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const pdfjsRef = useRef<PdfJs | null>(null);

  const cacheRef = useRef<Map<string, string>>(new Map());

  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1); // 1 = 100%

  const [mainSrc, setMainSrc] = useState<string | null>(null);

  const baseScale = 1.8;
  const mainScale = useMemo(
    () => +(baseScale * zoom).toFixed(2),
    [baseScale, zoom],
  );
  const thumbScale = 0.25;

  useEffect(() => {
    return () => {
      for (const url of cacheRef.current.values()) URL.revokeObjectURL(url);
      cacheRef.current.clear();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjsRef.current = pdfjs;

      pdfjs.GlobalWorkerOptions.workerSrc =
        "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

      const loadingTask = pdfjs.getDocument(pdfUrl);
      const doc = await loadingTask.promise;

      if (cancelled) return;

      pdfRef.current = doc;
      setNumPages(doc.numPages);
      setCurrentPage(1);
    })().catch((err) => {
      console.error("PDF load error:", err);
    });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  const renderPageToImage = async (pageNumber: number, scale: number) => {
    const doc = pdfRef.current;
    if (!doc) return null;

    const key = `${pageNumber}-${scale}`;
    const cached = cacheRef.current.get(key);
    if (cached) return cached;

    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const url = await canvasToBlobUrl(canvas);
    cacheRef.current.set(key, url);
    return url;
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!numPages) return;

      const safePage = clamp(currentPage, 1, numPages);
      const src = await renderPageToImage(safePage, mainScale);
      if (!cancelled) setMainSrc(src);
    })().catch((err) => console.error("Render main page error:", err));

    return () => {
      cancelled = true;
    };
  }, [numPages, currentPage, mainScale]);

  const goPrev = () => setCurrentPage((p) => clamp(p - 1, 1, numPages || 1));
  const goNext = () => setCurrentPage((p) => clamp(p + 1, 1, numPages || 1));

  const [thumbSrcs, setThumbSrcs] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!numPages) return;

      const entries: Record<number, string> = {};
      for (let p = 1; p <= numPages; p++) {
        const src = await renderPageToImage(p, thumbScale);
        if (src) entries[p] = src;
      }
      if (!cancelled) setThumbSrcs(entries);
    })().catch((err) => console.error("Render thumbs error:", err));

    return () => {
      cancelled = true;
    };
  }, [numPages]);

  return (
    <div className="relative w-full">
      <div className="flex gap-4">
        <div className="rounded-md border border-primaryN30 px-4 py-1.5 flex justify-center items-center gap-4 w-fit">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentPage <= 1}
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
            onClick={goNext}
            disabled={currentPage === numPages}
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
          className={`${isPanelOpen ? "bg-primaryN30 border-forumBlue-normal" : "bg-primaryN20 hover:bg-primaryN30 border-transparent"} border rounded-md p-2 w-fit cursor-pointer transition-all duration-150`}
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
                setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))
              }
              disabled={zoom === 0.5}
              className="bg-primaryN20 enabled:hover:bg-primaryN50 disabled:opacity-50 h-6 w-7 rounded-l-full"
            >
              -{" "}
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(4, +(z + 0.1).toFixed(2)))}
              className="bg-primaryN20 enabled:hover:bg-primaryN50 disabled:opacity-50 h-6 w-7 rounded-r-full"
              disabled={zoom === 3}
            >
              +{" "}
            </button>
          </div>
          <Select
            value={`${Math.round(zoom * 100)}%`}
            onChange={(value) => {
              const numeric = parseFloat(value.replace("%", ""));
              if (!isNaN(numeric)) {
                setZoom(numeric / 100);
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

      <div
        className={`${isPanelOpen ? "max-w-[260px]" : "max-w-0"} fixed right-0 top-[110px] z-20 h-screen w-fit bg-white border-l shadow-xl overflow-auto transition-all duration-300`}
      >
        <div className="p-8">
          <div className="flex flex-col gap-3"></div>
          {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => {
            const active = p === currentPage;
            const src = thumbSrcs[p];

            return (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`w-full text-left rounded-md mb-4 p-4 bg-primaryN20 border ${active ? "border-forumBlue-normal" : "border-transparent"}`}
              >
                <div className="text-grey-normal text-xxs mb-1">{p}</div>

                <div
                  className={`border border-primaryN30 rounded-md overflow-hidden w-fit`}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={`thumb-${p}`}
                      className="block w-[200px] h-auto"
                    />
                  ) : (
                    <div className="w-[200px] h-[260px] animate-pulse bg-neutral-200" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 h-[80vh] w-full rounded border bg-neutral-100 flex items-center justify-center">
        {mainSrc ? (
          zoom <= 1 ? (
            <div className="w-full h-full overflow-hidden flex items-center justify-center p-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mainSrc}
                alt={`page-${currentPage}`}
                draggable={false}
                className="block max-w-full max-h-full object-contain"
                style={{
                  display: "block",
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full overflow-auto p-0">
              <div
                className="flex items-start justify-start"
                style={{ width: "fit-content", height: "fit-content" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mainSrc}
                  alt={`page-${currentPage}`}
                  draggable={false}
                  className="block"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    display: "block",
                    willChange: "transform",
                  }}
                />
              </div>
            </div>
          )
        ) : (
          <div className="w-[60%] h-[60%] animate-pulse bg-neutral-200 rounded" />
        )}
      </div>
    </div>
  );
}
