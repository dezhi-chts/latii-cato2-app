"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// 文件视图步骤枚举
export enum FileViewStep {
  IndexDrawing = "IndexDrawing",
  IndexSummary = "IndexSummary",
  Second = "Second",
  FileMerge = "FileMerge"
}

// 定义 Context 的类型
interface TakeoffContextType {
  // 文件列表
  fileList: any[];
  setFileList: React.Dispatch<React.SetStateAction<any[]>>;

  // 当前选中的文件 ID
  selectedFileId: number;
  setSelectedFileId: React.Dispatch<React.SetStateAction<number>>;

  // takeOff 数据
  takeOff: any;
  setTakeOff: React.Dispatch<React.SetStateAction<any>>;

  // 视图步骤
  fileViewStep: FileViewStep;
  setFileViewStep: React.Dispatch<React.SetStateAction<FileViewStep>>;

  // 索引框数量
  indexBoxCount: number;
  setIndexBoxCount: React.Dispatch<React.SetStateAction<number>>;

  // 合并文件状态（从 API 获取文件数据后调用）
  mergeFileStatus: (apiFileList: any[]) => any[];

  isPageRefresh: () => boolean;
  loadFromStorage: () => any;
}

// 创建 Context
export const TakeoffContext = createContext<TakeoffContextType | undefined>(undefined);

// 定义 Provider 组件的 Props 类型
interface TakeoffProviderProps {
  children: ReactNode;
  projectId?: string;
  takeoffId?: string;
}

// 创建 Provider 组件
export const TakeoffProvider: React.FC<TakeoffProviderProps> = ({ children, projectId, takeoffId }) => {
  // 生成 localStorage key
  const storageKey = projectId && takeoffId ? `takeoff_${projectId}_${takeoffId}` : 'takeoff_default';

  // 判断是否是页面刷新
  const isPageRefresh = () => {
    // const navigationType = typeof window !== 'undefined' ? window.performance?.navigation?.type : 0;
    // return navigationType === 1;
    return fileList.length === 0;
  };

  // 从 localStorage 加载初始状态
  const loadFromStorage = (): any => {
    try {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  };

  // 状态定义
  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<number>(-1);
  const [takeOff, setTakeOff] = useState<any>({});
  const [fileViewStep, setFileViewStep] = useState<FileViewStep | ''>('');
  const [indexBoxCount, setIndexBoxCount] = useState<number>(0);

  // 保存状态到 localStorage
  const saveToStorage = () => {
    try {
      if (typeof window === 'undefined') return;
      const data = {
        fileList: fileList.map(file => ({
          id: file.id,
          status: file.status
        }))
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // 当状态变化时保存到 localStorage
  useEffect(() => {
    // saveToStorage();
  }, [fileList, storageKey]);

  // 合并文件状态（从 API 获取文件数据后调用）
  const mergeFileStatus = (apiFileList: any[]): any[] => {
    const stored = loadFromStorage();
    if (!stored?.fileList || stored.fileList.length === 0) {
      return apiFileList;
    }

    // 创建状态映射
    const statusMap = new Map();
    stored.fileList.forEach((file: any) => {
      statusMap.set(file.id, file.status);
    });

    // 合并状态
    const mergedFileList = apiFileList.map(file => {
      const storedStatus = statusMap.get(file.id);
      return {
        ...file,
        status: storedStatus || file.status
      };
    });

    // 更新状态
    setFileList(mergedFileList);
    return mergedFileList;
  };

  // 提供的 Context 值
  const contextValue: TakeoffContextType = {
    fileList,
    setFileList,
    selectedFileId,
    setSelectedFileId,
    takeOff,
    setTakeOff,
    fileViewStep,
    setFileViewStep,
    mergeFileStatus,
    isPageRefresh,
    loadFromStorage,
    indexBoxCount,
    setIndexBoxCount
  };

  useEffect(() => {
  }, [fileList]);

  return (
    <TakeoffContext.Provider value={contextValue}>
      {children}
    </TakeoffContext.Provider>
  );
};

// 创建自定义 Hook 方便使用
export const useTakeoff = () => {
  const context = useContext(TakeoffContext);
  if (context === undefined) {
    throw new Error("useTakeoff must be used within a TakeoffProvider");
  }
  return context;
};
