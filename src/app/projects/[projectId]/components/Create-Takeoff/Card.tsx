"use client";
import Image from "next/image";
import { CatoUpload } from "./Cato-Upload";
import { ConfigProvider, Select, UploadFile } from "antd";
import { useEffect, useState } from "react";
import { CatoUploadFile, ValidCountryOfOrigin } from "@/services/filesService";

type CardProps = {
  files: UploadFile<any>[];
  setFiles: (files: UploadFile<any>[]) => void;
  filesInfo: CatoUploadFile[];
  setFilesInfo: (filesInfo: CatoUploadFile[]) => void;
  InfoModal: React.FC<{
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
  }>;
  imageUrl: string;
  title: string;
  description: string;
};

export const TakeOffCard = ({
  files,
  setFiles,
  filesInfo,
  setFilesInfo,
  InfoModal,
  imageUrl,
  title,
  description,
}: CardProps) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedCountry, setSelectedCountry] =
    useState<ValidCountryOfOrigin>("United States");
  const [hingeStatus, setHingeStatus] = useState<"1" | "2">("1");

  const handleCountryChange = (value: ValidCountryOfOrigin) => {
    setSelectedCountry(value);
    const newFilesInfo = [...filesInfo];
    newFilesInfo.forEach((fileInfo) => {
      fileInfo.country_of_origin = value;
    });
  };

  const handleHingeStatusChange = (value: "1" | "2") => {
    setHingeStatus(value);
    const newFilesInfo = [...filesInfo];
    newFilesInfo.forEach((fileInfo) => {
      fileInfo.hinge_status = value;
    });
  };

  useEffect(() => {
    if (filesInfo.length !== files.length) {
      const newFilesInfo: CatoUploadFile[] = [];
      files.forEach((file) => {
        newFilesInfo.push({
          file_name: file.name,
          operation_type: "Architecture_drawing",
          file_type: "PDF",
          country_of_origin: selectedCountry || "United States",
        });
      });
      setFilesInfo(newFilesInfo);
    }
  }, [files]);

  return (
    <div className="flex flex-col justify-between gap-8 zoomed-container">
      <div className="flex justify-center items-start gap-4">
        <Image
          src={imageUrl}
          alt={`${title} image`}
          width={122}
          height={85}
          className="w-32 h-auto"
        />
        <div className="flex flex-col gap-3 w-96">
          <p className="text-lg text-forumBlue">{title}</p>
          <p className="text-sm min-h-20">{description}</p>
          <p
            className="text-xs text-basicGray underline cursor-pointer hover:opacity-80 active:opacity-60 w-fit"
            onClick={() => setShowInfoModal(true)}
          >
            Not sure what to upload?
          </p>
        </div>
      </div>
      <CatoUpload files={files} setFiles={setFiles} />
      {files.length > 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-forumBlue">PDFs Details</p>
            <p className="text-xxs text-basicGray">
              For an accurate takeoff, please provide the following information
              from your PDF:
            </p>
          </div>
          <div className="flex justify-between gap-8 text-xs">
            <div className="w-1/2 flex flex-col gap-1 text-xs">
              <p>Country of Origin</p>
              <p className="text-basicLightGray mb-2">
                Choosing the right country improves data extraction accuracy.
              </p>
              <ConfigProvider
                theme={{
                  components: {
                    Select: {
                      borderRadius: 9999,
                      fontSize: 12,
                    },
                  },
                }}
              >
                <Select
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  className="w-full"
                >
                  <Select.Option value="United States">
                    United States
                  </Select.Option>
                  <Select.Option value="Canada">Canada</Select.Option>
                  <Select.Option value="Spain">Spain</Select.Option>
                  <Select.Option value="Morocco">Morocco</Select.Option>
                </Select>
              </ConfigProvider>
            </div>
            <div className="w-1/2 flex flex-col gap-1 text-xs">
              <p>Hinge Orientation</p>
              <p className="text-basicLightGray mb-2">
                *For better takeoffs, indicate the hinge side for all window and
                doors.
              </p>
              <div className="flex gap-4">
                <div
                  className="cursor-pointer"
                  onClick={() => handleHingeStatusChange("1")}
                >
                  <svg
                    width="80"
                    height="106"
                    viewBox="0 0 62 87"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.5"
                      y="0.5"
                      width="61"
                      height="86"
                      rx="5.5"
                      fill={hingeStatus === "1" ? "#F5F6F7" : "white"}
                    />
                    <rect
                      x="0.5"
                      y="0.5"
                      width="61"
                      height="86"
                      rx="5.5"
                      stroke="#F5F6F7"
                    />
                    <rect
                      x="8.5"
                      y="8.5"
                      width="45"
                      height="70"
                      rx="1"
                      stroke="#717171"
                    />
                    <rect
                      x="11.5"
                      y="11.5"
                      width="39"
                      height="64"
                      rx="1"
                      stroke="#717171"
                    />
                    <path
                      d="M12 75L49.0713 44.2699C49.5537 43.87 49.5537 43.13 49.0713 42.7301L12 12"
                      stroke="#B1B1B1"
                      stroke-width="0.8"
                      stroke-dasharray="3 3"
                    />
                    <circle cx="12" cy="44" r="2" fill="#D9D9D9" />
                    <rect
                      x="11.5"
                      y="43"
                      width="10"
                      height="2"
                      rx="1"
                      fill="#C6C6C6"
                    />
                  </svg>
                </div>
                <div
                  className="cursor-pointer"
                  onClick={() => handleHingeStatusChange("2")}
                >
                  <svg
                    width="80"
                    height="106"
                    viewBox="0 0 62 87"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="0.5"
                      y="0.5"
                      width="61"
                      height="86"
                      rx="5.5"
                      fill={hingeStatus === "2" ? "#F5F6F7" : "white"}
                    />
                    <rect
                      x="0.5"
                      y="0.5"
                      width="61"
                      height="86"
                      rx="5.5"
                      stroke="#F5F6F7"
                    />
                    <rect
                      x="8.5"
                      y="8.5"
                      width="45"
                      height="70"
                      rx="1"
                      stroke="#717171"
                    />
                    <rect
                      x="11.5"
                      y="11.5"
                      width="39"
                      height="64"
                      rx="1"
                      stroke="#717171"
                    />
                    <path
                      d="M50 12L12.9287 42.7301C12.4463 43.13 12.4463 43.87 12.9287 44.2699L50 75"
                      stroke="#B1B1B1"
                      stroke-width="0.8"
                      stroke-dasharray="3 3"
                    />
                    <circle cx="12" cy="44" r="2" fill="#D9D9D9" />
                    <rect
                      x="11.5"
                      y="43"
                      width="10"
                      height="2"
                      rx="1"
                      fill="#C6C6C6"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showInfoModal && (
        <InfoModal isOpen={showInfoModal} setIsOpen={setShowInfoModal} />
      )}
    </div>
  );
};
