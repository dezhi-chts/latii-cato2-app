import { useEffect, useRef, useState } from "react";
import SourcesHeader from "./SourcesHeader";
import { Category, ModalsRenderProps, SourcesProps } from "@/types/sources";
import CategoriesRender from "./CategoriesRender";
import Image from "next/image";
import { Divider } from "antd";
import Button from "@/components/Button";
import DocumentModal from "./modals/DocumentModal";
import WeblinkModal from "./modals/WeblinkModal";
import VideoModal from "./modals/VideoModal";
import TextModal from "./modals/TextModal";
import { ProjectRow } from "@/types/home";

const sources: any = {
  documents: [
    {
      label: "OS2 Technical Document",
      extension: "pdf",
    },
    {
      label: "EBE Technical Document",
      extension: "pdf",
    },
    {
      label: "Installation Manual for Technical Document",
      extension: "pdf",
    },
  ],
  weblinks: [
    {
      link: "Brombal Website - New Technology",
      label: "Brombal Website - New Technology",
    },
    {
      link: "Brombal Website - New Technology",
      label: "Brombal Website - New Technology",
    },
    {
      link: "Brombal Website - New Technology",
      label: "Brombal Website - New Technology",
    },
  ],
  videos: [
    {
      label: "Windows 101: Costs & What They're Made Of",
      image: "/assets/images/sources-images/source1.png",
    },
    {
      label: "Double Glazed Windows Manufacturing Process. Sliding...",
      image: "/assets/images/sources-images/source2.png",
    },
    {
      label: "Window Install & Flashing - Jeld Wen in Zip System",
      image: "/assets/images/sources-images/source3.png",
    },
    {
      label: "How Windows Are Built- Factory Tour at Custom Vinyl Products W..",
      image: "/assets/images/sources-images/source4.png",
    },
    {
      label: "Sliding Window Mass Production Factory",
      image: "/assets/images/sources-images/source5.png",
    },
  ],
  text: [
    {
      label: "Detail Information on Impact Glass",
    },
    {
      label: "Detail Information on Impact Glass",
    },
    {
      label: "Detail Information on Impact Glass",
    },
  ],
};

const Sources = ({ isOpen, setIsOpen }: SourcesProps) => {
  const [selectedCategory, setSelectedCategory] =
    useState<Category>("documents");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isFullyOpen, setIsFullyOpen] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(false);
    if (!isOpen) setIsOpen(true);
  };

  useEffect(() => {
    if (!isModalOpen) {
      setData(null);
    }
  }, [isModalOpen]);

  const divRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(0);
  useEffect(() => {
    const element = divRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      setWidth(element.offsetWidth);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const closePercentage = 40;
    const closeValue = (390 * closePercentage) / 100;
    setIsFullyOpen(width >= closeValue && isOpen);
  }, [isOpen, width]);

  function getSources() {
    if (selectedCategory === "all") {
      return sources;
    }
    return sources[selectedCategory];
  }

  return (
    <div
      ref={divRef}
      className={`${
        isOpen ? "w-[390px]" : "w-[60px]"
      } border-primaryN30 border rounded-xl h-full flex flex-col justify-between pb-6 transition-all duration-700 ease-in-out`}
    >
      <div>
        <SourcesHeader handleToggle={handleToggle} isOpen={isFullyOpen} />

        <div
          className={`pt-6 flex flex-wrap gap-4 ${
            isFullyOpen ? "px-4" : "items-center flex-col "
          }`}
        >
          <CategoriesRender
            selectedCategory={selectedCategory}
            handleCategoryChange={handleCategoryChange}
            isOpen={isFullyOpen}
          />
        </div>
        {isFullyOpen && <Divider className="mb-2" />}
        {isFullyOpen && (
          <div className="text-xs font-light px-4 py-4 overflow-auto max-h-[40vh] scrollbar-hidden">
            <SourcesRender
              sources={getSources()}
              selectedCategory={selectedCategory}
              setData={setData}
              setIsModalOpen={setIsModalOpen}
            />
          </div>
        )}
      </div>
      {isFullyOpen && selectedCategory !== "all" && (
        <div className="px-8 flex flex-col gap-3">
          <Button
            variant="outline"
            borderColor="forumBlue-normal"
            className="!py-0 w-full"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Source
          </Button>
          {selectedCategory === "videos" && (
            <p className="text-xs font-light text-grey-normal">
              You can upload a maximum of 50 videos for Lucius.
            </p>
          )}
          {selectedCategory === "documents" && (
            <p className="text-xs font-light text-grey-normal text-center truncate">
              You can upload a maximum of 10 files for Lucius.
            </p>
          )}
        </div>
      )}
      {isOpen && (
        <ModalsRender
          isModalOpen={isModalOpen}
          selectedCategory={selectedCategory}
          setIsModalOpen={setIsModalOpen}
          data={data}
        />
      )}
    </div>
  );
};

export default Sources;

