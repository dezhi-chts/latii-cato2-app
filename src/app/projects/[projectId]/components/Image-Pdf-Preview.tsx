import React, { useState } from "react";
import { Modal, Spin } from "antd";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import Image from "next/image";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

// THIS COMPONENT IS STILL NOT BEING USED. ITS HERE IN CASE WE NEED IT LATER.

type Props = {
  open: boolean;
  onClose: () => void;
  isPdf: boolean;
  fileUrl: string;
};

const ImagePdfPreview: React.FC<Props> = ({
  open,
  onClose,
  isPdf,
  fileUrl,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const defaultLayout = defaultLayoutPlugin();
  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      footer={null}
      width={isPdf ? 750 : imageLoaded ? "fit-content" : "30%"}
      styles={{
        body: { padding: 0, display: "flex", justifyContent: "center" },
      }}
      destroyOnHidden
    >
      {isPdf ? (
        <Worker
          workerUrl={`https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`}
        >
          {fileUrl && <Viewer fileUrl={fileUrl} plugins={[defaultLayout]} />}
        </Worker>
      ) : (
        <>
          <div className={imageLoaded ? "hidden" : ""}>
            <Spin size="large" />
          </div>
          <Image
            src={fileUrl}
            alt="Preview"
            style={{
              objectFit: "contain",
              maxHeight: "80vh",
              width: "auto",
              height: "auto",
            }}
            className={imageLoaded ? "opacity-100" : "opacity-0"}
            height={800}
            width={600}
            onLoad={() => setImageLoaded(true)}
          />
        </>
      )}
    </Modal>
  );
};

export default ImagePdfPreview;
