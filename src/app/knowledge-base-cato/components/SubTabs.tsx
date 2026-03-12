"use client";

import { useRef, useEffect, useState } from "react";
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
  templateId: string;
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
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 检查滚动位置，更新箭头显示状态
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // 监听滚动事件
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScrollPosition);
      checkScrollPosition();
    }
    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", checkScrollPosition);
      }
    };
  }, []);

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
  const scrollableTabs = tabs.filter((tab: SubTab) => tab.name !== "Generations" && tab.name !== "Label" && tab.name !== "Sub Label");

  return (
    <div className="h-[40px] flex items-center bg-grey-light px-4 rounded-tl-xl rounded-tr-xl">
      {/* 左箭头 - 根据滚动位置禁用/启用 */}
      <button
        className={`p-2 ${showLeftArrow
          ? "text-grey-normal hover:text-forumBlue-normal cursor-pointer"
          : "text-grey-light-active cursor-not-allowed"
          }`}
        onClick={() => showLeftArrow && handleScroll("left")}
        disabled={!showLeftArrow}
      >
        <LeftOutlined className="text-xs" />
      </button>

      {/* Fixed Tabs - 前3个Tab固定 */}
      <div className="flex shrink-0">
        {fixedTabs.map((tab) => (
          <button
            key={tab.name}
            className={`px-6 py-0.5 rounded-md text-xs whitespace-nowrap ${activeTab === tab.name
              ? "text-white bg-forumBlue-normal"
              : "text-grey-normal"
              }`}
            onClick={() => {
              console.log('######## tab.name', tab.name)
              onTabChange(tab.name)
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Scrollable Tabs - 其他Tab可滚动 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex">
          {scrollableTabs.map((tab) => (
            <button
              key={tab.name}
              className={`px-6 py-0.5 rounded-md text-xs whitespace-nowrap ${activeTab === tab.name
                ? "text-white bg-forumBlue-normal"
                : "text-grey-normal"
                }`}
              onClick={() => onTabChange(tab.name)}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* 右箭头 - 根据滚动位置禁用/启用 */}
      <button
        className={`p-2 ${showRightArrow
          ? "text-grey-normal hover:text-forumBlue-normal cursor-pointer"
          : "text-grey-light-active cursor-not-allowed"
          }`}
        onClick={() => showRightArrow && handleScroll("right")}
        disabled={!showRightArrow}
      >
        <RightOutlined className="text-xs" />
      </button>

      {/* 添加按钮 - 固定在最右边 */}
      <div
        className="ml-2 w-[24px] h-[24px] rounded-full text-xs text-white bg-forumBlue-light-active flex items-center justify-center cursor-pointer"
        onClick={() => {
          setIsModalOpen(true);
        }}
      >
        <span className="text-base text-forumBlue-normal">+</span>
      </div>

      <FieldEditorModal
        isOpen={isModalOpen}
        field={{}}
        templateId={templateId?.toString() || ""}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