const SourcesRender = ({
  sources,
  selectedCategory,
  setData,
  setIsModalOpen,
}: any) => {
  const handleClick = (source: any) => {
    setData(source);
    setIsModalOpen(true);
  };

  if (selectedCategory === "all") {
    const newSources = [
      ...sources.documents.map((item: ProjectRow) => ({
        ...item,
        sourceType: "documents" as const,
      })),
      ...sources.weblinks.map((item: ProjectRow) => ({
        ...item,
        sourceType: "weblinks" as const,
      })),
      ...sources.videos.map((item: ProjectRow) => ({
        ...item,
        sourceType: "videos" as const,
      })),
      ...sources.text.map((item: ProjectRow) => ({
        ...item,
        sourceType: "text" as const,
      })),
    ];

    function getIconSrc(source: ProjectRow): string {
      const type = source.sourceType;
      if (type === "documents") {
        return `/assets/icons/extensions/${source.extension || "pdf"}.svg`;
      }
      if (type === "weblinks") {
        return "/assets/icons/link.svg";
      }
      if (type === "videos") {
        return "/assets/icons/sources-icons/videos.svg";
      }
      if (type === "text") {
        return "/assets/icons/text.svg";
      }
      return "/assets/icons/sources-icons/all.svg";
    }

    return (
      <div className="flex flex-col gap-2">
        {newSources.map((source: any, index: number) => {
          const iconSrc = getIconSrc(source);

          return (
            <div
              key={index}
              className="flex gap-3 items-center text-xs font-light hover:bg-primaryN20 cursor-pointer p-1 rounded"
              onClick={() => handleClick(source)}
            >
              <Image
                src={iconSrc}
                alt={`${source.extension} icon`}
                width={16}
                height={16}
                className="h-4 w-4"
              />
              <p className="truncate">{source.label}</p>
            </div>
          );
        })}
      </div>
    );
  }

  if (selectedCategory === "documents") {
    return (
      <div className="flex flex-col gap-2">
        {sources.map((source: any, index: number) => (
          <div
            key={index}
            className="flex gap-3 items-center text-xs font-light hover:bg-primaryN20 cursor-pointer p-1 rounded"
            onClick={() => handleClick(source)}
          >
            <Image
              src={`/assets/icons/extensions/${source.extension}.svg`}
              alt={`${source.extension} icon`}
              width={16}
              height={16}
              className="h-4 w-4"
            />
            <p className="truncate">{source.label}</p>
          </div>
        ))}
      </div>
    );
  }

  if (selectedCategory === "weblinks") {
    return (
      <div className="flex flex-col gap-2">
        {sources.map((source: any, index: number) => (
          <div
            key={index}
            className="flex gap-3 items-center cursor-pointer p-1 text-xs font-light"
          >
            <Image
              src="/assets/icons/link.svg"
              alt="Link icon"
              width={16}
              height={16}
              className="h-4 w-4 hover:opacity-70"
            />
            <p
              className="underline truncate hover:text-forumBlue-normal"
              onClick={() => handleClick(source)}
            >
              {source.label}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (selectedCategory === "videos") {
    return (
      <div className="flex flex-wrap gap-4">
        {sources.map((source: any, index: number) => (
          <div
            key={index}
            className="flex flex-col rounded-xl w-[calc(50%-0.5rem)] overflow-hidden cursor-pointer hover:bg-primaryN10"
            onClick={() => handleClick(source)}
          >
            <Image
              src={source.image}
              alt="Video placeholder"
              width={164}
              height={87}
              className="w-auto h-[87px] object-cover"
            />
            <p className="text-[8px] line-clamp-2 px-2 py-0.5 border border-t-0 border-primaryN30 rounded-xl rounded-t-none">
              {source.label}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (selectedCategory === "text") {
    return (
      <div className="flex flex-col gap-2">
        {sources.map((source: any, index: number) => (
          <div
            key={index}
            className="flex gap-3 items-center hover:bg-primaryN20 cursor-pointer p-1 rounded"
            onClick={() => handleClick(source)}
          >
            <Image
              src="/assets/icons/text.svg"
              alt="source image"
              width={16}
              height={16}
              className="h-4 w-4"
            />
            <p className="text-xs">{source.label}</p>
          </div>
        ))}
      </div>
    );
  }
};

const ModalsRender = ({
  isModalOpen,
  selectedCategory,
  setIsModalOpen,
  data,
}: ModalsRenderProps) => {
  if (!isModalOpen) return null;

  const getAllModal = () => {
    if (data.sourceType === "documents") return DocumentModal;
    if (data.sourceType === "weblinks") return WeblinkModal;
    if (data.sourceType === "videos") return VideoModal;
    if (data.sourceType === "text") return TextModal;
    else return DocumentModal;
  };

  const modalsMap: Record<Category, React.FC<any>> = {
    documents: DocumentModal,
    weblinks: WeblinkModal,
    videos: VideoModal,
    text: TextModal,
    all: getAllModal(),
  };

  const ModalComponent = modalsMap[selectedCategory];

  return ModalComponent ? (
    <ModalComponent
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      data={data}
    />
  ) : null;
};
