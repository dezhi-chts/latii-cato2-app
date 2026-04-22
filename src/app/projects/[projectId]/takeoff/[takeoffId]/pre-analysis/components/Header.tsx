import React from 'react';
import { Button } from 'antd';
import Image from 'next/image';
import { PageIndexStepInActive, PageLabelingStepCompleted, PagePreAnalysisStepActive } from '../../identification-index/components/HeaderStepProgress';

// NavigationHeader组件Props类型定义
interface HeaderProps {
  onCreateTakeoff: () => void;
}

// Header组件 - 使用命名导出
export const Header: React.FC<HeaderProps> = ({ onCreateTakeoff }) => {
  const handleBack = () => {
  }
  return (
    <div className="px-14  h-[110px]  border-b border-primaryN30 flex items-center justify-between">
      <div className="flex items-center">
        <div className="mr-6 cursor-pointer" onClick={handleBack}>
          <Image src="/assets/icons/arrow-back.svg" alt="logo" width={12} height={8}></Image>
        </div>
        {/* 步骤指示器 */}
        <PageIndexStepInActive />
        <PageLabelingStepCompleted />
        {/* Pre-Analysis (Active) */}
        <PagePreAnalysisStepActive />
      </div>

      <Button
        type="primary"
        size="small"
        className="custom-primary-btn px-4"
        onClick={onCreateTakeoff}
      >
        Create Takeoff
      </Button>
    </div>
  );
};