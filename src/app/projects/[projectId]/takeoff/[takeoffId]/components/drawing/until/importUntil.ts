import {Frame} from "../data/shape/frame";
import {HorizontalLineWindow, VerticalLineWindow} from "../data/shape/line";
import {RightSemiCircleWindow, TopSemiCircleWindow} from "../data/shape/semicircle";
import {TriangleWindow} from "../data/shape/triangle";
import {SDLHorizontal, SDLVertical, TDLHorizontal, TDLVertical} from "../data/divider/divider";
import {ArrowData} from "../data/operation/arrow";
import {AngleData} from "../data/operation/angle";
import {GroupFrame} from "../data/groupFrame";
import {BaseData} from "../data/baseData";
import {DimensionData} from "../data/operation/dimension";
import {Glasses} from "../data/operation/glasses";
import {Hardware} from "../data/operation/hardware";
import {MotoSideData} from "../data/operation/motoSideData";
import {Passive} from "../data/operation/passive";
import {FlodingSideData} from "../data/operation/flodingSideData";
import {PivotH} from "../data/operation/pivotH";
import {PivotV} from "../data/operation/pivotV";
import {PocketWall} from "../data/operation/pocketWall";
import {Rail2} from "../data/operation/rail2";
import {Rail4} from "../data/operation/rail4";
import {Inswing} from "../data/operation/inswing";
import {Motorized} from "../data/operation/motorized";
import {Outswing} from "../data/operation/outswing";
import {Active} from "../data/operation/active";
import {Folding} from "../data/operation/folding";
import {BaseOperation} from "../data/operation/baseOperation";
import {RenderData} from "../data/render/renderData";
import {Dashed} from "../data/operation/dashed";
import {FixedData} from "../data/operation/fixed";
import {DividerType, DividerType2, IImageData, OperationType, ShapeType} from "../datas";

/**
 * Creates a rectangular frame element from imported data
 */
export const createFrame = (elementData: any, lineWidth: number, copyLines: boolean = false) => {
    // 基本属性
    const baseProps = {
        id: elementData.id || `Rectangle_${Date.now()}`,
        virtualFrame: elementData.virtualFrame || {},
        appearanceType: elementData.appearanceType,
        lines: elementData.lines,
        points: elementData.points,
        contentPoints: elementData.contentPoints,
        type: elementData.type,
        // 其他可能的属性
        lineElements: elementData.lineElements,
        intersectionPoints: elementData.intersectionPoints,
        mergeId: elementData.mergeId,
        selected: elementData.selected,
    };

    // 创建新的Frame实例并应用所有属性
    const frame:any = new Frame(lineWidth, baseProps);

    // 确保所有其他属性也被复制
    for (const key in elementData) {
        if (!['id', 'virtualFrame', copyLines ? 'lines' : ''].includes(key) && elementData[key] !== undefined) {
            (frame as any)[key] = elementData[key];
        }
    }
    if(copyLines) {
        elementData.lines.forEach((line, index) => {
            for (const key in line) {
                if(key == 'id') continue;
                frame.lines[index][key] = line[key];
            }
        })
    }

    return frame;
};

/**
 * Creates a triangle window element from imported data
 */
export const createTriangle = (elementData: any, lineWidth: number, copyLines: boolean = false) => {
    // 基本属性
    const baseProps = {
        id: elementData.id || `Triangle_${Date.now()}`,
        virtualFrame: elementData.virtualFrame || {},
    };

    const triangle = new TriangleWindow(lineWidth, baseProps);

    for (const key in elementData) {
        if (!['id', 'virtualFrame', copyLines ? 'lines' : ''].includes(key) && elementData[key] !== undefined) {
            (triangle as any)[key] = elementData[key];
        }
    }

    if(copyLines) {
        elementData.lines.forEach((line, index) => {
            for (const key in line) {
                if(key == 'id') continue;
                triangle.lines[index][key] = line[key];
            }
        })
    }

    return triangle;
};

/**
 * Creates a top semi-circle window element from imported data
 */
