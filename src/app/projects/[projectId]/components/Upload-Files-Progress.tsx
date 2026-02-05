import React, { useEffect, useState } from 'react';
import { uploadFiles, uploadFilesNoProjectId } from '@/services/filesService';
import { message, Modal, notification, Spin } from 'antd';
import { useParams } from 'next/navigation';

const UploadFilesProgress = ({
  isOpen,
  closeModal,
  uploadFilesData,
  syncCreateProject = true, // 上传文件的同时，同步创建工程
  onSuccess
}: any) => {
  const projectId = useParams().projectId;
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSizeProgress, setUploadSizeProgress] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');

  useEffect(() => {
    const { archFiles = [], arcHingeMode = '1', quoteFiles = [], quoteHingeMode = '1' } = uploadFilesData;
    if (archFiles.length > 0) {
      handleUploadFiles();
    }
  }, [uploadFilesData]);


  // 格式化字节为人类可读的格式
  const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleProgress = (progressEvent: any) => {
    console.log('Progress:', progressEvent);
    const total = progressEvent.total;
    const loaded = progressEvent.loaded;

    // 确保total和loaded都是有效数字
    if (total && loaded) {
      const progress = Math.round((loaded / total) * 100);

      // 更新状态
      setUploadProgress(progress);
      setUploadSizeProgress(`${formatBytes(loaded)} / ${formatBytes(total)}`);

      // 当进度达到100%时，设置状态为处理中
      if (progress === 100) {
        setStatus('processing');
      }
    }
  };

  const handleUploadFiles = async () => {
    const { archFiles = [], arcHingeMode = '1', quoteFiles = [], quoteHingeMode = '1' } = uploadFilesData;
    // 目前只处理archFiles文件
    const filesInfo: any = archFiles.map((file: any) => ({
      file_name: file.name,
      operation_type: 'Architecture_drawing',
      file_type: 'PDF',
      country_of_origin: "United States",
    }));

    const files = archFiles;

    setUploadProgress(0);
    setStatus('uploading');

    let uploadFunction = syncCreateProject ? uploadFilesNoProjectId : uploadFiles;
    let projectIdParam = syncCreateProject ? null : projectId;

    try {
      // 添加超时处理，避免无限期等待
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 300000); // 5分钟超时
      });

      let res: any = await Promise.race([
        uploadFunction(
          filesInfo,
          files,
          projectIdParam as any,
          arcHingeMode as any,
          (progressEvent: any) => {
            handleProgress(progressEvent);
          }
        ),
        timeoutPromise
      ]);

      setStatus('completed');
      if (res.status === 'success') {
        console.log('上传成功:', res.data);
        message.success("Upload success.");
        onSuccess && onSuccess(res.data);
      } else {
        console.log('上传失败:', res.message);
        setStatus('error');
        notification.error({
          message: "Error",
          description: 'Upload Failed，Please try again.',
        });
        // 上传失败，关闭模态框
        closeModal();
      }
    } catch (error) {
      console.log('上传错误:', error);
      setStatus('error');
      notification.error({
        message: "Error",
        description: 'Upload Failed，Please try again.',
      });
      // 上传失败，关闭模态框
      closeModal();
    }
  }

  return (
    <Modal
      open={isOpen}
      onCancel={closeModal}
      footer={null}
      centered
      width={500}
      closable={false}
      maskClosable={false}
    >
      <div className='w-full h-[150px] font-nunito'>
        <div className='text-forumBlue text-lg mb-4'>Upload Files</div>
        <div className='w-full mb-6 mt-2'>
          <div className='flex justify-between mb-2'>
            <span className='text-sm font-medium text-gray-700'>Progress  <span className='ml-2'>{uploadSizeProgress}</span></span>
            <span className='text-sm font-medium text-gray-700'>{uploadProgress}%</span>
          </div>
          <div className='w-full h-4 bg-gray-200 rounded-full overflow-hidden'>
            <div
              className='h-full bg-blue-500 transition-all duration-300'
              style={{ width: `${uploadProgress}%` }}
            ></div  >
          </div>
        </div>

        {/* 处理状态显示 */}
        {status === 'processing' && (
          <div className='flex items-center justify-center gap-2 text-gray-600'>
            <Spin size="small" />
            <span>Processing files... Please wait.</span>
          </div>
        )}

        {/* 错误状态显示 */}
        {status === 'error' && (
          <div className='text-red-500 text-center'>
            Upload failed. Please try again.
          </div>
        )}

        {/* 完成状态显示 */}
        {status === 'completed' && (
          <div className='text-green-500 text-center'>
            Upload completed successfully!
          </div>
        )}
      </div>
    </Modal >
  );
};

export default UploadFilesProgress;
