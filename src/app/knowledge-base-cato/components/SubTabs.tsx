"use client";

import { useRef, useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { FieldEditorModal } from "./FieldEditorModal";


interface SubTab {
  name: string,
  field_type: "string" | "number",
  config_json: {
    extraction_rules: [
      "Extract from allowed list"
    ]
  },
  id: number,
  template_id: number,
  field_index: number
}

interface SubTabsProps {
  templateId: number;
  tabs: SubTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  onAddField?: () => void;
}

export const SubTabs = ({
  templateId,
  tabs,
  activeTab,
  onTabChange,
  onAddField,
}: SubTabsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollbarTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingScrollbarRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrollbarThumbWidth, setScrollbarThumbWidth] = useState(0);
  const [scrollbarThumbOffset, setScrollbarThumbOffset] = useState(0);
  const [showCustomScrollbar, setShowCustomScrollbar] = useState(false);

  // 检查滚动位置，更新箭头显示状态
  const checkScrollPosition = () => {
    const scrollElement = scrollRef.current;
    const scrollbarTrackElement = scrollbarTrackRef.current;

    if (!scrollElement) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollElement;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);

    if (!scrollbarTrackElement) return;

    const trackWidth = scrollbarTrackElement.clientWidth;
    const canScroll = scrollWidth > clientWidth + 1 && trackWidth > 0;
    setShowCustomScrollbar(canScroll);

    if (!canScroll) {
      setScrollbarThumbWidth(0);
      setScrollbarThumbOffset(0);
      return;
    }

    const nextThumbWidth = Math.min(
      Math.max((clientWidth / scrollWidth) * trackWidth, 36),
      trackWidth
    );
    const maxScrollLeft = scrollWidth - clientWidth;
    const maxThumbOffset = trackWidth - nextThumbWidth;
    const nextThumbOffset =
      maxScrollLeft <= 0 || maxThumbOffset <= 0
        ? 0
        : (scrollLeft / maxScrollLeft) * maxThumbOffset;

    setScrollbarThumbWidth(nextThumbWidth);
    setScrollbarThumbOffset(nextThumbOffset);
  };

  // 监听滚动事件
  useEffect(() => {
    const scrollElement = scrollRef.current;
    const scrollbarTrackElement = scrollbarTrackRef.current;

    if (!scrollElement) return;

    const resizeObserver = new ResizeObserver(() => {
      checkScrollPosition();
    });

    scrollElement.addEventListener("scroll", checkScrollPosition, { passive: true });
    resizeObserver.observe(scrollElement);

    if (scrollElement.firstElementChild instanceof HTMLElement) {
      resizeObserver.observe(scrollElement.firstElementChild);
    }

    if (scrollbarTrackElement) {
      resizeObserver.observe(scrollbarTrackElement);
    }

    window.addEventListener("resize", checkScrollPosition);
    checkScrollPosition();

    return () => {
      scrollElement.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, [tabs]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingScrollbarRef.current) return;

      const scrollElement = scrollRef.current;
      const scrollbarTrackElement = scrollbarTrackRef.current;
      if (!scrollElement || !scrollbarTrackElement) return;

      const trackWidth = scrollbarTrackElement.clientWidth;
      const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
      const maxThumbOffset = trackWidth - scrollbarThumbWidth;

      if (maxScrollLeft <= 0 || maxThumbOffset <= 0) return;

      const deltaX = event.clientX - dragStartXRef.current;
      const scrollDelta = (deltaX / maxThumbOffset) * maxScrollLeft;
      const nextScrollLeft = Math.min(
        Math.max(dragStartScrollLeftRef.current + scrollDelta, 0),
        maxScrollLeft
      );

      scrollElement.scrollLeft = nextScrollLeft;
    };

    const handleMouseUp = () => {
      isDraggingScrollbarRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [scrollbarThumbWidth]);

  const handleScrollbarTrackClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const scrollElement = scrollRef.current;
    const scrollbarTrackElement = scrollbarTrackRef.current;
    if (!scrollElement || !scrollbarTrackElement || scrollbarThumbWidth <= 0) return;

    const rect = scrollbarTrackElement.getBoundingClientRect();
    const clickOffset = event.clientX - rect.left;
    const maxThumbOffset = rect.width - scrollbarThumbWidth;
    const nextThumbOffset = Math.min(
      Math.max(clickOffset - scrollbarThumbWidth / 2, 0),
      maxThumbOffset
    );
    const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
    const nextScrollLeft =
      maxThumbOffset <= 0 ? 0 : (nextThumbOffset / maxThumbOffset) * maxScrollLeft;

    scrollElement.scrollTo({
      left: nextScrollLeft,
      behavior: "smooth",
    });
  };

  const handleScrollbarThumbMouseDown = (
    event: ReactMouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    isDraggingScrollbarRef.current = true;
    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = scrollRef.current?.scrollLeft ?? 0;
    document.body.style.userSelect = "none";
  };

  // 处理子 Tab 滚动
  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // 滚动指定 Tab 到可视区域
  const scrollTabIntoView = (tabName: string) => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    // 找到对应的 Tab 按钮
    const tabButtons = scrollElement.querySelectorAll('button');
    let targetButton: Element | null = null;

    tabButtons.forEach((btn) => {
      if (btn.textContent?.trim() === tabName) {
        targetButton = btn;
      }
    });

    if (!targetButton) return;

    const containerRect = scrollElement.getBoundingClientRect();
    const buttonRect = (targetButton as HTMLElement).getBoundingClientRect();

    // 计算 Tab 相对于容器的偏移
    const buttonLeft = buttonRect.left - containerRect.left + scrollElement.scrollLeft;
    const buttonRight = buttonLeft + buttonRect.width;

    const containerScrollLeft = scrollElement.scrollLeft;
    const containerVisibleRight = containerScrollLeft + containerRect.width;

    // 如果 Tab 在左侧被遮挡
    if (buttonLeft < containerScrollLeft) {
      scrollElement.scrollTo({
        left: buttonLeft - 8, // 留一点边距
        behavior: "smooth",
      });
    }
    // 如果 Tab 在右侧被遮挡
    else if (buttonRight > containerVisibleRight) {
      scrollElement.scrollTo({
        left: buttonRight - containerRect.width + 8, // 留一点边距
        behavior: "smooth",
      });
    }
  };

  // 固定显示的前3个Tab
  const fixedTabs = [
    {
      name: "Generations",
      field_type: "string",
    },
    {
      name: "Label",
      field_type: "string",
    },
    {
      name: "Sub Label",
      field_type: "string",
    }
  ];
  // 可滚动的其他Tab
  const otherTabs = tabs.filter((tab: SubTab) => tab.name !== "Generations" && tab.name !== "Label" && tab.name !== "Sub Label");
  const scrollableTabs = [
    ...fixedTabs,
    ...otherTabs
  ];

  const disabelEdit = templateId === 1;

  return (
    <div className="flex flex-row justify-between items-end gap-3">
      <div className="min-w-0 flex-1">
        {/** 自定义滚动条 */}
        <div
          ref={scrollbarTrackRef}
          className={`mb-2 h-2 w-full rounded-full bg-[#ECECEC] transition-opacity ${showCustomScrollbar ? "opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={handleScrollbarTrackClick}
        >
          <div
            className="h-full rounded-full bg-[#D7D7D7] transition-transform duration-75"
            style={{
              width: `${scrollbarThumbWidth}px`,
              transform: `translateX(${scrollbarThumbOffset}px)`,
            }}
            onMouseDown={handleScrollbarThumbMouseDown}
          />
        </div>

        <div className="h-[40px] py-1.5 flex flex-row items-center bg-grey-light px-4 rounded-tl-xl rounded-tr-xl overflow-hidden">
          {/* Fixed Tabs - 前3个Tab固定 */}
          {/* <div className="h-full flex">
            {fixedTabs.map((tab) => (
              <button
                key={tab.name}
                className={`px-6 rounded-md text-xs font-bold whitespace-nowrap ${activeTab === tab.name
                  ? "text-forumBlue-dark-hover bg-forumBlue-light-hover"
                  : "text-grey-normal"
                  }`}
                onClick={() => {
                  onTabChange(tab.name)
                }}
              >
                {tab.name}
              </button>
            ))}
          </div> */}
          {/* 左箭头 - 根据滚动位置禁用/启用 */}
          {/* <button
          className={`p-2 ${showLeftArrow
            ? "text-grey-normal hover:text-forumBlue-normal cursor-pointer"
            : "text-grey-light-active cursor-not-allowed"
            }`}
          onClick={() => showLeftArrow && handleScroll("left")}
          disabled={!showLeftArrow}
        >
          <LeftOutlined className="text-xs" />
        </button> */}

          {/* Scrollable Tabs - 其他Tab可滚动 */}
          <div
            ref={scrollRef}
            className="scrollbar-hidden h-full flex-1 overflow-x-auto overflow-y-hidden"
          >
            <div className="h-full flex">
              {scrollableTabs.map((tab) => (
                <button
                  key={tab.name}
                  className={`px-6 h-full rounded-md text-xs font-bold whitespace-nowrap ${activeTab === tab.name
                    ? "text-forumBlue-dark-hover bg-forumBlue-light-hover"
                    : "text-grey-normal"
                    }`}
                  onClick={() => {
                    onTabChange(tab.name);
                    scrollTabIntoView(tab.name);
                  }}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* 右箭头 - 根据滚动位置禁用/启用 */}
          {/* <button
          className={`p-2 ${showRightArrow
            ? "text-grey-normal hover:text-forumBlue-normal cursor-pointer"
            : "text-grey-light-active cursor-not-allowed"
            }`}
          onClick={() => showRightArrow && handleScroll("right")}
          disabled={!showRightArrow}
        >
          <RightOutlined className="text-xs" />
          </button> */}
        </div>
      </div>

      {/* 添加按钮 - 固定在最右边 */}
      {/* {!disabelEdit ? <div
        className="w-[24px] h-[24px] rounded-full text-xs text-white bg-forumBlue-light-active flex shrink-0 items-center justify-center cursor-pointer"
        onClick={() => {
          setIsModalOpen(true);
        }}
      >
        <span className="text-base text-forumBlue-normal">+</span>
      </div> : <div className="w-[24px] h-[24px]"></div>} */}

      <FieldEditorModal
        isOpen={isModalOpen}
        field={{}}
        templateId={templateId as number}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