export const createTopSemiCircle = (elementData: any, lineWidth: number, copyLines: boolean = false) => {
    // 基本属性
    const baseProps = {
        id: elementData.id || `Arch-H_${Date.now()}`,
        virtualFrame: elementData.virtualFrame || {},
    };

    const semiCircle = new TopSemiCircleWindow(lineWidth, baseProps);

    for (const key in elementData) {
        if (!['id', 'virtualFrame', copyLines ? 'lines' : ''].includes(key) && elementData[key] !== undefined) {
            (semiCircle as any)[key] = elementData[key];
        }
    }

    if(copyLines) {
        elementData.lines.forEach((line, index) => {
            for (const key in line) {
                if(key == 'id') continue;
                semiCircle.lines[index][key] = line[key];
            }
        })
    }

    return semiCircle;
};

/**
 * Creates a right semi-circle window element from imported data
 */
export const createRightSemiCircle = (elementData: any, lineWidth: number, copyLines: boolean = false) => {
    let rElement = new RightSemiCircleWindow(lineWidth, {
        id: elementData.id || `Arch-V_${Date.now()}`,
        virtualFrame: elementData.virtualFrame,
        ...elementData
    });
    for (const key in elementData) {
        if (!['id', 'virtualFrame', copyLines ? 'lines' : ''].includes(key) && elementData[key] !== undefined) {
            (rElement as any)[key] = elementData[key];
        }
    }

    if(copyLines) {
        elementData.lines.forEach((line, index) => {
            for (const key in line) {
                if(key == 'id') continue;
                rElement.lines[index][key] = line[key];
            }
        })
    }

    return rElement;
};

/**
 * Creates a horizontal line window element from imported data
 */
export const createHorizontalLine = (elementData: any, lineWidth: number, copyLines: boolean = false) => {
    let Hline = new HorizontalLineWindow(lineWidth, {
        id: elementData.id || `Line-H_${Date.now()}`,
        virtualFrame: elementData.virtualFrame,
        ...elementData
    });

    for (const key in elementData) {
        if (!['id', 'virtualFrame', copyLines ? 'lines' : ''].includes(key) && elementData[key] !== undefined) {
            (Hline as any)[key] = elementData[key];
        }
    }

    if(copyLines) {
        elementData.lines.forEach((line, index) => {
            for (const key in line) {
                if(key == 'id') continue;
                Hline.lines[index][key] = line[key];
            }
        })
    }

    return Hline
};

/**
 * Creates a vertical line window element from imported data
 */
export const createVerticalLine = (elementData: any, lineWidth: number, copyLines: boolean = false) => {
    let Vline = new VerticalLineWindow(lineWidth, {
        id: elementData.id || `Line-V_${Date.now()}`,
        virtualFrame: elementData.virtualFrame,
        ...elementData
    });

    for (const key in elementData) {
        if (!['id', 'virtualFrame', copyLines ? 'lines' : ''].includes(key) && elementData[key] !== undefined) {
            (Vline as any)[key] = elementData[key];
        }
    }

    if(copyLines) {
        elementData.lines.forEach((line, index) => {
            for (const key in line) {
                if(key == 'id') continue;
                Vline.lines[index][key] = line[key];
            }
        })
    }

    return Vline
};

/**
 * Creates a divider element from imported data
 */
export const createDivider = (elementData: any, dividerType: DividerType2) => {
    switch (dividerType) {
        case DividerType2.SDL_H:
            return new SDLHorizontal({
                id: elementData.id || `SDL-H_${Date.now()}`,
                ...elementData.virtualFrame
            });
        case DividerType2.SDL_V:
            return new SDLVertical({
                id: elementData.id || `SDL-V_${Date.now()}`,
                ...elementData.virtualFrame
            });
        case DividerType2.TDL_H:
            return new TDLHorizontal({
                id: elementData.id || `TDL-H_${Date.now()}`,
                ...elementData.virtualFrame
            });
        case DividerType2.TDL_V:
            return new TDLVertical({
                id: elementData.id || `TDL-V_${Date.now()}`,
                ...elementData.virtualFrame
            });
        default:
            return null;
    }
};

