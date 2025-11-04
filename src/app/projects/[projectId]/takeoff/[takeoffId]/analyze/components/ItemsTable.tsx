"use client";

import Button from "@/components/Button";
import { Checkbox, Divider, Input, Table, notification } from "antd";
import Image from "next/image";
import { useParams, useRouter,useSearchParams } from "next/navigation";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";

import { getFieldsByTemplateId } from "@/services/templateService";
import { changeCheckedItem, updateField } from "@/services/projectService";
import { colorList } from "@/theme/colors";

import { ColumnsType } from 'antd/es/table';
import { LabelItem } from "../types";

import EvidenceModal from "./EvidenceModal";

const ItemsTable = ({ 
    takeOff,
    selectedFileId,
    onRefreshItems
}: any) => {
    const router = useRouter();
    const projectId = Number(useParams().projectId);
    const takeOffId = useParams().takeoffId;

    const [filter, setFilter] = useState("");
    const [tableLoading, setTableLoading] = useState<boolean>(false);
    const [showEvideceModal, setShowEvideceModal] = useState<boolean>(false);
    const [tableData, setTableData] = useState<any[]>([]);

    const itemEvidenceIds = useRef([]);
    const itemFileId = useRef("");
    // dynamicFields 动态字段
    const [dynamicFields, setDynamicFields] = useState<Array<{ name: string }>>([]);
    const [editingCell, setEditingCell] = useState<{rowId: number, columnName: string} | null>(null);


    const renderField = useCallback((_: any, record: LabelItem, fieldName: string) => {
        try {
            let fieldValue = '';
            try{ 
                fieldValue = JSON.parse(record.result)[fieldName];
            }catch(e){
                console.log('JSON.parse(record.result) error', e)
            }
            const isEditing = editingCell?.rowId === record.id && editingCell?.columnName === fieldName;
            return (
                <div
                    className="w-full h-full min-h-[20px]" 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {
                        isEditing ? (
                            <input 
                                defaultValue={typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : fieldValue}
                                autoFocus
                                className="input-focus bg-primaryN30"
                                style={{
                                    width: '100%',
                                    minWidth: '100%',
                                    textAlign: 'center',
                                    boxShadow: 'none',
                                }}
                                onBlur={(e)=>{
                                    setEditingCell(null);
                                    //更改record的result
                                    let result =  record.result;
                                    try{
                                        let item = tableData.find((item: any) => item.id === record.id);
                                        if (item){
                                            result = JSON.stringify({
                                                ...JSON.parse(item.result),
                                                [fieldName]: e.target.value,
                                            });
                                        }           
                                    }catch(e){

                                    }
                                    setTableData((prev)=>{
                                        let list = prev.map((item: any) => {
                                            if (item.id === record.id){
                                                return {
                                                    ...item,
                                                    result,
                                                }
                                            }
                                            return item;
                                        })
                                        return list;
                                    });

                                    // 调用API更新field
                                    (async()=>{
                                        let res = await updateField(record.id, result);
                                        if (res){
                                            notification.success({
                                                message: 'Success',
                                                description: 'Field updated successfully',
                                            })
                                            // 如果更新Label，则需要整体刷新，需要重新计算重复组
                                            if (fieldName === 'Label'){
                                                onRefreshItems && onRefreshItems();
                                            }
                                        } else {
                                            notification.error({
                                                message: 'Error',
                                                description: 'Failed to update field',
                                            })
                                        }
                                    })();
                                    
                                }}
                            >
                            </input>
                        ):
                        <div className="min-h-[20px] flex-1 flex justify-center items-center"
                            onClick={()=>setEditingCell({rowId: record.id, columnName: fieldName})}
                        >
                            <span className="">{typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : fieldValue}</span>
                        </div>
                        
                    }
                </div>
            )
        } catch (e) {
            console.error('解析label出错：', e);
            return "";
        }
    }, [editingCell]);

    
    const defaultColumns: ColumnsType<LabelItem> = [
        {
            title: <div className="text-center text-xs text-basicGray">State</div>,
            dataIndex: "state",
            width:60,
            fixed: "left",
            align:"center",
            render: (_: any, record: any, index: number) => {
                return <div className="flex items-center justify-center">
                    <div className="w-[16px] h-[16px] rounded-full bg-transparent border border-basicLightGray text-[10px] text-white cursor-pointer"
                        style={{
                            backgroundColor: record.is_checked ? colorList.accentGreen : "transparent",
                        }}
                        onClick={async ()=>{
                            let state = !record.is_checked;
                            //点击后更新record
                            setTableData((prev)=>{
                                return prev.map((item: any) => item.id === record.id ? {...item, is_checked: state} : item);
                            });
                            //调用API更改is_checked
                            let res = await changeCheckedItem(record.id, state);
                            if (res){
                                notification.success({
                                    message: "Success",
                                    description: "Item checked status updated successfully",
                                });
                            } else {
                                notification.error({
                                    message: "Error",
                                    description: "Failed to update item checked status",
                                });
                            }
                        }}
                    >
                        {record.is_checked? "✓" : ""}
                    </div>
                </div> 
            },
        },
        {
            title: <div className="text-center text-xs text-basicGray">#</div>,
            dataIndex: "number",
            width:50,
            fixed: "left",
            align:"center",
            render: (_: any, record: any, index: number) => index+1,
        },
        {
            title: <div className="text-center text-xs text-basicGray">Label</div>,
            dataIndex: "label",
            fixed: "left",
            align:"center",
            minWidth: 100,
            render: (_: any, record: any) => {
                return renderField(_, record, 'Label');
            },
        },{
            title: <div className="text-center text-xs text-basicGray">Reference</div>,
            dataIndex: "reference",
            width:120,
            fixed: "right",
            align:"center",
            render: (_: any, record: any) => {
                let evids = record?.evidence_id_list ?? [];
                return <div className="flex flex-row items-center justify-center">
                    <Image
                        src="/assets/icons/file-refrence.svg"
                        alt=""
                        width={18}
                        height={18}
                        style={{
                            cursor: 'pointer',
                        }}
                        onClick={()=>{
                            itemEvidenceIds.current = evids;
                            itemFileId.current = record.project_file_id;
                            setShowEvideceModal(true);
                        }}
                    />
                    <p className="ml-1 px-[6px] py-[2px] rounded-full bg-loadingGray text-[8px]">
                        {evids.length}
                    </p>
                </div>
            }
        }
    ];

    // 存储勾选的行 key
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

    // 配置勾选功能
    const rowSelection = {
        selectedRowKeys, // 受控绑定勾选的行 key
        onChange: (newSelectedRowKeys: string[]) => {
        // 勾选状态变化时触发
            setSelectedRowKeys(newSelectedRowKeys);
        },
        // 可选配置：是否允许全选
        // selectAll: false, // 禁用全选
        // 可选配置：勾选框渲染（如自定义样式）
        // renderCell: (checked, record, index, originNode) => {
        //   return <Checkbox checked={checked} />;
        // },
    };

    useEffect(() => {
        (async () => {
            if (!takeOff) return;
            setTableLoading(true);
            const res = await getFieldsByTemplateId(takeOff?.take_off_result?.template_id);
            if(res.status === "success"){
                setDynamicFields(res.data);
            } else {
                notification.error({
                    message: "Error",
                    description: "Failed to get fields",
                })
            }
            setTableLoading(false);
        })();
    }, [takeOff?.take_off_result?.template_id]);


    useEffect(() => {
        if (!takeOff || selectedFileId === -1) return;
        let items = takeOff?.all_items?.[selectedFileId] || [];
        setTableData(items);
    },[takeOff?.all_items?.[selectedFileId], selectedFileId])


    const filterItems = (filterStr: string)=>{
        let items = takeOff?.all_items?.[selectedFileId] || [];
        if (filterStr.length === 0){
            setTableData(items);
            return;
        }
        //过滤
        let filtersItems = items.filter((item:LabelItem)=>{
            try{
                let result = JSON.parse(item.result);
                for (let key in result){
                    if (result[key].toLowerCase().includes(filterStr.toLowerCase())){
                        return true;
                    }
                }
            }catch(e){
                return false;
            }
        });
        setTableData(filtersItems);
    }

    const newColumns = useMemo<ColumnsType<LabelItem>>(() => {
        // 生成动态列（columnsList）
        const columnsList: ColumnsType<LabelItem> = [];
        if (dynamicFields && Array.isArray(dynamicFields)) {
            dynamicFields.forEach((field: { name: string }, index: number) => {
                let defaultWidth = 100;
                if (typeof field.name === "string" && field.name.toUpperCase() === 'LABEL') return;
                let title = '';
                let splitArr = field.name.split(".");
                if (splitArr.length > 1){
                    splitArr.map((item, index) =>{
                        if (index === 0){
                            title = item + '\n';
                        } else {
                            title += item + '';
                        }
                    })
                    
                } else {
                    title = field.name;
                }
                if (title.length > 25){
                    defaultWidth = 220;
                } if (title.length > 15 && title.length < 25){
                    defaultWidth = 140;
                } else if ( title.length > 10 && title.length < 15){
                    defaultWidth = 120;
                }
                columnsList.push({
                    title: <div className="text-center whitespace-pre-wrap text-xs text-basicGray" 
                                style={{
                                    minWidth: defaultWidth - 16, 
                                    margin: '0 auto',
                                    width: '100%' 
                                }}>
                            {title}
                        </div>,
                    dataIndex: field.name,
                    minWidth: defaultWidth,
                    width: 'auto',
                    align:"center",
                    render: (_: any, record: any) => {
                        return renderField(_, record, field.name);
                    }
                } as any)
            });
        }
        // 在 defaultColumns 的倒数第二位置插入 columnsList
        const mergedColumns: ColumnsType<LabelItem> = [...defaultColumns];
        mergedColumns.splice(mergedColumns.length - 1, 0, ...columnsList);

        return mergedColumns;
    }, [dynamicFields, defaultColumns, renderField, editingCell]); // 依赖动态字段、默认列、编辑逻辑、编辑状态

    return (
        <div className="flex flex-col gap-4 w-full pt-8">
            <p className="text-forumBlue text-sm">Items</p>
            <div className="flex justify-between w-full">
                <Input
                    className="rounded-full w-80 text-xs"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    prefix={
                        <Image
                            src="/assets/icons/search.svg"
                            alt="search icon"
                            width={11}
                            height={11}
                        />
                    }
                    onBlur={(e)=>{
                        filterItems(e.target.value)
                    }}
                    onPressEnter={(e: any)=>{
                        filterItems(e.target.value)
                    }}
                />

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        borderColor="primaryN30"
                        className="!text-basicGray text-xs"
                        onClick={()=>{
                            if (takeOff?.reconcile_candidate_count?.[selectedFileId] >= 0){
                                router.push(
                                    `/projects/${projectId}/takeoff/${takeOffId}/items-merge?_fId=${selectedFileId}`
                                );
                            }
                        }}
                    >
                        <div className="flex items-center justify-center">
                            <span>Reconcile Items</span>
                            <span className="ml-1 px-[8px] py-[1px] rounded-2xl inline-block text-white text-sm"
                                style={{
                                    backgroundColor: takeOff?.reconcile_candidate_count?.[selectedFileId] > 0 ? colorList.basicGray : colorList.accentGreen,
                                }}
                            >
                                {takeOff?.reconcile_candidate_count?.[selectedFileId] || 0}
                            </span>
                        </div>
                    </Button>
                    {/* <Button variant="outline" borderColor="forumBlue" className="text-xs">
                        Add Item
                    </Button> */}
                </div>
            </div>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
                <Table
                    rowKey={(record: any) => record.id} 
                    columns={newColumns}
                    dataSource={tableData}
                    pagination={false} 
                    size="small"
                    rowSelection={rowSelection as any}
                    scroll={{
                        x: 'max-content',
                        y: 'calc(100vh - 300px)', // 保留垂直滚动功能
                    }}
                    loading={tableLoading}
                    //className="min-w-full max-h-full"
                />
            </div>
            {
                showEvideceModal && (
                    <EvidenceModal
                        showEvideceModal={showEvideceModal}
                        setShowEvideceModal={setShowEvideceModal}
                        projectId={projectId}
                        fileId={itemFileId.current}
                        evidenceIds={itemEvidenceIds.current}
                    />
                )
            }
        </div>
    );
};

export default ItemsTable;


