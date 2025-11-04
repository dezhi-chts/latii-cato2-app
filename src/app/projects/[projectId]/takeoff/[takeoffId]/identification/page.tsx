"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, ConfigProvider, Divider, notification, Popover, Select } from "antd";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { getEvidenceByFileId } from "@/services/evidenceService";
import { getTakeOffById } from "@/services/takeOffService";
import { getTemplates } from "@/services/templateService";
import { fetchProject } from "@/services/projectService";

import { Template } from "@/types/templates";


import PdfWrapper from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/PdfWrapper";
import Header from "./components/Header";



type AddingType = "Item" | "Table";
export type Adding = {
  isAdding: boolean;
  type: AddingType | null;
};

export type PageData = {
  current: number;
  total: number;
};

const Identification = () => {
    const projectId = Number(useParams().projectId);
    const takeOffId = useParams().takeoffId;
    const pdfRef = useRef<{
        handleSend: () => void;
        getPageAmount: () => number;
        resetAllInfo: () => void;
        addingRect: (options: any) => void;
        rotatePDF: () => void;
    }>(null);

    const [selectedFileId, setSelectedFileId] = useState<number>(-1);
    const [takeOff, setTakeOff] = useState<any>();
    const [pdfUrl, setPdfUrl] = useState<string>();
    const [zoom, setZoom] = useState(1);
    const [adding, setAdding] = useState<Adding>({
        isAdding: false,
        type: "Item",
    });
    const [pageData, setPageData] = useState({
        current: 1,
        total: 1,
    });

    const [fileEvidence, setFileEvidence] = useState<any>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [project, setProject] = useState<any>({});

    async function fetchTemplates() {
        const response = await getTemplates();
        if (response.status === "success") {
            setTemplates(response.data?.items as Template[]);
        } else {
            notification.error({
                message: "Error",
                description: "Failed to get templates",
            })
        }
    }

    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (takeOff) {
            setProject(takeOff.project);
        }
    }, [takeOff]);

    useEffect(()=>{
        getProjectInfo();
    },[projectId]);

    const getFileEvidences = async (fileId: number)=>{
        const response = await getEvidenceByFileId(projectId, fileId);
        if (response.status === "success") {
            setFileEvidence(response.data);
        } else {
            notification.error({
                message: "Error",
                description: "Failed to get file evidences",
            })
        }
    };

    const getProjectInfo  = async ()=>{
        let res = await fetchProject(projectId);
        if (res) {
            setProject(res);
        } else {
            notification.error({
                message: "Error",
                description: "Failed to get project",
            })
        }
    }

    const getTakeOff = useCallback(async () => {
        const response = await getTakeOffById(takeOffId as string);
        if (response.status === "success") {
            let res = response.data;
            const isNew = res?.take_off_result?.status === 1;
            if (isNew){
                setTakeOff(res);
                if(res?.project_files?.length > 0){
                    //设置pdfurl
                    let firstFile = res?.project_files[0];
                    let newPdfUrl = firstFile?.parse_detail?.uploaded_file_url;
                    setSelectedFileId(firstFile?.id);
                    setPdfUrl(newPdfUrl);

                    //获取file evidence
                    getFileEvidences(firstFile?.id);
                }
            }
        } else {
            notification.error({
                message: "Error",
                description: "Failed to get take off",
            })
        }
    }, [takeOffId]);

    useEffect(() => {
        if (selectedFileId === -1) return;

        if (pdfRef.current) {
            resetAdding();
            pdfRef.current.resetAllInfo();
        }

        //reset page
        setPageData({ current: 1, total: 1 });
        //reset adding
        resetAdding();
        
        //设置新的url
        let file = takeOff?.project_files.find((file: any) => file.id === selectedFileId);
        if (file){
            let newPdfUrl = file?.parse_detail?.uploaded_file_url;
            setPdfUrl(newPdfUrl);
            //获取file evidence
            getFileEvidences(selectedFileId);
        }
    }, [selectedFileId]);

    useEffect(() => {
        if (takeOffId) getTakeOff();
    }, [takeOffId]);

    const handleAnalyzePdf = () => {
        pdfRef.current?.handleSend();
    };

    useEffect(() => {
      const checkPages = () => {
        const total = pdfRef.current?.getPageAmount() ?? 0;

        if (total === 0) {
          setTimeout(checkPages, 1000);
          return;
        }
        const newData = { current: 1, total };
        setPageData(newData);
      };
      checkPages();
    }, [pdfUrl]);

    const handleAddingChange = (value: AddingType | null) => {
        let addingOption: any = {};
        if (adding.isAdding && !(value !== adding.type)) {
            addingOption = { isAdding: false, type: null };
        } else {
            addingOption = { isAdding: true, type: value };
        }
        setAdding(addingOption);
        pdfRef.current?.addingRect(addingOption);
    };

    const resetAdding = () => {
        setAdding({ isAdding: false, type: null });
    };

    const handleZoomChange = (value: number) => {
        if (value === zoom) return;
        if (value < 0.4 || value > 4) return;
        setZoom(value);
    };

    const handlePageChange = (value: number) => {
        if (value < 1) return;
        if (value > pageData.total) return;
        if (value === pageData.current) return;
        const newData = {
            current: value,
            total: pdfRef.current?.getPageAmount() || 1,
        };

        setPageData(newData);
    };

    const handleRotate = () => {
        pdfRef.current?.rotatePDF();
    };

    const handleTemplateChange = (value: string) => {
        console.log("handleTemplateChange", value);
    };

    return (
        <div className="w-full h-[100vh] flex flex-col">
            <Header
                project={project}
                takeOff={takeOff}
                selectedFileId={selectedFileId}
                setSelectedFileId={setSelectedFileId}
                onSend={handleAnalyzePdf}
            />

            <div className={`flex-1 flex overflow-hidden flex-col`}>
                <div className="w-full flex flex-col">
                    <PdfTitle
                        adding={adding}
                        handleAddingChange={handleAddingChange}
                        zoom={zoom}
                        handleZoomChange={handleZoomChange}
                        page={pageData.current}
                        totalPages={pageData.total}
                        handlePageChange={handlePageChange}
                        handleRotate={handleRotate}
                        templates={templates}
                    />
                </div>
                <div
                    className={`flex-1 flex flex-col overflow-hidden pt-8`}
                >
                    <PdfWrapper
                        ref={pdfRef}
                        operationMode={'edit'}
                        mode="edit"
                        typeList={[]}
                        pdfUrl={pdfUrl as string}
                        project_id={projectId}
                        project_file_id={selectedFileId}
                        zoom={zoom}
                        page={pageData.current}
                        allEvidence={fileEvidence}
                        onRefreshEvidence={()=>{
                            getFileEvidences(selectedFileId);
                        }}
                        resetAdding={resetAdding}
                    ></PdfWrapper>
                </div>
            </div>
        </div>
    );
};