/**
 * Creates an operation element (arrow or angle) from imported data
 */
export const createOperation = (elementData: any, operationType: string) => {
    // Arrow types
    if (operationType.startsWith('arrow-')) {
        const direction = operationType.replace('arrow-', '') as 'left' | 'right' | 'up' | 'down';
        return new ArrowData({
            id: elementData.id || `arrow_${Date.now()}`,
            direction,
            virtualFrame: elementData.virtualFrame,
            ...elementData
        });
    }
    // Angle types
    else if (operationType.startsWith('angle-')) {
        const direction = operationType.replace('angle-', '') as 'left' | 'right' | 'up' | 'down';
        return new AngleData({
            id: elementData.id || `angle_${Date.now()}`,
            direction,
            type: elementData.type || 'solid',
            virtualFrame: elementData.virtualFrame,
            ...elementData
        });
    }
    return null;
};

export const createElement = (element: any, lineWidth: number, copyLines: boolean = false) => {
    const type = element.type;
    if (Object.values(ShapeType).includes(type)) {
        switch (type) {
            case ShapeType.Rectangle:
                return createFrame(element, lineWidth, copyLines);
            case ShapeType.Triangle:
                let value = createTriangle(element, lineWidth, copyLines);
                return value;
            case ShapeType.ArchH:
                return createTopSemiCircle(element, lineWidth, copyLines);
            case ShapeType.ArchV:
                return createRightSemiCircle(element, lineWidth, copyLines);
            case ShapeType.LineH:
                return createHorizontalLine(element, lineWidth, copyLines);
            case ShapeType.LineV:
                return createVerticalLine(element, lineWidth, copyLines);
            case ShapeType.Group:
                let children = []
                if (Array.isArray(element.children)) {
                    children = importElements(element.children, lineWidth)
                }
                const groupElement = new GroupFrame(children);

                groupElement.id = element.id || `Group_${Date.now()}`;
                groupElement.virtualFrame = element.virtualFrame || {};
                groupElement.type = ShapeType.Group;
                for (const key in element) {
                    if (!['id', 'virtualFrame', 'type','children', 'childrenRelations'].includes(key) && element[key] !== undefined) {
                        (groupElement as any)[key] = element[key];
                    }
                }
                return groupElement;

            default:
                console.warn(`未知形状类型: ${type}`);
                return null;
        }
    }
    
    if (type.startsWith('SDL') || type.startsWith('TDL')) {
        let dividerElement = createDivider(element, type as DividerType2);
        // todo element的内容赋值给新的dividerElement
        return dividerElement;
    }
    
    if (type == 'render') {
        const renderData = new RenderData(element.id || `render_${Date.now()}`, element, element.renderType);
        
        for (const key in element) {
            if (!['id'].includes(key) && element[key] !== undefined) {
                (renderData as any)[key] = element[key];
            }
        }
        
        if (element.points && element.lines) {
            const fillColor = element.style?.color?.fill || '#ffffff';
            renderData.updateInfo(element.points, element.lines, fillColor);
        }
        
        return renderData;
    }
    if (Object.values(OperationType).includes(type as OperationType)) {
        switch (type) {
            case OperationType.ARROW_LEFT:
            case OperationType.ARROW_RIGHT:
            case OperationType.ARROW_LR:
            case OperationType.ARROW_UP:
            case OperationType.ARROW_DOWN:
            case OperationType.ARROW_TD:
            case OperationType.Arrow:
                return new ArrowData({
                    id: element.id || `arrow_${Date.now()}`,
                    direction: element.direction || 'left',
                    virtualFrame: element.virtualFrame,
                    ...element
                });
                break;
            case OperationType.ANGLE_LEFT:
            case OperationType.ANGLE_RIGHT:
            case OperationType.ANGLE_UP:
            case OperationType.ANGLE_DOWN:
                return new AngleData({
                    id: element.id || `angle_${Date.now()}`,
                    direction: element.direction || 'left',
                    virtualFrame: element.virtualFrame,
                    ...element
                });
                break;
            case OperationType.Dimension:
                const dimData = createDimensionElement(element);
                return dimData;

            case OperationType.HARDWARE_HR:
            case OperationType.HARDWARE_HL:
            case OperationType.HARDWARE_V:
            case OperationType.DashedLineV:
            case OperationType.DashedLineH:
            case OperationType.MOTORIZED:
            case OperationType.POCKET_WALL:
            case OperationType.MOTO_LEFT:
            case OperationType.MOTO_DOWN:
            case OperationType.MOTO_UP:
            case OperationType.MOTO_RIGHT:
            case OperationType.MOTO_LR:
            case OperationType.MOTO_TD:
            case OperationType.FOLDING:
            case OperationType.Folding_LEFT:
            case OperationType.Folding_DOWN:
            case OperationType.Folding_UP:
            case OperationType.Folding_RIGHT:
            case OperationType.Folding_LR:
            case OperationType.Folding_TD:
            case OperationType.PIVOT_V:
            case OperationType.PIVOT_H:
            case OperationType.RAIL_2:
            case OperationType.RAIL_4:
            case OperationType.ACTIVE:
            case OperationType.INSWING:
            case OperationType.OUTSWING:
            case OperationType.PASSIVE:
            case OperationType.Fixed_D:
            case OperationType.Fixed_W:
                return createGenericOperation(element, type as OperationType);
                
            default:
                return createOperation(element, type);
        }
    }

    console.warn(`未知元素类型: ${type}`);
    return null;
};

