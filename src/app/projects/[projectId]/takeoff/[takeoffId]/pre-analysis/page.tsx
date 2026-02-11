'use client';

import React from 'react';
import { Button } from 'antd';
import { Header } from './components/Header';
import { AnalysisCard, TableData } from './components/AnalysisCard';

export const PreAnalysisPage: React.FC = () => {
  // 生成表格数据
  const generateTableData = (count: number): TableData[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `item-${i}`,
      label: '2A - Unit BC',
      subLabel: '2A - Unit BC',
    }));
  };

  // 处理创建Takeoff按钮点击事件
  const handleCreateTakeoff = () => {
    console.log('Create Takeoff clicked');
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* 顶部导航栏 */}
      <Header onCreateTakeoff={handleCreateTakeoff} />

      {/* 主内容区 */}
      <div className="px-10">
        <div className="flex gap-6">
          {/* 第一个卡片 */}
          <AnalysisCard
            title="Architectural Drawing"
            labelCount={12}
            status="Base"
            data={generateTableData(10)}
            buttonText="Merge All"
          />

          {/* 第二个卡片 */}
          <AnalysisCard
            title="Architectural Drawing"
            labelCount={5}
            status="Base"
            data={generateTableData(10)}
            buttonText="Merge to Base"
          />

          {/* 第三个卡片 */}
          <AnalysisCard
            title="Product List"
            labelCount={36}
            status="Open"
            data={generateTableData(10)}
            buttonText="Merge to Base"
          />
        </div>
      </div>
    </div>
  );
};

// 默认导出页面组件
export default PreAnalysisPage;