"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreateProjectModalProps,
  ProjectSettings,
} from "@/types/project";
import { Button, Input, Modal, message, Tabs, notification, Spin } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import Image from "next/image";

import { useRouter } from "next/navigation";
import { FilePanel } from "./Create-Takeoff/Cato-Upload";
import PdfWrapper from "../takeoff/[takeoffId]/components/pdf/PdfWrapper";
import { PageControls, ZoomControls } from "../takeoff/[takeoffId]/components/pdf/Pdf-Controls";
import ProjectForm from "./Project-Form";
import debounce from "lodash/debounce";
import { PdfWrapperRefMethods } from "../takeoff/[takeoffId]/types/evidence";
import { uploadFiles } from "@/services/filesService";
import { createProject } from "@/services/projectService";

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

  return (
    <Modal
      open={isOpen}
      title={
        <p className="text-forumBlue text-lg font-normal">Create New Project</p>
      }
      width={'85vw'}
      footer={null}
      closable={false}
      onCancel={closeModal}
    >
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
              className="w-[84px] mb-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              type="primary"
              className="w-[124px] mb-4"
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
          <div className="flex flex-row gap-2">
            {filesData?.map((file: any, index: number) => {
              const uploadFile: UploadFile = {
                uid: String(file.id),
                name: file.file_name,
                status: "done",
                url: file.uploaded_file_url,
                type: "application/pdf",
                size: 0,
              };
              return (
                <div
                  key={index}
                  className={`rounded cursor-pointer ${selectedFileId === file.id
                    ? "bg-primaryN20"
                    : "hover:bg-primaryN10"
                    }`}
                  onClick={() => setSelectedFileId(file.id)}
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
          <div className="mt-2 flex-1 flex flex-col border border-basicLightGray rounded-md overflow-hidden">
            <div className="py-2 mr-10 flex justify-end gap-4">
              <PageControls
                page={page}
                totalPages={totalPage}
                handlePageChange={handlePageChange}
              />
              <ZoomControls
                zoom={zoom}
                handleZoomChange={handleZoomChange}
              />
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
      {loading && <Spin spinning={loading} fullscreen={true} />}
    </Modal>
  );
};

export default CreateProjectTakeoffModal;