// 创建Dimension元素的辅助函数
function createDimensionElement(element: any) {
    // 从operation/dimension.ts导入DimensionData
    const dimData = new DimensionData({
        id: element.id || `dimension_${Date.now()}`,
        virtualFrame: element.virtualFrame,
        ...element
    });

    // 复制所有其他属性
    for (const key in element) {
        if (!['id', 'virtualFrame','offset'].includes(key) && element[key] !== undefined) {
            (dimData as any)[key] = element[key];
        }
    }
    
    return dimData;
}

// 创建Glasses元素的辅助函数
function createGlassesElement(element: any, lineWidth: number) {
    // 从operation/glasses.ts导入Glasses
    const glasses = new Glasses({
        id: element.id || `glasses_${Date.now()}`,
        virtualFrame: element.virtualFrame,
        ...element
    });
    
    // 复制所有其他属性
    for (const key in element) {
        if (!['id', 'virtualFrame'].includes(key) && element[key] !== undefined) {
            (glasses as any)[key] = element[key];
        }
    }
    
    return glasses;
}

function createGenericOperation(element: any, type: OperationType) {
    let operationInstance;
    switch (type) {
        case OperationType.HARDWARE_HL:
        case OperationType.HARDWARE_HR:
        case OperationType.HARDWARE_V:
            operationInstance = new Hardware({ ...element });
            break;
        case OperationType.DashedLineV:
        case OperationType.DashedLineH:
            operationInstance = new Dashed({...element});
            break
        case OperationType.MOTO_LEFT:
        case OperationType.MOTO_DOWN:
        case OperationType.MOTO_UP:
        case OperationType.MOTO_RIGHT:
        case OperationType.MOTO_LR:
        case OperationType.MOTO_TD:
            operationInstance = new MotoSideData({ ...element });
            break;
            break;
        case OperationType.PASSIVE:
            operationInstance = new Passive({ ...element });
            break;
        case OperationType.Folding_LEFT:
        case OperationType.Folding_DOWN:
        case OperationType.Folding_UP:
        case OperationType.Folding_RIGHT:
        case OperationType.Folding_LR:
        case OperationType.Folding_TD:
            operationInstance = new FlodingSideData({ ...element });
            break;
        case OperationType.PIVOT_H:
            operationInstance = new PivotH({ ...element });
            break;
        case OperationType.PIVOT_V:
            operationInstance = new PivotV({ ...element });
            break;
        case OperationType.POCKET_WALL:
            operationInstance = new PocketWall({ ...element });
            break;
        case OperationType.RAIL_2:
            operationInstance = new Rail2({ ...element });
            break;
        case OperationType.RAIL_4:
            operationInstance = new Rail4({ ...element });
            break;
        case OperationType.INSWING:
            operationInstance = new Inswing({ ...element });
            break;
        case OperationType.MOTORIZED:
            operationInstance = new Motorized({ ...element });
            break;
        case OperationType.OUTSWING:
            operationInstance = new Outswing({ ...element });
            break;
        case OperationType.ACTIVE:
            operationInstance = new Active({ ...element });
            break;
        case OperationType.FOLDING:
            operationInstance = new Folding({ ...element });
            break;
        case OperationType.Fixed_D:
            operationInstance = new FixedData({ ...element });
            break;
        case OperationType.Fixed_W:
            operationInstance = new FixedData({ ...element });
            break
        default:
            operationInstance = new BaseOperation({
                id: element.id || `operation_${Date.now()}`,
                type,
                virtualFrame: element.virtualFrame,
                ...element
            });
    }
    
    operationInstance.id = element.id || `${type}_${Date.now()}`;
    operationInstance.virtualFrame = element.virtualFrame || {};
    
    // 复制所有其他属性
    for (const key in element) {
        if (!['id', 'virtualFrame', 'type'].includes(key) && element[key] !== undefined) {
            (operationInstance as any)[key] = element[key];
        }
    }
    
    return operationInstance;
}

