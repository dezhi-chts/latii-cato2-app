import { useEffect, useState, useMemo } from 'react';
import { Table } from 'antd';

import { colorList } from '@/theme/colors';
const CustomizeTable = ({
    selectedTab,
    originTableData, // 表格原始数据
    defaultFields, // 默认的selectedFields
    setCustomizeTableData, // 自定义表格数据, finalTable中需要使用
}:{
    selectedTab: string,
    originTableData: any[],
    defaultFields: any[], 
    setCustomizeTableData: (data:any[])=>void, // 自定义表格数据
}) => {
    const [headerList, setHeaderList] = useState<string[]>([]);
    const [tableData, setTableData] = useState<any[]>([]);

    useEffect(()=>{
        //根据原始数据获取表头
        generateHeader();
        //形成表格数据
        generateTableData();
    }, [originTableData]);

    useEffect(()=>{
        // 初始化tableData的selectedFields
        initTableDataFields();
    },[defaultFields])

    useEffect(()=>{
        if (selectedTab === 'customize'){
            initTableDataFields();
        } else {
            // 清空tableData的selectedFields
            setTableData((prev)=>{
                return prev.map((item:any)=>{
                    return {...item, selectFields:[]};
                })
            });
        }
    },[selectedTab])

    useEffect(()=>{
        // 自定义表格数据变化时，更新finalTable中的数据
        setCustomizeTableData(tableData);
    },[tableData])

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

    // 形成表格数据
    const generateTableData = () =>{
        let data = originTableData.map((item:any, index:number)=>{
            try{
                return {...item, selectFields:['Label'], evidence_selected: true};
            }catch(error){
                return {};
            }
        })
        setTableData(data);
    }

    // 初始化tableData的selectedFields
    const initTableDataFields= ()=>{
        // 更新Table中的items中的selectFields
        let data = tableData.length > 0 ? [...tableData] : [...originTableData];
        if (data.length > 0){
            let updatedTableData = data.map((tItem:any)=>{
                let fields = defaultFields?.find((field:any)=> {
                    return field.item_id === tItem.id;
                })?.fields || [];
                if(!fields.includes('Label')){
                    fields.push('Label');
                }
                return {...tItem, selectFields: fields};
            });
            setTableData(updatedTableData);
        }
    }

    // 获取列定义
    const getColumns = () => {
        let defaultColumns = [
            {
                title: '',
                dataIndex: '',
                align: 'center',
                render: (text:any, record:any, index:number)=>{
                    return <div className="flex justify-center items-center">
                        <span className='px-[6px] py-[1px] text-xs text-white bg-forumBlue rounded'>{index+1}</span>
                    </div>
                }
            },
            {
                title: <span className='text-xs text-basicGray'>#</span>,
                dataIndex: 'id',
                align: 'center',
                render: (text:any, record:any, index:number)=>{
                    return <div className="flex justify-center items-center text-xs">
                        {record.id}
                    </div>
                }
            },
        ];

        
        let header = headerList.map((value:string)=>{
            return {
                title: <span className='text-xs text-basicGray'>{value}</span>,
                dataIndex: value,
                align: 'center',
                render: (text:any, record:any)=>{
                    try{
                        let result = JSON.parse(record.result);
                        let fieldSelected = record.selectFields.includes(value);
                        return (
                            <div
                                className="text-xs cursor-pointer" 
                                onClick={()=>{
                                if(selectedTab === 'customize'){
                                    if (value === 'Label') return;
                                    //自定义模式，则tableData的每一列只能选择一个cell，点击cell的时候，需要清除其余cell的选中状态，同时更新mergeTableData，选中状态为增加边框
                                    setTableData((prev:any[])=>{
                                        return prev.map((item:any)=>{
                                            if(item.id === record.id){
                                                if (item.selectFields.includes(value)){
                                                    // filed存在，则移除
                                                    return {...item, selectFields: item.selectFields.filter((field:string)=>field !== value)};
                                                } else {
                                                    // filed不存在，则添加
                                                    return {...item, selectFields: [...item.selectFields, value]};
                                                }
                                            } 
                                            return {...item};
                                        })
                                    })
                                }
                            }}>
                                <p
                                    className="border py-[2px]"
                                    style={{
                                        backgroundColor: fieldSelected ? (colorList.forumBlue + '10') : 'transparent',
                                        borderColor: fieldSelected ? colorList.forumBlue : 'transparent',
                                    }}
                                >{typeof result[value] === 'object' ? JSON.stringify(result[value]) : result[value]}</p>
                            </div>
                        );
                    }catch(error){
                        return null;
                    }
                }
            }
        });
        return [...defaultColumns, ...header];
    };

    const columns = useMemo(()=>{
        return getColumns();
    }, [selectedTab, headerList]);

    return (
        <Table
            rowKey={(record: any) => record.id} 
            columns={columns as any}
            dataSource={tableData}
            pagination={false} 
            size="small"
            tableLayout="fixed"
            scroll={{
                x: 'max-content',
            }}
            // 添加自定义类名用于CSS样式控制
            className="min-w-full small-font-table"
        />
    )
}

export default CustomizeTable;