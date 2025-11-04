'use client';

import React from 'react';
import { Rect } from 'react-konva';
import AngleRestrictedLine from './midting-select';
import { INewRectangle } from '../../datas';

interface SelectRectProps {
    type: string;
    newRectangle: INewRectangle | null;
}

const SelectRect: React.FC<SelectRectProps> = ({ type, newRectangle }) => {
    if (!newRectangle) return null;
    switch (type) {
        case "frame":
            return (
                <Rect
                    x={newRectangle.x}
                    y={newRectangle.y}
                    width={newRectangle.x2 - newRectangle.x}
                    height={newRectangle.y2 - newRectangle.y}
                    fill="rgba(42,94,204,0.5)"
                    stroke="rgba(42,94,204,0.7)"
                    strokeWidth={1}
                />
            );

        case "midting":
            return (
                <AngleRestrictedLine
                    startX={newRectangle.x}
                    startY={newRectangle.y}
                    mouseX={newRectangle.x2}
                    mouseY={newRectangle.y2}
                />
            );

        case "operableSash":
        case "multipOperableSash":
        case "slidingSash":
        case 'pivotSash':
        default:
            return (
                <Rect
                    x={Math.min(newRectangle.x, newRectangle.x2)}
                    y={Math.min(newRectangle.y, newRectangle.y2)}
                    width={Math.abs(newRectangle.x2 - newRectangle.x)}
                    height={Math.abs(newRectangle.y2 - newRectangle.y)}
                    stroke="rgba(42,94,204,0.7)"
                    strokeWidth={2}
                    dash={[10, 5]}
                />
            );
    }
};

export default SelectRect;