/**
 * Imports elements from JSON data and converts them back to their corresponding objects
 * @param jsonData - JSON string or parsed object containing elements data
 * @param lineWidth - Default line width to use for elements
 * @returns Array of reconstructed elements
 */
export const importElements = (jsonData: string | object, lineWidth: number = 5, copyLines: boolean = false) => {
    let data;

    // Parse JSON if it's a string
    if (typeof jsonData === 'string') {
        try {
            data = JSON.parse(jsonData);
        } catch (error) {
            console.error('Failed to parse JSON data:', error);
            return [];
        }
    } else {
        data = jsonData;
    }

    // Ensure data is an array
    const elementsData = Array.isArray(data) ? data : data.elements || [];
    // Map elements to their corresponding objects
    return elementsData.map((element: any) => {
        return createElement(element, lineWidth, copyLines);
    }).filter(Boolean);
};

export const convertElementData = (data: any, isEnlarge: boolean, sizeMultiples: number): any => {
    const converted = {...data};
    const factor = isEnlarge ? sizeMultiples : 1 / sizeMultiples;

    const propsToConvert = ['x', 'y', 'width', 'height', 'lineWidth'];
    propsToConvert.forEach(prop => {
        if (converted[prop] !== undefined) {
            converted[prop] *= factor;
        }
    });

    if (converted.virtualFrame) {
        converted.virtualFrame = {
            ...converted.virtualFrame,
            x: converted.virtualFrame.x * factor,
            y: converted.virtualFrame.y * factor,
            width: converted.virtualFrame.width * factor,
            height: converted.virtualFrame.height * factor
        };
    }

    if (Array.isArray(converted.points)) {
        converted.points = converted.points.map((point: any) => ({
            ...point,
            x: point.x * factor,
            y: point.y * factor
        }));
    }

    if (Array.isArray(converted.contentPoints)) {
        converted.contentPoints = converted.contentPoints.map((point: any) => ({
            ...point,
            x: point.x * factor,
            y: point.y * factor
        }));
    }

    if (Array.isArray(converted.lines)) {
        converted.lines = converted.lines.map((line: any) => {
            if (!line) return line; // 处理 null 或 undefined
            return {
                ...line,
                startPoint: line.startPoint ? {
                    ...line.startPoint,
                    x: line.startPoint.x * factor,
                    y: line.startPoint.y * factor
                } : undefined,
                endPoint: line.endPoint ? {
                    ...line.endPoint,
                    x: line.endPoint.x * factor,
                    y: line.endPoint.y * factor
                } : undefined,
                // 如果有 center 点也需要转换
                center: line.center ? {
                    ...line.center,
                    x: line.center.x * factor,
                    y: line.center.y * factor
                } : undefined,
                // 如果有 radius 也需要转换
                radius: line.radius !== undefined ? line.radius * factor : undefined
            };
        });
    }

    if (Array.isArray(converted.children)) {
        converted.children = converted.children.map((child: any) =>
            convertElementData(child, isEnlarge, sizeMultiples)
        );
    }

    return converted;
};

