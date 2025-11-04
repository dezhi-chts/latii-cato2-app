import React, {useEffect, useState} from "react";
import {Group, Label, Rect, Shape, Text, Image} from "react-konva";
import Konva from "konva";
import {useSetting} from "../../context/settingContext";
import {useSelection} from "../../context/selectContext";
import {MenuItem, MenuPopover} from "../popover/MenuPopover";
import {DimensionData} from "../../data/operation/dimension";

interface MeasurementLabelProps {
    points: any[];
    dimension: DimensionData;
    length?: number;
    onLabelClick: (ref: React.RefObject<Konva.Label>, value: number) => void;
    onRemoveElement?: (e: any) => void;
    openEdit?: (e: any) => void;
}

const EditIcon = ({x = 0, y = 0}: any) => {
    const {value} = useSetting();

    const [image, setImage] = useState<HTMLImageElement | null>(null)
    const color = '#666'
    const svgString = `
     <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="${color}"/>
        <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" fill="${color}"/>
      </svg>
  `

    useEffect(() => {
        const img = new window.Image()
        const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'})
        const url = URL.createObjectURL(svgBlob)

        img.onload = () => {
            setImage(img)
            URL.revokeObjectURL(url)
        }
        img.src = url
    }, [])
    if (!image) return null;
    return (
        <Image
            image={image}
            x={x}
            y={y}
            width={12 / value.scale}
            height={12 / value.scale}
        />
    )
}

