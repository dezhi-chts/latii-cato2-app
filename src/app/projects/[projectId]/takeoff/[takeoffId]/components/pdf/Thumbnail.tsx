import React, { useEffect, useRef, useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import { notification, Select, Dropdown, Space } from "antd";
import { DownOutlined } from "@ant-design/icons";
import LabelTypesSelect from "./Label-Types-Select";
import { allPageTypes, PageType } from "../../types/evidence";
const LazyImage = ({
  src,
  alt,
  size, // 缩略图大小
  onError,
}: {
  src: string;
  alt: string;
  size: "normal" | "larger"; // 缩略图大小
  onError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = src;
          setLoaded(true);

          observer.disconnect();
        }
      },
      {
        rootMargin: "100px",
        threshold: 0.01,
      },
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <div
      className="w-full relative overflow-hidden"
      style={{
        height: size === "normal" ? "100px" : "160px",
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 w-[100%] h-[100%] bg-gray-300 animate-pulse"></div>
      )}
      <img
        ref={imgRef}
        alt={alt}
        className={`w-full h-full object-top transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onError={onError}
        loading="lazy"
      />
    </div>
  );
};

interface ThumbnailProps {
  pdfRef?: any; // pdf 实例
  showThumbnail: boolean; // 是否显示缩略图
  setShowThumbnail: (showThumbnail: boolean) => void; // 设置是否显示缩略图
  data: {
    // 缩略图数据列表
    page: number; // 页面编号
    file_name: string;
    s3_key: string;
    s3_url: string;
    type: string; // 页面类型
  }[];
  page: number; // 当前选中的页面
  setPage: (page: number) => void; // 设置当前选中的页面
  fixed?: boolean; // 是否固定位置
  showCategory?: boolean; // 是否显示分类
  showShadow?: boolean; // 是否显示阴影
  size?: "normal" | "larger"; // 缩略图大小
  categoryList?: any[]; // 页面分类
}

const Thumbnail = ({
  pdfRef,
  showThumbnail,
  setShowThumbnail,
  data,
  page,
  setPage,
  fixed = false, // 是否固定位置
  showCategory = false, // 是否显示分类
  size = "normal", // 缩略图大小
  categoryList = [], // 页面分类
  showShadow = true, // 是否显示阴影
}: ThumbnailProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showThumbnail) {
      let id = `thumbnail-page-${page}`;
      const targetThumbnail = document.getElementById(id);
      if (!targetThumbnail) return;
      if (targetThumbnail && scrollContainerRef.current) {
        // 计算滚动容器的当前滚动位置和高度
        const scrollTop = scrollContainerRef.current.scrollTop;
        const containerHeight = scrollContainerRef.current.clientHeight;

        // 计算目标缩略图在滚动容器内的位置
        const targetTop = targetThumbnail.offsetTop;
        const targetBottom = targetTop + targetThumbnail.clientHeight;

        // 判断目标是否在滚动容器的可视区域内
        // 可视区域的范围是 [scrollTop, scrollTop + containerHeight]
        const isInViewport =
          targetTop >= scrollTop && targetBottom <= scrollTop + containerHeight;

        // 如果目标不在可视区域内，则执行滚动
        if (!isInViewport) {
          scrollContainerRef.current.scrollTo({
            top: targetThumbnail.offsetTop - 50,
            behavior: "smooth",
          });
        }
      }
    }
  }, [page, showThumbnail]);

  const onChangePage = async (page: number) => {
    let unSaved = await pdfRef?.current?.checkAndHandleUnsavedCrops?.();
    if (!pdfRef?.current || unSaved) {
      setPage(page);
    }
  };

  const getItemPage = (item: any, index: number) => {
    if (typeof item.file_name === "string") {
      let pageArr = item.file_name?.split(".")[0];
      return parseInt(pageArr) + 1;
    }
    return index + 1;
  };

  const pageTypeInfo = (info: any) => {
    let category = categoryList.find((item) => {
      return (
        item.type === info.type ||
        item.type.toUpperCase() === info.type?.toUpperCase()
      );
    });
    if (!category) return {};
    return category || {};
  };

  return (
    <div
      className={`${fixed ? "absolute" : ""} top-0 right-0 transition-all duration-200 bg-white z-9999`}
      style={{
        width: showThumbnail ? "250px" : "0px",
        height: "100%",
      }}
    >
      {/* <div className="mr-2 mt-1 text-right">
        <CloseOutlined
          style={{ color: "black", cursor: "pointer" }}
          onClick={() => {
            setShowThumbnail(false);
          }}
        />
      </div> */}
      <div
        className={`w-full h-full pb-8 overflow-y-auto relative  ${showShadow ? "shadow-inner" : ""}`}
        ref={scrollContainerRef}
      >
        <div className="py-6 flex flex-col gap-4 min-h-full items-center">
          {data?.length > 0 &&
            data.map((info, index) => {
              let itemPageNum = getItemPage(info, index);
              let {
                color = allPageTypes[PageType.NotUsed].color,
                icon = allPageTypes[PageType.NotUsed].icon,
              } = pageTypeInfo(info);
              return (
                <div
                  id={`thumbnail-page-${itemPageNum}`}
                  key={info.s3_key}
                  className={`w-[170px] rounded-md bg-primaryN20 shadow-md cursor-pointer border-[2px] ${
                    itemPageNum === page
                      ? "border-forumBlue-normal"
                      : "border-transparent hover:border-forumBlue-normal/50"
                  }`}
                  style={{
                    height: size === "normal" ? "150px" : "220px",
                  }}
                  onClick={() => onChangePage(itemPageNum)}
                >
                  <div className="p-[10px]">
                    <div className="h-[30px] flex flex-row justify-between">
                      <p className="mb-3 text-xxs text-grey-normal">
                        {itemPageNum}
                      </p>
                      {showCategory && (
                        <div
                          className="w-[42px] h-[18px] flex items-center justify-center rounded text-xxs text-white"
                          style={{ backgroundColor: color }}
                        >
                          <span>{icon}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <LazyImage
                        src={info.s3_url || ""}
                        alt={info.file_name}
                        size={size}
                        onError={(e) => {
                          e.currentTarget.src =
                            "/assets/placeholder-images/example_1.png";
                        }}
                      />
                    </div>
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