export default Identification;

type PdfTitleProps = {
    adding: Adding;
    handleAddingChange: (value: AddingType | null) => void;
    zoom: number;
    handleZoomChange: (value: number) => void;
    page: number;
    totalPages: number;
    handlePageChange: (value: number) => void;
    handleRotate: () => void;
    templates?: Template[];
};

const PdfTitle = ({
    adding,
    handleAddingChange,
    zoom,
    handleZoomChange,
    page,
    totalPages,
    handlePageChange,
    handleRotate,
    templates,
}: PdfTitleProps) => {
    const router = useRouter();
    return (
        <div className="flex justify-between px-14 py-4">
            <div className="flex gap-2 items-center">
                <div className="flex gap-1 items-center">
                    <p className="text-forumBlue text-xs">Reading Prompt</p>
                    <Popover
                        placement="bottomLeft"
                        showArrow={false}
                        title={
                            <p className="text-xs text-basicGray font-bold">Reading Prompt</p>
                        }
                        content={
                            <p className="w-60 text-xs text-basicGray">
                                Customize the fields Cato uses to read your PDF. Create
                                specialized templates to accurately capture data for different
                                takeoff types (e.g., steel vs. aluminum).
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
                    <Select className="w-60 h-6" defaultValue="standard">
                        <Select.Option key={"standard"} value="standard">
                            <div className="flex items-center text-basicGray text-xs h-6">
                                Standard
                            </div>
                        </Select.Option>
                        {templates?.map((template: Template) => (
                            <Select.Option value={template.id.toString()} key={template.id}>
                                <div className="flex items-center text-basicGray text-xs h-6">
                                    {template.name}
                                </div>
                            </Select.Option>
                        ))}
                        <Select.Option key={"edit"}>
                            <div
                                className="flex items-center justify-between text-forumBlue text-xs h-6"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    router.push(`/prompts`);
                                }}
                            >
                                <p>Edit Prompts</p>
                                <p>+</p>
                            </div>
                        </Select.Option>
                    </Select>
                </ConfigProvider>
                <div className="flex gap-3 items-center rounded-lg border border-primaryN30 overflow-hidden px-1">
                    <div
                        className={`h-full py-2 w-2 flex items-center justify-center ${
                        page === 1 ? "cursor-default opacity-50" : "cursor-pointer"
                        }`}
                        onClick={() => handlePageChange(page - 1)}
                    >
                        <Image
                            src="/assets/icons/arrow-left-gray.svg"
                            alt="arrow left icon"
                            width={6}
                            height={6}
                        />
                    </div>
                    <p className="text-basicGray text-xxs">Page {page}</p>
                    <div
                        className={`h-full py-2 w-2 flex items-center justify-center ${
                        page === totalPages
                            ? "cursor-default opacity-50"
                            : "cursor-pointer"
                        }`}
                        onClick={() => handlePageChange(page + 1)}
                    >
                        <Image
                            src="/assets/icons/arrow-right-gray.svg"
                            alt="arrow right icon"
                            width={6}
                            height={6}
                        />
                    </div>
                </div>
                <div
                className={`rounded pl-1 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 ${
                    adding.isAdding && adding.type === "Item"
                    ? "text-forumBlue bg-primaryN30"
                    : "text-basicGray bg-primaryN20"
                }`}
                onClick={() => handleAddingChange("Item")}
                >
                <p className="text-xs text-center w-20">Add Item</p>
                <Image
                    src={`/assets/icons/add-table${
                    adding.isAdding && adding.type === "Item" ? "-blue" : ""
                    }.svg`}
                    alt="add item icon"
                    width={14}
                    height={14}
                />
                </div>
                <div
                className={`rounded pl-1 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 ${
                    adding.isAdding && adding.type === "Table"
                    ? "text-accentIndigo bg-primaryN30"
                    : "text-basicGray bg-primaryN20"
                }`}
                onClick={() => handleAddingChange("Table")}
                >
                <p className="text-xs text-center w-20">Add Table</p>
                <Image
                    src={`/assets/icons/add-table${
                    adding.isAdding && adding.type === "Table" ? "-indigo" : ""
                    }.svg`}
                    alt="add item icon"
                    width={14}
                    height={14}
                />
                </div>
                <div
                    className={`rounded pl-3 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 bg-primaryN20 text-basicGray`}
                    onClick={() => handleRotate()}
                >
                    <p className="text-xs text-center">Rotate</p>
                </div>
            </div>
            <div className="flex flex-row">
                <div
                className="w-7 h-6 flex justify-center items-center rounded-tl-xl rounded-bl-xl bg-primaryGray cursor-pointer text-baseGray"
                onClick={() => {
                    handleZoomChange(zoom - 0.1);
                }}
                >
                -
                </div>
                <div
                className="w-7 h-6 flex justify-center items-center rounded-tr-xl rounded-br-xl bg-primaryGray cursor-pointer text-baseGray"
                style={{ marginLeft: 1 }}
                onClick={() => handleZoomChange(zoom + 0.1)}
                >
                +
                </div>

                <span
                className="ml-4 flex items-center justify-center rounded-md text-center text-basicDarkGray text-[10px] border border-solid border-primaryN30"
                style={{
                    width: 54,
                    height: 24,
                }}
                >
                {(zoom * 100).toFixed(0) + "%"}
                </span>
            </div>
        </div>
    );
};
