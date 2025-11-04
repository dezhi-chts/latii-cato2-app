"use client";
import Header from "./components/Header";
import { useParams, useRouter } from "next/navigation";
import { Button, ConfigProvider, Divider, Popover, Select } from "antd";

import { useCallback, useEffect, useRef, useState } from "react";
import { useProjects } from "@/context/ProjectsContext";
import { getTakeOffById } from "@/services/takeOffService";
import Image from "next/image";
import PDFSelector from "./components/Markable-Pdf";
import { getEvidencesByProjectId } from "@/services/evidenceService";
import PdfWrapper from "./components/PdfWrapper";
import { Template } from "@/types/templates";
import { getTemplates } from "@/services/templateService";
import ItemsTableSection from "./components/Items-table-section";

const options = [
  { value: "standard", label: "Standard" },
  { value: "steel", label: "Steel Reading" },
  { value: "aluminum", label: "Aluminum Reading" },
  { value: "edit", label: "Edit Prompts", extra: "+" },
];
type AddingType = "Item" | "Table";
export type Adding = {
  isAdding: boolean;
  type: AddingType | null;
};

export type PageData = {
  current: number;
  total: number;
};

const Quotii = () => {
  const order = Number(useParams().projectId);
  const takeOffId = useParams().takeoffId;
  const { projects } = useProjects();
  const project = projects.find((p) => p.order === order);
  const pdfRef = useRef<{
    handleSend: () => void;
    getPageAmount: () => number;
  }>(null);

  const [selectedFileId, setSelectedFileId] = useState<number>(0);
  const [takeOff, setTakeOff] = useState<any>();
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [isNewTakeOff, setIsNewTakeOff] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [adding, setAdding] = useState<Adding>({
    isAdding: false,
    type: "Item",
  });
  // const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState({
    current: 1,
    total: 1,
  });

  const [isTableExpanded, setIsTableExpanded] = useState(false);

  console.log(takeOff);

  const [evidences, setEvidences] = useState<any>([]);

  const [templates, setTemplates] = useState<Template[]>([]);

  async function fetchTemplates() {
    const response = await getTemplates();
    setTemplates(response.data?.items as Template[]);
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  const getEvidences = useCallback(async () => {
    const projectId = project?.project_id?.toString();
    const response = await getEvidencesByProjectId(projectId as string);
    if (response.status === "success") {
      setEvidences(response.data);
    }
  }, [project]);

  const getTakeOff = useCallback(async () => {
    const response = await getTakeOffById(takeOffId as string);
    if (response.status === "success") {
      setTakeOff(response.data);
      const isNew = response.data?.take_off_result?.status === 1;
      setIsNewTakeOff(isNew);
      const newPdfUrl =
        response.data?.project_files[0]?.parse_detail?.uploaded_file_url;
      setPdfUrl(newPdfUrl);
    }
  }, [takeOffId]);

  useEffect(() => {
    if (pdfRef.current) {
      resetAdding();
      pdfRef.current.resetAllInfo();
    }

    const newPdfUrl =
      takeOff?.project_files[selectedFileId]?.parse_detail?.uploaded_file_url;
    setPdfUrl(newPdfUrl);
  }, [selectedFileId]);

  useEffect(() => {
    if (takeOffId) getTakeOff();
  }, [takeOffId]);

  useEffect(() => {
    if (project) getEvidences();
  }, [project]);

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
    let addingOption: Adding = {};
    if (adding.isAdding && !(value !== adding.type)) {
      addingOption = { isAdding: false, type: null };
    } else {
      addingOption = { isAdding: true, type: value };
    }
    setAdding(addingOption);
    pdfRef.current?.addingRect(addingOption);
  };

  const resetAdding = () => {
    console.log("##########  resetAdding ");
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
    pdfRef.current?.handleRotate();
  };

  return (
    <div className="w-full h-[100vh] flex flex-col">
      <Header
        project={project}
        takeOff={takeOff}
        selectedFileId={selectedFileId}
        setSelectedFileId={setSelectedFileId}
        isNew={isNewTakeOff}
        onSend={handleAnalyzePdf}
      />

      <div
        className={`flex-1 flex overflow-hidden ${
          isNewTakeOff ? "flex-col" : "flex-row pr-4"
        } `}
      >
        {!isNewTakeOff && (
          <div
            className={`${
              isTableExpanded ? "w-4/5" : "w-3/5"
            } pl-10 flex gap-2 transition-all duration-300 ease-in-out`}
          >
            <ItemsTableSection takeOff={takeOff} />

            <div className="flex items-center h-[80vh] relative mx-5">
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
          </div>
        )}
        {isNewTakeOff && (
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
        )}

        <div
          className={`flex-1 flex overflow-hidden pt-8 ${
            isNewTakeOff ? "w-full" : isTableExpanded ? "w-2/5" : "w-1/5"
          }`}
        >
          <PdfWrapper
            ref={pdfRef}
            pdfUrl={pdfUrl as string}
            project_id={project?.project_id}
            project_file_id={takeOff?.project_files[selectedFileId]?.id || ""}
            zoom={zoom}
            page={pageData.current}
            allEvidence={evidences}
            onRefreshEvidence={getEvidences}
            resetAdding={resetAdding}
          ></PdfWrapper>
        </div>
      </div>
    </div>
  );
};

export default Quotii;

type PdfTitleProps = {
  adding: Adding;
  handleAddingChange: (value: AddingType | null) => void;
  zoom: number;
  handleZoomChange: (value: number) => void;
  page: number;
  totalPages: number;
  handlePageChange: (value: number) => void;
  handleRotate: () => void;
  templates: Template[];
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
