import { Modal } from "antd";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

type PdfPreviewModalProps = {
  pdfUrl?: string;
  isOpen?: boolean;
  onClose: () => void;
};
const PdfPreviewModal = ({ pdfUrl, isOpen, onClose }: PdfPreviewModalProps) => {
  const defaultLayout = defaultLayoutPlugin();
  return (
    <Modal open={isOpen} onCancel={onClose} footer={null} centered width={750}>
      <Worker
        workerUrl={`https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`}
      >
        {pdfUrl && <Viewer fileUrl={pdfUrl} plugins={[defaultLayout]} />}
      </Worker>
    </Modal>
  );
};

export default PdfPreviewModal;
