import { Image } from "antd";
import { useState } from "react";
import axios from "axios";

export default function PdfPreview() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handlePreview = async () => {
    if (!previewImage) {
      const response = await axios.get("/api/pdf-preview", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      setPreviewImage(url);
    }
    setPreviewVisible(true);
  };

  return (
    <>
      <Image
        src="/assets/images/pdf-preview.png"
        alt="Image placeholder"
        width={100}
        height={126}
        className="rounded-xl cursor-pointer"
        preview={{
          visible: previewVisible,
          src: previewImage || "",
          onVisibleChange: (vis) => setPreviewVisible(vis),
        }}
        onClick={handlePreview}
      />
    </>
  );
}
