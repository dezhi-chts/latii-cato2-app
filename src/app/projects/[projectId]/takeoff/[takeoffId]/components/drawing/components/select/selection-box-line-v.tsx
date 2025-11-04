import {Circle, Group, Line} from "react-konva";
import { useSetting } from "../../context/settingContext";
import {BaseFrame} from "../../data/baseFrame";
import {useEffect, useState} from "react";
import {GroupFrame} from "../../data/groupFrame";

interface SelectionBoxProps {
    x: number;
    y: number;
    data: BaseFrame;
    width: number;
    height: number;
    onUpdate?: (params: { x?: number; y?: number; width?: number; height?: number }) => void;
    onDragEnd?: any;
    onDragMove?: any
    onUpdateCircle?: (params: any) => void;
}

interface DragStartState {
    pointId: string;
    type: 'corner' | 'edge';
    initialFlipX: boolean;
    initialFlipY: boolean;
    initialPos: { x: number; y: number };
    initialFrame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export const SelectionBoxLineV: React.FC<SelectionBoxProps> = ({
    x,
    y,
    width,
    height,
    onUpdate,
    onDragEnd,
    data,
    onDragMove,
    onUpdateCircle,
}) => {
    const { value } = useSetting();
    const [dragStartState, setDragStartState] = useState<DragStartState | null>(null);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
    let basePoints:any = [
        { id: 'top', x: x, y: y, type: 'edge' },
        { id: 'bottom', x: x, y: y + height, type: 'edge' }
    ]
    if (value.dragMode === 'removeLine') {
        return null;
    }
    // const basePoints = [
    //     // Corners
    //     { id: 'topLeft', x: x, y: y, type: 'corner' },
    //     // { id: 'topRight', x: x + width, y: y, type: 'corner' },
    //     // { id: 'bottomRight', x: x + width, y: y + height, type: 'corner' },
    //     { id: 'bottomLeft', x: x, y: y + height, type: 'corner' },
    //     // Edge midpoints
    //     // { id: 'top', x: x + width/2, y: y, type: 'edge' },
    //     // { id: 'right', x: x + width, y: y + height/2, type: 'edge' },
    //     // { id: 'bottom', x: x + width/2, y: y + height, type: 'edge' },
    //     // { id: 'left', x: x, y: y + height/2, type: 'edge' }
    // ];

    // Handle corner drag start
    const handleCornerDragStart = (e: any) => {
        e.cancelBubble = true;
        const stage = e.target.getStage();
        const { x: pointerX, y: pointerY } = stage.getPointerPosition();

        if(data.type == 'Group') {
            (data as GroupFrame).calculateChildrenRelations()
        }

        console.log(data,'data')

        setDragStartState({
            pointId: e.target.attrs.id || '',
            type: e.target.attrs.type || 'corner',
            initialFlipX: data.flipX || false,
            initialFlipY: data.flipY || false,
            initialPos: {
                x: (pointerX - value.stagePos.x) / value.scale,
                y: (pointerY - value.stagePos.y) / value.scale
            },
            initialFrame: {
                x: x,
                y: y,
                width: width,
                height: height
            }
        });
    };

    // Handle control point drag move
    const handleControlPointDragMove = (e: any, pointId: string, type: 'corner' | 'edge') => {
        
        e.cancelBubble = true;
        if (!dragStartState) return;

        const stage = e.target.getStage();
        const { x: pointerX, y: pointerY } = stage.getPointerPosition();
        const actualX = (pointerX - value.stagePos.x) / value.scale;
        const actualY = (pointerY - value.stagePos.y) / value.scale;
        
        if (!(data instanceof BaseFrame)) {
            let newParams: { x?: number; y?: number; width?: number; height?: number } = {};
            
            if (type === 'corner') {
                switch (pointId) {
                    case 'topLeft':
                        newParams = {
                            x: actualX,
                            y: actualY,
                            width: x + width - actualX,
                            height: y + height - actualY
                        };
                        break;
                    case 'topRight':
                        newParams = {
                            y: actualY,
                            width: actualX - x,
                            height: y + height - actualY
                        };
                        break;
                    case 'bottomRight':
                        newParams = {
                            width: actualX - x,
                            height: actualY - y
                        };
                        break;
                    case 'bottomLeft':
                        newParams = {
                            x: actualX,
                            width: x + width - actualX,
                            height: actualY - y
                        };
                        break;
                }
            } else if (type === 'edge') {
                switch (pointId) {
                    case 'top':
                        newParams = {
                            y: actualY,
                            height: y + height - actualY
                        };
                        break;
                    case 'right':
                        newParams = {
                            width: actualX - x
                        };
                        break;
                    case 'bottom':
                        newParams = {
                            height: actualY - y
                        };
                        break;
                    case 'left':
                        newParams = {
                            x: actualX,
                            width: x + width - actualX
                        };
                        break;
                }
            }

            const minSize = 20;
            if (newParams.width !== undefined && newParams.width < minSize) {
                return;
            }
            if (newParams.height !== undefined && newParams.height < minSize) {
                return;
            }

            if (Object.keys(newParams).length > 0) {
                
                onUpdate?.(newParams);
            }
            return;
        }
        const minSize = 5 * value.sizeMultiples;
        let newParams: { x?: number; y?: number; width?: number; height?: number; flipX?: boolean; flipY?: boolean } = {};
        if (type === 'edge') {
            const effectivePointId = getEffectivePointId(pointId, dragStartState.initialFlipX, dragStartState.initialFlipY);
            console.log(effectivePointId,'pointIdpointId')
            switch (effectivePointId) {
                case 'top':
                    if (!data.flipY) {
                        // 正面状态
                        if (actualY < y + height - minSize) {
                            // 正常向上拖拽
                            newParams = {
                                y: actualY,
                                height: y + height - actualY,
                                flipY: false
                            };
                        } else if (actualY > y + height) {
                            console.log(data.flipY)
                            newParams = {
                                height: minSize,
                                flipY: true
                            };
                        }
                    } else {
                        // 已翻转状态
                        if (actualY > y) {
                            // 正常拖拽（已翻转状态下）
                            newParams = {
                                height: actualY - y,
                                flipY: true
                            };
                        } else if (actualY < y - height) {
                            // 再次翻转回正面
                            newParams = {
                                height: minSize,
                                flipY: false
                            };
                        }
                    }
                    break;

                case 'bottom':
                    if (!data.flipY) {
                        // 正面状态
                        if (actualY > y + minSize) {
                            // 正常向下拖拽
                            newParams = {
                                height: actualY - y,
                                flipY: false
                            };
                        } else if (actualY < y) {
                            // 向上翻转
                            newParams = {
                                height: minSize,
                                flipY: true
                            };
                        }
                    } else {
                        // 已翻转状态
                        if (actualY < y + height) {
                            // 正常拖拽（已翻转状态下）
                            newParams = {
                                y: actualY,
                                height: y + height - actualY,
                                flipY: true
                            };
                        } else if (actualY > y + height * 2) {
                            // 再次翻转回正面
                            newParams = {
                                height: minSize,
                                flipY: false
                            };
                        }
                    }
                    break;

                case 'left':
                    if (!data.flipX) {
                        // 正面状态
                        if (actualX < x + width - minSize) {
                            // 正常向左拖拽
                            newParams = {
                                x: actualX,
                                width: x + width - actualX,
                                flipX: false
                            };
                        } else if (actualX > x + width) {
                            // 向右翻转
                            newParams = {
                                width: minSize,
                                flipX: true
                            };
                        }
                    } else {
                        // 已翻转状态
                        if (actualX > x) {
                            // 正常拖拽（已翻转状态下）
                            newParams = {
                                width: actualX - x,
                                flipX: true
                            };
                        } else if (actualX < x - width) {
                            // 再次翻转回正面
                            newParams = {
                                width: minSize,
                                flipX: false
                            };
                        }
                    }
                    break;

                case 'right':
                    if (!data.flipX) {
                        // 正面状态
                        if (actualX > x + minSize) {
                            // 正常向右拖拽
                            newParams = {
                                width: actualX - x,
                                flipX: false
                            };
                        } else if (actualX < x) {
                            // 向左翻转
                            newParams = {
                                width: minSize,
                                flipX: true
                            };
                        }
                    } else {
                        // 已翻转状态
                        if (actualX < x + width) {
                            // 正常拖拽（已翻转状态下）
                            newParams = {
                                x: actualX,
                                width: x + width - actualX,
                                flipX: true
                            };
                        } else if (actualX > x + width * 2) {
                            // 再次翻转回正面
                            newParams = {
                                width: minSize,
                                flipX: false
                            };
                        }
                    }
                    break;
            }
        } else if (type === 'corner') {
            const effectivePointId = getEffectivePointId(pointId, dragStartState.initialFlipX, dragStartState.initialFlipY);
            switch (effectivePointId) {
                case 'topLeft':
                    if (!data.flipX && !data.flipY) {
                        // 未翻转状态
                        const dx = x + width - actualX;
                        const dy = y + height - actualY;
                        
                        if (actualX > x + width) {
                            newParams = {
                                y: actualY,
                                height: y + height - actualY,
                                width: minSize,
                                flipX: true,
                                flipY: false
                            };
                        } else if (actualY > y + height) {
                            newParams = {
                                x: actualX,
                                width: x + width - actualX,
                                height: minSize,
                                flipX: false,
                                flipY: true
                            };
                        } else if (dx >= minSize && dy >= minSize) {
                            newParams = {
                                x: actualX,
                                y: actualY,
                                width: dx,
                                height: dy,
                                flipX: false,
                                flipY: false
                            };
                        }
                    } else {
                        // 已翻转状态
                        const dx = data.flipX ? actualX - x : x + width - actualX;
                        const dy = data.flipY ? actualY - y : y + height - actualY;
                        
                        if (data.flipX && actualX < x - width) {
                            newParams = {
                                width: minSize,
                                flipX: false
                            };
                        } else if (data.flipY && actualY < y - height) {
                            newParams = {
                                height: minSize,
                                flipY: false
                            };
                        } else if (dx >= minSize && dy >= minSize) {
                            newParams = {
                                ...(data.flipX ? { width: dx } : { x: actualX, width: dx }),
                                ...(data.flipY ? { height: dy } : { y: actualY, height: dy }),
                                flipX: data.flipX,
                                flipY: data.flipY
                            };
                        }
                    }
                    break;

                case 'topRight':
                    if (!data.flipX && !data.flipY) {
                        // 未翻转状态
                        const dx = actualX - x;
                        const dy = y + height - actualY;
                        
                        if (actualX < x) {
                            newParams = {
                                y: actualY,
                                height: y + height - actualY,
                                width: minSize,
                                flipX: true,
                                flipY: false
                            };
                        } else if (actualY > y + height) {
                            newParams = {
                                width: actualX - x,
                                height: minSize,
                                flipX: false,
                                flipY: true
                            };
                        } else if (dx >= minSize && dy >= minSize) {
                            newParams = {
                                width: dx,
                                y: actualY,
                                height: dy,
                                flipX: false,
                                flipY: false
                            };
                        }
                    } else {
                        // 已翻转状态
                        const dx = data.flipX ? x + width - actualX : actualX - x;
                        const dy = data.flipY ? actualY - y : y + height - actualY;
                        
                        if (data.flipX && actualX > x + width * 2) {
                            newParams = {
                                width: minSize,
                                flipX: false
                            };
                        } else if (data.flipY && actualY < y - height) {
                            newParams = {
                                height: minSize,
                                flipY: false
                            };
                        } else if (dx >= minSize && dy >= minSize) {
                            newParams = {
                                ...(data.flipX ? { x: actualX, width: dx } : { width: dx }),
                                ...(data.flipY ? { height: dy } : { y: actualY, height: dy }),
                                flipX: data.flipX,
                                flipY: data.flipY
                            };
                        }
                    }
                    break;

                case 'bottomRight':
                    if (!data.flipX && !data.flipY) {
                        // 未翻转状态
                        const dx = actualX - x;
                        const dy = actualY - y;
                        
                        if (actualX < x) {
                            newParams = {
                                height: actualY - y,
                                width: minSize,
                                flipX: true,
                                flipY: false
                            };
                        } else if (actualY < y) {
                            newParams = {
                                width: actualX - x,
                                height: minSize,
                                flipX: false,
                                flipY: true
                            };
                        } else if (dx >= minSize && dy >= minSize) {
                            newParams = {
                                width: dx,
                                height: dy,
                                flipX: false,
                                flipY: false
                            };
                        }
                    } else {
                        // 已翻转状态
                        const dx = data.flipX ? x + width - actualX : actualX - x;
                        const dy = data.flipY ? y + height - actualY : actualY - y;
                        
                        if (data.flipX && actualX > x + width * 2) {
                            newParams = {
                                width: minSize,
                                flipX: false
                            };
                        } else if (data.flipY && actualY > y + height * 2) {
                            newParams = {
                                height: minSize,
                                flipY: false
                            };
                        } else if (dx >= minSize && dy >= minSize) {
                            newParams = {
                                ...(data.flipX ? { x: actualX, width: dx } : { width: dx }),
                                ...(data.flipY ? { y: actualY, height: dy } : { height: dy }),
                                flipX: data.flipX,
                                flipY: data.flipY
                            };
                        }
                    }
                    break;

                case 'bottomLeft':
                    if (!data.flipX && !data.flipY) {
                        // 未翻转状态
                        const dx = x + width - actualX;
                        const dy = actualY - y;
                        
                        if (actualX > x + width) {
                            newParams = {
                                height: actualY - y,
                                width: minSize,
                                flipX: true,
                                flipY: false
                            };
                        } else if (actualY < y) {
                            newParams = {
                                x: actualX,
                                width: x + width - actualX,
                                height: minSize,
                                flipX: false,
                                flipY: true
                            };
                        } else if (dx >= minSize && dy >= minSize) {
                            newParams = {
                                x: actualX,
                                width: dx,
                                height: dy,
                                flipX: false,
                                flipY: false
                            };
                        }
                    } else {
                        // 已翻转状态
                        const dx = data.flipX ? actualX - x : x + width - actualX;
                        const dy = data.flipY ? y + height - actualY : actualY - y;
                        
                        if (data.flipX && actualX < x - width) {
                            newParams = {
                                width: minSize,
                                flipX: false
                            };
                        } else if (data.flipY && actualY > y + height * 2) {
                            newParams = {
                                height: minSize,
                                flipY: false
                            };
                        } else if (dx >= minSize && dy >= minSize) {
                            newParams = {
                                ...(data.flipX ? { width: dx } : { x: actualX, width: dx }),
                                ...(data.flipY ? { y: actualY, height: dy } : { height: dy }),
                                flipX: data.flipX,
                                flipY: data.flipY
                            };
                        }
                    }
                    break;
            }
        }
        if (Object.keys(newParams).length > 0) {
            onUpdate?.(newParams);
        }
    };

    // Handle corner drag end
    const handleCornerDragEnd = (e: any, index: number) => {
        if (dragStartState) {
            const frameDiff = {
                dx: x - dragStartState.initialFrame.x,
                dy: y - dragStartState.initialFrame.y,
                dWidth: width - dragStartState.initialFrame.width,
                dHeight: height - dragStartState.initialFrame.height,
                index: index,
                pointId: dragStartState.pointId,
                type: dragStartState.type
            };
            console.log(frameDiff);
            onUpdateCircle?.(frameDiff);
        }
        // else {
        //     onUpdateCircle?.();
        // }
        
        setDragStartState(null);
        console.log(e);
        console.log(index);
    };

    const onDrag = (e: any) => {
        e.cancelBubble = true;
        const stage = e.target.getStage();
        const { x: pointerX, y: pointerY } = stage.getPointerPosition();

        const currentX = (pointerX - value.stagePos.x) / value.scale;
        const currentY = (pointerY - value.stagePos.y) / value.scale;

        let dx = currentX - (lastPos as any).x;
        let dy = currentY - (lastPos as any).y;

        const newX = data.virtualFrame.x + dx;
        const newY = data.virtualFrame.y + dy;
        if(newX < 0) dx = 0;
        if(newY < 0) dy = 0;

        setLastPos({
            x: currentX,
            y: currentY,
        });

        data.move(dx, dy);
        onDragMove({ dx, dy });
    };

    const onDragStart = (e: any) => {
        e.cancelBubble = true;

        const stage = e.target.getStage();
        const { x: pointerX, y: pointerY } = stage.getPointerPosition();

        // 保存初始位置
        setLastPos({
            x: (pointerX - value.stagePos.x) / value.scale,
            y: (pointerY - value.stagePos.y) / value.scale,
        });

        // 保存元素的初始状态
        setDragStartState({
            pointId: 'drag',
            type: 'edge' as const,
            initialFlipX: data.flipX || false,
            initialFlipY: data.flipY || false,
            initialPos: {
                x: (pointerX - value.stagePos.x) / value.scale,
                y: (pointerY - value.stagePos.y) / value.scale
            },
            initialFrame: {
                x: data.virtualFrame.x,
                y: data.virtualFrame.y,
                width: data.virtualFrame.width,
                height: data.virtualFrame.height
            }
        });
    };

    const handleDragEnd = (e: any) => {
        if (dragStartState) {
            const frameDiff = {
                dx: data.virtualFrame.x - dragStartState.initialFrame.x,
                dy: data.virtualFrame.y - dragStartState.initialFrame.y,
                dWidth: data.virtualFrame.width - dragStartState.initialFrame.width,
                dHeight: data.virtualFrame.height - dragStartState.initialFrame.height,
                index: -1,
                pointId: 'drag',
                type: 'edge' as const
            };
            onUpdateCircle?.(frameDiff);
        }
        setDragStartState(null);
        onDragEnd?.(dragStartState);
    };

    const getEffectivePointId = (pointId: string, initialFlipX: boolean, initialFlipY: boolean) => {
        if (initialFlipX) {
            if (pointId === 'left') return 'right';
            if (pointId === 'right') return 'left';
        }
        if (initialFlipY) {
            if (pointId === 'top') return 'bottom';
            if (pointId === 'bottom') return 'top';
        }
        return pointId;
    };

    return (
        <Group
            draggable={true}
            dragBoundFunc={() => ({ x: value.stagePos.x, y: value.stagePos.x })}
            onDragMove={onDrag}
            onDragEnd={handleDragEnd}
            onDragStart={onDragStart}
            onMouseDown={e => e.cancelBubble = true}
        >
            {/* Selection box outline */}
            {/* <Line
                points={[x, y, x + width, y, x + width, y + height, x, y + height]}
                closed
                stroke="#00F"
                strokeWidth={1 / value.scale}
                dash={[5 / value.scale, 5 / value.scale]}
            /> */}

            {/* Control points (corners and edge midpoints) */}
            {basePoints && basePoints.length!=0 && basePoints.map((point:any, index: number) => (
                <Circle
                    key={point.id}
                    x={point.x}
                    y={point.y}
                    radius={4 / value.scale}
                    fill="#fff"
                    stroke="#00F"
                    strokeWidth={1 / value.scale}
                    draggable
                    onDragStart={handleCornerDragStart}
                    onDragMove={(e) => handleControlPointDragMove(e, point.id, point.type)}
                    onDragEnd={(e) => handleCornerDragEnd(e, index)}
                    dragBoundFunc={(pos) => ({
                        x: point.x * value.scale + value.stagePos.x,
                        y: point.y * value.scale + value.stagePos.y
                    })}
                />
            ))}
        </Group>
    );
};