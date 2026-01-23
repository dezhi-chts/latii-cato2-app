"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreateProjectModalProps,
  defaultProjectSettings,
  ProjectSettings,
} from "@/types/project";
import { Button, Input, Modal, message, Tabs, notification } from "antd";
import type { UploadFile } from "antd/es/upload/interface";

import { useRouter } from "next/navigation";
import { FilePanel } from "./Create-Takeoff/Cato-Upload";
import PdfWrapper from "../takeoff/[takeoffId]/components/pdf/PdfWrapper";
import { PageControls, ZoomControls } from "../takeoff/[takeoffId]/components/pdf/Pdf-Controls";
import ProjectForm from "./Project-Form";
import debounce from "lodash/debounce";
import { PdfWrapperRefMethods } from "../takeoff/[takeoffId]/types/evidence";
import { uploadFiles } from "@/services/filesService";

const CreateProjectTakeoffModal = ({
  isOpen,
  closeModal,
  uploadFilesData,
  onSuccess,
}: CreateProjectModalProps) => {
  const router = useRouter();
  const projectId = '01KFMB9K2JB0F5GJKCJ1ZN38AK';
  const projectFormRef = useRef<any>(null);
  const pdfRef = useRef<PdfWrapperRefMethods>(null);

  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
    ...defaultProjectSettings,
  });
  const [selectedFileId, setSelectedFileId] = useState(-1);
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [zoom, setZoom] = useState(1);

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [OCRFieldName, setOCRFieldName] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  const [filesData, setFilesData] = useState<any[]>(() => {
    let data = [
      {
        id: 1,
        file_name: 'Architectural-example.pdf',
        upload_status: 'done',
        url: 'https://latii-automation-dev.s3.amazonaws.com/s3_evidences/original/6a0f8d76ba474ddcae31e942e9c3cbb2_24_6004.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260121%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260121T062920Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=a5dbd176be9ca1a3a68968a225545686f103dfa79d78d71adc26fc1bb18eaa2f'
      },
      {
        id: 2,
        file_name: 'Quote-example.pdf',
        upload_status: 'done',
        url: 'https://latii-automation-dev.s3.amazonaws.com/s3_evidences/original/935d889f8e954ad29fd0f7205dab5bd8_1107_114353.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAX6MDEYMVG3YFH4IP%2F20260121%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20260121T063110Z&X-Amz-Expires=172800&X-Amz-SignedHeaders=host&X-Amz-Signature=15e3a5d67fd627179a8abae980b2becb38fe4f897c886b96b090f1af61496f96',
      },
    ];
    let list = uploadFilesData && uploadFilesData?.length > 0 ? uploadFilesData : data;
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
    // if (!projectFormRef?.current?.isValidForm()) {
    //   message.warning("Please fill out all required fields.");
    //   return;
    // }

    console.log('########## uploadFilesData', uploadFilesData);
    const { archFiles = [], arcHingeMode = '1', quoteFiles = [], quoteHingeMode = '1' } = uploadFilesData;
    // 目前只处理archFiles文件

    const filesInfo = archFiles.map((file: UploadFile) => ({
      file_name: file.name,
      operation_type: 'Architecture_drawing',
      file_type: 'PDF',
      country_of_origin: "United States",
    }));

    const files = archFiles;

    setLoading(true);

    let res = await uploadFiles(
      filesInfo,
      files,
      projectId,
      arcHingeMode
    );
    setLoading(false);
    if (res.status === 'success') {
      message.success("Upload success.");
      // 跳转到page index页面
      router.push(`/projects/${projectId}/takeoff/${1}/identification-index`);
    } else {
      message.warning("Upload failed. Please try again.");
    }
  }

  const handleAddOCRBox = (fieldName: any) => {
    if (pdfRef.current && pdfRef.current?.addingRect) {
      setOCRFieldName(fieldName);
      pdfRef.current?.clearCropSections();
      pdfRef.current?.addingRect({ type: 'Text' });
    }
  };

  const handleOCRText = (text: string) => {
    console.log("text", text);
    if (OCRFieldName.length > 0) {
      setOCRFieldName('');
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
      width={'80vw'}
      footer={null}
      closable={false}
      onCancel={closeModal}
    >
      <div className="my-2 text-xs text-baseGray">Confirm and fill all missing information to create your project.</div>
      <div className="mt-8 h-[80vh] flex flex-row justify-between">
        <div className="w-[400px] max-h-[80vh] flex flex-col overflow-hidden">
          <div className="overflow-y-auto">
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
        <div className="ml-10 flex-1 flex flex-col overflow-hidden">
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
              project_id={projectId as any}
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
    </Modal>
  );
};

export default CreateProjectTakeoffModal;
