"use client";

import React from "react";
import { Button, Select, Table } from "antd";
import type { TableColumnType } from "antd";

// 表格数据类型定义
export interface TableData {
  id: string;
  label: string;
  subLabel: string;
}

// 表格列配置类型
const columns: TableColumnType<TableData>[] = [
  {
    title: (
      <div className="text-xs text-grey-normal text-center w-full">Label</div>
    ),
    dataIndex: "label",
    key: "label",
    className: "text-xs text-grey-normal text-center border-r border-gray-200",
    width: "50%",
  },
  {
    title: (
      <div className="text-xs text-grey-normal text-center w-full">
        Sub-Label
      </div>
    ),
    dataIndex: "subLabel",
    key: "subLabel",
    className: "text-xs text-grey-normal text-center",
    width: "50%",
  },
];

// AnalysisCard组件Props类型定义
export interface AnalysisCardProps {
  title: string;
  labelCount: number;
  status: string;
  data: TableData[];
  buttonText: string;
}

// AnalysisCard组件 - 使用命名导出
export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  title,
  labelCount,
  status,
  data,
  buttonText,
}) => {
  // 处理编辑合并设置点击事件
  const handleEditMergeSettings = () => {
    console.log("Edit Merge Settings clicked");
  };

  // 处理预览项目点击事件
  const handlePreviewItems = () => {
    console.log("Preview Items clicked");
  };

  // 处理了解更多点击事件
  const handleLearnMore = () => {
    console.log("Learn More clicked");
  };

  // 处理合并按钮点击事件
  const handleMergeAction = () => {
    console.log(`${buttonText} clicked`);
  };

  return (
    <div className="w-[380px] bg-white flex flex-col min-w-0">
      {/* 卡片头部 */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="text-xs text-grey-normal mt-0.5">
              {labelCount} Labels
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span className="text-xs text-grey-normal px-2 py-0.5 bg-gray-100 rounded">
              {status}
            </span>
          </div>
        </div>

        {/* 操作按钮区 */}
        <div className="flex justify-between items-center mt-3">
          <button
            className="text-xs text-forumBlue-normal underline hover:text-blue-600"
            onClick={handleEditMergeSettings}
          >
            Edit Merge Settings
          </button>
          <Button
            size="small"
            className="custom-default-btn text-xs !w-[124px] bg-blue-forumBlue-light"
            onClick={handlePreviewItems}
          >
            Preview Items
          </Button>
        </div>
      </div>

      {/* 表格区域 - 使用antd Table组件 */}
      <div className="flex-1 overflow-auto px-4">
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          rowKey={(record) => record.id}
          size="small"
          className="border border-gray-200"
          rowClassName={(record, index) =>
            index !== data.length - 1 ? "border-b border-gray-200" : ""
          }
        />
      </div>

      {/* 底部操作区 */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center pb-2">
          <span className="text-xs text-forumBlue-normal">Merge Type</span>
          <button
            className="text-xs text-grey-normal underline hover:text-gray-600"
            onClick={handleLearnMore}
          >
            Learn More
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-grey-normal whitespace-nowrap w-20">
              Row Merge
            </span>
            <Select
              size="small"
              className="flex-1 bg-primaryN20"
              placeholder="Option Selection"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-grey-normal whitespace-nowrap w-20">
              Column Merge
            </span>
            <Select
              size="small"
              className="flex-1 bg-primaryN20"
              placeholder="Option Selection"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="primary"
            size="small"
            className="custom-primary-btn"
            onClick={handleMergeAction}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};
