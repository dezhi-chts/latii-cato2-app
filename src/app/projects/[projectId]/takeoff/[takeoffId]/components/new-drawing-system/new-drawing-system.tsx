import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import Drawing, { WindowDrawerRef } from '../drawing';
import http from '@/lib/http';
import styles from './new.drawing.system.module.css';
import {
    Spin,
    Segmented,
    Row,
    Col,
    Select,
    Space,
    InputNumber,
    Result,
    Empty,
    Tooltip,
    Button,
    Layout,
    Divider,
    FloatButton,
    notification,
} from 'antd';
import OperabilitySelect from '../operability-select';
import FoldingSelect from '../folding-select';
import { DividerType, OperationType, ShapeType } from '../drawing/datas';
import Icon, {
    UndoOutlined,
    RedoOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    DeleteOutlined,
    MergeCellsOutlined,
    SplitCellsOutlined,
    ToolOutlined,
    DatabaseOutlined,
    DragOutlined,
    ScissorOutlined,
    RadarChartOutlined,
    ColumnHeightOutlined,
    SkinOutlined,
    PlusOutlined,
    CopyOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
const { Header, Sider, Content } = Layout;
const sizeMultiples = 5;
import ShapeItemQuoteUse from '../shape-item-quote-use';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import NewDrawing from '../new-drawing/new-drawing';

const generateNewId = () => {
    const time = new Date();
    let str = 'unit-';
    let month: any = time.getMonth() + 1;
    month = String(month).length > 1 ? month : '0' + month;
    let day = time.getDate();
    day = String(month).length > 1 ? month : '0' + month;
    str += `${time.getFullYear()}${month}${day}-`;
    str += `${time.getHours()}${time.getMinutes()}${time.getMinutes()}-`;
    str += Math.floor(Math.random() * 10000);
    return str;
};

const hasCorner = (options: any) => {
    return options?.some((option: any) => option?.value?.includes('corner'));
};

const noOpenProductTypeList = ['47'];

const NewDrawingSystem = (props: any) => {
    const [currentMode, setCurrentMode] = useState<any>(null);

    const [isLoading, setIsLoading] = useState<any>(true);

    const [saveLoading, setSaveLoading] = useState<any>(false);

    const [item, setItem] = useState<any>(props.currentItem);
    const itemRef: any = useRef();
    useEffect(() => {
        itemRef.current = item;
    }, [item]);

    const [units, setUnits] = useState<any>([]);
    const unitsRef: any = useRef();

    const [maxWidthHeight, setMaxWidthHeight] = useState<any>({
        max_width: null,
        max_height: null,
    });

    useEffect(() => {
        unitsRef.current = units;

        if (drawingRef.current) {
            let tempUnits: any = JSON.parse(JSON.stringify(units));
            tempUnits.forEach((item: any, index: any) => {
                item.line = index + 1;
            });
            console.log(tempUnits, 'tempUnitstempUnitstempUnits');
            drawingRef.current.updateUnitIndexs(tempUnits);
        }

        units.forEach(async (item: any, index: any) => {
            if (item.isSelected) {
                if (item.product.selected_value) {
                    setAllProductTypeFunc(allProductProductTypeOpen, item.product.selected_value);
                }
                if (item.product.selected_value && item.product_type.selected_value) {
                    setAllProductTypeOpenFunc(
                        allProductProductTypeOpen,
                        item.product.selected_value,
                        item.product_type.selected_value
                    );
                }
            }
        });

        if (itemRef.current && itemRef.current.id) {
            let width = 0;
            let height = 0;
            let start_x = Infinity;
            let start_y = Infinity;
            for (const unit of units) {
                unit.position_x = unit.position_x || 0;
                unit.position_y = unit.position_y || 0;
                unit.width_input = unit.width_input || 0;
                unit.height_input = unit.height_input || 0;

                width = unit.position_x + unit.width_input > width ? unit.position_x + unit.width_input : width;
                height = unit.position_y + unit.height_input > height ? unit.position_y + unit.height_input : height;

                start_x = unit.position_x < start_x ? unit.position_x : start_x;
                start_y = unit.position_y < start_y ? unit.position_y : start_y;
            }
            itemRef.current.width_input = width - start_x;
            itemRef.current.height_input = height - start_y;
            itemRef.units = units;

            console.log(`########  itemRef.units `, itemRef.units);
        }

        setItem({
            ...itemRef.current,
        });
    }, [units]);

    const [allProductProductTypeOpen, setAllProductProductTypeOpen] = useState<any>([]);

    const [leftOptionsMap, setLeftOptionsMap] = useState<any>({
        product: [],
        productType: [],
        operability: [],
        template: [],
        dividedLiteType: [],
        dividersArrangement: [],
    });
    const leftOptionsMapRef: any = useRef();
    useEffect(() => {
        leftOptionsMapRef.current = leftOptionsMap;
    }, [leftOptionsMap]);

    const [isAllowGetTemplate, setIsAllowGetTemplate] = useState<any>(false);

    const [selectedTemplate, setSelectedTemplate] = useState<any>({});
    const selectedTemplateRef: any = useRef();
    useEffect(() => {
        selectedTemplateRef.current = selectedTemplate;
    }, [selectedTemplate]);

    const [addUnitLeftMsg, setAddUnitLeftMsg] = useState<any>({
        product_value: null,
        product_type_value: null,
        operability_value: null,
        width_input: null,
        height_input: null,
        canvas_data: null,
    });

    const [selectedDividedLiteType, setSelectedDividedLiteType] = useState<any>({});
    const [selectedDividersArrangement, setSelectedDividersArrangement] = useState<any>({});

    const [isCustomizeUnit, setIsCustomizeUnit] = useState<any>(false);
    const [customizeItem, setCustomizeItem] = useState<any>(null);

    useEffect(() => {
        const initData = async () => {
            if (props.currentItem.is_system == true) {
                setIsLoading(true);
                setItem(JSON.parse(JSON.stringify(props.currentItem)));
                setUnits(JSON.parse(JSON.stringify(props.currentItem.units)));
                getAllProductProductTypeOpen();
                let canvasData: any = await getItemCanvasData(item.id);

                // 获取sdl/tdl数据
                let item_type_value = props.currentItem.item_type.selected_value;
                let frame_material_value = props.currentItem.frame_material.selected_value;
                let profile_value = props.currentItem.profile.selected_value;
                let casting_style_value = props.currentItem.casting_style.selected_value;
                getAllDividedLiteType(item_type_value, frame_material_value, profile_value, casting_style_value);

                if (drawingRef.current) {
                    let arr: any = [];
                    props.currentItem.units.forEach((item: any, index: any) => {
                        let obj = {
                            id: item.id,
                            product_value: item.product.selected_value,
                            product_type_value: item.product_type.selected_value,
                            operability_value: item.operability.selected_value,
                            width_input: item.width_input,
                            height_input: item.height_input,
                            position_x: item.position_x,
                            position_y: item.position_y,
                            canvas_data: canvasData[item.id] ? canvasData[item.id] : null,
                            line: item.line,
                        };
                        if (obj.canvas_data) {
                            arr.push(obj);
                        }
                    });
                    if (arr.length != 0) {
                        let dimension_data: any = null;
                        if (canvasData['dimension_data']) {
                            dimension_data = canvasData['dimension_data'];
                        }
                        drawingRef.current.importUnits(arr, dimension_data);
                    }

                    setTimeout(() => {
                        unitsRef.current &&
                            unitsRef.current.length != 0 &&
                            unitsRef.current.forEach((item: any) => {
                                if (item.width_input && item.height_input) {
                                    setTimeout(() => {
                                        drawingRef.current?.updateUnit(item.id, {
                                            width: item.width_input,
                                            height: item.height_input,
                                            x: item.position_x || null,
                                            y: item.position_y || null,
                                        });
                                    }, 100);
                                }
                            });
                    }, 100);
                }
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

    const getAllProductProductTypeOpen = () => {
        let url = `/quote/dict/product_type_profiles_tree/filters`;
        url = url + `?frame_brand=${item.frame_material?.selected_value}`;
        http.get(url)
            .then((data: any) => {
                if (data.is_success) {
                    setAllProductProductTypeOpen(data.data);

                    let allProduct: any = [];
                    data.data.forEach((item: any) => {
                        allProduct.push({
                            value: item.value,
                            text: item.text,
                            label: item.text,
                        });
                    });
                    leftOptionsMap.product = allProduct;
                    setLeftOptionsMap({ ...leftOptionsMap });
                }
            })
            .catch((error: any) => {
                console.error('Error fetching data:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const setValue = (value: any, options: any) => {
        let tempStr: any = '';
        if (options && options.length != 0) {
            options.forEach((item: any) => {
                if (value == item.value) {
                    tempStr = item.text;
                }
            });
        }
        return tempStr;
    };

    const changeSelectUnits = (msg: any) => {
        if (units && units.length != 0) {
            let isHaveSelected: any = false;
            units.forEach((item: any) => {
                if (item.isSelected) {
                    item.isSelected = false;
                } else {
                    if (item.id == msg.id) {
                        item.isSelected = true;
                        isHaveSelected = true;

                        if (drawingRef.current) {
                            drawingRef.current.selectElementByUnitId(msg.id);
                        }

                        console.log(leftOptionsMapRef.current, 'leftOptionsMapRef.current');
                        let leftOptionsMap = leftOptionsMapRef.current;

                        leftOptionsMap.productType = item.product_type.options;
                        leftOptionsMap.operability = item.operability.options;
                        getAllTemplate(
                            item.product.selected_value,
                            item.product_type.selected_value,
                            item.operability.selected_value
                        );
                        setLeftOptionsMap({ ...leftOptionsMap });
                    }
                }
            });
            setUnits([...units]);

            if (!isHaveSelected) {
                setAddUnitLeftMsg({
                    product_value: null,
                    product_type_value: null,
                    operability_value: null,
                    width_input: null,
                    height_input: null,
                    canvas_data: null,
                });
                leftOptionsMap.productType = [];
                leftOptionsMap.operability = [];
                leftOptionsMap.template = [];
                setLeftOptionsMap({ ...leftOptionsMap });
                if (drawingRef.current) {
                    drawingRef.current.selectElementByUnitId('');
                }
            }
            setSelectedTemplate({});
        }
    };

    const copyUnit = debounce((msg: any) => {
        let units = unitsRef.current;
        console.log('#############  copyUnit ', msg);
        if (units && units.length != 0) {
            let obj: any = {};
            let temp: any = false;
            units.forEach((item: any) => {
                if (item.id == msg.id) {
                    if (
                        item.product.selected_value &&
                        item.product_type.selected_value &&
                        (noOpenProductTypeList.includes(item.product_type.selected_value?.toString()) ||
                            item.operability.selected_value) &&
                        item.width_input &&
                        item.height_input &&
                        item.canvas_data
                    ) {
                        obj = JSON.parse(JSON.stringify(item));
                        obj.isSelected = false;
                        obj.id = generateNewId();
                        temp = true;
                    } else {
                    }
                }
            });
            if (temp) {
                units.push(obj);
                units.forEach((item: any, index: any) => {
                    item.line = index + 1;
                });
                console.log(units, '--------units');
                setUnits([...units]);

                if (drawingRef.current) {
                    drawingRef.current?.resetUnit(obj, 'copyUnit');
                    if (obj.width_input && obj.height_input) {
                        setTimeout(() => {
                            drawingRef.current?.updateUnit(obj.id, {
                                width: obj.width_input,
                                height: obj.height_input,
                            });
                        }, 300);
                    }
                }
            } else {
                return notification.warning({
                    message: 'Warning message',
                    description: 'No product, product type, operability, width, height, canvas data, not copy',
                });
            }
            if (drawingRef.current) {
                console.log(units, 'unitsunitsunitsunits');
                drawingRef.current.updateUnitIndexs(units);
            }
        }
    }, 700);

    const deleteUnit = (msg: any) => {
        if (units && units.length != 0) {
            if (units.length <= 1) {
                notification.warning({
                    message: 'Warning message',
                    description: 'Deletion operations cannot be performed when there is only one item',
                });
                return;
            }
            units.forEach((item: any, index: any) => {
                if (item.id == msg.id) {
                    units.splice(index, 1);
                    if (drawingRef.current) {
                        drawingRef.current.removeElementByUnitId(msg.id);
                    }
                    if (item.isSelected) {
                        setAddUnitLeftMsg({
                            product_value: null,
                            product_type_value: null,
                            operability_value: null,
                            width_input: null,
                            height_input: null,
                            canvas_data: null,
                        });
                        leftOptionsMap.productType = [];
                        leftOptionsMap.operability = [];
                        leftOptionsMap.template = [];
                        setLeftOptionsMap({ ...leftOptionsMap });
                    }
                }
            });
            setUnits([...units]);
        }
    };

    const isUnitsSelectedFunc = (msg: any) => {
        let temp: any = false;
        if (msg && msg.length != 0) {
            msg.forEach((item: any) => {
                if (item.isSelected) {
                    temp = true;
                }
            });
        }
        return temp;
    };

    const getSelectedUnitValue = (type: any) => {
        let temp: any = null;
        if (units && units.length != 0) {
            units.forEach((item: any) => {
                if (item.isSelected) {
                    temp = item[type].selected_value;
                }
            });
        }
        return temp;
    };

    const getSelectedUnitValue1 = (type: any) => {
        let temp: any = null;
        if (units && units.length != 0) {
            units.forEach((item: any) => {
                if (item.isSelected) {
                    temp = item[type];
                }
            });
        }
        return temp;
    };

    const productChange = (value: any, type: any) => {
        if (type == 'edit') {
            if (units && units.length != 0) {
                units.forEach((item: any) => {
                    if (item.isSelected) {
                        item['product'].selected_value = value;
                        item['product'].options = leftOptionsMap.product;

                        let allProductType: any = setAllProductTypeFunc(allProductProductTypeOpen, value);

                        item['product_type'].selected_value = null;
                        item['product_type'].options = allProductType;
                        item['product_type'].disabled = false;

                        item['operability'].selected_value = null;
                        item['operability'].options = [];
                        item['operability'].disabled = true;
                        leftOptionsMap.operability = [];
                        setLeftOptionsMap({ ...leftOptionsMap });

                        getAllTemplate(
                            item['product'].selected_value,
                            item['product_type'].selected_value,
                            item['operability'].selected_value
                        );
                    }
                });
                setUnits([...units]);
            }
        } else {
            addUnitLeftMsg.product_value = value;
            addUnitLeftMsg.product_type_value = null;
            addUnitLeftMsg.operability_value = null;
            setAllProductTypeFunc(allProductProductTypeOpen, addUnitLeftMsg.product_value);
            setAddUnitLeftMsg({ ...addUnitLeftMsg });
            getAllTemplate(
                addUnitLeftMsg.product_value,
                addUnitLeftMsg.product_type_value,
                addUnitLeftMsg.operability_value
            );
            leftOptionsMap.operability = [];
            setLeftOptionsMap({ ...leftOptionsMap });
        }
    };

    const productTypeChange = (value: any, type: any) => {
        if (type == 'edit') {
            if (units && units.length != 0) {
                units.forEach((item: any) => {
                    if (item.isSelected) {
                        item['product_type'].selected_value = value;

                        item['operability'].selected_value = null;
                        item['operability'].options = [];
                        item['operability'].disabled = true;
                        let allProductTypeOpen: any = setAllProductTypeOpenFunc(
                            allProductProductTypeOpen,
                            item['product'].selected_value,
                            value
                        );

                        if (allProductTypeOpen && allProductTypeOpen.length != 0) {
                            item['operability'].options = allProductTypeOpen;
                            item['operability'].disabled = false;
                            if (allProductTypeOpen.length == 1) {
                                item['operability'].selected_value = allProductTypeOpen[0].value;
                            }
                        } else {
                        }

                        getAllTemplate(
                            item['product'].selected_value,
                            item['product_type'].selected_value,
                            item['operability'].selected_value
                        );
                    }
                });
                setUnits([...units]);
            }
        } else {
            addUnitLeftMsg.product_type_value = value;
            addUnitLeftMsg.operability_value = null;
            let allProductTypeOpen: any = setAllProductTypeOpenFunc(
                allProductProductTypeOpen,
                addUnitLeftMsg.product_value,
                addUnitLeftMsg.product_type_value
            );
            if (allProductTypeOpen && allProductTypeOpen.length != 0) {
                if (allProductTypeOpen.length == 1) {
                    addUnitLeftMsg.operability_value = allProductTypeOpen[0].value;
                }
            } else {
            }
            setAddUnitLeftMsg({ ...addUnitLeftMsg });
            getAllTemplate(
                addUnitLeftMsg.product_value,
                addUnitLeftMsg.product_type_value,
                addUnitLeftMsg.operability_value
            );
        }
    };

    const productTypeOpenChange = (value: any, type: any) => {
        if (type == 'edit') {
            if (units && units.length != 0) {
                units.forEach((item: any) => {
                    if (item.isSelected) {
                        item['operability'].selected_value = value;

                        getAllTemplate(
                            item['product'].selected_value,
                            item['product_type'].selected_value,
                            item['operability'].selected_value
                        );
                    }
                });
                setUnits([...units]);
            }
        } else {
            addUnitLeftMsg.operability_value = value;
            setAddUnitLeftMsg({ ...addUnitLeftMsg });
            getAllTemplate(
                addUnitLeftMsg.product_value,
                addUnitLeftMsg.product_type_value,
                addUnitLeftMsg.operability_value
            );
        }
    };

    const changeWidth = (value: any, type: any) => {
        if (type == 'edit') {
            if (units && units.length != 0) {
                units.forEach((item: any) => {
                    if (item.isSelected) {
                        item['width_input'] = value;
                        if (drawingRef.current) {
                            drawingRef.current.updateUnit(item.id, {
                                width: item.width_input,
                            });
                        }
                    }
                });
                setUnits([...units]);
            }
        } else {
            addUnitLeftMsg.width_input = value;
            setAddUnitLeftMsg({ ...addUnitLeftMsg });
        }
    };

    const changeHeight = (value: any, type: any) => {
        if (type == 'edit') {
            if (units && units.length != 0) {
                units.forEach((item: any) => {
                    if (item.isSelected) {
                        item['height_input'] = value;

                        if (drawingRef.current) {
                            drawingRef.current.updateUnit(item.id, {
                                height: item.height_input,
                            });
                        }
                    }
                });
                setUnits([...units]);
            }
        } else {
            addUnitLeftMsg.height_input = value;
            setAddUnitLeftMsg({ ...addUnitLeftMsg });
        }
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
        leftOptionsMap.productType = arr;
        setLeftOptionsMap({ ...leftOptionsMap });
        return arr;
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
        leftOptionsMap.operability = arr;
        setLeftOptionsMap({ ...leftOptionsMap });
        return arr;
    };

    const getAllTemplate = async (product: any, product_type: any, operability: any) => {
        console.log(product, product_type, operability, 'operabilityoperability');
        if (!product) {
            setIsAllowGetTemplate(false);
            return;
        }
        if (!product_type) {
            setIsAllowGetTemplate(false);
            return;
        }
        if (noOpenProductTypeList.includes(product_type?.toString())) {
            operability = null;
        } else {
            if (!operability) {
                setIsAllowGetTemplate(false);
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
                leftOptionsMap.template = arr;
                setLeftOptionsMap({ ...leftOptionsMap });
                if (selectedTemplate.id) {
                    let isHaveSelectedTemplate: any = false;
                    data.data.forEach((item: any) => {
                        if (item.id == selectedTemplate.id) {
                            isHaveSelectedTemplate = true;
                        }
                    });
                    if (!isHaveSelectedTemplate) {
                        setSelectedTemplate({});
                        data.data.forEach((item: any) => {
                            if (item.shape == 'square') {
                                let isSelectedUnit: any = false;
                                units.forEach((item: any, index: any) => {
                                    if (item.isSelected) {
                                        isSelectedUnit = true;
                                    }
                                });
                                if (isSelectedUnit) {
                                    onSelectedTemplate(item, 'edit');
                                } else {
                                    onSelectedTemplate(item, 'add');
                                }
                            }
                        });
                    }
                } else {
                    data.data.forEach((item: any) => {
                        if (item.shape == 'square') {
                            let isSelectedUnit: any = false;
                            units.forEach((item: any, index: any) => {
                                if (item.isSelected) {
                                    isSelectedUnit = true;
                                }
                            });
                            if (isSelectedUnit) {
                                onSelectedTemplate(item, 'edit');
                            } else {
                                onSelectedTemplate(item, 'add');
                            }
                        }
                    });
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
        if (props.currentItem.profile.selected_value) {
            url = `${url}&profile_value=${Number(props.currentItem.profile.selected_value)}`;
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

    const onSelectedTemplate = (tempMsg: any, type: any, from: any = null) => {
        http.get(`/drawing/${tempMsg.id}`).then(async (res: any) => {
            if (res.is_success) {
                if (res.data && res.data.id) {
                    setSelectedTemplate(res.data);
                    if (type == 'edit') {
                        if (units && units.length != 0) {
                            units.forEach((item: any) => {
                                if (item.isSelected) {
                                    let data_structure: any = JSON.parse(res.data.data_structure);
                                    if (typeof data_structure === 'string') {
                                        data_structure = JSON.parse(data_structure);
                                    }

                                    let widthHeightMsg: any = calculationFunc(data_structure.components);
                                    let width = widthHeightMsg.width || 0;
                                    let height = widthHeightMsg.height || 0;

                                    if (!item['width_input']) {
                                        item['width_input'] = width || 750;
                                    }
                                    if (!item['height_input']) {
                                        item['height_input'] = height || 1500;
                                    }

                                    // if(from == "userClick"){
                                    // 	item['width_input'] = width || 750
                                    // 	item['height_input'] = height || 1500
                                    // 	item['canvas_data'] = res.data.data_structure
                                    // 	setTimeout(()=>{
                                    // 		addReplaceTemplate('edit')
                                    // 	}, 200)
                                    // }else{
                                    // 	if(!item['width_input']){
                                    // 		item['width_input'] = width || 750
                                    // 	}
                                    // 	if(!item['height_input']){
                                    // 		item['height_input'] = height || 1500
                                    // 	}
                                    // }
                                }
                            });
                            setUnits([...units]);
                        }
                    } else {
                        addUnitLeftMsg['canvas_data'] = res.data.data_structure;

                        let data_structure: any = JSON.parse(res.data.data_structure);
                        if (typeof data_structure === 'string') {
                            data_structure = JSON.parse(data_structure);
                        }

                        let widthHeightMsg: any = calculationFunc(data_structure.components);
                        let width = widthHeightMsg.width || 0;
                        let height = widthHeightMsg.height || 0;

                        // addUnitLeftMsg['width_input'] = width || 750
                        // addUnitLeftMsg['height_input'] = height || 1500

                        if (!addUnitLeftMsg['width_input']) {
                            addUnitLeftMsg['width_input'] = width || 750;
                        }
                        if (!addUnitLeftMsg['height_input']) {
                            addUnitLeftMsg['height_input'] = height || 1500;
                        }

                        setAddUnitLeftMsg({ ...addUnitLeftMsg });
                    }
                }
            }
        });
    };

    const addReplaceTemplate = debounce((type: any) => {
        if (type == 'edit') {
            if (units && units.length != 0) {
                // handleClear()
                // setTimeout(()=>{
                // 	if(drawingRef.current){

                // 		let arr:any = []
                // 		units.forEach((item:any,index:any)=>{
                // 			let obj = {
                // 				id: item.id,
                // 				product_value: item.product.selected_value,
                // 				product_type_value: item.product_type.selected_value,
                // 				operability_value: item.operability.selected_value,
                // 				width_input: item.width_input,
                // 				height_input: item.height_input,
                // 				position_x: item.position_x,
                // 				position_y: item.position_y,
                // 				canvas_data: item.canvas_data
                // 			}
                // 			if(obj.canvas_data){
                // 				arr.push(obj)
                // 			}
                // 		})
                // 		if(arr.length!=0){
                // 			drawingRef.current.importUnits(arr)
                // 		}

                // 		console.log(arr,'arrrrrrrrrrrrrrrr')

                // 		setTimeout(()=>{
                // 			units.forEach((item:any)=>{
                // 				if(item.isSelected){
                // 					if(item.width_input && item.height_input){
                // 						console.log(item.id,item,'edit width height')
                // 						setTimeout(()=>{
                // 							drawingRef.current?.updateUnit(item.id,{
                // 								width:item.width_input,
                // 								height:item.height_input,
                // 								x: item.position_x || null,
                // 								y: item.position_y || null,
                // 							})
                // 						},100)

                // 					}
                // 				}
                // 			})
                // 		},100)
                // 	}
                // },100)

                // 更新drawing方法
                setTimeout(() => {
                    if (drawingRef.current) {
                        units.forEach((item: any, index: any) => {
                            if (item.isSelected) {
                                let obj = {
                                    id: item.id,
                                    product_value: item.product.selected_value,
                                    product_type_value: item.product_type.selected_value,
                                    operability_value: item.operability.selected_value,
                                    width_input: item.width_input,
                                    height_input: item.height_input,
                                    position_x: item.position_x,
                                    position_y: item.position_y,
                                    canvas_data: item.canvas_data,
                                    line: item.line,
                                };
                                let selectedTemplate = selectedTemplateRef.current;
                                if (selectedTemplate && selectedTemplate.id && selectedTemplate.data_structure) {
                                    obj.canvas_data = selectedTemplate.data_structure;
                                }
                                console.log(obj, 'objobjobjobjobjobjobj------uodateUnit');
                                console.log('开始替换，数据如下:', obj);
                                drawingRef.current?.resetUnit(obj);

                                if (item.width_input && item.height_input) {
                                    console.log(item.id, item, 'edit width height');
                                    setTimeout(() => {
                                        console.log('开始修改宽高，数据如下:', {
                                            width: item.width_input,
                                            height: item.height_input,
                                        });
                                        drawingRef.current?.updateUnit(item.id, {
                                            width: item.width_input,
                                            height: item.height_input,
                                            x: item.position_x || null,
                                            y: item.position_y || null,
                                        });
                                    }, 300);
                                }
                            }
                        });
                    }
                }, 100);
            }
        } else {
            if (selectedTemplate && selectedTemplate.id && selectedTemplate.data_structure) {
                addUnitLeftMsg.canvas_data = selectedTemplate.data_structure;
            }

            let MaxX = 0;
            let startX = 0;
            let startY = 0;
            if (units && units.length != 0) {
                units.forEach((item: any) => {
                    if (item.position_x) {
                        if (item.position_x > MaxX) {
                            MaxX = item.position_x;
                            startX = item.position_x + item.width_input;
                            startY = item.position_y;
                        }
                    }
                });
            }

            let unitItem: any = {};
            unitItem.product = {
                options: leftOptionsMap.product,
                selected_value: addUnitLeftMsg.product_value,
            };

            unitItem.product_type = {
                options: leftOptionsMap.productType,
                selected_value: addUnitLeftMsg.product_type_value,
            };

            unitItem.operability = {
                options: leftOptionsMap.operability,
                selected_value: addUnitLeftMsg.operability_value,
            };

            unitItem.width_input = addUnitLeftMsg.width_input;
            unitItem.height_input = addUnitLeftMsg.height_input;
            unitItem.position_x = startX;
            unitItem.position_y = startY;

            unitItem.canvas_data = addUnitLeftMsg.canvas_data;

            unitItem.id = generateNewId();

            units.push(unitItem);
            units.forEach((item: any, index: any) => {
                item.line = index + 1;
            });
            setUnits([...units]);

            // handleClear()
            // setTimeout(()=>{
            // 	if(drawingRef.current){
            // 		let arr:any = []
            // 		units.forEach((item:any,index:any)=>{
            // 			let obj = {
            // 				id: item.id,
            // 				product_value: item.product.selected_value,
            // 				product_type_value: item.product_type.selected_value,
            // 				operability_value: item.operability.selected_value,
            // 				width_input: item.width_input,
            // 				height_input: item.height_input,
            // 				position_x: item.position_x,
            // 				position_y: item.position_y,
            // 				canvas_data: item.canvas_data
            // 			}
            // 			if(obj.canvas_data){
            // 				arr.push(obj)
            // 			}
            // 		})
            // 		if(arr.length!=0){
            // 			console.log(arr,'arrrrrrrrrrrrrrr')
            // 			drawingRef.current.importUnits(arr)
            // 		}

            // 		setTimeout(()=>{
            // 			console.log(units,'unitsunitsunitsunitsunits')
            // 			units.forEach((item:any)=>{
            // 				if(item.width_input && item.height_input){
            // 					console.log(item.id,item,'edit width height')
            // 					drawingRef.current?.updateUnit(item.id,{
            // 						width:item.width_input,
            // 						height:item.height_input,
            // 						x: item.position_x || null,
            // 						y: item.position_y || null,
            // 					})
            // 				}
            // 			})
            // 		},100)
            // 	}
            // },100)

            // 更新drawing方法
            setTimeout(() => {
                if (drawingRef.current) {
                    let obj = {
                        id: unitItem.id,
                        product_value: unitItem.product.selected_value,
                        product_type_value: unitItem.product_type.selected_value,
                        operability_value: unitItem.operability.selected_value,
                        width_input: unitItem.width_input,
                        height_input: unitItem.height_input,
                        position_x: unitItem.position_x,
                        position_y: unitItem.position_y,
                        canvas_data: unitItem.canvas_data,
                        line: units[units.length - 1].line,
                    };
                    console.log(obj, 'objobjobjobjobjobjobj------addUnit');
                    drawingRef.current?.resetUnit(obj);

                    if (unitItem.width_input && unitItem.height_input) {
                        console.log(unitItem.id, unitItem, 'edit width height');
                        setTimeout(() => {
                            drawingRef.current?.updateUnit(unitItem.id, {
                                width: unitItem.width_input,
                                height: unitItem.height_input,
                                x: unitItem.position_x || null,
                                y: unitItem.position_y || null,
                            });
                        }, 300);
                    }
                }
            }, 100);
        }
    }, 700);

    const customizeUnit = () => {
        let tempItem: any = JSON.parse(JSON.stringify(itemRef.current));
        if (isUnitsSelectedFunc(unitsRef.current)) {
            let tempUnits: any = [];
            units.forEach((item: any, index: any) => {
                if (item.isSelected) {
                    tempUnits.push(JSON.parse(JSON.stringify(item)));
                }
            });
            console.log(tempUnits, 'tempUnitstempUnits');
            tempItem.units = JSON.parse(JSON.stringify(tempUnits));
        } else {
            let unitItem: any = {};
            unitItem.product = {
                options: leftOptionsMap.product,
                selected_value: addUnitLeftMsg.product_value,
            };

            unitItem.product_type = {
                options: leftOptionsMap.productType,
                selected_value: addUnitLeftMsg.product_type_value,
            };

            unitItem.operability = {
                options: leftOptionsMap.operability,
                selected_value: addUnitLeftMsg.operability_value,
            };

            unitItem.width_input = addUnitLeftMsg.width_input;
            unitItem.height_input = addUnitLeftMsg.height_input;
            unitItem.position_x = null;
            unitItem.position_y = null;

            unitItem.canvas_data = addUnitLeftMsg.canvas_data;

            unitItem.id = generateNewId();
            let tempUnits: any = [];
            tempUnits.push(JSON.parse(JSON.stringify(unitItem)));
            console.log(tempUnits, 'tempUnitstempUnits111111');
            tempItem.units = JSON.parse(JSON.stringify(tempUnits));
        }
        tempItem.is_system = false;
        tempItem.dimension_data = null;
        tempItem.item_type.selected_value = JSON.parse(JSON.stringify(tempItem.units[0].product.selected_value));
        setCustomizeItem(tempItem);
        setIsCustomizeUnit(true);
    };

    const handleUpdateCustomizeUnit = (unitMsg: any) => {
        if (unitMsg && unitMsg.id) {
            if (isUnitsSelectedFunc(unitsRef.current)) {
                units.forEach((item: any, index: any) => {
                    if (item.isSelected && item.id == unitMsg.id) {
                        item.product = JSON.parse(JSON.stringify(unitMsg.product));
                        item.product_type = JSON.parse(JSON.stringify(unitMsg.product_type));
                        item.operability = JSON.parse(JSON.stringify(unitMsg.operability));
                        item.canvas_data = unitMsg.canvas_data;
                        item.width_input = unitMsg.width_input;
                        item.height_input = unitMsg.height_input;
                        if (drawingRef.current) {
                            let obj = {
                                id: item.id,
                                product_value: item.product.selected_value,
                                product_type_value: item.product_type.selected_value,
                                operability_value: item.operability.selected_value,
                                width_input: item.width_input,
                                height_input: item.height_input,
                                position_x: item.position_x,
                                position_y: item.position_y,
                                canvas_data: item.canvas_data,
                                line: item.line,
                            };

                            //gn:如果是system类型，isCustomizeUnit为true的自定义界面，在重新render后需要及时更新上个render界面的unit数据
                            /**
                             * render界面的数据和自定义界面数据，是相互独立的，两个界面的数据状态由各个界面自己维护
                             * 所以当自定义界面的数据render后，需要及时更新render界面的unit，并关闭自定义界面
                             * 于此同时，在使用自定义unit数据更新render界面的unit时候，需要及时清除掉render界面中相同unit中的divider
                             */
                            drawingRef.current?.resetUnit(obj, 'customUnit');

                            try {
                                JSON.parse(item.canvas_data);
                            } catch (error) {
                                console.log('######## handleUpdateCustomizeUnit error #########', error);
                            }

                            if (obj.width_input && obj.height_input) {
                                setTimeout(() => {
                                    drawingRef.current?.updateUnit(obj.id, {
                                        width: obj.width_input,
                                        height: obj.height_input,
                                        x: obj.position_x || null,
                                        y: obj.position_y || null,
                                    });
                                }, 300);
                            }
                            setIsCustomizeUnit(false);
                        }
                    }
                });
            } else {
            }
        }
    };

    const cancelCustomize = () => {
        setIsCustomizeUnit(false);
    };

    const confirmCustomize = (canvas_data: any) => {
        if (canvas_data) {
            let data_structure: any = JSON.parse(canvas_data);
            if (typeof data_structure === 'string') {
                data_structure = JSON.parse(data_structure);
            }
            let widthHeightMsg: any = calculationFunc(data_structure.components);
            let width = widthHeightMsg.width || 0;
            let height = widthHeightMsg.height || 0;
            if (isUnitsSelectedFunc(unitsRef.current)) {
                units.forEach((item: any, index: any) => {
                    if (item.isSelected) {
                        let obj = {
                            id: item.id,
                            product_value: item.product.selected_value,
                            product_type_value: item.product_type.selected_value,
                            operability_value: item.operability.selected_value,
                            width_input: width,
                            height_input: height,
                            position_x: item.position_x,
                            position_y: item.position_y,
                            canvas_data: canvas_data,
                            line: item.line,
                        };
                        drawingRef.current?.resetUnit(obj);
                        if (obj.width_input && obj.height_input) {
                            setTimeout(() => {
                                drawingRef.current?.updateUnit(item.id, {
                                    width: obj.width_input,
                                    height: obj.height_input,
                                    x: obj.position_x || null,
                                    y: obj.position_y || null,
                                });
                            }, 300);
                        }
                    }
                });
            } else {
                addUnitLeftMsg.canvas_data = canvas_data;
                addUnitLeftMsg.width_input = width;
                addUnitLeftMsg.height_input = height;

                let MaxX = 0;
                let startX = 0;
                let startY = 0;
                if (units && units.length != 0) {
                    units.forEach((item: any) => {
                        if (item.position_x) {
                            if (item.position_x > MaxX) {
                                MaxX = item.position_x;
                                startX = item.position_x + item.width_input;
                                startY = item.position_y;
                            }
                        }
                    });
                }

                let unitItem: any = {};
                unitItem.product = {
                    options: leftOptionsMap.product,
                    selected_value: addUnitLeftMsg.product_value,
                };

                unitItem.product_type = {
                    options: leftOptionsMap.productType,
                    selected_value: addUnitLeftMsg.product_type_value,
                };

                unitItem.operability = {
                    options: leftOptionsMap.operability,
                    selected_value: addUnitLeftMsg.operability_value,
                };

                unitItem.width_input = addUnitLeftMsg.width_input;
                unitItem.height_input = addUnitLeftMsg.height_input;
                unitItem.position_x = startX;
                unitItem.position_y = startY;

                unitItem.canvas_data = addUnitLeftMsg.canvas_data;

                unitItem.id = generateNewId();

                units.push(unitItem);
                units.forEach((item: any, index: any) => {
                    item.line = index + 1;
                });
                setUnits([...units]);

                setTimeout(() => {
                    if (drawingRef.current) {
                        let obj = {
                            id: unitItem.id,
                            product_value: unitItem.product.selected_value,
                            product_type_value: unitItem.product_type.selected_value,
                            operability_value: unitItem.operability.selected_value,
                            width_input: unitItem.width_input,
                            height_input: unitItem.height_input,
                            position_x: unitItem.position_x,
                            position_y: unitItem.position_y,
                            canvas_data: unitItem.canvas_data,
                            line: units[units.length - 1].line,
                        };
                        drawingRef.current?.resetUnit(obj);

                        if (unitItem.width_input && unitItem.height_input) {
                            setTimeout(() => {
                                drawingRef.current?.updateUnit(unitItem.id, {
                                    width: unitItem.width_input,
                                    height: unitItem.height_input,
                                    x: unitItem.position_x || null,
                                    y: unitItem.position_y || null,
                                });
                            }, 300);
                        }
                    }
                }, 100);
            }
            setIsCustomizeUnit(false);
        }
    };

    const saveUnit = async () => {
        if (drawingRef.current) {
            let data: any = drawingRef.current.exportUnits();

            let dimension_data = drawingRef.current.exportDimensions();
            dimension_data = JSON.stringify(dimension_data);

            setWebsocketUnitsByCanvasToolReturnData(data);

            setTimeout(async () => {
                setSaveLoading(true);

                if (drawingRef.current) {
                    let item = itemRef.current;
                    let imgMsg = await drawingRef.current.exportImage();
                    const blob = dataURLtoBlob(imgMsg.dataURL);
                    const file = blobToFile(blob, 'drawing.png');
                    let item_id = itemRef.current.id;
                    let type = 'drawing';
                    const formData = new FormData();

                    let finnalData: any = {
                        dimension_data: dimension_data,
                    };
                    data.forEach((unitItem: any) => {
                        finnalData[unitItem.unitId] = unitItem.canvas_data;
                    });

                    formData.append('canvas_data', JSON.stringify(finnalData));
                    formData.append('item_file', file);

                    let unitIds: any = [];
                    let promiseAll: any = [];
                    unitsRef.current.forEach((item: any, index: any) => {
                        item.line = index + 1;
                        if (item.product && item.product.options && item.product.options.length != 0) {
                            item.product.options.map((item1: any) => {
                                delete item1.label;
                            });
                        }
                        promiseAll.push(drawingRef.current?.exportUnitImage(item.id));
                    });
                    let promiseAllData = await Promise.all(promiseAll);
                    promiseAllData.forEach((msg: any) => {
                        if (msg.dataURL) {
                            const blob = dataURLtoBlob(msg.dataURL);
                            const file = blobToFile(blob, 'drawing.png');
                            formData.append('unit_files', file);
                            unitIds.push(msg.unitId);
                        }
                    });
                    formData.append('unit_ids', unitIds);
                    http.post(
                        `/quote/update_canvas_data_and_item_unit_image/${item_id}/item_image_type/${type}`,
                        formData
                    )
                        .then(() => {
                            if (item.image) {
                                item.image.current_selected_mode = type;
                            }
                            item.units = unitsRef.current;
                            item.units.forEach((unitItem: any) => {
                                unitItem.canvas_data = null;
                            });
                            if (item.units.length == 1) {
                                item.item_type.selected_value = item.units[0].product.selected_value;
                            } else {
                                item.item_type.selected_value = '99';
                            }
                            props.handleUpdateQuote(item);
                            setSaveLoading(false);
                            props.setIsOpenNewDrawingBox(false);
                        })
                        .catch((error) => {
                            console.error('Error fetching data:', error);
                        });
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
        setSelectedDividersArrangement({ ...selectedDividersArrangement });
        let item_type_value = props.currentItem.item_type.selected_value;
        let frame_material_value = props.currentItem.frame_material.selected_value;
        let profile_value = props.currentItem.profile.selected_value;
        let casting_style_value = props.currentItem.casting_style.selected_value;
        getDividersArrangement(
            item_type_value,
            frame_material_value,
            profile_value,
            casting_style_value,
            selectedDividedLiteType.value
        );
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
                        console.log(data.data, '0----------');
                        leftOptionsMap.dividedLiteType = data.data;
                        setLeftOptionsMap({ ...leftOptionsMap });
                    }
                }
            })
            .catch((error: any) => {
                console.error('Error fetching data:', error);
            })
            .finally(() => {});
    };
    const changeDividersArrangement = (value: any) => {
        selectedDividersArrangement.value = value;
        console.log(
            selectedDividersArrangement,
            'selectedDividersArrangementselectedDividersArrangementselectedDividersArrangement'
        );
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
                        leftOptionsMap.dividersArrangement = data.data;
                        setLeftOptionsMap({ ...leftOptionsMap });
                    } else {
                        leftOptionsMap.dividersArrangement = [];
                        setLeftOptionsMap({ ...leftOptionsMap });
                    }
                }
            })
            .catch((error: any) => {
                console.error('Error fetching data:', error);
            })
            .finally(() => {});
    };

    const clickRightBox = (e: any) => {
        changeSelectUnits({
            id: null,
        });
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
        } catch (error) {
            console.log(error);
        }
    };

    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('shape-type', type);
    };

    const handleClear = () => {
        drawingRef.current?.importData({});
        drawingRef.current?.clearZones([]);
    };

    const handleDrawingSelect = (msg: any) => {
        console.log(msg, '--------------');
        if (msg && msg.length != 0) {
            let units = unitsRef.current;
            units.forEach((item: any) => {
                if (item.id == msg[0].unitId) {
                    if (item.isSelected) {
                    } else {
                        changeSelectUnits({
                            id: msg[0].unitId,
                        });
                    }
                }
            });
        } else {
            changeSelectUnits({
                id: null,
            });
        }
    };

    const canvasToolChange = (data: any) => {
        console.log(data, '------data---------');
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
        console.log(obj, 'objobj');
        return obj;
    };

    const setWebsocketUnitsByCanvasToolReturnData = (data: any) => {
        console.log(data, 'daddddddddddddddddddddddddddd');
        let item = itemRef.current;
        let units = unitsRef.current;
        if (data.length == 0) {
            units = [];
        } else {
            let tempUnits: any = [];
            units.forEach((item: any, index: any) => {
                data.forEach((item1: any) => {
                    if (item.id == item1.unitId) {
                        item.canvas_data = item1.canvas_data;
                        item.position_x = item1.virtualFrame.x;
                        item.position_y = item1.virtualFrame.y;
                        tempUnits.push(JSON.parse(JSON.stringify(item)));
                    }
                });
            });
            units = tempUnits;
            units.forEach((item: any) => {
                // 设置宽高
                let data_structure = JSON.parse(item.canvas_data);
                console.log(data_structure, 'data_structuredata_structuredata_structure');

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
                                            ? setValue(
                                                  selectedDividersArrangement,
                                                  leftOptionsMap.dividersArrangement.current
                                              )
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
                                            ? setValue(
                                                  selectedDividersArrangement,
                                                  leftOptionsMap.dividersArrangement.current
                                              )
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

            setUnits([...units]);
        }
    };

    const handleZoom = (type: 'in' | 'out') => {
        drawingRef.current?.handleZoom(type);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setCurrentMode(null);
                if (drawingRef.current) {
                    drawingRef.current.setDragMode(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentMode]);

    const isDisabledSave = ($item: any) => {
        let data: any = [];
        if (drawingRef) {
            data = drawingRef?.current?.exportUnits();
        }
        let tempFlag = false;
        if ($item.units.length < 1) {
            tempFlag = true;
            return tempFlag;
        }
        if (!data) {
            tempFlag = true;
            return tempFlag;
        }
        if (data.length < 1) {
            tempFlag = true;
            return tempFlag;
        }
        data &&
            data.forEach((s: any, i: Number) => {
                if (!s.canvas_data) {
                    tempFlag = true;
                }
            });
        return tempFlag;
    };

    return (
        <Spin spinning={isLoading}>
            {
                <div
                    style={{ width: '100%', height: '90vh', overflowY: 'auto', display: 'flex' }}
                    className={isCustomizeUnit && styles.display_none}
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
                            {isUnitsSelectedFunc(units) && (
                                <div>
                                    <div style={{ textAlign: 'center' }}>
                                        <Segmented
                                            options={leftOptionsMap.product}
                                            value={getSelectedUnitValue('product')}
                                            onChange={(value) => productChange(value, 'edit')}
                                        />
                                    </div>
                                    <div>
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
                                                        value={getSelectedUnitValue('product_type')}
                                                        options={leftOptionsMap.productType}
                                                        disabled={leftOptionsMap.productType.length == 0}
                                                        onChange={(value) => productTypeChange(value, 'edit')}
                                                        optionRender={(option: any) => (
                                                            <Space>
                                                                <span>{option.data.text}</span>
                                                            </Space>
                                                        )}
                                                        labelRender={(label: any) => (
                                                            <Space>
                                                                <span style={{ fontSize: '14px' }}>
                                                                    {setValue(label.value, leftOptionsMap.productType)}
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
                                                    {getSelectedUnitValue('product_type') == '56' ? (
                                                        <FoldingSelect
                                                            handleSelectChange={(value: any) => {
                                                                productTypeOpenChange(value, 'edit');
                                                            }}
                                                            index={0}
                                                            options={leftOptionsMap.operability}
                                                            operability={{
                                                                selected_value: getSelectedUnitValue('operability'),
                                                                options: leftOptionsMap.operability,
                                                            }}
                                                        />
                                                    ) : hasCorner(leftOptionsMap.operability) ? (
                                                        <OperabilitySelect
                                                            operability={{
                                                                selected_value: getSelectedUnitValue('operability'),
                                                                options: leftOptionsMap.operability,
                                                            }}
                                                            handleSelectChange={(value: any) => {
                                                                productTypeOpenChange(value, 'edit');
                                                            }}
                                                            index={0}
                                                            options={leftOptionsMap.operability}
                                                        />
                                                    ) : (
                                                        <Select
                                                            placeholder="Open, Hinge, etc."
                                                            style={{ width: '100%' }}
                                                            value={getSelectedUnitValue('operability')}
                                                            options={leftOptionsMap.operability}
                                                            disabled={leftOptionsMap.operability.length == 0}
                                                            onChange={(value: any) => {
                                                                productTypeOpenChange(value, 'edit');
                                                            }}
                                                            optionRender={(option: any) => (
                                                                <Space>
                                                                    <span>{option.data.text}</span>
                                                                </Space>
                                                            )}
                                                            labelRender={(label: any) => (
                                                                <Space>
                                                                    <span style={{ fontSize: '14px' }}>
                                                                        {setValue(
                                                                            label.value,
                                                                            leftOptionsMap.operability
                                                                        )}
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
                                                        value={(
                                                            (getSelectedUnitValue1('width_input') || 0) / 25.4
                                                        ).toFixed(0)}
                                                        onBlur={(e) =>
                                                            changeWidth(
                                                                Number((Number(e.target.value) * 25.4).toFixed(6)),
                                                                'edit'
                                                            )
                                                        }
                                                        onKeyDown={(e: any) => {
                                                            if (e.key === 'Enter') {
                                                                changeWidth(
                                                                    Number((Number(e.target.value) * 25.4).toFixed(6)),
                                                                    'edit'
                                                                );
                                                            }
                                                        }}
                                                        key={`width-in-${getSelectedUnitValue1('width_input') || 0}`}
                                                    />
                                                    {/* <InputNumber
														style={{marginLeft:"10px"}}
														controls={false}
														suffix="mm"
														className="w-full rounded-full"
														value={getSelectedUnitValue1('width_input')?.toFixed(0)}
														onBlur={(e) =>
															changeWidth(Number(e.target.value),"edit")
														}
														onKeyDown={(e:any)=>{
															if (e.key === "Enter") {
																changeWidth(Number(e.target.value),"edit")
															}
														}}
														key={`width-mm-${getSelectedUnitValue1('width_input') || 0}`}
													/> */}
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
                                                        value={(
                                                            (getSelectedUnitValue1('height_input') || 0) / 25.4
                                                        ).toFixed(0)}
                                                        onBlur={(e) =>
                                                            changeHeight(
                                                                Number((Number(e.target.value) * 25.4).toFixed(6)),
                                                                'edit'
                                                            )
                                                        }
                                                        onKeyDown={(e: any) => {
                                                            if (e.key === 'Enter') {
                                                                changeHeight(
                                                                    Number((Number(e.target.value) * 25.4).toFixed(6)),
                                                                    'edit'
                                                                );
                                                            }
                                                        }}
                                                        key={`width-in-${getSelectedUnitValue1('height_input') || 0}`}
                                                    />
                                                    {/* <InputNumber
														style={{marginLeft:"10px"}}
														controls={false}
														suffix="mm"
														className="w-full rounded-full"
														value={getSelectedUnitValue1('height_input')?.toFixed(0)}
														onBlur={(e) =>
															changeHeight(Number(e.target.value), "edit")
														}
														onKeyDown={(e:any)=>{
															if (e.key === "Enter") {
																changeHeight(Number(e.target.value), "edit")
															}
														}}
														key={`width-mm-${getSelectedUnitValue1('height_input')|| 0}`}
													/> */}
                                                </div>
                                            </Col>
                                        </Row>
                                        {(getSelectedUnitValue1('width_input') > (maxWidthHeight.max_width || 0) ||
                                            getSelectedUnitValue1('height_input') >
                                                (maxWidthHeight.max_height || 0)) && (
                                            <Row
                                                gutter={[16, 24]}
                                                style={{ marginTop: '10px' }}
                                            >
                                                <Col span={24}>
                                                    {(getSelectedUnitValue1('width_input') > maxWidthHeight.max_width ||
                                                        getSelectedUnitValue1('height_input') >
                                                            maxWidthHeight.max_height) &&
                                                        maxWidthHeight.max_width && (
                                                            <p className="text-dragonOrange text-xs">
                                                                {`Review. Max size exceeded (${(
                                                                    maxWidthHeight.max_width / 25.4
                                                                ).toFixed(2)}" width, ${(
                                                                    maxWidthHeight.max_height / 25.4
                                                                ).toFixed(2)}"
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
                                                        {leftOptionsMap.template.length == 0 && (
                                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                                        )}
                                                        {leftOptionsMap.template.length != 0 && (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                                                {leftOptionsMap.template.map(
                                                                    (item: any, index: any) => {
                                                                        return (
                                                                            <div
                                                                                style={{
                                                                                    display: 'inline-block',
                                                                                    margin: '8px',
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
                                                                                    onSelectedTemplate(
                                                                                        item,
                                                                                        'edit',
                                                                                        'userClick'
                                                                                    )
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
                                                                                        className={
                                                                                            styles.template_img_box
                                                                                        }
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
                                                                    }
                                                                )}
                                                                {
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
                                                                        onClick={() => customizeUnit()}
                                                                    >
                                                                        <div>Custom</div>
                                                                        <div>Shape</div>
                                                                    </Button>
                                                                }
                                                                {
                                                                    <div style={{ width: '100%', display: 'flex' }}>
                                                                        {
                                                                            <Tooltip title="Please select the template for add or replacement">
                                                                                <Button
                                                                                    style={{ width: '100%' }}
                                                                                    shape="round"
                                                                                    disabled={!selectedTemplate.id}
                                                                                    onClick={() =>
                                                                                        addReplaceTemplate('edit')
                                                                                    }
                                                                                    type="primary"
                                                                                >
                                                                                    Replace
                                                                                </Button>
                                                                            </Tooltip>
                                                                        }
                                                                        {/* <Tooltip title="Draw a custom door or window drawing without using a template">
																			<Button 
																				style={{width:"100%",marginLeft:"15px"}} 
																				shape="round"
																				onClick={()=>customizeUnit()}
																			>
																				Customize
																			</Button>
																		</Tooltip> */}
                                                                    </div>
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
                                    </div>
                                </div>
                            )}
                            {!isUnitsSelectedFunc(units) && (
                                <div>
                                    <div style={{ textAlign: 'center' }}>
                                        <Segmented
                                            options={leftOptionsMap.product}
                                            value={addUnitLeftMsg.product_value}
                                            onChange={(value) => productChange(value, 'add')}
                                        />
                                    </div>
                                    <div>
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
                                                        value={addUnitLeftMsg.product_type_value}
                                                        options={leftOptionsMap.productType}
                                                        disabled={leftOptionsMap.productType.length == 0}
                                                        onChange={(value) => productTypeChange(value, 'add')}
                                                        optionRender={(option: any) => (
                                                            <Space>
                                                                <span>{option.data.text}</span>
                                                            </Space>
                                                        )}
                                                        labelRender={(label: any) => (
                                                            <Space>
                                                                <span style={{ fontSize: '14px' }}>
                                                                    {setValue(label.value, leftOptionsMap.productType)}
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
                                                    {getSelectedUnitValue('product_type') == '56' ? (
                                                        <FoldingSelect
                                                            handleSelectChange={(value: any) => {
                                                                productTypeOpenChange(value, 'add');
                                                            }}
                                                            index={0}
                                                            options={leftOptionsMap.operability}
                                                            operability={{
                                                                selected_value: addUnitLeftMsg.operability_value,
                                                                options: leftOptionsMap.operability,
                                                            }}
                                                        />
                                                    ) : hasCorner(leftOptionsMap.operability) ? (
                                                        <OperabilitySelect
                                                            operability={{
                                                                selected_value: addUnitLeftMsg.operability_value,
                                                                options: leftOptionsMap.operability,
                                                            }}
                                                            handleSelectChange={(value: any) => {
                                                                productTypeOpenChange(value, 'add');
                                                            }}
                                                            index={0}
                                                            options={leftOptionsMap.operability}
                                                        />
                                                    ) : (
                                                        <Select
                                                            placeholder="Open, Hinge, etc."
                                                            style={{ width: '100%' }}
                                                            value={addUnitLeftMsg.operability_value}
                                                            options={leftOptionsMap.operability}
                                                            disabled={leftOptionsMap.operability.length == 0}
                                                            onChange={(value: any) => {
                                                                productTypeOpenChange(value, 'add');
                                                            }}
                                                            optionRender={(option: any) => (
                                                                <Space>
                                                                    <span>{option.data.text}</span>
                                                                </Space>
                                                            )}
                                                            labelRender={(label: any) => (
                                                                <Space>
                                                                    <span style={{ fontSize: '14px' }}>
                                                                        {setValue(
                                                                            label.value,
                                                                            leftOptionsMap.operability
                                                                        )}
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
                                                        value={((addUnitLeftMsg.width_input || 0) / 25.4).toFixed(0)}
                                                        onBlur={(e) =>
                                                            changeWidth(
                                                                Number((Number(e.target.value) * 25.4).toFixed(6)),
                                                                'add'
                                                            )
                                                        }
                                                        onKeyDown={(e: any) => {
                                                            if (e.key === 'Enter') {
                                                                changeWidth(
                                                                    Number((Number(e.target.value) * 25.4).toFixed(6)),
                                                                    'add'
                                                                );
                                                            }
                                                        }}
                                                        key={`width-in-${addUnitLeftMsg.width_input || 0}`}
                                                    />
                                                    {/* <InputNumber
														style={{marginLeft:"10px"}}
														controls={false}
														suffix="mm"
														className="w-full rounded-full"
														value={addUnitLeftMsg.width_input?.toFixed(0)}
														onBlur={(e) =>
															changeWidth(Number(e.target.value),"add")
														}
														onKeyDown={(e:any)=>{
															if (e.key === "Enter") {
																changeWidth(Number(e.target.value),"add")
															}
														}}
														key={`width-mm-${addUnitLeftMsg.width_input || 0}`}
													/> */}
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
                                                        value={((addUnitLeftMsg.height_input || 0) / 25.4).toFixed(0)}
                                                        onBlur={(e) =>
                                                            changeHeight(
                                                                Number((Number(e.target.value) * 25.4).toFixed(6)),
                                                                'add'
                                                            )
                                                        }
                                                        onKeyDown={(e: any) => {
                                                            if (e.key === 'Enter') {
                                                                changeHeight(
                                                                    Number((Number(e.target.value) * 25.4).toFixed(6)),
                                                                    'add'
                                                                );
                                                            }
                                                        }}
                                                        key={`width-in-${addUnitLeftMsg.height_input || 0}`}
                                                    />
                                                    {/* <InputNumber
														style={{marginLeft:"10px"}}
														controls={false}
														suffix="mm"
														className="w-full rounded-full"
														value={addUnitLeftMsg.height_input?.toFixed(0)}
														onBlur={(e) =>
															changeHeight(Number(e.target.value), "add")
														}
														onKeyDown={(e:any)=>{
															if (e.key === "Enter") {
																changeHeight(Number(e.target.value), "add")
															}
														}}
														key={`width-mm-${addUnitLeftMsg.height_input|| 0}`}
													/> */}
                                                </div>
                                            </Col>
                                        </Row>
                                        {(addUnitLeftMsg.width_input > (maxWidthHeight.max_width || 0) ||
                                            addUnitLeftMsg.height_input > (maxWidthHeight.max_height || 0)) && (
                                            <Row
                                                gutter={[16, 24]}
                                                style={{ marginTop: '10px' }}
                                            >
                                                <Col span={24}>
                                                    {(addUnitLeftMsg.width_input > maxWidthHeight.max_width ||
                                                        addUnitLeftMsg.height_input > maxWidthHeight.max_height) &&
                                                        maxWidthHeight.max_width && (
                                                            <p className="text-dragonOrange text-xs">
                                                                {`Review. Max size exceeded (${(
                                                                    maxWidthHeight.max_width / 25.4
                                                                ).toFixed(2)}" width, ${(
                                                                    maxWidthHeight.max_height / 25.4
                                                                ).toFixed(2)}"
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
                                                        {leftOptionsMap.template.length == 0 && (
                                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                                        )}
                                                        {leftOptionsMap.template.length != 0 && (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                                                {leftOptionsMap.template.map(
                                                                    (item: any, index: any) => {
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
                                                                                    onSelectedTemplate(
                                                                                        item,
                                                                                        'add',
                                                                                        'userClick'
                                                                                    )
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
                                                                                        className={
                                                                                            styles.template_img_box
                                                                                        }
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
                                                                    }
                                                                )}
                                                                {
                                                                    <div style={{ width: '100%', display: 'flex' }}>
                                                                        {
                                                                            <Tooltip title="Please select the template for add or replacement">
                                                                                <Button
                                                                                    style={{ width: '100%' }}
                                                                                    icon={<PlusOutlined />}
                                                                                    shape="round"
                                                                                    disabled={!selectedTemplate.id}
                                                                                    type="primary"
                                                                                    onClick={() =>
                                                                                        addReplaceTemplate('add')
                                                                                    }
                                                                                >
                                                                                    Add
                                                                                </Button>
                                                                            </Tooltip>
                                                                        }
                                                                        {/* <Tooltip title="Draw a custom door or window drawing without using a template">
																			<Button 
																				style={{width:"100%",marginLeft:"15px"}} 
																				shape="round"
																				onClick={()=>customizeUnit()}
																			>
																				Customize
																			</Button>
																		</Tooltip> */}
                                                                    </div>
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
                                    </div>
                                </div>
                            )}
                        </div>
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
                            {
                                <Col span={24}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Segmented
                                            options={leftOptionsMap.dividedLiteType}
                                            value={selectedDividedLiteType.value}
                                            onChange={sdlTdlChange}
                                        />
                                    </div>
                                    {/* <Row gutter={[16, 24]} style={{marginTop:"24px"}}>
										<Col span={24}>
											<div style={{position:"relative"}}>
												{
													<Select
														placeholder=""
														style={{ width: "100%" }}
														value={selectedDividersArrangement.value}
														options={leftOptionsMap.dividersArrangement}
														disabled={leftOptionsMap.dividersArrangement.length == 0}
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
																	{setValue(label.value,leftOptionsMap.dividersArrangement)}
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
                                </Col>
                            }
                        </Row>
                        {
                            <div style={{ width: '250px', position: 'absolute', bottom: '0px' }}>
                                <Button
                                    loading={saveLoading}
                                    onClick={saveUnit}
                                    style={{ width: '100%', zIndex: '100' }}
                                    type="primary"
                                    disabled={isDisabledSave(item)}
                                >
                                    Save
                                </Button>
                            </div>
                        }
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
                                {/* <Tooltip title="Undo">
									<Button
										icon={<UndoOutlined/>}
										onClick={handleUndo}
										disabled={!canUndo}
									/>
								</Tooltip>
								<Tooltip title="Redo">
									<Button
										icon={<RedoOutlined/>}
										onClick={handleRedo}
										disabled={!canRedo}
									/>
								</Tooltip>
								<Divider type="vertical"/> */}
                                {/* <Divider type="vertical"/>
								<Tooltip title="Zoom In">
									<Button onClick={() => handleZoom('in')} icon={<ZoomInOutlined/>}/>
								</Tooltip>
								<Tooltip title="Zoom Out">
									<Button onClick={() => handleZoom('out')} icon={<ZoomOutOutlined/>}/>
								</Tooltip>
								{/* <Divider type="vertical"/> */}
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
                                <Tooltip title="Dimension">
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
                                        type={currentMode === 'dimension' ? 'primary' : 'default'}
                                    />
                                </Tooltip>
                                <Tooltip title="Deletion operations cannot be performed when there is only one item">
                                    <Button
                                        icon={<DeleteOutlined />}
                                        onClick={handleDelete}
                                        disabled={units.length <= 1}
                                    />
                                </Tooltip>
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
                                        onSelectChange={handleDrawingSelect}
                                        onChange={handleDrawingChange}
                                    />
                                }
                            </Content>
                        </Layout>
                    </div>
                    <div
                        className={styles.right_box}
                        onClick={clickRightBox}
                    >
                        <div>
                            <h3 className="text-disarmBlue font-semibold">Total Dimensions</h3>
                            <div className="flex gap-1">
                                <div className="flex">
                                    <span className="text-gray-500">Width</span>
                                    <span style={{ marginLeft: '5px' }}>
                                        {item?.width_input ? `${(item.width_input / 25.4).toFixed(0)}"` : '0"'}
                                    </span>
                                </div>
                                <span className="mx-1">| </span>
                                <div className="flex gap-2">
                                    <span className="text-gray-500">Height</span>
                                    <span>
                                        {item?.height_input ? `${(item.height_input / 25.4).toFixed(0)}"` : '0"'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {units && units.length != 0 && (
                            <div>
                                {units.map((item: any, index: any) => {
                                    return (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            className="flex flex-col w-full mt-5 sub_item_box"
                                            style={{
                                                border: '1px solid #efefef',
                                                borderRadius: '8px',
                                                paddingBottom: '10px',
                                                boxSizing: 'border-box',
                                            }}
                                            key={index}
                                        >
                                            <div
                                                className="font-semibold flex w-full rounded px-3 justify-between cursor-pointer text-primary bg-gray-100"
                                                style={{
                                                    padding: '5px 10px',
                                                    boxSizing: 'border-box',
                                                    backgroundColor: item?.isSelected ? '#091E42' : '',
                                                    color: item?.isSelected ? '#fff' : '',
                                                }}
                                                onClick={() => changeSelectUnits(item)}
                                            >
                                                <div
                                                    className="flex items-center gap-2"
                                                    style={{ fontSize: '14px' }}
                                                >
                                                    <p className="">Sub Item {index + 1}</p>
                                                    {(!item.canvas_data ||
                                                        !(item.canvas_data && item.canvas_data.includes('zones'))) && (
                                                        <Tooltip title="This item does not have canvas data. Please select it and then choose the template on the left to replace it">
                                                            <InfoCircleOutlined />
                                                        </Tooltip>
                                                    )}
                                                </div>
                                                <div>
                                                    <CopyOutlined
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            copyUnit(item);
                                                        }}
                                                        style={{ marginRight: '30px', fontSize: '14px' }}
                                                    />
                                                    <DeleteOutlined
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteUnit(item);
                                                        }}
                                                        style={{ fontSize: '14px' }}
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                className="flex flex-col px-3 gap-2 w-full"
                                                style={{ color: '#646464', fontSize: '12px', marginTop: '20px' }}
                                            >
                                                <div
                                                    className="text-gray-600"
                                                    style={{ fontWeight: '700' }}
                                                >
                                                    Operability
                                                </div>
                                                <div className="flex flex-col gap-2 pl-4">
                                                    {/* Category */}
                                                    <div className="flex w-full">
                                                        <span className=" mr-1 text-gray-500">Category: </span>
                                                        <span className="text-gray-800">
                                                            {setValue(
                                                                item.product.selected_value,
                                                                item.product.options
                                                            ) || '-'}
                                                        </span>
                                                    </div>

                                                    {/* Type */}
                                                    <div className="flex w-full">
                                                        <span className="mr-1 text-gray-500">Type: </span>
                                                        <span className="text-gray-800">
                                                            {setValue(
                                                                item.product_type.selected_value,
                                                                item.product_type.options
                                                            ) || '-'}
                                                        </span>
                                                    </div>

                                                    {/* Open */}
                                                    <div className="flex w-full">
                                                        <span className="mr-1 text-gray-500">Open: </span>
                                                        <span className="text-gray-800">
                                                            {setValue(
                                                                item.operability.selected_value,
                                                                item.operability.options
                                                            ) || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className="flex flex-col px-3 gap-2 w-full"
                                                style={{ color: '#646464', fontSize: '12px', marginTop: '20px' }}
                                            >
                                                <div
                                                    className="text-gray-600"
                                                    style={{ fontWeight: '700' }}
                                                >
                                                    Frame Dimensions
                                                </div>
                                                <div className="flex w-full">
                                                    <div className="flex  gap-2">
                                                        <span className="text-gray-500">Width</span>
                                                        <span className="text-gray-800">
                                                            {item.width_input
                                                                ? `${(item.width_input / 25.4).toFixed(0)}"`
                                                                : '0"'}
                                                        </span>
                                                    </div>
                                                    <span className="mx-1"> | </span>
                                                    <div className="flex  gap-2 ">
                                                        <span className="text-gray-500">Height</span>
                                                        <span className="text-gray-800">
                                                            {item.height_input
                                                                ? `${(item.height_input / 25.4).toFixed(0)}"`
                                                                : '0"'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <style
                        global
                        jsx
                    >
                        {`
                            .left_box .ant-select {
                                width: 100% !important;
                            }
                        `}
                    </style>
                </div>
            }
            {isCustomizeUnit && (
                <div className={styles.customize_unit_box}>
                    <NewDrawing
                        currentItem={customizeItem}
                        handleUpdateCustomizeUnit={handleUpdateCustomizeUnit}
                        cancelCustomize={cancelCustomize}
                        from="systemDrawing"
                    ></NewDrawing>
                    {/* <DrawingDesign
                        onCancel={cancelCustomize}
                        onConfirm={confirmCustomize}
                    >

                    </DrawingDesign> */}
                </div>
            )}
            <style>{`
				.ant-input-number-suffix{
					font-size:12px!important;
				}
			`}</style>
        </Spin>
    );
};

export default NewDrawingSystem;
