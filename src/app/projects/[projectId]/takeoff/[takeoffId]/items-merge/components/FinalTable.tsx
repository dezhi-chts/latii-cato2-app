import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { Table, Image, notification, Modal } from 'antd';
import { colorList } from '@/theme/colors';

import { reconcilePreview, reconcliePreviewKeepAll, reconcileConfirm, reconcileKeepAllConfirm } from "@/services/DrawingAiService";

import EvidenceModal from '../../analyze/components/EvidenceModal';

const { confirm } = Modal;
const FinalTable = ({
    selectedTab,
    groupIndex,
    originTableData,
    evidenceList,
    setFullLoading,
    onRefreshGroups
}:{
    selectedTab: string,
    groupIndex: number,
    originTableData: any[],
    evidenceList: any[],
    setFullLoading: (loading: boolean) => void,
    onRefreshGroups: () => void,
}) => {
    const takeOffId = Number(useParams().takeoffId);
    const projectId = Number(useParams().projectId);
    const fileId = Number(useSearchParams().get("_fId")) || '';
    const [headerList, setHeaderList] = useState<string[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);
    const [showEvideceModal, setShowEvideceModal] = useState<boolean>(false);
    const [showMergeView, setShowMergeView] = useState<boolean>(false);

    const itemEvidenceIds = useRef([]);
    // 保存预览时候的参数
    const previewParams = useRef<any>({});

    useEffect(()=>{
        // 根据原始数据获取表头
        generateHeader();
        // 重置tableData
        setTableData([]);
        setShowMergeView(false);
        previewParams.current = {};
    }, [originTableData]);

    useEffect(()=>{
        setTableData([]);
        setShowMergeView(false);
        previewParams.current = {};
    },[selectedTab, groupIndex])

    // 生成表头
    const generateHeader = () =>{
        // 设置一个Set集合，用户存储所有的key
        let headerKeysSet = new Set<string>();
        originTableData.forEach((item:any)=>{
            try{
                let result = JSON.parse(item.result);
                let keys = Object.keys(result);
                keys.forEach((key)=>{
                    headerKeysSet.add(key);
                })
            }catch(error){

            }
        })
        // 转换为数组
        let headerKeys = Array.from(headerKeysSet);
        setHeaderList(headerKeys);
    }


    const getColumns = () => {
        let defaultColumns = [
            {
                title: '',
                dataIndex: '',
                align: 'center',
                render: (text:any, record:any, index:number)=>{
                    return <div className="flex justify-center items-center text-xs">
                        {index+1}
                    </div>
                }
            },
        ];

        let endColumns = [
            {
                title: <span className='text-xs text-basicGray'>Reference</span>,
                dataIndex: '',
                align: 'center',
                render: (text:any, record:any, index:number)=>{
                    return <div 
                                className="flex justify-center items-center"
                                onClick={()=>{
                                    itemEvidenceIds.current = record.evidence_id_list || [];
                                    setShowEvideceModal(true);
                                }}
                            >
                                <Image
                                    src="/assets/icons/file-refrence.svg"
                                    alt=""
                                    width={18}
                                    height={18}
                                    preview={false}
                                    style={{
                                        cursor: 'pointer',
                                    }}
                                />
                            </div>
                }
            }
        ]
        
        let header = headerList.map((value:string)=>{
            return {
                title: <span className='text-xs text-basicGray'>{value}</span>,
                dataIndex: value,
                align: 'center',
                render: (text:any, record:any)=>{
                    let data = selectedTab === 'customize' ? record : record?.result;
                    try {
                        return (
                            <p className="">
                                {typeof data[value] === 'object' ? JSON.stringify(data[value]) : data[value]}
                            </p>
                        );
                    } catch(error) {
                        return null;
                    }
                }
            };
        })
        return [defaultColumns[0], ...header, endColumns[0]];
    };

    //形成预览列表
    const handlePreview = async ()=>{
        if (originTableData.length === 0){
            return;
        }
        if (selectedTab === 'customize'){
            handleCustomPreview();
        } else {
            handleKeepAllPreview();
        }
    }

    // 自定义预览
    const handleCustomPreview = async ()=>{
        setFullLoading(true);
        let item_fields = originTableData.map((item:any, index:number)=>{
            // 获取evidence_selected
            let findEvid = evidenceList.find((evid:any)=> evid.item_id === item.id);
            let evidence_selected = findEvid?.evidence_selected || false;
            // item_fields数组中所有的item_fields 中只能包含一个Label，如果fields数组有多余的Label，需要去除
            // 只保留第一条数据的Label，其他数据的Label需要删除
            let selectFields = item.selectFields;
            if (index > 0){
                selectFields = selectFields.filter((field:string)=> field !== 'Label');
            }
            return {item_id: item.id, fields: selectFields, evidence_selected}
        });

        let body = {
            take_off_id: takeOffId,
            item_fields
        }
        let res = await reconcilePreview(body);
        setFullLoading(false);
        if(res.status === "success"){
            notification.success({
                message: 'Success',
                description: 'Preview generated successfully',
            })
            // 保存预览时候的参数
            previewParams.current = body;

            setShowMergeView(true);
            let headers =  Object.keys(res?.data?.preview?.merged_result || {});
            let mergeData = res?.data?.preview?.merged_result;
            setTableData([mergeData]);
        } else {
            notification.error({
                message: 'Error',
                description: res?.data?.message || 'Preview Failed',
            });
        }
    }

    // 保持所有预览
    const handleKeepAllPreview = async ()=>{
        setFullLoading(true);

        let body = {
            take_off_id: takeOffId,
            item_ids: originTableData.map((item:any)=> item.id)
        }
        let res = await reconcliePreviewKeepAll(body);
        setFullLoading(false);
        if(res.status === "success"){
            notification.success({
                message: 'Success',
                description: 'Preview generated successfully',
            })
            // 保存预览时候的参数
            previewParams.current = body;

            setShowMergeView(true);
            let headers =  Object.keys(res?.data?.preview?.items || {});
            let mergeData = res?.data?.preview?.items;
            setTableData(mergeData);
        } else {
            notification.error({
                message: 'Error',
                description: res?.data?.message || 'Preview Failed',
            });
        }
    }

    const handleConfirmModal = ()=>{
        confirm({
            title: 'Confirm',
            content: 'Are you sure to confirm?',
            onOk: ()=>{
                if (selectedTab === 'customize'){
                    handleCustomizeConfirm();
                } else {
                    handleKeepAllConfirm();
                }
            },
            onCancel: () => {},
        })
    }

    // 自定义预览确认提交
    const handleCustomizeConfirm = async ()=>{
        let body = {
            take_off_id: takeOffId,
            item_fields: previewParams.current?.item_fields || [],
            merged_result: tableData.length > 0 ? tableData[0] : {}
        }
        setFullLoading(true);
        let res = await reconcileConfirm(body); 
        setFullLoading(false);
        if(res.status === "success"){
            notification.success({
                message: 'Success',
                description: res?.data?.message || 'Confirm Success',
            });
            // 刷新groups列表
            onRefreshGroups && onRefreshGroups();
        } else {
            notification.error({
                message: 'Error',
                description: res?.data?.message || 'Confirm Failed',
            });
        }
    }
    // 保持所有预览确认提交
    const handleKeepAllConfirm = async ()=>{
        let body = {
            take_off_id: takeOffId,
            item_ids: tableData.map((item:any)=> item.original_item_id)
        }
        setFullLoading(true);
        let res = await reconcileKeepAllConfirm(body); 
        setFullLoading(false);
        if(res.status === "success"){
            notification.success({
                message: 'Success',
                description: res?.data?.message || 'Confirm Success',
            });
            // 刷新groups列表
            onRefreshGroups && onRefreshGroups();
        } else {
            notification.error({
                message: 'Error',
                description: res?.data?.message || 'Confirm Failed',
            });
        }
    }


    const columns = useMemo(()=>{
        return getColumns();
    }, [selectedTab, headerList]);


    return (
        <div className={`px-7 py-4 mb-5 rounded-lg mt-auto`}
            style={{
                backgroundColor: colorList.forumBlue + '10',
            }}
        >
            <div className="h-[24px] flex flex-row justify-between">
                <p className="pb-4 text-sm text-forumBlue">Final Item</p>
                <div
                    className="px-3 py-1 h-['auto'] cursor-pointer text-white text-xs rounded-lg bg-forumBlue"
                    onClick={handlePreview}>
                    Preview
                </div>
            </div>
            {
                showMergeView &&
                <> 
                    <Table
                        rowKey={(record: any) => record?.original_item_id || record?.id} 
                        columns={columns as any}
                        dataSource={tableData}
                        pagination={false} 
                        size="small"
                        tableLayout="fixed"
                        scroll={{
                            x: 'max-content',
                        }}
                        className="mt-4 min-w-full"
                    />
                    <div className="mt-4 h-[24px] flex flex-row justify-end">
                        <div
                            className="px-3 py-1 h-['auto'] cursor-pointer text-white text-xs rounded-lg bg-forumBlue"
                            onClick={handleConfirmModal}
                        >
                            Confirm
                        </div>
                    </div>
                </>
            }
            {
                showEvideceModal && (
                    <EvidenceModal
                        showEvideceModal={showEvideceModal}
                        setShowEvideceModal={setShowEvideceModal}
                        projectId={projectId}
                        fileId={fileId}
                        evidenceIds={itemEvidenceIds.current}
                    />
                )
            }
        </div>
    )
}

export default FinalTable;