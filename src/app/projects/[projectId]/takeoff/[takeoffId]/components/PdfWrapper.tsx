'use client'
import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Group, Path, Circle } from "react-konva";
import { Form, Modal, notification, Input, Select, Table, Tooltip, Spin, Popconfirm } from "antd";
import { LoadingOutlined, SyncOutlined, PicCenterOutlined, ClearOutlined } from '@ant-design/icons';
import { KonvaEventObject } from 'react-konva';
import { useRouter, useSearchParams } from "next/navigation";

import {
  changeEvidenceType,
  deleteEvidenceById,
  saveEvidence as handleSaveEvidence,
} from "@/services/evidenceService";

import { rotateChange } from "@/services/projectService";

import Image from "next/image";
import Button from "@/components/Button";
import { colorList } from "@/theme/colors";
import { useGlobalLoading } from "@/context/GlobalLoadingContext";

import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';

import { Point, CirclePoint, GroupFrame, TextContent, ViewPort, TypeItem, EvidenceType, FileItem, PdfWrapperProps, PdfWrapperRefMethods } from '../types/evidence';

const { TextArea } = Input;
const { Search } = Input;
const { confirm } = Modal;
const { Option } = Select;

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PdfWrapper = forwardRef(({
    operationMode = 'edit',  //默认编辑模式，可选值：edit | view
    project_id,
    project_file_id,
    pdfUrl,
    page,
    zoom,
    allEvidence,
    typeList,
    onRefreshEvidence,
    resetAdding
}: PdfWrapperProps, ref: any)=>{
    const api = process.env.NEXT_PUBLIC_PROJECTS_API;

    //crop中默认的多边形区域高度
    const polygon_HEIGHT = 240;

    const pdfCanvas = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const renderTaskRef = useRef<any>(null);
    const showPageEvidenceRef = useRef<() => void>(() => {});
    const pdfPageText = useRef<TextContent>({} as TextContent);

    //pdf文件鼠标拖动相关变量
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({x: 0, y: 0});
    const [scrollStart, setScrollStart] = useState({left: 0, top: 0});


    const pdfDoc = useRef<any>(null);
    const currentViewportRef = useRef<ViewPort | null>(null);
    const [OCRForm] = Form.useForm();

    //OCR识别时保存的groupId
    const OCRGroupId = useRef<string | null>(null);

    //当前pdf缩放比例
    const [scale, setScale] = useState(1.0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [pageNum, setPageNum] = useState<number>(0);
    //截图对象集合
    const [cropSections, setCropSections] = useState<GroupFrame[]>([]);
    //stage的尺寸，确保和canvas一致
    const [stageWidth, setStageWidth] = useState(0);
    const [stageHeight, setStageHeight] = useState(0);

    //当前展示页面的Evidence集合, 为什么没有使用filter过滤pageNum，而是单独存储一份数据，因为缩放的过程中，需要先清除页面上所有的evidence，缩放后再显示，后面其实可以使用filter和标志位的方式，不用单独存储pageEvidence
    const [pageEvidence, setPageEvidence] = useState<object[]>([]);

    //当前是否正在绘制多边形
    const [isDrawingPolygon, setIsDrawingPolygon] = useState<boolean>(false);

    //截图模式  polygon | rect | text
    const [cropMode, setCropMode] = useState<string | null>(null);

    //识别的文本内容
    const [textContent, setTextContent] = useState<string>('');

    //是否显示OCR结果
    const [showOCRModal, setShowOCRModal] = useState<boolean>(false);

    //OCR识别结果
    const [ocrResult, setOcrResult] = useState<string>('');

    //鼠标拖拽前是否已经点击过
    const [isTClicked, setIsTClicked] = useState<boolean>(false);

    //全屏loading
    const [fullLoading, setFullLoading] = useState(false);

    //pdf loading
    const [pdfLoading, setPdfLoading] = useState(false);

    //旋转
    const [rotate, setRotate] = useState<number>(-1);
    //是否调整过角度
    const isAdjustRotateRef = useRef<boolean>(false);

    //记录拖拽开始前的group的坐标信息，用于计算相对坐标
    const dragCtxRef = useRef<Record<string, { minX: number; minY: number; width: number; height: number }>>({});
    //记录当前中心裁剪区域的索引，用于循环切换中心裁剪区域
    const centerIndexRef = useRef<number>(0);

    //当前选中的evidence
    const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

    const { setGlobalSpinning } =  useGlobalLoading();


    //右键弹出 新增调节点,目前暂不使用
    const [ctxMenu, setCtxMenu] = useState<{
        visible: boolean;        
        groupId: string;  //当前选中的group
        stageX: number;   //当前stage中的x坐标   
        stageY: number;   //当前stage中的y坐标
    }>({ 
        visible: false, 
        groupId: '', 
        stageX: 0, 
        stageY: 0, 
    });

    useImperativeHandle(ref, (): PdfWrapperRefMethods => ({
        resetAllInfo,
        getPageAmount,
        addingRect,
        rotatePDF
    }));

    useEffect(()=>{
        if ( page > 0 && page <= totalPages ){
            resetInfoByPageNum();
            setPageNum(page);
        }
    },[page])

    useEffect(()=>{
        if (zoom) {
            setPageEvidence([]);
            setScale(zoom);
        }
    },[zoom])


    useEffect(() => {
        if (pdfCanvas.current) {
            const ctx = pdfCanvas.current.getContext('2d');
            if (ctx) {
                ctxRef.current = ctx;
            } else {
                console.error("Failed to get canvas context");
            }
        }
    }, []);

    useEffect(()=>{
        console.log('######## pdfUrl change');
        if (!pdfUrl || pdfUrl.trim().length === 0) return; // 防止空 URL 加载
        loadPdf(pdfUrl);
    },[pdfUrl])

    //获取pdf文档相关信息
    const loadPdf = async (pdfUrl: string) => {
        if (!pdfUrl || pdfUrl.trim().length === 0) return; // 防止空 URL 加载
        console.log('########  loadPdf')
        setPdfLoading(true);
        const loadingTask = getDocument({
            url: pdfUrl,
            //允许流式/分块（确保服务端 Range 可用）
            disableStream: false,
            disableAutoFetch: false,
            rangeChunkSize: 256 * 1024,   //256KB：减少往返次数（可 128~512KB 试）
            withCredentials: false,       //视你的跨域策略而定
            cMapPacked: true,
            //如使用本地 cMap/标准字体，可指定目录（可选）：
            //cMapUrl: '/cmaps/', standardFontDataUrl: '/standard_fonts/'
        });
        loadingTask.promise.then((pdf: any) => {
            console.log('######## PDF loaded');
            setPdfLoading(false);

            pdfDoc.current = pdf;
            setTotalPages(pdf.numPages);
            setPageNum(1);
        }).catch(error => {
            console.error('Failed to load PDF:', error);
       //     setPdfLoading(false);
            notification.error({
                message: 'Error',
                description: error.message,
            });
        });
    }

    const getPageAmount = () => {
      if (!pdfDoc.current) return 0;
      return pdfDoc.current.numPages;
    };

    const addingRect = (addingOption)=>{
        if (addingOption?.type === 'Item'){
            setCropMode('Item');
        } else if (addingOption?.type === 'Table'){
            setCropMode('Table');
        } else {
           setCropMode(null); 
        }
    }

    //显示当前页面的evidence数据
    const showPageEvidence = useCallback(() => {
        if (allEvidence.length === 0 || !currentViewportRef.current){
            setPageEvidence([]);
            return;
        }

        //获取当前页面的evidence数据
        const currentPageEvidence = allEvidence.filter((item: any) => item.project_file_page_number === pageNum);

        //每次都重新计算 viewport 坐标，因为 scale 可能已变化
        const viewportList = currentPageEvidence.map((item: any) => {
            //解析存储的PDF坐标polygon数据
            let pdfPolygons = [];
            try {
                pdfPolygons = typeof item.polygon === 'string' 
                    ? JSON.parse(item.polygon)  
                    : item.polygon; 
            }
            catch (e) {
                console.log('Failed to parse polygon data:', item.polygon);
                return item;
            }
            
            //转换为当前 scale 下的 viewport 坐标
            const viewPoints = pdfPolygons.map((p: Point) =>{
                const viewPoint = currentViewportRef.current;
                if (!viewPoint) return { x: p.x, y: p.y };
                const [px, py] = viewPoint.convertToViewportPoint(p.x, p.y);
                return {x: px, y: py};
            });
            
            return {...item, viewportPolygons: viewPoints};
        });
        console.log('########## showPageEvidence', viewportList);
        setPageEvidence(viewportList);
    }, [pageNum, scale, allEvidence]);


    useEffect(() => {
        showPageEvidenceRef.current = showPageEvidence;
    }, [showPageEvidence]);

    //父组件allEvidence更新时，重新绘制页面中的evidence
    useEffect(() => {
        showPageEvidence();
    }, [allEvidence]);


    useEffect(() => {
        //render page功能
        if (!pdfDoc.current || !pdfCanvas.current || !ctxRef.current || pageNum === 0 ) return;
        console.log('######## renderPage start')
        let aborted = false;
        (async () => {
            const page = await pdfDoc.current.getPage(pageNum);
            const rotation = page.rotate;
            console.log('######## renderPage origin_rotation  = ' + rotation +  '  new_rotation = ' + rotate + ' isAdjustRotate = ' + isAdjustRotateRef.current);

            let viewPointsOptions = {
                scale,
                rotation: isAdjustRotateRef.current ? rotate : rotation, //调整过角度，则用最新的角度，没调整过角度，则使用默认的角度
            };
            console.log('######## renderPage viewPointsOptions ',viewPointsOptions);

            const viewport: ViewPort = page.getViewport(viewPointsOptions);
            console.log('######## renderPage viewport ',viewport);
            currentViewportRef.current = viewport;

            pdfCanvas.current!.width = viewport.width;
            pdfCanvas.current!.height = viewport.height;

            renderTaskRef.current?.cancel?.();
            const task = page.render({ 
                canvasContext: ctxRef.current!, 
                viewport 
            });
            renderTaskRef.current = task;

            try {
                await task.promise;
                if (aborted) return;

                setStageWidth(prev => viewport.width);
                setStageHeight(prev => viewport.height);

                
                showPageEvidenceRef.current();
                pdfPageText.current = await page.getTextContent(
                    {
                        normalizeWhitespace: true,  //合并连续空格
                        disableCombineTextItems: true, //禁用合并文本项
                    }
                );
                // 在页面渲染完成后再更新 cropSections 坐标
                // 确保 currentViewportRef.current 是最新的
                if (currentViewportRef.current && cropSections.length > 0) {
                    setCropSections(prev => {
                        return prev.map(group => {
                            // 如果已经有 pdfPolygons，则根据新的 scale 重新计算 viewport 坐标
                            if (group.pdfPolygons && group.pdfPolygons.length > 0) {
                                const newPolygons = group.pdfPolygons.map(p => {
                                    const [vx, vy] = currentViewportRef.current!.convertToViewportPoint(p.x, p.y);
                                    return { x: vx, y: vy };
                                });
                                return {
                                    ...group,
                                    polygons: newPolygons
                                };
                            }
                            // 如果没有 pdfPolygons（比如是新创建的但还没保存），则转换现有的坐标
                            else if (group.polygons.length > 0) {
                                const pdfPolygons = group.polygons.map(p => {
                                    const [px, py] = currentViewportRef.current!.convertToPdfPoint(p.x, p.y);
                                    return { x: px, y: py };
                                });
                                return {
                                    ...group,
                                    pdfPolygons: pdfPolygons
                                };
                            }
                            return group;
                        });

                    });
                }
                //    console.log('######## pdfPageText',pdfPageText.current)
            } catch (e: any) {
                if (e?.name !== 'RenderingCancelledException') console.error(e);
            }
        })();
        return () => {
            aborted = true;
            renderTaskRef.current?.cancel?.();
        };
    }, [pageNum, scale, rotate]);


    //上一页
    const prevPage = () => {
        if (pdfDoc.current && pageNum > 1) {
            const next = pageNum - 1;
            resetInfoByPageNum();
            setPageNum(next);
            //将滚动条滚动到顶部
            pdfCanvas.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    //下一页
    const nextPage = () => {
        if (pdfDoc.current && pageNum < totalPages) {
            const next = pageNum + 1;
            resetInfoByPageNum();
            setPageNum(next);
            //将滚动条滚动到顶部
            pdfCanvas.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    //制定页
    const pageChange = (page: number)=>{
        if (pdfDoc.current && pageNum <= totalPages) {
            resetInfoByPageNum();
            setPageNum(page);
            //将滚动条滚动到顶部
            pdfCanvas.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    //切换页面的时候，需要重置部分信息
    const resetInfoByPageNum = ()=>{
        setPageEvidence([]);
        setCropSections([]);
        setCropMode(null);
        resetAdding && resetAdding();
    }

    //放大，每次放大0.2，最大3.0倍
    const handleZoomIn = () => {
        const newScale = Math.min(5.0, scale + 0.2);
        setPageEvidence([]);
        setScale(newScale);
    };
    //缩小，每次缩小0.2，最小0.5倍
    const handleZoomOut = () => {
        const newScale = Math.max(0.5, scale - 0.2);
        setPageEvidence([])
        setScale(newScale);
    };

    //开始绘制
    const startDrawing = ()=>{
        // 如果当前处于裁剪模式，且cropSections有裁剪对象，则无法切换裁剪模式
        if (cropMode === null && cropSections.length > 0 ){
            return;
        }
        //如果没有加载出页面，则不能开始绘制
        if (!pdfDoc.current){
            notification.warning({
                message: "Warning",
                description: "Please load the PDF file first.",
            });
            return;
        }
        
        setCropMode('polygon');
        setIsDrawingPolygon(true);
        setCropSections([
            {
                id: `group-${Date.now()}`,
                type: 'polygon',
                completed: false,
                polygons: [],
                pdfPolygons: [],
            }
            
        ])
    }

    //完成绘制
    const completeDrawing = ()=>{
        //如果没有加载出页面，则不能停止绘制
        if (!pdfDoc.current){
            notification.warning({
                message: "Warning",
                description: "Please load the PDF file first.",
            });
            return;
        }
        setCropMode(null);
        setIsDrawingPolygon(false);

        setCropSections(prev=>{
            const list = [...prev];
            const g = list[0];
            
            if (g.polygons.length > 0){
                list[0] = { ...g, completed: true }
            } else {
                list.splice(0,1); //如果没有点，则删除该group
            }
            
            console.log('########  stopDrawing cropSections ',list);
            return list;
        })
    }

    const clearCropSections = () => {
        setCropSections([]);
        setIsDrawingPolygon(false);
        setCropMode(null);
        setTextContent('');
        //重置中心裁剪区域的索引
        centerIndexRef.current = 0;
        resetAdding && resetAdding();
    }

    //创建矩形裁剪
    const createRectCrop = (e: any) => { 
        if (!pdfDoc.current){
            notification.warning({
                message: "Warning",
                description: "Please load the PDF file first.",
            });
            return;
        }
        // 如果cropSections有裁剪对象，则无法切换裁剪模式
        if (cropSections.length > 0 ){
            return;
        }
        clearCropSections();
        setCropMode('rect');
    }


    //创建文本裁剪
    const createTextCrop = (e: any) => {
        if (!pdfDoc.current){
            notification.warning({
                message: "Warning",
                description: "Please load the PDF file first.",
            });
            return;
        }
        // 如果cropSections有裁剪对象，则无法切换裁剪模式
        if (cropSections.length > 0 ){
            return;
        }
        
        clearCropSections();
        setCropMode('text');
    }

    const rotatePDF = useCallback(async ()=>{
        if (!currentViewportRef.current){
            return;
        }
        const currentRotate = currentViewportRef.current?.rotation;
        let nextAngle = (currentRotate + 90) % 360;
        setFullLoading(true); 
        try{
            let isRotate = nextAngle > 0 ? true : false;
            // await request.put(`${api}/project/file/rotate/update`,null,{
            //     params:{
            //         project_file_id: project_file_id,
            //         is_rotate: isRotate,
            //         rotation_angle: nextAngle
            //     }
            // });
            console.log('####### project_file_id',project_file_id);
            console.log('####### isRotate',isRotate);
            console.log('####### nextAngle',nextAngle); 
            let res = await rotateChange(project_file_id, isRotate, nextAngle);
            if (res === 'success'){
                //清空裁剪对象
                clearCropSections();
                isAdjustRotateRef.current = true;
                setRotate(nextAngle);
            }
        }catch(error){
            console.log('######## rotatePDF error',error);
            notification.error({
                message: "Error",
                description: "Failed to rotate the PDF file.",
            });
        }finally{
            setFullLoading(false);
        }
    },[project_file_id])

    const onSelectChange = (groupId: string, value: string[]) => {
        setCropSections(prev=>{
            let group = prev.find(item=>item.id === groupId);
            if (group){
                let types: TypeItem[] = [];
                //找到value中对应的typelist中的元素
                value.forEach(item=>{
                    let type: TypeItem = typeList.find(type=>type.name === item);
                    if (type) types.push({name: type.name, description: type.description});
                })
                group.types = types;
            }
            return [...prev];
        })
    }

    const adjustToCenter = ()=>{
        //如果没有裁剪对象，则无需调整
        if (cropSections.length === 0){
            centerIndexRef.current = 0;
            return;
        }
        const container = scrollRef.current;
        if (!container) return;

        //获取当前中心裁剪区域的索引
        const index = Math.max(0, Math.min(centerIndexRef.current, cropSections.length - 1));
        const group = cropSections[index];
        centerIndexRef.current = (index + 1) % cropSections.length;

        if (!group || !group.polygons || group.polygons.length === 0) return;
        const { minX, minY, width, height } = getZoneBounds(group.polygons);
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;

        //获取容器宽度
        const viewW = container.clientWidth;
        const viewH = container.clientHeight;

        //获取目标左上角坐标
        let targetLeft = centerX - viewW / 2;
        let targetTop = centerY - viewH / 2;

        //获取最大左上角坐标
        const maxLeft = Math.max(0, (stageWidth || container.scrollWidth) - viewW);
        const maxTop = Math.max(0, (stageHeight || container.scrollHeight) - viewH);
        if (targetLeft < 0) targetLeft = 0; else if (targetLeft > maxLeft) targetLeft = maxLeft;
        if (targetTop < 0) targetTop = 0; else if (targetTop > maxTop) targetTop = maxTop;

        //滚动到目标位置
        try {
            container.scrollTo({ left: Math.round(targetLeft), top: Math.round(targetTop), behavior: 'smooth' });
        } catch (_) {
            container.scrollLeft = Math.round(targetLeft);
            container.scrollTop = Math.round(targetTop);
        }
    }

    //stage点击事件，添加多边形顶点
    const stageClick = (e: any)=>{
        e.evt.preventDefault();

        const stage = e.target.getStage();
        
        if (cropMode !== 'polygon'){
            //如果不是多边形绘制模式，则不能添加多边形顶点
            return;
        }
        if (!isDrawingPolygon){
            //如果没有开始绘制，则不能添加多边形顶点
            return;
        }

        //获取点击位置的坐标
        const pos = stage?.getPointerPosition() || { x: 0, y: 0 };
        if (cropSections[0].polygons) {
            setCropSections(prev=>{
                const list = [...prev];
                const g = list[0];
                const next = [...g.polygons, pos];

                // 同时更新 pdfPolygons
                let newPdfPolygons = g.pdfPolygons ? [...g.pdfPolygons] : [];
                if (currentViewportRef.current) {
                    const [px, py] = currentViewportRef.current.convertToPdfPoint(pos.x, pos.y);
                    newPdfPolygons.push({ x: px, y: py });
                }

                list[0] = { ...g, polygons: next, pdfPolygons: newPdfPolygons };
                return list;
            })
        }
    }

    const stageMouseDown = (e: KonvaEventObject)=>{
        e.evt.preventDefault();

        // 只允许左键开始拖动
        if (e.evt.button !== 0) return; // 0 = 左键

        //如果是圆形或者路径的拖动，则不触发Stage事件
        if (e.target.getClassName() === 'Circle' || e.target.getClassName() === 'Path'){
            return;
        }

        if (cropMode === null && e.target.getClassName() === 'Stage'){
            //没有裁剪模式的时候，认为当前不进行绘制图形，则执行pdf拖动操作
            handleMouseDown(e.evt);
            return;
        }

        const stage = e.target.getStage();
        const pos = stage.getPointerPosition() || { x: 0, y: 0 };

        //如果没有裁剪模式为多边形绘制模式，则不能执行鼠标拖动事件
        if (cropMode === 'polygon' ) return;

        setIsTClicked(true);

        //创建一个新的矩形
        setCropSections([
            {
                id: `group-${Date.now()}`,
                type: cropMode,
                completed: false,
                polygons: [{
                    x: pos.x,
                    y: pos.y,
                }],
                // 同时保存 PDF 坐标
                pdfPolygons: currentViewportRef.current ? 
                    [{ 
                        x: currentViewportRef.current.convertToPdfPoint(pos.x, pos.y)[0], 
                        y: currentViewportRef.current.convertToPdfPoint(pos.x, pos.y)[1] 
                    }] : []
                }    
        ])
    }
    const stageMouseMove = (e: KonvaEventObject)=>{
        e.evt.preventDefault();

        // 只允许左键开始拖动
        if (e.evt.button !== 0) return; // 0 = 左键
        //如果target是圆形或者已完成状态的path，则不触发Stage的绘图事件
        if (e.target.getClassName() === 'Circle' || 
           (e.target.getClassName() === 'Path') && cropMode === null ){
            return;
        }

        if (cropMode === null && e.target.getClassName() === 'Stage'){
            //没有裁剪模式的时候，认为当前不进行绘制图形，则执行pdf拖动操作
            handleMouseMove(e.evt);
            return;
        }

        const stage = e.target.getStage();
        const pos = stage.getPointerPosition() || { x: 0, y: 0 };
        //如果裁剪模式为多边形绘制模式，则不能执行鼠标拖动事件
        if (cropMode === 'polygon' ) return;

        if (!isTClicked) return;
        setCropSections((prev: GroupFrame[])=>{
            if (prev?.length === 0) return prev;
            let group: GroupFrame = {...prev[0]};
            const { x, y } = group.polygons[0];
            //计算4个坐标
            const left = Math.min(pos.x, x);
            const top = Math.min(pos.y, y);
            const right = Math.max(pos.x, x);
            const bottom = Math.max(pos.y, y);

            const newPolygons = [
                { x: left, y: top },
                { x: right, y: top },
                { x: right, y: bottom },
                { x: left, y: bottom }
            ];
            
            // 更新对应的 PDF 坐标
            let newPdfPolygons: Point[] = [];
            if (currentViewportRef.current) {
                newPdfPolygons = newPolygons.map(p => {
                    const [px, py] = currentViewportRef.current!.convertToPdfPoint(p.x, p.y);
                    return { x: px, y: py };
                });
            }
            return [{
                ...group,
                polygons: newPolygons,
                pdfPolygons: newPdfPolygons
            }];
        })

    }
    const stageMouseUp = (e: KonvaEventObject)=>{
        e.evt.preventDefault();

        if (e.evt.button !== 0) return; // 只允许左键结束

        if (cropMode === null && e.target.getClassName() === 'Stage'){
            //没有裁剪模式的时候，认为当前不进行绘制图形，则执行pdf拖动操作
            handleMouseUp();
            return;
        }

        //如果裁剪模式为多边形绘制模式，则不能执行鼠标拖动事件
        if (cropMode === 'polygon' ) return;

        setIsTClicked(false);
        setCropSections(prev=>{
            return prev.map(item=>{
                return {
                    ...item,
                    completed: true
                }
            })
        })
        setCropMode(null); 
    }



    //将base64转换为File对象
    const base64ToFile = (base64String: string, filename = 'image.png') => {
        //解析base64头部信息（如data:image/png;base64,）
        const arr = base64String.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        
        //提取MIME类型（如image/png）
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        
        //解码base64数据为二进制
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        //创建File对象（最后一个参数是文件名）
        return new File([u8arr], filename, { type: mime });
    };

    //生成截图
    const createImage = (groupId: string) => {
        console.log('========== 开始多边形区域裁剪 ==========');

        const canvas = pdfCanvas.current;
        const viewport = currentViewportRef.current;
        if (!canvas) {
            console.log('无法获取画布，请刷新页面重试');
            return null;
        }
        if (!viewport) {
            console.log('无法获取视图信息，请重新加载文档');
            return null;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.log('画布初始化失败，请刷新页面');
            return null;
        }

        //查找目标多边形组
        const targetGroup = cropSections.find((group: any) => group.id === groupId);
        if (!targetGroup) {
            console.log(`未找到指定的区域 ID: ${groupId}`);
            return null;
        }

        //验证多边形有效性
        const polygonPoints = targetGroup.polygons;
        if (!polygonPoints || polygonPoints.length < 3) {
            console.log('无效的区域，多边形至少需要3个点）');
            return null;
        }

        // 使用规范化顺序的多边形点，确保形成闭合边界
        const vpPoints = normalizePolygon(polygonPoints as Point[]);

        //视图参数
        const { width: vpW, height: vpH } = viewport;
        console.log('viewport 尺寸：', { vpW, vpH });

        //直接使用 viewport 点计算边界框（与原始 canvas 像素同一坐标系）
        const minX = Math.min(...vpPoints.map(p => p.x));
        const minY = Math.min(...vpPoints.map(p => p.y));
        const maxX = Math.max(...vpPoints.map(p => p.x));
        const maxY = Math.max(...vpPoints.map(p => p.y));

        //处理原始 canvas 与 viewport 的像素比例
        const vp2px = canvas.width / viewport.width; //一般为1
        const srcX = Math.round(minX * vp2px);
        const srcY = Math.round(minY * vp2px);
        const srcW = Math.max(1, Math.round((maxX - minX) * vp2px));
        const srcH = Math.max(1, Math.round((maxY - minY) * vp2px));

        console.log('裁剪源区域（canvas 像素）：', { srcX, srcY, srcW, srcH, vp2px });

        //目标画布尺寸 = 源像素尺寸 / 比例，保证与屏幕可见 1:1
        const outW = Math.max(1, Math.round(srcW / Math.max(1e-6, vp2px)));
        const outH = Math.max(1, Math.round(srcH / Math.max(1e-6, vp2px)));

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
            console.log('无法获取临时Canvas上下文');
            return null;
        }
        tempCanvas.width = outW;
        tempCanvas.height = outH;
        (tempCtx as any).imageSmoothingEnabled = false;

        //clip 路径（以临时画布左上角为原点的局部坐标）
        tempCtx.save();
        tempCtx.beginPath();
        vpPoints.forEach((p, i) => {
            const x = p.x - minX;
            const y = p.y - minY;
            if (i === 0) tempCtx.moveTo(x, y); else tempCtx.lineTo(x, y);
        });
        tempCtx.closePath();
        tempCtx.clip();

        //绘制源到目标（不缩放，像素一一对应，视觉一致）
        tempCtx.drawImage(
            canvas,
            srcX,
            srcY,
            srcW,
            srcH,
            0,
            0,
            outW,
            outH
        );
        tempCtx.restore();
        const imageUrl = tempCanvas.toDataURL('image/png');
        tempCanvas.remove();
        console.log('========== 多边形区域裁剪完成 ==========');
        return imageUrl;
    };

    //OCR文本识别
    const OCRRecogize = async (groupId: string) => {
        //生成图片文件
        let imageUrl = createImage(groupId);
        if (!imageUrl) return;

        //转换二进制文件
        const file = base64ToFile(imageUrl, `custom-image-${new Date()}.png`);
        setFullLoading(true);
        try{
            let formData  = new FormData();
            formData.append("file", file);
            // let res = await request.post(`${api}/evidence/ocr_detect_text`, formData,{
            //     headers: {"Content-Type": "multipart/form-data"}
            // })

            let res = '';

            notification.success({
                message: "Success",
                description: "OCR recognition successful.",
            });

            setFullLoading(false);

            setOcrResult(res?.full_text);
            if (OCRForm){
                OCRForm.setFieldsValue({
                    ocrResult: res?.full_text
                });
            }
            OCRGroupId.current = groupId;
            setShowOCRModal(true);
        }catch(error){
            console.log('######## OCRRecogize error ',error);
            setFullLoading(false);
            notification.error({
                message: "Error",
                description: error?.response?.data?.detail || "OCR recognition failed.",
            });
        }
    }

    //保存截图信息
    const saveEvidence =  async (groupId: string, params: object)=>{
        const targetGroup = cropSections.find(group => group.id === groupId);
        if (!targetGroup) return ;

        const vp = currentViewportRef.current!;
       
        const ordered = normalizePolygon(targetGroup.polygons);
        const pdfPolygon = ordered.map(p => {
            const [px, py] = vp.convertToPdfPoint(p.x, p.y);
            return { x: px, y: py };
        });

        console.log('######## saveEvidence targetGroup.polygons ',targetGroup.polygons);
        console.log('######## saveEvidence targetGroup.polygons convertToPdfPoint ',pdfPolygon);


        const pageWidthPdf  = vp.width  / vp.scale;
        const pageHeightPdf = vp.height / vp.scale;

        let patopoad: EvidenceType = {
            project_job_id: 0,
            project_id: Number(project_id),
            project_file_id: project_file_id,
            project_file_page_number: pageNum,
            polygon: JSON.stringify(pdfPolygon),
            sub_text: '',
            is_manual: true,
            device_pixel_ratio: window.devicePixelRatio || 1, //设备像素比
            type:'',
        //   "file_key": '',
            scale: vp.scale,
            page_width_pdf: pageWidthPdf,
            page_height_pdf: pageHeightPdf,
        };

        patopoad = {...patopoad, ...params};

        //判断是否选择了type，如果没选择type则不允许保存
        // if (!targetGroup.types || targetGroup?.types?.length === 0){
        //     notification.warning({
        //         message: 'Warning',
        //         description: 'Please select at least one type',
        //     })
        //     return;
        // }

        if (!targetGroup.type){
            notification.warning({
                message: 'Warning',
                description: 'Type is required',
            })
            return;
        }

        patopoad.type = JSON.stringify({name: targetGroup.type});

        // if (targetGroup.types && targetGroup.types.length > 0){
        //     patopoad.type = JSON.stringify(targetGroup.types);
        // }

        if (patopoad?.file){
            const file = base64ToFile(patopoad.file, `custom-image-${new Date()}.png`);
            patopoad.file = file;
        }

        console.log('######## saveEvidence patopoad',patopoad)

        let formData = new FormData();
        for(let key in patopoad){
            formData.append(key, patopoad[key]);
        }
        
        setFullLoading(true);

        const response = await handleSaveEvidence(formData);
        if (response.status === "success") {
            //生成截图成功后，删除当前的group
            deleteCrop(groupId);
            setFullLoading(false);
            //刷新evidence列表
            onRefreshEvidence && onRefreshEvidence();
        } else {
            setFullLoading(false);
            notification.error({
                message: "Error",
                description: error?.response?.data?.detail || "Evidence save failed.",
            });
  
        }
        /*
            try{
                await request.post(`${api}/evidence/save/form`, formData,{
                    headers: {"Content-Type": "multipart/form-data"}
                })
                notification.success({
                    message: "Success",
                    description: "Evidence saved successfully.",
                });
                //生成截图成功后，删除当前的group
                deleteCrop(groupId);
                setFullLoading(false);
                //刷新evidence列表
                onRefreshEvidence && onRefreshEvidence();
            }catch(error){
                console.log('######## saveEvidence error ',error);
                setFullLoading(false);
                notification.error({
                    message: "Error",
                    description: error?.response?.data?.detail || "Evidence save failed.",
                });
            }
        */
    }

    const saveTextEvidence = async (groupId: string)=>{
        if (textContent.length === 0){
            notification.warning({
                message: 'Warning',
                description: 'Confirm the recognized text first and save it.'
            })
            return;
        }
        let params = {
            sub_text: textContent,
        };
        saveEvidence(groupId, params )
    }

    //通过OCR识别，保存文本类型evidence
    const saveOCREvidence = async ()=>{
        if (!OCRGroupId) return;
        if (!OCRForm) return;

        let result = await OCRForm.getFieldValue('ocrResult')
        if (result.trim().length === 0) {
            notification.warning({
                message: "Warning",
                description: "OCR text is empty.",
            });
            return;
        }
        let params = {
            sub_text: result,
            is_ocr: true,
        };
        saveEvidence(OCRGroupId.current as string, params )
        setShowOCRModal(false)
        OCRGroupId.current = null;
    }

    const saveImageEvidence = (groupId: string)=>{
        let imageUrl = createImage(groupId);
        if (!imageUrl) return;
        saveEvidence(groupId, {
            file: imageUrl,
        });
    }

    //删除裁剪对象
    const deleteCrop = (groupId: string) => {
        let list = cropSections.filter((g: any) => g.id !== groupId);
        setCropSections(prev => {
            return [...list];
        });
        if (list.length === 0){
            clearCropSections();
        }
    }

    //将group添加到裁剪集合中
    const insertGroup = (group: GroupFrame) => {
        setCropSections((prev: any) => {
            const list = [...prev];
            list.push(group);
            return [...list]
        });
    };


    //添加矩形裁剪对象
    const addRectArea = () => {
        // 如果当前处于裁剪模式，且cropSections有裁剪对象，则无法切换裁剪模式
        if (cropMode !== null && cropSections.length > 0 ){
            return;
        }
        const viewPort = currentViewportRef.current;
        if (!viewPort) return;

        setCropMode('rect');

        const width = 360;
        const height = polygon_HEIGHT;
        
        const left =  60; 
        const top = 60; 
        const p1 = {x:left, y:top};
        const p2 = {x:left + width, y:top};
        const p3 = {x:left + width, y:top + height};
        const p4 = {x:left, y:top + height};

        // 计算对应的 PDF 坐标
        const pdfPoints = viewPort ? [
            {x: viewPort.convertToPdfPoint(p1.x, p1.y)[0], y: viewPort.convertToPdfPoint(p1.x, p1.y)[1]},
            {x: viewPort.convertToPdfPoint(p2.x, p2.y)[0], y: viewPort.convertToPdfPoint(p2.x, p2.y)[1]},
            {x: viewPort.convertToPdfPoint(p3.x, p3.y)[0], y: viewPort.convertToPdfPoint(p3.x, p3.y)[1]},
            {x: viewPort.convertToPdfPoint(p4.x, p4.y)[0], y: viewPort.convertToPdfPoint(p4.x, p4.y)[1]}
        ] : [];

        const groupFrame = {
            id: `group-${Date.now()}`,
            type: 'rect', //矩形
            polygons: [p1, p2, p3, p4],
            pdfPolygons: pdfPoints,
            completed: true,
        }
        
        insertGroup(groupFrame);
    };

    const recognizeText = async (groupId: string)=>{
        let group = cropSections.find(item=>item.id === groupId);
        if (!group) return;

        //if (!currentViewportRef.current) return;

        //生成图片文件
        let imageUrl = createImage(groupId);
        if (!imageUrl) return;

        //转换二进制文件
        const file = base64ToFile(imageUrl, `custom-image-${new Date()}.png`);
        setFullLoading(true);
        try{
            
            // const viewPort = currentViewportRef.current;
            // const {minX, minY, width, height} = getZoneBounds(group.polygons);
            // console.log('########   getZoneBounds',  getZoneBounds(group.polygons) )
            // console.log('########   pdfPageText.current',  pdfPageText.current)

            // const textString = PdfUtils.getTextInViewportRectWithLineBreaks(
            //     { x: minX, y: minY, width, height },
            //     pdfPageText.current,
            //     viewPort as any
            // );

            let formData  = new FormData();
            formData.append("file", file);
            // let res = await request.post(`${api}/evidence/ocr_detect_text`, formData,{
            //     headers: {"Content-Type": "multipart/form-data"}
            // })

            let res = ''; 

            notification.success({
                message: "Success",
                description: "OCR recognition successful.",
            });

            setFullLoading(false);

            let text = res?.full_text ?? '';
            console.log('######## text',text);
            setTextContent(text);
        }catch(error){
            console.log('######## recognizeText error',error);
            setFullLoading(false);
            notification.error({
                message: "Error",
                description: error?.response?.data?.detail || "OCR recognition failed.",
            });
        }  
    }

    /**
     * 
     * @param relativePolygons 相对group的坐标集合
     * @returns circle点集合
     */
    const getCriclePoints = (width: number, height: number) => {
        let x = 0;
        let y = 0;
        return [
            {type: 'topLeft', x: x, y: y,},
            {type: 'topRight', x: x + width, y: y,},
            {type: 'bottomRight', x: x + width, y: y + height},
            {type: 'bottomLeft', x: x, y: y + height,},
            {type: 'top', x: x + width / 2, y: y},
            {type: 'right', x: x + width, y: y + height / 2},
            {type: 'bottom', x: x + width / 2, y: y + height},
            {type: 'left', x: x, y: y + height / 2},
        ]
    }

    /**
     * 
     * @param group 截图区域
     * @param circlePt 圆形点
     * @param absX 绝对坐标x
     * @param absY 绝对坐标y
     * @returns 
     */
    const onMoveCircle = (
        group: GroupFrame,
        circlePt: CirclePoint,
        absX: number,
        absY: number,
    ): Point[] => {
        const frozen = dragCtxRef.current[group.id] || getZoneBounds(group.polygons);
        const startMinX = frozen.minX;
        const startMinY = frozen.minY;
        const startRight = startMinX + frozen.width;
        const startBottom = startMinY + frozen.height;

        //限制在stage范围内
        let px = Math.round(absX);
        let py = Math.round(absY);
        if (px < 0) px = 0; else if (px > stageWidth) px = stageWidth;
        if (py < 0) py = 0; else if (py > stageHeight) py = stageHeight;

        const minSize = 1;

        //计算新的矩形
        let newMinX = startMinX;
        let newMinY = startMinY;
        let newRight = startRight;
        let newBottom = startBottom;

        switch (circlePt.type) {
            // 左上角
            case 'topLeft': {
                let nx = px, ny = py;
                if (nx > startRight - minSize) nx = startRight - minSize;
                if (ny > startBottom - minSize) ny = startBottom - minSize;
                if (nx < 0) nx = 0;
                if (ny < 0) ny = 0;
                newMinX = nx; newMinY = ny;
                break;
            }
            // 右上角
            case 'topRight': {
                let rx = px, ny = py;
                if (rx < startMinX + minSize) rx = startMinX + minSize;
                if (ny > startBottom - minSize) ny = startBottom - minSize;
                if (rx > stageWidth) rx = stageWidth;
                if (ny < 0) ny = 0;
                newRight = rx; newMinY = ny;
                break;
            }
            // 右下角
            case 'bottomRight': {
                let rx = px, by = py;
                if (rx < startMinX + minSize) rx = startMinX + minSize;
                if (by < startMinY + minSize) by = startMinY + minSize;
                if (rx > stageWidth) rx = stageWidth;
                if (by > stageHeight) by = stageHeight;
                newRight = rx; newBottom = by;
                break;
            }
            // 左下角
            case 'bottomLeft': {
                let lx = px, by = py;
                if (lx > startRight - minSize) lx = startRight - minSize;
                if (by < startMinY + minSize) by = startMinY + minSize;
                if (lx < 0) lx = 0;
                if (by > stageHeight) by = stageHeight;
                newMinX = lx; newBottom = by;
                break;
            }

            // 上边
            case 'top': {
                let ny = py;
                if (ny > startBottom - minSize) ny = startBottom - minSize;
                if (ny < 0) ny = 0;
                newMinY = ny;
                break;
            }
            // 右边
            case 'right': {
                let rx = px;
                if (rx < startMinX + minSize) rx = startMinX + minSize;
                if (rx > stageWidth) rx = stageWidth;
                newRight = rx;
                break;
            }
            // 下边
            case 'bottom': {
                let by = py;
                if (by < startMinY + minSize) by = startMinY + minSize;
                if (by > stageHeight) by = stageHeight;
                newBottom = by;
                break;
            }
            // 左边
            case 'left': {
                let lx = px;
                if (lx > startRight - minSize) lx = startRight - minSize;
                if (lx < 0) lx = 0;
                newMinX = lx;
                break;
            }
            default:
                break;
        }

        // 重建多边形
        const p1 = { x: newMinX, y: newMinY };
        const p2 = { x: newRight, y: newMinY };
        const p3 = { x: newRight, y: newBottom };
        const p4 = { x: newMinX, y: newBottom };
        return [p1, p2, p3, p4];
    };
    //拖动顶点，更新多边形坐标
    const onVertexDragMove =(group: GroupFrame, vertexIndex: number, circlePt: CirclePoint, stageX: number, stageY: number)  =>{
        setCropSections(prev => {
            const list = [...prev];
            const groupIndex = list.findIndex((g: any) => g.id === group.id);
            if (groupIndex < 0) return prev;
            const g = list[groupIndex];
            let pts = [...g.polygons];

            if (g.type === 'rect') {
                pts = onMoveCircle(group, circlePt, stageX, stageY);
            } else {
                pts[vertexIndex] = {
                    x: stageX,
                    y: stageY,
                };
            }

            //同步更新pdf坐标，用于缩放记录
            let pdfPts = g.pdfPolygons ? [...g.pdfPolygons] : [];
            if (currentViewportRef.current) {
                if (g.type === 'rect') {
                    // 对于矩形，重新计算所有点的 PDF 坐标
                    pdfPts = pts.map(p => {
                        const [px, py] = currentViewportRef.current!.convertToPdfPoint(p.x, p.y);
                        return { x: px, y: py };
                    });
                } else {
                    // 对于多边形，只更新被拖动的点
                    if (pdfPts[vertexIndex]) {
                        const [px, py] = currentViewportRef.current.convertToPdfPoint(stageX, stageY);
                        pdfPts[vertexIndex] = { x: px, y: py };
                    }
                }
            }


            list[groupIndex] = { ...g, polygons: pts, pdfPolygons: pdfPts };
            return list;
        });
    }

    //移动截屏绘制区域
    const moveGroupByOffset = (groupId: string, dx: number, dy: number) => {
        if (!dx && !dy) return;
        setCropSections(prev => {
            const list = [...prev];
            const i = list.findIndex((g: any) => g.id === groupId);
            if (i < 0) return prev;
            const g = list[i];

            const newPolygons = g.polygons.map((p: any) => ({ x: p.x + dx, y: p.y + dy }));
        
            // 同步更新 PDF 坐标
            let newPdfPolygons = g.pdfPolygons ? [...g.pdfPolygons] : [];
            if (currentViewportRef.current) {
                newPdfPolygons = newPolygons.map(p => {
                    const [px, py] = currentViewportRef.current!.convertToPdfPoint(p.x, p.y);
                    return { x: px, y: py };
                });
            }
            
            list[i] = {
                ...g,
                polygons: newPolygons,
                pdfPolygons: newPdfPolygons
            };
            return list;
        });
    }

    //获取多边形的边界框
    const getZoneBounds = (polygons: Point[]) => {
        const xs = polygons.map(p => p.x);
        const ys = polygons.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const width = maxX - minX;
        const height = maxY - minY;
        return { minX, minY, maxX, maxY, width, height };
    }

    const copyShape = (groupId: string)=>{
        let groupObj = cropSections.find(g=>g.id === groupId);
        if (!groupObj) return;
        if (groupObj?.polygons?.length === 0){
            return;
        }

        // 获取原始形状的边界信息
        const originalBounds = getZoneBounds(groupObj.polygons);
        const { minX, minY, maxX, maxY, width, height } = originalBounds;
        
        // 计算向右平移的位置（在原始形状右侧留出一定间距）
        let offsetX = maxX + 30; // 在原始形状右侧20像素处
        let offsetY = minY;      // 保持相同的垂直位置
        
        // 检查向右平移后是否超出右边界
        if (offsetX + width > stageWidth) {
            // 如果向右平移后超出右边界，则尝试在原始形状下方放置
            offsetX = minX;                    // 保持相同的水平位置
            offsetY = maxY + 50;               // 在原始形状下方20像素处
            
            // 检查向下平移后是否超出底部边界
            if (offsetY + height > stageHeight) {
                // 如果也超出底部边界，则将形状移动到画布左上角附近 (60, 60)
                offsetX = 60;
                offsetY = 60;
            }
        }

        // 计算新的多边形坐标
        const newPolygons = groupObj.polygons.map(p => {
            return {
                x: p.x - minX + offsetX,  // 将形状移动到新位置
                y: p.y - minY + offsetY
            }
        });
        
        // 计算对应的 PDF 坐标
        let pdfPolygons: Point[] = [];
        if (currentViewportRef.current) {
            pdfPolygons = newPolygons.map(p => {
                const [px, py] = currentViewportRef.current!.convertToPdfPoint(p.x, p.y);
                return { x: px, y: py };
            });
        }
        
        // 创建新的 GroupFrame 对象
        const newGroup: GroupFrame = {
            id: `group-${Date.now()}`,
            type: groupObj.type,
            completed: true,
            polygons: newPolygons,
            pdfPolygons: pdfPolygons
        };
        
        // 添加到 cropSections 中
        setCropSections(prev => [...prev, newGroup]);
    }

    //规范化多边形点顺序：去重、按角度排序、统一顺时针方向（屏幕坐标系）
    const normalizePolygon = (points: Point[], epsilon = 0.5): Point[] => {
        if (!points || points.length < 3) return points || [];

        // 1) 去掉相邻重复点与首尾重复点
        const dedup: Point[] = [];
        for (const p of points) {
            const last = dedup[dedup.length - 1];
            if (!last || Math.hypot(p.x - last.x, p.y - last.y) > epsilon) {
                dedup.push(p);
            }
        }
        if (dedup.length > 1) {
            const first = dedup[0];
            const last = dedup[dedup.length - 1];
            if (Math.hypot(first.x - last.x, first.y - last.y) <= epsilon) {
                dedup.pop();
            }
        }
        if (dedup.length < 3) return dedup;

        // 2) 以质心为中心，按角度排序，保证顺序围成简单多边形（适用于常见的凸/近凸轮廓）
        const cx = dedup.reduce((s, p) => s + p.x, 0) / dedup.length;
        const cy = dedup.reduce((s, p) => s + p.y, 0) / dedup.length;
        const sorted = dedup
            .slice()
            .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));

        // 3) 统一为顺时针方向：屏幕坐标 y 轴向下，正面积通常表示逆时针
        const area = sorted.reduce((acc, p, i) => {
            const q = sorted[(i + 1) % sorted.length];
            return acc + (p.x * q.y - q.x * p.y);
        }, 0);
        const clockwise = area > 0 ? sorted.reverse() : sorted;
        return clockwise;
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        if (!isDragging) {
            setIsDragging(true);
            setDragStart({x: e.clientX, y: e.clientY});
            setScrollStart({
                left: scrollRef.current.scrollLeft,
                top: scrollRef.current.scrollTop,
            });
        } else {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            scrollRef.current.scrollLeft = scrollStart.left - dx;
            scrollRef.current.scrollTop = scrollStart.top - dy;
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        if (e.buttons !== 1) {
            setIsDragging(false);
            return;
        }
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        scrollRef.current.scrollLeft = scrollStart.left - dx;
        scrollRef.current.scrollTop = scrollStart.top - dy;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 清理函数
    const cleanupPreviousPDF = () => {
        // 销毁PDF文档实例
        if (pdfDoc.current) {
            pdfDoc.current.destroy();
            pdfDoc.current = null;
        }

        // 清空canvas内容
        if (ctxRef.current){
            ctxRef.current.clearRect(0, 0, pdfCanvas.current?.width || 0, pdfCanvas.current?.height || 0);
        }
    }

    //切换文件时，重置所有相关变量
    const resetAllInfo = () =>{
        cleanupPreviousPDF();
        clearCropSections();
        setPageEvidence([]);
        setPageNum(0);
        isAdjustRotateRef.current = false;
        setRotate(-1);
    }


    const handleNewWindow = ()=>{
        const winWidth = 800;  
        const winHeight = 600; 

        // 2. 计算居中位置（保持与 Safari 一致的居中效果）
    //    const left = (window.screen.availWidth - winWidth) / 2;
    //    const top = (window.screen.availHeight - winHeight) / 2;
        
        // 3. 关键参数：添加 popup=yes（告知 Chrome 这是弹窗），并禁用部分工具栏减少干扰
        const windowFeatures = [
            `width=${window.screen.availWidth}`,
            `height=${window.screen.availHeight}`,
            `left=${Math.round(0)}`,  // 取整避免位置偏移
            `top=${Math.round(0)}`,
            'popup=yes',                // 标记为悬浮弹窗
            'resizable=yes',            // 允许调整尺寸（可选）
            'toolbar=no',               // 禁用工具栏（减少窗口体积，避免被判定为全屏）
            'location=yes',             // 保留地址栏（按你的需求可调整为 no）
            'menubar=no',               // 禁用菜单栏（减少窗口体积）
            'noopener=yes',             // 隔离窗口与父窗口的引用关系，降低被判定为标签页的可能
            'noreferrer=yes'            // 隐藏来源信息，强化“独立弹窗”的特征
        ].join(',');
        
        // 打开窗口
        const newWin = window.open(
            `/evidence/evidence-window?project_id=${project_id}&project_file_id=${project_file_id}`,  // 你的目标 URL
            'CenteredFloatingWindow',
            windowFeatures
        );
    }

    //切换evidence类型
    const handleChangeEvidenceType = async (
        evidenceId: string,
        type: "Item" | "Table"
    ) => {
        setFullLoading(true);
        const response = await changeEvidenceType(evidenceId, type);
        if (response.status === "success") {
            onRefreshEvidence && onRefreshEvidence();
        }
        setFullLoading(false);
    };

    //删除evidence
    const handleDeleteEvidence = async (evidenceId: string) => {
      const response = await deleteEvidenceById(evidenceId);
      if (response.status === "success") {
        notification.success({
            type: "success",
            message: "Evidence deleted successfully",
        });
        onRefreshEvidence && onRefreshEvidence();
      }
    };

    const copyEvidenceShape = (evidence: EvidenceType, direction: "left" | "right" | "top")=>{
        let evid = pageEvidence.find((e: any) => e.id === evidence.id);
        if (!evid) return;  
        
        const gapX = 30;
        const gapY = 60;

        let groupId = `group-${evid.id}-${direction}`;
        // 查找同方向该evidence的复制品
        let copyShapes = cropSections.filter(s => s.id.includes(groupId));
        //查找copyShapes中最大的index
        let maxIndex = copyShapes.reduce((max, s) => Math.max(max, parseInt(s.id.split('-').pop() || '0')), -1);
        let shapePolygons = evid.viewportPolygons.map((p: any) => ({ x: p.x, y: p.y }));
        if (maxIndex >= 0){
            shapePolygons = copyShapes[maxIndex].polygons.map((s: any) => ({ x: s.x, y: s.y }));
        }
        let { minX, minY, width, height } = getZoneBounds(shapePolygons);
        
        maxIndex++;
        
        let targetLeft = minX;
        let targetTop = minY;
        let type = '';
        
        if (direction === "left") {
            targetLeft = minX - (width + gapX);
            if (targetLeft < 0){
                targetLeft = 0;
            }  
        } else if (direction === "right") {
            targetLeft = minX + (width + gapX);
            if (targetLeft + width > stageWidth){
                targetLeft = Math.max(0, stageWidth - width);
            }
        } else if (direction === "top") {
            targetTop = minY - (height + gapY);
            if (targetTop < 0){
                targetTop = 0;
            }
        }

        const dx = Math.round(targetLeft - minX);
        const dy = Math.round(targetTop - minY);

        const newPolygons = shapePolygons.map((polygon: any)=>{
            const nx = Math.min(Math.max(0,polygon.x + dx),Math.max(0, stageWidth));
            const ny = Math.min(Math.max(0,polygon.y + dy),Math.max(0, stageHeight));
            return {
                x: nx,
                y: ny
            }
        });
        

        let vp = currentViewportRef.current;
        let pdfPolygons = newPolygons.map((polygon: any)=>{
           let [x,y] = vp.convertToPdfPoint(polygon.x, polygon.y);
           return {x,y}
        });

        try{
            type = JSON.parse(evid.type).name;
        }catch(error){

        }

        let crop = {
            id: `group-${evid.id}-${direction}-${maxIndex}`,
            type: type,
            completed: true,
            polygons: newPolygons,
            // 同时保存 PDF 坐标
            pdfPolygons: pdfPolygons,
        }
        setCropSections([...cropSections, crop]);   
    }

    return (
        <div className="w-full h-full flex">
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* <div className="w-full h-[80px] flex flex-row justify-between px-3 border-b border-solid border-gray-300"> 
                    <div id="controls" className="h-full flex flex-row items-center gap-3">
                        <Tooltip title="Rect Area">
                            <Button 
                                type={cropMode === 'rect' ? 'primary': 'default' }  
                                onClick={createRectCrop}
                            > Rect</Button>
                        </Tooltip>
                        <Tooltip title="Polygon Area">
                                <Button 
                                type={cropMode === 'polygon' ? 'primary': 'default'}  
                                onClick={()=>{
                                    if (isDrawingPolygon){
                                        completeDrawing();
                                    } else {
                                        startDrawing();
                                    }
                                }}
                            >
                                {
                                    cropMode === 'polygon' && isDrawingPolygon ? 'Stop Drawing' : 'Start Drawing'
                                }
                            </Button>
                        </Tooltip>
                        <Tooltip title="Text Area">
                            <Button 
                                type={cropMode === 'text' ? 'primary': 'default'}  
                                onClick={createTextCrop}
                            >
                                T
                            </Button>
                        </Tooltip>
                        <Tooltip title="Clear Area">
                            <Button icon={<ClearOutlined />} onClick={clearCropSections}>Clear</Button>
                        </Tooltip>
                        <Tooltip title="Adjust to Center">
                            <Button icon={<PicCenterOutlined />} onClick={adjustToCenter}>Center</Button>
                        </Tooltip>
                        <Tooltip title="Rotate PDF file">
                            <Button icon={<SyncOutlined />} onClick={rotatePDF}>Rotate</Button>
                        </Tooltip>
                        { mode === 'half' &&  
                            <Tooltip title="New Window">
                                <Button onClick={handleNewWindow}>New Window</Button>
                            </Tooltip>
                        }
                       
                    </div>
                    <div className="flex flex-row items-center gap-3">
                        <div className="flex flex-row">
                            <div className="w-7 h-6 flex justify-center items-center rounded-tl-xl rounded-bl-xl bg-primaryGray cursor-pointer" 
                                onClick={handleZoomOut}
                            >
                                <Image
                                    alt=''
                                    src="/assets/icons/reduce.svg"
                                    width={8}
                                    height={8}
                                    preview={false}
                                /> 
                            </div>
                            <div className="w-7 h-6 flex justify-center items-center rounded-tr-xl rounded-br-xl bg-primaryGray cursor-pointer" 
                                style={{marginLeft:1}} 
                                onClick={handleZoomIn}
                            >
                                <Image
                                    alt=''
                                    src="/assets/icons/increase.svg"
                                    width={10}
                                    height={10}
                                    preview={false}
                                />
                            </div>

                            <span className="ml-4 flex items-center justify-center rounded-md text-center text-basicDarkGray text-[10px] border border-solid border-primaryN30"
                                style={{
                                    width:54,
                                    height:24
                                }}
                            >
                                {(scale * 100).toFixed(0) + '%'}
                            </span>
                        </div>
                        <div className="flex items-center rounded-md text-basicDarkGray text-[10px] border border-solid border-primaryN30" 
                            style={{
                                height:24
                            }}>
                            <div className="w-[18px] h-[100%] flex justify-center items-center cursor-pointer hover:bg-primaryGray border-r border-primaryN30 "
                                onClick={()=>prevPage()}
                            >
                                <Image
                                    alt=''
                                    src="/assets/icons/arrow-left.svg"
                                    width={6}
                                    height={10}
                                    preview={false}
                                />
                            </div> 
                            <Select
                                value={pageNum}
                                options={    
                                    Array.from({ length: totalPages }, (value, index) => ({
                                        label: `Page ${index + 1}`,
                                        value: index + 1,
                                    }))
                                }
                                style={{width:80,height:24}}
                                popupClassName="custom-select-dropdown"
                                variant="borderless"
                                suffixIcon={null}
                                rootClassName='custom-select-page'
                                onChange={pageChange}
                            />
                            <div className="w-[18px] h-[100%] flex justify-center items-center cursor-pointer hover:bg-primaryGray border-l border-primaryN30"
                                onClick={()=>nextPage()}
                            >
                                <Image
                                    alt=''
                                    src="/assets/icons/arrow-right.svg"
                                    width={6}
                                    height={10}
                                    preview={false}
                                />
                            </div>
                        </div>
                    </div>
                </div> */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <div
                        ref={scrollRef} 
                        className="flex-1 overflow-auto" 
                        style={{minHeight:0}} 
                    >
                        <div style={{position: 'relative', width: stageWidth + 'px', height: stageHeight + 'px'}}>
                            <canvas ref={pdfCanvas} />
                            
                            {/** Stage层处理图形绘制方面 */}
                            <Stage 
                                width={stageWidth} 
                                height={stageHeight} 
                                style={{position: 'absolute', top: 0, left: 0,touchAction:'inherit'}} 
                                onClick={stageClick} 
                                onMouseDown={(e) =>{
                                    // 鼠标按下时关闭右键菜单（除了右键点击）
                                    if (ctxMenu.visible && e.evt.button !== 2) {
                                        setCtxMenu(prev => ({ ...prev, visible: false }));
                                    }
                                    stageMouseDown(e)
                                }}
                                onMouseMove={stageMouseMove}
                                onMouseUp={stageMouseUp}
                            >
                                <Layer>
                                    {pageEvidence.map((item: any, index: number) => {
                                        //使用已经转换好的viewport坐标
                                        if (!item.viewportPolygons || item.viewportPolygons.length === 0) {
                                            return null;
                                        }
                                        //获取多边形的最小x和最小y，作为Group的x和y
                                        const minX = Math.min(...item.viewportPolygons.map(p => p.x));
                                        const minY = Math.min(...item.viewportPolygons.map(p => p.y));

                                        //将多边形坐标转换为相对于 Group 的相对坐标

                                        const relativePolygons = item.viewportPolygons.map(p => ({
                                            x: p.x - minX,
                                            y: p.y - minY
                                        }));
                                    
                                        //将相对坐标转换成 Path 数据
                                        const pathData = [
                                            `M ${relativePolygons[0].x} ${relativePolygons[0].y}`,
                                            ...relativePolygons.slice(1).map((p: Point) => `L ${p.x} ${p.y}`),
                                            'Z' //闭合路径
                                        ].join(' ');

                                        //红色为image evidence，绿色为text evidence
                                        //let color = item.evidence_url ? 'red' : 'orange';
                                        let color = colorList.forumBlue || '';
                                        let type = '';
                                        try{
                                            const typeParams = JSON.parse(item.type);
                                            color = (typeParams.name === "Item") ? colorList.forumBlue : colorList.accentIndigo;
                                            type = typeParams.name;
                                        }catch(error){

                                        }
                                        return (
                                            <Group key={item.id + '_' + index }
                                                x ={minX}
                                                y ={minY}
                                            >
                                                {/* 交互用描边 Path（仅用边界进行命中）*/}
                                                <Path
                                                    data={pathData}
                                                    //fillEnabled={false}
                                                    fill={`${color}30`}
                                                    stroke={color}
                                                    strokeWidth={1}
                                                    style={{
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={()=>{
                                                        //* 鼠标点击时，如果当前操作模式为查看，则返回 */
                                                        if (operationMode === 'view'){
                                                            return;
                                                        }
                                                        if (selectedEvidenceId === item.id){
                                                            setSelectedEvidenceId(null)
                                                        }else {
                                                            setSelectedEvidenceId(item.id)
                                                        }
                                                    }}
                                                    
                                                />
                                            </Group>
                                            )
                                    })} 
                                    {cropSections.map((group: GroupFrame) => {
                                        //将多边形坐标转换为相对于 Group 的相对坐标
                                        if (group.polygons.length === 0) {
                                            return null;
                                        }

                                        const { minX, minY, width, height } = getZoneBounds(group.polygons);

                                        const relativePolygons = group.polygons.map(p => ({
                                            x: p.x - minX,
                                            y: p.y - minY
                                        }));
                                        
                                        //将相对坐标转换成 Path 数据
                                        let pathData = [
                                            `M ${relativePolygons[0].x} ${relativePolygons[0].y}`,
                                            ...relativePolygons.slice(1).map(p => `L ${p.x} ${p.y}`),
                                        //'Z' //闭合路径
                                        ].join(' ');

                                        let circlePoints: CirclePoint[] = [];
                                        if (group.type === 'rect'){
                                            //矩形区域，则是闭合路径
                                            pathData += 'Z';
                                            if (group.completed){
                                            //    circlePoints = getCriclePoints(width, height);
                                            }
                                        } else if (group.type === 'polygon' ){
                                            //多边形区域，则根据是否完成绘制来判断闭合路径
                                            if (group.completed){
                                                pathData += 'Z';
                                            //    circlePoints = relativePolygons.map((p, i) => ({ type: `v${i}`, x: p.x, y: p.y }));
                                            }
                                        } else if (group.type === 'text' || group.type === 'Item' || group.type === 'Table'){
                                            pathData += 'Z';
                                        }

                                        const color = group?.type === "Item" ? colorList.forumBlue : colorList.accentIndigo;
                                        
                                        return (
                                            <Group key={group.id}
                                                x ={minX}
                                                y ={minY}
                                            >
                                                <Path
                                                    data={pathData}
                                                //    fill= { isDrawingPolygon ? 'transparent' : "rgba(22,119,255,0.2)"}
                                                    fill={color + '30'}
                                                    strokeEnabled={false}
                                                    draggable
                                                    dragDistance={2}
                                                    onDragStart={(e) => { 
                                                        e.cancelBubble = true; 
                                                    }}
                                                    onDragMove={(e) => {
                                                        e.cancelBubble = true;
                                                        const n = e.target;
                                                        const { x, y } = n.position();          //local to Group
                                                        moveGroupByOffset(group.id, x, y);       //平移状态（见下）
                                                        n.position({ x: 0, y: 0 });             //把把手复位
                                                    }}
                                                    onDragEnd={(e) => {
                                                        e.cancelBubble = true;

                                                        const n = e.target;
                                                        const { x, y } = n.position();
                                                        if (x || y) moveGroupByOffset(group.id, x, y);
                                                        n.position({ x: 0, y: 0 });
                                                    }}
                                                    // onContextMenu={(e) => {
                                                    //     e.evt.preventDefault();
                                                    //     if (group.type !== 'text' && group.completed ){
                                                    //         //如果是矩形或者多边形，且形状已经完成，则点击右键，弹出copy按钮
                                                    //         const stage = e.target.getStage();
                                                    //         const p = stage?.getPointerPosition();
                                                    //         if (!p) return;
                                                    //         setCtxMenu({
                                                    //             visible: true,
                                                    //             stageX: p.x,
                                                    //             stageY: p.y,
                                                    //             groupId: group.id
                                                    //         })
                                                    //     }
                                                    // }}
                                                />

                                                {
                                                    group.type !== 'text' ? 
                                                    <Path
                                                        data={pathData}
                                                        fillEnabled={false}
                                                        stroke={color}
                                                        strokeWidth={1}
                                                    /> :null
                                                }

                                                {circlePoints.map((pt, idx) => (
                                                    <Circle
                                                        key={`${group.id}-v-${idx}`}
                                                        x={pt.x}
                                                        y={pt.y}
                                                        radius={4}
                                                        fill="#fff"
                                                        stroke="#1677ff"
                                                        strokeWidth={2}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.cancelBubble = true;
                                                            const { minX, minY, width, height } = getZoneBounds(group.polygons);
                                                            dragCtxRef.current[group.id] = { minX, minY, width, height }; // English: freeze bbox for this drag
                                                        }}
                                                        onDragMove={(e) => {
                                                            e.cancelBubble = true;
                                                            const stage = e.target.getStage();
                                                            const p = stage?.getPointerPosition();
                                                            if (!p) return;
                                                            console.log('########  onDragMove')
                                                            e.target.position({ x: pt.x, y: pt.y });
                                                            onVertexDragMove(group,idx, pt, p.x, p.y);
                                                        }}
                                                        onDragEnd={(e) => {
                                                            e.cancelBubble = true;
                                                            delete dragCtxRef.current[group.id]; // English: release after drag
                                                        }}
                                                        dragBoundFunc={(pos) => ({ x: Math.round(pt.x), y: Math.round(pt.y) })}
                                                    />
                                                ))}
                                            </Group>
                                        );
                                    })}
                                </Layer>
                            </Stage>

                            {/** 处理Evidence按钮的相关显示  */}
                            {
                                pageEvidence.map((item: any, index: number) => {
                                    //* 鼠标点击时，如果当前操作模式为查看，则返回 */
                                    if (operationMode === 'view'){
                                        return null;
                                    }
                                    
                                    //使用已经转换好的viewport坐标
                                    if (!item.viewportPolygons || item.viewportPolygons.length === 0) {
                                        return null;
                                    }
                                    let { minX, minY, width, height } = getZoneBounds(item.viewportPolygons);
                                    
                                    let color = colorList.forumBlue;
                                    let type = '';
                                    try{
                                        const typeParams = JSON.parse(item.type);
                                        color = (typeParams.name === "Item") ? colorList.forumBlue : colorList.accentIndigo;
                                        type = typeParams.name;
                                    }catch(error){

                                    }

                                    return <div
                                        key={item.id}
                                        className={`absolute`}
                                        style={{
                                            left: minX,
                                            top: minY,
                                            //width: width + 'px',
                                            //height: height + 'px',
                                            // borderWidth:1,
                                            // borderColor: color,
                                            // backgroundColor: `${color}30`,
                                        }}                                                
                                    >
                                        <div className="absolute"
                                            style={{
                                                top: selectedEvidenceId === item.id ? ( minY - 44 < 0 ? 0 : '-44px' ) :  ( minY - 24 < 0 ? 0 : '-24px' ), 
                                            }}
                                        >
                                            <div className="w-[170px] flex items-center gap-2">
                                                <div className="flex flex-row rounded-full bg-primaryN20 overflow-hidden cursor-pointer">
                                                    <p
                                                        className={`px-2 py-0.5 text-basicGray text-xs ${
                                                            type === "Item"
                                                            ? "bg-primaryN30"
                                                            : "hover:bg-primaryN30 opacity-70 hover:opacity-100"
                                                        }`}
                                                        onClick={() => {
                                                            if (type === "Item") return;
                                                            handleChangeEvidenceType(item.id, "Item");
                                                        }}
                                                        >
                                                        Item
                                                    </p>
                                                    <p
                                                        className={`px-2 py-0.5 text-basicGray text-xs ${
                                                            type === "Table"
                                                            ? "bg-primaryN30"
                                                            : "hover:bg-primaryN30 opacity-70 hover:opacity-100"
                                                        }`}
                                                        onClick={() => {
                                                            if (type === "Table") return;
                                                            handleChangeEvidenceType(item.id, "Table");
                                                        }}
                                                    >
                                                        Table
                                                    </p>
                                                </div>
                                                <Popconfirm
                                                    title="Are you sure you want to delete this evidence?"
                                                    onConfirm={() => handleDeleteEvidence(item.id)}
                                                >
                                                    <div className="bg-primaryN50 rounded-lg px-[4px] py-[2px] cursor-pointer hover:bg-primaryN30">
                                                    <Image
                                                        src="/assets/icons/delete-dark.svg"
                                                        alt="delete icon"
                                                        width={15}
                                                        height={15}
                                                    />
                                                    </div>
                                                </Popconfirm>
                                            </div>
                                            <div
                                                className="flex justify-center transition-all"
                                                style={{
                                                    position: 'absolute',
                                                    left: (width / 2 - 10) + 'px',
                                                    top: '22px',
                                                    display: selectedEvidenceId === item.id ? 'block' : 'none',
                                                }}
                                            >
                                                <div className={`w-[20px] h-[20px] flex justify-center items-center text-white rounded-full cursor-pointer`}
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                    onClick={()=>{
                                                        copyEvidenceShape(item,'top');
                                                    }}
                                                >
                                                    <span className="inline-block">+</span>
                                                </div>
                                            </div>
                                        </div>
                                       
                                        <div
                                            className="flex items-center transition-all"
                                            style={{
                                                position: 'absolute',
                                                left: (minX - 24) < 0 ? 0 : '-24px',
                                                top: (height / 2 - 10) + 'px',
                                                display: selectedEvidenceId === item.id ? 'block' : 'none',
                                            }}
                                        >
                                            <div className={`w-[20px] h-[20px]  flex justify-center items-center text-white rounded-full cursor-pointer`}
                                                style={{
                                                    backgroundColor: color
                                                }}
                                                onClick={()=>{
                                                    copyEvidenceShape(item,'left');
                                                }}
                                            >
                                                <span className="inline-block">+</span>
                                            </div>
                                        </div>
                                        <div
                                            className="flex items-center transition-all"
                                            style={{
                                                position: 'absolute',
                                                left: (width + 2) + 'px',
                                                top: (height / 2 - 10) + 'px',
                                                display: selectedEvidenceId === item.id ? 'block' : 'none',
                                            }}
                                        >
                                            <div className={`w-[20px] h-[20px]  flex justify-center items-center text-white rounded-full cursor-pointer`}
                                                style={{
                                                    backgroundColor: color
                                                }}
                                                onClick={()=>{
                                                    copyEvidenceShape(item,'right');
                                                }}
                                            >
                                                <span className="inline-block">+</span>
                                            </div>
                                        </div>
                                    </div>
                                })
                            }
                            
                            {/** 处理图形绘制的按钮相关显示  */}
                            { 
                                cropSections.map((group: GroupFrame) => {
                                    if (!group.completed){
                                        return null;
                                    }
                                    if (group.polygons.length === 0) {
                                        return null;
                                    }
                                    const { minX, minY, width, height} = getZoneBounds(group.polygons);
                                    let top = minY - 30 < 0 ? 5 : minY - 30;
                                    return (
                                        <div
                                            key={group.id}
                                            style={{
                                                position: 'absolute',
                                                left: minX,
                                                top: top,
                                            }} 
                                        >
                                            {/* <Select
                                                style={{width: 300, height: 30}}
                                                mode="multiple" // 开启多选模式
                                                showSearch
                                                placeholder="Please select"
                                                optionFilterProp="children"
                                                filterOption={(input, option) => {
                                                    return option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                }}
                                                onChange={(value)=>{onSelectChange(group.id, value)}}
                                            >
                                                {
                                                    typeList.map((item, index) => {
                                                        return (
                                                            <Option key={item.name + '_' + index } value={item.name}>{item.name}</Option>
                                                        )
                                                    })
                                                }
                                            </Select> */}
                                            <div className="flex flex-row items-center gap-2">
                                                <Button
                                                    backgroundColor="forumBlue"
                                                    onClick={() => saveImageEvidence(group.id)}
                                                >
                                                    <p className="text-xs">
                                                        Confirm
                                                    </p>
                                                </Button>
                                                <div className="bg-primaryN50 px-[4px] py-[2px] rounded-lg px-1 cursor-pointer hover:bg-primaryN30"
                                                    onClick={()=>{
                                                        deleteCrop(group.id)
                                                    }}
                                                >
                                                    <Image
                                                        src="/assets/icons/delete-dark.svg"
                                                        alt="delete icon"
                                                        width={15}
                                                        height={15}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                            
                            {/* { 
                                cropSections.map((group: GroupFrame) => {
                                    if (!group.completed){
                                        return null;
                                    }
                                    if (group.polygons.length === 0) {
                                        return null;
                                    }
                                    const { minX, minY, width, height} = getZoneBounds(group.polygons);
                                    return (
                                        <div
                                            key={group.id}
                                            style={{
                                                position: 'absolute',
                                                left: minX,
                                                top: minY + height + 10,
                                                width: width,
                                            }} 
                                        >
                                            <div className="flex gap-2">
                                                {
                                                    group.type === 'text' ?
                                                    <div className="flex gap-2">
                                                        <Button type="primary" onClick={()=>recognizeText(group.id)} style={{marginRight:10}}>Recognize Text</Button>
                                                        <Button type="primary" onClick={()=>saveTextEvidence(group.id)}>Save</Button>
                                                    </div> :
                                                    <div className="flex gap-2">
                                                    <Button type='primary' onClick={()=>OCRRecogize(group.id)}>OCR</Button>
                                                    <Button type='primary' onClick={()=>saveImageEvidence(group.id)}>Screenshot</Button>
                                                    </div>
                                                }
                                            
                                                <Button type="primary" onClick={()=>deleteCrop(group.id)}>Delete</Button>
                                            </div>
                                            
                                            {
                                                <div className="bg-[yellow] max-h-[300px] overflow-auto whitespace-pre-line" style={{width: 290, maxHeight:300}}>{textContent}</div>
                                            }
                                        </div>
                                    )
                                })
                            } */}
                            {ctxMenu.visible && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: ctxMenu.stageX,
                                        top: ctxMenu.stageY,
                                        background: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: 6,
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                        zIndex: 1000,
                                    }}
                                >
                                    <div
                                        style={{ padding: '8px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                        onClick={() => {
                                            copyShape(ctxMenu.groupId);
                                            setCtxMenu(pre=>({...pre, visible: false}));
                                        }}
                                    >
                                        Copy
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    { pdfLoading && 
                        <div className="absolute inset-0 z-[999] w-[100%] h-[100%] flex justify-center items-center">
                            <Spin />
                        </div> 
                    }
                </div>
            </div>
            {
                fullLoading && 
                <Spin
                    fullscreen
                    size="large"
                    indicator={<LoadingOutlined spin />}
                    className="text-white"
                    delay={150}
                    tip={<p className="animate-pulse text-xl">Loading...</p>}
                />
            }
            {/* {showOCRModal && <Modal
                title="OCR text recognition results"
                open={showOCRModal}
                footer={null}
                onCancel={()=>{
                    setShowOCRModal(false)
                    setOcrResult('');
                }}
            >
                <Form
                    form={OCRForm}
                    initialValues={{
                        ocrResult: ocrResult
                    }}
                    onFinish={saveOCREvidence} // 校验通过后执行
                >
                    <Form.Item name="ocrResult">
                        <TextArea autoSize={true} />
                    </Form.Item>
                     <Form.Item
                        wrapperCol={{
                            span: 14,
                            offset: 10,
                        }}
                    >
                        <Button type="primary" htmlType="submit">
                            Save
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>} */}
        </div>
    );
});

PdfWrapper.displayName = 'PdfWrapper';
export default PdfWrapper;