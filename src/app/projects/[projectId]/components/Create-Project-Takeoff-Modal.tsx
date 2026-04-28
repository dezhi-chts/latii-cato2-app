"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Modal, message, notification, Spin } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import Image from "next/image";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";

import { uploadFiles } from "@/services/filesService";
import {
  createProject,
  updateProject,
  fetchProject,
} from "@/services/projectService";
import { getPdfAnalyseProjectInfo } from "@/services/drawingIndexService";
import { getTakeOffById } from "@/services/takeOffService";

import { CreateProjectModalProps, ProjectSettings } from "@/types/project";
import { PdfWrapperRefMethods } from "../takeoff/[takeoffId]/types/evidence";

import PdfWrapper from "../takeoff/[takeoffId]/components/pdf/PdfWrapper";
import {
  PageControls,
  ZoomControls,
  ZOOM_MIN,
  ZOOM_MAX,
} from "../takeoff/[takeoffId]/components/pdf/Pdf-Controls";
import ProjectFormTakeoff from "./Project-Form-Takeoff";

const TabList = ({
  items,
  activeIndex,
  onClick,
}: {
  items: any[];
  activeIndex: number;
  onClick: (index: number) => void;
}) => {
  return (
    <div className="w-full relative">
      <div className="flex flex-row gap-2 relative mb-[-1px]">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`
              px-2 py-1 cursor-pointer rounded-md rounded-bl-none rounded-br-none 
              border border-primaryN30
              ${activeIndex === index
                ? "border-b-white bg-white relative z-10"
                : "border-b-0 border-b-transparent"
              }
            `}
            onClick={() => onClick(index)}
          >
            {item.label}
          </div>
        ))}
      </div>
      <div className="h-[0.5px] bg-primaryN30"></div>
    </div>
  );
};

export const FilePanel = ({
  file,
  isSelected = false,
}: any) => {
  return (
    <div
      className={`relative w-[94px] h-[34px] flex flex-col items-center justify-center p-1`}
    >
      <div
        className={`break-all line-clamp-2 text-center text-[8px] ${isSelected ? "text-forumBlue-normal" : "text-grey-normal"} `}
      >
        {file.name}
      </div>
    </div>
  );
};

