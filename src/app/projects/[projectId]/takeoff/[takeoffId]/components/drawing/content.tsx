'use client';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Frame } from './data/shape/frame';
import { useSelection } from './context/selectContext';
import { SettingContextProps, useSetting } from './context/settingContext';
import { Circle, Group, Layer, Line, Stage } from 'react-konva';
import { IResizableFrame } from './components/shape/resizable-frame';
import debounce from 'lodash/debounce';
import { InputNumber, message, notification, Spin } from 'antd';
import SelectRect from './components/select/rect-select';
import { GridBackground } from './components/back-grid';
import { TriangleWindow } from './data/shape/triangle';
import { TopSemiCircleWindow, RightSemiCircleWindow } from './data/shape/semicircle';
import { HorizontalLineWindow, VerticalLineWindow } from './data/shape/line';
import { BaseFrame, ILine } from './data/baseFrame';
import { SelectionBox } from './components/select/selection-box';
import { SelectionBoxLineH } from './components/select/selection-box-line-h';
import { SelectionBoxLineV } from './components/select/selection-box-line-v';
import { FrameRenderer } from './components/shape/item-renderer';
import { GroupFrame } from './data/groupFrame';
import { ArrowData } from './data/operation/arrow';
import { AngleData } from './data/operation/angle';
import { Ruler } from './components/ruler/ruler';
import { InfoBar } from './components/info-bar/index';
import zoneUntil from './until/zoneUntil';
import moveUntil from './until/moveUntil';
import { SDLHorizontal, SDLVertical, TDLHorizontal, TDLVertical } from './data/divider/divider';
import { Zone } from './components/zone/zone';
import { DimensionData } from './data/operation/dimension';
import MeasurementLabel from './components/info/measurement-label';
import { WindowDrawerRef } from './index';
import { useHistory } from './until/historyReducer';
import { convertElementData, createElement, createImageData, importElements } from './until/importUntil';
import baseUntil from './until/baseUntil';
import { BaseData } from './data/baseData';
import { Folding } from './data/operation/folding';
import { PivotV } from './data/operation/pivotV';
import { PivotH } from './data/operation/pivotH';
import { Rail2 } from './data/operation/rail2';
import { Rail4 } from './data/operation/rail4';
import { Hardware } from './data/operation/hardware';
import { Motorized } from './data/operation/motorized';
import { PocketWall } from './data/operation/pocketWall';
import { MotoSideData } from './data/operation/motoSideData';
import { Active } from './data/operation/active';
import { Inswing } from './data/operation/inswing';
import { Outswing } from './data/operation/outswing';
import { Passive } from './data/operation/passive';
import { Dashed } from './data/operation/dashed';
import { FlodingSideData } from './data/operation/flodingSideData';
import { BaseOperation } from './data/operation/baseOperation';
import { Popover } from 'antd';
import { LineWeightPopoverContent } from './components/popover/LineWeightPopover';
import lineUntil from './until/lineUntil';
import { RenderData } from './data/render/renderData';
import { RenderSettingsPopover } from './components/popover/RenderSettingsPopover';
import { FixedData } from './data/operation/fixed';
import IndexShower from './components/info/index-shower';
import { drawingService } from '@/services/drawingService';
import {
    CanSizeChangeOperationType,
    DividerType,
    IImageData,
    INewRectangle,
    IPointPostion,
    ISashConfig,
    ISegment,
    IZone,
    OperationType,
    OverlapLineInfo,
    ShapeType,
    StageDrag,
    WinDrawerContentProps,
} from './datas';

interface CombinedState {
    elements: Array<BaseData>;
    zones: Array<IZone>;
}

