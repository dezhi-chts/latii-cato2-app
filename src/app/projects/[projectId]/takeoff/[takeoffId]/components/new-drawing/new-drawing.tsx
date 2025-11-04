import http from '@/lib/http';
import {
    Button,
    Col,
    Divider,
    Empty,
    InputNumber,
    Layout,
    notification,
    Result,
    Row,
    Segmented,
    Select,
    Space,
    Spin,
    Tooltip,
} from 'antd';
import { useState, useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';
import Drawing, { WindowDrawerRef } from '../drawing';
import styles from './new.drawing.module.css';
import FoldingSelect from '../folding-select';
import OperabilitySelect from '../operability-select';
import ShapeList from '../shape-list';
import ShapeItemQuoteUse from '../shape-item-quote-use';

const { Header, Content } = Layout;
import {
    UndoOutlined,
    RedoOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    DeleteOutlined,
    DragOutlined,
    ScissorOutlined,
    ColumnHeightOutlined,
    MergeCellsOutlined,
    SplitCellsOutlined,
} from '@ant-design/icons';
import { DividerType, OperationType, ShapeType } from '../drawing/datas';

const noShapeProductTypeList = ['54', '55', '56'];

const noOpenProductTypeList = ['47'];

interface INewDrawingProps {
    currentItem: any;
    cancelCustomize: () => void;
    handleUpdateCustomizeUnit: (e: any) => void;
    from: string;
    handleUpdateQuote: (e: any) => void;
    setIsOpenNewDrawingBox: (e: any) => void;
}

const NewDrawing = ({
    currentItem,
    cancelCustomize,
    handleUpdateCustomizeUnit,
    from,
    handleUpdateQuote,
    setIsOpenNewDrawingBox,
}: INewDrawingProps) => {
    const [canvasMode, setCanvasMode] = useState<any>('render');
    const canvasModeRef: any = useRef();
    useEffect(() => {
        canvasModeRef.current = canvasMode;
    }, [canvasMode]);

    const [isLoading, setIsLoading] = useState<any>(true);

    const [item, setItem] = useState<any>(currentItem);

    const [allProductProductTypeOpen, setAllProductProductTypeOpen] = useState<any>([]);

    const [canvasRelationData, setCanvasRelationData] = useState<any>([]);
    const canvasRelationDataRef: any = useRef();
    useEffect(() => {
        canvasRelationDataRef.current = canvasRelationData;
    }, [canvasRelationData]);

    const [isSystem, setIsSystem] = useState<any>(false);
    const [allProduct, setAllProduct] = useState<any>([]);
    const [allProductType, setAllProductType] = useState<any>([]);
    const [allOpen, setAllOpen] = useState<any>([]);

    const [leftActionData, setLeftActionData] = useState<any>({});
    const leftActionDataRef: any = useRef();
    useEffect(() => {
        leftActionDataRef.current = leftActionData;
    }, [leftActionData]);

    const [isAllowGetTemplate, setIsAllowGetTemplate] = useState<any>(false);
    const [allTemplate, setAllTemplate] = useState<any>([]);

    const [selectedTemplate, setSelectedTemplate] = useState<any>({});
    const selectedTemplateRef: any = useRef();
    useEffect(() => {
        selectedTemplateRef.current = selectedTemplate;
    }, [selectedTemplate]);

    const [saveLoading, setSaveLoading] = useState<any>(false);

    const [allDividedLiteType, setAllDividedLiteType] = useState<any>([]);
    const [selectedDividedLiteType, setSelectedDividedLiteType] = useState<any>({});

    const [allDividersArrangement, setAllDividersArrangement] = useState<any>([]);
    const allDividersArrangementRef: any = useRef();
    useEffect(() => {
        allDividersArrangementRef.current = allDividersArrangement;
    }, [allDividersArrangement]);

    const [selectedDividersArrangement, setSelectedDividersArrangement] = useState<any>([]);

    const [currentMode, setCurrentMode] = useState<any>(null);

    const [maxWidthHeight, setMaxWidthHeight] = useState<any>({
        max_width: null,
        max_height: null,
    });
    const sizeMultiples = 5;

    useEffect(() => {
        const initData = async () => {
            console.log(item.is_system, 'item.is_systemitem.is_system');
            if (item.is_system == false) {
                console.log('-------');
                setIsLoading(true);
                setIsSystem(false);
                let arr: any = [];
                item.units.forEach((item: any) => {
                    let obj = {
                        product_value: item.product.selected_value,
                        product_type_value: item.product_type.selected_value,
                        operability_value: item.operability.selected_value,
                        width_input: item.width_input,
                        height_input: item.height_input,
                        position_x: item.position_x,
                        position_y: item.position_y,
                        divider_data: item.divider_data,
                        shape: item.shape,
                        shape_data: item.shape_data,
                        id: item.id, // unit_id
                    };
                    arr.push(JSON.parse(JSON.stringify(obj)));
                });
                setLeftActionData(JSON.parse(JSON.stringify(arr[0])));
                setCanvasRelationData(arr);
                getAllProductProductTypeOpen();

                let canvasData: any = {};
                if (from == 'itemCard') {
                    canvasData = await getItemCanvasData(item.id);

                    arr[0].canvas_data = canvasData[arr[0].id] ? canvasData[arr[0].id] : {};
                }

                let isRenderCanvasData = false;
                if (arr[0].id && arr[0].product_value && arr[0].product_type_value) {
                    if (noOpenProductTypeList.includes(arr[0].product_type_value?.toString())) {
                        if (arr[0].width_input && arr[0].height_input) {
                            isRenderCanvasData = true;
                        }
                    } else {
                        if (arr[0].operability_value && arr[0].width_input && arr[0].height_input) {
                            isRenderCanvasData = true;
                        }
                    }
                }
                if (isRenderCanvasData) {
                    let canvasUseData = setCanvasUseData(arr);
                    if (drawingRef.current) {
                        let dimension_data: any = null;
                        if (canvasData.dimension_data) {
                            dimension_data = canvasData.dimension_data;
                        }
                        if (from == 'systemDrawing') {
                            console.log(item.units, 'item.unitsitem.unitsitem.units');
                            canvasUseData[0].canvas_data = item.units[0].canvas_data;
                            dimension_data = null;
                            drawingRef.current.importUnits(canvasUseData, dimension_data);
                            setTimeout(() => {
                                if (from == 'systemDrawing') {
                                    handleSketch();
                                }
                            }, 200);
                        } else {
                            console.log(canvasUseData, dimension_data, 'canvasData');
                            drawingRef.current.importUnits(canvasUseData, dimension_data);
                            setTimeout(() => {
                                drawingRef.current?.updateUnit(arr[0].id, {
                                    width: arr[0].width_input,
                                    height: arr[0].height_input,
                                    x: arr[0].position_x || null,
                                    y: arr[0].position_y || null,
                                });
                            }, 100);
                        }
                    }
                }

                // 获取sdl/tdl数据
                let item_type_value = item.item_type.selected_value;
                let frame_material_value = item.frame_material.selected_value;
                let profile_value = item.profile.selected_value;
                let casting_style_value = item.casting_style.selected_value;
                getAllDividedLiteType(item_type_value, frame_material_value, profile_value, casting_style_value);
            } else {
                setIsSystem(true);
                let arr: any = [];
                item.units.forEach((item: any) => {
                    let obj = {
                        product_value: item.product.selected_value,
                        product_type_value: item.product_type.selected_value,
                        operability_value: item.operability.selected_value,
                        width_input: item.width_input,
                        height_input: item.height_input,
                        position_x: item.position_x,
                        position_y: item.position_y,
                        divider_data: item.divider_data,
                        canvas_data: item.canvas_data,
                        shape: item.shape,
                        shape_data: item.shape_data,
                        id: item.id, // unit_id
                    };
                    arr.push(obj);
                });
            }
        };
        initData();
    }, []);

    const getItemCanvasData = (itemId: string) => {
        return new Promise((resolve) => {
            http.get(`/quote/get_item_canvas_data/item/${itemId}`).then((res) => {
                Object.keys(res.data).map((s: any) => {
                    if (typeof res.data[s] !== 'string') {
                        res.data[s] = JSON.stringify(res.data[s]);
                    }
                });
                resolve(res.data);
            });
        });
    };

    const getAllDividedLiteType = (
        item_type_value: any,
        frame_material_value: any,
        profile_value: any,
        casting_style_value: any
    ) => {
        let url = `/product/divided_lite_type`;
        if (item_type_value) {
            url = `${url}?item_type_value=${item_type_value}`;
        }
        if (frame_material_value) {
            url = `${url}&frame_material_value=${frame_material_value}`;
        }
        if (profile_value) {
            url = `${url}&profile_value=${profile_value}`;
        }
        if (casting_style_value) {
            url = `${url}&casting_style_value=${casting_style_value}`;
        }
        http.get(url)
            .then((data: any) => {
                if (data.is_success) {
                    if (data.data && data.data.length) {
                        data.data.forEach((item: any) => {
                            item.label = item.text;
                        });
                        if (data.data.length == 1 && data.data[0].value == 'none') {
                            let tempSdlTdl = data.data;
                            // tempSdlTdl.push({
                            //     value:"sdl",
                            //     text:"SDL",
                            //     label:"SDL"
                            // })
                            // tempSdlTdl.push({
                            //     value:"tdl",
                            //     text:"TDL",
                            //     label:"TDL"
                            // })
                            setAllDividedLiteType([...tempSdlTdl]);
                        } else {
                            setAllDividedLiteType(data.data);
                        }

                        setSelectedDividedLiteType(data.data[0]);
                    }
                }
            })
            .catch((error: any) => {
                console.error('Error fetching data:', error);
            })
            .finally(() => {});
    };

    const setCanvasUseData = (data: any) => {
        let arr: any = [];
        data.forEach((item: any) => {
            let msg: any = {
                id: item.id,
                product_value: item.product_value,
                product_type_value: item.product_type_value,
                operability_value: item.operability_value,
                width_input: item.width_input,
                height_input: item.height_input,
                position_x: item.position_x,
                position_y: item.position_y,
                canvas_data: item.canvas_data,
            };
            arr.push(msg);
        });
        return arr;
    };

    const getAllTemplate = async () => {
        let product: any = leftActionDataRef.current.product_value;
        let product_type: any = leftActionDataRef.current.product_type_value;
        let operability: any = leftActionDataRef.current.operability_value;
        if (!product) {
            setIsAllowGetTemplate(false);
            setMaxWidthHeight({
                max_width: null,
                max_height: null,
            });
            return;
        }
        if (!product_type) {
            setIsAllowGetTemplate(false);
            setMaxWidthHeight({
                max_width: null,
                max_height: null,
            });
            return;
        }
        if (noOpenProductTypeList.includes(product_type?.toString())) {
            operability = null;
        } else {
            if (!operability) {
                setIsAllowGetTemplate(false);
                setMaxWidthHeight({
                    max_width: null,
                    max_height: null,
                });
                return;
            }
        }
        setIsAllowGetTemplate(true);
        let url = `/drawing/`;
        if (product) {
            url = `${url}?product=${Number(product)}`;
        }
        if (product_type) {
            url = `${url}&product_type=${Number(product_type)}`;
        }
        if (operability) {
            url = `${url}&operability=${operability}`;
        }
        http.get(url).then(async (data: any) => {
            if (data.is_success) {
                let arr: any = [];
                data.data.forEach((item: any) => {
                    if (
                        item.shape == 'square' ||
                        item.shape == 'triangle' ||
                        item.shape == 'half_circle' ||
                        item.shape == 'circle'
                    ) {
                        arr.push(item);
                    }
                });
                setAllTemplate(arr);
                if (selectedTemplate.id) {
                    let isHaveSelectedTemplate: any = false;
                    data.data.forEach((item: any) => {
                        if (item.id == selectedTemplate.id) {
                            isHaveSelectedTemplate = true;
                        }
                    });
                    if (!isHaveSelectedTemplate) {
                        // setSelectedTemplate({})
                        // data.data.forEach((item:any)=>{
                        //     if(item.shape == "square"){
                        //         onSelectedTemplate(item)
                        //     }
                        // })
                    }
                } else {
                    // data.data.forEach((item:any)=>{
                    //     if(item.shape == "square"){
                    //         onSelectedTemplate(item)
                    //     }
                    // })
                }

                getMaxWidthHeight(product_type, operability);
            }
        });
    };

    const getMaxWidthHeight = (product_type_value: any, operability_value: any) => {
        let url = `/product/max_width_height/all`;
        if (product_type_value) {
            url = `${url}?product_type_value=${Number(product_type_value)}`;
        }
        if (operability_value) {
            url = `${url}&operability_value=${operability_value}`;
        }
        if (item.profile.selected_value) {
            url = `${url}&profile_value=${Number(item.profile.selected_value)}`;
        }
        http.get(url)
            .then((data: any) => {
                if (data.is_success) {
                    let max_width: any = null;
                    let max_height: any = null;
                    if (data.data.max_width) {
                        max_width = data.data.max_width;
                    }
                    if (data.data.max_height) {
                        max_height = data.data.max_height;
                    }
                    setMaxWidthHeight({
                        max_width,
                        max_height,
                    });
                }
            })
            .catch((error: any) => {
                console.error('Error fetching data:', error);
            })
            .finally(() => {});
    };

    const getAllProductProductTypeOpen = () => {
        let url = `/quote/dict/product_type_profiles_tree/filters`;
        url = url + `?frame_brand=${item.frame_material?.selected_value}`;
        http.get(url)
            .then((data: any) => {
                if (data.is_success) {
                    setAllProductProductTypeOpen(data.data);

                    setAllProductFunc(data.data);

                    if (leftActionDataRef.current.product_value) {
                        setAllProductTypeFunc(data.data, leftActionDataRef.current.product_value);
                    }
                    if (leftActionDataRef.current.product_value && leftActionDataRef.current.product_type_value) {
                        setAllProductTypeOpenFunc(
                            data.data,
                            leftActionDataRef.current.product_value,
                            leftActionDataRef.current.product_type_value
                        );
                    }
                    getAllTemplate();
                }
            })
            .catch((error: any) => {
                console.error('Error fetching data:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const setAllProductFunc = (data: any) => {
        let arr: any = [];
        data.map((item: any) => {
            arr.push({
                value: item.value,
                text: item.text,
                label: item.text,
            });
        });
        setAllProduct(arr);
    };

    const setAllProductTypeFunc = (data: any, product_value: any) => {
        let arr: any = [];
        data.map((item: any) => {
            if (item.value == product_value) {
                item.children.forEach((item2: any) => {
                    arr.push({
                        value: item2.value,
                        text: item2.text,
                        details: item2.details,
                    });
                });
            }
        });
        arr.sort((a: any, b: any) => {
            if (a.text && b.text) {
                return a.text.localeCompare(b.text);
            }
            return 0;
        });
        setAllProductType(arr);
        setAllOpen([]);
    };

    const setAllProductTypeOpenFunc = (data: any, product_value: any, product_type_value: any) => {
        let arr: any = [];
        data.map((item: any) => {
            if (item.value == product_value) {
                item.children.forEach((item2: any) => {
                    if (item2.value == product_type_value) {
                        item2.children.forEach((item3: any) => {
                            if (item3.type == 'operability') {
                                arr.push({
                                    value: item3.value,
                                    text: item3.text,
                                    details: item3.details,
                                });
                            }
                        });
                    }
                });
            }
        });
        setAllOpen(arr);
        if (arr.length == 1) {
            leftActionDataRef.current.operability_value = arr[0].value;
            setLeftActionData({ ...leftActionDataRef.current });
        }
    };

    const productChange = (value: any) => {
        leftActionData.product_value = value;
        leftActionData.product_type_value = null;
        leftActionData.operability_value = null;
        setMaxWidthHeight({
            max_width: null,
            max_height: null,
        });
        setLeftActionData({ ...leftActionData });
        setAllProductTypeFunc(allProductProductTypeOpen, leftActionData.product_value);
        getAllTemplate();
    };

    const changeProductType = (value: any) => {
        leftActionData.product_type_value = value;
        leftActionData.operability_value = null;
        setLeftActionData({ ...leftActionData });
        setAllProductTypeOpenFunc(
            allProductProductTypeOpen,
            leftActionData.product_value,
            leftActionData.product_type_value
        );
        getAllTemplate();
    };

    const changeOpen = (value: any) => {
        leftActionData.operability_value = value;
        setLeftActionData({ ...leftActionData });
        getAllTemplate();
    };

    const setValue = (msg: any, options: any) => {
        let tempStr: any = '';
        if (options) {
            options.forEach((item: any) => {
                if (msg.value == item.value) {
                    tempStr = item.text;
                }
            });
        }
        return tempStr;
    };

    const hasCorner = (options: any) => {
        return options?.some((option: any) => option?.value?.includes('corner'));
    };

    const foldHandleSelectChange = (value: string, index: number, type: string) => {
        leftActionData.operability_value = value;
        setLeftActionData({ ...leftActionData });
        getAllTemplate();
    };

    const cornerHandleSelected = (value: string, index: number, type: string) => {
        leftActionData.operability_value = value;
        setLeftActionData({ ...leftActionData });
        getAllTemplate();
    };

    const changeWidth = (value: any) => {
        leftActionData.width_input = value;
        setLeftActionData({ ...leftActionData });
        if (drawingRef.current) {
            drawingRef.current.updateUnit(leftActionData.id, {
                width: Number(leftActionData.width_input),
            });
        }
    };

    const changeHeight = (value: any) => {
        leftActionData.height_input = value;
        setLeftActionData({ ...leftActionData });
        if (drawingRef.current) {
            drawingRef.current.updateUnit(leftActionData.id, {
                height: Number(leftActionData.height_input),
            });
        }
    };

    const onSelectedTemplate = (tempMsg: any, from: any = null) => {
        http.get(`/drawing/${tempMsg.id}`).then(async (res: any) => {
            if (res.is_success) {
                if (res.data && res.data.id) {
                    setSelectedTemplate(res.data);
                    let leftActionData = leftActionDataRef.current;
                    leftActionData.canvas_data = res.data.data_structure;

                    let data_structure: any = JSON.parse(res.data.data_structure);
                    if (typeof data_structure === 'string') {
                        data_structure = JSON.parse(data_structure);
                    }

                    let widthHeightMsg: any = calculationFunc(data_structure.components);
                    let width = widthHeightMsg.width || 0;
                    let height = widthHeightMsg.height || 0;

                    // if(from == "userClick"){
                    //     leftActionData['width_input'] = width || 750
                    //     leftActionData['height_input'] = height || 1500
                    // }else{
                    //     if(!leftActionData['width_input']){
                    //         leftActionData['width_input'] = width || 750
                    //     }
                    //     if(!leftActionData['height_input']){
                    //         leftActionData['height_input'] = height || 1500
                    //     }
                    // }
                    if (!leftActionData['width_input']) {
                        leftActionData['width_input'] = width || 750;
                    }
                    if (!leftActionData['height_input']) {
                        leftActionData['height_input'] = height || 1500;
                    }
                    leftActionData.shape = tempMsg.shape || '';
                    setLeftActionData({ ...leftActionData });
                    setTimeout(() => {
                        windowDoorReplace();
                    }, 200);
                }
            }
        });
    };

    const windowDoorReplace = () => {
        let leftActionData = leftActionDataRef.current;
        let selectedTemplate = selectedTemplateRef.current;
        if (selectedTemplate && selectedTemplate.id && selectedTemplate.data_structure) {
            leftActionData.canvas_data = selectedTemplate.data_structure;
        }
        let arr = [leftActionData];
        let canvasUseData = setCanvasUseData(arr);
        setTimeout(() => {
            if (drawingRef.current) {
                let data_structure: any = JSON.parse(canvasUseData[0].canvas_data);
                if (typeof data_structure === 'string') {
                    data_structure = JSON.parse(data_structure);
                }
                drawingRef.current.resetUnit(canvasUseData[0]);
                setTimeout(() => {
                    drawingRef.current?.updateUnit(arr[0].id, {
                        width: arr[0].width_input,
                        height: arr[0].height_input,
                        x: arr[0].position_x || null,
                        y: arr[0].position_y || null,
                    });
                }, 100);
            }
        }, 100);
    };

    const isDisabledCustomizeBtnFuc = (product_value: any, product_type_value: any, operability_value: any) => {
        let isDisabled: any = true;
        if (!product_value) {
            return isDisabled;
        }
        if (!product_type_value) {
            return isDisabled;
        }
        if (noOpenProductTypeList.includes(product_type_value?.toString())) {
            isDisabled = false;
        } else {
            if (!operability_value) {
                return isDisabled;
            }
            isDisabled = false;
        }
        return isDisabled;
    };

    const confirmCustomize = (canvas_data: any) => {
        if (canvas_data) {
            leftActionData.canvas_data = canvas_data;

            let data_structure: any = JSON.parse(canvas_data);
            if (typeof data_structure === 'string') {
                data_structure = JSON.parse(data_structure);
            }
            let widthHeightMsg: any = calculationFunc(data_structure.components);
            let width = widthHeightMsg.width || 0;
            let height = widthHeightMsg.height || 0;
            leftActionData.width_input = width;
            leftActionData.height_input = height;
            setLeftActionData({ ...leftActionData });
            let arr = [leftActionData];
            let canvasUseData = setCanvasUseData(arr);
            if (drawingRef.current) {
                drawingRef.current.resetUnit(canvasUseData[0]);
                setTimeout(() => {
                    drawingRef.current?.updateUnit(arr[0].id, {
                        width: arr[0].width_input,
                        height: arr[0].height_input,
                    });
                }, 100);
            }
        }
    };

    const saveUnit = async () => {
        if (canvasMode == 'sketch') {
            notification.warning({
                message: 'Warning message',
                description: 'Please click the Render button first',
            });
            return;
        }
        if (drawingRef.current) {
            let data: any = drawingRef.current.exportUnits();
            let dimension_data = drawingRef.current.exportDimensions();
            dimension_data = JSON.stringify(dimension_data);
            setWebsocketUnitsByCanvasToolReturnData(data);
            setTimeout(async () => {
                setSaveLoading(true);
                if (!isSystem) {
                    item.units[0].product.selected_value = leftActionData.product_value;
                    item.units[0].product_type.selected_value = leftActionData.product_type_value;
                    item.units[0].operability.selected_value = leftActionData.operability_value;
                    item.units[0].product_type.options = allProductType;
                    item.units[0].operability.options = allOpen;

                    item.item_type.selected_value = leftActionData.product_value;

                    if (drawingRef.current) {
                        let imgMsg = await drawingRef.current.exportImage();
                        const blob = dataURLtoBlob(imgMsg.dataURL);
                        const file = blobToFile(blob, 'system_drawing.png');
                        let item_id = item.id;
                        let type = 'drawing';
                        const formData = new FormData();

                        const finnalData: any = {
                            dimension_data: dimension_data,
                        };
                        finnalData[item.units[0].id] = data[0].canvas_data;
                        formData.append('unit_files', file);
                        formData.append('unit_ids', [item.units[0].id]);
                        formData.append('canvas_data', JSON.stringify(finnalData));
                        formData.append('item_file', file);

                        http.post(
                            `/quote/update_canvas_data_and_item_unit_image/${item_id}/item_image_type/${type}`,
                            formData
                        )
                            .then(() => {
                                if (item.image) {
                                    console.log(type, 'current_selected_modecurrent_selected_mode');
                                    item.image.current_selected_mode = type;
                                }
                                console.log(item, '------11111111111111------item');
                                item.units.forEach((unitItem: any) => {
                                    unitItem.canvas_data = null;
                                });
                                handleUpdateQuote(item);
                                setSaveLoading(false);
                                setIsOpenNewDrawingBox(false);
                            })
                            .catch((error) => {
                                console.error('Error fetching data:', error);
                            });
                    }
                }
            }, 100);
        }
    };

    const updateHandleUnit = () => {
        if (canvasModeRef.current == 'sketch') {
            notification.warning({
                message: 'Warning message',
                description: 'Please click the Render button first',
            });
            return;
        }
        if (drawingRef.current) {
            let data = drawingRef.current.exportUnits();
            setWebsocketUnitsByCanvasToolReturnData(data);

            setTimeout(async () => {
                if (!isSystem) {
                    item.units[0].product.selected_value = leftActionData.product_value;
                    item.units[0].product_type.selected_value = leftActionData.product_type_value;
                    item.units[0].operability.selected_value = leftActionData.operability_value;

                    item.units[0].product_type.options = allProductType;
                    item.units[0].operability.options = allOpen;

                    item.item_type.selected_value = leftActionData.product_value;

                    let returnUnitMsg: any = {
                        id: currentItem.units[0].id,
                        product: item.units[0].product,
                        product_type: item.units[0].product_type,
                        operability: item.units[0].operability,
                        canvas_data: item.units[0].canvas_data,
                        width_input: item.units[0].width_input,
                        height_input: item.units[0].height_input,
                    };
                    handleUpdateCustomizeUnit(returnUnitMsg);
                }
            }, 100);
        }
    };

    const dataURLtoBlob = (dataurl: any) => {
        var arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr?.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    };
    const blobToFile = (theBlob: any, fileName: any) => {
        theBlob.lastModifiedDate = new Date();
        theBlob.name = fileName;
        return new File([theBlob], fileName, {
            type: theBlob.type,
            lastModified: Date.now(),
        });
    };

    // 以下是divider
    const sdlTdlChange = (value: any) => {
        selectedDividedLiteType.value = value;
        selectedDividersArrangement.value = '';
        setSelectedDividedLiteType({ ...selectedDividedLiteType });
        let item_type_value = item.item_type.selected_value;
        let frame_material_value = item.frame_material.selected_value;
        let profile_value = item.profile.selected_value;
        let casting_style_value = item.casting_style.selected_value;
        getDividersArrangement(
            item_type_value,
            frame_material_value,
            profile_value,
            casting_style_value,
            selectedDividedLiteType.value
        );
    };
    const changeDividersArrangement = (value: any) => {
        selectedDividersArrangement.value = value;
        setSelectedDividersArrangement({ ...selectedDividersArrangement });
    };
    const getDividersArrangement = (
        item_type_value: any,
        frame_material_value: any,
        profile_value: any,
        casting_style_value: any,
        divided_lite_type_value: any
    ) => {
        let url = `/product/divided_lite_type/dividers_arrangement`;
        if (item_type_value) {
            url = `${url}?item_type_value=${item_type_value}`;
        }
        if (frame_material_value) {
            url = `${url}&frame_material_value=${frame_material_value}`;
        }
        if (profile_value) {
            url = `${url}&profile_value=${profile_value}`;
        }
        if (casting_style_value) {
            url = `${url}&casting_style_value=${casting_style_value}`;
        }
        if (divided_lite_type_value) {
            url = `${url}&divided_lite_type_value=${divided_lite_type_value}`;
        }
        http.get(url)
            .then((data: any) => {
                if (data.is_success) {
                    if (data.data && data.data.length) {
                        data.data.forEach((item: any) => {
                            item.label = item.text;
                        });
                        setAllDividersArrangement(data.data);
                    } else {
                        setAllDividersArrangement([]);
                    }
                }
            })
            .catch((error: any) => {
                console.error('Error fetching data:', error);
            })
            .finally(() => {});
    };

    // 以下是画布相关的处理
    const drawingRef = useRef<WindowDrawerRef>(null);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const updateUndoRedoState = () => {
        if (drawingRef.current) {
            setCanUndo(drawingRef.current.canUndo());
            setCanRedo(drawingRef.current.canRedo());
        }
    };
    const handleUndo = debounce(() => {
        if (drawingRef.current) {
            drawingRef.current.undo();
            updateUndoRedoState();
        }
    }, 200);

    const handleRedo = debounce(() => {
        if (drawingRef.current) {
            drawingRef.current.redo();
            updateUndoRedoState();
        }
    }, 200);

    const handleDrawingChange = useCallback(
        (data: any) => {
            updateUndoRedoState();
        },
        [updateUndoRedoState]
    );

    const handleDelete = () => {
        if (drawingRef.current) {
            drawingRef.current.removeElement();
        }
    };

    const handleRender = () => {
        if (drawingRef.current) {
            let id: any = leftActionDataRef.current.id;
            if (id) {
                if (from == 'systemDrawing') {
                    let setCanvasModeToRenderAndToUpdateUnit = () => {
                        setCanvasMode('render');
                        setTimeout(() => {
                            updateHandleUnit();
                        }, 200);
                    };
                    drawingRef.current.renderUnit(id, setCanvasModeToRenderAndToUpdateUnit);
                } else {
                    let setCanvasModeToRender = () => {
                        setCanvasMode('render');
                    };
                    drawingRef.current.renderUnit(id, setCanvasModeToRender);
                }
            }
        }
    };

    const hanleCancel = () => {
        if (from == 'systemDrawing') {
            cancelCustomize();
            return;
        }

        setCanvasMode('render');
        if (drawingRef.current) {
            let id: any = leftActionDataRef.current.id;
            let leftActionData = leftActionDataRef.current;
            let arr = [leftActionData];
            let canvasUseData = setCanvasUseData(arr);
            if (id) {
                handleClear();
                setTimeout(() => {
                    drawingRef.current.resetUnit(canvasUseData[0]);
                }, 300);
            }
        }
    };

    const handleSketch = () => {
        if (drawingRef.current) {
            let id: any = leftActionDataRef.current.id;
            if (id) {
                drawingRef.current.sketchUnit(id, setCanvasMode);
            }
        }
    };

    const canvasToolChange = (data: any) => {
        setWebsocketUnitsByCanvasToolReturnData(data);
    };

    const calculationFunc = (msg: any) => {
        let obj: any = {};
        const bounds =
            msg
                .filter(
                    (child: any) =>
                        child.type == ShapeType.Rectangle ||
                        child.type == ShapeType.LineH ||
                        child.type == ShapeType.LineV ||
                        child.type == ShapeType.ArchH ||
                        child.type == ShapeType.ArchV ||
                        child.type == ShapeType.Triangle ||
                        child.type == ShapeType.Group
                        //gn:POCKET_WALL 暂时不参与计算，没有实际意义
                        //  || child.type == OperationType.POCKET_WALL
                )
                ?.reduce(
                    (acc, element) => ({
                        minX: Math.min(acc.minX, element.virtualFrame.x),
                        maxX: Math.max(acc.maxX, element.virtualFrame.x + element.virtualFrame.width),
                        minY: Math.min(acc.minY, element.virtualFrame.y),
                        maxY: Math.max(acc.maxY, element.virtualFrame.y + element.virtualFrame.height),
                    }),
                    {
                        minX: Infinity,
                        maxX: -Infinity,
                        minY: Infinity,
                        maxY: -Infinity,
                    }
                ) || {};
        obj.position_x = bounds.minX;
        obj.position_y = bounds.minY;
        obj.width = bounds.maxX - bounds.minX;
        obj.height = bounds.maxY - bounds.minY;
        return obj;
    };

    const setWebsocketUnitsByCanvasToolReturnData = (data: any) => {
        if (data.length == 0) {
            item.units = [];
        } else {
            item.units.forEach((item: any, index: any) => {
                data.forEach((item1: any) => {
                    if (item.id == item1.unitId) {
                        item.canvas_data = item1.canvas_data;
                        item.position_x = item1.virtualFrame.x;
                        item.position_y = item1.virtualFrame.y;
                    }
                });
            });
            item.units.forEach((item: any) => {
                // 设置宽高
                let data_structure = JSON.parse(item.canvas_data);
                let widthHeightMsg: any = calculationFunc(data_structure.components);
                let width = widthHeightMsg.width || 0;
                let height = widthHeightMsg.height || 0;
                item.width_input = width;
                item.height_input = height;

                // 设置shape, shape_data, divider_data
                let shape = '';
                let shape_data: any = {
                    area: 0,
                };
                let arcNumber = 0;
                let isTrapezoid = false;
                let divider_data: any = [];
                data_structure.zones.forEach((item: any) => {
                    shape_data.area = shape_data.area + item.area;
                    if (item.lines && item.lines.length != 0) {
                        item.lines.forEach((item1: any) => {
                            if (item1.type == 'arch') {
                                arcNumber = arcNumber + 1;
                            }
                            if (item1.type == 'oblique') {
                                isTrapezoid = true;
                            }
                        });
                    }
                    if (item.dividers && item.dividers.length != 0) {
                        item.dividers.forEach((item1: any) => {
                            if (item1.type.includes('SDL') || item1.type.includes('sdl')) {
                                divider_data.push({
                                    divided_lite_type: 'sdl',
                                    divided_lite_type_text: 'SDL',
                                    dividers_arrangement:
                                        selectedDividersArrangement.value && selectedDividedLiteType.value == 'sdl'
                                            ? selectedDividersArrangement.value
                                            : '',
                                    dividers_arrangement_text:
                                        selectedDividersArrangement.value && selectedDividedLiteType.value == 'sdl'
                                            ? setValue(selectedDividersArrangement, allDividersArrangementRef.current)
                                            : '',
                                    length: item1.length,
                                });
                            }
                            if (item1.type.includes('TDL') || item1.type.includes('tdl')) {
                                divider_data.push({
                                    divided_lite_type: 'tdl',
                                    divided_lite_type_text: 'TDL',
                                    dividers_arrangement:
                                        selectedDividersArrangement.value && selectedDividedLiteType.value == 'tdl'
                                            ? selectedDividersArrangement.value
                                            : '',
                                    dividers_arrangement_text:
                                        selectedDividersArrangement.value && selectedDividedLiteType.value == 'tdl'
                                            ? setValue(selectedDividersArrangement, allDividersArrangementRef.current)
                                            : '',
                                    length: item1.length,
                                });
                            }
                        });
                    }
                });
                let shapeArr: any = [];
                if (arcNumber != 0) {
                    shapeArr.push('arched');
                    shape_data['arched_side_count'] = arcNumber;
                }
                if (isTrapezoid) {
                    shapeArr.push('trapezoid');
                }
                shape = shapeArr.join(',');
                item.shape = shape;
                item.shape_data = JSON.stringify(shape_data);
                item.divider_data = JSON.stringify(divider_data);
            });
        }
        setItem(item);
        if (data.length != 0) {
            if (!isSystem) {
                leftActionData.width_input = item.units[0].width_input;
                leftActionData.height_input = item.units[0].height_input;
                leftActionData.position_x = item.units[0].position_x;
                leftActionData.position_y = item.units[0].position_y;
                leftActionData.divider_data = item.units[0].divider_data;
                leftActionData.canvas_data = item.units[0].canvas_data;
                leftActionData.shape = item.units[0].shape;
                leftActionData.shape_data = item.units[0].shape_data;
                setLeftActionData({ ...leftActionData });
            }
        }
    };

    const handleClear = () => {
        drawingRef.current?.importData({});
        drawingRef.current?.clearZones([]);
    };

    // 转换上传数据
    const convertUploadData = (values: any, sizeMultiples: number) => {
        return {
            lines: values?.lines.map((line) => ({
                id: line.id,
                start_point: [
                    Number(line.startPoint.x.toFixed(4) * sizeMultiples),
                    Number(line.startPoint.y.toFixed(4) * sizeMultiples),
                ],
                end_point: [
                    Number(line.endPoint.x.toFixed(4) * sizeMultiples),
                    Number(line.endPoint.y.toFixed(4) * sizeMultiples),
                ],
                weight: line.weight,
            })),
            arcs: values?.arcs.map((arc) => {
                const data = {
                    id: arc.id,
                    center: [
                        Number((arc.center?.x).toFixed(4) * sizeMultiples),
                        Number((arc.center?.y).toFixed(4) * sizeMultiples),
                    ],
                    radius: arc.radius * sizeMultiples,
                    start_point: [
                        Number(arc.startPoint.x.toFixed(4) * sizeMultiples),
                        Number(arc.startPoint.y.toFixed(4) * sizeMultiples),
                    ],
                    end_point: [
                        Number(arc.endPoint.x.toFixed(4) * sizeMultiples),
                        Number(arc.endPoint.y.toFixed(4) * sizeMultiples),
                    ],
                    weight: arc.weight,
                };
                data.middle_point = arc.middle_point
                    ? [
                          Number(arc.middle_point.x.toFixed(4) * sizeMultiples),
                          Number(arc.middle_point.y.toFixed(4) * sizeMultiples),
                      ]
                    : [];
                return data;
            }),
        };
    };
    // 转换接收数据
    const convertResponseData = (response: any[], sizeMultiples: number) => {
        return response.map((item) => ({
            ...item,
            centroid: [item.centroid[0] / sizeMultiples, item.centroid[1] / sizeMultiples],
            area: item.area,
            lines: item.lines?.map((line) => ({
                ...line,
                start_point: [line.start_point[0] / sizeMultiples, line.start_point[1] / sizeMultiples],
                end_point: [line.end_point[0] / sizeMultiples, line.end_point[1] / sizeMultiples],
                weight: line.weight,
            })),
            arcs: item.arcs?.map((arc) => ({
                ...arc,
                center: [arc.center[0] / sizeMultiples, arc.center[1] / sizeMultiples],
                radius: arc.radius / sizeMultiples,
                start_point: [arc.start_point[0] / sizeMultiples, arc.start_point[1] / sizeMultiples],
                end_point: [arc.end_point[0] / sizeMultiples, arc.end_point[1] / sizeMultiples],
                middle_point: arc.middle_point
                    ? [arc.middle_point[0] / sizeMultiples, arc.middle_point[1] / sizeMultiples]
                    : [],
                // 保持角度相关参数不变
                sweep_angle: arc.sweep_angle,
                is_clockwise: arc.is_clockwise,
                start_angle: arc.start_angle,
                end_angle: arc.end_angle,
                weight: arc.weight,
            })),
        }));
    };
    const handleZones = async (params: any) => {
        let data = convertUploadData(params, sizeMultiples);
        try {
            let resp = await http.post('/drawing/process_geometry', data, 10 * 60 * 1000);
            const convertedResp = convertResponseData(resp, sizeMultiples);
            drawingRef.current?.updateAreas(convertedResp);
            return convertedResp;
        } catch (error) {}
    };

    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('shape-type', type);
    };

    const handleZoom = (type: 'in' | 'out') => {
        drawingRef.current?.handleZoom(type);
    };

    const handleMerge = () => {
        if (drawingRef.current) {
            drawingRef.current.merge();
        }
    };

    const handleUnmerge = () => {
        if (drawingRef.current) {
            drawingRef.current.unmerge();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 判断是否按下Ctrl键(Windows)或Cmd键(Mac)
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            if (e.key === 'Escape') {
                setCurrentMode(null);
                if (drawingRef.current) {
                    drawingRef.current.setDragMode(null);
                }
            }

            if (isCtrlOrCmd && !e.shiftKey && e.key === 'a') {
                e.preventDefault();
                drawingRef.current?.selectAll();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentMode]);

    return (
        // <Spin spinning={isLoading} style={{position: "relative"}}>
        //
        // </Spin>
        <div
            style={{
                width: '100%',
                height: '90vh',
                overflowY: 'auto',
                display: 'flex',
            }}
        >
            <div className={`${styles.left_box} left_box`}>
                <div className={styles.left_box_top}>
                    <div className={styles.left_box_top_img}>
                        <span></span>
                    </div>
                    <div className={styles.left_box_top_content}>
                        <div>Edit Item</div>
                        <div>Select all properties to add.</div>
                    </div>
                </div>
                <div style={{ marginTop: '30px' }}>
                    <div>
                        <Spin
                            indicator={<span style={{ display: 'none' }}></span>}
                            spinning={canvasMode == 'sketch'}
                            tip=""
                        >
                            <div style={{ textAlign: 'center' }}>
                                <Segmented
                                    options={allProduct}
                                    value={leftActionData.product_value}
                                    onChange={productChange}
                                />
                            </div>
                            <Row
                                gutter={[16, 24]}
                                style={{ marginTop: '24px' }}
                            >
                                <Col span={24}>
                                    <div style={{ position: 'relative' }}>
                                        {<div className={styles.labelClass}>Type</div>}
                                        <Select
                                            placeholder="Casement, Swing, etc."
                                            style={{ width: '100%' }}
                                            value={leftActionData.product_type_value}
                                            options={allProductType}
                                            disabled={allProductType.length == 0}
                                            onChange={changeProductType}
                                            optionRender={(option: any) => (
                                                <Space>
                                                    <span>{option.data.text}</span>
                                                </Space>
                                            )}
                                            labelRender={(label: any) => (
                                                <Space>
                                                    <span style={{ fontSize: '14px' }}>
                                                        {setValue(label, allProductType)}
                                                    </span>
                                                </Space>
                                            )}
                                        />
                                    </div>
                                </Col>
                            </Row>
                            <Row
                                gutter={[16, 24]}
                                style={{ marginTop: '24px' }}
                            >
                                <Col span={24}>
                                    <div style={{ position: 'relative' }}>
                                        {<div className={styles.labelClass}>Open</div>}
                                        {leftActionData.product_type_value == '56' ? (
                                            <FoldingSelect
                                                handleSelectChange={foldHandleSelectChange}
                                                index={0}
                                                options={allOpen}
                                                operability={{
                                                    selected_value: leftActionData.operability_value,
                                                    options: allOpen,
                                                }}
                                            />
                                        ) : hasCorner(allOpen) ? (
                                            <OperabilitySelect
                                                operability={{
                                                    selected_value: leftActionData.operability_value,
                                                    options: allOpen,
                                                }}
                                                handleSelectChange={cornerHandleSelected}
                                                index={0}
                                                options={allOpen}
                                            />
                                        ) : (
                                            <Select
                                                placeholder="Open, Hinge, etc."
                                                style={{ width: '100%' }}
                                                value={leftActionData.operability_value}
                                                options={allOpen}
                                                disabled={allOpen.length == 0}
                                                onChange={changeOpen}
                                                optionRender={(option: any) => (
                                                    <Space>
                                                        <span>{option.data.text}</span>
                                                    </Space>
                                                )}
                                                labelRender={(label: any) => (
                                                    <Space>
                                                        <span style={{ fontSize: '14px' }}>
                                                            {setValue(label, allOpen)}
                                                        </span>
                                                    </Space>
                                                )}
                                            />
                                        )}
                                    </div>
                                </Col>
                            </Row>
                            <Row
                                gutter={[16, 24]}
                                style={{ marginTop: '24px' }}
                            >
                                <Col
                                    span={24}
                                    className={styles.width_height_box}
                                >
                                    <div>Width</div>
                                    <div style={{ display: 'flex' }}>
                                        <InputNumber
                                            style={{ marginLeft: '10px' }}
                                            controls={false}
                                            suffix="in"
                                            className="w-full rounded-full"
                                            value={((leftActionData?.width_input || 0) / 25.4).toFixed(0)}
                                            onBlur={(e) =>
                                                changeWidth(Number((Number(e.target.value) * 25.4).toFixed(6)))
                                            }
                                            onKeyDown={(e: any) => {
                                                if (e.key === 'Enter') {
                                                    changeWidth(Number((Number(e.target.value) * 25.4).toFixed(6)));
                                                }
                                            }}
                                            key={`width-in-${leftActionData?.width_input || 0}`}
                                        />
                                        <InputNumber
                                            style={{ marginLeft: '10px' }}
                                            controls={false}
                                            suffix="mm"
                                            className="w-full rounded-full"
                                            value={leftActionData?.width_input?.toFixed(0)}
                                            onBlur={(e) => changeWidth(Number(e.target.value))}
                                            onKeyDown={(e: any) => {
                                                if (e.key === 'Enter') {
                                                    changeWidth(Number(e.target.value));
                                                }
                                            }}
                                            key={`width-mm-${leftActionData?.width_input || 0}`}
                                        />
                                    </div>
                                </Col>
                            </Row>
                            <Row
                                gutter={[16, 24]}
                                style={{ marginTop: '10px' }}
                            >
                                <Col
                                    span={24}
                                    className={styles.width_height_box}
                                >
                                    <div>Height</div>
                                    <div style={{ display: 'flex' }}>
                                        <InputNumber
                                            style={{ marginLeft: '10px' }}
                                            controls={false}
                                            suffix="in"
                                            className="w-full rounded-full"
                                            value={((leftActionData?.height_input || 0) / 25.4).toFixed(0)}
                                            onBlur={(e) =>
                                                changeHeight(Number((Number(e.target.value) * 25.4).toFixed(6)))
                                            }
                                            onKeyDown={(e: any) => {
                                                if (e.key === 'Enter') {
                                                    changeHeight(Number((Number(e.target.value) * 25.4).toFixed(6)));
                                                }
                                            }}
                                            key={`width-in-${leftActionData?.height_input || 0}`}
                                        />
                                        <InputNumber
                                            style={{ marginLeft: '10px' }}
                                            controls={false}
                                            suffix="mm"
                                            className="w-full rounded-full"
                                            value={leftActionData?.height_input?.toFixed(0)}
                                            onBlur={(e) => changeHeight(Number(e.target.value))}
                                            onKeyDown={(e: any) => {
                                                if (e.key === 'Enter') {
                                                    changeHeight(Number(e.target.value));
                                                }
                                            }}
                                            key={`width-mm-${leftActionData?.height_input || 0}`}
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </Spin>
                        {(leftActionData?.width_input > (maxWidthHeight.max_width || 0) ||
                            leftActionData?.height_input > (maxWidthHeight.max_height || 0)) && (
                            <Row
                                gutter={[16, 24]}
                                style={{ marginTop: '10px' }}
                            >
                                <Col span={24}>
                                    {(leftActionData?.width_input > maxWidthHeight.max_width ||
                                        leftActionData?.height_input > maxWidthHeight.max_height) &&
                                        maxWidthHeight.max_width && (
                                            <p className="text-dragonOrange text-xs">
                                                {`Review. Max size exceeded (${(
                                                    maxWidthHeight.max_width / 25.4
                                                ).toFixed(2)}" width, ${(maxWidthHeight.max_height / 25.4).toFixed(2)}"
                                                    height)`}
                                            </p>
                                        )}
                                </Col>
                            </Row>
                        )}
                        <Row
                            gutter={[16, 24]}
                            style={{ marginTop: '10px' }}
                        >
                            <Col span={24}>
                                {isAllowGetTemplate && (
                                    <div>
                                        {allTemplate.length == 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                                        {allTemplate.length != 0 && (
                                            <div>
                                                {canvasMode == 'render' && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                                        {allTemplate.map((item: any, index: any) => {
                                                            return (
                                                                <div
                                                                    style={{
                                                                        display: 'inline-block',
                                                                        margin: '8px 6px',
                                                                        textAlign: 'center',
                                                                        cursor: 'pointer',
                                                                        width: '65px',
                                                                    }}
                                                                    className={`${
                                                                        item.id == selectedTemplate.id &&
                                                                        styles.selected_template_box
                                                                    }`}
                                                                    key={index}
                                                                    onClick={() =>
                                                                        onSelectedTemplate(item, 'userClick')
                                                                    }
                                                                >
                                                                    <Tooltip
                                                                        key={index}
                                                                        title={item.code}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                border: '1px solid #ddd',
                                                                                borderRadius: '4px',
                                                                                overflow: 'hidden',
                                                                                height: '65px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                marginBottom: '4px',
                                                                            }}
                                                                            className={styles.template_img_box}
                                                                        >
                                                                            <img
                                                                                src={item.s3_url}
                                                                                alt={item.code}
                                                                                style={{
                                                                                    maxWidth: '100%',
                                                                                    maxHeight: '100%',
                                                                                    objectFit: 'contain',
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        {/* <div className="text-xs text-ellipsis overflow-hidden text-nowrap">
                                                                                                {item.code}
                                                                                            </div> */}
                                                                    </Tooltip>
                                                                </div>
                                                            );
                                                        })}
                                                        {leftActionData.product_type_value &&
                                                            !noShapeProductTypeList.includes(
                                                                leftActionData.product_type_value.toString()
                                                            ) && (
                                                                <Button
                                                                    style={{
                                                                        display: 'inline-block',
                                                                        margin: '8px',
                                                                        textAlign: 'center',
                                                                        cursor: 'pointer',
                                                                        width: '65px',
                                                                        height: '65px',
                                                                        color: 'rgba(188,188,188)',
                                                                        boxSizing: 'border-box',
                                                                        fontSize: '12px',
                                                                        padding: '0px 10px',
                                                                    }}
                                                                    className={styles.sketch_btn}
                                                                    onClick={handleSketch}
                                                                    disabled={
                                                                        canvasMode == 'sketch' ||
                                                                        isDisabledCustomizeBtnFuc(
                                                                            leftActionData.product_value,
                                                                            leftActionData.product_type_value,
                                                                            leftActionData.operability_value
                                                                        )
                                                                    }
                                                                >
                                                                    {/* Sketch */}
                                                                    <div>Custom</div>
                                                                    <div>Shape</div>
                                                                </Button>
                                                            )}
                                                    </div>
                                                )}
                                                {leftActionData.product_type_value &&
                                                    !noShapeProductTypeList.includes(
                                                        leftActionData.product_type_value.toString()
                                                    ) &&
                                                    canvasMode == 'sketch' && (
                                                        <div
                                                            style={{
                                                                paddingTop: '20px',
                                                                boxSizing: 'border-box',
                                                                borderTop: '1px solid #ececec',
                                                                width: '100%',
                                                            }}
                                                        >
                                                            <ShapeList
                                                                size="large"
                                                                type="frame"
                                                            />
                                                        </div>
                                                    )}
                                                {canvasMode == 'sketch' && (
                                                    <div className="w-full flex gap-3 mt-5">
                                                        <Button
                                                            onClick={hanleCancel}
                                                            className="flex-1"
                                                            disabled={
                                                                canvasMode == 'render' ||
                                                                isDisabledCustomizeBtnFuc(
                                                                    leftActionData.product_value,
                                                                    leftActionData.product_type_value,
                                                                    leftActionData.operability_value
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            onClick={handleRender}
                                                            className="flex-1"
                                                            type="primary"
                                                            disabled={
                                                                canvasMode == 'render' ||
                                                                isDisabledCustomizeBtnFuc(
                                                                    leftActionData.product_value,
                                                                    leftActionData.product_type_value,
                                                                    leftActionData.operability_value
                                                                )
                                                            }
                                                        >
                                                            Render
                                                        </Button>
                                                    </div>
                                                )}
                                                {
                                                    // <div style={{width:"100%"}}>
                                                    //     <Tooltip title="Draw a custom door or window drawing without using a template">
                                                    //         <Button
                                                    //             style={{width:"100%"}}
                                                    //             shape="round"
                                                    //             // disabled={()=>isDisabledCustomizeBtnFuc(
                                                    //             //     leftActionData.product_value,
                                                    //             //     leftActionData.product_type_value,
                                                    //             //     leftActionData.operability_value,
                                                    //             // )}
                                                    //             onClick={()=>customizeUnit()}
                                                    //         >
                                                    //             Customize
                                                    //         </Button>
                                                    //     </Tooltip>
                                                    // </div>
                                                    // <div style={{width:"100%"}}>
                                                    //     {
                                                    //         isSystem && <Button
                                                    //             style={{width:"100%"}}
                                                    //             icon={<PlusOutlined />}
                                                    //             shape="round"
                                                    //             disabled={!selectedTemplate.id}
                                                    //         >
                                                    //             Add
                                                    //         </Button>
                                                    //     }
                                                    //     {
                                                    //         !isSystem && <Tooltip title="Please select the template for replacement">
                                                    //             <Button
                                                    //                 style={{width:"100%"}}
                                                    //                 icon={<PlusOutlined />}
                                                    //                 shape="round"
                                                    //                 disabled={!selectedTemplate.id}
                                                    //                 onClick={()=>windowDoorReplace()}
                                                    //             >
                                                    //                 Add / Replace
                                                    //             </Button>
                                                    //         </Tooltip>
                                                    //     }
                                                    // </div>
                                                }
                                            </div>
                                        )}
                                    </div>
                                )}
                                {!isAllowGetTemplate && (
                                    <div>
                                        {/* <Result
                            status="warning"
                            title={null}
                            subTitle="Please select product, product type, operability"
                        /> */}
                                    </div>
                                )}
                            </Col>
                        </Row>
                        {from != 'systemDrawing' && canvasMode == 'render' && (
                            <Row
                                gutter={[16, 24]}
                                style={{
                                    marginTop: '24px',
                                    borderTop: '1px solid #DFE2E6',
                                    paddingTop: '24px',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <Col
                                    span={24}
                                    style={{ display: 'flex' }}
                                >
                                    <div className={styles.sdl_tdl_box}>
                                        <span></span>
                                    </div>
                                    <div
                                        className={styles.left_box_top_content}
                                        style={{ marginLeft: '10px' }}
                                    >
                                        <div style={{ color: '#354764' }}>Muntin SDL/TDL</div>
                                        <div>Select the muntin</div>
                                    </div>
                                </Col>

                                {item && (
                                    <Col span={24}>
                                        <div style={{ textAlign: 'center' }}>
                                            {/* {
                                                            (!items[props.itemIndex].profile.selected_value) &&
                                                            <Result
                                                                status="warning"
                                                                title={null}
                                                                subTitle="Please complete the Frame section first"
                                                            />
                                                        }
                                                        {
                                                            (items[props.itemIndex].profile.selected_value) &&
                                                            <Segmented
                                                                options={allDividedLiteType}
                                                                value={selectedDividedLiteType.value}
                                                                onChange={sdlTdlChange}
                                                            />
                                                        } */}
                                            <Segmented
                                                options={allDividedLiteType}
                                                value={selectedDividedLiteType.value}
                                                onChange={sdlTdlChange}
                                            />
                                        </div>
                                        {
                                            <>
                                                {/* <Row gutter={[16, 24]} style={{marginTop:"24px"}}>
                                                                <Col span={24}>
                                                                    <div style={{position:"relative"}}>
                                                                        {
                                                                            <Select
                                                                                placeholder=""
                                                                                style={{ width: "100%" }}
                                                                                value={selectedDividersArrangement.value}
                                                                                options={allDividersArrangement}
                                                                                disabled={allDividersArrangement.length == 0}
                                                                                onChange={changeDividersArrangement}
                                                                                optionRender={(option:any) => (
                                                                                    <Space>
                                                                                        <span>
                                                                                            {option.data.text}
                                                                                        </span>
                                                                                    </Space>
                                                                                )}
                                                                                labelRender={(label:any) => (
                                                                                    <Space>
                                                                                        <span style={{fontSize:"14px"}}>
                                                                                            {setValue(label,allDividersArrangement)}
                                                                                        </span>
                                                                                    </Space>
                                                                                )}
                                                                            />
                                                                        }
                                                                    </div>
                                                                </Col>
                                                            </Row> */}
                                                <Row
                                                    gutter={[16, 24]}
                                                    style={{ marginTop: '24px' }}
                                                >
                                                    <Col span={24}>
                                                        {selectedDividedLiteType.value == 'sdl' && (
                                                            <div style={{ display: 'flex' }}>
                                                                <ShapeItemQuoteUse
                                                                    key={DividerType.SDL_H}
                                                                    item={{
                                                                        type: DividerType.SDL_H,
                                                                        path: 'M 0,50 L 100,50',
                                                                        name: 'SDL-H',
                                                                        style: 'dashed',
                                                                    }}
                                                                    onDragStart={handleDragStart}
                                                                />
                                                                <ShapeItemQuoteUse
                                                                    key={DividerType.SDL_V}
                                                                    item={{
                                                                        type: DividerType.SDL_V,
                                                                        path: 'M 49,0 L 49,100',
                                                                        name: 'SDL-V',
                                                                        style: 'dashed',
                                                                    }}
                                                                    onDragStart={handleDragStart}
                                                                />
                                                            </div>
                                                        )}
                                                        {selectedDividedLiteType.value == 'tdl' && (
                                                            <div style={{ display: 'flex' }}>
                                                                <ShapeItemQuoteUse
                                                                    key={DividerType.TDL_H}
                                                                    item={{
                                                                        type: DividerType.TDL_H,
                                                                        path: 'M 0,50 L 100,50',
                                                                        name: 'TDL-H',
                                                                        style: 'dashed',
                                                                    }}
                                                                    onDragStart={handleDragStart}
                                                                />
                                                                <ShapeItemQuoteUse
                                                                    key={DividerType.TDL_V}
                                                                    item={{
                                                                        type: DividerType.TDL_V,
                                                                        path: 'M 49,0 L 49,100',
                                                                        name: 'TDL-V',
                                                                        style: 'dashed',
                                                                    }}
                                                                    onDragStart={handleDragStart}
                                                                />
                                                            </div>
                                                        )}
                                                    </Col>
                                                </Row>
                                            </>
                                        }
                                    </Col>
                                )}
                            </Row>
                        )}
                    </div>
                    {!isSystem && (
                        <div style={{ width: '250px', position: 'absolute', bottom: '20px' }}>
                            {from != 'systemDrawing' && (
                                <Button
                                    loading={saveLoading}
                                    onClick={saveUnit}
                                    disabled={canvasMode == 'sketch'}
                                    style={{ width: '100%', zIndex: '100' }}
                                    type="primary"
                                >
                                    Save
                                </Button>
                            )}
                            {
                                // from == "systemDrawing" && <div style={{zIndex:"100",display:"flex",background:"#fff"}} >
                                //     <Button
                                //         loading={saveLoading}
                                //         onClick={()=>props.cancelCustomize()}
                                //         style={{zIndex:"100",flex:1}}
                                //     >
                                //         Cancel
                                //     </Button>
                                //     <Button
                                //         loading={saveLoading}
                                //         disabled={canvasMode == "sketch"}
                                //         onClick={updateHandleUnit}
                                //         style={{zIndex:"100",flex:1,marginLeft:"15px"}}
                                //         type="primary"
                                //     >
                                //         Save
                                //     </Button>
                                // </div>
                            }
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.main_box}>
                <Header
                    style={{
                        background: '#fff',
                        padding: '0 16px',
                        height: '48px',
                        lineHeight: '48px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'circleCenter',
                    }}
                >
                    {/* Left side tools */}
                    <Space>
                        <Tooltip title="Undo">
                            <Button
                                icon={<UndoOutlined />}
                                onClick={handleUndo}
                                disabled={!canUndo}
                            />
                        </Tooltip>
                        <Tooltip title="Redo">
                            <Button
                                icon={<RedoOutlined />}
                                onClick={handleRedo}
                                disabled={!canRedo}
                            />
                        </Tooltip>
                        <Divider type="vertical" />
                        <Tooltip title="Zoom In">
                            <Button
                                onClick={() => handleZoom('in')}
                                icon={<ZoomInOutlined />}
                            />
                        </Tooltip>
                        <Tooltip title="Zoom Out">
                            <Button
                                onClick={() => handleZoom('out')}
                                icon={<ZoomOutOutlined />}
                            />
                        </Tooltip>
                        <Tooltip title="Hand Tool">
                            <Button
                                icon={<DragOutlined />}
                                onClick={() => {
                                    const newMode = currentMode === 'drag' ? null : 'drag';
                                    setCurrentMode(newMode);
                                    if (drawingRef.current) {
                                        drawingRef.current.setDragMode(newMode === 'drag' ? 'drag' : null);
                                    }
                                }}
                                type={currentMode === 'drag' ? 'primary' : 'default'}
                            />
                        </Tooltip>
                        {from != 'systemDrawing' && (
                            <Tooltip title="Dimension, Annotations cannot be made in sketch mode.">
                                <Button
                                    icon={<ColumnHeightOutlined />}
                                    onClick={() => {
                                        const newMode = currentMode === 'dimension' ? null : 'dimension';
                                        setCurrentMode(newMode);
                                        if (drawingRef.current) {
                                            drawingRef.current.setDragMode(
                                                newMode === 'dimension' ? 'dimension' : null
                                            );
                                        }
                                    }}
                                    disabled={canvasMode == 'sketch'}
                                    type={currentMode === 'dimension' ? 'primary' : 'default'}
                                />
                            </Tooltip>
                        )}
                        {/* <Divider type="vertical"/> */}
                        {canvasMode == 'sketch' && (
                            <>
                                <Tooltip title="Doors and Windows cannot be deleted but can only be replaced">
                                    <Button
                                        icon={<DeleteOutlined />}
                                        onClick={handleDelete}
                                        disabled={!isSystem && canvasMode == 'render'}
                                    />
                                </Tooltip>
                                <Tooltip title="Remove Line">
                                    <Button
                                        disabled={canvasMode == 'render'}
                                        icon={<ScissorOutlined />}
                                        onClick={() => {
                                            const newMode = currentMode === 'removeLine' ? null : 'removeLine';
                                            setCurrentMode(newMode);
                                            if (drawingRef.current) {
                                                drawingRef.current.setRemoveLineMode(newMode === 'removeLine');
                                            }
                                        }}
                                        type={currentMode === 'removeLine' ? 'primary' : 'default'}
                                    />
                                </Tooltip>
                                <Tooltip title="Merge">
                                    <Button
                                        icon={<MergeCellsOutlined />}
                                        onClick={handleMerge}
                                    />
                                </Tooltip>
                                <Tooltip title="Split">
                                    <Button
                                        icon={<SplitCellsOutlined />}
                                        onClick={handleUnmerge}
                                    />
                                </Tooltip>
                            </>
                        )}

                        {/* <Button
                                    onClick={handleSketch}
                                    disabled={
                                        canvasMode=="sketch" ||
                                        isDisabledCustomizeBtnFuc(
                                            leftActionData.product_value,
                                            leftActionData.product_type_value,
                                            leftActionData.operability_value,
                                        )
                                    }
                                >
                                    Sketch
                                </Button> */}
                        {/*<Button*/}
                        {/*    onClick={handleRender}*/}
                        {/*    disabled={*/}
                        {/*        canvasMode=="render" ||*/}
                        {/*        isDisabledCustomizeBtnFuc(*/}
                        {/*            leftActionData.product_value,*/}
                        {/*            leftActionData.product_type_value,*/}
                        {/*            leftActionData.operability_value,*/}
                        {/*        )*/}
                        {/*    }*/}
                        {/*>*/}
                        {/*    Render*/}
                        {/*</Button>*/}
                    </Space>
                </Header>
                <Layout style={{ height: 'calc(100% - 50px)' }}>
                    {/* Main Content */}
                    <Content style={{ minHeight: 280 }}>
                        {
                            <Drawing
                                from={'quote'}
                                ref={drawingRef}
                                onChangeUnit={canvasToolChange}
                                getGroupZones={handleZones}
                                onChange={handleDrawingChange}
                            />
                        }
                    </Content>
                </Layout>
            </div>
            {isSystem && <div className={styles.right_box}></div>}
            <style>{`
				.ant-input-number-suffix{
					font-size:12px!important;
				}
			`}</style>
        </div>
    );
};

export default NewDrawing;
