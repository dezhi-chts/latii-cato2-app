import { Upload } from "antd";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import RequiredHint from "./RequiredHint";

type UploadFilesProps = {
  name: string;
  required?: boolean;
  hint_text?: string;
  fileList?: UploadFile[];
  onChange?: (fileList: UploadFile[]) => void;
};

const UploadFiles = ({
  name,
  required = false,
  hint_text = "",
  fileList,
  onChange,
}: UploadFilesProps) => {
  const handleChange: UploadProps["onChange"] = (info) => {
    onChange?.(info.fileList);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>
      <div className="w-full max-w-80 h-14 flex justify-center items-center rounded-xl cursor-pointer border border-dashed border-grey-dark hover:border-forumBlue-normal hover:text-forumBlue-normal">
        <Upload fileList={fileList} onChange={handleChange} showUploadList>
          {hint_text}
        </Upload>
      </div>
    </div>
  );
};

export default UploadFiles;
