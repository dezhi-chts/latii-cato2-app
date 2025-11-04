'use client';

import React from 'react';
import {Group, Path, Rect} from 'react-konva';
import { SDLHorizontal, SDLVertical, TDLHorizontal, TDLVertical } from '../../data/divider/divider';
import { useSetting } from '../../context/settingContext';
import { useSelection } from '../../context/selectContext';

const pocketWallOverlapColor = '#EDEDEC';

interface DividerFrameProps {
    data: SDLHorizontal | SDLVertical | TDLHorizontal | TDLVertical;
    isGroupChild?: boolean;
    drag?: boolean;
    onDragMove: (e: any) => void;
    onDragEnd: (e: any) => void;
    onMouseDown: (e: any) => void;
}

export const DividerFrame: React.FC<DividerFrameProps> = ({
    data,
    isGroupChild = false,
    drag = true,
    onDragMove,
    onDragEnd,
    onMouseDown,
}) => {
    const { value } = useSetting();
    const { hasSelectedItem } = useSelection();
    const isSelected = hasSelectedItem(data.id);
    const isDraggable = drag && !isGroupChild && value.dragMode !== 'removeLine';
    
    const [lastPos, setLastPos] = React.useState<{ x: number; y: number } | null>(null);
    
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
        
        setLastPos({
            x: (pointerX - value.stagePos.x) / value.scale,
            y: (pointerY - value.stagePos.y) / value.scale,
        });
    };

    const renderPocketWallDivider = () => {
        const pocketWallOverlap = data.getAllPocketWallOverlaps();
        if( pocketWallOverlap && pocketWallOverlap?.length == 0 ){
            return null;
        }

        return pocketWallOverlap.map((overlap, index) => {
            let points = [];
            if ( data.type.includes('-h') ){
                points = [
                    {x: overlap.x, y: overlap.y},
                    {x: overlap.x + overlap.width, y: overlap.y}
                ]
            } else {
                points = [
                    {x: overlap.x, y: overlap.y},
                    {x: overlap.x, y: overlap.y + overlap.height}
                ]
            }
            
            return <Path
                key={`overlap-${index}`}
                data={`M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`}
                stroke={pocketWallOverlapColor}
                strokeWidth={8}
                border={'transparent'}
            />
        })
    }

    return (
        <Group
            onMouseDown={onMouseDown}
            draggable={isDraggable}
            dragBoundFunc={() => ({ x: value.stagePos.x, y: value.stagePos.y })}
            onDragMove={onDrag}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
        >
            <Rect
              width={data.type.includes('v') ? data.virtualFrame.width * 4 : data.virtualFrame.width}
              height={data.type.includes('h') ? data.virtualFrame.height * 4 : data.virtualFrame.height}
                // fill='red'
              stroke="none"
              strokeWidth={0}
              offsetX={data.type.includes('v') ? data.virtualFrame.width * 2 : 0}
              offsetY={data.type.includes('h') ? data.virtualFrame.height * 2 : 0}
              x={data.virtualFrame.x}
              y={data.virtualFrame.y}
            />
            <Path
              data={`M ${data.points[0].x} ${data.points[0].y} L ${data.points[1].x} ${data.points[1].y}`}
              // fill={hasSelectedItem(data.id) ? '#7ba2cf' : data.style.color.fill}
              stroke={data.style.color.border}
              strokeWidth={5}
            />

            { renderPocketWallDivider() }
            

            
            {/*/!* 渲染矩形 *!/*/}
            {/*<Rect*/}
            {/*    x={x}*/}
            {/*    y={y}*/}
            {/*    width={width}*/}
            {/*    height={height}*/}
            {/*    fill={getFillColor()}*/}
            {/*    opacity={0.8}*/}
            {/*    stroke={isSelected ? '#1890ff' : '#000'}*/}
            {/*    strokeWidth={isSelected ? 2 / value.scale : 1 / value.scale}*/}
            {/*/>*/}
        </Group>
    );
}; 