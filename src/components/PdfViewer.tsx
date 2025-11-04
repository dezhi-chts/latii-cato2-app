"use client";

const PdfViewer = ({ pdfUrl }: { pdfUrl: string }) => {
  const googleViewer = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
    pdfUrl
  )}`;

  return (
    <div className="w-full h-full border rounded overflow-hidden">
      <iframe
        src={googleViewer}
        title="PDF Viewer"
        className="w-full h-full bg-blue-300"
      />
    </div>
  );
};

export default PdfViewer;