const WinDrawerContent = forwardRef<WindowDrawerRef, WinDrawerContentProps>(
    ({ onChange, onChangeUnit, onDrop, loading, onSelectChange, from = 'design', getGroupZones }, ref) => {
        const [zones, setZones] = useState<Array<IZone>>([]);

        const [allPoints, setAllPoints] = useState<
            Array<{
                id: string;
                x: number;
                y: number;
                type: 'point' | 'content';
                elementId: string;
            }>
        >([]);
        const [tempDimensionPoints, setTempDimensionPoints] = useState<
            Array<{
                point: IPointPostion;
                elementId: string;
                lineId?: string;
            }>
        >([]);
        const [overlappingPoints, setOverlappingPoints] = useState<
            Array<{
                point: IPointPostion;
                elements: Array<{ elementId: string; pointIndex: number }>;
            }>
        >([]);

        const [elements, setElements] = useState<Array<BaseData>>([]);
        const isRestoringFromHistory = useRef(false);

        useImperativeHandle(ref, () => ({
            importData: (jsonData: string | object) => {
                return importData(jsonData);
            },
            exportData: (save: boolean = false) => {
                return exportData(save);
            },
            exportElementImage: async (elementId: string) => {
                return await exportElementImage(elementId);
            },
            exportUnitImage: async (unitId: string) => {
                let element = elements.find((x: any) => x.unitId && x.unitId == unitId);
                if (!element) return null;
                let resp = await exportElementImage(element.id);
                return {
                    ...resp,
                    unitId,
                };
            },
            exportImage: async () => {
                clearAllPopovers();
                clearSelection();
                if (!stageRef.current) return {};
                return await exportImage();
            },
            addElement: (params: {
                id: string;
                category: number;
                type: number;
                open?: string;
                width?: number;
                height?: number;
            }) => {
                // return addElement(params)
            },
            removeElement: () => {
                removeSelectElements();
            },
            clearElements: () => {},
            removeElementByUnitId: (unitId: string) => {
                let element: any = elements.find((x: any) => x.unitId && x.unitId == unitId);
                if (!element) return null;
                setElements((pre) => {
                    let newValue = pre.filter((p: any) => p.unitId != unitId);
                    if (element.dividerEles) {
                        element.dividerEles.forEach((divider: any) => {
                            newValue = newValue.filter((p) => p.id != divider.id);
                        });
                    }
                    newValue = newValue.filter((ele) => {
                        if (!(ele instanceof DimensionData)) return true;
                        if (ele.points.find((point: any) => point.unitId == unitId)) {
                            return false;
                        } else return true;
                    });
                    if (value.from == 'quote')
                        onChangeUnit?.(baseUntil.getUnitsData(newValue, zones, value.sizeMultiples));
                    history.clear();
                    clearZones(newValue);
                    // if(value.from == 'quote') debouncedOnChange(newValue, zones)
                    setZones((z) => {
                        debouncedOnChange(newValue as any, z, value.from);
                        return z;
                    });
                    return newValue;
                });
                clearSelection();
            },
            selectElementById: () => {},
            selectElementByUnitId: (id: string) => {
                let element = elements.find((x: any) => x.unitId && x.unitId == id);
                if (!element) return null;
                setSelectedItems([element] as any);
            },
            updateElement: (id: string, params: any) => {
                updateElement(id, params, elements);
            },
            resetUnit: (unit: any, operation: string) => {
                console.log('######## resetUnit unit = ', unit, ' operation = ',operation);
                console.log('######## resetUnit elements = ', elements);
                let element: any = elements.find((x: any) => x.unitId && x.unitId == unit.id);
                if (element) {
                    setElements((pre) => {
                        //gn: 如果是system类型，并且自定义unit后，重新render，需要及时清除之前unit中的divider元素
                        if (operation === 'customUnit'){
                            if (element instanceof GroupFrame){
                                let dividerIds: string[] = element.dividerEles.map(divider => divider.id);
                                pre = pre.filter(p => dividerIds.indexOf(p.id) < 0);
                            }
                        }

                        pre = pre.filter((p) => p.id != element.id);
                        return pre;
                    });
                }
                let data = JSON.parse(unit.canvas_data);
                if (typeof data == 'string') data = JSON.parse(data);
                const coverEles: any[] = data.components.map((com: any) => {
                    return convertElementData(com, false, value.sizeMultiples);
                });
                let finnalData: any = importElements(coverEles, value.lineWidth, true);
                let dividers: any[] = [];
                let groupChild: any[] = [];
                finnalData.forEach((el: any) => {
                    //gn:如果是copyUnit操作，则需要更新元素的id，避免同一个画布中出现相同的id元素，导致操作冲突
                    if (operation == 'copyUnit') {
                        el.id = `${el.id}_${unit.line}`;
                    }

                    if (
                        el instanceof SDLVertical ||
                        el instanceof SDLHorizontal ||
                        el instanceof TDLHorizontal ||
                        el instanceof TDLVertical
                    ){
                        dividers.push(el);
                    }else {
                        groupChild.push(el);
                    }
                });
                data.zones.forEach((zone: IZone, index: number) => {
                    zone.elementId = `${unit.id}_zone_${index}`;
                });
                // element.updateChild()
                let group = new GroupFrame(groupChild, unit.id);

                //gn:目前operation的操作只支持copyUnit，只有当operation为copyUnit时才会执行以下逻辑,即copy unit的时候会带上分割线
                if (operation == 'copyUnit') {
                   group.dividerEles = dividers;
                }

                group.updateBounds();
                data.zones.forEach((zone: IZone, index: number) => {
                    zone.elementId = `${unit.id}_zone_${index}`;
                });
                group.zones = data.zones;
                group.render = true;
                group.unitId = unit?.id || '';
                const { x, y } = handleOverlop(
                    group,
                    {},
                    elements.filter((p) => p.id != element?.id)
                );
                if (x && y) {
                    const dx = x - group?.virtualFrame.x;
                    const dy = y - group?.virtualFrame.y;
                    group.move(dx, dy);
                }
                group.zones = data.zones;
                group.render = true;
                group.unitId = unit?.id || '';
                group.unitIndex = unit.line;
                console.log('######## resetUnit group = ', group);
                setZones((pre) => {
                    if (element) {
                        element.zones?.forEach((z: IZone) => {
                            pre = pre.filter((zone) => zone.elementId != z.elementId);
                        });
                    }

                    setElements((pres) => {
                        return [...pres, group, ...dividers];
                    });
                    return [...pre, ...data.zones];
                });
            },
            updateUnit: async (unitId: string, params: any) => {
                let element = elements.find((x: any) => x.unitId && x.unitId == unitId);

                if (!element) return null;

                let values: any = {};
                if (params.width) {
                    values.width = params.width / value.sizeMultiples;
                }
                if (params.height) {
                    values.height = params.height / value.sizeMultiples;
                }
                if (params.x) {
                    values.x = params.x / value.sizeMultiples;
                }
                if (params.y) {
                    values.y = params.y / value.sizeMultiples;
                }
                // value.width =
                await updateElement(element.id, { virtualFrame: values } as any, elements);
                if (value.from == 'quote') setSettingValue((pre: any) => ({ ...pre, noRenderBase: true }));
            },
            setDragMode: (mode: 'drag' | 'select' | 'dimension' | null) => {
                clearSelection();
                if (mode === 'dimension') {
                    // 当进入标注模式时，收集所有点
                    const points: Array<{
                        id: string;
                        x: number;
                        y: number;
                        type: 'point' | 'content';
                        elementId: string;
                    }> = [];

                    elements.forEach((element: any) => {
                        if (element instanceof GroupFrame) {
                            element.children?.forEach((child: any) => {
                                if (child.type == 'render') return;
                                child.points?.forEach((point: any, index: number) => {
                                    points.push({
                                        id: `${element.id}_${child.id}_point_${index}`,
                                        x: point.x,
                                        y: point.y,
                                        type: 'point',
                                        elementId: element.id + '_' + child.id,
                                    });
                                });
                                if (
                                    child.type == OperationType.DashedLineH ||
                                    child.type == OperationType.DashedLineV
                                ) {
                                    points.push({
                                        id: `${element.id}_${child.id}_point_${0}`,
                                        x: child.virtualFrame.x,
                                        y: child.virtualFrame.y,
                                        type: 'point',
                                        elementId: element.id + '_' + child.id,
                                    });
                                    points.push({
                                        id: `${element.id}_${child.id}_point_${1}`,
                                        x:
                                            child.type == OperationType.DashedLineH
                                                ? child.virtualFrame.width + child.virtualFrame.x
                                                : child.virtualFrame.x,
                                        y:
                                            child.type == OperationType.DashedLineH
                                                ? child.virtualFrame.y
                                                : child.virtualFrame.height + child.virtualFrame.y,
                                        type: 'point',
                                        elementId: element.id + '_' + child.id,
                                    });
                                }
                            });
                            return;
                        }
                        if (element.points) {
                            element.points.forEach((point: any, index: number) => {
                                points.push({
                                    id: `${element.id}_point_${index}`,
                                    x: point.x,
                                    y: point.y,
                                    type: 'point',
                                    elementId: element.id,
                                });
                            });
                        }
                    });

                    setAllPoints(points);
                } else {
                    setAllPoints([]);
                }
                setSettingValue({
                    ...value,
                    dragMode: mode,
                });
            },
            merge: () => {
                mergeElements();
            },
            unmerge: () => {
                unmergeElements();
            },
            clearZones: (newElements?: any[]) => {
                clearZones(newElements);
            },
            setRemoveLineMode: (enabled: boolean) => {
                splitGroup();
                setSettingValue((prev: any) => ({
                    ...prev,
                    dragMode: enabled ? 'removeLine' : 'select',
                }));
                clearZones();
            },
            setPoints: (id: string, points: IPointPostion[]) => {
                setPoints(id, points);
            },
            getLines: () => {
                let lines: any[] = [];
                let arcs: any[] = [];
                calcElementAreas(elements).forEach((line) => {
                    if (line.radius) arcs.push(line);
                    else lines.push(line);
                });
                // setElements((pre) => {
                //     let newValue = pre.filter(el => el.type != 'render')
                //     newValue.forEach(el => {
                //         if(el instanceof GroupFrame) el.children = el.children.filter(ch => ch.type != 'render')
                //     })
                //     return newValue
                // })
                return { lines, arcs };
            },
            updateAreas: (areas) => {
                updateAreas(areas);
                setTimeout(() => {
                    elements.forEach((el) => {
                        if (el instanceof GroupFrame) {
                            el.render = false;
                            el.children = sortElementsBySize(el.children);
                        }
                    });
                    setSettingValue((pre: any) => ({ ...pre, noRenderBase: false }));
                }, 100);
            },
            undo: () => {
                history.undo();
                // setZones([])
                // setSettingValue((pre: any) => ({...pre, noRenderBase: false}))
                // clearSelection()
            },
            redo: () => {
                history.redo();
                // setZones([])
                // setSettingValue((pre: any) => ({...pre, noRenderBase: false}))
                // clearSelection()
            },
            canUndo: () => {
                return history.canUndo;
            },
            canRedo: () => {
                return history.canRedo;
            },
            render: (renderSettings: any) => {
                render(renderSettings, zones);
                setTimeout(() => {
                    elements.forEach((el) => {
                        if (el instanceof GroupFrame) {
                            el.children = sortElementsBySize(el.children);
                        }
                    });
                }, 100);
            },
            selectAll: () => {
                handleSelectAll();
            },
            handleZoom: (type: 'in' | 'out') => {
                handleZoom(type);
            },
            importTemplate: (json: string, refresh: boolean, code: string) => {
                importTemplate(json, refresh as boolean, code);
            },
            importUnits: (units: any[], dimensionData: string) => {
                let newElements: any[] = [];
                let zones: any[] = [];
                let dividers: any[] = [];
                units.forEach((unit) => {
                    let data = JSON.parse(unit.canvas_data);
                    if (typeof data == 'string') data = JSON.parse(data);
                    const coverEles: any[] = data.components.map((com: any) => {
                        return convertElementData(com, false, value.sizeMultiples);
                    });

                    let finnalData: any = importElements(coverEles, value.lineWidth, false);
                    let groupChild: any[] = [];
                    let dividerEles: any[] = [];
                    finnalData.forEach((el: any) => {
                        if (!unit) {
                            groupChild.push(el);
                            return;
                        }
                        if (
                            el instanceof SDLVertical ||
                            el instanceof SDLHorizontal ||
                            el instanceof TDLHorizontal ||
                            el instanceof TDLVertical
                        )
                            dividerEles.push(el);
                        else groupChild.push(el);
                    });

                    let group = new GroupFrame(groupChild, unit.id);
                    group.updateBounds();
                    data.zones.forEach((zone: IZone, index: number) => {
                        zone.elementId = `${unit.id}_zone_${index}`;
                    });
                    group.zones = data.zones;
                    group.dividerEles = dividerEles;
                    group.render = true;
                    group.unitId = unit?.id || '';
                    group.unitIndex = unit?.line;
                    const { x, y } = handleOverlop(group, {}, elements);
                    if (x && y) {
                        const dx = x - group?.virtualFrame.x;
                        const dy = y - group?.virtualFrame.y;
                        group.move(dx, dy);
                    }
                    checkAndExpandCanvas(group);
                    newElements.push(group);
                    zones.push(...data.zones);
                    dividers.push(...dividerEles);
                });

                let dimensionEls: any[] = [];
                if (dimensionData) {
                    let dimensions = JSON.parse(dimensionData);
                    if (typeof dimensions == 'string') dimensions = JSON.parse(dimensions);
                    if (typeof dimensions == 'string') dimensions = JSON.parse(dimensions);
                    dimensions.forEach((dimension: any) => {
                        dimension.points?.forEach((point: any) => {
                            let group = newElements.find((el) => el.unitId == point.unitId);
                            if (!group) return;
                            let idInfos = point.id.split('_');

                            point.id = `${group.id}_${idInfos[idInfos.length - 4]}_${idInfos[idInfos.length - 3]}_${
                                idInfos[idInfos.length - 2]
                            }_${idInfos[idInfos.length - 1]}`;
                            point.elementId =
                                group.id + '_' + idInfos[idInfos.length - 4] + '_' + idInfos[idInfos.length - 3];
                        });
                    });
                    dimensionEls = importElements(dimensions, value.lineWidth, false);
                }
                let offsetX = 0;
                let offsetY = 0;
                let values: any[] = [];
                setElements((pre) => {
                    let news: any[] = [...newElements, ...dividers, ...dimensionEls];
                    values = news;
                    if (from == 'quote') {
                        let { minX, minY } = baseUntil.findMinimumCoordinates(news);
                        offsetX = Math.max(0, minX - 400);
                        offsetY = Math.max(0, minY - 300);
                    }
                    return sortElementsBySize(news);
                });
                zones.forEach((zone, index) => {
                    zone.show_id = index + 1;
                    zone.label = index;
                });
                if (value.from == 'quote') setSettingValue((pre: any) => ({ ...pre, noRenderBase: true }));
                setZones(zones);
                setTimeout(() => {
                    if (from == 'quote')
                        containerRef.current?.scrollBy({
                            left: offsetX,
                            top: offsetY,
                            behavior: 'smooth',
                        });
                    history.clear();

                    debouncedOnChange(values, zones, value.from);
                }, 300);
            },
            updateUnitIndexs: (units: any[]) => {
                setElements((pre) => {
                    units?.forEach((unit) => {
                        if (!unit.id) return;
                        let group: any = pre.find((el: any) => el.unitId == unit.id);
                        if (group) group.unitIndex = unit.line;
                    });
                    return pre;
                });
            },
            exportUnits: () => {
                let res = baseUntil.getUnitsData(elements, zones, value.sizeMultiples);

                //gn: 在getUnitsData之后再次处理返回的数据，确保删除pocketWallOverlap字段
                let cleanedRes = res.map((item: any) => {
                    let canvas_data = JSON.parse(item.canvas_data);
                    canvas_data.components.forEach((el: any) => {
                        if (el.type && (el.type.startsWith('SDL') || el.type.startsWith('TDL'))) {
                            if (el.pocketWallOverlap) {
                                delete el.pocketWallOverlap;
                            }
                        }
                    });

                    canvas_data.zones.forEach((zone: any) => {
                        if (zone.dividers && zone.dividers.length > 0) {
                            zone.dividers.forEach((divider: any) => {
                                if (divider.pocketWallOverlap) {
                                    delete divider.pocketWallOverlap;
                                }
                            });
                        }
                    });
                    return { ...item, canvas_data: JSON.stringify(canvas_data) };
                });
                return cleanedRes;
            },
            exportDimensions: () => {
                let dimensions: any[] = [];
                elements.forEach((el) => {
                    if (el.type == 'Dimension') dimensions.push(el);
                });
                return dimensions;
            },
            renderUnit: async (unitId: string, setMode: any) => {
                if (!elements.length) {
                    notification.warning({
                        message: 'Warning message',
                        description: 'The canvas is currently empty. Please add an item to start.',
                    });
                    return;
                }

                let toSave = true;
                if (
                    elements.find((el) => {
                        if (!(el instanceof BaseFrame)) return false;
                        if (el.type.startsWith('Line')) return false;
                        if (
                            el.lines.every(
                                (line) =>
                                    (line.weight == -1 ||
                                        line.weight == 1 ||
                                        line.weight == 2 ||
                                        line.weight == 3 ||
                                        !line.weight) &&
                                    !line.isCut
                            )
                        )
                            return true;
                    }) &&
                    elements.filter((el) => el instanceof BaseFrame && !el.type.startsWith('Line'))?.length != 1
                ) {
                    toSave = false;
                }

                if (!toSave) {
                    notification.warning({
                        message: 'Warning message',
                        description: 'You can’t save with more than two unconnected windows or doors on the canvas.',
                    });
                    return;
                }

                //gn:检查是否是合并状态，如果是合并状态，则无法render
                if (mergeStatus){
                    notification.warning({
                        message: 'Warning message',
                        description: 'The current layout status is merge, please split first.',
                    });
                    return;
                }

                history.clear();
                const groupFrame = new GroupFrame(elements);
                groupFrame.zones = zones;
                groupFrame.updateBounds();
                groupFrame.unitId = unitId;
                let rest = await calcZonesByGroup(groupFrame, renderConfig);
                if (rest) {
                    notification.warning({
                        message: 'Warning message',
                        description:
                            'The current layout does not form a closed region. Please complete the shape before Render.',
                    });
                    return;
                }
                groupFrame.render = true;
                setElements([groupFrame]);
                setZones((pre) => {
                    debouncedOnChange([groupFrame], pre, 'quote');
                    setMode();
                    setSettingValue((pre: any) => ({ ...pre, noRenderBase: true, from: 'quote' }));
                    onChangeUnit?.(baseUntil.getUnitsData([groupFrame], pre, value.sizeMultiples));
                    return pre;
                });
            },
            sketchUnit: (unitId: string, setMode: any) => {
                if (!elements.length) {
                    notification.warning({
                        message: 'Warning message',
                        description: 'The canvas is currently empty. Please add an item to start.',
                    });
                    return;
                }
                history.clear();
                setSettingValue((pre: any) => ({ ...pre, noRenderBase: false, from: 'designForUnit' }));

                //gn:过滤掉SDL/TDL/Dimension
                const elementFilters = elements.filter(
                    (el) =>
                        !el.type.startsWith('SDL') && 
                        !el.type.startsWith('TDL') && 
                        !el.type.startsWith('Dimension')
                );

                let newElements = [];

                let groupFrame = elementFilters.find((ele: any)=> ele instanceof GroupFrame);
                if (groupFrame){
                    const children = groupFrame.children.filter((child: any) => child.type !== 'render');
                //    const mergedGroup = new GroupFrame(children);
                //    mergedGroup.updateBounds();

                    //gn:使用 sortElementsBySize 确保正确的元素顺序
                    newElements = sortElementsBySize([...children]);
                    //gn:设置合并模式
                    //setMergeStatus(true);
                } else {

                }
                  
                setElements(newElements);
                setZones([]);
                debouncedOnChange(newElements, [], 'designForUnit');
                setMode('sketch');
            },
        }));

        const updateElement = async (id: string, params: BaseFrame, elements: BaseData[]) => {
            const elementIndex = elements.findIndex((item) => item.id === id);
            if (elementIndex === -1) return;
            const element: any = elements[elementIndex];
            element.update({ ...params, ...params.virtualFrame });
            const { x, y } = handleOverlop(element, { initialFrame: element.virtualFrame }, elements);
            if (x && y) {
                const dx = x - element.virtualFrame.x;
                const dy = y - element.virtualFrame.y;
                // element.move(dx, dy);
            }
            if (element instanceof GroupFrame) {
                updateStart(element);
                element.updateGroupChildLines();
                await calcZonesByGroup(element);
            } else setElements((pre) => sortElementsBySize(pre));
            checkAndExpandCanvas(element);
            updateDimensions();
            if (!element.type.startsWith('Line') || !Object.values(DividerType).includes(element.type as DividerType)) {
                if (element.type == 'Group') {
                    element.children?.forEach((child: any) => {
                        updateLine(child, element.children);
                    });
                } else updateLine(element);
            }
            if (!Object.values(DividerType).includes(element.type as DividerType) || !(element instanceof GroupFrame)) {
                clearZones();
            }
            checkOverlappingEdges();
            setTimeout(() => {
                if (value.from == 'quote') onChangeUnit?.(baseUntil.getUnitsData(elements, zones, value.sizeMultiples));
                else debouncedOnChange(elements, zones, value.from);
                setSelectedItems([]);
                if (element.type.startsWith('Line')) moveUntil.handleLineMove(element, elements);
                if (value.from == 'quote') {
                    element.render = true;
                    setSettingValue((pre: any) => ({ ...pre, noRenderBase: true }));
                }
            }, 300);
        };
        const [newRectangle, setNewRectangle] = useState<INewRectangle | null>(null);
        const updateParams = useCallback((elements: BaseData[]) => {
            return elements;
        }, []);

        const stageRef = useRef<any>(null);
        const [dashedLine, setDashedLine] = useState<any>(null);
        const [dashedLineV, setDashedLineV] = useState<any>(null);
        const [dashedCircle, setDashedCircle] = useState<any>(null);
        const [centerSnap, setCenterSnap] = useState<any>(null);
        const { selectedItems, toggleSelection, setSelectedItems, clearSelection } = useSelection();
        const { value, setValue: setSettingValue } = useSetting();
        const [stageDrag, setStageDrag] = useState<StageDrag>({
            isDragging: false,
            lastX: 0,
            lastY: 0,
            stageX: 0,
            stageY: 0,
        });
        //gn:设计模式下是否为合并状态
        const [mergeStatus,setMergeStatus] = useState(false);

        const THRESHOLD = 10 / value.scale;
        const THRESHOLD_ADSORB = 20 / value.scale;
        const CIRCLE_THRESHOLD = (from == 'quote' ? 25 : 15) / value.scale;
        const framePopoverSetters = useRef<Set<(info: any) => void>>(new Set());
        //gn: zone区域elementId递增器，确保同时render多个group时，group中的zone下的elementId唯一性
        let zoneUniqueIdCounter = 0;

        const registerPopoverSetter = (setter: (info: any) => void) => {
            framePopoverSetters.current.add(setter);
            return () => framePopoverSetters.current.delete(setter);
        };
        const clearAllPopovers = () => {
            framePopoverSetters.current.forEach((setter) => setter(null));
        };
        const handleZoom = useCallback((type: 'in' | 'out') => {
            setSettingValue((prevValue: SettingContextProps) => {
                const newScale = type === 'in' ? prevValue.scale * 1.2 : prevValue.scale / 1.2;
                const clampedScale = Math.min(Math.max(newScale, 0.1), 3);
                return {
                    ...prevValue,
                    scale: clampedScale,
                };
            });
        }, []);
        const getRelativePointerPosition = (stage: any) => {
            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const pos = stage.getPointerPosition();
            return transform.point(pos);
        };
        const handleMouseDown = (event: any) => {
            if (value.dragMode === 'drag') {
                setIsDragging(true);
                const stage = event.target.getStage();
                setDragStartPos({
                    x: stage.getPointerPosition().x,
                    y: stage.getPointerPosition().y,
                });
                return;
            }

            setSelectedZones([]);

            if (value.dragMode === 'removeLine') {
                return;
            }

            const stage = event.target.getStage();
            const { x, y } = getRelativePointerPosition(stage);
            setNewRectangle({ x, y, x2: x, y2: y });
            setSelectedShape(event.evt.layerX, event.evt.layerY, elements);
        };

        const handleContextMenu = (e: any) => {
            clearSelection();
        };

        const [selectedZones, setSelectedZones] = useState<IZone[]>([]);

        const handleMouseUp = (e: any) => {
            if (value.dragMode === 'drag') {
                setIsDragging(false);
            }
            if (value.dragMode === 'removeLine') {
                return;
            }

            if (!newRectangle) return;

            const selectionBounds = {
                left: Math.min(newRectangle.x, newRectangle.x2),
                right: Math.max(newRectangle.x, newRectangle.x2),
                top: Math.min(newRectangle.y, newRectangle.y2),
                bottom: Math.max(newRectangle.y, newRectangle.y2),
            };

            const diagonalLength = Math.sqrt(
                Math.pow(newRectangle.x2 - newRectangle.x, 2) + Math.pow(newRectangle.y2 - newRectangle.y, 2)
            );

            if (diagonalLength < 10) {
                setNewRectangle(null);
                return;
            }

            const selectedFrames = elements.filter((frame) => {
                const frameBounds = frame.virtualFrame;
                const corners = [
                    { x: frameBounds.x, y: frameBounds.y },
                    { x: frameBounds.x + frameBounds.width, y: frameBounds.y },
                    { x: frameBounds.x, y: frameBounds.y + frameBounds.height },
                    {
                        x: frameBounds.x + frameBounds.width,
                        y: frameBounds.y + frameBounds.height,
                    },
                ];

                return corners.every(
                    (point) =>
                        point.x >= selectionBounds.left &&
                        point.x <= selectionBounds.right &&
                        point.y >= selectionBounds.top &&
                        point.y <= selectionBounds.bottom
                );
                // return !(
                //     selectionBounds.left > (frameBounds.x + frameBounds.width) &&
                //     selectionBounds.right < frameBounds.x &&
                //     selectionBounds.top > (frameBounds.y + frameBounds.height) &&
                //     selectionBounds.bottom < frameBounds.y
                // );
            });

            const selectedZones = zones.filter((zone) => {
                return zone.points.every((point) => {
                    return (
                        point.x >= selectionBounds.left &&
                        point.x <= selectionBounds.right &&
                        point.y >= selectionBounds.top &&
                        point.y <= selectionBounds.bottom
                    );
                });
            });

            setSelectedZones(selectedZones);
            if (selectedFrames.length > 0) {
                const isShiftKey = e.evt.shiftKey;

                if (!isShiftKey) {
                    setSelectedItems(selectedFrames as any);
                } else {
                    setSelectedItems((prev: BaseData[]) => {
                        const newSelection = [...prev];
                        selectedFrames.forEach((frame) => {
                            if (!newSelection.some((item: any) => item.id === frame.id)) {
                                newSelection.push(frame);
                            }
                        });
                        return newSelection;
                    });
                }

                onSelectChange?.(selectedFrames);
            } else if (!e.evt.shiftKey) {
                clearSelection();
            }

            setNewRectangle(null);
        };

        useEffect(() => {
            debounceUpdateOverlapPoints(elements);
            // if (!isRestoringFromHistory.current) {
            //     if(value.from != 'quote') debouncedOnChange(elements,zones)
            // } else {
            //     isRestoringFromHistory.current = false;
            // }
        }, [elements]);

        const debounceUpdateWallOverlap = useRef(
            debounce((elements: BaseData[]) => {
                //gn: 判断divider与group中pocketwall的重叠区域，如果重叠，则设置divider的pocketWallOverlap属性
                let groups = elements.filter((el) => el instanceof GroupFrame);
                groups.forEach((group) => {
                    if (!group.dividerEles || group.dividerEles.length == 0) return;
                        for (let divider of group.dividerEles) {
                        calcPocketWallOverlap(divider,group);
                    }
                });
            }, 10)
        ).current;

        //gn:计算divider与group中pocketwall的重叠区域
        const calcPocketWallOverlap = (divider:BaseFrame, group:GroupFrame)=>{
            if (!divider || !group) return;
            //gn:清除divider的pocketWallOverlap属性，避免重复计算
            divider?.clearPocketWallOverlap();
                            const poakcetWalloverlaps = baseUntil.detectDividerPocketWallOverlap(divider, group);
                            if (poakcetWalloverlaps.length > 0) {
                                //gn:如果有重叠区域，则设置divider的重叠位置
                divider?.setPocketWallOverlap(poakcetWalloverlaps);
                            }
                        }

        const handleHistoryStateChange = useCallback((newState: CombinedState) => {
            if (!newState) return;
            isRestoringFromHistory.current = true;
            let newData = newState.elements;
            if ((!newData || !newData?.length) && from == 'quote') return;
            let newElements = importData(newData, true);
            newElements.forEach((ele: any) => {
                if (!(ele instanceof GroupFrame)) return;
                if (ele.dividerEles)
                    ele.dividerEles.forEach((divider) => {
                        divider = newElements.find((el: any) => el.id == divider.id);
                    });
                if (!ele.zones || !ele.zones.length) return;
                ele.zones.forEach((zone: any) => {
                    zone = newState.zones.find((z) => z.elementId == zone.elementId);
                });
            });
            setElements([...sortElementsBySize(newElements)]);
            setZones(newState.zones || []);
            isRestoringFromHistory.current = false;
            setTimeout(() => {
                clearSelection();
                if (value.from == 'quote')
                    onChangeUnit?.(baseUntil.getUnitsData(newElements, newState.zones, value.sizeMultiples));
            }, 0);
        }, []);

        const history = useHistory<CombinedState>({ elements: [], zones: [] }, handleHistoryStateChange);

        const debouncedOnChange = useRef(
            debounce((elements: BaseData[], zones: Array<IZone>, fromValue: string) => {
                const updatedElements = updateParams(elements);
                onChange?.(updatedElements, 'change');

                if (fromValue == 'design' && from == 'quote') return;
                if (elements.some((el) => el instanceof GroupFrame) && fromValue == 'designForUnit') {
                    history.clear();
                    return;
                }
                if (fromValue == 'quote' && !zones.length) {
                    return;
                }
                history.push({
                    elements: JSON.parse(JSON.stringify(elements)),
                    zones: JSON.parse(JSON.stringify(zones)),
                });
            }, 500)
        ).current;

        const handleRectChange = (id: string, newAttrs: any) => {
            setElements([...elements]);
        };

        const exportImage = async (): Promise<IImageData> => {
            setIsImageMode(true);
            clearSelection();
            await new Promise((resolve) => setTimeout(resolve, 100));
            let resp = await createImageData(elements, stageRef, value);
            // .filter(el => el.type != "Dimension")
            setIsImageMode(false);

            return resp;
        };

        const exportElementImage = async (elementId: string): Promise<IImageData> => {
            clearSelection();
            setIsImageMode(true);
            await new Promise((resolve) => setTimeout(resolve, 100));
            // return
            let resp = await createImageData([...elements], stageRef, value, elementId);
            setIsImageMode(false);
            return resp;
        };

        const containerRef = useRef<HTMLDivElement>(null);

        const [canvasSize, setCanvasSize] = useState({
            width: 0,
            height: 0,
        });

        const originalSize = useRef({
            width: canvasSize.width,
            height: canvasSize.height,
        });
        const [isDragging, setIsDragging] = useState(false);
        const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
        useEffect(() => {
            if (containerRef.current) {
                setCanvasSize({
                    width: from == 'quote' ? 5000 : containerRef.current.offsetWidth,
                    height: from == 'quote' ? 5000 : containerRef.current.offsetHeight,
                });
                originalSize.current = {
                    width: from == 'quote' ? 5000 : containerRef.current.offsetWidth,
                    height: from == 'quote' ? 5000 : containerRef.current.offsetHeight,
                };
            }
            setSettingValue((pre: any) => ({ ...pre, from }));
        }, []);

        // Listens for changes in the size of the monitoring window
        useEffect(() => {
            const handleResize = () => {
                if (containerRef.current) {
                    setCanvasSize((prev) => ({
                        width: Math.max(prev.width, containerRef.current!.offsetWidth),
                        height: Math.max(prev.height, containerRef.current!.offsetHeight),
                    }));
                    originalSize.current = {
                        width: Math.max(canvasSize.width, containerRef.current!.offsetWidth),
                        height: Math.max(canvasSize.height, containerRef.current!.offsetHeight),
                    };
                }
            };

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        const [globalClickCallback, setGlobalClickCallback] = useState<(() => void) | null>(null);
        const handleStageClick = (e: any) => {
            if (e.target === e.target.getStage()) {
                setSelectedItems([]);
                onSelectChange?.([]);
            } else {
                setSelectedShape(e.evt.layerX, e.evt.layerY, elements);
            }
            if (globalClickCallback) {
                globalClickCallback();
                setGlobalClickCallback(null);
            }
        };

        const setSelectedShape = (layerX: any, layerY: any, shapes: any) => {
            let allLineShapes: any = [];
            let selectedLine: any = {};
            if (shapes && shapes.length != 0) {
                shapes.forEach((item: any) => {
                    if (
                        item.type == ShapeType.LineV ||
                        item.type == ShapeType.LineH ||
                        item.type == OperationType.DashedLineV ||
                        item.type == OperationType.DashedLineH ||
                        item.type.startsWith('SDL') ||
                        item.type.startsWith('TDL')
                    ) {
                        allLineShapes.push(item);
                    }
                });
            }
            if (allLineShapes && allLineShapes.length != 0) {
                allLineShapes.forEach((item: any) => {
                    let flag = pointIsInLineNearby(layerX, layerY, item);
                    if (flag) {
                        selectedLine = item;
                    }
                });
            }
            if (selectedLine && selectedLine.id) {
                clearSelection();
                toggleSelection(selectedLine);
            }
        };

        const pointIsInLineNearby = (px: any, py: any, lineMsg: any) => {
            const left = lineMsg.virtualFrame.x;
            const right = lineMsg.virtualFrame.x + lineMsg.virtualFrame.width;
            const top = lineMsg.virtualFrame.y;
            const bottom = lineMsg.virtualFrame.y + lineMsg.virtualFrame.height;

            let dx = 0;
            let dy = 0;
            if (px < left) {
                dx = left - px;
            } else if (px > right) {
                dx = px - right;
            }
            if (py < top) {
                dy = top - py;
            } else if (py > bottom) {
                dy = py - bottom;
            }

            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 5) {
                return true;
            } else {
                return false;
            }
        };

        const onRegisterGlobalClick = useCallback((callback: () => void) => {
            setGlobalClickCallback(() => callback);
        }, []);

        const clearZones = (newElements?: any[]) => {
            setZones((pre) => {
                let filterZone: any[] = [];
                let eles = newElements || elements;
                eles.forEach((element) => {
                    if (element instanceof GroupFrame && element.zones) {
                        filterZone.push(...element.zones);
                    }
                });
                return filterZone;
            });
            setElements((pre) => pre.filter((item) => item.type != 'render'));
            setSettingValue((pre: any) => ({
                ...pre,
                noRenderBase: value.from == 'quote',
            }));
        };

        const updateStart = (data: any) => {
            if (data instanceof GroupFrame) {
                setSettingValue((pre: any) => ({ ...pre, noRenderBase: false }));

                data.render = false;
                setZones((zones) => {
                    data.zones?.forEach((zone) => {
                        const index = zones.findIndex((z) => z.elementId == zone.elementId);
                        if (index >= 0) {
                            zones.splice(index, 1);
                        }
                    });
                    return zones;
                });
                data.children = data.children.filter((item) => item.type != 'render');
            }
        };

        const handleUpdate = (data: any, params: { x?: number; y?: number; width?: number; height?: number }) => {
            data.update(params);
            if (data instanceof GroupFrame) {
            } else if (data instanceof BaseFrame) {
                clearZones();
            }
            const values = sortElementsBySize(elements);
            setElements(values);
            updateDimensions();
            onSelectChange?.([data]);

            let dashedLine: any = null;
            let dashedCircle: any = null;
            let dashedLineV: any = null;
            let centerSnap: any = null;

            let frame = data;
            const frameCorners = frame.points;

            const checkSnapWithElement = (rect: BaseFrame) => {
                if (rect.id === frame.id) return;

                const isContained =
                    frame.virtualFrame.x >= rect.virtualFrame.x &&
                    frame.virtualFrame.y >= rect.virtualFrame.y &&
                    frame.virtualFrame.x + frame.virtualFrame.width <= rect.virtualFrame.x + rect.virtualFrame.width &&
                    frame.virtualFrame.y + frame.virtualFrame.height <= rect.virtualFrame.y + rect.virtualFrame.height;

                if (isContained) {
                    const frameCenterX = frame.virtualFrame.x + frame.virtualFrame.width / 2;
                    const frameCenterY = frame.virtualFrame.y + frame.virtualFrame.height / 2;

                    const rectCenterX = rect.virtualFrame.x + rect.virtualFrame.width / 2;
                    const rectCenterY = rect.virtualFrame.y + rect.virtualFrame.height / 2;

                    const centerDistance = Math.sqrt(
                        Math.pow(frameCenterX - rectCenterX, 2) + Math.pow(frameCenterY - rectCenterY, 2)
                    );

                    if (centerDistance < THRESHOLD * 2) {
                        centerSnap = {
                            containerId: rect.id,
                            centerX: rectCenterX,
                            centerY: rectCenterY,
                        };

                        // dashedCircle = {
                        //     x: rectCenterX,
                        //     y: rectCenterY,
                        //     radius: CIRCLE_THRESHOLD,
                        //     isCenterSnap: true
                        // };
                    }
                }

                // 顶点吸附检测
                rect.points?.forEach((rectPoint, rectIndex) => {
                    frameCorners?.forEach((framePoint: any, frameIndex: number) => {
                        const distance = Math.sqrt(
                            Math.pow(framePoint.x - rectPoint.x, 2) + Math.pow(framePoint.y - rectPoint.y, 2)
                        );

                        if (distance < CIRCLE_THRESHOLD) {
                            dashedCircle = {
                                x: rectPoint.x,
                                y: rectPoint.y,
                                radius: CIRCLE_THRESHOLD,
                                frameCornerIndex: frameIndex,
                                rectCornerIndex: rectIndex,
                            };
                        }
                    });
                });

                // 线段吸附检测
                let frameLines: any = [];
                frame.lines?.forEach((item: any) => {
                    if (!item.radius) {
                        if (item.startPoint.x == item.endPoint.x || item.startPoint.y == item.endPoint.y) {
                            frameLines.push({
                                x1: item.startPoint.x,
                                y1: item.startPoint.y,
                                x2: item.endPoint.x,
                                y2: item.endPoint.y,
                            });
                        }
                    }
                });
                if (frame instanceof GroupFrame) {
                    frame.points.forEach((point, index) => {
                        const nextPoint = (index + 1) % 4;
                        frameLines.push({
                            x1: point.x,
                            y1: point.y,
                            x2: frame.points[nextPoint].x,
                            y2: frame.points[nextPoint].y,
                        });
                    });
                }

                if (!frameLines) return;
                if (frameLines.length == 0) return;
                if (!rect.getLines) return;
                let rectLines: any = [];
                rect.lines?.forEach((item: any) => {
                    if (!item.radius) {
                        if (item.startPoint.x == item.endPoint.x || item.startPoint.y == item.endPoint.y) {
                            rectLines.push({
                                x1: item.startPoint.x,
                                y1: item.startPoint.y,
                                x2: item.endPoint.x,
                                y2: item.endPoint.y,
                            });
                        }
                    }
                });
                if (rect instanceof GroupFrame) {
                    rect.points.forEach((point, index) => {
                        const nextPoint = (index + 1) % 4;
                        rectLines.push({
                            x1: point.x,
                            y1: point.y,
                            x2: rect.points[nextPoint].x,
                            y2: rect.points[nextPoint].y,
                        });
                    });
                }
                if (rectLines.length == 0) return;

                let rectHLines: any = [];
                let rectVLines: any = [];
                let frameHLines: any = [];
                let frameVLines: any = [];
                frameLines.forEach((item: any) => {
                    let lineType = moveUntil.checkLineType(item.x1, item.y1, item.x2, item.y2);
                    if (lineType == 'h') {
                        frameHLines.push(item);
                    } else if (lineType == 'v') {
                        frameVLines.push(item);
                    }
                });
                rectLines.forEach((item: any) => {
                    let lineType = moveUntil.checkLineType(item.x1, item.y1, item.x2, item.y2);
                    if (lineType == 'h') {
                        rectHLines.push(item);
                    } else if (lineType == 'v') {
                        rectVLines.push(item);
                    }
                });

                let lastNum: any = 10000;
                let overlapLength: any = 0;

                frameHLines?.forEach((frameLine: any) => {
                    rectHLines.forEach((rectLine: any) => {
                        let { vNum, truthNum } = moveUntil.getVerticalDistance(
                            Math.min(frameLine.x1, frameLine.x2),
                            Math.min(frameLine.y1, frameLine.y2),
                            Math.max(frameLine.x1, frameLine.x2),
                            Math.max(frameLine.y1, frameLine.y2),

                            Math.min(rectLine.x1, rectLine.x2),
                            Math.min(rectLine.y1, rectLine.y2),
                            Math.max(rectLine.x1, rectLine.x2),
                            Math.max(rectLine.y1, rectLine.y2)
                        );
                        if (vNum < THRESHOLD) {
                            lastNum = vNum;

                            let overlapObj: any = moveUntil.hasOverlapFunc(
                                Math.min(rectLine.x1, rectLine.x2),
                                rectLine.y1,
                                Math.max(rectLine.x1, rectLine.x2),
                                rectLine.y2,

                                Math.min(frameLine.x1, frameLine.x2),
                                rectLine.y1,
                                Math.max(frameLine.x1, frameLine.x2),
                                rectLine.y2
                            );

                            // if(overlapObj.overlapLength > overlapLength){
                            overlapLength = overlapObj.overlapLength || 0;

                            let isOverlap = overlapObj.flag;
                            if (isOverlap) {
                                dashedLine = {
                                    x1: Math.min(rectLine.x1, rectLine.x2, frameLine.x1, frameLine.x2),
                                    y1: rectLine.y1,
                                    x2: Math.max(rectLine.x1, rectLine.x2, frameLine.x1, frameLine.x2),
                                    y2: rectLine.y2,
                                    isHorizontal: true,
                                };
                            }
                            let distances = moveUntil.getXDistances(
                                Math.min(frameLine.x1, frameLine.x2),
                                Math.min(frameLine.y1, frameLine.y2),
                                Math.max(frameLine.x1, frameLine.x2),
                                Math.max(frameLine.y1, frameLine.y2),

                                Math.min(rectLine.x1, rectLine.x2),
                                Math.min(rectLine.y1, rectLine.y2),
                                Math.max(rectLine.x1, rectLine.x2),
                                Math.max(rectLine.y1, rectLine.y2)
                            );
                            if (
                                distances.startDistance < THRESHOLD &&
                                distances.startDistance <= distances.endDistance
                            ) {
                                dashedLine.type = 'startAdsorb';
                                dashedLine.x1 = Math.min(rectLine.x1, rectLine.x2);
                                dashedLine.x2 = Math.max(rectLine.x1, rectLine.x2);
                                let width: any = rect.virtualFrame.width;

                                // 判断被吸附的图形的这条边有没有包含其他图形的边，如果有,找出所有被包含的线，然后裁掉，返回新的线段
                                let lineMsg: any = hasOtherShapeLine(dashedLine, elements, frame, null, 'H');
                                let minPoint: any = null;

                                //处理被吸附图形的这条边有其他图形的边
                                if (lineMsg && lineMsg.length >= 3) {
                                    lineMsg.forEach((item: any, index: any) => {
                                        if (dashedLine.x1 == item.x) {
                                            if (index + 1 <= lineMsg.length) {
                                                minPoint = {
                                                    x2: lineMsg[index + 1].x,
                                                };

                                                // 处理两个矩形，第一个矩形的右边和第二个矩形的左边是重合的
                                                if (lineMsg[index + 1].x == frameLine.x2) {
                                                    if (index + 2 <= lineMsg.length) {
                                                        minPoint = {
                                                            x2: lineMsg[index + 2]?.x,
                                                        };
                                                    }
                                                }
                                            }
                                        }
                                    });
                                    if (frameLine.x2 == lineMsg[2].x) {
                                        if (Math.abs(lineMsg[1].x - lineMsg[0].x) < THRESHOLD_ADSORB) {
                                            minPoint = {
                                                x1: lineMsg[0].x,
                                                x2: frameLine.x2,
                                            };
                                        }
                                    }
                                }
                                if (minPoint) {
                                    dashedLine.x2 = minPoint.x2;
                                    width = dashedLine.x2 - dashedLine.x1;
                                }

                                if (Math.abs(width - frame.virtualFrame.width) < THRESHOLD_ADSORB) {
                                    dashedLine.width = width;
                                }
                            } else if (
                                distances.endDistance < THRESHOLD &&
                                distances.endDistance < distances.startDistance
                            ) {
                                dashedLine.type = 'endAdsorb';

                                dashedLine.x1 = Math.min(rectLine.x1, rectLine.x2);
                                dashedLine.x2 = Math.max(rectLine.x1, rectLine.x2);
                                let width: any = rect.virtualFrame.width;

                                // 判断被吸附的图形的这条边有没有包含其他图形的边，如果有,找出所有被包含的线，然后裁掉，返回新的线段
                                let lineMsg: any = hasOtherShapeLine(dashedLine, elements, frame, null, 'H');

                                let minPoint: any = null;
                                if (lineMsg && lineMsg.length >= 3) {
                                    minPoint = {
                                        x1: lineMsg[lineMsg.length - 2].x,
                                        x2: lineMsg[lineMsg.length - 1].x,
                                    };

                                    if (lineMsg[lineMsg.length - 2].x == frameLine.x1) {
                                        minPoint = {
                                            x1: lineMsg[lineMsg.length - 3].x,
                                            x2: lineMsg[lineMsg.length - 1].x,
                                        };
                                    }

                                    if (
                                        Math.abs(lineMsg[lineMsg.length - 1].x - lineMsg[lineMsg.length - 2].x) <
                                        THRESHOLD_ADSORB
                                    ) {
                                        minPoint.x2 = lineMsg[lineMsg.length - 1].x;
                                        minPoint.x1 = lineMsg[lineMsg.length - 3].x;

                                        if (lineMsg[lineMsg.length - 1].x > rectLine.x2) {
                                            // minPoint.x2 = rectLine.x2
                                            // minPoint.x1 = lineMsg[lineMsg.length-3].x - (lineMsg[lineMsg.length-1].x - rectLine.x2)
                                        }
                                    }
                                }
                                if (minPoint) {
                                    dashedLine.x1 = Math.min(minPoint.x1, minPoint.x2);
                                    dashedLine.x2 = Math.max(minPoint.x1, minPoint.x2);
                                    width = dashedLine.x2 - dashedLine.x1;
                                }

                                if (Math.abs(width - frame.virtualFrame.width) < THRESHOLD_ADSORB) {
                                    dashedLine.width = width;
                                }
                            }

                            // }
                        }
                    });
                });
                frameVLines?.forEach((frameLine: any) => {
                    rectVLines.forEach((rectLine: any) => {
                        let { hNum, truthNum } = moveUntil.getHorizontalDistance(
                            Math.min(frameLine.x1, frameLine.x2),
                            Math.min(frameLine.y1, frameLine.y2),
                            Math.max(frameLine.x1, frameLine.x2),
                            Math.max(frameLine.y1, frameLine.y2),

                            Math.min(rectLine.x1, rectLine.x2),
                            Math.min(rectLine.y1, rectLine.y2),
                            Math.max(rectLine.x1, rectLine.x2),
                            Math.max(rectLine.y1, rectLine.y2)
                        );

                        if (hNum < THRESHOLD) {
                            lastNum = hNum;

                            let overlapObj: any = moveUntil.hasVerticalOverlap(
                                rectLine.x1,
                                Math.min(rectLine.y1, rectLine.y2),
                                rectLine.x2,
                                Math.max(rectLine.y1, rectLine.y2),
                                rectLine.x1,
                                Math.min(frameLine.y1, frameLine.y2),
                                rectLine.x2,
                                Math.max(frameLine.y1, frameLine.y2)
                            );

                            // if(overlapObj.overlapLength > overlapLength){
                            overlapLength = overlapObj.overlapLength || 0;
                            let isOverlap = overlapObj.flag;
                            if (isOverlap) {
                                dashedLineV = {
                                    x1: frameLine.x1,
                                    y1: Math.min(frameLine.y1, frameLine.y2),
                                    // y1: Math.min(rectLine.y1, rectLine.y2, frameLine.y1, frameLine.y2),
                                    x2: rectLine.x2,
                                    y2: Math.max(frameLine.y1, frameLine.y2), //rectLine.y1, rectLine.y2,
                                    isVertical: true,
                                };
                            }
                            let distances = moveUntil.getVerticalLineXDistances(
                                Math.min(frameLine.x1, frameLine.x2),
                                Math.min(frameLine.y1, frameLine.y2),
                                Math.max(frameLine.x1, frameLine.x2),
                                Math.max(frameLine.y1, frameLine.y2),

                                Math.min(rectLine.x1, rectLine.x2),
                                Math.min(rectLine.y1, rectLine.y2),
                                Math.max(rectLine.x1, rectLine.x2),
                                Math.max(rectLine.y1, rectLine.y2)
                            );
                            if (
                                distances.startDistance < THRESHOLD &&
                                distances.startDistance <= distances.endDistance
                            ) {
                                dashedLineV.type = 'startAdsorb';
                                dashedLineV.y1 = Math.min(frameLine.y1, frameLine.y2);
                                dashedLineV.y2 = Math.max(frameLine.y1, frameLine.y2);
                                let height: any = rect.virtualFrame.height;

                                // 判断被吸附的图形的这条边有没有包含其他图形的边，如果有,找出所有被包含的线，然后裁掉，返回新的线段
                                let lineMsg: any = hasOtherShapeLine(dashedLineV, elements, frame, null, 'V');
                                let minPoint: any = null;
                                if (lineMsg && lineMsg.length >= 3) {
                                    lineMsg.forEach((item: any, index: any) => {
                                        if (dashedLineV.y1 == item.y) {
                                            if (index + 1 <= lineMsg.length) {
                                                minPoint = {
                                                    y2: lineMsg[index + 1].y,
                                                };
                                                if (lineMsg[index + 1].y == frameLine.y2) {
                                                    if (index + 2 <= lineMsg.length) {
                                                        minPoint = {
                                                            y2: lineMsg[index + 2].y,
                                                        };
                                                    }
                                                }
                                            }
                                        }
                                    });

                                    if (frameLine.y2 == lineMsg[2].y) {
                                        if (Math.abs(lineMsg[1].y - lineMsg[0].y) < THRESHOLD_ADSORB) {
                                            minPoint = {
                                                y1: lineMsg[0].y,
                                                y2: frameLine.y2,
                                            };
                                        }
                                    }
                                }
                                if (minPoint) {
                                    // dashedLineV.y1 = Math.min(minPoint.y1,minPoint.y2)
                                    dashedLineV.y2 = minPoint.y2;
                                    height = dashedLineV.y2 - dashedLineV.y1;
                                }

                                if (Math.abs(height - frame.virtualFrame.height) < THRESHOLD_ADSORB) {
                                    dashedLineV.height = height;
                                }
                            } else if (
                                distances.endDistance < THRESHOLD &&
                                distances.endDistance < distances.startDistance
                            ) {
                                dashedLineV.type = 'endAdsorb';
                                dashedLineV.y1 = Math.min(frameLine.y1, frameLine.y2);
                                dashedLineV.y2 = Math.max(frameLine.y1, frameLine.y2);
                                let height: any = rect.virtualFrame.height;

                                // 判断被吸附的图形的这条边有没有包含其他图形的边，如果有,找出所有被包含的线，然后裁掉，返回新的线段
                                let lineMsg: any = hasOtherShapeLine(dashedLineV, elements, frame, null, 'V');
                                let minPoint: any = null;
                                if (lineMsg && lineMsg.length >= 3) {
                                    minPoint = {
                                        y1: lineMsg[lineMsg.length - 2].y,
                                        y2: lineMsg[lineMsg.length - 1].y,
                                    };
                                    if (lineMsg[lineMsg.length - 2].y == dashedLineV.y1) {
                                        minPoint = {
                                            y1: lineMsg[lineMsg.length - 3].y,
                                            y2: lineMsg[lineMsg.length - 1].y,
                                        };
                                    }

                                    if (
                                        Math.abs(lineMsg[lineMsg.length - 1].y - lineMsg[lineMsg.length - 2].y) <
                                        THRESHOLD_ADSORB
                                    ) {
                                        minPoint.y2 = lineMsg[lineMsg.length - 1].y;
                                        minPoint.y1 = lineMsg[lineMsg.length - 3].y;
                                    }
                                }
                                if (minPoint) {
                                    dashedLineV.y1 = Math.min(minPoint.y1, minPoint.y2);
                                    dashedLineV.y2 = Math.max(minPoint.y1, minPoint.y2);
                                    height = dashedLineV.y2 - dashedLineV.y1;
                                }

                                if (Math.abs(height - frame.virtualFrame.height) < THRESHOLD_ADSORB) {
                                    dashedLineV.height = height;
                                }
                            }
                            // }
                        }
                    });
                });
            };

            elements.forEach((element) => {
                if (frame.lineElements?.find((ele: any) => ele.id === element.id)) return;
                checkSnapWithElement(element as BaseFrame);
            });
            setDashedCircle(dashedCircle);
            setDashedLine(dashedLine);
            setDashedLineV(dashedLineV);
            if (value.from != 'quote') debouncedOnChange(values, zones, value.from);
        };

        const updateGroupZones = (updateZones: IZone[]) => {
            if (!updateZones || !updateZones.length) return;
            setZones((pre) => {
                return pre.map((z) => {
                    let updateZ = updateZones.find((zone) => zone.elementId == z.elementId);
                    return updateZ || z;
                });
            });
        };

        const calcZonesByGroup = async (item: GroupFrame, config?: any) => {
            let lines: any[] = [];
            let arcs: any[] = [];
            let tempZones = JSON.parse(JSON.stringify(item.zones));
            calcElementAreas(item.children).forEach((line) => {
                if (line.radius) arcs.push(line);
                else lines.push(line);
            });
            if (value.from == 'quote' || value.from == 'designForUnit') {
                setIsLoading(true);
            }
            let areas: any = await getGroupZones?.({ lines, arcs });
            if (!areas || (!areas.length && value.from == 'designForUnit')) {
                setIsLoading(false);
                return true;
            }
            item.render = true;

            let newZones = areas?.map((area: any, index: number) => {
                const { points, segments } = zoneUntil.processAreaPoints(area.lines, area.arcs);
                let elementId = `zone_${Date.now()}_${index}_${area.label}`;
                if (item?.id){
                    //gn:在system模式下，初始化render多个group时，在某些情况下，不同group下的zone, 由Date.now(),index,area.label组成的elementId可能会存在相同问题，为确保zone的elementId唯一性，需要添加一个唯一的标识符 
                    elementId += zoneUniqueIdCounter++;
                }
                return {
                    ...area,
                    elementId,
                    points,
                    segments,
                };
            });

            // newZones[0].operations = item.children.filter(child => child instanceof BaseOperation)
            item.children = item.children.filter((item) => item.type != 'render');
            item.children.forEach((child) => {
                if (!(child instanceof BaseOperation)) return;
                // let nearZone = updateOperInZone(child, newZones,)
                const nearZone: IZone | any = zoneUntil.findContainingZone(newZones, child);
                let index = newZones.findIndex((z: any) => z.elementId == nearZone.elementId);
                if (!newZones[index].operations) newZones[index].operations = [];
                newZones[index].operations.push(child);
            });
            // let valueZones = [...filterZones, ...newZones]

            // gn：处理groupFrame中的divider元素，使用newZones计算
            const processDividers = (zones: IZone[]) => {
                if (item.dividerEles && item.dividerEles.length > 0) {
                    item.dividerEles.forEach((divider) => {
                        if (divider.type.startsWith('SDL') || divider.type.startsWidth('TDL')) {
                            let nearZone = zoneUntil.findContainingZone(zones, divider);
                            let index = zones.findIndex((z: any) => z.elementId == nearZone?.elementId);
                            if (!zones[index]) return;
                            if (!zones[index]?.dividers) zones[index].dividers = [];
                            zones[index]?.dividers.push(divider);
                        }
                    });
                }
            };

            // gn：使用newZones处理divider,用于render绘制计算
            processDividers(newZones);

            item.zones = newZones;
            render(config, newZones, item);
            setZones((pre) => {
                // let newZs: IZone[] = JSON.parse(JSON.stringify(pre));
                tempZones.forEach((zone: IZone) => {
                    pre = pre.filter((z) => z.elementId != zone.elementId);
                });
                newZones.forEach((nz: any) => {
                    let index = pre.findIndex((z) => z.elementId == nz.elementId);
                    if (index > -1) pre[index] = nz;
                    else pre.push(nz);
                });
                //gn: divider的信息放在render的时候进行处理，这样可以根据borderframe等信息，更新zones

                // elements.forEach(element => {
                //     // if (element instanceof BaseFrame) return;
                //     console.log('############ elements ',element);
                //     if (element.type.startsWith('SDL') || element.type.startsWith('TDL')) {
                //         // newZones = zoneUntil.updateZonesDivider(element, newZones, elements);
                //         let nearZone = zoneUntil.findContainingZone( newZones, element as any,);
                //         console.log('################### newZones 111',newZones);
                //         console.log('################### nearZone 222 ',nearZone);
                //         let index = newZones.findIndex((z:any) => z.elementId == nearZone?.elementId)
                //         if(!newZones[index]) return newZones;
                //         if(!newZones[index]?.dividers) newZones[index].dividers = [];
                //         newZones[index]?.dividers?.push({
                //             id: element.id,
                //             length: element.type.includes('-h') ? element.virtualFrame.width : element.virtualFrame.height,
                //             start_point: {
                //                 x: element.virtualFrame.x,
                //                 y: element.virtualFrame.y
                //             },
                //             end_point: element.type.includes('-h') ? {
                //                 x: element.virtualFrame.x + element.virtualFrame.width,
                //                 y: element.virtualFrame.y
                //             }: {
                //                 x: element.virtualFrame.x,
                //                 y: element.virtualFrame.y + element.virtualFrame.height
                //             },
                //             type: element.type,
                //         })
                //     }
                // })

                item.zones = newZones;
                setTimeout(() => {
                    if (value.from == 'quote') debouncedOnChange(elements, pre, value.from);
                    updateDimensions();
                }, 200);
                return [...pre];
            });
            setTimeout(() => {
                item.children = sortElementsBySize(item.children);
                item.updateBounds();
                item.render = true;
                if (value.from == 'quote' || value.from == 'designForUnit')
                    setSettingValue((pre: any) => ({ ...pre, noRenderBase: true }));
                setIsLoading(false);
            }, 0);
        };

        const onUpdateEnd = (diffInfo: any, item: any) => {
            if (!diffInfo || !item || !item.lines) return;
            checkAndExpandCanvas(item);
            if (item.lineElements) {
                const lines = JSON.parse(JSON.stringify(item.lineElements));
                lines?.forEach((line: any) => {
                    line = elements.find((el) => el.id === line.id);
                    moveUntil.clearFrameRenderInfo(line, elements);
                    if (value.from == 'designForUnit') {
                        moveUntil.handleLineMove(line, elements);
                    }
                });
            }
            if (!Object.values(DividerType).includes(item.type as DividerType) || !(item instanceof GroupFrame)) {
                clearZones();
            }
            let { x, y } = handleOverlop(item, {}, elements);
            if (x && y) {
                const dx = x - item.virtualFrame.x;
                const dy = y - item.virtualFrame.y;
                item.move(dx, dy);
            }

            let frame = item;
            let newX = frame.virtualFrame.x;
            let newY = frame.virtualFrame.y;
            let newWidth = frame.virtualFrame.width;
            let newHeight = frame.virtualFrame.height;

            if (centerSnap) {
                const targetX = centerSnap.centerX - frame.virtualFrame.width / 2;
                const targetY = centerSnap.centerY - frame.virtualFrame.height / 2;
                newX = targetX;
                newY = targetY;
            } else if (dashedCircle) {
                const { x, y, frameCornerIndex } = dashedCircle;
                const currentCorner = frame.points[frameCornerIndex];
                // if(!currentCorner) return;
                if (currentCorner) {
                    const dx = x - currentCorner.x;
                    const dy = y - currentCorner.y;
                    newX = frame.virtualFrame.x + dx;
                    newY = frame.virtualFrame.y + dy;
                }
            }
            if (dashedLine) {
                const frameLines = frame?.getLines();

                if (!frameLines) return;

                if (dashedLine.isHorizontal) {
                    if (frame.type == ShapeType.Rectangle || frame instanceof GroupFrame) {
                        newY = dashedLine.y1;

                        let frameHLines: any = [];
                        frameLines.forEach((item: any) => {
                            let lineType = moveUntil.checkLineType(item.x1, item.y1, item.x2, item.y2);
                            if (lineType == 'h') {
                                frameHLines.push(item);
                            }
                        });

                        let lineObj: any = moveUntil.getLowerHorizontalLine(
                            frameHLines[0].x1,
                            frameHLines[0].y1,
                            frameHLines[0].x2,
                            frameHLines[0].y2,
                            frameHLines[1].x1,
                            frameHLines[1].y1,
                            frameHLines[1].x2,
                            frameHLines[1].y2
                        );
                        if (Math.abs(lineObj.y1 - dashedLine.y1) <= THRESHOLD) {
                            newY = frame.virtualFrame.y - (lineObj.y1 - dashedLine.y1);
                        }

                        if (dashedLine.type == 'startAdsorb') {
                            newX = dashedLine.x1;
                        } else if (dashedLine.type == 'endAdsorb') {
                            newX = dashedLine.x2 - frame.virtualFrame.width;
                            if (dashedLine.width) {
                                newX = dashedLine.x2 - dashedLine.width;
                            }
                        }

                        if (dashedLine.width) {
                            newWidth = dashedLine.width;
                        }
                    } else if (frame.type == ShapeType.ArchH) {
                        let archHLine = frame.lines[0];
                        let flipY = frame.flipY;
                        if (flipY) {
                            newY = dashedLine.y1;
                        } else {
                            newY = frame.virtualFrame.y - (archHLine.startPoint.y - dashedLine.y1);
                        }
                        if (dashedLine.type == 'startAdsorb') {
                            newX = dashedLine.x1;
                        } else if (dashedLine.type == 'endAdsorb') {
                            newX = dashedLine.x2 - frame.virtualFrame.width;
                            if (dashedLine.width) {
                                newX = dashedLine.x2 - dashedLine.width;
                            }
                        }
                        if (dashedLine.width) {
                            newWidth = dashedLine.width;
                        }
                    } else if (frame.type == ShapeType.Triangle) {
                        let points: any = frame.points;
                        let sameY: any = moveUntil.findPointsWithSameY(points);
                        if (sameY && sameY.length != 0) {
                            let flag: any = true;
                            let sameYValue: any = sameY[0][0].y;
                            points.forEach((item: any) => {
                                if (item.y != sameYValue) {
                                    if (item.y > sameYValue) {
                                        flag = false;
                                    }
                                }
                            });
                            if (flag) {
                                let moveY: any = sameYValue - dashedLine.y1;
                                points.forEach((item: any, index: any) => {
                                    let y = Number(item.y - moveY);
                                    let x = Number(item.x);
                                    let moveX = 0;
                                    if (dashedLine.type == 'startAdsorb') {
                                        moveX = sameY[0][0].x - dashedLine.x1;
                                        x = Number(item.x - moveX);
                                        if (dashedLine.width && index == 1) {
                                            x = x - (x - dashedLine.x2);
                                        }
                                    } else if (dashedLine.type == 'endAdsorb') {
                                        moveX = sameY[0][1].x - dashedLine.x2;
                                        x = Number(item.x - moveX);
                                        if (dashedLine.width && index == 0) {
                                            x = x - (x - dashedLine.x1);
                                        }
                                    }

                                    frame?.updateSingleVertex(index, {
                                        x,
                                        y,
                                    });
                                });
                            } else {
                                let moveY: any = sameYValue - dashedLine.y1;
                                points.forEach((item: any, index: any) => {
                                    let y = Number(item.y - moveY);
                                    let x = Number(item.x);
                                    let moveX = 0;
                                    if (dashedLine.type == 'startAdsorb') {
                                        moveX = sameY[0][0].x - dashedLine.x1;
                                        x = Number(item.x - moveX);
                                        if (dashedLine.width && index == 1) {
                                            x = x - (x - dashedLine.x2);
                                        }
                                    } else if (dashedLine.type == 'endAdsorb') {
                                        moveX = sameY[0][1].x - dashedLine.x2;
                                        x = Number(item.x - moveX);
                                        if (dashedLine.width && index == 0) {
                                            x = x - (x - dashedLine.x1);
                                        }
                                    }
                                    frame?.updateSingleVertex(index, {
                                        x,
                                        y,
                                    });
                                });
                            }
                            setDashedCircle(null);
                            setDashedLine(null);
                            setDashedLineV(null);
                            return;
                        }
                    }
                }
                frame.update({
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                });
                // return
            }
            if (dashedLineV) {
                const frameLines = frame?.getLines();

                if (!frameLines) return;
                let dashedLine = dashedLineV;

                if (dashedLine.isVertical) {
                    if (frame.type == ShapeType.Rectangle || frame instanceof GroupFrame) {
                        newX = dashedLine.x1;
                        let frameVLines: any = [];
                        frameLines.forEach((item: any) => {
                            let lineType = moveUntil.checkLineType(item.x1, item.y1, item.x2, item.y2);
                            if (lineType == 'v') {
                                frameVLines.push(item);
                            }
                        });
                        let lineObj: any = moveUntil.getRightVerticalLine(
                            frameVLines[0].x1,
                            frameVLines[0].y1,
                            frameVLines[0].x2,
                            frameVLines[0].y2,
                            frameVLines[1].x1,
                            frameVLines[1].y1,
                            frameVLines[1].x2,
                            frameVLines[1].y2
                        );
                        if (Math.abs(lineObj.x1 - dashedLine.x1) <= THRESHOLD) {
                            newX = frame.virtualFrame.x - (lineObj.x1 - dashedLine.x1);
                        }

                        if (dashedLine.type == 'startAdsorb') {
                            newY = dashedLine.y1;
                        } else if (dashedLine.type == 'endAdsorb') {
                            newY = dashedLine.y2 - frame.virtualFrame.height;
                            if (dashedLine.height) {
                                newY = dashedLine.y2 - dashedLine.height;
                            }
                        }

                        if (dashedLine.height) {
                            newHeight = dashedLine.height;
                        }
                    } else if (frame.type == ShapeType.ArchV) {
                        let archHLine = frame.lines[0];
                        let flipX = frame.flipX;
                        if (!flipX) {
                            newX = dashedLine.x1;
                        } else {
                            newX = frame.virtualFrame.x - (archHLine.startPoint.x - dashedLine.x1);
                        }
                        if (dashedLine.type == 'startAdsorb') {
                            newY = dashedLine.y1;
                        } else if (dashedLine.type == 'endAdsorb') {
                            newY = dashedLine.y2 - frame.virtualFrame.height;
                            if (dashedLine.height) {
                                newY = dashedLine.y2 - dashedLine.height;
                            }
                        }
                        if (dashedLine.height) {
                            newHeight = dashedLine.height;
                        }
                    } else if (frame.type == ShapeType.Triangle) {
                        let points: any = frame.points;
                        let sameX: any = moveUntil.findPointsWithSameX(points);
                        if (sameX && sameX.length != 0) {
                            let flag: any = true;
                            let sameXValue: any = sameX[0][0].x;
                            points.forEach((item: any) => {
                                if (item.x != sameXValue) {
                                    if (item.x > sameXValue) {
                                        flag = false;
                                    }
                                }
                            });
                            if (flag) {
                                let moveX: any = sameXValue - dashedLine.x1;
                                points.forEach((item: any, index: any) => {
                                    let x = Number(item.x - moveX);
                                    let y = Number(item.y);
                                    let moveY = 0;
                                    if (dashedLine.type == 'startAdsorb') {
                                        moveY = sameX[0][1].y - dashedLine.y1;
                                        y = Number(item.y - moveY);
                                        if (dashedLine.height && index == 1) {
                                            y = y - (y - dashedLine.y2);
                                        }
                                    } else if (dashedLine.type == 'endAdsorb') {
                                        moveY = sameX[0][0].y - dashedLine.y2;
                                        y = Number(item.y - moveY);
                                        if (dashedLine.height && index == 2) {
                                            y = y - (y - dashedLine.y1);
                                        }
                                    }
                                    frame?.updateSingleVertex(index, {
                                        x,
                                        y,
                                    });
                                });
                            } else {
                                let moveX: any = sameXValue - dashedLine.x1;
                                points.forEach((item: any, index: any) => {
                                    let x = Number(item.x - moveX);
                                    let y = Number(item.y);
                                    let moveY = 0;
                                    if (dashedLine.type == 'startAdsorb') {
                                        moveY = sameX[0][1].y - dashedLine.y1;
                                        y = Number(item.y - moveY);
                                        if (dashedLine.height && index == 1) {
                                            y = y - (y - dashedLine.y2);
                                        }
                                    } else if (dashedLine.type == 'endAdsorb') {
                                        moveY = sameX[0][0].y - dashedLine.y2;
                                        y = Number(item.y - moveY);
                                        if (dashedLine.height && index == 2) {
                                            y = y - (y - dashedLine.y1);
                                        }
                                    }
                                    frame?.updateSingleVertex(index, {
                                        x,
                                        y,
                                    });
                                });
                            }
                            setDashedCircle(null);
                            setDashedLine(null);
                            setDashedLineV(null);
                            return;
                        }
                    }
                }
                frame.update({
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                });
            }
            if (item instanceof GroupFrame && (dashedLine || dashedLineV)) {
                //  && item.zones.length
                item.updateGroupChildLines();
                if (value.from === 'designForUnit'){
                    //gn: 如果是报价设计模式，缩放完成后不进行面积计算及render，需要使用Render按钮触发面积计算及render
                } else {
                calcZonesByGroup(item);
                }
                setDashedCircle(null);
                setDashedLine(null);
                setDashedLineV(null);
                setCenterSnap(null);
                return;
            }
            if (!dashedLine && !dashedLineV) {
                if (item instanceof GroupFrame) {
                    //  && item.zones.length
                    item.updateGroupChildLines();
                    if (value.from === 'designForUnit'){
                        //gn: 如果是报价设计模式，缩放完成后不进行面积计算及render，需要使用Render按钮触发面积计算及render
                    } else {
                    calcZonesByGroup(item);
                    }
                    setDashedCircle(null);
                    setDashedLine(null);
                    setDashedLineV(null);
                    setCenterSnap(null);
                    return;
                }
            }
            setDashedCircle(null);
            setDashedLine(null);
            setDashedLineV(null);
            setCenterSnap(null);
            setElements((prev) => [...prev]);
            setTimeout(() => {
                if (value.from == 'quote') onChangeUnit?.(baseUntil.getUnitsData(elements, zones, value.sizeMultiples));
                else debouncedOnChange(elements, zones, value.from);
            }, 300);
        };

        const updateLine = (item: any, groups?: any) => {
            const eles = groups || elements;
            let updateLines: any[] = [];
            if (!item.lines) return;
            // 处理每条线段上的交点
            for (const line of item.lines) {
                if (line.isCut || !line.intersectionPoints || line.intersectionPoints.length === 0) continue;
                // 更新每个交点及相关联的元素
                for (const intersection of line.intersectionPoints) {
                    if (!intersection.lineId) continue;
                    // 查找相关的线元素
                    const lineElement = eles.find((el: any) => el.id === intersection.lineId);
                    if (!lineElement) continue;

                    if (!updateLines.find((item) => item.id == lineElement.id))
                        updateLines.push({ id: lineElement.id, intersection, lineElement });
                }
            }
            updateLines.forEach((line: any) => {
                moveUntil.handleLineMove(line.lineElement, eles);
            });
        };

        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const splitGroup = () => {
            elements.forEach((element) => {
                if (element instanceof GroupFrame) {
                    unmergeElements(element);
                }
            });
        };

        const importTemplate = async (dataStr: string, refresh: boolean, code: string, unit?: any) => {
            let data = JSON.parse(dataStr);
            if (typeof data == 'string') data = JSON.parse(data);
            const coverEles: any[] = data.components.map((com: any) => {
                return convertElementData(com, false, value.sizeMultiples);
            });

            let finnalData: any = importElements(coverEles, value.lineWidth);
            let dividers: any[] = [];
            let groupChild: any[] = [];
            finnalData.forEach((el: any) => {
                if (!unit) {
                    groupChild.push(el);
                    return;
                }
                if (
                    el instanceof SDLVertical ||
                    el instanceof SDLHorizontal ||
                    el instanceof TDLHorizontal ||
                    el instanceof TDLVertical
                )
                    dividers.push(el);
                else groupChild.push(el);
            });

            let group = new GroupFrame(groupChild);
            group.updateBounds();
            group.zones = data.zones;
            group.render = true;
            group.code = code;
            group.unitId = unit?.id || '';

            if (refresh) {
                setElements([group, ...dividers]);
            } else {
                const { x, y } = handleOverlop(group, {}, elements);
                if (x && y) {
                    const dx = x - group?.virtualFrame.x;
                    const dy = y - group?.virtualFrame.y;
                    group.move(dx, dy);
                }
                setElements((pre) => [...pre, group, ...dividers]);
            }

            if (refresh) {
                setZones(data.zones);
            } else {
                setZones((pre: IZone[]) => {
                    let newZones = [...pre, ...data.zones];
                    newZones.forEach((zone, index) => {
                        zone.show_id = index + 1;
                        zone.label = index;
                    });
                    return newZones;
                });
            }

            if (!unit) return;

            // let virtualFrame:any = {}
            // if(unit.position_x) {
            //     virtualFrame.x = unit.position_x
            // }
            // if(unit.position_y) {
            //     virtualFrame.y = unit.position_y
            // }
            // if(unit.width_input) {
            //     virtualFrame.width = unit.width_input / value.sizeMultiples
            // }
            // if(unit.height_input) {
            //     virtualFrame.height = unit.height_input / value.sizeMultiples
            // }
            // updateElement(group.id, {virtualFrame } as any, refresh ? [group] : [...elements, group] )
        };

        const handleDrop = async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            let newElements: any[] = elements;
            const type = e.dataTransfer.getData('shape-type');
            if (!type) return;
            if (type == 'template') {
                const infoId = e.dataTransfer.getData('shape-info');
                const refresh = e.dataTransfer.getData('shape-refresh');
                const code = e.dataTransfer.getData('shape-code');
                loading?.();
                const resp = await drawingService.getTemplateDetailById(infoId);
                importTemplate(resp.data_structure, refresh as any, code);
                onDrop?.(infoId);
                return;
            }
            const stage = stageRef.current;
            if (!stage) return;
            const pos = stage.getPointerPosition();
            if (!pos) return;

            const rect: any = containerRef.current?.getBoundingClientRect();
            const scrollTop = containerRef.current?.scrollTop || 0;
            const scrollLeft = containerRef.current?.scrollLeft || 0;
            const offsetX = e.clientX - rect.left + scrollLeft;
            const offsetY = e.clientY - rect.top + scrollTop;
            let newX = offsetX - value.initSize.width / 2;
            let newY = offsetY - value.initSize.height / 2;

            let baseParams = {
                x: newX < 0 ? 0 : newX / value.scale,
                y: newY < 0 ? 0 : newY / value.scale,
                width: value.initSize.width,
                height: value.initSize.height,
            };

            //gn:如果是报价设计模式，检查是否是合并状态，如果是合并状态，则不允许添加新的shape
            if (value.from == 'designForUnit'){
                if (mergeStatus){
                    notification.warning({
                        message: 'Warning message',
                        description: 'The current layout status is merge, please split first.',
                    });
                    return;
                }
            }


            let newElement: any;
            if (type.startsWith('parallel-') || type.startsWith('overlap-')) {
                let nearZone = zoneUntil.findNearZone(zones, { virtualFrame: baseParams } as any);
                console.log(nearZone);

                if (!nearZone) return;
                const sashConfigs: ISashConfig[] = nearZone.sashConfigs || [];
                const parts = type.split('-');
                const sashCount = parseInt(parts[parts.length - 1]);

                for (let i = 0; i < sashCount; i++) {
                    sashConfigs.push({
                        type: type.startsWith('parallel-') ? 'parallel' : (type as any),
                        // (i % 2 === 0 ? 'overlap-left' : 'overlap-right'),
                        ratio: 1,
                    });
                }

                const frameWidth = 10;
                const sashPositions = zoneUntil.calculateSashPositions(nearZone, sashConfigs, frameWidth);

                setZones((pre) => {
                    return pre.map((zone) => {
                        if (zone.show_id === nearZone.show_id) {
                            return {
                                ...zone,
                                sashConfigs,
                                sashPositions,
                            };
                        }
                        return zone;
                    });
                });
                // newElement = JSON.parse(JSON.stringify(newSashes[0]));
                // newSashes.shift()
                // newElements = newSashes;
            }
            // Handle divider shapes
            if (Object.values(DividerType).includes(type as DividerType)) {
                const isH = type.includes('h');
                let params: any = isH
                    ? {
                          x: baseParams.x + baseParams.width / 2 - 50,
                          y: baseParams.y + baseParams.height / 2,
                          width: 100,
                          height: 10,
                      }
                    : {
                          y: baseParams.y + baseParams.height / 2 - 50,
                          x: baseParams.x + baseParams.width / 2,
                          height: 100,
                          width: 10,
                      };
                const lineStart: IPointPostion = {
                    x: params.x,
                    y: params.y,
                };

                const lineEnd: IPointPostion = isH
                    ? { x: params.x + params.width, y: params.y }
                    : { x: params.x, y: params.y + params.height };

                const intersections = zoneUntil.calculateLineElementsIntersections(lineStart, lineEnd, elements as any);
                const formattedIntersections = intersections.map((item) => ({
                    point: item.point,
                    lineId: item.lineId,
                    lineIndex: item.lineIndex,
                }));
                const uniqueIntersections = zoneUntil.deduplicateIntersections(formattedIntersections);
                const segments = zoneUntil.splitLineByIntersections(uniqueIntersections, lineStart, lineEnd);

                let addElements = [];
                if (segments.length > 1 && from != 'quote') {
                    segments.forEach((segment, index: number) => {
                        const resp = zoneUntil.isSegmentInsideElements(segment, elements as any);
                        if (!resp.length) return;
                        if (resp[0].isPartiallyInside) return;
                        if (isH) {
                            segment.startPoint.x = segment.startPoint.x + 2;
                            segment.endPoint.x = segment.endPoint.x - 2;
                        } else {
                            segment.startPoint.y = segment.startPoint.y + 2;
                            segment.endPoint.y = segment.endPoint.y - 2;
                        }
                        let newParams = {
                            x: segment.startPoint.x,
                            y: segment.startPoint.y,
                            height: isH ? params.height : segment.endPoint.y - segment.startPoint.y,
                            width: isH ? segment.endPoint.x - segment.startPoint.x : params.width,
                        };
                        switch (type) {
                            case DividerType.SDL_H:
                                newElement = new SDLHorizontal({
                                    id: `SDL-H_${Date.now()}-${index}`,
                                    ...newParams,
                                });
                                break;
                            case DividerType.SDL_V:
                                newElement = new SDLVertical({
                                    id: `SDL-V_${Date.now()}-${index}`,
                                    ...newParams,
                                });
                                break;
                            case DividerType.TDL_H:
                                newElement = new TDLHorizontal({
                                    id: `TDL-H_${Date.now()}-${index}`,
                                    ...baseParams,
                                    ...newParams,
                                });
                                break;
                            case DividerType.TDL_V:
                                newElement = new TDLVertical({
                                    id: `TDL-V_${Date.now()}-${index}`,
                                    ...baseParams,
                                    ...newParams,
                                });
                                break;
                        }
                        if (elements.some((ele) => ele.type == 'render')) {
                            // zoneUntil.updateDivider(newElement, zones)
                            moveUntil.handleDividerMoveRender(newElement, elements);
                        } else {
                            moveUntil.handleDividerMove(newElement, elements);
                        }
                        addElements.push(newElement);

                        setZones((pre) => {
                            let nearZone = zoneUntil.findContainingZone(pre, newElement as any);
                            let index = pre.findIndex((z) => z.elementId == nearZone?.elementId);
                            if (!pre[index]?.dividers) return pre;
                            pre[index]?.dividers?.push({
                                id: newElement.id,
                                length: type.includes('-h')
                                    ? newElement.virtualFrame.width
                                    : newElement.virtualFrame.height,
                                start_point: {
                                    x: newElement.virtualFrame.x,
                                    y: newElement.virtualFrame.y,
                                },
                                end_point: type.includes('-h')
                                    ? {
                                          x: newElement.virtualFrame.x + newElement.virtualFrame.width,
                                          y: newElement.virtualFrame.y,
                                      }
                                    : {
                                          x: newElement.virtualFrame.x,
                                          y: newElement.virtualFrame.y + newElement.virtualFrame.height,
                                      },
                                type: type,
                            });
                            return pre;
                        });
                    });
                } else {
                    switch (type) {
                        case DividerType.SDL_H:
                            newElement = new SDLHorizontal({
                                id: `SDL-H_${Date.now()}`,
                                ...params,
                            });
                            break;
                        case DividerType.SDL_V:
                            newElement = new SDLVertical({
                                id: `SDL-V_${Date.now()}`,
                                ...params,
                            });
                            break;
                        case DividerType.TDL_H:
                            newElement = new TDLHorizontal({
                                id: `TDL-H_${Date.now()}`,
                                ...params,
                            });
                            break;
                        case DividerType.TDL_V:
                            newElement = new TDLVertical({
                                id: `TDL-V_${Date.now()}`,
                                ...params,
                            });
                            break;
                    }
                    let groups = elements.filter((el) => el instanceof GroupFrame);
                    // let group = moveUntil.findContainingFrame(newElement, groups)
                    let group: any = moveUntil.isElementPartiallyInFrames(newElement, groups, 'any')[0];
                    if (!group && from == 'quote') {
                        notification.warning({
                            message: 'Warning message',
                            description:
                                'You can only place dividers in the window section. Please try again inside the glass area.',
                        });
                        return;
                    }

                    if (group) {
                        if (
                            (group.dividerEles &&
                                type.startsWith('sdl') &&
                                group.dividerEles.some((d: any) => d.type.startsWith('TDL'))) ||
                            (group.dividerEles &&
                                type.startsWith('tdl') &&
                                group.dividerEles.some((d: any) => d.type.startsWith('SDL')))
                        ) {
                            notification.warning({
                                message: 'Warning message',
                                description:
                                    'This window already has a divider type applied. You cannot apply both SDL and TDL to the same window or door.',
                            });
                            return;
                        }
                        group.dividerEles?.push(newElement);
                        moveUntil.handleDividerMoveRender(newElement, group.children);

                        // gn:在divider从左侧拖拽到右侧画布放置后，计算并存储divider的比例关系
                        if (group.updateDividerRelation) {
                            group.updateDividerRelation(newElement);
                        }

                        //gn：检测divider与group中pocketwall的重叠区域
                        calcPocketWallOverlap(newElement,group);

                    } else if (elements.some((ele) => ele.type == 'render')) {
                        // zoneUntil.updateDivider(newElement, zones)
                        moveUntil.handleDividerMoveRender(newElement, elements);
                    } else {
                        moveUntil.handleDividerMove(newElement, elements);
                    }
                    setZones((pre) => {
                        let nearZone = zoneUntil.findContainingZone(pre, newElement as any);
                        let index = pre.findIndex((z) => z.elementId == nearZone?.elementId);
                        if (!pre[index]) return pre;
                        if (!pre[index]?.dividers) pre[index].dividers = [];
                        pre[index]?.dividers?.push({
                            id: newElement.id,
                            length: type.includes('-h')
                                ? newElement.virtualFrame.width
                                : newElement.virtualFrame.height,
                            start_point: {
                                x: newElement.virtualFrame.x,
                                y: newElement.virtualFrame.y,
                            },
                            end_point: type.includes('-h')
                                ? {
                                      x: newElement.virtualFrame.x + newElement.virtualFrame.width,
                                      y: newElement.virtualFrame.y,
                                  }
                                : {
                                      x: newElement.virtualFrame.x,
                                      y: newElement.virtualFrame.y + newElement.virtualFrame.height,
                                  },
                            type: type,
                        });
                        return pre;
                    });
                    addElements.push(newElement);
                }

                const values = sortElementsBySize([...elements, ...addElements]);
                setElements(values);
                if (value.from == 'quote') {
                    debouncedOnChange(values, zones, value.from);
                }
                setTimeout(()=>{
                    //gn: 如果是从quote页面新添加的divider，则需要更新unit数据，防止copyUnit操作时，无法获取最新的divder数据
                    if (value.from == 'quote') onChangeUnit?.(baseUntil.getUnitsData(values, zones, value.sizeMultiples));
                },1000)
                return;
            }
            // Handle operation shapes
            else if (Object.values(OperationType).includes(type as OperationType)) {
                if (type.startsWith('angle-')) {
                    const direction = type.replace('angle-', '') as 'left' | 'right' | 'up' | 'down';
                    newElement = new AngleData({
                        id: `angle_${Date.now()}`,
                        direction,
                        type,
                        virtualFrame: {
                            ...baseParams,
                            width: 100,
                            height: 100,
                            x: baseParams.x + baseParams.width / 2 - 100 / 2,
                            y: baseParams.y + baseParams.height / 2 - 100 / 2,
                        },
                    });
                    if (zones && zones.length) {
                        const nearestZone = zoneUntil.findNearZone(zones, { virtualFrame: baseParams } as any);

                        const nearZone = updateOperInZone(newElement, zones);

                        const zone = zones.find((z) => z.show_id == nearZone?.show_id);
                        if (zone) {
                            if (!zone?.operations) zone.operations = [];
                            zone?.operations?.push(newElement);
                        }
                        setZones((pre) => [...pre]);
                    } else {
                        const wrapperEle = moveUntil.findContainingFrame(newElement, elements as any);
                        if (wrapperEle instanceof Frame) newElement.update(wrapperEle?.virtualFrame);
                    }
                } else {
                    const nearestZone: any = zoneUntil.findNearZone(zones, { virtualFrame: baseParams } as any);
                    let minPoint = nearestZone ? zoneUntil.findTopLeftPoint(nearestZone) : null;
                    if (nearestZone?.segments.length <= 3) {
                        minPoint = { x: nearestZone?.centroid[0] - 50, y: nearestZone?.centroid[1] - 35 };
                    }
                    switch (type) {
                        case OperationType.ARROW_LEFT:
                        case OperationType.ARROW_RIGHT:
                        case OperationType.ARROW_LR:
                        case OperationType.ARROW_UP:
                        case OperationType.ARROW_DOWN:
                        case OperationType.ARROW_TD:
                            newElement = new ArrowData({
                                id: `arrow_${Date.now()}`,
                                type,
                                virtualFrame: {
                                    x: nearestZone?.centroid[0]
                                        ? nearestZone?.centroid[0] - 50
                                        : baseParams.x + baseParams.height / 2 - 50,
                                    y: nearestZone?.centroid[1]
                                        ? nearestZone?.centroid[1] - 20
                                        : baseParams.y + baseParams.height / 2 - 20,
                                    width: 70,
                                    height: 30,
                                },
                            });
                            break;
                        case OperationType.HARDWARE_HL:
                            newElement = new Hardware({
                                id: `hardware_l_${Date.now()}`,
                                type,
                                virtualFrame: {
                                    x: minPoint?.x ? minPoint?.x - 5 : baseParams.x + baseParams.height / 2 - 45 / 2,
                                    y: nearestZone?.centroid[1]
                                        ? nearestZone?.centroid[1] - 25 / 2
                                        : baseParams.y + baseParams.height / 2 - 30 / 2,
                                    width: 40,
                                    height: 25,
                                },
                            });
                            // if(nearestZone && !nearestZone?.operations) nearestZone.operations = []
                            // nearestZone?.operations?.push(newElement)
                            break;
                        case OperationType.HARDWARE_HR:
                            const maxPoint = nearestZone ? zoneUntil.findTopRightPoint(nearestZone) : null;
                            newElement = new Hardware({
                                id: `hardware_r_${Date.now()}`,
                                type,
                                virtualFrame: {
                                    x: maxPoint?.x ? maxPoint?.x - 35 : baseParams.x + baseParams.height / 2 - 45 / 2,
                                    y: nearestZone?.centroid[1]
                                        ? nearestZone?.centroid[1] - 25 / 2
                                        : baseParams.y + baseParams.height / 2 - 30 / 2,
                                    width: 40,
                                    height: 25,
                                },
                            });
                            // if(nearestZone && !nearestZone?.operations) nearestZone.operations = []
                            // nearestZone?.operations?.push(newElement)
                            break;
                        case OperationType.HARDWARE_V:
                            newElement = new Hardware({
                                id: `hardware_${Date.now()}`,
                                type,
                                virtualFrame: {
                                    x: baseParams.x + baseParams.height / 2 - 39 / 2,
                                    y: baseParams.y + baseParams.height / 2 - 35 / 2,
                                    width: 20,
                                    height: 40,
                                },
                            });

                            let positionX = null;
                            let positionY = null;
                            if (nearestZone) {
                                let { offsetSegment, originalSegment }: any = zoneUntil.findNearestSegmentAndOffset(
                                    nearestZone,
                                    newElement.virtualFrame as any,
                                    5
                                );
                                if (offsetSegment && offsetSegment.start.x === offsetSegment.end.x) {
                                    positionX = offsetSegment.start.x;
                                    positionY = (offsetSegment.start.y + offsetSegment.end.y) / 2 - 20;
                                    if (nearestZone.centroid[0] < offsetSegment.start.x) positionX -= 15;
                                }
                                if (offsetSegment && offsetSegment.start.y === offsetSegment.end.y) {
                                    positionY = offsetSegment.start.y;
                                    positionX = (offsetSegment.start.x + offsetSegment.end.x) / 2 - 10;
                                    if (nearestZone.centroid[1] < offsetSegment.start.y) positionY -= 40;
                                }
                                const dx = positionX - newElement.virtualFrame.x;
                                const dy = positionY - newElement.virtualFrame.y;

                                newElement.move(dx, dy);
                            }

                            break;
                        case OperationType.DashedLineH:
                            newElement = new Dashed({
                                id: `dashed_${Date.now()}`,
                                type: OperationType.DashedLineH,
                                direction: 'h',
                                virtualFrame: {
                                    x: baseParams.x + baseParams.height / 2 - 100 / 2,
                                    y: baseParams.y + baseParams.height / 2 - 20 / 2,
                                    width: 100,
                                    height: 20,
                                },
                            });
                            let wrapper1 = findNearElement(newElement);
                            wrapper1 &&
                                newElement.update({
                                    x: wrapper1.virtualFrame.x,
                                    width: wrapper1.virtualFrame.width,
                                });
                            break;
                        case OperationType.DashedLineV:
                            newElement = new Dashed({
                                id: `dashed_${Date.now()}`,
                                type: OperationType.DashedLineV,
                                direction: 'v',
                                virtualFrame: {
                                    x: baseParams.x + baseParams.width / 2 - 20 / 2,
                                    y: baseParams.y + baseParams.height / 2 - 100 / 2,
                                    width: 20,
                                    height: 100,
                                },
                            });
                            let wrapper2 = findNearElement(newElement);
                            wrapper2 &&
                                newElement.update({
                                    y: wrapper2.virtualFrame.y,
                                    height: wrapper2.virtualFrame.width,
                                });
                            break;
                        case OperationType.MOTORIZED:
                            newElement = new Motorized({
                                id: `motorized_${Date.now()}`,
                                type: OperationType.MOTORIZED,
                                virtualFrame: {
                                    x: minPoint?.x ? minPoint?.x + 20 : baseParams.x + baseParams.width / 2 - 41 / 2,
                                    y: minPoint?.y ? minPoint?.y + 20 : baseParams.y + baseParams.height / 2 - 33 / 2,
                                    width: 50,
                                    height: 40,
                                },
                            });
                            break;
                        case OperationType.POCKET_WALL:
                            newElement = new PocketWall({
                                id: `pocketwall_${Date.now()}`,
                                type: OperationType.POCKET_WALL,
                                virtualFrame: baseParams,
                            });
                            break;
                        case OperationType.MOTO_LEFT:
                        case OperationType.MOTO_DOWN:
                        case OperationType.MOTO_UP:
                        case OperationType.MOTO_RIGHT:
                        case OperationType.MOTO_LR:
                        case OperationType.MOTO_TD:
                            newElement = new MotoSideData({
                                id: `motoTwoSide_${Date.now()}`,
                                type: type,
                                virtualFrame: {
                                    x: nearestZone?.centroid[0]
                                        ? nearestZone?.centroid[0] - 50
                                        : baseParams.x + baseParams.height / 2 - 50,
                                    y: nearestZone?.centroid[1]
                                        ? nearestZone?.centroid[1] - 20
                                        : baseParams.y + baseParams.height / 2 - 20,
                                    width: 70,
                                    height: 30,
                                },
                            });
                            break;
                        case OperationType.FOLDING:
                            newElement = new Folding({
                                id: `folding_${Date.now()}`,
                                type: OperationType.FOLDING,
                                virtualFrame: {
                                    x: minPoint?.x ? minPoint?.x + 20 : baseParams.x + baseParams.width / 2 - 41 / 2,
                                    y: minPoint?.y ? minPoint?.y + 20 : baseParams.y + baseParams.height / 2 - 33 / 2,
                                    width: 50,
                                    height: 40,
                                },
                            });
                            break;
                        case OperationType.Folding_LEFT:
                        case OperationType.Folding_DOWN:
                        case OperationType.Folding_UP:
                        case OperationType.Folding_RIGHT:
                        case OperationType.Folding_LR:
                        case OperationType.Folding_TD:
                            newElement = new FlodingSideData({
                                id: `folding_${Date.now()}`,
                                type: type,
                                virtualFrame: {
                                    x: nearestZone?.centroid[0]
                                        ? nearestZone?.centroid[0] - 50
                                        : baseParams.x + baseParams.height / 2 - 50,
                                    y: nearestZone?.centroid[1]
                                        ? nearestZone?.centroid[1] - 20
                                        : baseParams.y + baseParams.height / 2 - 20,
                                    width: 70,
                                    height: 30,
                                },
                            });

                            break;
                        case OperationType.PIVOT_V:
                            newElement = new PivotV({
                                id: `pivotV_${Date.now()}`,
                                type: OperationType.PIVOT_V,
                                virtualFrame: {
                                    x: minPoint?.x ? minPoint?.x + 20 : baseParams.x + baseParams.width / 2 - 41 / 2,
                                    y: minPoint?.y ? minPoint?.y + 20 : baseParams.y + baseParams.height / 2 - 33 / 2,
                                    width: 50,
                                    height: 40,
                                },
                            });

                            // let wrapperEle: IZone | null = zoneUntil.findNearZone(zones, newElement)
                            if (nearestZone) {
                                let points = zoneUntil.findZonePoints(
                                    nearestZone,
                                    { x: nearestZone.centroid[0], y: nearestZone.centroid[1] },
                                    false
                                );
                                if (!points.maxPoint || !points.minPoint) return;
                                let newLine = new Dashed({
                                    id: `dashed_${Date.now()}`,
                                    type: OperationType.DashedLineV,
                                    direction: 'v',
                                    virtualFrame: {
                                        x: points.minPoint.x,
                                        y: points.minPoint.y,
                                        width: 5,
                                        height: points.maxPoint.y - points.minPoint.y || 100,
                                    },
                                });
                                newElements.push(newLine);
                                if (nearestZone && !nearestZone?.operations) nearestZone.operations = [];
                                nearestZone?.operations?.push(newLine);
                            }
                            break;
                        case OperationType.PIVOT_H:
                            newElement = new PivotH({
                                id: `pivotH_${Date.now()}`,
                                type: OperationType.PIVOT_H,
                                virtualFrame: {
                                    x: minPoint?.x ? minPoint?.x + 20 : baseParams.x + baseParams.width / 2 - 41 / 2,
                                    y: minPoint?.y ? minPoint?.y + 20 : baseParams.y + baseParams.height / 2 - 33 / 2,
                                    width: 50,
                                    height: 40,
                                },
                            });
                            // let wrapperElem: IZone | null = zoneUntil.findNearZone(zones, newElement)
                            if (nearestZone) {
                                let points = zoneUntil.findZonePoints(
                                    nearestZone,
                                    { x: nearestZone.centroid[0], y: nearestZone.centroid[1] },
                                    true
                                );
                                if (!points.maxPoint || !points.minPoint) return;
                                let newLine = new Dashed({
                                    id: `dashed_${Date.now()}`,
                                    type: OperationType.DashedLineH,
                                    direction: 'h',
                                    virtualFrame: {
                                        x: points.minPoint.x,
                                        y: points.minPoint.y,
                                        width: points.maxPoint.x - points.minPoint.x || 100,
                                        height: 5,
                                    },
                                });
                                newElements.push(newLine);
                                if (nearestZone && !nearestZone?.operations) nearestZone.operations = [];
                                nearestZone?.operations?.push(newLine);
                            }
                            break;
                        case OperationType.RAIL_2:
                            newElement = new Rail2({
                                id: `rail2_${Date.now()}`,
                                type: OperationType.RAIL_2,
                                virtualFrame: {
                                    x: minPoint?.x ? minPoint?.x + 20 : baseParams.x + baseParams.width / 2 - 90 / 2,
                                    y: minPoint?.y ? minPoint?.y + 20 : baseParams.y + baseParams.height / 2 - 36 / 2,
                                    width: 50,
                                    height: 26,
                                },
                            });
                            break;
                        case OperationType.RAIL_4:
                            newElement = new Rail4({
                                id: `rail4_${Date.now()}`,
                                type: OperationType.RAIL_4,
                                virtualFrame: {
                                    x: minPoint?.x ? minPoint?.x + 20 : baseParams.x + baseParams.width / 2 - 90 / 2,
                                    y: minPoint?.y ? minPoint?.y + 20 : baseParams.y + baseParams.height / 2 - 36 / 2,
                                    width: 50,
                                    height: 25,
                                },
                            });
                            break;
                        case OperationType.ACTIVE:
                            newElement = new Active({
                                id: `active_${Date.now()}`,
                                type: OperationType.ACTIVE,
                                virtualFrame: {
                                    x: minPoint?.x ? minPoint?.x + 20 : baseParams.x + baseParams.width / 2 - 90 / 2,
                                    y: minPoint?.y ? minPoint?.y + 20 : baseParams.y + baseParams.height / 2 - 36 / 2,
                                    width: 70,
                                    height: 25,
                                },
                            });
                            break;
                        case OperationType.INSWING:
                            newElement = new Inswing({
                                id: `inswing_${Date.now()}`,
                                type: OperationType.INSWING,
                                virtualFrame: {
                                    x: minPoint?.x ? minPoint?.x + 20 : baseParams.x + baseParams.width / 2 - 90 / 2,
                                    y: minPoint?.y ? minPoint?.y + 20 : baseParams.y + baseParams.height / 2 - 36 / 2,
                                    width: 70,
                                    height: 27,
                                },
                            });
                            break;
                        case OperationType.OUTSWING:
                            newElement = new Outswing({
                                id: `outswing_${Date.now()}`,
                                type: OperationType.OUTSWING,
                                virtualFrame: {
                                    x: minPoint?.x ? minPoint?.x + 20 : baseParams.x + baseParams.width / 2 - 90 / 2,
                                    y: minPoint?.y ? minPoint?.y + 20 : baseParams.y + baseParams.height / 2 - 36 / 2,
                                    width: 70,
                                    height: 27,
                                },
                            });
                            break;
                        case OperationType.PASSIVE:
                            newElement = new Passive({
                                id: `passive_${Date.now()}`,
                                type: OperationType.PASSIVE,
                                virtualFrame: {
                                    x: minPoint?.x ? minPoint?.x + 20 : baseParams.x + baseParams.width / 2 - 70 / 2,
                                    y: minPoint?.y ? minPoint?.y + 20 : baseParams.y + baseParams.height / 2 - 27 / 2,
                                    width: 70,
                                    height: 27,
                                },
                            });
                            break;
                        case OperationType.Fixed_W:
                            newElement = new FixedData({
                                id: `fixed_${Date.now()}`,
                                type: OperationType.Fixed_W,
                                virtualFrame: {
                                    x: nearestZone
                                        ? nearestZone.centroid[0] - 25
                                        : baseParams.x + baseParams.width / 2 - 50 / 2,
                                    y: nearestZone
                                        ? nearestZone.centroid[1] - 25
                                        : baseParams.y + baseParams.height / 2 - 50 / 2,
                                    width: 50,
                                    height: 50,
                                },
                            });
                            break;
                        case OperationType.Fixed_D:
                            newElement = new FixedData({
                                id: `fixed_${Date.now()}`,
                                type: OperationType.Fixed_D,
                                virtualFrame: {
                                    x: nearestZone
                                        ? nearestZone.centroid[0] - 25
                                        : baseParams.x + baseParams.width / 2 - 50 / 2,
                                    y: nearestZone
                                        ? nearestZone.centroid[1] - 25
                                        : baseParams.y + baseParams.height / 2 - 50 / 2,
                                    width: 50,
                                    height: 50,
                                },
                            });
                            break;
                        // case OperationType.Glasses:
                        //     newElement = new Glasses({
                        //         id: `glasses_${Date.now()}`,
                        //         type: OperationType.PASSIVE,
                        //         virtualFrame: baseParams,
                        //     })
                        //     zoneUntil.updateGlasses(newElement, zones, 1)
                        //     break;
                        default:
                            break;
                    }
                    if (nearestZone && !nearestZone?.operations) nearestZone.operations = [];
                    if (newElement) nearestZone?.operations?.push(newElement);

                    setZones((pre) => [...pre]);
                }
            } else {
                // Handle existing frame shapes
                switch (type) {
                    case ShapeType.Rectangle:
                        newElement = new Frame(value.lineWidth, {
                            id: `Rectangle_${Date.now()}`,
                            virtualFrame: baseParams,
                        });
                        break;
                    case ShapeType.Triangle:
                        newElement = new TriangleWindow(value.lineWidth, {
                            id: `Triangle_${Date.now()}`,
                            virtualFrame: {
                                ...baseParams,
                                height: value.initSize.height / 2,
                            },
                        });
                        break;
                    case ShapeType.ArchH:
                        newElement = new TopSemiCircleWindow(value.lineWidth, {
                            id: `Arch-H_${Date.now()}`,
                            virtualFrame: {
                                ...baseParams,
                                height: value.initSize.height / 2,
                            },
                        });
                        break;
                    case ShapeType.ArchV:
                        newElement = new RightSemiCircleWindow(value.lineWidth, {
                            id: `Arch-V_${Date.now()}`,
                            virtualFrame: {
                                ...baseParams,
                                width: value.initSize.width / 2,
                            },
                        });
                        break;
                    case ShapeType.LineH:
                        baseParams.x = offsetX < 0 ? 0 : offsetX / value.scale;
                        baseParams.y = offsetY < 0 ? 0 : offsetY / value.scale;
                        newElement = new HorizontalLineWindow(5, {
                            id: `Line-H_${Date.now()}`,
                            virtualFrame: {
                                ...baseParams,
                                x: baseParams.x - baseParams.width / 4,
                                height: value.lineWidth,
                                width: baseParams.width / 2,
                            },
                        });
                        const { targetFrames } = moveUntil.handleLineMove(newElement, elements);
                        const res = zoneUntil.splitDividersByLine(newElement.lines[0], elements);
                        newElements = elements.filter(
                            (element) => !res.originalDividers.find((divider) => divider.id == element.id)
                        );
                        newElements.push(...res.newDividers);

                        // if(targetFrames && targetFrames[0]) {
                        //     const ele = targetFrames[0]
                        //     const newDimension = new DimensionData({
                        //         id: `dimension_${Date.now()}`,
                        //         points: [
                        //             {
                        //                 id: `${ele.id}_point_${0}`,
                        //                 x: ele.points[0].x,
                        //                 y: ele.points[0].y,
                        //                 type: 'point',
                        //                 elementId: ele.id
                        //             },
                        //             {
                        //                 id: `${newElement.id}_point_${0}`,
                        //                 x: newElement.points[0].x,
                        //                 y: newElement.points[0].y,
                        //                 type: 'point',
                        //                 elementId: newElement.id
                        //             }
                        //         ],
                        //     }, false);
                        //     newElements.push(newDimension)
                        // }
                        break;
                    case ShapeType.LineV:
                        baseParams.x = offsetX < 0 ? 0 : offsetX / value.scale;
                        baseParams.y = offsetY < 0 ? 0 : offsetY / value.scale;
                        newElement = new VerticalLineWindow(5, {
                            id: `Line-v_${Date.now()}`,
                            virtualFrame: {
                                ...baseParams,
                                y: baseParams.y - baseParams.height / 4,
                                width: value.lineWidth,
                                height: baseParams.height / 2,
                            },
                        });
                        const { targetFrames: targets } = moveUntil.handleLineMove(newElement, elements);
                        const resp = zoneUntil.splitDividersByLine(newElement.lines[0], elements);
                        newElements = elements.filter(
                            (element) => !resp.originalDividers.find((divider) => divider.id == element.id)
                        );
                        newElements.push(...resp.newDividers);

                        // if(targets && targets[0]) {
                        //     const ele = targets[0]
                        //     const newDimension = new DimensionData({
                        //         id: `dimension_${Date.now()}`,
                        //         points: [
                        //             {
                        //                 id: `${ele.id}_point_${0}`,
                        //                 x: ele.points[0].x,
                        //                 y: ele.points[0].y,
                        //                 type: 'point',
                        //                 elementId: ele.id
                        //             },
                        //             {
                        //                 id: `${newElement.id}_point_${0}`,
                        //                 x: newElement.points[0].x,
                        //                 y: newElement.points[0].y,
                        //                 type: 'point',
                        //                 elementId: newElement.id
                        //             }
                        //         ],
                        //     }, false);
                        //     newElements.push(newDimension)
                        // }
                        break;
                }
                setSettingValue((pre: any) => ({
                    ...pre,
                    noRenderBase: value.from == 'quote',
                }));
            }
            if (newElement) {
                const { x, y } = handleOverlop(newElement, {}, elements);
                if (x && y) {
                    const dx = x - newElement?.virtualFrame.x;
                    const dy = y - newElement?.virtualFrame.y;
                    newElement.move(dx, dy);
                }
                if (newElement instanceof BaseFrame) {
                    newElements = newElements.filter((item) => item.type != 'render');
                }
                const values = sortElementsBySize([...newElements, newElement]);
                setElements(values);

                // sliptGroup()
                checkAndExpandCanvas(newElement);
                checkOverlappingEdges();

                if (value.from != 'quote') values as any, zones;
            }
        };

        const handleDragStart = (event: any) => {
            if (value.dragMode !== 'drag') return;

            const stage = event.target.getStage();
            const pos = getRelativePointerPosition(stage);
            const { x, y } = pos;
            setStageDrag({
                isDragging: true,
                stageX: value.stagePos.x,
                stageY: value.stagePos.y,
                lastX: x,
                lastY: y,
            });
        };

        const handleDragMove = (e: any) => {
            if (!stageDrag.isDragging || value.dragMode !== 'drag') return;

            const stage = e.target.getStage();
            const pos = getRelativePointerPosition(stage);
            const dx = pos.x - stageDrag.lastX;
            const dy = pos.y - stageDrag.lastY;

            setSettingValue((prev: any) => ({
                ...prev,
                stagePos: {
                    x: (stageDrag.stageX || 0) + dx,
                    y: (stageDrag.stageY || 0) + dy,
                },
            }));
        };

        const handleDragEnd = (e: any) => {
            if (stageDrag.isDragging) {
                setStageDrag((prev) => ({
                    ...prev,
                    isDragging: false,
                    lastX: 0,
                    lastY: 0,
                    stageX: e.currentTarget._lastPos?.x || 0,
                    stageY: e.currentTarget._lastPos?.y || 0,
                }));
                setSettingValue((prev: any) => ({
                    ...prev,
                    stagePos: {
                        x: e.currentTarget._lastPos?.x || 0,
                        y: e.currentTarget._lastPos?.y || 0,
                    },
                }));
                return;
            }
        };

        const mergeElements = () => {
            if (selectedItems.length < 2) {
                message.warning('please select at least two elements to merge');
                return;
            }

            const groupFrame = new GroupFrame(selectedItems);
            groupFrame.zones = selectedZones;
            groupFrame.updateBounds();

            const mergedIds = new Set(selectedItems.map((item) => item.id));
            const newElements = elements.filter((element) => !mergedIds.has(element.id));

            newElements.push(groupFrame);
            const value = sortElementsBySize(newElements);
            setElements(value);
            clearSelection();

            //gn:设置合并模式
            setMergeStatus(true);
        };

        const unmergeElements = (group?: GroupFrame) => {
            if (!group && selectedItems.length !== 1) {
                message.warning('Please select a combined element to split');
                return;
            }

            const selectedItem = group || selectedItems[0];

            if (!(selectedItem instanceof GroupFrame)) {
                message.warning('The selected element is not a composite element');
                return;
            }

            let childrenElements = selectedItem.children;
            const newElements = elements.filter((element) => element.id !== selectedItem.id);
            //gn:过滤掉render元素
            childrenElements = childrenElements.filter((element) => element.type !== 'render' )
            newElements.push(...childrenElements);
            const value = sortElementsBySize(newElements);
            setElements(value);
            clearSelection();

            //gn:设置合并模式
            setMergeStatus(false);
        };

        const removeSelectElements = () => {
            if (selectedItems.length === 0) {
                message.warning('Please select the element you want to delete first');
                return;
            }

            const selectedIds = new Set(selectedItems.map((item) => item.id));
            let hasBaseFrame = false;
            const removeFromGroup = (element: any, elements: any[]): boolean => {
                if (element instanceof GroupFrame) {
                    const newChildren = element.children.filter((child) => !selectedIds.has(child.id));
                    if (newChildren.length !== element.children.length) {
                        if (newChildren.length === 0) {
                            return true;
                        }
                        element.children = newChildren;
                        element.updateBounds();
                        return false;
                    }
                }
                if (selectedIds.has(element.id) && element.type.startsWith('Line')) {
                    moveUntil.clearFrameRenderInfo(element, elements);
                }
                if (selectedIds.has(element.id) && element instanceof BaseFrame) hasBaseFrame = true;
                return selectedIds.has(element.id);
            };
            setElements((pre) => {
                let newElements = pre.filter((element) => !removeFromGroup(element, pre));
                if (hasBaseFrame) {
                    newElements = newElements.filter((item) => item.type != 'render');
                    clearZones(newElements);
                }
                newElements.forEach((ele) => {
                    if (ele instanceof GroupFrame) {
                        ele.dividerEles = ele.dividerEles.filter((d) => !selectedIds.has(d.id));
                    }
                });
                newElements = newElements.filter((ele) => {
                    if (!(ele instanceof DimensionData)) return true;
                    // point.elementId.startsWith(selectedIds.)
                    if (
                        ele.points.find((point) => Array.from(selectedIds).some((id) => point.elementId.startsWith(id)))
                    ) {
                        return false;
                    } else return true;
                });
                if (value.from == 'quote')
                    onChangeUnit?.(baseUntil.getUnitsData(newElements, zones, value.sizeMultiples));
                if (value.from == 'quote') {
                    history.clear();
                    setZones((z) => {
                        debouncedOnChange(newElements, z, value.from);
                        return z;
                    });
                }
                return newElements;
            });
            clearSelection();
        };

        const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });

        useEffect(() => {
            const container = containerRef.current;
            if (!container) return;

            const handleScroll = () => {
                setViewportOffset({
                    x: container.scrollLeft,
                    y: container.scrollTop,
                });
            };

            container.addEventListener('scroll', handleScroll);

            return () => {
                container.removeEventListener('scroll', handleScroll);
            };
        }, []);

        const checkAndUpdateCanvasSize = (
            x: number,
            y: number,
            width: number,
            height: number,
            dragDelta?: {
                x: number;
                y: number;
            }
        ) => {
            if (!containerRef.current) return;

            const container = containerRef.current;
            const padding = 50;
            const extendSize = 30;

            let needsUpdate = false;
            let newWidth = canvasSize.width;
            let newHeight = canvasSize.height;

            const viewportInfo = {
                left: container.scrollLeft,
                top: container.scrollTop,
                right: container.scrollLeft + container.clientWidth / value.scale,
                bottom: container.scrollTop + container.clientHeight / value.scale,
                width: container.clientWidth / value.scale,
                height: container.clientHeight / value.scale,
            };

            const isNearViewportEdge = {
                right: x + width > viewportInfo.right - padding,
                bottom: y + height > viewportInfo.bottom - padding,
                left: x < viewportInfo.left + padding,
                top: y < viewportInfo.top + padding,
            };

            if (isNearViewportEdge.right) {
                container.scrollBy({
                    left: 30,
                    behavior: 'smooth',
                });
            }

            if (isNearViewportEdge.bottom) {
                container.scrollBy({
                    top: padding,
                    behavior: 'smooth',
                });
            }

            if (isNearViewportEdge.left && dragDelta && dragDelta.x < 0 && x > 0) {
                container.scrollBy({
                    left: -padding,
                    behavior: 'smooth',
                });
            }

            if (isNearViewportEdge.top && dragDelta && dragDelta.y < 0 && y > 0) {
                container.scrollBy({
                    top: -padding,
                    behavior: 'smooth',
                });
            }

            const scrollInfo = {
                atRight: Math.abs(container.scrollLeft + container.clientWidth - canvasSize.width) < 1,
                atBottom: Math.abs(container.scrollTop + container.clientHeight - canvasSize.height) < 1,
                atLeft: container.scrollLeft === 0,
                atTop: container.scrollTop === 0,
            };

            if (isNearViewportEdge.right && scrollInfo.atRight) {
                newWidth = Math.max(canvasSize.width + extendSize, x + width + padding);
                needsUpdate = true;
            }

            if (isNearViewportEdge.bottom && scrollInfo.atBottom) {
                newHeight = Math.max(canvasSize.height + extendSize, y + height + padding);
                needsUpdate = true;
            }

            if (needsUpdate) {
                setCanvasSize({
                    width: Math.max(newWidth, originalSize.current.width),
                    height: Math.max(newHeight, originalSize.current.height),
                });
            }
        };

        const updateDimensions = () => {
            const dimensionElements: any[] = elements.filter((el) => el.type === 'Dimension');
            if (dimensionElements.length === 0) return;
            let hasChanges = false;

            const allPointsMappings = new Map();

            elements.forEach((element: any) => {
                if (element.type === 'dimension') return;

                element.children?.forEach((child: any) => {
                    if (child.type == 'render') return;
                    child.points?.forEach((point: any, index: number) => {
                        const pointId = `${element.id}_${child.id}_point_${index}`;
                        allPointsMappings.set(pointId, {
                            pointId,
                            elementId: element.id + '_' + child.id,
                            x: point.x,
                            y: point.y,
                            type: 'point',
                            index,
                        });
                    });
                });

                if (element.points) {
                    element.points.forEach((point: any, index: number) => {
                        const pointId = `${element.id}_point_${index}`;
                        allPointsMappings.set(pointId, {
                            pointId,
                            elementId: element.id,
                            x: point.x,
                            y: point.y,
                            type: 'point',
                            index,
                        });
                    });
                }
            });
            for (const dimension of dimensionElements) {
                if (!dimension.points || dimension.points.length === 0) continue;

                let dimensionChanged = false;

                dimension.points.forEach((point: any, index: number) => {
                    if (!point.elementId || !point.id) return;

                    const pointParts = point.id.split('_');
                    if (pointParts.length < 3) return;

                    const pointType = pointParts[pointParts.length - 2];
                    const pointIndex = pointParts[pointParts.length - 1];

                    const pointId = `${point.elementId}_${pointType}_${pointIndex}`;
                    const updatedPointInfo = allPointsMappings.get(pointId);
                    if (updatedPointInfo) {
                        if (updatedPointInfo.x !== point.x || updatedPointInfo.y !== point.y) {
                            dimension.points[index] = {
                                ...point,
                                x: updatedPointInfo.x,
                                y: updatedPointInfo.y,
                            };
                            dimensionChanged = true;
                        }
                    }
                });

                if (dimensionChanged) {
                    dimension.determineDirection();
                    dimension.calculateDimensions();
                    hasChanges = true;
                }
            }

            setElements((prev) => [...prev]);

            // if (hasChanges) {
            // }
        };

        const onMoveFrame = ({ dx, dy }: { dx: number; dy: number }, frame: BaseFrame | any) => {
            frame.lineElements?.forEach((line: any) => {
                if (!line.move) line = elements.find((el) => el.id === line.id);
                line?.move(dx, dy);
            });

            if (frame instanceof GroupFrame) {
                if (frame.dividerEles)
                    frame.dividerEles?.forEach((divider) => {
                        //gn:清空divider与wall的重叠区域
                        divider?.clearPocketWallOverlap();

                        if (divider.move) return;
                        divider = elements.find((el) => el.id == divider.id);
                    });

                updateGroupZones(frame.zones);
            } else if (frame instanceof BaseFrame) {
                clearZones();
            }
            checkAndUpdateCanvasSize(
                frame.virtualFrame.x,
                frame.virtualFrame.y,
                frame.virtualFrame.width,
                frame.virtualFrame.height,
                { x: dx, y: dy }
            );
            updateDimensions();
            // onSelectChange?.([frame]);

            let dashedLine: any = null;
            let dashedCircle: any = null;
            let centerSnap: any = null;
            let dashedLineV: any = null;

            const frameCorners = frame.points;

            const checkSnapWithElement = (rect: BaseFrame) => {
                if (rect.id === frame.id) return;

                const isContained =
                    frame.virtualFrame.x >= rect.virtualFrame.x &&
                    frame.virtualFrame.y >= rect.virtualFrame.y &&
                    frame.virtualFrame.x + frame.virtualFrame.width <= rect.virtualFrame.x + rect.virtualFrame.width &&
                    frame.virtualFrame.y + frame.virtualFrame.height <= rect.virtualFrame.y + rect.virtualFrame.height;

                if (isContained) {
                    const frameCenterX = frame.virtualFrame.x + frame.virtualFrame.width / 2;
                    const frameCenterY = frame.virtualFrame.y + frame.virtualFrame.height / 2;

                    const rectCenterX = rect.virtualFrame.x + rect.virtualFrame.width / 2;
                    const rectCenterY = rect.virtualFrame.y + rect.virtualFrame.height / 2;

                    const centerDistance = Math.sqrt(
                        Math.pow(frameCenterX - rectCenterX, 2) + Math.pow(frameCenterY - rectCenterY, 2)
                    );

                    if (centerDistance < THRESHOLD * 2) {
                        centerSnap = {
                            containerId: rect.id,
                            centerX: rectCenterX,
                            centerY: rectCenterY,
                        };

                        // dashedCircle = {
                        //     x: rectCenterX,
                        //     y: rectCenterY,
                        //     radius: CIRCLE_THRESHOLD,
                        //     isCenterSnap: true
                        // };
                    }
                }

                // 顶点吸附检测
                rect.points?.forEach((rectPoint, rectIndex) => {
                    frameCorners?.forEach((framePoint: any, frameIndex: number) => {
                        const distance = Math.sqrt(
                            Math.pow(framePoint.x - rectPoint.x, 2) + Math.pow(framePoint.y - rectPoint.y, 2)
                        );

                        if (distance < CIRCLE_THRESHOLD) {
                            dashedCircle = {
                                x: rectPoint.x,
                                y: rectPoint.y,
                                radius: CIRCLE_THRESHOLD,
                                frameCornerIndex: frameIndex,
                                rectCornerIndex: rectIndex,
                            };
                        }
                    });
                });

                // 线段吸附检测
                // const frameLines = frame?.getLines ?  frame?.getLines() : '';
                let frameLines: any = [];
                frame.lines?.forEach((item: any) => {
                    if (!item.radius) {
                        if (item.startPoint.x == item.endPoint.x || item.startPoint.y == item.endPoint.y) {
                            frameLines.push({
                                x1: item.startPoint.x,
                                y1: item.startPoint.y,
                                x2: item.endPoint.x,
                                y2: item.endPoint.y,
                            });
                        }
                    }
                });
                if (frame instanceof GroupFrame) {
                    frame.points.forEach((point, index) => {
                        const nextPoint = (index + 1) % 4;
                        frameLines.push({
                            x1: point.x,
                            y1: point.y,
                            x2: frame.points[nextPoint].x,
                            y2: frame.points[nextPoint].y,
                        });
                    });
                }

                if (!frameLines) return;
                if (frameLines.length == 0) return;
                if (!rect.getLines) return;
                let rectLines: any = [];
                rect.lines?.forEach((item: any) => {
                    if (!item.radius) {
                        if (item.startPoint.x == item.endPoint.x || item.startPoint.y == item.endPoint.y) {
                            rectLines.push({
                                x1: item.startPoint.x,
                                y1: item.startPoint.y,
                                x2: item.endPoint.x,
                                y2: item.endPoint.y,
                            });
                        }
                    }
                });
                if (rect instanceof GroupFrame) {
                    rect.points.forEach((point, index) => {
                        const nextPoint = (index + 1) % 4;
                        rectLines.push({
                            x1: point.x,
                            y1: point.y,
                            x2: rect.points[nextPoint].x,
                            y2: rect.points[nextPoint].y,
                        });
                    });
                }
                if (rectLines.length == 0) return;

                let rectHLines: any = [];
                let rectVLines: any = [];
                let frameHLines: any = [];
                let frameVLines: any = [];
                frameLines.forEach((item: any) => {
                    let lineType = moveUntil.checkLineType(item.x1, item.y1, item.x2, item.y2);
                    if (lineType == 'h') {
                        frameHLines.push(item);
                    } else if (lineType == 'v') {
                        frameVLines.push(item);
                    }
                });
                rectLines.forEach((item: any) => {
                    let lineType = moveUntil.checkLineType(item.x1, item.y1, item.x2, item.y2);
                    if (lineType == 'h') {
                        rectHLines.push(item);
                    } else if (lineType == 'v') {
                        rectVLines.push(item);
                    }
                });

                let lastNum: any = 10000;
                let overlapLength: any = 0;
                frameHLines?.forEach((frameLine: any) => {
                    rectHLines.forEach((rectLine: any) => {
                        let { vNum, truthNum } = moveUntil.getVerticalDistance(
                            Math.min(frameLine.x1, frameLine.x2),
                            Math.min(frameLine.y1, frameLine.y2),
                            Math.max(frameLine.x1, frameLine.x2),
                            Math.max(frameLine.y1, frameLine.y2),

                            Math.min(rectLine.x1, rectLine.x2),
                            Math.min(rectLine.y1, rectLine.y2),
                            Math.max(rectLine.x1, rectLine.x2),
                            Math.max(rectLine.y1, rectLine.y2)
                        );
                        if (vNum < THRESHOLD) {
                            lastNum = vNum;

                            let overlapObj: any = moveUntil.hasOverlapFunc(
                                Math.min(rectLine.x1, rectLine.x2),
                                rectLine.y1,
                                Math.max(rectLine.x1, rectLine.x2),
                                rectLine.y2,

                                Math.min(frameLine.x1, frameLine.x2),
                                rectLine.y1,
                                Math.max(frameLine.x1, frameLine.x2),
                                rectLine.y2
                            );

                            // if(overlapObj.overlapLength > overlapLength){
                            overlapLength = overlapObj.overlapLength || 0;

                            let isOverlap = overlapObj.flag;
                            if (isOverlap) {
                                dashedLine = {
                                    x1: Math.min(rectLine.x1, rectLine.x2, frameLine.x1, frameLine.x2),
                                    y1: rectLine.y1,
                                    x2: Math.max(rectLine.x1, rectLine.x2, frameLine.x1, frameLine.x2),
                                    y2: rectLine.y2,
                                    isHorizontal: true,
                                };
                            }
                            let distances = moveUntil.getXDistances(
                                Math.min(frameLine.x1, frameLine.x2),
                                Math.min(frameLine.y1, frameLine.y2),
                                Math.max(frameLine.x1, frameLine.x2),
                                Math.max(frameLine.y1, frameLine.y2),

                                Math.min(rectLine.x1, rectLine.x2),
                                Math.min(rectLine.y1, rectLine.y2),
                                Math.max(rectLine.x1, rectLine.x2),
                                Math.max(rectLine.y1, rectLine.y2)
                            );
                            if (
                                distances.startDistance < THRESHOLD &&
                                distances.startDistance <= distances.endDistance
                            ) {
                                dashedLine.type = 'startAdsorb';
                                dashedLine.x1 = Math.min(rectLine.x1, rectLine.x2);
                                dashedLine.x2 = Math.max(rectLine.x1, rectLine.x2);
                                let width: any = rect.virtualFrame.width;

                                // 判断被吸附的图形的这条边有没有包含其他图形的边，如果有,找出所有被包含的线，然后裁掉，返回新的线段
                                let lineMsg: any = hasOtherShapeLine(dashedLine, elements, frame, null, 'H');
                                let minPoint: any = null;
                                if (lineMsg && lineMsg.length >= 3) {
                                    lineMsg.forEach((item: any, index: any) => {
                                        if (dashedLine.x1 == item.x) {
                                            if (index + 1 <= lineMsg.length) {
                                                minPoint = {
                                                    x2: lineMsg[index + 1].x,
                                                };
                                                if (lineMsg[index + 1].x == frameLine.x2) {
                                                    if (index + 2 <= lineMsg.length) {
                                                        minPoint = {
                                                            x2: lineMsg[index + 2]?.x,
                                                        };
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }
                                if (minPoint) {
                                    dashedLine.x2 = minPoint.x2;
                                    width = dashedLine.x2 - dashedLine.x1;
                                }

                                if (Math.abs(width - frame.virtualFrame.width) < THRESHOLD_ADSORB) {
                                    dashedLine.width = width;
                                }
                            } else if (
                                distances.endDistance < THRESHOLD &&
                                distances.endDistance < distances.startDistance
                            ) {
                                dashedLine.type = 'endAdsorb';

                                dashedLine.x1 = Math.min(rectLine.x1, rectLine.x2);
                                dashedLine.x2 = Math.max(rectLine.x1, rectLine.x2);
                                let width: any = rect.virtualFrame.width;

                                // 判断被吸附的图形的这条边有没有包含其他图形的边，如果有,找出所有被包含的线，然后裁掉，返回新的线段
                                let lineMsg: any = hasOtherShapeLine(dashedLine, elements, frame, null, 'H');
                                let minPoint: any = null;
                                if (lineMsg && lineMsg.length >= 3) {
                                    minPoint = {
                                        x1: lineMsg[lineMsg.length - 2].x,
                                        x2: lineMsg[lineMsg.length - 1].x,
                                    };

                                    if (lineMsg[lineMsg.length - 2].x == frameLine.x1) {
                                        minPoint = {
                                            x1: lineMsg[lineMsg.length - 3].x,
                                            x2: lineMsg[lineMsg.length - 1].x,
                                        };
                                    }
                                }
                                if (minPoint) {
                                    dashedLine.x1 = Math.min(minPoint.x1, minPoint.x2);
                                    dashedLine.x2 = Math.max(minPoint.x1, minPoint.x2);
                                    width = dashedLine.x2 - dashedLine.x1;
                                }

                                if (Math.abs(width - frame.virtualFrame.width) < THRESHOLD_ADSORB) {
                                    dashedLine.width = width;
                                }
                            }

                            // }
                        }
                    });
                });
                frameVLines?.forEach((frameLine: any) => {
                    rectVLines.forEach((rectLine: any) => {
                        let { hNum, truthNum } = moveUntil.getHorizontalDistance(
                            Math.min(frameLine.x1, frameLine.x2),
                            Math.min(frameLine.y1, frameLine.y2),
                            Math.max(frameLine.x1, frameLine.x2),
                            Math.max(frameLine.y1, frameLine.y2),

                            Math.min(rectLine.x1, rectLine.x2),
                            Math.min(rectLine.y1, rectLine.y2),
                            Math.max(rectLine.x1, rectLine.x2),
                            Math.max(rectLine.y1, rectLine.y2)
                        );

                        if (hNum < THRESHOLD) {
                            lastNum = hNum;

                            let overlapObj: any = moveUntil.hasVerticalOverlap(
                                rectLine.x1,
                                Math.min(rectLine.y1, rectLine.y2),
                                rectLine.x2,
                                Math.max(rectLine.y1, rectLine.y2),
                                rectLine.x1,
                                Math.min(frameLine.y1, frameLine.y2),
                                rectLine.x2,
                                Math.max(frameLine.y1, frameLine.y2)
                            );

                            // if(overlapObj.overlapLength > overlapLength){
                            overlapLength = overlapObj.overlapLength || 0;
                            let isOverlap = overlapObj.flag;
                            if (isOverlap) {
                                dashedLineV = {
                                    x1: rectLine.x1,
                                    y1: Math.min(rectLine.y1, rectLine.y2, frameLine.y1, frameLine.y2),
                                    x2: rectLine.x2,
                                    y2: Math.max(rectLine.y1, rectLine.y2, frameLine.y1, frameLine.y2),
                                    isVertical: true,
                                };
                            }
                            let distances = moveUntil.getVerticalLineXDistances(
                                Math.min(frameLine.x1, frameLine.x2),
                                Math.min(frameLine.y1, frameLine.y2),
                                Math.max(frameLine.x1, frameLine.x2),
                                Math.max(frameLine.y1, frameLine.y2),

                                Math.min(rectLine.x1, rectLine.x2),
                                Math.min(rectLine.y1, rectLine.y2),
                                Math.max(rectLine.x1, rectLine.x2),
                                Math.max(rectLine.y1, rectLine.y2)
                            );
                            if (
                                distances.startDistance < THRESHOLD &&
                                distances.startDistance <= distances.endDistance
                            ) {
                                dashedLineV.type = 'startAdsorb';
                                dashedLineV.y1 = Math.min(rectLine.y1, rectLine.y2);
                                dashedLineV.y2 = Math.max(rectLine.y1, rectLine.y2);
                                let height: any = rect.virtualFrame.height;

                                // 判断被吸附的图形的这条边有没有包含其他图形的边，如果有,找出所有被包含的线，然后裁掉，返回新的线段
                                let lineMsg: any = hasOtherShapeLine(dashedLineV, elements, frame, null, 'V');
                                let minPoint: any = null;
                                if (lineMsg && lineMsg.length >= 3) {
                                    lineMsg.forEach((item: any, index: any) => {
                                        if (dashedLineV.y1 == item.y) {
                                            if (index + 1 <= lineMsg.length) {
                                                minPoint = {
                                                    y2: lineMsg[index + 1].y,
                                                };
                                                if (lineMsg[index + 1].y == frameLine.y2) {
                                                    if (index + 2 <= lineMsg.length) {
                                                        minPoint = {
                                                            y2: lineMsg[index + 2]?.y,
                                                        };
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }
                                if (minPoint) {
                                    // dashedLineV.y1 = Math.min(minPoint.y1,minPoint.y2)
                                    dashedLineV.y2 = minPoint.y2;
                                    height = dashedLineV.y2 - dashedLineV.y1;
                                }

                                if (Math.abs(height - frame.virtualFrame.height) < THRESHOLD_ADSORB) {
                                    dashedLineV.height = height;
                                }
                            } else if (
                                distances.endDistance < THRESHOLD &&
                                distances.endDistance < distances.startDistance
                            ) {
                                dashedLineV.type = 'endAdsorb';
                                dashedLineV.y1 = Math.min(rectLine.y1, rectLine.y2);
                                dashedLineV.y2 = Math.max(rectLine.y1, rectLine.y2);
                                let height: any = rect.virtualFrame.height;

                                let lineMsg: any = hasOtherShapeLine(dashedLineV, elements, frame, null, 'V');
                                let minPoint: any = null;
                                if (lineMsg && lineMsg.length >= 3) {
                                    minPoint = {
                                        y1: lineMsg[lineMsg.length - 2].y,
                                        y2: lineMsg[lineMsg.length - 1].y,
                                    };
                                    if (lineMsg[lineMsg.length - 2].y == frameLine.y1) {
                                        minPoint = {
                                            y1: lineMsg[lineMsg.length - 3].y,
                                            y2: lineMsg[lineMsg.length - 1].y,
                                        };
                                    }
                                }
                                if (minPoint) {
                                    dashedLineV.y1 = Math.min(minPoint.y1, minPoint.y2);
                                    dashedLineV.y2 = Math.max(minPoint.y1, minPoint.y2);
                                    height = dashedLineV.y2 - dashedLineV.y1;
                                }

                                if (Math.abs(height - frame.virtualFrame.height) < THRESHOLD_ADSORB) {
                                    dashedLineV.height = height;
                                }
                            }
                            // }
                        }
                    });
                });
            };

            elements.forEach((element) => {
                if (frame.lineElements?.find((ele: any) => ele.id === element.id)) return;
                checkSnapWithElement(element as BaseFrame);
            });

            setDashedCircle(dashedCircle);
            setDashedLine(dashedLine);
            setDashedLineV(dashedLineV);
            if (!frame.type.startsWith('Line')) setCenterSnap(centerSnap);

            setElements((prevElements) => [...prevElements]);
        };

        const hasOtherShapeLine = (line: any, allElements: any, frame: any, point: any, type: any) => {
            let allLines: any = [];
            allElements.forEach((element: any) => {
                if (frame.lineElements?.find((ele: any) => ele.id === element.id)) return;
                if (!element.getLines) return;
                const rectLines = element?.getLines();
                allLines.push(...rectLines);
            });
            let segmentationMsg: any = isLineContainingSegments(line, allLines);
            return segmentationMsg;
        };

        const isLineContainingSegments = (line: any, segments: any) => {
            let splitPoints = new Set();

            if (line.x1 !== undefined && line.x2 !== undefined && line.y1 === line.y2) {
                let y = line.y1;
                for (let segment of segments) {
                    if (segment.y1 === y && segment.y2 === y) {
                        splitPoints.add(JSON.stringify({ x: segment.x1, y: y }));
                        splitPoints.add(JSON.stringify({ x: segment.x2, y: y }));
                    }
                }
            } else if (line.y1 !== undefined && line.y2 !== undefined && line.x1 === line.x2) {
                let x = line.x1;
                for (let segment of segments) {
                    if (segment.x1 === x && segment.x2 === x) {
                        splitPoints.add(JSON.stringify({ x: x, y: segment.y1 }));
                        splitPoints.add(JSON.stringify({ x: x, y: segment.y2 }));
                    }
                }
            }

            return Array.from(splitPoints)
                .map((point) => JSON.parse(point as any))
                .sort((a, b) => a.y - b.y || a.x - b.x); // 返回排序后的坐标对象
        };

        const onMoveEnd = (event: any, frame: BaseFrame | any) => {
            let newX = frame.virtualFrame.x;
            let newY = frame.virtualFrame.y;
            let newWidth = frame.virtualFrame.width;
            let newHeight = frame.virtualFrame.height;
            let oldX = frame.virtualFrame.x;
            let oldY = frame.virtualFrame.y;

            //gn: 添加标志位，标识是否已经处理了位置（如吸附）
            let positionAlreadyHandled = false;

            if (centerSnap) {
                const targetX = centerSnap.centerX - frame.virtualFrame.width / 2;
                const targetY = centerSnap.centerY - frame.virtualFrame.height / 2;
                newX = targetX;
                newY = targetY;
            } else if (dashedCircle && !frame.type.startsWith('SDL') && !frame.type.startsWith('TDL')) {
                const { x, y, frameCornerIndex } = dashedCircle;
                const currentCorner = frame.points[frameCornerIndex];
                if (currentCorner) {
                    const dx = x - currentCorner.x;
                    const dy = y - currentCorner.y;
                    newX = frame.virtualFrame.x + dx;
                    newY = frame.virtualFrame.y + dy;
                    const dx2 = newX - frame.virtualFrame.x;
                    const dy2 = newY - frame.virtualFrame.y;
                    frame.move(dx2, dy2);
                    //gn: 标记位置已处理(顶点吸附)
                    positionAlreadyHandled = true;
                }
            }

            if (frame.type.startsWith('Line')) {
                const result = moveUntil.handleLineMove(frame as any, elements);
                checkOverlappingEdges();
                if (!result) {
                    setDashedCircle(null);
                    setDashedLine(null);
                    setCenterSnap(null);
                    updateDimensions();
                    // updateOverlapPoints(elements)
                    return;
                }
                if (result.updated) {
                    setElements((prev) => [...prev]);
                    setDashedCircle(null);
                    setDashedLine(null);
                    setCenterSnap(null);
                    debouncedOnChange(elements, zones, value.from);
                    updateDimensions();
                    return;
                }
                newX = result.newX;
                newY = result.newY;
            } else if (frame.type.startsWith('SDL') || frame.type.startsWith('TDL')) {
                setZones((pre) => {
                    pre.forEach((z) => {
                        if (z.dividers) z.dividers = z.dividers.filter((d) => d.id != frame.id);
                    });
                    return pre;
                });
                let result = null;
                let groups = elements.filter((el) => el instanceof GroupFrame);
                groups.forEach((g) => {
                    if (g.dividerEles) g.dividerEles = g.dividerEles.filter((d) => d.id != frame.id);
                });
                let group: any = moveUntil.isElementPartiallyInFrames(frame, groups, 'any')[0];
                if (!group && value.from == 'quote') {
                    notification.warning({
                        message: 'Warning message',
                        description: 'Dividers can only be applied to the window section, not the frames.',
                    });
                    frame.update(event.initialFrame);
                    updateDimensions();
                    debouncedOnChange(elements, zones, value.from);
                    return;
                }
                if (group) {
                    if (
                        (group.dividerEles &&
                            frame.type.startsWith('SDL') &&
                            group.dividerEles.some((d: any) => d.type.startsWith('TDL'))) ||
                        (group.dividerEles &&
                            frame.type.startsWith('TDL') &&
                            group.dividerEles.some((d: any) => d.type.startsWith('SDL')))
                    ) {
                        notification.warning({
                            message: 'Warning message',
                            description:
                                'This window already has a divider type applied. You cannot apply both SDL and TDL to the same window or door.',
                        });
                        frame.update(event.initialFrame);
                        updateDimensions();
                        debouncedOnChange(elements, zones, value.from);
                        return;
                    }
                    group.dividerEles?.push(frame);
                    result = moveUntil.handleDividerMoveRender(frame, group.children);
                    // gn:在divider移动完成后，计算并存储divider的比例关系
                    if (group.updateDividerRelation) {
                        group.updateDividerRelation(frame);
                    }

                    //gn：检测divider与group中pocketwall的重叠区域
                    calcPocketWallOverlap(frame,group);
                } else if (elements.some((ele) => ele.type == 'render')) {
                    // zoneUntil.updateDivider(newElement, zones)
                    result = moveUntil.handleDividerMoveRender(frame as any, elements);
                } else {
                    result = moveUntil.handleDividerMove(frame as any, elements);
                }

                // const result = moveUntil.handleDividerMove(frame, elements);
                if (result?.updated) {
                    // 更新 divider 在 zones 中的位置
                    setZones((pre) => {
                        let nearZone = zoneUntil.findContainingZone(pre, frame as any);
                        let index = pre.findIndex((z) => z.elementId == nearZone?.elementId);
                        if (!pre[index]) return pre;
                        if (!pre[index]?.dividers) pre[index].dividers = [];
                        pre[index]?.dividers?.push({
                            id: frame.id,
                            length: frame.type.includes('-h') ? frame.virtualFrame.width : frame.virtualFrame.height,
                            start_point: {
                                x: frame.virtualFrame.x,
                                y: frame.virtualFrame.y,
                            },
                            end_point: frame.type.includes('-h')
                                ? {
                                      x: frame.virtualFrame.x + frame.virtualFrame.width,
                                      y: frame.virtualFrame.y,
                                  }
                                : {
                                      x: frame.virtualFrame.x,
                                      y: frame.virtualFrame.y + frame.virtualFrame.height,
                                  },
                            type: frame.type,
                        });
                        return pre;
                    });
                    // console.log(zoneUntil.updateZonesDivider(frame as any, zones, elements))
                    // setZones(pre => {
                    //     return zoneUntil.updateZonesDivider(frame as any, pre, elements);
                    // });
                    // 更新 elements
                    setElements((prev) => [...prev]);
                    setDashedCircle(null);
                    setDashedLine(null);
                    setCenterSnap(null);
                    if (!dashedCircle) {
                        updateDimensions();
                        debouncedOnChange(elements, zones, value.from);
                        //gn: 更新divider后，在quote模式下，需要更新unit，用于copyUnit计算
                        setTimeout(() => {
                            if (value.from == 'quote') onChangeUnit?.(baseUntil.getUnitsData(elements, zones, value.sizeMultiples));
                        }, 1000);
                        return;
                    }
                    const { x, y, frameCornerIndex } = dashedCircle;
                    const currentCorner = frame.points[frameCornerIndex];
                    if (currentCorner) {
                        const dx = x - currentCorner.x;
                        const dy = y - currentCorner.y;
                        newX = frame.virtualFrame.x + dx;
                        newY = frame.virtualFrame.y + dy;
                        const dx2 = frame.type.includes('-h') ? 0 : newX - frame.virtualFrame.x;
                        const dy2 = frame.type.includes('-h') ? newY - frame.virtualFrame.y : 0;
                        frame.move(dx2, dy2);
                    }
                    updateDimensions();
                    debouncedOnChange(elements, zones, value.from);
                    //gn: 更新divider后，在quote模式下，需要更新unit，用于copyUnit计算
                    setTimeout(() => {
                        if (value.from == 'quote') onChangeUnit?.(baseUntil.getUnitsData(elements, zones, value.sizeMultiples));
                    }, 1000);
                    return;
                }
                newX = result.newX;
                newY = result.newY;
            }
            if (dashedLine) {
                //水平线段吸附
                const frameLines = frame?.getLines();
                if (!frameLines) return;
                if (dashedLine.isHorizontal) {
                    if (frame.type == ShapeType.Rectangle || frame instanceof GroupFrame) {
                        newY = dashedLine.y1;

                        let frameHLines: any = [];
                        frameLines.forEach((item: any) => {
                            let lineType = moveUntil.checkLineType(item.x1, item.y1, item.x2, item.y2);
                            if (lineType == 'h') {
                                frameHLines.push(item);
                            }
                        });

                        let lineObj: any = moveUntil.getLowerHorizontalLine(
                            frameHLines[0].x1,
                            frameHLines[0].y1,
                            frameHLines[0].x2,
                            frameHLines[0].y2,
                            frameHLines[1].x1,
                            frameHLines[1].y1,
                            frameHLines[1].x2,
                            frameHLines[1].y2
                        );
                        if (Math.abs(lineObj.y1 - dashedLine.y1) <= THRESHOLD) {
                            newY = frame.virtualFrame.y - (lineObj.y1 - dashedLine.y1);
                        }

                        if (dashedLine.type == 'startAdsorb') {
                            newX = dashedLine.x1;
                        } else if (dashedLine.type == 'endAdsorb') {
                            newX = dashedLine.x2 - frame.virtualFrame.width;
                            if (dashedLine.width) {
                                newX = dashedLine.x2 - dashedLine.width;
                            }
                        }

                        if (dashedLine.width) {
                            newWidth = dashedLine.width;
                        }
                    } else if (frame.type == ShapeType.ArchH) {
                        let archHLine = frame.lines[0];
                        let flipY = frame.flipY;
                        if (flipY) {
                            newY = dashedLine.y1;
                        } else {
                            newY = frame.virtualFrame.y - (archHLine.startPoint.y - dashedLine.y1);
                        }
                        if (dashedLine.type == 'startAdsorb') {
                            newX = dashedLine.x1;
                        } else if (dashedLine.type == 'endAdsorb') {
                            newX = dashedLine.x2 - frame.virtualFrame.width;
                            if (dashedLine.width) {
                                newX = dashedLine.x2 - dashedLine.width;
                            }
                        }
                        if (dashedLine.width) {
                            newWidth = dashedLine.width;
                        }
                    } else if (frame.type == ShapeType.Triangle) {
                        let points: any = frame.points;
                        let sameY: any = moveUntil.findPointsWithSameY(points);
                        if (sameY && sameY.length != 0) {
                            let flag: any = true;
                            let sameYValue: any = sameY[0][0].y;
                            points.forEach((item: any) => {
                                if (item.y != sameYValue) {
                                    if (item.y > sameYValue) {
                                        flag = false;
                                    }
                                }
                            });
                            if (flag) {
                                let moveY: any = sameYValue - dashedLine.y1;
                                points.forEach((item: any, index: any) => {
                                    let y = Number(item.y - moveY);
                                    let x = Number(item.x);
                                    let moveX = 0;
                                    if (dashedLine.type == 'startAdsorb') {
                                        moveX = sameY[0][0].x - dashedLine.x1;
                                        x = Number(item.x - moveX);
                                        if (dashedLine.width && index == 1) {
                                            x = x - (x - dashedLine.x2);
                                        }
                                    } else if (dashedLine.type == 'endAdsorb') {
                                        moveX = sameY[0][1].x - dashedLine.x2;
                                        x = Number(item.x - moveX);
                                        if (dashedLine.width && index == 0) {
                                            x = x - (x - dashedLine.x1);
                                        }
                                    }

                                    frame?.updateSingleVertex(index, {
                                        x,
                                        y,
                                    });
                                });
                            } else {
                                let moveY: any = sameYValue - dashedLine.y1;
                                points.forEach((item: any, index: any) => {
                                    let y = Number(item.y - moveY);
                                    let x = Number(item.x);
                                    let moveX = 0;
                                    if (dashedLine.type == 'startAdsorb') {
                                        moveX = sameY[0][0].x - dashedLine.x1;
                                        x = Number(item.x - moveX);
                                        if (dashedLine.width && index == 1) {
                                            x = x - (x - dashedLine.x2);
                                        }
                                    } else if (dashedLine.type == 'endAdsorb') {
                                        moveX = sameY[0][1].x - dashedLine.x2;
                                        x = Number(item.x - moveX);
                                        if (dashedLine.width && index == 0) {
                                            x = x - (x - dashedLine.x1);
                                        }
                                    }
                                    frame?.updateSingleVertex(index, {
                                        x,
                                        y,
                                    });
                                });
                            }
                            const { x, y } = handleOverlop(frame, event, elements);
                            newX = x ? x : newX;
                            newY = y ? y : newY;
                            if (x & y) frame.move(x - frame.virtualFrame.x, y - frame.virtualFrame.y);
                            const dx = frame.virtualFrame.x - oldX;
                            const dy = frame.virtualFrame.y - oldY;
                            if (frame.lineElements) {
                                let overLineIds: any[] = [];
                                frame.lines?.forEach((line: any) => {
                                    line.intersectionPoints?.forEach((point: any) => {
                                        point.point.x += dx;
                                        point.point.y += dy;
                                        if (
                                            frame.lineElements &&
                                            frame.lineElements?.find((line: any) => line.id == point.lineId)
                                        ) {
                                            if (!overLineIds.includes(point.lineId)) overLineIds.push(point.lineId);
                                        }
                                    });
                                });

                                const lines = JSON.parse(JSON.stringify(frame.lineElements));
                                lines?.forEach((line: any) => {
                                    line = elements.find((el) => el.id === line.id);
                                    line.move(dx, dy);
                                });
                                overLineIds.forEach((lineId) => {
                                    let line = elements.find((el) => el.id === lineId);
                                    moveUntil.handleLineMove(line as any, elements, false);
                                });
                                lines?.forEach((line: any) => {
                                    if (overLineIds.includes(line.id)) return;
                                    line = elements.find((el) => el.id === line.id);
                                    moveUntil.handleLineMove(line, elements, false);
                                });
                            }
                            setDashedCircle(null);
                            setDashedLine(null);
                            setDashedLineV(null);
                            updateDimensions();
                            debouncedOnChange(elements, zones, value.from);
                            return;
                        }
                    }
                }
                if (frame instanceof GroupFrame) {
                    if (newWidth == frame.virtualFrame.width && newHeight == frame.virtualFrame.height) {
                        const dx2 = newX - frame.virtualFrame.x;
                        const dy2 = newY - frame.virtualFrame.y;
                        frame.move(dx2, dy2);
                        //gn:标记位置已处理(水平线段吸附)
                        positionAlreadyHandled = true;
                    } else {
                        // updateStart(frame)
                        // calcZonesByGroup(frame)
                    }
                } else {
                    frame.update({
                        x: newX,
                        y: newY,
                        width: newWidth,
                        height: newHeight,
                    });
                }

                //gn:只有在没有处理过位置的情况下才调用 handleOverlop
                if (!positionAlreadyHandled){
                    const { x, y } = handleOverlop(frame, event, elements);
                    newX = x ? x : newX;
                    newY = y ? y : newY;
                    if (x & y) frame.move(newX - frame.virtualFrame.x, newY - frame.virtualFrame.y);
                }
                
                const dx = newX - frame.virtualFrame.x;
                const dy = newY - frame.virtualFrame.y;
                if (frame.lineElements) {
                    let overLineIds: any[] = [];
                    frame.lines?.forEach((line: any) => {
                        line.intersectionPoints?.forEach((point: any) => {
                            point.point.x += dx;
                            point.point.y += dy;
                            if (
                                frame.lineElements &&
                                frame.lineElements?.find((line: any) => line.id == point.lineId)
                            ) {
                                if (!overLineIds.includes(point.lineId)) overLineIds.push(point.lineId);
                            }
                        });
                    });
                    const lines = JSON.parse(JSON.stringify(frame.lineElements));
                    lines?.forEach((line: any) => {
                        line = elements.find((el) => el.id === line.id);
                        line.move(dx, dy);
                    });
                    overLineIds.forEach((lineId) => {
                        let line = elements.find((el) => el.id === lineId);
                        moveUntil.handleLineMove(line as any, elements, false);
                    });
                    lines?.forEach((line: any) => {
                        if (overLineIds.includes(line.id)) return;
                        line = elements.find((el) => el.id === line.id);
                        moveUntil.handleLineMove(line, elements, false);
                    });
                }

                setDashedCircle(null);
                setDashedLine(null);
                setCenterSnap(null);
                setDashedLineV(null);
                setElements((prev) => [...prev]);
                checkOverlappingEdges();
                if (frame instanceof GroupFrame) {
                    updateGroupZones(frame.zones);
                }
                // updateOverlapPoints(elements)
                // setTimeout(() => {
                //     if(value.from == 'quote')
                updateDimensions();
                debouncedOnChange(elements, zones, value.from);
                // },1000)
                return;
            }
            if (dashedLineV) {
                //垂直线段吸附
                const frameLines = frame?.getLines();
                if (!frameLines) return;
                if (dashedLineV.isVertical) {
                    let dashedLine = dashedLineV;
                    if (frame.type == ShapeType.Rectangle || frame instanceof GroupFrame) {
                        newX = dashedLine.x1;
                        let frameVLines: any = [];
                        frameLines.forEach((item: any) => {
                            let lineType = moveUntil.checkLineType(item.x1, item.y1, item.x2, item.y2);
                            if (lineType == 'v') {
                                frameVLines.push(item);
                            }
                        });

                        let lineObj: any = moveUntil.getRightVerticalLine(
                            frameVLines[0].x1,
                            frameVLines[0].y1,
                            frameVLines[0].x2,
                            frameVLines[0].y2,
                            frameVLines[1].x1,
                            frameVLines[1].y1,
                            frameVLines[1].x2,
                            frameVLines[1].y2
                        );
                        if (Math.abs(lineObj.x1 - dashedLine.x1) <= THRESHOLD) {
                            newX = frame.virtualFrame.x - (lineObj.x1 - dashedLine.x1);
                        }

                        if (dashedLine.type == 'startAdsorb') {
                            newY = dashedLine.y1;
                        } else if (dashedLine.type == 'endAdsorb') {
                            newY = dashedLine.y2 - frame.virtualFrame.height;
                            if (dashedLine.height) {
                                newY = dashedLine.y2 - dashedLine.height;
                            }
                        }

                        if (dashedLine.height) {
                            newHeight = dashedLine.height;
                        }
                    } else if (frame.type == ShapeType.ArchV) {
                        let archHLine = frame.lines[0];
                        let flipX = frame.flipX;
                        if (!flipX) {
                            newX = dashedLine.x1;
                        } else {
                            newX = frame.virtualFrame.x - (archHLine.startPoint.x - dashedLine.x1);
                        }
                        if (dashedLine.type == 'startAdsorb') {
                            newY = dashedLine.y1;
                        } else if (dashedLine.type == 'endAdsorb') {
                            newY = dashedLine.y2 - frame.virtualFrame.height;
                            if (dashedLine.height) {
                                newY = dashedLine.y2 - dashedLine.height;
                            }
                        }
                        if (dashedLine.height) {
                            newHeight = dashedLine.height;
                        }
                    } else if (frame.type == ShapeType.Triangle) {
                        let points: any = frame.points;
                        let sameX: any = moveUntil.findPointsWithSameX(points);
                        if (sameX && sameX.length != 0) {
                            let flag: any = true;
                            let sameXValue: any = sameX[0][0].x;
                            points.forEach((item: any) => {
                                if (item.x != sameXValue) {
                                    if (item.x > sameXValue) {
                                        flag = false;
                                    }
                                }
                            });
                            if (flag) {
                                let moveX: any = sameXValue - dashedLine.x1;
                                points.forEach((item: any, index: any) => {
                                    let x = Number(item.x - moveX);
                                    let y = Number(item.y);
                                    let moveY = 0;
                                    if (dashedLine.type == 'startAdsorb') {
                                        moveY = sameX[0][1].y - dashedLine.y1;
                                        y = Number(item.y - moveY);
                                        if (dashedLine.height && index == 1) {
                                            y = y - (y - dashedLine.y2);
                                        }
                                    } else if (dashedLine.type == 'endAdsorb') {
                                        moveY = sameX[0][0].y - dashedLine.y2;
                                        y = Number(item.y - moveY);
                                        if (dashedLine.height && index == 2) {
                                            y = y - (y - dashedLine.y1);
                                        }
                                    }
                                    frame?.updateSingleVertex(index, {
                                        x,
                                        y,
                                    });
                                });
                            } else {
                                let moveX: any = sameXValue - dashedLine.x1;
                                points.forEach((item: any, index: any) => {
                                    let x = Number(item.x - moveX);
                                    let y = Number(item.y);
                                    let moveY = 0;
                                    if (dashedLine.type == 'startAdsorb') {
                                        moveY = sameX[0][1].y - dashedLine.y1;
                                        y = Number(item.y - moveY);
                                        if (dashedLine.height && index == 1) {
                                            y = y - (y - dashedLine.y2);
                                        }
                                    } else if (dashedLine.type == 'endAdsorb') {
                                        moveY = sameX[0][0].y - dashedLine.y2;
                                        y = Number(item.y - moveY);
                                        if (dashedLine.height && index == 2) {
                                            y = y - (y - dashedLine.y1);
                                        }
                                    }
                                    frame?.updateSingleVertex(index, {
                                        x,
                                        y,
                                    });
                                });
                            }
                            const { x, y } = handleOverlop(frame, event, elements);
                            newX = x ? x : newX;
                            newY = y ? y : newY;
                            if (x & y) frame.move(x - frame.virtualFrame.x, y - frame.virtualFrame.y);

                            const dx = frame.virtualFrame.x - oldX;
                            const dy = frame.virtualFrame.y - oldY;
                            if (frame.lineElements) {
                                let overLineIds: any[] = [];
                                frame.lines.forEach((line: any) => {
                                    line.intersectionPoints?.forEach((point: any) => {
                                        point.point.x += dx;
                                        point.point.y += dy;
                                        if (
                                            frame.lineElements &&
                                            frame.lineElements?.find((line: any) => line.id == point.lineId)
                                        ) {
                                            if (!overLineIds.includes(point.lineId)) overLineIds.push(point.lineId);
                                        }
                                    });
                                });
                                const lines = JSON.parse(JSON.stringify(frame.lineElements));
                                lines?.forEach((line: any) => {
                                    line = elements.find((el) => el.id === line.id);
                                    line.move(dx, dy);
                                });
                                overLineIds.forEach((lineId) => {
                                    let line = elements.find((el) => el.id === lineId);
                                    moveUntil.handleLineMove(line as any, elements);
                                });
                                lines?.forEach((line: any) => {
                                    if (overLineIds.includes(line.id)) return;
                                    line = elements.find((el) => el.id === line.id);
                                    moveUntil.handleLineMove(line, elements);
                                });
                            }
                            setDashedCircle(null);
                            setDashedLine(null);
                            setDashedLineV(null);
                            checkOverlappingEdges();
                            updateDimensions();
                            debouncedOnChange(elements, zones, value.from);
                            return;
                        }
                    }
                }
                if (frame instanceof GroupFrame) {
                    if (newWidth == frame.virtualFrame.width && newHeight == frame.virtualFrame.height) {
                        const dx2 = newX - frame.virtualFrame.x;
                        const dy2 = newY - frame.virtualFrame.y;
                        frame.move(dx2, dy2);
                        //gn:标记位置已处理(垂直线段吸附)
                        positionAlreadyHandled = true;
                    } else {
                    }
                } else {
                    frame.update({
                        x: newX,
                        y: newY,
                        width: newWidth,
                        height: newHeight,
                    });
                }

                //gn:只有在没有处理过位置的情况下才调用handleOverlop
                if (!positionAlreadyHandled){
                    const { x, y } = handleOverlop(frame, event, elements);
                    if (x & y) {
                        newX = x;
                        newY = y;
                    }
                    frame.move(newX - frame.virtualFrame.x, newY - frame.virtualFrame.y)
                }
                const dx = newX - frame.virtualFrame.x;
                const dy = newY - frame.virtualFrame.y;

                if (frame.lineElements) {
                    let overLineIds: any[] = [];
                    frame.lines.forEach((line: any) => {
                        line.intersectionPoints?.forEach((point: any) => {
                            point.point.x += dx;
                            point.point.y += dy;
                            if (frame.lineElements && frame.lineElements?.find((line) => line.id == point.lineId)) {
                                if (!overLineIds.includes(point.lineId)) overLineIds.push(point.lineId);
                            }
                        });
                    });
                    const lines = JSON.parse(JSON.stringify(frame.lineElements));
                    lines?.forEach((line: any) => {
                        line = elements.find((el) => el.id === line.id);
                        line.move(dx, dy);
                    });
                    overLineIds.forEach((lineId) => {
                        let line = elements.find((el) => el.id === lineId);
                        moveUntil.handleLineMove(line as any, elements);
                    });
                    lines?.forEach((line: any) => {
                        if (overLineIds.includes(line.id)) return;
                        line = elements.find((el) => el.id === line.id);
                        moveUntil.handleLineMove(line, elements);
                    });
                }
                setDashedCircle(null);
                setDashedLine(null);
                setCenterSnap(null);
                setDashedLineV(null);
                setElements((prev) => [...prev]);
                checkOverlappingEdges();
                if (frame instanceof GroupFrame) {
                    updateGroupZones(frame.zones);
                }
                updateDimensions();
                // updateOverlapPoints(elements)
                // setTimeout(() => {
                //     if(value.from == 'quote')
                debouncedOnChange(elements, zones, value.from);
                // },1000)

                //gn:在frame吸附后，如果是quote模式，需要重新计算units坐标位置等信息
                setTimeout(() => {
                    if (value.from == 'quote') onChangeUnit?.(baseUntil.getUnitsData(elements, zones, value.sizeMultiples));
                }, 1000);
                return;
            }
            if (dashedCircle || dashedLine) {
                setDashedCircle(null);
                setDashedLine(null);
                setDashedLineV(null);
                checkOverlappingEdges();
                debouncedOnChange(elements, zones, value.from);
                return;
            }
            const { x, y } = handleOverlop(frame, event, elements);
            newX = x ? x : newX;
            newY = y ? y : newY;
            const dx = newX - frame.virtualFrame.x;
            const dy = newY - frame.virtualFrame.y;
            frame.move(dx, dy);
            if (frame instanceof GroupFrame) {
                updateGroupZones(frame.zones);
                //gn:判断group中的divider是否与墙有重叠
                frame.dividerEles?.forEach((divider) => {
                    calcPocketWallOverlap(divider, frame);
                });
            }
            setDashedCircle(null);
            setDashedLine(null);
            setCenterSnap(null);
            setDashedLineV(null);
            let overLineIds: any[] = [];
            frame.lines?.forEach((line) => {
                line.intersectionPoints?.forEach((point) => {
                    if (frame.lineElements && frame.lineElements?.find((line) => line.id == point.lineId)) {
                        if (!overLineIds.includes(point.lineId)) overLineIds.push(point.lineId);
                    }
                });
            });
            if (frame.lineElements) {
                const lines = JSON.parse(JSON.stringify(frame.lineElements));
                lines?.forEach((line: any) => {
                    line = elements.find((el) => el.id === line.id);
                    line.move(dx, dy);
                });
                // overLineIds.forEach(lineId => {
                //   let line = elements.find(el => el.id === lineId);
                //   onMoveEnd({}, line)
                //   // moveUntil.handleLineMove(line, elements)
                // })
                // lines?.forEach((line:any) => {
                //   if(overLineIds.includes(line.id)) return;
                //   line = elements.find(el => el.id === line.id);
                //   moveUntil.handleLineMove(line, elements, false)
                // });
            }
            checkOverlappingEdges();
            checkAndExpandCanvas(frame);
            setElements((prev) => [...prev]);
            updateDimensions();
            debouncedOnChange(elements, zones, value.from);
            setTimeout(() => {
                if (value.from == 'quote') onChangeUnit?.(baseUntil.getUnitsData(elements, zones, value.sizeMultiples));
                // if(value.from == 'quote')
            }, 1000);
            if (frame instanceof BaseOperation) {
                setZones((prev) => {
                    let nearZone = zoneUntil.findContainingZone(prev, frame);
                    if (!nearZone) return prev;
                    prev.forEach((z) => {
                        let index = z.dividers?.findIndex((d) => d.id == frame.id);
                        if (index !== undefined && index >= 0) z.dividers?.splice(index, 1);
                    });
                    if (!nearZone.operations) nearZone.operations = [];
                    let index = prev.findIndex((z) => z.elementId == nearZone.elementId);
                    nearZone.operations.push(frame);
                    prev.splice(index, 1, nearZone);
                    return prev;
                });
            }
        };

        const debounceUpdateOverlapPoints = useRef(
            debounce((elements: BaseData[]) => {
                let points = zoneUntil.findOverlappingPoints(elements);
                points = points.filter((point) => {
                    let overCount = 0;
                    elements.forEach((element) => {
                        if (!(element instanceof BaseFrame)) return;
                        element.lines?.forEach((line) => {
                            if (line.isCut) {
                                if (line.startPoint.x == point.point.x && line.startPoint.y == point.point.y)
                                    overCount++;
                                if (line.endPoint.x == point.point.x && line.endPoint.y == point.point.y) overCount++;
                            } else
                                line.hiddenSegment?.forEach((segment) => {
                                    if (segment.startPoint.x == point.point.x && segment.startPoint.y == point.point.y)
                                        overCount++;
                                    if (segment.endPoint.x == point.point.x && segment.endPoint.y == point.point.y)
                                        overCount++;
                                });
                        });
                    });
                    return overCount <= 2;
                });
                setOverlappingPoints(points);
            }, 500)
        ).current;

        const handleOverlop = (frame: any, event: any, elements: any[]) => {
            let newX = frame.virtualFrame.x;
            let newY = frame.virtualFrame.y;
            if (!(frame instanceof BaseFrame)) return {};
            if (frame.type.startsWith('Line')) return {};
            const OVERLAP_OFFSET = -20;
            let isOver: boolean = false;
            if (frame instanceof BaseFrame && !frame.type.startsWith('Line')) {
                const checkPosition = (x: number, y: number, elements: any[]) => {
                    if (x < 0 || y < 0) return true;

                    for (const element of elements) {
                        if (!(element instanceof BaseFrame)) continue;
                        if (element.id === frame.id || element.type.startsWith('Line')) continue;

                        const isOccupied = !(
                            x + frame.virtualFrame.width <= element.virtualFrame.x ||
                            x >= element.virtualFrame.x + element.virtualFrame.width ||
                            y + frame.virtualFrame.height <= element.virtualFrame.y ||
                            y >= element.virtualFrame.y + element.virtualFrame.height
                        );

                        if (isOccupied) return true;
                    }
                    return false;
                };

                // 遍历所有元素检查重叠
                for (const element of elements) {
                    if (!(element instanceof BaseFrame)) continue;
                    if (element.id === frame.id || element.type.startsWith('Line')) continue;

                    const isOverlapping = !(
                        newX + frame.virtualFrame.width <= element.virtualFrame.x ||
                        newX >= element.virtualFrame.x + element.virtualFrame.width ||
                        newY + frame.virtualFrame.height <= element.virtualFrame.y ||
                        newY >= element.virtualFrame.y + element.virtualFrame.height
                    );
                    if (isOverlapping) {
                        isOver = true;
                        const positions = [
                            // 右侧
                            {
                                x: element.virtualFrame.x + element.virtualFrame.width + OVERLAP_OFFSET,
                                y: element.virtualFrame.y,
                            },
                            // 左侧
                            {
                                x: element.virtualFrame.x - frame.virtualFrame.width - OVERLAP_OFFSET,
                                y: element.virtualFrame.y,
                            },
                            // 下方
                            {
                                x: element.virtualFrame.x,
                                y: element.virtualFrame.y + element.virtualFrame.height + OVERLAP_OFFSET,
                            },
                            // 上方
                            {
                                x: element.virtualFrame.x,
                                y: element.virtualFrame.y - frame.virtualFrame.height - OVERLAP_OFFSET,
                            },
                        ];

                        for (const position of positions) {
                            if (!checkPosition(position.x, position.y, elements)) {
                                // 找到可用位置
                                newX = position.x;
                                newY = position.y;
                                // 返回新位置
                                return { x: newX, y: newY };
                            }
                        }
                        continue;
                    }
                }
            }
            if (newX === frame.virtualFrame.x && newY === frame.virtualFrame.y) {
                if (isOver && elements.length) {
                    let overElement = frame;
                    elements.forEach((element) => {
                        if ((overElement?.virtualFrame.y || 0) < element.virtualFrame.y) overElement = element;
                    });

                    newY = overElement.virtualFrame.y + overElement.virtualFrame.width;
                    return { x: newX, y: newY };
                }

                return {};
            }
            return { x: newX, y: newY };
        };

        const handleSelectAll = () => {
            setSelectedItems(elements);
            onSelectChange?.(elements);
        };

        const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

        const handleMouseMove = (e: any) => {
            if (isDragging && value.dragMode === 'drag' && dragStartPos) {
                const stage = e.target.getStage();
                const pointerPos = stage.getPointerPosition();

                const deltaX = pointerPos.x - dragStartPos.x;
                const deltaY = pointerPos.y - dragStartPos.y;

                if (containerRef.current) {
                    containerRef.current.scrollBy({
                        left: -deltaX,
                        top: -deltaY,
                    });
                }

                setDragStartPos({
                    x: pointerPos.x,
                    y: pointerPos.y,
                });
            }
            if (!stageRef.current) return;
            const stage = stageRef.current;
            const pos = getRelativePointerPosition(stage);

            if (pos) {
                setMousePos({
                    x: (pos.x - value.stagePos.x) / value.scale,
                    y: (pos.y - value.stagePos.y) / value.scale,
                });
            }

            if (value.dragMode === 'removeLine' || !newRectangle) return;

            setNewRectangle({
                ...newRectangle,
                x2: pos.x,
                y2: pos.y,
            });
        };

        const checkOverlappingEdges = () => {
            elements.forEach((element) => {
                if (element instanceof BaseFrame) {
                    element.lines.forEach((line) => {
                        if (line) {
                            line.hidden = false;
                            if ([0.3, 1.1, 1.2].includes(line.weight as any)) line.oldWeight = line.weight;
                            // line.oldWeight = [0.3,1.1,1.2].includes(line.weight) ? line.weight : undefined;
                            if (element.type.startsWith('Line')) {
                                line.weight = line.weight || 1;
                            } else line.weight = -1;
                        }
                    });
                }
            });

            let overlapLines = new Map<string, Array<ILine>>();

            elements.forEach((element) => {
                if (!(element instanceof BaseFrame)) return;

                element.lines.forEach((line) => {
                    if (!line || !line.startPoint || !line.endPoint) return;
                    const point1 = {
                        x: Math.min(line.startPoint.x, line.endPoint.x).toFixed(4),
                        y: Math.min(line.startPoint.y, line.endPoint.y).toFixed(4),
                    };
                    const point2 = {
                        x: Math.max(line.startPoint.x, line.endPoint.x).toFixed(4),
                        y: Math.max(line.startPoint.y, line.endPoint.y).toFixed(4),
                    };

                    let lineKey = `${point1.x},${point1.y}-${point2.x},${point2.y}`;

                    if (line.radius && line.center) {
                        const arcInfo = `-arc-${line.center.x.toFixed(4)},${line.center.y.toFixed(
                            4
                        )}-${line.radius.toFixed(4)}`;
                        lineKey += arcInfo;
                    }

                    if (!overlapLines.has(lineKey)) {
                        overlapLines.set(lineKey, []);
                    }
                    overlapLines.get(lineKey)?.push(line);
                });
            });

            overlapLines.forEach((lines) => {
                if (lines.length < 2) return;
                let weight = 0;
                lines.forEach((line) => {
                    if (line.id?.startsWith('Line') || !line.isCut) weight += 1;
                });
                lines.forEach((line) => (line.weight = weight == 1 ? line.oldWeight || weight : weight));
            });
            elements.forEach((element: any) => {
                if (!element.type.startsWith('Line')) return;
                if (element.lines[0]?.weight && element.lines[0]?.weight == 3) {
                    element.style.color.border = 'blue';
                } else element.style.color.border = '#333';
            });
        };

        const setPoints = (elementId: string, newPoints: IPointPostion[]) => {
            setElements((prevElements) => {
                return prevElements.map((element) => {
                    if (element.id === elementId) {
                        if (element.type === 'Triangle') {
                            (element as TriangleWindow).updateSingleVertex(0, newPoints[0]);
                            (element as TriangleWindow).updateSingleVertex(1, newPoints[1]);
                            (element as TriangleWindow).updateSingleVertex(2, newPoints[2]);
                        }
                        return element;
                    }
                    return element;
                });
            });
        };

        const handleSelectChange = (elements: any[]) => {
            onSelectChange?.(elements);
        };

        const onPointMove = (e: any, index: number) => {
            e.cancelBubble = true;

            const currentElement = elements.find((el) => el.id === selectedItems[0]?.id);
            if (!currentElement || currentElement.type !== 'Triangle') return;

            const currentPoint = (currentElement as TriangleWindow).points[index];

            const snapThreshold = 10 / value.scale;
            let closestPoint: any = null;
            let minDistance = snapThreshold;

            elements.forEach((element) => {
                if (element.id === currentElement.id) return;

                let pointsToCheck: any[] = [];

                if (element.type === 'Triangle') {
                    pointsToCheck = (element as TriangleWindow).points;
                } else if (element instanceof Frame) {
                    // 对于矩形，检查四个角点
                    const { x, y, width, height } = element.virtualFrame;
                    pointsToCheck = [
                        { x, y },
                        { x: x + width, y },
                        { x: x + width, y: y + height },
                        { x, y: y + height },
                    ];
                }

                pointsToCheck.forEach((point) => {
                    const dx = point.x - currentPoint.x;
                    const dy = point.y - currentPoint.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPoint = point;
                    }
                });
            });

            if (closestPoint) {
                setDashedCircle({
                    x: closestPoint.x,
                    y: closestPoint.y,
                    radius: 5 / value.scale,
                });
            } else {
                setDashedCircle(null);
            }
        };

        const [currentLineContext, setCurrentLineContext] = useState<{
            line: ILine;
            element: BaseFrame;
            overLines: OverlapLineInfo[];
        } | null>(null);

        const handleElementLineRemove = (
            line: ILine,
            element: BaseFrame | any,
            event: {
                evt: React.MouseEvent;
            },
            noCut: boolean = false
        ) => {
            if (!noCut) {
                line.isCut = true;
                if (element.lineElements) {
                    const lines = JSON.parse(JSON.stringify(element.lineElements));
                    lines?.forEach((line: any) => {
                        line = elements.find((el) => el.id === line.id);
                        moveUntil.handleLineMove(line, elements, false);
                        line.updateLines();
                    });
                }
            }
            if (element.type.startsWith('Line') && !noCut) {
                let newValue = elements.filter((ele) => ele.id != element.id);
                setElements([...newValue]);
                moveUntil.clearFrameRenderInfo(element, elements);
                setSelectedItems([]);
                return;
            }
            if (element.lines.every((item: any) => item.isCut)) {
                let newValue = elements.filter((ele) => ele.id != element.id);
                setElements([...newValue]);
                setSelectedItems([]);
                return;
            }

            if (element.type.startsWith('Line') && noCut) {
                setCurrentLineContext({
                    line,
                    element,
                    overLines: [],
                });
                setPopoverPosition({
                    x: event.evt.clientX,
                    y: event.evt.clientY,
                });
                checkOverlappingEdges();
                return;
            }

            let overLines: OverlapLineInfo[] = [];
            let update = false;
            elements.forEach((ele: any) => {
                ele.lines?.forEach((eleLine: any, index: any) => {
                    if (eleLine.id === line.id) return;
                    if ((eleLine.angle && !line.angle) || (line.angle && !eleLine.angle)) return;
                    if (lineUntil.isLinesOverlap(eleLine, line)) {
                        overLines.push({
                            element: ele,
                            lineIndex: index,
                        });
                        if (!noCut) {
                            eleLine.isCut = true;
                            if (ele.lineElements) {
                                const lines = JSON.parse(JSON.stringify(ele.lineElements));
                                lines?.forEach((line: any) => {
                                    line = elements.find((el) => el.id === line.id);
                                    moveUntil.handleLineMove(line, elements, false);
                                    line.updateLines();
                                });
                            }
                        }
                        update = true;
                    }
                });
            });

            if (!overLines.length) {
                element.update({});
                element.updateFrameBasedOnCutLines && element.updateFrameBasedOnCutLines();
                if (element.lines.every((item: any) => item.isCut)) {
                    let newValue = elements.filter((ele) => ele.id != element.id);
                    setElements([...newValue]);
                    setSelectedItems([]);
                }
                return;
            }
            setElements((pre) => [...pre]);
            if (!noCut) return;
            setCurrentLineContext({
                line,
                element,
                overLines,
            });
            setPopoverPosition({
                x: event.evt.clientX,
                y: event.evt.clientY,
            });
            checkOverlappingEdges();
        };

        const handleWeightConfirm = (weight: number) => {
            if (!currentLineContext) return;

            const { line, element, overLines } = currentLineContext;

            if (element.type.startsWith('Line')) {
                element.lines[0].weight = weight;
            } else {
                switch (weight) {
                    case 0:
                        // line.isCut = true;
                        // @ts-ignore
                        element.lines.find((l) => l.id == line.id).isCut = true;
                        // @ts-ignore
                        element.lines.find((l) => l.id == line.id).weight = 0;
                        overLines.forEach(({ element: overElement, lineIndex }) => {
                            if (overElement.lines && overElement.lines[lineIndex]) {
                                overElement.lines[lineIndex].isCut = true;
                                overElement.lines[lineIndex].weight = 0;
                                overElement.update({});
                                overElement.updateFrameBasedOnCutLines && overElement.updateFrameBasedOnCutLines();
                            }
                        });
                        break;
                    case 0.3:
                    case 1.2:
                    case 1:
                        // @ts-ignore
                        element.lines.find((l) => l.id == line.id).weight = weight;
                        overLines.forEach(({ element: overElement, lineIndex }) => {
                            if (overElement.type.startsWith('Line')) return;
                            if (
                                element.virtualFrame.x > overElement.virtualFrame.x ||
                                element.virtualFrame.y > overElement.virtualFrame.y
                            ) {
                                //    当前element在overElement右边或下边
                                overElement.lines[lineIndex].weight = weight;
                                overElement.lines[lineIndex].isCut = true;
                                if (overElement.lines && overElement.lines[lineIndex] && line.intersectionPoints) {
                                    // @ts-ignore
                                    element.lines.find((l) => l.id == line.id).intersectionPoints = [
                                        ...overElement.lines[lineIndex].intersectionPoints,
                                        ...element.lines.find((l) => l.id == line.id).intersectionPoints,
                                    ];
                                    overElement.update({});
                                }
                            } else {
                                element.lines.find((l) => l.id == line.id).isCut = true;
                                overElement.lines[lineIndex].weight = weight;

                                if (overElement.lines && overElement.lines[lineIndex] && line.intersectionPoints) {
                                    overElement.lines[lineIndex].intersectionPoints = [
                                        ...overElement.lines[lineIndex].intersectionPoints,
                                        ...line.intersectionPoints,
                                    ];
                                    overElement.update({});
                                }
                            }
                            //     overElement.lines[lineIndex].weight = 1;
                            //
                            //     if (overElement.lines && overElement.lines[lineIndex] && line.intersectionPoints) {
                            //         overElement.lines[lineIndex].intersectionPoints = [
                            //             ...overElement.lines[lineIndex].intersectionPoints,
                            //             ...line.intersectionPoints
                            //         ];
                            //         overElement.update({});
                            //     }
                        });
                        break;
                    case 1.1:
                        // right
                        element.lines.find((l) => l.id == line.id).weight = 1.1;
                        overLines.forEach(({ element: overElement, lineIndex }) => {
                            if (overElement.type.startsWith('Line')) return;
                            if (
                                element.virtualFrame.x > overElement.virtualFrame.x ||
                                element.virtualFrame.y > overElement.virtualFrame.y
                            ) {
                                //    当前element在overElement右边或下边
                                element.lines.find((l) => l.id == line.id).isCut = true;
                                overElement.lines[lineIndex].weight = 1.1;

                                if (overElement.lines && overElement.lines[lineIndex] && line.intersectionPoints) {
                                    overElement.lines[lineIndex].intersectionPoints = [
                                        ...overElement.lines[lineIndex].intersectionPoints,
                                        ...line.intersectionPoints,
                                    ];
                                    overElement.update({});
                                }
                            } else {
                                overElement.lines[lineIndex].weight = 1.1;
                                overElement.lines[lineIndex].isCut = true;
                                if (overElement.lines && overElement.lines[lineIndex] && line.intersectionPoints) {
                                    element.lines.find((l) => l.id == line.id).intersectionPoints = [
                                        ...overElement.lines[lineIndex].intersectionPoints,
                                        ...element.lines.find((l) => l.id == line.id).intersectionPoints,
                                    ];

                                    overElement.update({});
                                }
                            }
                        });
                        // element.lines.find(l => l.id == line.id).isCut = true
                        // element.lines.find(l => l.id == line.id).weight = 1
                        // overLines.forEach(({element: overElement, lineIndex}) => {
                        //     if (overElement.type.startsWith('Line')) return;
                        //     overElement.lines[lineIndex].weight = 1;
                        //     overElement.lines[lineIndex].isCut = true;
                        //
                        //     if (overElement.lines && overElement.lines[lineIndex] && line.intersectionPoints) {
                        //         // overElement.lines[lineIndex].intersectionPoints = [
                        //         //     ...overElement.lines[lineIndex].intersectionPoints,
                        //         //     ...line.intersectionPoints
                        //         // ];
                        //         element.lines.find(l => l.id == line.id).intersectionPoints = [
                        //             // ...line.intersectionPoints,
                        //             ...overElement.lines[lineIndex].intersectionPoints,
                        //             ...element.lines.find(l => l.id == line.id).intersectionPoints
                        //         ]
                        //
                        //         overElement.update({});
                        //     }
                        // });
                        break;
                    case 3:
                        let newLine = null;
                        if (lineUntil.isVertical(line)) {
                            newLine = new VerticalLineWindow(5, {
                                id: `Line-V_${Date.now()}`,
                                virtualFrame: {
                                    x: line.startPoint.x,
                                    y: line.startPoint.y,
                                    height: line.endPoint.y - line.startPoint.y,
                                    width: 5,
                                },
                            });
                        } else if (lineUntil.isHorizontal(line)) {
                            newLine = new HorizontalLineWindow(5, {
                                id: `Line-H_${Date.now()}`,
                                virtualFrame: {
                                    x: line.startPoint.x,
                                    y: line.startPoint.y,
                                    height: 5,
                                    width: line.endPoint.x - line.startPoint.x,
                                },
                            });
                        }

                        if (newLine) {
                            element.lines.find((l) => l.id == line.id).weight = 3;
                            overLines.forEach(({ element: overElement, lineIndex }) => {
                                if (overElement.type.startsWith('Line')) return;
                                overElement.lines[lineIndex].weight = 3;
                            });
                            newLine.style.color.border = 'blue';
                            setElements((prev) => [...prev, newLine]);
                        }
                        break;
                }
            }

            element.update({});
            setElements((prev) => [...prev]);
            // element.updateFrameBasedOnCutLines && element.updateFrameBasedOnCutLines();
            //
            // setCurrentLineContext(null);
            // setPopoverPosition(null);
            //
            // if (element.lines.every(item => item.isCut)) {
            //     setElements(prev => prev.filter(ele => ele.id !== element.id));
            //     setSelectedItems([]);
            // }
        };

        const handleLineCut = (e: any, line: HorizontalLineWindow | VerticalLineWindow) => {
            if (line.type == ShapeType.LineV) {
                let cutLine: any = {
                    y1: e.cut.startPoint.y,
                    y2: e.cut.endPoint.y,
                };
                let originLine: any = {
                    y1: line.points[0].y,
                    y2: line.points[1].y,
                };
                let newLine: any = moveUntil.cutLongerLine(cutLine, originLine);
                if (newLine) {
                    let newElements: any = [];
                    newLine.forEach((item: any, index: any) => {
                        let newElement = new VerticalLineWindow(5, {
                            id: `Line-v_${Date.now()}_${index}`,
                            virtualFrame: {
                                x: e.cut.startPoint.x,
                                y: item.y1,
                                width: line.virtualFrame.width,
                                height: Math.abs(item.y2 - item.y1),
                            },
                        });
                        newElements.push(newElement);
                    });

                    let tempElements = elements.filter((item: any) => item.id !== line.id);
                    tempElements.push(...newElements);
                    setElements([...tempElements]);
                    moveUntil.clearFrameRenderInfo(line, tempElements);
                    newElements.forEach((item: any) => {
                        moveUntil.handleLineMove(item, tempElements);
                    });
                } else {
                    let tempElements = elements.filter((item: any) => item.id !== line.id);
                    setElements([...tempElements]);
                    moveUntil.clearFrameRenderInfo(line, tempElements);
                }
            } else if (line.type == ShapeType.LineH) {
                let cutLine: any = {
                    x1: e.cut.startPoint.x,
                    x2: e.cut.endPoint.x,
                };
                let originLine: any = {
                    x1: line.points[0].x,
                    x2: line.points[1].x,
                };
                let newLine: any = moveUntil.cutLongerLineX(cutLine, originLine);
                if (newLine) {
                    let newElements: any = [];
                    newLine.forEach((item: any, index: any) => {
                        let newElement = new HorizontalLineWindow(5, {
                            id: `Line-v_${Date.now()}_${index}`,
                            virtualFrame: {
                                x: item.x1,
                                y: e.cut.startPoint.y,
                                width: Math.abs(item.x2 - item.x1),
                                height: line.virtualFrame.height,
                            },
                        });
                        newElements.push(newElement);
                    });

                    let tempElements = elements.filter((item: any) => item.id !== line.id);
                    tempElements.push(...newElements);
                    setElements([...tempElements]);
                    moveUntil.clearFrameRenderInfo(line, tempElements);
                    newElements.forEach((item: any) => {
                        moveUntil.handleLineMove(item, tempElements);
                    });
                } else {
                    let tempElements = elements.filter((item: any) => item.id !== line.id);
                    setElements([...tempElements]);
                    moveUntil.clearFrameRenderInfo(line, tempElements);
                }
            }
        };

        const onPointMoveEnd = (e: any, index: number) => {
            const currentElement = elements.find((el) => el.id === selectedItems[0]?.id);
            if (!currentElement || currentElement.type !== 'Triangle') {
                setDashedCircle(null);
                return;
            }

            if (dashedCircle) {
                (currentElement as TriangleWindow).updateSingleVertex(index, {
                    x: dashedCircle.x,
                    y: dashedCircle.y,
                });

                setDashedCircle(null);

                setElements([...elements]);
                checkOverlappingEdges();
                onChange?.({ elements }, 'change');
            }
        };

        const updateAreas = (
            areas: Array<{
                label: number;
                area: number;
                lines: Array<{
                    id: string;
                    start_point: number[];
                    end_point: number[];
                }>;
                arcs: Array<any>;
            }>
        ) => {
            if (value.from == 'quote' || value.from == 'designForUnit') return;
            let newZones: any[] = areas.map((area, index) => {
                const { points, segments } = zoneUntil.processAreaPoints(area.lines, area.arcs);
                return {
                    ...area,
                    elementId: `zone_${Date.now()}_${index}_${area.label}`,
                    points,
                    segments,
                };
            });
            elements.forEach((element) => {
                // if (element instanceof BaseFrame) return;
                if (element.type.startsWith('SDL') || element.type.startsWith('TDL')) {
                    setZones((pre) => {
                        let nearZone = zoneUntil.findContainingZone(pre, element as any);
                        let index = pre.findIndex((z) => z.elementId == nearZone?.elementId);
                        if (!pre[index]) return pre;
                        if (!pre[index]?.dividers) pre[index].dividers = [];
                        pre[index]?.dividers?.push({
                            id: element.id,
                            length: element.type.includes('-h')
                                ? element.virtualFrame.width
                                : element.virtualFrame.height,
                            start_point: {
                                x: element.virtualFrame.x,
                                y: element.virtualFrame.y,
                            },
                            end_point: element.type.includes('-h')
                                ? {
                                      x: element.virtualFrame.x + element.virtualFrame.width,
                                      y: element.virtualFrame.y,
                                  }
                                : {
                                      x: element.virtualFrame.x,
                                      y: element.virtualFrame.y + element.virtualFrame.height,
                                  },
                            type: element.type,
                        });
                        return pre;
                    });
                    // newZones = zoneUntil.updateZonesDivider(element, newZones, elements);
                    return;
                }
                if (element instanceof BaseOperation) {
                    let nearZone = updateOperInZone(element, newZones);
                    if (nearZone) {
                        let index = newZones.findIndex((z) => z.elementId == nearZone.elementId);
                        if (!nearZone.operations) nearZone.operations = [];
                        nearZone.operations.push(element);
                        newZones.splice(index, 1, nearZone);
                    }
                }

                if (element instanceof GroupFrame) {
                    // element.zones = zoneUntil.findZonesInGroup(element, newZones);
                    // element.children?.forEach(child => {
                    //     if(!(child instanceof BaseOperation)) return;
                    //     let nearZone = updateOperInZone(child, newZones);
                    //     if(nearZone) {
                    //         let index = newZones.findIndex(z => z.elementId == nearZone.elementId)
                    //         if(!nearZone.operations) nearZone.operations = []
                    //         nearZone.operations.push(child)
                    //         newZones.splice(index, 1, nearZone);
                    //     }
                    // })
                }
            });
            setZones([...zones, ...newZones]);

            setTimeout(() => {
                if (value.from == 'quote') onChangeUnit?.(baseUntil.getUnitsData(elements, zones, value.sizeMultiples));
            }, 500);
        };

        const calcElementAreas = (elements: any) => {
            const { elementSegments, intersectionPoints } = zoneUntil.calculateLineIntersections(elements);
            const segments = [...elementSegments];
            const inPoints = intersectionPoints;

            // elements.forEach((ele:any) => {
            //     if(ele instanceof GroupFrame) {
            //         const {elementSegments, intersectionPoints} = zoneUntil.calculateLineIntersections(ele.children);
            //         segments.push(...elementSegments)
            //         intersectionPoints.forEach((point, key) => {
            //             inPoints.set(key, point)
            //         })
            //         ele.render = false
            //         ele.children = ele.children.filter(item => item.type != 'render');
            //     }
            // })

            const finalSegments = baseUntil.filterOverlappingLines(elements, segments, inPoints);
            const uniqueSegments = baseUntil.removeDuplicateSegments(finalSegments);
            return uniqueSegments;
        };

        const handlePointClick = (point: any) => {
            let element: any = elements.find((element) => {
                return point.id.startsWith(element.id);
            });

            if (value.from == 'quote') point.unitId = element.unitId;
            // point.unitId =
            setTempDimensionPoints((prev) => {
                if (prev.length >= 2) {
                    return [point];
                }

                if (prev.length === 1) {
                    const startPoint: any = prev[0];
                    const endPoint: any = point;

                    if (startPoint.x === endPoint.x && startPoint.y === endPoint.y) {
                        return prev;
                    }
                    let canEdit = false;
                    if (
                        startPoint.elementId != endPoint.elementId &&
                        (startPoint.elementId.startsWith('SDL') ||
                            startPoint.elementId.startsWith('TDL') ||
                            endPoint.elementId.startsWith('SDL') ||
                            endPoint.elementId.startsWith('TDL'))
                    ) {
                        canEdit = true;
                    }

                    const newDimension = new DimensionData(
                        {
                            id: `dimension_${Date.now()}`,
                            points: [startPoint, endPoint],
                        },
                        canEdit
                    );
                    setElements((prevElements) => {
                        // if(value.from == 'quote')
                        debouncedOnChange([...prevElements, newDimension], zones, value.from);
                        return [...prevElements, newDimension];
                    });
                    return [];
                }

                return [...prev, point];
            });
        };

        const [editingDimension, setEditingDimension] = useState<{
            dimension: any;
            position: { x: number; y: number };
            value: string;
        } | null>(null);

        const handleDimensionUpdate = (dimension: any, newValue: number) => {
            if (!dimension) return;
            let trueNewValue = (newValue * 25.4) / value.sizeMultiples;
            let sdlOnIndex = 0;
            let moveDivider = elements.find((element) => {
                if (
                    (element.id.startsWith('SDL') || element.id.startsWith('TDL')) &&
                    element.id == dimension.points[0].elementId
                ) {
                    return true;
                }
                if (
                    (element.id.startsWith('SDL') || element.id.startsWith('TDL')) &&
                    element.id == dimension.points[1].elementId
                ) {
                    sdlOnIndex = 1;
                    return true;
                }
                return false;
            });
            if (!moveDivider) return;

            let initialFrame = JSON.parse(JSON.stringify(moveDivider.virtualFrame));
            if (dimension.direction == 'vertical') {
                //      移动y方向
                let diff = trueNewValue - Math.abs(dimension.points[0].y - dimension.points[1].y);
                let currentOnTop =
                    sdlOnIndex == 0
                        ? dimension.points[0].y < dimension.points[1].y
                        : dimension.points[1].y < dimension.points[0].y;
                if (currentOnTop) diff = diff * -1;

                moveDivider.move(0, diff);
                onMoveEnd({ initialFrame }, moveDivider as any);
            } else {
                //      移动x方向
                let diff = trueNewValue - Math.abs(dimension.points[0].x - dimension.points[1].x);
                let currentOnTop =
                    sdlOnIndex == 0
                        ? dimension.points[0].x < dimension.points[1].x
                        : dimension.points[1].x < dimension.points[0].x;
                if (currentOnTop) diff = diff * -1;

                moveDivider.move(diff, 0);
                onMoveEnd({ initialFrame }, moveDivider as any);
            }

            updateDimensions();
            setEditingDimension(null);
        };

        const renderDimension = (dimension: any) => {
            if (dimension.points.length !== 2) return null;

            const handleRemove = (e: any) => {
                removeElementById(dimension.id);
            };

            const handleEdit = (e: any) => {
                if (!dimension.canEdit) return;
                const stage = stageRef.current;
                if (!stage) return;
                const pointerPos = stage.getPointerPosition();
                if (!pointerPos) return;
                const calculatedLength =
                    dimension.direction === 'horizontal'
                        ? Math.abs(dimension.points[1].x - dimension.points[0].x) * value.sizeMultiples
                        : Math.abs(dimension.points[1].y - dimension.points[0].y) * value.sizeMultiples;

                setEditingDimension({
                    dimension,
                    position: {
                        x: e.evt.x,
                        y: e.evt.y,
                    },
                    // position: {
                    //     x: pointerPos.x,
                    //     y: pointerPos.y
                    // },
                    value: (calculatedLength / 25.4).toFixed(2),
                });
            };

            return (
                <Group key={dimension.id}>
                    <MeasurementLabel
                        dimension={dimension}
                        points={dimension.points}
                        onRemoveElement={handleRemove}
                        onLabelClick={(ref: any, value: any) => {}}
                        openEdit={handleEdit}
                    />
                </Group>
            );
        };

        const importData = (jsonData: string | object, init: boolean = false) => {
            try {
                const importedElements = importElements(jsonData, value.lineWidth);
                if (init) {
                    setElements([...importedElements]);
                    return [...importedElements];
                } else if (importedElements.length) {
                    setElements([...elements, ...importedElements]);
                    return importedElements;
                } else {
                    setElements([]);
                    return [];
                }
            } catch (error) {
                return [];
            }
        };

        const sortElementsBySize = (elements: any[]) => {
            if (!elements) return [];
            const dividerElements = elements?.filter(
                (element) =>
                    element instanceof SDLHorizontal ||
                    element instanceof SDLVertical ||
                    element instanceof TDLHorizontal ||
                    element instanceof TDLVertical
            );

            const operationElements = elements.filter(
                (element) =>
                    element instanceof BaseOperation &&
                    !(
                        element instanceof SDLHorizontal ||
                        element instanceof SDLVertical ||
                        element instanceof TDLHorizontal ||
                        element instanceof TDLVertical
                    )
            );

            const otherElements = elements.filter(
                (element) =>
                    !(element instanceof BaseOperation) &&
                    !(
                        element instanceof SDLHorizontal ||
                        element instanceof SDLVertical ||
                        element instanceof TDLHorizontal ||
                        element instanceof TDLVertical
                    )
            );

            const sortedDividerElements = [...dividerElements].sort((a, b) => {
                const areaA = a.virtualFrame.width * a.virtualFrame.height;
                const areaB = b.virtualFrame.width * b.virtualFrame.height;
                return areaB - areaA;
            });

            const sortedOperationElements = [...operationElements].sort((a, b) => {
                const areaA = a.virtualFrame.width * a.virtualFrame.height;
                const areaB = b.virtualFrame.width * b.virtualFrame.height;
                return areaB - areaA;
            });

            const sortedOtherElements = [...otherElements].sort((a, b) => {
                const areaA = a.virtualFrame.width * a.virtualFrame.height;
                const areaB = b.virtualFrame.width * b.virtualFrame.height;
                return areaB - areaA;
            });

            sortedOtherElements.forEach((element, index) => {
                element.zIndex = index;
            });

            const operationBaseIndex = sortedOtherElements.length;
            sortedOperationElements.forEach((element, index) => {
                element.zIndex = operationBaseIndex + index;
            });

            const dividerBaseIndex = operationBaseIndex + sortedOperationElements.length;
            sortedDividerElements.forEach((element, index) => {
                element.zIndex = dividerBaseIndex + index;
            });
            return [...sortedOtherElements, ...sortedOperationElements, ...sortedDividerElements];
        };

        // useEffect(() => {
        //
        //     let points = zoneUntil.findOverlappingPoints(elements);
        //     points = points.filter(point => {
        //         let overCount = 0
        //         elements.forEach(element => {
        //             element.lines?.forEach(line => {
        //                 if (line.isCut) {
        //                     if (line.startPoint.x == point.point.x && line.startPoint.y == point.point.y) overCount++;
        //                     if (line.endPoint.x == point.point.x && line.endPoint.y == point.point.y) overCount++;
        //                 } else line.hiddenSegment?.forEach(segment => {
        //                     if (segment.startPoint.x == point.point.x && segment.startPoint.y == point.point.y) overCount++;
        //                     if (segment.endPoint.x == point.point.x && segment.endPoint.y == point.point.y) overCount++;
        //                 })
        //
        //             })
        //         })
        //         return overCount <= 2;
        //     })
        //     setOverlappingPoints(points);
        // }, [elements]);

        const checkAndExpandCanvas = (element: BaseData) => {
            if (!element) return;

            const rightEdge = element.virtualFrame.x + element.virtualFrame.width;
            const bottomEdge = element.virtualFrame.y + element.virtualFrame.height;

            let canvasChanged = false;
            let newCanvasWidth = canvasSize.width;
            let newCanvasHeight = canvasSize.height;

            if (rightEdge > canvasSize.width) {
                newCanvasWidth = rightEdge + 100;
                canvasChanged = true;
            }

            if (bottomEdge > canvasSize.height) {
                newCanvasHeight = bottomEdge + 100;
                canvasChanged = true;
            }

            if (canvasChanged) {
                setCanvasSize((pre) => ({
                    width: pre.width > newCanvasWidth ? pre.width : newCanvasWidth,
                    height: pre.height > newCanvasHeight ? pre.height : newCanvasHeight,
                }));
                //
                // if (stageRef.current) {
                //   stageRef.current.width(newCanvasWidth);
                //   stageRef.current.height(newCanvasHeight);
                // }
            }

            return canvasChanged;
        };

        const exportData = (save: boolean = false) => {
            return {
                components: elements,
                zones: zones?.map((zone) => {
                    return zoneUntil.updateZoneLines(zone);
                }),
            };
            // return updateParams(elements);
        };

        const handleCopy = (e: any, frame: BaseData) => {
            const copyData = { ...JSON.parse(JSON.stringify(frame)), id: '' };
            let copyFrame: any = createElement(copyData, 0, true);

            const { x, y } = handleOverlop(copyFrame, {}, elements);
            const dx = x - copyFrame.virtualFrame.x;
            const dy = y - copyFrame.virtualFrame.y;
            copyFrame.move(dx, dy);

            setElements((pre) => [...pre, copyFrame]);
            checkAndExpandCanvas(copyFrame);
        };

        const [renderModalVisible, setRenderModalVisible] = useState(false);
        const [currentRenderElement, setCurrentRenderElement] = useState<any>(null);
        const defaultRenderSettings: any = {
            frameBorder: 10,
            frameColor: '#EDEDEC',
            casementBorder: 10,
            casementColor: '#ffffff',
        };

        const handleRenderConfirm = (settings: any) => {
            if (currentRenderElement) {
                calcZonesByGroup(currentRenderElement, settings);
            }
            setRenderModalVisible(false);
        };

        const handleRender = (e: any, frame: GroupFrame) => {
            setCurrentRenderElement(frame);
            setRenderModalVisible(true);
        };

        const removeElementById = (elementId: string) => {
            setZones((pre) => {
                pre.forEach((z) => {
                    z.dividers = z.dividers?.filter((d) => d.id != elementId);
                });
                setSelectedItems([]);
                setElements((pres: any) => {
                    let newElement = pres.filter((element: any) => element.id !== elementId);
                    newElement.forEach((ele: any) => {
                        if (ele instanceof GroupFrame) {
                            if (ele.dividerEles) {
                                ele.dividerEles = ele.dividerEles.filter((d) => d.id != elementId)
                                //gn:删除groupFrame中的divider关系
                                ele.removeDividerRelation(elementId);
                            };
                        }
                    });
                    if (value.from == 'quote')
                        onChangeUnit?.(baseUntil.getUnitsData(newElement, pre, value.sizeMultiples));

                    if (elementId.startsWith('SDL') || elementId.startsWith('TDL')) {
                        newElement = newElement.filter((ele: any) => {
                            if (!(ele instanceof DimensionData)) return true;
                            if (ele.points.find((point) => point.elementId == elementId)) {
                                return false;
                            } else return true;
                        });
                    }

                    // if(value.from == 'quote')
                    debouncedOnChange(newElement, pre, value.from);
                    return newElement;
                });
                return pre;
            });
        };

        const findNearElement = (frame: any) => {
            const updatedElements = [...elements];
            let near = null;
            for (const element of elements) {
                if (element.id === frame.id || element instanceof BaseOperation || element.type?.startsWith('Line')) {
                    continue;
                }

                if (baseUntil.isFrameInsideElement(frame.virtualFrame, element)) {
                    near = element;
                    break;
                }
            }
            return near;
            // setElements(updatedElements);
            //
            // console.log('Operations updated based on container elements');
        };

        const [renderConfig, setRenderConfig] = useState({
            frameBorder: 10,
            frameColor: '#EDEDEC',
            casementBorder: 10,
            casementColor: '#ffffff',
        });

        const render = (config: any, zones: IZone[], group?: GroupFrame) => {
            if (config) setRenderConfig(config);
            let renderSettings = config || renderConfig;
            let newElements: any[] = [];

            let weight3Zones = new Map<string, { items: IZone[]; seg: ISegment }>();
            zones.forEach((zone) => {
                zone.segments.forEach((seg) => {
                    if (seg.weight == 3) {
                        let values = weight3Zones.get(seg.id)?.items || [];
                        values.push(zone);
                        weight3Zones.set(seg.id, { seg, items: values });
                    }
                });
            });
            weight3Zones.forEach((value) => {
                const isV = value.seg.start.y == value.seg.end.y;
                if (value.items.length < 2) return;
                if (isV) {
                    if (value.items[0].centroid[1] > value.items[1].centroid[1]) {
                        let updateIndex = zones.findIndex((z) => z.show_id == value.items[0].show_id);
                        zones[updateIndex] = zoneUntil.moveZone(zones[updateIndex], 0, renderSettings.frameBorder);
                    } else {
                        let updateIndex = zones.findIndex((z) => z.show_id == value.items[1].show_id);
                        zones[updateIndex] = zoneUntil.moveZone(zones[updateIndex], 0, renderSettings.frameBorder);
                    }
                }
                if (!isV) {
                    value.items[0].color = renderSettings.frameColor;
                    if (value.items[0].centroid[0] > value.items[1].centroid[0]) {
                        let updateIndex = zones.findIndex((z) => z.show_id == value.items[0].show_id);
                        zones[updateIndex] = zoneUntil.moveZone(zones[updateIndex], renderSettings.frameBorder, 0);
                    } else {
                        let updateIndex = zones.findIndex((z) => z.show_id == value.items[1].show_id);
                        zones[updateIndex] = zoneUntil.moveZone(zones[updateIndex], renderSettings.frameBorder, 0);
                    }
                }
                let points: IPointPostion[] = [
                    { x: value.seg.start.x, y: value.seg.start.y },
                    { x: value.seg.end.x, y: value.seg.end.y },
                    {
                        x: !isV ? value.seg.end.x + renderSettings.frameBorder : value.seg.end.x,
                        y: !isV ? value.seg.end.y : value.seg.end.y + renderSettings.frameBorder,
                    },
                    {
                        x: !isV ? value.seg.start.x + renderSettings.frameBorder : value.seg.start.x,
                        y: !isV ? value.seg.start.y : value.seg.start.y + renderSettings.frameBorder,
                    },
                ];
                let segments: ISegment[] = points.map((point, index) => {
                    const nextIndex = (index + 1) % 4;
                    return {
                        id: value.seg + 'render-' + index,
                        start: point,
                        end: points[nextIndex],
                    };
                });
                let newElement = new RenderData(
                    'render' + Date.now(),
                    {
                        x: points[0]?.x,
                        y: points[0]?.y,
                        height: 10,
                        width: 10,
                    },
                    'border'
                ).updateInfo(points, segments, renderSettings.frameColor);
                if (group) {
                    group.addChild(newElement);
                } else newElements.push(newElement);
            });
            let newZone = zones.map((zone) => {
                let groupEle: any = elements.find((el: any) => {
                    if (!(el instanceof GroupFrame) && !el.zones) return false;
                    if (el.zones.find((z: any) => z.elementId == zone.elementId)) return true;
                    else return false;
                });
                if (groupEle && !group) return zone;
                let frameBorder = renderSettings.frameBorder;
                let casementBorder =
                    !zone.operations || zone.operations.length == 0 ? 0 : renderSettings.casementBorder;
                let { points, segments } = zoneUntil.getIndentedZone(zone, frameBorder, zones, true);
                zone.color = renderSettings.frameColor;
                zone.border = { frame: frameBorder, casement: casementBorder };

                let newElement = new RenderData(
                    'render_' + zone.elementId + '_' + Date.now(),
                    {
                        x: points[0]?.x,
                        y: points[0]?.y,
                        height: 10,
                        width: 10,
                    },
                    'border'
                ).updateInfo(points, segments, renderSettings.casementColor);

                if (group) {
                    group.addChild(newElement);
                } else if (groupEle) {
                    groupEle.addChild(newElement);
                } else newElements.push(newElement);
                let { points: contentPoints, segments: contentSegments } = zoneUntil.getIndentedZone(
                    zone,
                    frameBorder + casementBorder,
                    zones,
                    false,
                    casementBorder
                );
                let contentEle = new RenderData(
                    'render_' + zone.elementId + '_' + Date.now() + 1,
                    {
                        x: contentPoints[0]?.x,
                        y: contentPoints[0]?.y,
                        height: 10,
                        width: 10,
                    },
                    'glasses'
                ).updateInfo(contentPoints, contentSegments, '#F1F8FE');
                if (group) {
                    group.addChild(contentEle);
                } else if (groupEle) {
                    groupEle.addChild(contentEle);
                } else newElements.push(contentEle);
                zone.inner = { points: contentPoints, segments: contentSegments };
                zone.operations = sortElementsBySize(zone.operations as any);
                zone.operations?.forEach((oper: any) => {
                    oper = oper.update ? oper : elements.find((el) => el.id == oper.id);
                    if (!oper) return;
                    updateOperInZone(oper, zones, zone, contentEle, group);
                });
                zone.dividers?.forEach((divider) => {
                    const centerY = divider.type.includes('-h');
                    const centerX = divider.type.includes('-v');
                    let element: any = elements.find((el) => el.id == divider.id);
                    zoneUntil.updateDivider(element, zones);
                    //gn:更改divider的长度为virtualFrame里面的值
                    divider.length = centerY ? element?.virtualFrame.width : element?.virtualFrame.height;
                    //gn:计算divider在groupFrame中与墙是否有重叠
                    calcPocketWallOverlap(divider,group);
                });
                return zone;
            });
            if (group) {
                group.children = sortElementsBySize([...group.children]);
            }
            setElements((pre) => {
                if (value.from != 'quote') debouncedOnChange(pre, zones, value.from);
                return sortElementsBySize([...pre, ...newElements]);
            });
            if (zones.length && !group) setSettingValue((pre: any) => ({ ...pre, noRenderBase: true }));
            if (group && zones.length) group.render = true;
            if (!group) {
                setZones(newZone);
                baseUntil.updateTemplateCode(elements, newZone);
            }

            setTimeout(() => {
                if (value.from == 'quote') onChangeUnit?.(baseUntil.getUnitsData(elements, zones, value.sizeMultiples));
                if (value.from == 'quote' || value.from == 'designForUnit')
                    setSettingValue((pre: any) => ({ ...pre, noRenderBase: true }));
            }, 500);
        };

        const updateOperInZone = (oper: any, newZone: IZone[], zone?: IZone, contentEle?: RenderData, group?: any) => {
            if (!oper) return;
            oper = elements.find((el) => el.id == oper.id) || oper;
           
            let zones = newZone;
            let {nearZone, bounds, zoneIndentSegs, borderWidth} = zoneUntil.getZoneInfoByGlass(oper, zones, zone, 2);
            
            if (!nearZone){
                //如果未找到新区域，则直接返回旧区域，不做位置调整
                return zone;
            }
            
            const centroid = nearZone?.centroid ?? [];
            const zoneWidth = bounds?.width ?? 0;       //区域缩进后的宽度
            const zoneHeight = bounds?.height ?? 0;     //区域缩进后的高度
            const zoneMinX = bounds?.minX ?? 0;         //区域缩进后的最小X坐标
            const zoneMinY = bounds?.minY ?? 0;         //区域缩进后最小的Y坐标
            const zoneMaxX = bounds?.maxX ?? 0;         //区域缩进后的最大X坐标
            const zoneSegments = zoneIndentSegs ?? [];  //区域缩进后的线段集合

            switch (oper.type) {
                case OperationType.ARROW_LR:
                case OperationType.ARROW_TD:
                case OperationType.MOTO_LR:
                case OperationType.MOTO_TD:
                case OperationType.Folding_LEFT:
                case OperationType.Folding_RIGHT:
                    {
                        //gn:水平居中，垂直居中，不改变大小来对齐
                        if (nearZone?.segments?.length < 3){
                            //半圆或圆形,以质心位置进行位置调整
                            oper.update({
                                x: centroid[0],
                                y: centroid[1],
                            });
                        } else {
                            //矩形区域或其他区域,以中心点作为调整坐标
                            oper.update({
                                x: zoneMinX + zoneWidth / 2 - oper.virtualFrame.width / 2,
                                y: zoneMinY + zoneHeight / 2 - oper.virtualFrame.height / 2,
                            });         
                        }
                    }
                    break;
                case OperationType.Fixed_W:
                case OperationType.Fixed_D:
                    {
                        //gn:水平居中，垂直居中，不改变大小，有偏移量
                        if (nearZone.segments.length < 3){
                            //半圆或圆形,以质心位置进行位置调整
                            oper.update({
                                x: centroid[0] + ((oper.virtualFrame.width / 2) * -1),
                                y: centroid[1] + ((oper.virtualFrame.height / 2) * -1),
                    });
                        } else {
                            //矩形区域或其他区域，以中心点作为调整坐标
                            oper.update({
                                x: zoneMinX + zoneWidth / 2 - oper.virtualFrame.width / 2,
                                y: zoneMinY + zoneHeight / 2 - oper.virtualFrame.height / 2,
                            });         
                        }
                    }
                    break;
                case OperationType.PIVOT_H:
                case OperationType.PIVOT_V:
                case OperationType.RAIL_2:
                case OperationType.RAIL_4:
                case OperationType.INSWING:
                case OperationType.OUTSWING:
                case OperationType.ACTIVE:
                case OperationType.PASSIVE:
                case OperationType.MOTORIZED:
                case OperationType.FOLDING:
                    {
                        if (nearZone.segments.length < 3){
                            //半圆或圆形,以质心位置进行位置调整
                            if ( group){
                                //不处理
                            } else {
                                oper.update({
                                    x: centroid[0],
                                    y: centroid[1],
                                });
                            }
                        } else {
                            //gn：矩形区域或拼接区域，使用缩进后的线段集合zoneSegments，过滤掉所有的Line/Triangle/Arch线段，然后组成一个新区域，将oper元素显示在这个新区域内
                            
                            if (group && nearZone && nearZone?.segments.length >= 4){
                                let segments = zoneSegments.filter((seg)=>{
                                    return !seg.id.startsWith('Line') && !seg.id.startsWith('Triangle') && !seg.id.startsWith('Arch');
                                })
                        let info = zoneUntil.calculateSegmentsBoundingBox(segments);
                                let points: IPointPostion[] = [];
                        points.push({ x: info?.boundingBox.minX, y: info?.boundingBox.minY });
                        points.push({ x: info?.boundingBox.minX, y: info?.boundingBox.maxY });
                        points.push({ x: info?.boundingBox.maxX, y: info?.boundingBox.maxY });
                                
                                let res = baseUntil.findNearestPoint(oper.virtualFrame, points);
                                if (res){
                                    const { point: finalPoint, index } = res;
                                     console.log(`######## updateOperInZone operation.type = ${oper.type} finalPoint = ${JSON.stringify(finalPoint)} index = ${index}`);
                        if (finalPoint)
                            oper.update({
                                x: index == 2 ? finalPoint.x - oper.virtualFrame.width : finalPoint.x,
                                y: index > 0 ? finalPoint.y - oper.virtualFrame.height : finalPoint.y,
                            });
                                }   
                            } else if (nearZone.segments.length === 3) {
                                
                            } else {
                                const params = {
                                    x: zoneMinX,
                                    y: zoneMinY,
                                }
                                oper.update(params);
                            }
                        }
                    }
                    break;
                case OperationType.DashedLineH:
                    {
                    let orgY = oper.virtualFrame.y;
                        if (nearZone.segments.length < 3){
                            //半圆区域
                            if(nearZone.segments.every(segment => segment.isArc)) {
                                oper.update({
                                    y: centroid[1],
                                    x: centroid[0] - zoneWidth / 2,
                                    width: zoneWidth,
                                });
                            }else {
                                let newWidth = zoneWidth / 5 * 4
                                oper.update({
                                    y: centroid[1] - 10,
                                    x: centroid[0] - newWidth / 2,
                                    width: newWidth ,
                                });
                            }
                        } else {
                            if (nearZone.segments.length == 3 && nearZone.segments.every((e) => !e.isArc)){
                        let width = oper.virtualFrame.width / 2;
                        oper.update({
                            x: oper.virtualFrame.x + oper.virtualFrame.width / 2 - width / 2,
                                    width,
                                });
                            } else {
                                oper.update({
                                    x: zoneMinX,
                                    y: zoneMinY + zoneWidth / 2,
                                    width: zoneWidth,
                                   
                        });
                    }
                        }
                        let dy = orgY - oper.virtualFrame.y;
                        oper.move(0, dy);
                        oper.virtualFrame.height = 5;
                    }
                    break;
                case OperationType.DashedLineV:
                    {
                    let orgX = oper.virtualFrame.x;
                        if (nearZone.segments.length < 3){
                            //半圆区域
                            if(nearZone.segments.every(segment => segment.isArc)) {
                                oper.update({
                                    x: centroid[0],
                                    y: centroid[1] - zoneHeight / 2,
                                    height: zoneHeight
                                });
                            }else {
                                oper.update({
                                    x: centroid[0],
                                    y: centroid[1] - zoneHeight / 2 - 10,
                                    height: zoneHeight ,
                                });
                            }   
                        } else {
                            //矩形区域
                            oper.update({
                                x: zoneMinX + zoneWidth / 2,
                                y: zoneMinY,
                                height: zoneHeight
                            });
                        }
                    let dx = orgX - oper.virtualFrame.x;
                    oper.move(dx, 0);
                    oper.virtualFrame.width = 5;
                    }
                    break;
                case OperationType.ANGLE_LEFT:
                case OperationType.ANGLE_RIGHT:
                case OperationType.ANGLE_UP:
                case OperationType.ANGLE_DOWN:
                    updateAngleOper(oper,contentEle, nearZone, bounds, zoneSegments, borderWidth);
                    break;
                case OperationType.HARDWARE_HL:
                    {
                        //垂直居中，不改变大小，有偏移量
                        let offset = {x: -15, y: -5} 
                        if (!zone){
                            //如果初始区域不存在，则更改偏移量
                            offset = {x: 0, y: -5}
                        }

                        if (nearZone?.segments?.length < 3){
                            //半圆或圆形
                            oper.update({
                                x: centroid[0] + offset.x,
                                y: centroid[1]+ offset.y,
                            });
                        } else {
                            const params = {
                                x: zoneMinX,
                                y: zoneMinY + zoneHeight / 2
                            }
                            if (offset?.x) params.x = params.x + offset.x;
                            if (offset?.y) params.y = params.y + offset.y;
                            oper.update(params);
                        }    
                    }
                    break;
                case OperationType.HARDWARE_HR:
                    {
                        //垂直居中，不改变大小，有偏移量
                        let offset = {x: -25, y: -5} 
                        if (!zone){
                            //如果初始区域不存在，则更改偏移量
                            offset = {x: -40, y: -5}
                        }

                        if (nearZone?.segments?.length < 3){
                            //半圆或圆形
                            oper.update({
                                x: centroid[0] + offset.x,
                                y: centroid[1]+ offset.y,
                            });
                        } else {
                            const params = {
                                x: zoneMaxX,
                                y: zoneMinY + zoneHeight / 2
                        }
                            if (offset?.x) params.x = params.x + offset.x;
                            if (offset?.y) params.y = params.y + offset.y;
                            oper.update(params);
                        }
                    }
                    break;
                case OperationType.HARDWARE_V:
                    {
                        // if (value.from == 'designForUnit') {
                        //     break;
                        // }

                        let offset = {x: 0, y: 0}
                        let hardwareX = zoneMinX; 
                        if (zone){
                            //如果初始区域存在
                            if (oper.virtualFrame.x > zone?.centroid[0]){
                                offset = {x: -5, y: -15}
                                hardwareX = zoneMaxX;
                            } else {
                                offset = {x: -15, y: -15}  
                            }
                        
                        }

                        if (nearZone?.segments?.length < 3){
                            //半圆或圆形
                            oper.update({
                                x: centroid[0] + offset.x,
                                y: centroid[1]+ offset.y,
                            });
                        } else {
                            const params = {
                                x: hardwareX,
                                y: zoneMinY + zoneHeight / 2
                            }
                            if (offset?.x) params.x = params.x + offset.x;
                            if (offset?.y) params.y = params.y + offset.y;
                            oper.update(params);
                        }
                    }
                    break;
            }
            if (
                        zone &&
                (oper.type == OperationType.RAIL_4 ||
                    oper.type == OperationType.RAIL_2 ||
                    oper.type == OperationType.INSWING ||
                    oper.type == OperationType.OUTSWING)
                    ) {
                let overEle = zone.operations?.find(
                    (op) => op.type == OperationType.MOTORIZED || op.type == OperationType.FOLDING
                );
                if (overEle) {
                    const dx = overEle.virtualFrame.x + overEle.virtualFrame.width - oper.virtualFrame.x - 10;
                    oper.move(dx, 0);
                }
            }

            return nearZone;
        };



        /**
         * 更新angle组件位置
         * @param oper angle组件
         * @param contentEle RenderData元素，render模式下，contentEle存在(原有代码判断条件)
         * @param zone 当前区域
         * @param bounds 区域缩进后的边界数据
         * @param zoneIndentSegs 区域缩进后的线段集合
         * @param borderWidth 区域边框宽度
         * @returns 
         */
        const updateAngleOper = (oper: any, contentEle: RenderData | undefined, zone: IZone, bounds: any,zoneIndentSegs: ISegment[],borderWidth: number)=>{
            const centroid = zone?.centroid ?? [];
            const zoneWidth = bounds?.width ?? 0;       //区域缩进后的宽度
            const zoneHeight = bounds?.height ?? 0;     //区域缩进后的高度
            const zoneMinX = bounds?.minX ?? 0;         //区域缩进后的最小X坐标
            const zoneMinY = bounds?.minY ?? 0;         //区域缩进后最小的Y坐标
            const zoneMaxX = bounds?.maxX ?? 0;         //区域缩进后的最大X坐标
            const zoneMaxY = bounds?.maxY ?? 0;         //区域缩进后的最大Y坐标
            const zoneSegments = zoneIndentSegs ?? [];  //区域缩进后的线段集合

            if (zone.segments.length < 3){
                //半圆或圆形
                zoneUntil.updateAngleOperInCircle(oper, zone, bounds, zoneIndentSegs);  
            } else if (zone.segments.length === 3){
                //扇形区域
                if (zone.segments.some((s) => s.isArc)){
                    //非render模式下，不进行位置调整
                    if (!contentEle) return;  
                    //保持原有代码
                        let width = contentEle?.virtualFrame.width;
                        let height = contentEle?.virtualFrame.height;
                        let centerPoint = baseUntil.getElementCenter(contentEle);
                        let position = baseUntil.getPositionFromCenter(centerPoint, { width, height });
                        if (oper.type == OperationType.ANGLE_LEFT) {
                            const newWidth = (width / 5) * 4;
                            position.x = position.x + width - newWidth;
                            width = newWidth;
                        } else if (oper.type == OperationType.ANGLE_RIGHT) {
                            width = (width / 5) * 4;
                        }
                        oper.update({
                            ...position,
                            width,
                            height,
                        });
                } else if (zone.segments.every((s) => !s.isArc)){
                    //三角形区域
                        if (contentEle) {
                        //render模式下，保持原有代码
                            let width = contentEle?.virtualFrame.width / 2;
                            let height = contentEle?.virtualFrame.height / 2;
                            let centerPoint = baseUntil.getElementCenter(contentEle);
                            let position = baseUntil.getPositionFromCenter(centerPoint, { width, height });

                            position.y = position.y + (height / 10) * 2;
                            if (oper.type == OperationType.ANGLE_DOWN) {
                                position.y = position.y + (height / 10) * 2;
                            }
                            oper.update({
                                ...position,
                                width,
                                height,
                            });
                        } else {
                        //保持原有代码
                        oper.update({
                            x: zoneMinX,
                            y: zoneMinY,
                            width: zoneWidth,
                            height: zoneHeight
                        });
                        }
                        }
            } else if (zone.segments.length === 4){
                //带弧线的四边形区域
                if (zone.segments.some((s) => s.isArc)){
                    //使用zoneSegments计算，zoneSegments是经过缩进后的线段集合
                    //找到左侧垂直线段
                    let leftVetSeg = zoneSegments.find((s) => s.start.x == s.end.x && s.start.x === zoneMinX);
                    //找到右侧垂直线段
                    let rightVetSeg = zoneSegments.find((s) => s.start.x == s.end.x && s.start.x === zoneMaxX);
                    //找到弧线线段
                    let arcSeg = zoneSegments.find((s) => s.isArc);

                    if (leftVetSeg && rightVetSeg && arcSeg){
                        //确保坐标是按照顺序排列
                        const leftStartX = Math.min(leftVetSeg.start.x, leftVetSeg.end.x);
                        const leftStartY = Math.min(leftVetSeg.start.y, leftVetSeg.end.y);
                        const leftEndY = Math.max(leftVetSeg.start.y, leftVetSeg.end.y);
                        const rightStartX = Math.min(rightVetSeg.start.x, rightVetSeg.end.x);
                        const rightStartY = Math.min(rightVetSeg.start.y, rightVetSeg.end.y);
                        const rightEndY = Math.max(rightVetSeg.start.y, rightVetSeg.end.y);

                        switch(oper.type){
                            case OperationType.ANGLE_LEFT:
                        oper.update({
                                    x: leftStartX,
                                    y: rightStartY,//以右边线段起点作为Y坐标
                                    width: zoneWidth,
                                    height: rightEndY - rightStartY //以右边线段高度作为angle组件高度
                                })
                    break;
                            case OperationType.ANGLE_RIGHT:
                                oper.update({
                                    x: leftStartX,
                                    y: leftStartY,
                                    width: zoneWidth,
                                    height: leftEndY - leftStartY
                                })
                    break;
                            case OperationType.ANGLE_DOWN:
                                oper.update({
                                    x: leftStartX,
                                    y: Math.max(leftStartY, rightStartY),
                                    width: zoneWidth,
                                    //取两个线段中最短的作为angle组件高度
                                    height: leftStartY > rightStartY ? leftEndY - leftStartY : rightEndY - rightStartY
                                })
                                break;
                            case OperationType.ANGLE_UP:
                                //计算垂线段和弧线的焦点坐标
                                try{
                                    //计算区域最大宽度和高度,包括弧形区域，参数bounds未包含弧形区域
                                    let { width, height, boundingBox } = zoneUntil.calculateZoneMaxDimensions(zone);
                                    const intersections = lineUntil.getCircleLineIntersection(
                                        arcSeg,
                                        {
                                            start:{
                                                x: zoneMinX + zoneWidth / 2,
                                                y: boundingBox.minY
                                            },
                                            end:{
                                                x: zoneMinX + zoneWidth / 2,
                                                y: boundingBox.maxY
                                            }
                                        }
                        );
    
                                    console.log('######## updateAngleOper arcSeg and Vetline intersect', intersections);
                                    //找到交点中y值最小的作为Y坐标
                                    const minY = Math.min(...intersections.map((i) => i.y));
                                    oper.update({
                                        x: leftVetSeg.start.x,
                                        y: minY,
                                        width: zoneWidth,
                                        height: zoneMaxY - minY
                                    })
                                }catch(error){
                                    console.log('######## updateAngleOper arcSeg and Vetline intersect error', error);
                                    oper.update({
                                        x: leftStartX,
                                        y: Math.max(leftStartY, rightEndY),
                                        width: zoneWidth,
                                        height: leftStartY > rightStartY ? leftEndY - leftStartY : rightEndY - rightStartY
                                    })
                    }
                                
                        break;
                    }
                    } else {
                        oper.update({
                            x: zoneMinX,
                            y: zoneMinY,
                            width: zoneWidth,
                            height: zoneHeight
                        })
                    } 
                    
                } else {
                    //普通矩形区域
                    oper.update({
                        x: zoneMinX,
                        y: zoneMinY,
                        width: zoneWidth,
                        height: zoneHeight
                    })
                    }
            } else if (zone.segments.length >= 5){
                if (zone.segments.some((s) => s.isArc)){
                    oper.update({
                        x: zoneMinX,
                        y: zoneMinY,
                        width: zoneWidth,
                        height: zoneHeight
                    })
                } else {
                    //无弧线的多边形区域
                    zoneUntil.updateAngleOperInPolygon(oper, zone, bounds, zoneIndentSegs);
            }
            } else {
                oper.update({
                    x: zoneMinX,
                    y: zoneMinY,
                    width: zoneWidth,
                    height: zoneHeight
                })
                }
            
            }

       

        const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

        const [isLoading, setIsLoading] = useState<boolean>(false);

        const [isImageMode, setIsImageMode] = useState<boolean>(false);

        return (
            <div className="flex h-full w-full relative overflow-hidden">
                <Ruler
                    width={canvasSize.width}
                    height={canvasSize.height}
                    viewportOffset={viewportOffset}
                    onSelectAll={handleSelectAll}
                    rulerSize={25}
                />
                {isLoading && (
                    <div className="flex bg-white/50 justify-center items-center absolute w-full h-full inset-0 z-10">
                        <Spin tip="Loading" />
                    </div>
                )}
                <div
                    className={`relative overflow-auto  ${value.from == 'quote' ? 'scrollbar-hidden' : ''}`}
                    ref={containerRef}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{
                        cursor:
                            value.dragMode === 'removeLine'
                                ? 'crosshair'
                                : value.dragMode === 'drag'
                                ? stageDrag.isDragging
                                    ? 'grabbing'
                                    : 'grab'
                                : value.dragMode === 'dimension'
                                ? 'crosshair'
                                : 'default',
                        width: 'calc(100% - 25px)',
                        height: 'calc(100% - 25px)',
                        marginLeft: 25,
                        marginTop: 25,
                    }}
                >
                    {canvasSize.width > 0 && canvasSize.height > 0 && (
                        <div
                            style={{
                                width: canvasSize.width,
                                height: canvasSize.height,
                                position: 'relative',
                            }}
                        >
                            {value.dragMode === 'drag' && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        cursor: isDragging ? 'grabbing' : 'grab',
                                        zIndex: 100, // 确保在Stage上层
                                        backgroundColor: 'transparent',
                                    }}
                                    onMouseDown={(e) => {
                                        setIsDragging(true);
                                        setDragStartPos({
                                            x: e.clientX,
                                            y: e.clientY,
                                        });
                                    }}
                                    onMouseMove={(e) => {
                                        if (isDragging && dragStartPos) {
                                            const deltaX = e.clientX - dragStartPos.x;
                                            const deltaY = e.clientY - dragStartPos.y;

                                            if (containerRef.current) {
                                                containerRef.current.scrollBy({
                                                    left: -deltaX,
                                                    top: -deltaY,
                                                });
                                            }

                                            setDragStartPos({
                                                x: e.clientX,
                                                y: e.clientY,
                                            });
                                        }
                                    }}
                                    onMouseUp={() => {
                                        setIsDragging(false);
                                    }}
                                    onMouseLeave={() => {
                                        setIsDragging(false);
                                    }}
                                />
                            )}
                            <Stage
                                ref={stageRef}
                                width={canvasSize.width}
                                height={canvasSize.height}
                                scaleX={value.scale}
                                scaleY={value.scale}
                                style={{
                                    backgroundColor: '#fff',
                                }}
                                x={0}
                                y={0}
                                // draggable={value.dragMode === 'drag'}
                                onDragStart={handleDragStart}
                                onDragMove={handleDragMove}
                                onDragEnd={handleDragEnd}
                                onMouseDown={handleMouseDown}
                                onContextMenu={handleContextMenu}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onClick={handleStageClick}
                            >
                                <Layer>
                                    {isImageMode ? null : (
                                        <GridBackground
                                            width={canvasSize.width / value.scale}
                                            height={canvasSize.height / value.scale}
                                        />
                                    )}

                                    <Group zIndex={0}>
                                        {zones?.map((zone, index) => (
                                            <Group key={`zone-${zone.elementId}-${index}`}>
                                                <Zone
                                                    zone={zone}
                                                    index={index}
                                                />
                                            </Group>
                                        ))}
                                    </Group>
                                    {/* 渲染重合点 */}
                                    {!value.noRenderBase &&
                                        overlappingPoints.map((overlap, index) => (
                                            <Group key={`overlap-${index}`}>
                                                <Circle
                                                    x={overlap.point.x}
                                                    y={overlap.point.y}
                                                    radius={3 / value.scale}
                                                    fill="#FFD700"
                                                    stroke="#FFA500"
                                                    strokeWidth={1 / value.scale}
                                                />
                                            </Group>
                                        ))}
                                    {/* 渲染所有元素 */}
                                    {elements.map((element: any, index) => {
                                        // const zIndex = hasSelectedItem(element.id)
                                        //   ? 999
                                        //   : (index + 1 || 1);
                                        return (
                                            <Group
                                                key={element.id + '_container' + index}
                                                zIndex={Number(element.zIndex) + 2}
                                            >
                                                <FrameRenderer
                                                    text={element.unitIndex || ''}
                                                    element={element}
                                                    onDragMove={(e) => onMoveFrame(e, element)}
                                                    onDragEnd={(e) => onMoveEnd(e, element as BaseFrame)}
                                                    onRegisterGlobalClick={onRegisterGlobalClick}
                                                    onChange={(newAttrs: IResizableFrame) =>
                                                        handleRectChange(element.id, newAttrs)
                                                    }
                                                    registerPopoverSetter={registerPopoverSetter}
                                                    onSelect={handleSelectChange}
                                                    onLineRemove={(line: any, event: any, noCut?: boolean) =>
                                                        handleElementLineRemove(line, element, event, noCut)
                                                    }
                                                    onPointMove={onPointMove}
                                                    onUpdateCircle={(e: any) => onUpdateEnd(e, element)}
                                                    onPointMoveEnd={onPointMoveEnd}
                                                    onLineElementCut={(e) => handleLineCut(e, element)}
                                                    onCopyClick={(e: any) => handleCopy(e, element)}
                                                    onRenderClick={(e: any) => handleRender(e, element)}
                                                    onRemoveElement={(e: any) => removeElementById(element.id)}
                                                />
                                            </Group>
                                        );
                                    })}

                                    <Group zIndex={Number(elements.length) + 3}>
                                        {value.from == 'quote' &&
                                            elements.map((element: any, index) => {
                                                return element instanceof GroupFrame && element.unitIndex ? (
                                                    <IndexShower
                                                        key={element.id + '_index_' + index}
                                                        zIndex={Number(element?.children.length) + 3}
                                                        frame={element}
                                                        text={element.unitIndex}
                                                    />
                                                ) : null;
                                            })}
                                    </Group>

                                    {/* 渲染所有标注点 */}
                                    {value.dragMode === 'dimension' &&
                                        allPoints.map((point) => (
                                            <Group key={point.id}>
                                                <Circle
                                                    x={point.x}
                                                    y={point.y}
                                                    radius={5 / value.scale}
                                                    fill={point.type === 'point' ? '#1890ff' : '#52c41a'}
                                                    stroke="#fff"
                                                    strokeWidth={1 / value.scale}
                                                    onClick={() => handlePointClick(point)}
                                                />
                                            </Group>
                                        ))}

                                    {/* 渲染临时标记点 */}
                                    {tempDimensionPoints.map((point: any, index) => (
                                        <Circle
                                            key={`temp-dimension-${index}`}
                                            x={point.x}
                                            y={point.y}
                                            radius={6}
                                            fill="#ff0000"
                                            stroke="#ffffff"
                                            strokeWidth={1}
                                        />
                                    ))}

                                    {/* 渲染所有标注 */}
                                    {
                                        //   !isImageMode &&
                                        elements
                                            .filter((el) => el.type === 'Dimension')
                                            .map((dimension) => renderDimension(dimension))
                                    }

                                    {dashedCircle && !dashedCircle.isCenterSnap && (
                                        <Circle
                                            x={dashedCircle.x}
                                            y={dashedCircle.y}
                                            radius={4}
                                            stroke="#c10c0c"
                                            strokeWidth={2}
                                            dash={[5, 2]}
                                        />
                                    )}

                                    {dashedLine && (
                                        <Group>
                                            {dashedLine.type == 'startAdsorb' && (
                                                <Circle
                                                    x={dashedLine.x1}
                                                    y={dashedLine.y1}
                                                    radius={4}
                                                    stroke={
                                                        dashedLine.height || dashedLine.width ? '#2E8B57' : '#ffd700'
                                                    }
                                                    strokeWidth={3}
                                                    dash={[5, 2]}
                                                />
                                            )}

                                            <Line
                                                points={[dashedLine.x1, dashedLine.y1, dashedLine.x2, dashedLine.y2]}
                                                stroke={dashedLine.height || dashedLine.width ? '#2E8B57' : '#ffd700'}
                                                strokeWidth={5}
                                                dash={[10, 5]}
                                            />
                                            {dashedLine.type == 'endAdsorb' && (
                                                <Circle
                                                    x={dashedLine.x2}
                                                    y={dashedLine.y2}
                                                    radius={4}
                                                    stroke={
                                                        dashedLine.height || dashedLine.width ? '#2E8B57' : '#ffd700'
                                                    }
                                                    strokeWidth={3}
                                                    dash={[5, 2]}
                                                />
                                            )}
                                        </Group>
                                    )}

                                    {dashedLineV && (
                                        <Group>
                                            {dashedLineV.type == 'startAdsorb' && (
                                                <Circle
                                                    x={dashedLineV.x1}
                                                    y={dashedLineV.y1}
                                                    radius={4}
                                                    stroke={
                                                        dashedLineV.height || dashedLineV.width ? '#2E8B57' : '#ffd700'
                                                    }
                                                    strokeWidth={3}
                                                    dash={[5, 2]}
                                                />
                                            )}

                                            <Line
                                                points={[
                                                    dashedLineV.x1,
                                                    dashedLineV.y1,
                                                    dashedLineV.x2,
                                                    dashedLineV.y2,
                                                ]}
                                                stroke={dashedLineV.height || dashedLineV.width ? '#2E8B57' : '#ffd700'}
                                                strokeWidth={5}
                                                dash={[10, 5]}
                                            />
                                            {dashedLineV.type == 'endAdsorb' && (
                                                <Circle
                                                    x={dashedLineV.x2}
                                                    y={dashedLineV.y2}
                                                    radius={4}
                                                    stroke={
                                                        dashedLineV.height || dashedLineV.width ? '#2E8B57' : '#ffd700'
                                                    }
                                                    strokeWidth={3}
                                                    dash={[5, 2]}
                                                />
                                            )}
                                        </Group>
                                    )}
                                    {centerSnap && (
                                        <>
                                            <Circle
                                                x={centerSnap.centerX}
                                                y={centerSnap.centerY}
                                                radius={6}
                                                stroke="#1890ff"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                points={[
                                                    centerSnap.centerX - 10,
                                                    centerSnap.centerY,
                                                    centerSnap.centerX + 10,
                                                    centerSnap.centerY,
                                                ]}
                                                stroke="#1890ff"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                points={[
                                                    centerSnap.centerX,
                                                    centerSnap.centerY - 10,
                                                    centerSnap.centerX,
                                                    centerSnap.centerY + 10,
                                                ]}
                                                stroke="#1890ff"
                                                strokeWidth={2}
                                            />
                                        </>
                                    )}
                                    {selectedItems.map((item) => {
                                        const isGroupChild = elements.some(
                                            (element) =>
                                                element instanceof GroupFrame &&
                                                element.children.some((child) => child.id === item.id)
                                        );

                                        if (
                                            isGroupChild ||
                                            item instanceof RenderData ||
                                            item instanceof TriangleWindow ||
                                            (Object.values(OperationType).includes(item.type as OperationType) &&
                                                !CanSizeChangeOperationType.includes(item.type))
                                        ) {
                                            return null;
                                        }

                                        if (
                                            item.type == ShapeType.LineH ||
                                            item.type == OperationType.DashedLineH ||
                                            item.type == 'SDL-h' ||
                                            item.type == 'TDL-h'
                                        ) {
                                            return (
                                                <SelectionBoxLineH
                                                    key={item.id}
                                                    data={item}
                                                    onDragMove={(e: any) => onMoveFrame(e, item)}
                                                    onDragEnd={(e: any) => onMoveEnd(e, item as BaseFrame)}
                                                    onUpdateCircle={(e: any) => onUpdateEnd(e, item)}
                                                    x={item.virtualFrame.x}
                                                    y={item.virtualFrame.y}
                                                    width={item.virtualFrame.width}
                                                    height={item.virtualFrame.height}
                                                    onUpdate={(params) => handleUpdate(item, params)}
                                                />
                                            );
                                        }

                                        if (
                                            item.type == ShapeType.LineV ||
                                            item.type == OperationType.DashedLineV ||
                                            item.type == 'SDL-v' ||
                                            item.type == 'TDL-v'
                                        ) {
                                            return (
                                                <SelectionBoxLineV
                                                    key={item.id}
                                                    data={item}
                                                    onDragMove={(e: any) => onMoveFrame(e, item)}
                                                    onDragEnd={(e: any) => onMoveEnd(e, item as BaseFrame)}
                                                    onUpdateCircle={(e: any) => onUpdateEnd(e, item)}
                                                    x={item.virtualFrame.x}
                                                    y={item.virtualFrame.y}
                                                    width={item.virtualFrame.width}
                                                    height={item.virtualFrame.height}
                                                    onUpdate={(params) => handleUpdate(item, params)}
                                                />
                                            );
                                        }

                                        return (
                                            <SelectionBox
                                                key={item.id}
                                                data={item}
                                                selectColor={item.style.color.select}
                                                onDragMove={(e: any) => onMoveFrame(e, item)}
                                                onDragEnd={(e: any) => onMoveEnd(e, item as BaseFrame)}
                                                onUpdateCircle={(e: any) => onUpdateEnd(e, item)}
                                                x={item.virtualFrame.x}
                                                y={item.virtualFrame.y}
                                                width={item.virtualFrame.width}
                                                height={item.virtualFrame.height}
                                                onUpdateStart={() => updateStart(item)}
                                                onUpdate={(params) => handleUpdate(item, params)}
                                            />
                                        );
                                    })}
                                    {newRectangle && Math.abs(newRectangle.x2 - newRectangle.x) > 20 && (
                                        <SelectRect
                                            type={'frame'}
                                            newRectangle={newRectangle}
                                        />
                                    )}
                                </Layer>
                            </Stage>
                        </div>
                    )}
                </div>

                <InfoBar
                    x={mousePos.x * value.sizeMultiples}
                    y={mousePos.y * value.sizeMultiples}
                    scale={value.scale}
                />
                {popoverPosition && (
                    <div
                        style={{
                            position: 'fixed',
                            left: popoverPosition.x,
                            top: popoverPosition.y,
                            zIndex: 1000,
                        }}
                    >
                        <Popover
                            open={true}
                            content={
                                <LineWeightPopoverContent
                                    overLine={currentLineContext?.line}
                                    element={currentLineContext?.element}
                                    onConfirm={(weight) => {
                                        handleWeightConfirm(weight);
                                        setPopoverPosition(null);
                                    }}
                                    onClose={() => {
                                        setCurrentLineContext(null);
                                        setPopoverPosition(null);
                                    }}
                                />
                            }
                            trigger="click"
                            placement="right"
                        >
                            <div style={{ width: 0, height: 0 }} />
                        </Popover>
                    </div>
                )}
                {/** 如果是报价模式， 且是设计模式， 且只选中一个元素， 且不是水平线窗和垂直线窗， 则显示尺寸编辑框 */}
                {from == 'quote' &&
                    value.from == 'designForUnit' &&
                    selectedItems.length === 1 &&
                    selectedItems[0] instanceof BaseData &&
                    !(selectedItems[0] instanceof HorizontalLineWindow) &&
                    !(selectedItems[0] instanceof VerticalLineWindow) && (
                        <div className="absolute top-10 right-5 bg-white p-2 rounded shadow z-auto flex flex-col gap-2">
                             <div style={{ margin: '4px 0'}}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>Dimensions</h4>
                            </div>
                            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>X (mm):</span>
                                <InputNumber
                                    value={(selectedItems[0].virtualFrame.x * value.sizeMultiples).toFixed(2)}
                                    style={{ width: '100px' }}
                                    onBlur={(e) => {
                                        const newValue = parseFloat(e.target.value);
                                        const newXInUnits = newValue / value.sizeMultiples;
                                        const dx = newXInUnits - selectedItems[0].virtualFrame.x;
                                        selectedItems[0].move(dx, 0);
                                        setElements((pre) => [...pre]);
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>Y (mm):</span>
                                <InputNumber
                                    value={(selectedItems[0].virtualFrame.y * value.sizeMultiples).toFixed(2)}
                                    style={{ width: '100px' }}
                                    onBlur={(e) => {
                                        const newValue = parseFloat(e.target.value);
                                        const newYInUnits = newValue / value.sizeMultiples;
                                        const dy = newYInUnits - selectedItems[0].virtualFrame.y;
                                        selectedItems[0].move(0, dy);
                                        setElements((pre) => [...pre]);
                                    }}
                                />
                            </div> */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>Width:</span>
                                <InputNumber
                                    value={((selectedItems[0].virtualFrame.width * value.sizeMultiples) / 25.4).toFixed(0)}
                                    style={{ width: '100px' }}
                                    suffix='in'
                                    onBlur={(e) => {
                                        //gn:先从英寸转换成mm，再从mm转换成px
                                        let width_mm = Number((Number(e.target.value) * 25.4)).toFixed(6);
                                        let width_px = Number(width_mm) / value.sizeMultiples;
                                        console.log(`######## selectedItem virtualFrame  change width_in = ${e.target.value}   width_mm = ${width_mm}  width_px = ${width_px}`)
                                        updateElement(selectedItems[0].id, { width: width_px } as any, elements);
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>Height:</span>
                                <InputNumber
                                    value={((selectedItems[0].virtualFrame.height * value.sizeMultiples) / 25.4).toFixed(0)}
                                    style={{ width: '100px' }}
                                    suffix='in'
                                    onBlur={(e) => {
                                        //gn:先从英寸转换成mm，再从mm转换成px
                                        let height_mm = Number((Number(e.target.value) * 25.4)).toFixed(6);
                                        let height_px = Number(height_mm) / value.sizeMultiples;
                                        console.log(`######## selectedItem virtualFrame  change height_in = ${e.target.value}   height_mm = ${height_mm}  height_px = ${height_px}`)
                                        updateElement(selectedItems[0].id,{ height: height_px } as any, elements);
                                    }}
                                />
                            </div>
                            {selectedItems[0] instanceof TriangleWindow && (
                                <>
                                    <div style={{ borderTop: '1px solid #eee', margin: '4px 0', paddingTop: '8px' }}>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>Angles</h4>
                                    </div>
                                    {(selectedItems[0] as TriangleWindow).angles.map((angle, index) => {
                                        return (
                                            <div
                                                key={`angle-${index}`}
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <span>A{index + 1}:</span>
                                                <InputNumber
                                                    value={angle}
                                                    min={1}
                                                    max={178}
                                                    style={{ width: '100px' }}
                                                    suffix='°'
                                                    onBlur={(e) => {
                                                        const newValue = parseFloat(e.target.value);
                                                        if(newValue === angle){
                                                            return;
                                                        }
                                                        
                                                        if (!isNaN(newValue) && newValue > 0 && newValue < 180) {
                                                            (selectedItems[0] as TriangleWindow).adjustTriangleAngle(
                                                                index,
                                                                newValue
                                                            );
                                                            if (
                                                                selectedItems[0].virtualFrame.x < 0 ||
                                                                selectedItems[0].virtualFrame.y < 0
                                                            ) {
                                                                const dx =
                                                                    selectedItems[0].virtualFrame.x < 0
                                                                        ? 0 - selectedItems[0].virtualFrame.x
                                                                        : 0;
                                                                const dy =
                                                                    selectedItems[0].virtualFrame.y < 0
                                                                        ? 0 - selectedItems[0].virtualFrame.y
                                                                        : 0;
                                                                selectedItems[0].move(dx, dy);
                                                            }
                                                            const { x, y } = handleOverlop(
                                                                selectedItems[0],
                                                                e,
                                                                elements
                                                            );
                                                            if (x && y) {
                                                                const dx = x - selectedItems[0].virtualFrame.x;
                                                                const dy = y - selectedItems[0].virtualFrame.y;
                                                                selectedItems[0].move(dx, dy);
                                                            }
                                                            setElements((pre) => [...pre]);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    )}

                <RenderSettingsPopover
                    visible={renderModalVisible}
                    onClose={() => setRenderModalVisible(false)}
                    onConfirm={handleRenderConfirm}
                    initialSettings={defaultRenderSettings}
                />
                {editingDimension && (
                    <div
                        className="fixed"
                        style={{
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 1000,
                        }}
                        onClick={() => setEditingDimension(null)}
                    >
                        <div
                            className="flex flex-col items-center absolute bg-white w-28 p-2 border rounded"
                            style={{
                                left: `${editingDimension.position.x - 10}px`,
                                top: `${editingDimension.position.y + 10}px`,
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1001,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <InputNumber
                                suffix="in"
                                autoFocus={true}
                                value={editingDimension.value}
                                style={{ width: '100%' }}
                                onFocus={(e) => {
                                    e.target.select();
                                }}
                                onChange={(e) => {
                                    setEditingDimension({
                                        ...editingDimension,
                                        value: e || '',
                                    });
                                }}
                                onBlur={() => {
                                    const newValue = parseFloat(editingDimension.value);
                                    if (newValue && !isNaN(newValue)) {
                                        handleDimensionUpdate(editingDimension.dimension, newValue);
                                    } else {
                                        notification.warning({
                                            message: 'Warning message',
                                            description: 'Please enter a value before proceeding.',
                                        });
                                        setEditingDimension(null);
                                    }
                                }}
                            />
                            <span className="text-xs text-gray-500">
                                {(Number(editingDimension?.value) * 25.4).toFixed(2)} mm
                            </span>
                            {/*<input*/}
                            {/*    type="number"*/}
                            {/*    step="0.01"*/}
                            {/*    autoFocus*/}
                            {/*    value={editingDimension.value}*/}
                            {/*    onChange={(e) => setEditingDimension({*/}
                            {/*        ...editingDimension,*/}
                            {/*        value: e.target.value*/}
                            {/*    })}*/}
                            {/*    onKeyDown={(e) => {*/}
                            {/*        if (e.key === 'Enter') {*/}
                            {/*            const newValue = parseFloat(editingDimension.value);*/}
                            {/*            if (!isNaN(newValue)) {*/}
                            {/*                handleDimensionUpdate(editingDimension.dimension, newValue);*/}
                            {/*            }*/}
                            {/*        } else if (e.key === 'Escape') {*/}
                            {/*            setEditingDimension(null);*/}
                            {/*        }*/}
                            {/*    }}*/}
                            {/*    onBlur={() => {*/}
                            {/*        const newValue = parseFloat(editingDimension.value);*/}
                            {/*        if (!isNaN(newValue)) {*/}
                            {/*            handleDimensionUpdate(editingDimension.dimension, newValue);*/}
                            {/*        } else {*/}
                            {/*            setEditingDimension(null);*/}
                            {/*        }*/}
                            {/*    }}*/}
                            {/*    style={{*/}
                            {/*        width: '100px',*/}
                            {/*        padding: '5px',*/}
                            {/*        border: '1px solid #1890ff',*/}
                            {/*        borderRadius: '4px',*/}
                            {/*        textAlign: 'center'*/}
                            {/*    }}*/}
                            {/*/>*/}
                        </div>
                    </div>
                )}
            </div>
        );
    }
);
WinDrawerContent.displayName = 'WinDrawerContent';
export default WinDrawerContent;
