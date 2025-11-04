import {Circle, Group, Line, Text} from "react-konva";
import {useSetting} from "../../context/settingContext";
import {BaseFrame} from "../../data/baseFrame";
import {useState} from "react";
import {GroupFrame} from "../../data/groupFrame";
import {element} from "prop-types";
import {TopSemiCircleWindow, RightSemiCircleWindow} from "../../data/shape/semicircle";

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
    selectColor: string;
    onUpdateStart?:() => void;
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

export const SelectionBox: React.FC<SelectionBoxProps> = ({
                                                              x,
                                                              y,
                                                              width,
                                                              height,
                                                              onUpdate,
                                                              onDragEnd,
                                                              data,
                                                              onDragMove,
                                                              onUpdateCircle,
                                                              onUpdateStart,
                                                              selectColor
                                                          }) => {
    const {value} = useSetting();
    const [dragStartState, setDragStartState] = useState<DragStartState | null>(null);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    if (value.dragMode === 'removeLine') {
        return null;
    }
    const basePoints = [
        // Corners
        {id: 'topLeft', x: x, y: y, type: 'corner'},
        {id: 'topRight', x: x + width, y: y, type: 'corner'},
        {id: 'bottomRight', x: x + width, y: y + height, type: 'corner'},
        {id: 'bottomLeft', x: x, y: y + height, type: 'corner'},
        // Edge midpoints
        {id: 'top', x: x + width / 2, y: y, type: 'edge'},
        {id: 'right', x: x + width, y: y + height / 2, type: 'edge'},
        {id: 'bottom', x: x + width / 2, y: y + height, type: 'edge'},
        {id: 'left', x: x, y: y + height / 2, type: 'edge'}
    ];

    // Handle corner drag start
    const handleCornerDragStart = (e: any) => {
        e.cancelBubble = true;
        const stage = e.target.getStage();
        const {x: pointerX, y: pointerY} = stage.getPointerPosition();

        if (data.type == 'Group') {
            (data as GroupFrame).calculateChildrenRelations()
        }
        onUpdateStart()
        setIsResizing(true);
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
        const {x: pointerX, y: pointerY} = stage.getPointerPosition();
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
        let newParams: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
            flipX?: boolean;
            flipY?: boolean
        } = {};

        // 处理半圆形状的特殊逻辑
        const isSemiCircleH = data.type === "Arch-h" || data instanceof TopSemiCircleWindow;
        const isSemiCircleV = data.type === "Arch-v" || data instanceof RightSemiCircleWindow;

        if (type === 'edge') {
            const effectivePointId = getEffectivePointId(pointId, dragStartState.initialFlipX, dragStartState.initialFlipY);
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

                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.height > data.virtualFrame.width / 2) {
                                newParams.height = data.virtualFrame.width / 2;
                                newParams.y = y + height - newParams.height;
                            }
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

                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.height > data.virtualFrame.width / 2) {
                                newParams.height = data.virtualFrame.width / 2;
                            }
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

                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.height > data.virtualFrame.width / 2) {
                                newParams.height = data.virtualFrame.width / 2;
                            }
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

                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.height > data.virtualFrame.width / 2) {
                                newParams.height = data.virtualFrame.width / 2;
                                newParams.y = y + height - newParams.height;
                            }
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

                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.width > data.virtualFrame.height / 2) {
                                newParams.width = data.virtualFrame.height / 2;
                                newParams.x = x + width - newParams.width;
                            }
                            
                            // 对于横向半圆，如果宽度变化可能导致高度需要调整
                            if (isSemiCircleH && newParams.width !== undefined && data.virtualFrame.height > newParams.width / 2) {
                                newParams.height = newParams.width / 2;
                            }
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

                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.width > data.virtualFrame.height / 2) {
                                newParams.width = data.virtualFrame.height / 2;
                            }
                            
                            // 对于横向半圆，如果宽度变化可能导致高度需要调整
                            if (isSemiCircleH && newParams.width !== undefined && data.virtualFrame.height > newParams.width / 2) {
                                newParams.height = newParams.width / 2;
                            }
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

                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.width > data.virtualFrame.height / 2) {
                                newParams.width = data.virtualFrame.height / 2;
                            }
                            
                            // 对于横向半圆，如果宽度变化可能导致高度需要调整
                            if (isSemiCircleH && newParams.width !== undefined && data.virtualFrame.height > newParams.width / 2) {
                                newParams.height = newParams.width / 2;
                            }
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

                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.width > data.virtualFrame.height / 2) {
                                newParams.width = data.virtualFrame.height / 2;
                                newParams.x = x + width - newParams.width;
                            }
                            
                            // 对于横向半圆，如果宽度变化可能导致高度需要调整
                            if (isSemiCircleH && newParams.width !== undefined && data.virtualFrame.height > newParams.width / 2) {
                                newParams.height = newParams.width / 2;
                            }
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
            let effectivePointId = pointId;
            if (dragStartState.initialFlipY) {
                if (effectivePointId.includes('top')) {
                    effectivePointId = effectivePointId.replace('top', 'bottom');
                } else if (effectivePointId.includes('bottom')) {
                    effectivePointId = effectivePointId.replace('bottom', 'top');
                }
            }
            if (dragStartState.initialFlipX) {
                if (effectivePointId.includes('Left')) {
                    effectivePointId = effectivePointId.replace('Left', 'Right');
                } else if (effectivePointId.includes('Right')) {
                    effectivePointId = effectivePointId.replace('Right', 'Left');
                }
            }
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
                            
                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.height > newParams.width / 2) {
                                newParams.height = newParams.width / 2;
                                newParams.y = y + height - newParams.height;
                            }
                            
                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.width > newParams.height / 2) {
                                newParams.width = newParams.height / 2;
                                newParams.x = x + width - newParams.width;
                            }
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
                                ...(data.flipX ? {width: dx} : {x: actualX, width: dx}),
                                ...(data.flipY ? {height: dy} : {y: actualY, height: dy}),
                                flipX: data.flipX,
                                flipY: data.flipY
                            };
                            
                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.width !== undefined) {
                                const maxHeight = newParams.width / 2;
                                if (newParams.height > maxHeight) {
                                    newParams.height = maxHeight;
                                    if (!data.flipY) {
                                        newParams.y = y + height - newParams.height;
                                    }
                                }
                            }
                            
                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.height !== undefined) {
                                const maxWidth = newParams.height / 2;
                                if (newParams.width > maxWidth) {
                                    newParams.width = maxWidth;
                                    if (!data.flipX) {
                                        newParams.x = x + width - newParams.width;
                                    }
                                }
                            }
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
                            
                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.height > newParams.width / 2) {
                                newParams.height = newParams.width / 2;
                                newParams.y = y + height - newParams.height;
                            }
                            
                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.width > newParams.height / 2) {
                                newParams.width = newParams.height / 2;
                            }
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
                                ...(data.flipX ? {x: actualX, width: dx} : {width: dx}),
                                ...(data.flipY ? {height: dy} : {y: actualY, height: dy}),
                                flipX: data.flipX,
                                flipY: data.flipY
                            };
                            
                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.width !== undefined) {
                                const maxHeight = newParams.width / 2;
                                if (newParams.height > maxHeight) {
                                    newParams.height = maxHeight;
                                    if (!data.flipY) {
                                        newParams.y = y + height - newParams.height;
                                    }
                                }
                            }
                            
                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.height !== undefined) {
                                const maxWidth = newParams.height / 2;
                                if (newParams.width > maxWidth) {
                                    newParams.width = maxWidth;
                                    if (data.flipX) {
                                        newParams.x = x + width - newParams.width;
                                    }
                                }
                            }
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
                            
                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.height > newParams.width / 2) {
                                newParams.height = newParams.width / 2;
                            }
                            
                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.width > newParams.height / 2) {
                                newParams.width = newParams.height / 2;
                            }
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
                                ...(data.flipX ? {x: actualX, width: dx} : {width: dx}),
                                ...(data.flipY ? {y: actualY, height: dy} : {height: dy}),
                                flipX: data.flipX,
                                flipY: data.flipY
                            };
                            
                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.width !== undefined) {
                                const maxHeight = newParams.width / 2;
                                if (newParams.height > maxHeight) {
                                    newParams.height = maxHeight;
                                    if (data.flipY) {
                                        newParams.y = y + height - newParams.height;
                                    }
                                }
                            }
                            
                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.height !== undefined) {
                                const maxWidth = newParams.height / 2;
                                if (newParams.width > maxWidth) {
                                    newParams.width = maxWidth;
                                    if (data.flipX) {
                                        newParams.x = x + width - newParams.width;
                                    }
                                }
                            }
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
                            
                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.height > newParams.width / 2) {
                                newParams.height = newParams.width / 2;
                            }
                            
                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.width > newParams.height / 2) {
                                newParams.width = newParams.height / 2;
                                newParams.x = x + width - newParams.width;
                            }
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
                                ...(data.flipX ? {width: dx} : {x: actualX, width: dx}),
                                ...(data.flipY ? {y: actualY, height: dy} : {height: dy}),
                                flipX: data.flipX,
                                flipY: data.flipY
                            };
                            
                            // 对于横向半圆，限制高度不超过宽度的一半
                            if (isSemiCircleH && newParams.height !== undefined && newParams.width !== undefined) {
                                const maxHeight = newParams.width / 2;
                                if (newParams.height > maxHeight) {
                                    newParams.height = maxHeight;
                                    if (data.flipY) {
                                        newParams.y = y + height - newParams.height;
                                    }
                                }
                            }
                            
                            // 对于竖向半圆，限制宽度不超过高度的一半
                            if (isSemiCircleV && newParams.width !== undefined && newParams.height !== undefined) {
                                const maxWidth = newParams.height / 2;
                                if (newParams.width > maxWidth) {
                                    newParams.width = maxWidth;
                                    if (!data.flipX) {
                                        newParams.x = x + width - newParams.width;
                                    }
                                }
                            }
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
        e.cancelBubble = true;
        if (dragStartState) {
            const frameDiff = {
                dx: x - dragStartState.initialFrame.x,
                dy: y - dragStartState.initialFrame.y,
                dWidth: width - dragStartState.initialFrame.width,
                dHeight: height - dragStartState.initialFrame.height,
                index: index,
                pointId: dragStartState.pointId,
                type: dragStartState.type,
                flip: dragStartState.initialFlipX !== data.flipX || dragStartState.initialFlipY !== data.flipY,
            };
            console.log(frameDiff);
            onUpdateCircle?.(frameDiff);
        }

        setDragStartState(null);
        setIsResizing(false);
        console.log(e);
        console.log(index);
    };

    const onDrag = (e: any) => {
        e.cancelBubble = true;
        const stage = e.target.getStage();
        const {x: pointerX, y: pointerY} = stage.getPointerPosition();

        const currentX = (pointerX - value.stagePos.x) / value.scale;
        const currentY = (pointerY - value.stagePos.y) / value.scale;

        let dx = currentX - (lastPos as any).x;
        let dy = currentY - (lastPos as any).y;

        const newX = data.virtualFrame.x + dx;
        const newY = data.virtualFrame.y + dy;
        if (newX < 0) dx = 0;
        if (newY < 0) dy = 0;

        setLastPos({
            x: currentX,
            y: currentY,
        });

        data.move(dx, dy);
        onDragMove({dx, dy});
    };

    const onDragStart = (e: any) => {
        e.cancelBubble = true;

        const stage = e.target.getStage();
        const {x: pointerX, y: pointerY} = stage.getPointerPosition();

        setIsDragging(true);
        
        setLastPos({
            x: (pointerX - value.stagePos.x) / value.scale,
            y: (pointerY - value.stagePos.y) / value.scale,
        });

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
        // if (dragStartState) {
        //     const frameDiff = {
        //         dx: data.virtualFrame.x - dragStartState.initialFrame.x,
        //         dy: data.virtualFrame.y - dragStartState.initialFrame.y,
        //         dWidth: data.virtualFrame.width - dragStartState.initialFrame.width,
        //         dHeight: data.virtualFrame.height - dragStartState.initialFrame.height,
        //         index: -1,
        //         pointId: 'drag',
        //         type: 'edge' as const
        //     };
        //     // onUpdateCircle?.(frameDiff);
        // }
        setDragStartState(null);
        setIsDragging(false);
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

    const formatSize = (size: number) => {
        return (size * value.sizeMultiples).toFixed(0);
    };

    return (
        <Group
            draggable={true}
            dragBoundFunc={() => ({x: value.stagePos.x, y: value.stagePos.y})}
            onDragMove={onDrag}
            onDragEnd={handleDragEnd}
            onDragStart={onDragStart}
            onMouseDown={e => e.cancelBubble = true}
        >
            {/* Selection box outline */}
            <Line
                points={[x, y, x + width, y, x + width, y + height, x, y + height]}
                closed
                stroke={selectColor || "#00F"}
                strokeWidth={1 / value.scale}
                dash={[5 / value.scale, 5 / value.scale]}
                listening={false}
            />

            {/* Control points (corners and edge midpoints) */}
            {basePoints.map((point, index: number) => (
                <Circle
                    key={point.id}
                    x={point.x}
                    y={point.y}
                    radius={4 / value.scale}
                    fill="#fff"
                    stroke={selectColor || "#00F"}
                    strokeWidth={1 / value.scale}
                    onClick={e => {
                        console.log(point)
                        console.log(data)
                    }}
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
            
            {(isDragging || isResizing) && (
                <Group>
                    <Text
                        x={x + width / 2}
                        y={y - 20 / value.scale}
                        text={`W: ${formatSize(width)}mm`}
                        fontSize={12 / value.scale}
                        fill="#333"
                        align="center"
                        offsetX={0}
                        offsetY={0}
                        stroke="#fff"
                        strokeWidth={3 / value.scale}
                        strokeEnabled={true}
                        fillAfterStrokeEnabled={true}
                    />
                    <Text
                        x={x + width + 10 / value.scale}
                        y={y + height / 2}
                        text={`H: ${formatSize(height)}mm`}
                        fontSize={12 / value.scale}
                        fill="#333"
                        align="left"
                        offsetX={0}
                        offsetY={0}
                        stroke="#fff"
                        strokeWidth={3 / value.scale}
                        strokeEnabled={true}
                        fillAfterStrokeEnabled={true}
                    />
                </Group>
            )}
        </Group>
    );
};