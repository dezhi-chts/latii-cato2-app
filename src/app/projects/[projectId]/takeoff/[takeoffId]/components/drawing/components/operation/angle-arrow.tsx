'use client';

import React, {useState} from 'react';
import { Group, Line, Path, Rect } from 'react-konva';
import { ArrowData } from '../../data/operation/arrow';
import { AngleData } from '../../data/operation/angle';
import { useSetting } from '../../context/settingContext';
import { Dashed } from '../../data/operation/dashed';
import {FixedData} from "../../data/operation/fixed";

interface AngleArrowFrameProps {
    data: ArrowData | AngleData | Dashed;
    isGroupChild?: boolean;
    drag?: boolean;
    onMouseDown?: (e: any) => void;
    onDragMove?: (e: any) => void;
    onDragEnd?: (e: any) => void;
}

export const AngleArrow: React.FC<AngleArrowFrameProps> = ({
    data,
    isGroupChild = false,
    drag = true,
    onMouseDown,
    onDragMove,
    onDragEnd
}) => {
    const { value } = useSetting();

    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

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
        onDragMove?.({ dx, dy });
    };


    const onDragStart = (e: any) => {
        e.cancelBubble = true;

        const stage = e.target.getStage();
        const { x: pointerX, y: pointerY } = stage.getPointerPosition();

        setLastPos({
            x: (pointerX - value.stagePos.x) / value.scale,
            y: (pointerY -value. stagePos.y) / value.scale,
        });
    };

    const renderPath = () => {
        // if (data instanceof ArrowData) {
        //     const path = data.getPath();
        //     return (
        //         <Line
        //             points={pathToPoints(path)}
        //             stroke={'#000'}
        //             strokeWidth={1}
        //         />
        //     );
        // } else
        if (data instanceof AngleData) {
            const { path, strokeDasharray } = data.getPath();
            return (
                <Line
                    points={pathToPoints(path)}
                    stroke={'#000'}
                    strokeWidth={1}
                    dash={strokeDasharray ? strokeDasharray.split(',').map(Number) : undefined}
                />
            );
        } else if (data instanceof Dashed) {
            const { path, strokeDasharray } = data.getPath();
            return (
                <Line
                    points={pathToPoints(path)}
                    stroke={data.style.color.border}
                    strokeWidth={1}
                    dash={strokeDasharray.split(',').map(Number)}
                />
            );
        } else if (data instanceof FixedData) {
            const { path, strokeDasharray } = data.getPath();
            return (
                <Path
                    data={path}
                    stroke={data.style.color.border}
                    strokeWidth={1}
                    dash={[3,3]}
                />
            );
        }
        return null;
    };

    // Helper function to convert SVG path to Konva points
    const pathToPoints = (path: string): number[] => {
        const points: number[] = [];
        const commands = path.split(/(?=[MLZ])/);

        commands.forEach(cmd => {
            if (cmd.startsWith('M') || cmd.startsWith('L')) {
                const [x, y] = cmd.slice(1).trim().split(',').map(Number);
                points.push(x, y);
            }
        });

        return points;
    };

    return (
        <Group
            x={data.virtualFrame.x}
            y={data.virtualFrame.y}
            draggable={drag && !isGroupChild}
            dragBoundFunc={() => ({ x: value.stagePos.x, y: value.stagePos.x })}
            onMouseDown={onMouseDown}
            onDragMove={onDrag}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <Rect
                width={data.virtualFrame.width}
                height={data.virtualFrame.height}
                fill='transparent'
                stroke='transparent'
                strokeWidth={1}
            />
            {renderPath()}
        </Group>
    );
};