const MeasurementLabel = ({
                              points,
                              dimension,
                              length,
                              onLabelClick,
                              onRemoveElement,
                              openEdit,
                          }: MeasurementLabelProps) => {
    const labelRef = React.useRef<Konva.Label>(null);
    const labelOffset = 1;
    const {value} = useSetting();
    const {hasSelectedItem, toggleSelection} = useSelection();

    const [isDragging, setIsDragging] = useState(false);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

    const dimensionProps = dimension ? dimension.getDimensionProps() : null;

    const [startPoint, endPoint] = points;
    const startX = startPoint.x || startPoint.point?.x;
    const startY = startPoint.y || startPoint.point?.y;
    const endX = endPoint.x || endPoint.point?.x;
    const endY = endPoint.y || endPoint.point?.y;

    const isHorizontal = dimension
        ? dimension.direction === 'horizontal'
        : Math.abs(startY - endY) < Math.abs(startX - endX);

    const calculatedLength = length || (isHorizontal ?
        Math.abs(endX - startX) * value.sizeMultiples :
        Math.abs(endY - startY) * value.sizeMultiples);

    const handleClick = (e: any) => {
        e.cancelBubble = true;
        if (dimension) {
            toggleSelection(dimension,);
        }
    };

    const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);

    const handleDragStart = (e: any) => {
        e.cancelBubble = true;

        const stage = e.target.getStage();
        const {x: pointerX, y: pointerY} = stage.getPointerPosition();

        setLastPos({
            x: (pointerX - value.stagePos.x) / value.scale,
            y: (pointerY - value.stagePos.y) / value.scale,
        });

        setDragStart({
            x: startX,
            y: startY,
        });

        setIsDragging(true);
    };


    const handleDragMove = (e: any) => {
        if (!isDragging || !dimension || !lastPos) return;
        e.cancelBubble = true;

        const stage = e.target.getStage();
        const {x: pointerX, y: pointerY} = stage.getPointerPosition();

        const currentX = (pointerX - value.stagePos.x) / value.scale;
        const currentY = (pointerY - value.stagePos.y) / value.scale;

        const dx = currentX - lastPos.x;
        const dy = currentY - lastPos.y;

        setLastPos({
            x: currentX,
            y: currentY,
        });

        const canSwitchDirection = () => {
            if (dimension.points && dimension.points.length === 2) {
                const p1 = dimension.points[0];
                const p2 = dimension.points[1];

                const xDiff = Math.abs(p2.x - p1.x);
                const yDiff = Math.abs(p2.y - p1.y);

                if (xDiff < 1 || yDiff < 1) {
                    return false;
                }
            }
            return true;
        };

        const totalDx = currentX - dragStart.x;
        const totalDy = currentY - dragStart.y;

        const threshold = 15 / value.scale;

        if ((Math.abs(totalDx) > threshold || Math.abs(totalDy) > threshold) && canSwitchDirection()) {
            if (Math.abs(totalDx) > Math.abs(totalDy) && dimension.direction !== 'vertical') {
                dimension.direction = 'vertical';
                dimension.calculateDimensions();
            } else if (Math.abs(totalDy) > Math.abs(totalDx) && dimension.direction !== 'horizontal') {
                dimension.direction = 'horizontal';
                dimension.calculateDimensions();
            }
        }


        dimension.move(dx, dy);
    };

    const handleDragEnd = (e: any) => {
        setIsDragging(false);
        setLastPos(null);
        setDragStart(null);
    };

    const handleContextMenu = (e: any) => {
        e.cancelBubble = true;
        e.evt.preventDefault();

        const stage = e.target.getStage();
        const pointerPos = stage.getPointerPosition();

        setContextMenuPosition({
            x: pointerPos.x,
            y: pointerPos.y
        });
    };

    const closeContextMenu = () => {
        setContextMenuPosition(null);
    };

    const handleRemove = (e: any) => {
        onRemoveElement?.(dimension || e);
        closeContextMenu();
    };

    const handleToggleDirection = (e: any) => {
        if (dimension) {
            dimension.toggleDirection();
            closeContextMenu();
        }
    }

    // 菜单项
    const menuItems: MenuItem[] = [
        {
            id: 'toggleDirection',
            label: 'Toggle Direction',
            action: handleToggleDirection
        }
    ];

    if (onRemoveElement) {
        menuItems.push({
            id: 'remove',
            label: 'Remove',
            action: handleRemove
        });
    }

    // 获取是否选中状态
    const isSelected = dimension ? hasSelectedItem(dimension.id) : false;

    const renderDimension = () => {
        if (!dimensionProps) return null;

        const {data, x1, y1, x2, y2} = dimensionProps;

        if (isHorizontal) {
            return (
                <Group
                    onClick={handleClick}
                    onContextMenu={handleContextMenu}
                    draggable={true}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    dragBoundFunc={() => ({x: value.stagePos.x, y: value.stagePos.y})}
                >
                    {/* 主线 */}
                    <Shape
                        sceneFunc={(ctx, shape) => {
                            ctx.fillStyle = "#999";
                            ctx.beginPath();
                            ctx.moveTo(x1, data.y);
                            ctx.lineTo(x2, data.y);
                            ctx.stroke();
                        }}
                        stroke={isSelected ? "#1890ff" : "#999"}
                        strokeWidth={isSelected ? 2 : 1}
                    />
                    {/* 端点垂直线 */}
                    <Shape
                        sceneFunc={(ctx, shape) => {
                            const diff = data.y > y1 ? 1 : -1
                            // 起点垂直线
                            ctx.beginPath();
                            ctx.moveTo(x1, data.y + 10 * diff);
                            ctx.lineTo(x1, y1);
                            ctx.stroke();

                            // 终点垂直线
                            ctx.beginPath();
                            ctx.moveTo(x2, data.y + 10 * diff);
                            ctx.lineTo(x2, y2);
                            ctx.stroke();
                        }}
                        stroke={isSelected ? "#1890ff" : "#999"}
                        strokeWidth={isSelected ? 2 : 1}
                    />
                    <Shape
                        sceneFunc={(ctx, shape) => {
                            ctx.beginPath();
                            ctx.moveTo(x1 - 5, data.y - 5);
                            ctx.lineTo(x1 + 5, data.y + 5);
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.moveTo(x2 - 5, data.y - 5);
                            ctx.lineTo(x2 + 5, data.y + 5);
                            ctx.stroke();
                        }}
                        stroke={isSelected ? "#1890ff" : "#999"}
                        strokeWidth={isSelected ? 2 : 1}
                    />
                    {/* 标签 */}
                    {renderLabel(data.x, data.y)}
                </Group>
            );
        } else {
            return (
                <Group
                    onClick={handleClick}
                    onContextMenu={handleContextMenu}
                    draggable={true}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    dragBoundFunc={() => ({x: value.stagePos.x, y: value.stagePos.y})}
                >
                    {/* 主线 */}
                    <Shape
                        sceneFunc={(ctx, shape) => {
                            ctx.fillStyle = "#999";
                            ctx.beginPath();
                            ctx.moveTo(data.x, y1);
                            ctx.lineTo(data.x, y2);
                            ctx.stroke();
                        }}
                        stroke={isSelected ? "#1890ff" : "#999"}
                        strokeWidth={isSelected ? 2 : 1}
                    />
                    {/* 端点水平线 */}
                    <Shape
                        sceneFunc={(ctx, shape) => {
                            const diff = data.x > x1 ? 1 : -1
                            // 起点水平线
                            ctx.beginPath();
                            ctx.moveTo(data.x + 10 * diff, y1);
                            ctx.lineTo(x1, y1);
                            ctx.stroke();

                            // 终点水平线
                            ctx.beginPath();
                            ctx.moveTo(data.x + 10 * diff, y2);
                            ctx.lineTo(x2, y2);
                            ctx.stroke();
                        }}
                        stroke={isSelected ? "#1890ff" : "#999"}
                        strokeWidth={isSelected ? 2 : 1}
                    />

                    <Shape
                        sceneFunc={(ctx, shape) => {
                            ctx.beginPath();
                            ctx.moveTo(data.x - 5, y1 - 5);
                            ctx.lineTo(data.x + 5, y1 + 5);
                            ctx.stroke();
                            ctx.beginPath();
                            ctx.moveTo(data.x - 5, y2 - 5);
                            ctx.lineTo(data.x + 5, y2 + 5);
                            ctx.stroke();
                        }}
                        stroke={isSelected ? "#1890ff" : "#999"}
                        strokeWidth={isSelected ? 2 : 1}
                    />

                    {/* 标签 */}
                    {renderLabel(data.x, data.y)}
                </Group>
            );
        }
    };

    const mmToInches = (mm: number): number => {
        return mm / 25.4;
    };

    const renderLabel = (centerX = (startX + endX) / 2, centerY = (startY + endY) / 2) => {
        const inches = mmToInches(Math.abs(calculatedLength));
        const inchesDisplay = inches.toFixed(2) + '"';
        const mmDisplay = Math.abs(calculatedLength).toFixed(2);//+ "mm";
        let maxTextWidth = Math.max(inchesDisplay?.length * 7, mmDisplay?.length * 5) * 1.35;
        if (dimension.canEdit) maxTextWidth += 10;
        
        let labelOffsetY = 0;
        let labelOffsetX = 0;
        
        if (isHorizontal) {
            const isLeftSide = centerY < Math.min(startY, endY);
            const isRightSide = centerY > Math.max(startY, endY);
            if (isLeftSide) {
                labelOffsetY = -40;
            } else if (isRightSide) {
                labelOffsetY = 30;
            }
            
        } else {
            const isAbove = centerX < Math.min(startX, endX);
            const isBelow = centerX > Math.max(startX, endX);
            
            if (isAbove) {
                labelOffsetX = -45;
            } else if (isBelow) {
                labelOffsetX = 40;
            }
        }
        const labelY = centerY + labelOffsetY / value.scale;
        const labelX = centerX + labelOffsetX / value.scale;

        return (
            <Label
                ref={labelRef}
                onClick={(e) => {
                    e.cancelBubble = true;
                    onLabelClick(labelRef, Math.abs(calculatedLength));
                    if (dimension) {
                        toggleSelection(dimension);
                    }
                }}
                x={labelX}
                y={labelY}
                stroke="none"
                strokeWidth={0}
            >
                <Rect
                    width={(maxTextWidth) / value.scale}
                    height={30 / value.scale}
                    cornerRadius={5 / value.scale}
                    fill={isSelected ? "#e6f7ff" : "#eee"}
                    stroke={isSelected ? "#1890ff" : "none"}
                    strokeWidth={isSelected ? 1 / value.scale : 0}
                    offsetX={(24) / value.scale}
                    offsetY={10 / value.scale}
                ></Rect>
                <Text
                    text={inchesDisplay}
                    fontSize={14 / value.scale}
                    fill="#333"
                    align="center"
                    y={-2 / value.scale}
                    offsetX={15 / value.scale}
                />
                {/* <Text
                    text={mmDisplay}
                    fontSize={10 / value.scale}
                    fill="#333"
                    align="center"
                    y={15 / value.scale}
                    offsetX={15 / value.scale}
                /> */}
                {
                    dimension.canEdit &&
                    <Group
                        onClick={(e:any) => {
                            e.cancelBubble = true;
                            openEdit?.(e)
                        }}
                    >
                        <EditIcon x={(maxTextWidth / 2 - 10) / value.scale}/>
                    </Group>
                }
            </Label>
        );
    };

    return (
        <>
            {renderDimension() || (
                <Group
                    onClick={handleClick}
                    onContextMenu={handleContextMenu}
                    draggable={!!dimension}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    dragBoundFunc={() => ({x: value.stagePos.x, y: value.stagePos.y})}
                >
                    {isHorizontal ? (
                        <Group>
                            {/* 横线标识 */}
                            <Shape
                                sceneFunc={(ctx, shape) => {
                                    ctx.fillStyle = "#999";
                                    ctx.beginPath();
                                    ctx.moveTo(startX, startY);
                                    ctx.lineTo(endX, endY);
                                    ctx.stroke();
                                }}
                                stroke={isSelected ? "#1890ff" : "#999"}
                                strokeWidth={isSelected ? 2 : 1}
                            />
                            <Shape
                                sceneFunc={(ctx, shape) => {
                                    // 起点竖线
                                    ctx.beginPath();
                                    ctx.moveTo(startX, startY - 10);
                                    ctx.lineTo(startX, startY + 10);
                                    ctx.stroke();

                                    // 终点竖线
                                    ctx.beginPath();
                                    ctx.moveTo(endX, endY - 10);
                                    ctx.lineTo(endX, endY + 10);
                                    ctx.stroke();
                                }}
                                stroke={isSelected ? "#1890ff" : "#999"}
                                strokeWidth={isSelected ? 2 : 1}
                            />
                        </Group>
                    ) : (
                        <Group>
                            {/* 竖线标识 */}
                            <Shape
                                sceneFunc={(ctx, shape) => {
                                    ctx.fillStyle = "#999";
                                    ctx.beginPath();
                                    ctx.moveTo(startX, startY);
                                    ctx.lineTo(endX, endY);
                                    ctx.stroke();
                                }}
                                stroke={isSelected ? "#1890ff" : "#999"}
                                strokeWidth={isSelected ? 2 : 1}
                            />
                            <Shape
                                sceneFunc={(ctx, shape) => {
                                    // 起点横线
                                    ctx.beginPath();
                                    ctx.moveTo(startX - 10, startY);
                                    ctx.lineTo(startX + 10, startY);
                                    ctx.stroke();

                                    // 终点横线
                                    ctx.beginPath();
                                    ctx.moveTo(endX - 10, endY);
                                    ctx.lineTo(endX + 10, endY);
                                    ctx.stroke();
                                }}
                                stroke={isSelected ? "#1890ff" : "#999"}
                                strokeWidth={isSelected ? 2 : 1}
                            />
                        </Group>
                    )}
                    {renderLabel()}
                </Group>
            )}

            {contextMenuPosition && menuItems.length > 0 && (
                <MenuPopover
                    x={contextMenuPosition.x / value.scale}
                    y={contextMenuPosition.y / value.scale}
                    onClose={closeContextMenu}
                    menuItems={menuItems}
                />
            )}
        </>
    );
};

export default MeasurementLabel;
