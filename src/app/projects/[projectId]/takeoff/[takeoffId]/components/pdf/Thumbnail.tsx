import React, { useEffect, useRef, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import { notification } from "antd";
const LazyImage = ({
  src,
  alt,
  onError,
}: {
  src: string;
  alt: string;
  onError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          imgRef.current!.src = src;
          setLoaded(true);

          observer.disconnect();
        }
      },
      {
        rootMargin: "100px",
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <div className="w-full h-[137px] relative overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 w-[100%] h-[100%] bg-gray-300 animate-pulse"></div>
      )}
      <img
        ref={imgRef}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"
          }`}
        onError={onError}
        loading="lazy"
      />
    </div>
  );
};

const Thumbnail = ({
  pdfRef,
  showThumbnail,
  setShowThumbnail,
  data,
  page,
  setPage,
}: {
  pdfRef?: any;
  showThumbnail: boolean;
  setShowThumbnail: (showThumbnail: boolean) => void;
  data: {
    file_name: string;
    s3_key: string;
    s3_url: string;
  }[];
  page: number;
  setPage: (page: number) => void;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (showThumbnail && thumbnailRefs.current[page - 1]) {
      const targetThumbnail = thumbnailRefs.current[page - 1];
      if (targetThumbnail && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: targetThumbnail.offsetTop - 50,
          behavior: "smooth",
        });
      }
    }
  }, [page, showThumbnail]);

  return (
    <div
      className="absolute py-2 right-0 top-0 transition-all duration-200 z-9999 bg-white border-l border-primaryN30 shadow-lg shadow-primaryN30"
      style={{
        width: showThumbnail ? "310px" : "0px",
        height: "100%",
      }}
    >
      <div className="mr-2 mt-1 text-right">
        <CloseOutlined
          style={{ color: "black", cursor: "pointer" }}
          onClick={() => {
            setShowThumbnail(false);
          }}
        />
      </div>
      <div
        className="w-full h-full pb-8 overflow-y-auto"
        ref={scrollContainerRef}
      >
        <div className="px-[35px] flex flex-col gap-4 min-h-full">
          {data.map((info, index) => {
            return (
              <div
                key={info.s3_key}
                className={`w-[240px] h-[187px] rounded bg-primaryN50 shadow-md cursor-pointer border-[2px] ${index + 1 === page
                  ? "border-forumBlue"
                  : "border-transparent hover:border-forumBlue/50"
                  }`}
                onClick={() => {
                  if (typeof pdfRef !== "undefined") {
                    pdfRef?.current
                      ?.checkAndHandleUnsavedCrops?.()
                      .then((unsaved: boolean) => {
                        if (unsaved) {
                          setPage(index + 1);
                        }
                      });
                    return;
                  }

                  setPage(index + 1);
                }}
                ref={(el) => {
                  thumbnailRefs.current[index] = el;
                }}
              >
                <div className="p-[10px]">
                  <p className="mb-3 text-xxs text-basicGray">{index + 1}</p>
                  <LazyImage
                    src={info.s3_url}
                    alt={info.file_name}
                    onError={(e) => {
                      e.currentTarget.src =
                        "/assets/placeholder-images/placeholder.png";
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Thumbnail;
