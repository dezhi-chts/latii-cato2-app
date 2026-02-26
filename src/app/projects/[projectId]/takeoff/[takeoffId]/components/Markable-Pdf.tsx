import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import { Popconfirm, Spin } from "antd";
import {
  changeEvidenceType,
  deleteEvidenceById,
  saveEvidence,
} from "@/services/evidenceService";
import { base64ToFile } from "@/lib/functions";
import { Adding } from "../page";
import Image from "next/image";
import Button from "@/components/Button";

type Selection = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PdfSelectorProps = {
  pdfUrl: string;
  projectId?: number | string;
  projectFileId?: string;
  adding: Adding;
  zoom: number;
  page: number;
  evidences: any;
  refreshEvidences: () => void;
};

const PDFSelector = forwardRef(
  (
    {
      pdfUrl,
      projectId,
      projectFileId,
      adding,
      zoom,
      page,
      evidences,
      refreshEvidences,
    }: PdfSelectorProps,
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(
      null,
    );
    const [selection, setSelection] = useState<Selection | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [sendingEvidence, setSendingEvidence] = useState(false);
    const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const color = adding.type === "Item" ? "#427CCE" : "#5856D7";
    // Cargar PDF
    useEffect(() => {
      const loadPdf = async () => {
        setIsLoading(true);
        try {
          if (!pdfUrl) return;
          // Usar objeto con url
          const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
          const pdf = await loadingTask.promise;
          setPdfDoc(pdf);
        } catch (error) {
          console.error("Error cargando PDF:", error);
        }
        setIsLoading(false);
      };
      loadPdf();
    }, [pdfUrl]);

    const getPageAmount = () => {
      if (!pdfDoc) return 0;
      return pdfDoc.numPages;
    };

    // Renderizar primera página
    useEffect(() => {
      const renderPage = async () => {
        if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

        const pdfPage = await pdfDoc.getPage(page);

        // Obtener ancho del contenedor
        const containerWidth = containerRef.current.clientWidth;

        // Escala base para fit al ancho del contenedor
        const viewportOriginal = pdfPage.getViewport({ scale: 1 });
        const baseScale = containerWidth / viewportOriginal.width;

        // Aplicar zoom sobre el scale base
        const viewport = pdfPage.getViewport({ scale: baseScale * zoom });

        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d")!;
        await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      };

      renderPage();
    }, [pdfDoc, page, zoom]);

    const handleMouseDown = (e: React.MouseEvent) => {
      if (!adding.isAdding) return;
      if (!canvasRef.current) return;
      setIsSelecting(true);
      const rect = canvasRef.current.getBoundingClientRect();
      startPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setSelection({
        x: startPos.current.x,
        y: startPos.current.y,
        width: 0,
        height: 0,
      });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isSelecting || !selection || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      setSelection({
        x: Math.min(startPos.current.x, currentX),
        y: Math.min(startPos.current.y, currentY),
        width: Math.abs(currentX - startPos.current.x),
        height: Math.abs(currentY - startPos.current.y),
      });
    };

    const handleMouseUp = () => {
      setIsSelecting(false);
    };

    const handleSend = async () => {
      if (!selection || !canvasRef.current) return;
      const canvas = canvasRef.current;

      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = selection.width;
      croppedCanvas.height = selection.height;
      const ctx = croppedCanvas.getContext("2d")!;
      ctx.drawImage(
        canvas,
        selection.x,
        selection.y,
        selection.width,
        selection.height,
        0,
        0,
        selection.width,
        selection.height,
      );

      const image = croppedCanvas.toDataURL("image/png");

      const points = [
        { x: selection.x, y: selection.y + selection.height }, // bottom-left
        { x: selection.x, y: selection.y }, // top-left
        { x: selection.x + selection.width, y: selection.y }, // top-right
        { x: selection.x + selection.width, y: selection.y + selection.height },
      ];

      const formData = new FormData();
      const dpr =
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const newType = `{'name': '${adding.type}'}`;

      formData.append("project_id", projectId as string);
      formData.append("project_job_id", "0");
      formData.append("project_file_id", projectFileId as string);
      formData.append("project_file_page_number", page.toString());
      formData.append("polygon", JSON.stringify(points));
      formData.append("sub_text", "");
      formData.append("is_manual", "true");
      formData.append("device_pixel_ratio", dpr.toString());
      formData.append("type", newType);
      formData.append("scale", zoom.toString());
      formData.append("file", base64ToFile(image, "image.png"));

      setSendingEvidence(true);
      const response = await saveEvidence(formData);
      if (response.status === "success") {
        refreshEvidences();
        setSelection(null);
      }
      setSendingEvidence(false);
    };

    useImperativeHandle(ref, () => ({
      handleSend,
      getPageAmount,
    }));

    const handleDeleteEvidence = async (evidenceId: string) => {
      const response = await deleteEvidenceById(evidenceId);
      if (response.status === "success") {
        refreshEvidences();
      }
    };

    const handleChangeEvidenceType = async (
      evidenceId: string,
      type: "Item" | "Table",
    ) => {
      const response = await changeEvidenceType(evidenceId, type);
      if (response.status === "success") {
        refreshEvidences();
      }
    };

    return (
      <div className="flex flex-col gap-4 pt-4 pr-14">
        {isLoading ? (
          <Spin />
        ) : (
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: "70vh",
              position: "relative",
              overflow: "auto",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                border: "1px solid #ccc",
                cursor: `${adding.isAdding ? "crosshair" : "default"}`,
                display: "block",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />

            {selection && (
              <div
                style={{
                  position: "absolute",
                  left: selection.x,
                  top: selection.y,
                  width: selection.width,
                  height: selection.height,
                  border: `1px solid ${color}`,
                  backgroundColor: `${color}33`,
                  borderRadius: "4px",
                }}
              >
                <Button
                  backgroundColor="forumBlue-normal"
                  className="absolute -top-7"
                  onClick={() => handleSend()}
                  disabled={sendingEvidence}
                >
                  <p className="text-xs">
                    {sendingEvidence ? "Wait..." : "Confirm"}
                  </p>
                </Button>
              </div>
            )}
            {evidences &&
              evidences.map((evidence: any, index: number) => {
                const polygon = JSON.parse(evidence?.polygon);
                const selection = getSelectionFromPolygon(polygon);
                const type = parseType(evidence?.type);
                if (evidence?.project_file_page_number !== page) return null;
                if (!type) return null;
                const color = type?.name === "Item" ? "#427CCE" : "#5856D7";
                return (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      left: selection.left,
                      top: selection.top,
                      width: selection.width,
                      height: selection.height,
                      border: `1px solid ${color}`,
                      backgroundColor: `${color}33`,
                      borderRadius: "4px",
                      scale: zoom,
                      transformOrigin: "top left",
                    }}
                  >
                    <div className="flex items-center gap-2 absolute -top-7">
                      <div className="flex items-center text-center rounded-full bg-primaryN20 overflow-hidden cursor-pointer">
                        <p
                          className={`px-2 py-0.5 text-grey-normal text-xs ${
                            type.name === "Item"
                              ? "bg-primaryN30"
                              : "hover:bg-primaryN30 opacity-70 hover:opacity-100"
                          }`}
                          onClick={() => {
                            if (type.name === "Item") return;
                            handleChangeEvidenceType(evidence.id, "Item");
                          }}
                        >
                          Item
                        </p>
                        <p
                          className={`px-2 py-0.5 text-grey-normal text-xs ${
                            type.name === "Table"
                              ? "bg-primaryN30"
                              : "hover:bg-primaryN30 opacity-70 hover:opacity-100"
                          }`}
                          onClick={() => {
                            if (type.name === "Table") return;
                            handleChangeEvidenceType(evidence.id, "Table");
                          }}
                        >
                          Table
                        </p>
                      </div>
                      <Popconfirm
                        title="Are you sure you want to delete this evidence?"
                        onConfirm={() => handleDeleteEvidence(evidence.id)}
                      >
                        <div className="bg-primaryN20 rounded-lg px-1 cursor-pointer hover:bg-primaryN30">
                          <Image
                            src="/assets/icons/delete.svg"
                            alt="delete icon"
                            width={20}
                            height={20}
                          />
                        </div>
                      </Popconfirm>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  },
);

export default PDFSelector;

const getSelectionFromPolygon = (polygon: { x: number; y: number }[]) => {
  const xValues = polygon.map((p) => p.x);
  const yValues = polygon.map((p) => p.y);

  const left = Math.min(...xValues);
  const top = Math.min(...yValues);
  const width = Math.max(...xValues) - left;
  const height = Math.max(...yValues) - top;

  return { left, top, width, height };
};

const parseType = (data: string) => {
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    try {
      const fixed = data.replace(/'/g, '"');
      return JSON.parse(fixed);
    } catch {
      console.warn("Error parsing type:", data);
      return null;
    }
  }
};
