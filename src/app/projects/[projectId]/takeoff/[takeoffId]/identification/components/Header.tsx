/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Divider,
  Input,
  notification,
  UploadFile,
  ConfigProvider,
  Select,
  Popover,
} from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import { FilePanel } from "@/app/projects/[projectId]/components/Create-Takeoff/Cato-Upload";
import { updateTakeOffName } from "@/services/takeOffService";
import { analyzeItem } from "@/services/DrawingAiService";
import { getTemplates } from "@/services/templateService";

import { BuildingBackground } from "@/app/projects/[projectId]/components/Create-Takeoff/Building-Background";
import { useParams } from "next/navigation";
import { Template } from "@/types/templates";
import ConfirmAnalyzeModal from "./ConfirmAnalyzeModal";

const Header = ({
  pdfRef,
  project,
  takeOff,
  selectedFileId,
  checkEvidenceCount,
  setSelectedFileId,
}: any) => {
  const router = useRouter();
  const projectId = useParams().projectId;

  const [takeOffData, setTakeOffData] = useState<any>();
  const [filesData, setFilesData] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [hasFinishedAnalyzing, setHasFinishedAnalyzing] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<number>(1);
  const [takeOffName, setTakeOffName] = useState<string>("");
  const [showAnalyzeModal, setShowAnalyzeModal] = useState<boolean>(false);

  useEffect(() => {
    if (!takeOff) return;

    const data = takeOff?.take_off_result;
    const files = takeOff?.project_files;
    setFilesData(files);
    setTakeOffData(data);
    if (data?.name?.length > 0) {
      setTakeOffName(data?.name);
    } else {
      // 填写默认值 yyyy/mm/dd - hh:mm:ss   hh:mm:ss 用0填充

      let date: Date = new Date(data?.create_time);
      let dateString = `${date.getFullYear()}/${
        date.getMonth() + 1
      }/${date.getDate()}`;
      let timeString = `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
      setTakeOffName(`${dateString}-${timeString}`);
    }
  }, [takeOff]);

  async function fetchTemplates() {
    const response = await getTemplates();
    if (response.status === "success") {
      setTemplates(response.data?.items as Template[]);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get templates",
      });
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleUpdateTakeOffName = async (name: string) => {
    const response = await updateTakeOffName(name, takeOffData?.id);
    if (response.status === "success") {
      notification.success({
        message: "Success",
        description: "Takeoff name updated successfully",
      });
      setTakeOffName(name);
    } else {
      notification.error({
        message: "Error",
        description: "Failed to update Takeoff name",
      });
    }
  };

  const handleAnalyze = async () => {
    const unsaved = await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
    if (unsaved) {
      // 没有未保存的crop
      // 提交前先判断当前文件是否有已完成的evidence，如果没有evidence，则不允许点击
      const currentEvidenceCount = checkEvidenceCount?.() || 0;
      if (!currentEvidenceCount || currentEvidenceCount === 0) {
        notification.warning({
          message: "Warning",
          description: "Please upload and complete the evidence first.",
        });
        return;
      }
      setLoading(true);
      // const templateId = "1"; // FOR NOW
      const response = await analyzeItem(takeOffData?.id as string, templateId);
      setLoading(false);
      if (response.status === "success") {
        notification.success({
          message: "Success",
          description: "Item analyzed successfully",
        });
        //跳转到分析结果页面
        router.replace(
          `/projects/${projectId}/takeoff/${takeOffData?.id}/analyze`
        );
        return;
      } else {
        notification.error({
          message: "Error",
          description: "Failed to analyze item. Please try again.",
        });
      }
    }
  };

  const handleAnalyzeClick = async () => {
    await pdfRef?.current?.checkAndHandleUnsavedCrops?.(true);
    setShowAnalyzeModal(true);
  };

  return (
    <div>
      <div className="pt-6 pb-3 px-14 flex border-b-neutralsN50 bg-white border-b justify-between relative z-50 zoomed-container">
        <div className="flex gap-10 items-center">
          <div
            className="flex gap-1.5 items-center group"
            onClick={async () => {
              const unsaved =
                await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
              if (unsaved) {
                // 没有未保存的crop，直接跳转
                router.push(`/projects/${projectId}`);
                return;
              }
            }}
          >
            <Image
              src="/assets/icons/arrow-back.svg"
              alt="go back"
              width={20}
              height={20}
              style={{ width: "auto", height: "auto" }}
              className="cursor-pointer"
            />
          </div>
          <div>
            <p className="text-sm text-forumBlue">Item Identification</p>
            <p className="text-xs text-basicGray">
              Label pages information to improve AI analysis.
            </p>
          </div>
          <div className="flex gap-1.5 items-center">
            <p className="text-xs">Takeoff Name</p>
            <Input
              placeholder="Add Takeoff Name"
              className="bg-primaryN20 border-primaryN20 w-72"
              value={takeOffName}
              onChange={(e) => setTakeOffName(e.target.value)}
              onBlur={() => handleUpdateTakeOffName(takeOffName)}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 h-20">
          <div className="flex gap-4">
            {filesData?.map((file: any, index: number) => {
              const uploadFile: UploadFile = {
                uid: String(file.id),
                name: file.file_name,
                status: "done",
                url: file.parse_detail?.uploaded_file_url,
                type: "application/pdf",
                size: 0,
              };
              return (
                <div
                  key={index}
                  className={`rounded cursor-pointer ${
                    selectedFileId === file.id
                      ? "bg-primaryN20"
                      : "hover:bg-primaryN10"
                  }`}
                  onClick={async () => {
                    const unsaved =
                      await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
                    if (unsaved) {
                      console.log("########### file change");
                      // 没有未保存的crop，切换文件
                      setSelectedFileId(file.id);
                    }
                  }}
                >
                  <FilePanel
                    file={uploadFile}
                    canBeRemoved={false}
                    textClassName="text-xs"
                    isSelected={selectedFileId === file.id}
                  />
                </div>
              );
            })}
          </div>
          <Divider type="vertical" className="h-full m-0 bg-primaryN30" />
          <div className="flex items-center gap-2">
            <div className="flex gap-1 items-center">
              <p className="text-forumBlue text-xs">Reading Prompt</p>
              <Popover
                placement="bottomLeft"
                showArrow={false}
                title={
                  <p className="text-xs text-basicGray font-bold">
                    Reading Prompt
                  </p>
                }
                content={
                  <p className="w-60 text-xs text-basicGray">
                    Customize the fields Cato uses to read your PDF. Create
                    specialized templates to accurately capture data for
                    different takeoff types (e.g., steel vs. aluminum).
                  </p>
                }
              >
                <Image
                  src="/assets/icons/info-forum-blue.svg"
                  alt="info icon"
                  width={14}
                  height={14}
                  style={{ width: "auto", height: "auto" }}
                />
              </Popover>
            </div>
            <ConfigProvider
              theme={{
                components: {
                  Select: {
                    borderRadius: 99999,
                  },
                },
              }}
            >
              <Select
                className="w-60 h-6"
                defaultValue="standard"
                onChange={(value) => setTemplateId(Number(value))}
              >
                <Select.Option key={"standard"} value="1">
                  <div className="flex items-center text-basicGray text-xs h-6">
                    Standard
                  </div>
                </Select.Option>
                {templates?.map((template: Template) => (
                  <Select.Option
                    value={template.id.toString()}
                    key={template.id}
                  >
                    <div className="flex items-center text-basicGray text-xs h-6">
                      {template.name}
                    </div>
                  </Select.Option>
                ))}
                <Select.Option key={"edit"}>
                  <div
                    className="flex items-center justify-between text-forumBlue text-xs h-6"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const unsaved =
                        await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
                      if (unsaved) {
                        // 没有未保存的crop，直接跳转
                        router.push(`/prompts`);
                        return;
                      }
                    }}
                  >
                    <p>Edit Prompts</p>
                    <p>+</p>
                  </div>
                </Select.Option>
              </Select>
            </ConfigProvider>
          </div>

          <Button
            backgroundColor="forumBlue"
            className="px-8"
            disabled={loading}
            onClick={() => handleAnalyzeClick()}
          >
            {loading ? "Wait..." : "Analyze"}
          </Button>
        </div>
      </div>
      {loading && (
        <BuildingBackground
          isDone={hasFinishedAnalyzing}
          totalDuration={90000}
          onFinish={() => setLoading(false)}
        />
      )}
      <ConfirmAnalyzeModal
        isOpen={showAnalyzeModal}
        setIsOpen={setShowAnalyzeModal}
        onConfirm={handleAnalyze}
      />
    </div>
  );
};

export default Header;
