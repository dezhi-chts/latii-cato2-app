import Button from "@/components/Button";
import { Upload, Tag, Tooltip } from "antd";
import { UploadFile } from "antd/lib/upload/interface";

type CustomUploadProps = {
  fileList: UploadFile[];
  setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  showSummary?: boolean;
};
export default function CustomUpload({
  fileList,
  setFileList,
  showSummary,
}: CustomUploadProps) {
  const handleChange = ({
    file,
    fileList: newFileList,
  }: {
    file: UploadFile;
    fileList: UploadFile[];
  }) => {
    const filtered = newFileList.filter(
      (f, index, self) =>
        index === self.findIndex((t) => t.name === f.name && t.size === f.size)
    );
    setFileList(filtered);
  };

  return (
    <div className="w-full">
      <Upload
        multiple
        fileList={fileList}
        onChange={handleChange}
        beforeUpload={() => false}
        className="w-full"
        showUploadList={false}
      >
        <div
          className={`flex items-center justify-center  border ${
            showSummary ? "py-4 w-[500px]" : "py-6 w-[340px]"
          } border-primaryN50 rounded-xl border-dashed cursor-pointer hover:border-kahuBlue`}
        >
          {showSummary ? (
            <p className="text-xs">
              Drop or{" "}
              <span className="text-kahuBlue underline">Choose files</span> to
              upload
            </p>
          ) : (
            <Button variant="outline" className="w-28">
              Add Files
            </Button>
          )}
        </div>
      </Upload>
      <div className="flex flex-wrap gap-2 mt-2 max-w-full max-h-10 overflow-auto scrollbar-hidden">
        {fileList.map((file) => (
          <Tooltip key={file.uid} title={file.name}>
            <Tag
              closable
              onClose={() => {
                setFileList(fileList.filter((f) => f.uid !== file.uid));
              }}
            >
              {file.name.length > 15
                ? file.name.slice(0, 12) + "..."
                : file.name}
            </Tag>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