const CreateProjectTakeoffModal = ({
  isOpen,
  closeModal,
  projectId,
  takeOffId,
  onSuccess,
}: CreateProjectModalProps) => {
  const router = useRouter();
  const projectFormRef = useRef<any>(null);
  const pdfRef = useRef<PdfWrapperRefMethods>(null);

  const [projectSettings, setProjectSettings] = useState<any>({
    project_name: "",
    location: "",
  });
  const [selectedFileId, setSelectedFileId] = useState(-1);
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [OCRFieldName, setOCRFieldName] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [pdfFullScreen, setPdfFullScreen] = useState<boolean>(false);
  const [takeoff, setTakeoff] = useState<any>(null);
  const [fileList, setFileList] = useState<any>([]);

  useEffect(() => {
    // 获取takeOff详情
    getTakeOffDetails();
  }, [takeOffId]);

  useEffect(() => {
    // 获取项目详情
    //  getProjectInfo();
    getPdfAnalyseProject();
  }, [projectId]);

  const getProjectInfo = async () => {
    let res: any = await fetchProject(projectId);
    if (res) {
      setProjectSettings(res ?? {});
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get project",
      });
    }
  };

  const getPdfAnalyseProject = async () => {
    let res: any = await getPdfAnalyseProjectInfo(projectId);
    if (res.status === "success") {
      let info = res?.data?.data?.project_info ?? {};
      console.log("######### info: ", info);
      setProjectSettings(info ?? {});
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get pdf analyse project info",
      });
    }
  };

  const getTakeOffDetails = async () => {
    setLoading(true);
    let res: any = await getTakeOffById(takeOffId as any);
    if (res.status === "success") {
      setTakeoff(res?.data ?? {});
      let project_files = res?.data?.project_files ?? [];
      if (project_files?.length > 0) {
        setFileList(project_files);
        setSelectedFileId(project_files[0].id); // 设置默认选中文件ID
        setPdfUrl(project_files[0].parse_detail.uploaded_file_url); // 设置默认选中文件的PDF URL
      } else {
        notification.error({
          message: "Error",
          description: "No files found in this take off",
        });
      }
    } else {
      notification.error({
        message: "Error",
        description: "Failed to get take off",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedFileId !== -1 && fileList.length > 0) {
      if (pdfRef.current) {
        pdfRef.current.resetAllInfo();
      }

      //reset page
      setPage(1);
      setTotalPage(1);

      // 切换文件的时候，重置OCRFieldName
      setOCRFieldName("");
      // 取消pdf全屏显示
      setPdfFullScreen(false);

      const file = fileList.find((file: any) => file.id === selectedFileId);
      setPdfUrl(file?.parse_detail?.uploaded_file_url);
    }
  }, [selectedFileId]);

  // 使用 lodash 的防抖函数来处理缩放
  const debouncedZoomChange = useCallback(
    debounce(
      (value: number) => {
        if (value === zoom) return;
        if (value < 0.4 || value > 4) return;
        // 四舍五入保留2位小数，避免浮点数精度累积
        const roundedValue = Math.round(value * 100) / 100;
        setZoom(roundedValue);
      },
      500,
      {
        leading: true, // 立即执行第一次调用
        trailing: true, // 也执行 trailing 调用
      },
    ),
    [zoom],
  );

  const handleZoomChange = (value: number) => {
    const clampedValue = Math.max(ZOOM_MIN, Math.min(value, ZOOM_MAX));
    setZoom(clampedValue);
  };

  const handleSafeZoomChange = (value: number) => {
    message.warning(
      `The current scale may affect browser performance, and the previous scale will be set soon`,
    );
    debouncedZoomChange(value - 0.1);
  };

  const handlePageChange = (value: number) => {
    if (value < 1) return;
    if (value > totalPage) return;
    if (value === page) return;
    if (value > 3) return;
    setPage(value);
    // 切换页码的时候，重置OCRFieldName
    setOCRFieldName("");
  };

  const handleConfirm = async () => {
    if (!projectFormRef?.current?.isValidForm()) {
      message.warning("Please fill out all required fields.");
      return;
    }

    setLoading(true);

    // 更新工程信息
    let res: any = await updateProject({
      ...projectSettings,
      project_id: projectId,
      is_favorite: false,
    });
    setLoading(false);
    if (res) {
      notification.success({
        message: "Success",
        description: "Project updated successfully.",
      });
      closeModal();
      onSuccess?.();
      // 跳转到下一页
      router.push(
        `/projects/${projectId}/takeoff/${takeOffId}/identification`,
      );
    } else {
      notification.error({
        message: "Error",
        description: "Failed to update project.",
      });
    }
  };

  const handleAddOCRBox = (fieldName: any) => {
    if (pdfRef.current && pdfRef.current?.addingRect) {
      setOCRFieldName(fieldName);
      //setPdfFullScreen(true);
      pdfRef.current?.clearCropSections();
      pdfRef.current?.addingRect({ type: "OCR" });
    }
  };

  const handleOCRText = (text: string) => {
    console.log("text", text);
    if (OCRFieldName.length > 0) {
      setOCRFieldName("");
      //  setPdfFullScreen(false);
      setProjectSettings({
        ...projectSettings,
        [OCRFieldName]: text,
      });
    }
  };

  const items = useMemo(() => {
    return fileList.map((file: any) => {
      const uploadFile: any = {
        uid: String(file.id),
        id: file.id,
        name: file.file_name,
        status: "done",
        url: file.uploaded_file_url,
        type: "application/pdf",
        size: 0,
      };
      let label = (
        <div
          className={`rounded cursor-pointer`}
          onClick={() => setSelectedFileId(file.id)}
        >
          <FilePanel
            file={uploadFile}
            isSelected={uploadFile.id === selectedFileId}
          />
        </div>
      );

      return {
        label: label,
        id: file.id,
      };
    });
  }, [fileList, selectedFileId]);

  const activeIndex = useMemo(() => {
    if (selectedFileId === -1) return -1;
    let index = fileList.findIndex((file: any) => file.id === selectedFileId);
    return index !== -1 ? index : -1;
  }, [fileList, selectedFileId]);

  return (
    <Modal
      open={isOpen}
      title={
        <p className="text-forumBlue-normal text-lg font-normal font-nunito">
          Create New Project
        </p>
      }
      centered={true}
      width={"85vw"}
      footer={null}
      closable={false}
      onCancel={closeModal}
      maskClosable={false}
    >
      <div className="font-nunito">
        <div className="my-2 text-xs text-grey-light-strong">
          Confirm and fill all missing information to create your project.
        </div>
        <div className="mt-8 h-[80vh] flex flex-row justify-between">
          <div
            className={`max-h-[80vh] flex flex-col overflow-hidden ${pdfFullScreen ? "w-[0px]" : "w-[300px]"} transition-all duration-300 ease-in-out`}
          >
            <div className="overflow-y-auto bg-white">
              <ProjectFormTakeoff
                ref={projectFormRef}
                projectSettings={projectSettings}
                setProjectSettings={setProjectSettings}
                showOCRIcon={true}
                OCRFieldName={OCRFieldName}
                handleAddOCRBox={handleAddOCRBox}
              />
            </div>
            <div className="flex-1 flex gap-4 items-end justify-center">
              <Button onClick={closeModal} className="mb-4 custom-default-btn">
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="mb-4 custom-primary-btn"
              >
                Confirm
              </Button>
            </div>
          </div>
          {/* {pdfFullScreen && (
            <div className="flex flex-row justify-center items-center">
              <div className="ml-4 w-[1px] h-full bg-primaryN30"></div>
              <div
                className="cursor-pointer"
                onClick={() => setPdfFullScreen(false)}
              >
                <Image
                  src="/assets/icons/arrow-right-gray.svg"
                  alt="arrow right"
                  width={20}
                  height={20}
                  style={{ width: "auto", height: "auto" }}
                ></Image>
              </div>
            </div>
          )} */}

          <div
            className={`flex-1 flex flex-col overflow-hidden ${pdfFullScreen ? "ml-1" : "ml-10"} transition-all duration-300 ease-in-out`}
          >
            <TabList
              activeIndex={activeIndex}
              onClick={(index: number) => {
                setSelectedFileId(fileList[index].id);
              }}
              items={items}
            />
            <div className="-mt-[1px] px-3 flex-1 flex flex-col border border-t-0 border-primaryN30 rounded-md rounded-tl-none rounded-tr-none roun overflow-hidden">
              <div className="py-3 flex justify-between ">
                <div>
                  <PageControls
                    page={page}
                    totalPages={totalPage}
                    handlePageChange={handlePageChange}
                  />
                </div>
                <div>
                  <ZoomControls
                    zoom={zoom}
                    handleZoomChange={handleZoomChange}
                  />
                </div>
              </div>
              <PdfWrapper
                ref={pdfRef}
                operationMode={"edit"}
                mode="edit"
                typeList={[]}
                pdfUrl={pdfUrl as string}
                project_id={""}
                project_file_id={selectedFileId}
                zoom={zoom}
                page={page}
                allEvidence={[]}
                onTotalPages={setTotalPage}
                onUpdateSafeZoom={handleSafeZoomChange}
                onSuccessOCRText={handleOCRText}
                onChangeZoom={handleZoomChange}
              />
            </div>
          </div>
        </div>
      </div>
      {loading && <Spin spinning={loading} fullscreen={true} />}
    </Modal>
  );
};

export default CreateProjectTakeoffModal;
