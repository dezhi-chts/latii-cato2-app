"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, ConfigProvider, Divider, Popover, Select, notification } from "antd";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { getTakeOffsDetails } from "@/services/takeOffService";
import { getEvidenceByFileId } from "@/services/evidenceService";
import { fetchProject } from "@/services/projectService";

import Header from "./components/Header";
import ItemsTable from "./components/ItemsTable";
import PdfWrapper from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/pdf/PdfWrapper";


export type PageData = {
    current: number;
    total: number;
};

const Analyze = () => {
    const order = Number(useParams().projectId);
    const takeOffId = useParams().takeoffId;
    const searchParams = useSearchParams();
    const projectId = searchParams.get('_pId') || '';
    const pdfRef = useRef<{
        handleSend: () => void;
        getPageAmount: () => number;
        resetAllInfo: () => void;
        rotatePDF: () => void;
    }>(null);

    const [selectedFileId, setSelectedFileId] = useState<number>(-1);
    const [takeOff, setTakeOff] = useState<any>();
    const [pdfUrl, setPdfUrl] = useState<string>();
    const [zoom, setZoom] = useState(1);
    const [pageData, setPageData] = useState({
        current: 1,
        total: 1,
    });

    const [isTableExpanded, setIsTableExpanded] = useState(false);

    const [fileEvidence, setFileEvidence] = useState<any>([]);
    const [project, setProject] = useState<any>({});

    useEffect(() => {
        if (takeOffId) getTakeOff();
    }, [takeOffId]);

    useEffect(() => {
        getProjectInfo();
    }, [projectId]);

    const getFileEvidences = async (fileId?: number) => {
        const response = await getEvidenceByFileId(projectId, fileId as number);
        if (response.status === "success") {
            setFileEvidence(response.data);
        } else {
            notification.error({
                message: "Error",
                description: "Failed to get file evidence",
            })
        }
    };

    const getProjectInfo = async () => {
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
        const response = await getTakeOffsDetails(takeOffId as string);
        if (response.status === "success") {
            let res = response.data;
            const exist = res?.take_off_result?.status === 2;
            if (exist) {
                setTakeOff(res);
                if (res?.project_files?.length > 0) {
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
        if (pdfRef.current) {
            pdfRef.current.resetAllInfo();
        }

        //reset page
        setPageData({ current: 1, total: 1 });

        //设置新的url
        let file = takeOff?.project_files.find((file: any) => file.id === selectedFileId);
        if (file) {
            let newPdfUrl = file?.parse_detail?.uploaded_file_url;
            setPdfUrl(newPdfUrl);
            //获取file evidence
            getFileEvidences(selectedFileId);
        }
    }, [selectedFileId]);

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
            />

            <div className={`flex-1 flex overflow-hidden flex-row pr-4`}>
                <div
                    className={`${isTableExpanded ? "w-4/5" : "w-3/5"
                        } pl-10 flex gap-2 transition-all duration-300 ease-in-out`}
                >
                    <ItemsTable
                        takeOff={takeOff}
                        selectedFileId={selectedFileId}
                        onRefreshItems={getTakeOff}
                    />
                </div>
                <div className="flex items-center relative mx-5">
                    <Divider type="vertical" className="h-full bg-primaryN30" />
                    <div className="absolute left-1/2 transform -translate-x-1/2 top-5 flex items-center border border-primaryN30 rounded-full bg-white overflow-hidden">
                        <div
                            className="px-2 rounded-l-lg hover:bg-primaryN10 cursor-pointer text-basicLightGray font-light"
                            onClick={() => setIsTableExpanded(false)}
                        >
                            {"<"}
                        </div>
                        <div
                            className="px-2 rounded-r-lg hover:bg-primaryN10 cursor-pointer text-basicLightGray font-light"
                            onClick={() => setIsTableExpanded(true)}
                        >
                            {">"}
                        </div>
                    </div>
                </div>

                <div className={`flex-1 flex flex-col overflow-hidden pt-8`}>
                    <div className="h-auto">
                        <PdfButtons
                            zoom={zoom}
                            handleZoomChange={handleZoomChange}
                            page={pageData.current}
                            totalPages={pageData.total}
                            handlePageChange={handlePageChange}
                            handleRotate={handleRotate}
                        >
                        </PdfButtons>
                    </div>
                    <PdfWrapper
                        ref={pdfRef}
                        operationMode={'view'}
                        pdfUrl={pdfUrl as string}
                        project_id={projectId}
                        project_file_id={selectedFileId}
                        zoom={zoom}
                        page={pageData.current}
                        allEvidence={fileEvidence}
                        onRefreshEvidence={getFileEvidences}
                    ></PdfWrapper>
                </div>
            </div>
        </div>
    );
};

export default Analyze;

type PdfTitleProps = {
    zoom: number;
    handleZoomChange: (value: number) => void;
    page: number;
    totalPages: number;
    handlePageChange: (value: number) => void;
    handleRotate: () => void;
};

const PdfButtons = ({
    zoom,
    handleZoomChange,
    page,
    totalPages,
    handlePageChange,
    handleRotate,
}: PdfTitleProps) => {
    const router = useRouter();
    return (
        <div className="flex justify-end px-14 py-4 gap-4">
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
            <div className="flex gap-3 items-center rounded-lg border border-primaryN30 overflow-hidden px-1">
                <div
                    className={`h-full py-2 w-2 flex items-center justify-center ${page === 1 ? "cursor-default opacity-50" : "cursor-pointer"
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
                    className={`h-full py-2 w-2 flex items-center justify-center ${page === totalPages
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
                className={`rounded pl-3 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 bg-primaryN20 text-basicGray`}
                onClick={() => handleRotate()}
            >
                <p className="text-xs text-center">Rotate</p>
            </div>
        </div>
    );
};
