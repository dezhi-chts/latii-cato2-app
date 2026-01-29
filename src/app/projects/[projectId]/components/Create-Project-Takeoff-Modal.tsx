"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CreateProjectModalProps,
  ProjectSettings,
} from "@/types/project";
import { Button, Input, Modal, message, notification, Spin } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import Image from "next/image";

import { useRouter } from "next/navigation";
import { FilePanel } from "../takeoff/[takeoffId]/identification-index/components/FileList";
import PdfWrapper from "../takeoff/[takeoffId]/components/pdf/PdfWrapper";
import { PageControls, ZoomControls } from "../takeoff/[takeoffId]/components/pdf/Pdf-Controls";
import ProjectForm from "./Project-Form";
import debounce from "lodash/debounce";
import { PdfWrapperRefMethods } from "../takeoff/[takeoffId]/types/evidence";
import { uploadFiles } from "@/services/filesService";
import { createProject } from "@/services/projectService";


const TabList = ({
  items,
  activeIndex,
  onClick
}: {
  items: any[],
  activeIndex: number,
  onClick: (index: number) => void
}) => {
  return (
    <div className="w-full relative">
      <div className="flex flex-row gap-2 relative mb-[-1px]">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`
              cursor-pointer rounded-md rounded-bl-none rounded-br-none 
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
  )
}


const CreateProjectTakeoffModal = ({
  isOpen,
  closeModal,
  uploadFilesData,
  onSuccess,
}: CreateProjectModalProps) => {
  const router = useRouter();
  //const projectId = '01KFMB9K2JB0F5GJKCJ1ZN38AK';
  const projectFormRef = useRef<any>(null);
  const pdfRef = useRef<PdfWrapperRefMethods>(null);

  const [projectSettings, setProjectSettings] = useState<any>({ project_name: '', location: '' });
  const [selectedFileId, setSelectedFileId] = useState(-1);
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [OCRFieldName, setOCRFieldName] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [pdfFullScreen, setPdfFullScreen] = useState<boolean>(false);

  const [filesData, setFilesData] = useState<any[]>(() => {
    let list: any = [];
    if (uploadFilesData && uploadFilesData?.archFiles?.length > 0) {
      list = uploadFilesData.archFiles.map((item: any) => ({
        id: item.uid,
        file_name: item.name,
        upload_status: 1,
        url: URL.createObjectURL(item.originFileObj),
      }));
    }
    return list;
  });

  useEffect(() => {
    if (filesData.length > 0 && selectedFileId === -1) {
      setSelectedFileId(filesData[0].id);
    }
  }, [filesData])

  useEffect(() => {
    if (selectedFileId !== -1) {
      if (pdfRef.current) {
        pdfRef.current.resetAllInfo();
      }

      //reset page
      setPage(1);
      setTotalPage(1);

      // 切换文件的时候，重置OCRFieldName
      setOCRFieldName('');
      // 取消pdf全屏显示
      setPdfFullScreen(false);

      const file = filesData.find((file: any) => file.id === selectedFileId);
      setPdfUrl(file?.url);
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
      }
    ),
    [zoom]
  );

  const handleZoomChange = (value: number) => {
    debouncedZoomChange(value);
  };

  const handleSafeZoomChange = (value: number) => {
    message.warning(
      `The current scale may affect browser performance, and the previous scale will be set soon`
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
    setOCRFieldName('');
  };

  const handleConfirm = async () => {
    if (!projectFormRef?.current?.isValidForm()) {
      message.warning("Please fill out all required fields.");
      return;
    }
    setLoading(true);

    // 先创建工程，工程创建成功，才可以上传文件
    let projectRes: any = await createProject(projectSettings);
    if (projectRes?.status !== 'success') {
      setLoading(false);
      notification.error({
        message: 'Create project failed',
        description: projectRes?.message,
      });
      return;
    }

    // 上传文件
    const projectId = projectRes?.data?.project_id;

    console.log('########## uploadFilesData', uploadFilesData);
    const { archFiles = [], arcHingeMode = '1', quoteFiles = [], quoteHingeMode = '1' } = uploadFilesData;
    // 目前只处理archFiles文件
    const filesInfo: any = archFiles.map((file: UploadFile) => ({
      file_name: file.name,
      operation_type: 'Architecture_drawing',
      file_type: 'PDF',
      country_of_origin: "United States",
    }));

    const files = archFiles;

    let res: any = await uploadFiles(
      filesInfo,
      files,
      projectId,
      arcHingeMode as any
    );
    setLoading(false);
    if (res.status === 'success') {
      message.success("Upload success.");
      const takeOffId = res?.data?.take_off_id ?? null;
      // 跳转到page index页面
      router.push(`/projects/${projectId}/takeoff/${takeOffId}/identification-index`);
    } else {
      message.warning("Upload failed. Please try again.");
    }
  }

  const handleAddOCRBox = (fieldName: any) => {
    if (pdfRef.current && pdfRef.current?.addingRect) {
      setOCRFieldName(fieldName);
      setPdfFullScreen(true);
      pdfRef.current?.clearCropSections();
      pdfRef.current?.addingRect({ type: 'OCR' });
    }
  };

  const handleOCRText = (text: string) => {
    console.log("text", text);
    if (OCRFieldName.length > 0) {
      setOCRFieldName('');
      setPdfFullScreen(false);
      setProjectSettings({
        ...projectSettings,
        [OCRFieldName]: text,
      });
    }
  }

  const items = useMemo(() => {
    return filesData.map((file: any) => {
      const uploadFile: any = {
        uid: String(file.id),
        id: file.id,
        name: file.file_name,
        status: "done",
        url: file.uploaded_file_url,
        type: "application/pdf",
        size: 0,
      };
      let label =
        <div
          className={`rounded cursor-pointer`}
          onClick={() => setSelectedFileId(file.id)}
        >
          <FilePanel
            file={uploadFile}
            canBeRemoved={false}
            textClassName="text-xs"
            flexRow={false}
            showBorder={false}
            isSelected={uploadFile.id === selectedFileId}
            switchBgColor={false}
            switchTextColor={true}
          />
        </div>

      return {
        label: label,
        key: file.id,
      }
    })
  }, [filesData, selectedFileId]);

  const activeIndex = useMemo(() => {
    if (selectedFileId === -1) return -1;
    let index = filesData.findIndex((file: any) => file.id === selectedFileId);
    return index !== -1 ? index : -1;
  }, [filesData, selectedFileId]);

  return (
    <Modal
      open={isOpen}
      title={
        <p className="text-forumBlue text-lg font-normal font-nunito">Create New Project</p>
      }
      width={'85vw'}
      footer={null}
      closable={false}
      onCancel={closeModal}
    >
      <div className="font-nunito">
        <div className="my-2 text-xs text-baseGray">Confirm and fill all missing information to create your project.</div>
        <div className="mt-8 h-[90vh] flex flex-row justify-between">
          <div className={`max-h-[80vh] flex flex-col overflow-hidden ${pdfFullScreen ? 'w-[0px]' : 'w-[300px]'} transition-all duration-300 ease-in-out`}>
            <div className="overflow-y-auto bg-white">
              <ProjectForm
                ref={projectFormRef}
                projectSettings={projectSettings}
                setProjectSettings={setProjectSettings}
                showOCRIcon={true}
                OCRFieldName={OCRFieldName}
                handleAddOCRBox={handleAddOCRBox} />
            </div>
            <div className="flex-1 flex gap-4 items-end justify-center">
              <Button
                onClick={closeModal}
                className="mb-4 custom-default-btn"
              >
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
          {
            pdfFullScreen && <div className="flex flex-row justify-center items-center">
              <div className="ml-4 w-[1px] h-full bg-primaryN30"></div>
              <div className="cursor-pointer" onClick={() => setPdfFullScreen(false)}>
                <Image src="/assets/icons/arrow-right-gray.svg" alt="arrow right" width={20} height={20} style={{ width: "auto", height: "auto" }}></Image>
              </div>
            </div>
          }

          <div className={`flex-1 flex flex-col overflow-hidden ${pdfFullScreen ? 'ml-1' : 'ml-10'} transition-all duration-300 ease-in-out`}>
            <TabList
              activeIndex={activeIndex}
              onClick={(index: number) => {
                setSelectedFileId(filesData[index].id);
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
                project_id={''}
                project_file_id={selectedFileId}
                zoom={zoom}
                page={page}
                allEvidence={[]}
                onTotalPages={setTotalPage}
                onUpdateSafeZoom={handleSafeZoomChange}
                onSuccessOCRText={handleOCRText}
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
