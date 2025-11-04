import React from 'react';
import ShapeItem from './shape-item';
import {DividerType, frameShapes, operationShapes, sashes} from './drawing/datas';

interface ShapeListProps {
    type: 'frame' | 'divider' | 'operation' | 'sash';
    size: 'normal' | 'large';
}

const dividerShapes = [
    {
        type: DividerType.SDL_H,
        path: 'M 0,50 L 100,50',
        name: 'SDL-H'
    },
    {
        type: DividerType.SDL_V,
        path: 'M 49,0 L 49,100',
        name: 'SDL-V'
    },
    {
        type: DividerType.TDL_H,
        path: 'M 0,50 L 100,50',
        name: 'TDL-H'
    },
    {
        type: DividerType.TDL_V,
        path: 'M 49,0 L 49,100',
        name: 'TDL-V'
    }
];

const ShapeList: React.FC<ShapeListProps> = ({ type = 'frame', size = "normal" }) => {
    let shapes;
    
    switch (type) {
        case 'frame':
            shapes = frameShapes;
            break;
        case 'divider':
            shapes = dividerShapes;
            break;
        case 'operation':
            shapes = operationShapes;
            break;
        case 'sash':
            shapes = sashes;
            break
        default:
            shapes = frameShapes;
    }
    
    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('shape-type', type);
    };

    return (
        <div className=" grid grid-cols-3 gap-1 w-full">
            {shapes.map((shape, index) => (
                <ShapeItem
                    key={index}
                    item={shape}
                    size={size}
                    // type={shape.type}
                    // path={shape.path}
                    // name={shape.name}
                    onDragStart={handleDragStart}
                />
            ))}
        </div>
    );
};

export default ShapeList;