export const createImageData = async (
    eles: any[],
    stageRef:any,
    value:any,
    elementId?: string,
): Promise<IImageData> => {
    await new Promise<void>((resolve) => {
        const cleanup = () => {
            const unsub = setTimeout(() => {
                resolve();
            }, 0);
            return () => clearTimeout(unsub);
        };
        cleanup();
    });
    if (!stageRef.current) {
        return {
            dataURL: "",
            width: 0,
            height: 0,
        };
    }
    const tempStage = stageRef.current.clone();
    const layer = tempStage.findOne("Layer");

    const gridBackground = layer.find((node:any) => {
        if( node.name() != 'Group') return false;
        node.children?.some((child:any) =>
            child.attrs?.key?.startsWith('v-') ||
            child.attrs?.key?.startsWith('h-')
        )
    });
    //
    //
    // gridBackground.forEach(grid => {
    //     grid.remove();
    // });

    if (eles?.length === 0) {
        return {
            dataURL: "",
            width: 0,
            height: 0,
        };
    }

    let targetElements: BaseData[] = eles;
    if (elementId) {
        // Find target element and its merged elements if any
        targetElements = eles.filter((element) => {
            const isDirectMatch = element.id === elementId;
            // const isMergedMatch = element instanceof Frame &&
            //     element.mergeId === (allElements.find(e => e.id === elementId)? as Frame)?.mergeId;
            return isDirectMatch; //|| isMergedMatch
        });
        if (targetElements?.length === 0) {
            return {
                dataURL: "",
                width: 0,
                height: 0,
            };
        }
    }
    let leftMost = Infinity;
    let rightMost = -Infinity;
    let topMost = Infinity;
    let bottomMost = -Infinity;
    let offset =  !elementId ? 5 : 0;
    targetElements.forEach((element) => {
        // Calculate basic element bounds
        const elementBounds = {
            left: element.virtualFrame.x + value.stagePos.x / value.scale,
            right: element.virtualFrame.x + element.virtualFrame.width + value.stagePos.x / value.scale,
            top: element.virtualFrame.y + value.stagePos.y / value.scale,
            bottom: element.virtualFrame.y + element.virtualFrame.height + value.stagePos.y / value.scale,
        };

        // Update bounds with basic element dimensions
        leftMost = Math.min(leftMost, elementBounds.left) ;
        rightMost = Math.max(rightMost, elementBounds.right);
        topMost = Math.min(topMost, elementBounds.top);
        bottomMost = Math.max(bottomMost, elementBounds.bottom);
    });
    leftMost -= offset;
    topMost -= offset;
    rightMost += offset;
    bottomMost += offset;
    const padding = 10;
    let width = rightMost - leftMost;
    let height = bottomMost - topMost || 1524; // + padding
    if(!elementId && targetElements.some(el => el.type == "Dimension")) {
        height += padding * 10
        width += padding * 10
    }

    const scale = stageRef.current.scaleX();
    tempStage.width(width * scale);
    tempStage.height(height * scale);
    if(!elementId && targetElements.some(el => el.type == "Dimension")) {
        layer.x(-leftMost + padding * 10);
        layer.y(-topMost + padding * 5);
    }else  {
        layer.x(-leftMost); // + padding * 5
        layer.y(-topMost); // + padding * 5
    }


    const dataURL = tempStage.toDataURL({
        pixelRatio: 2,
        mimeType: "image/png",
    });
    tempStage.destroy();
    return {
        dataURL,
        width,
        height,
    };
};