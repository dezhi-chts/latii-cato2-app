import React from "react";
import { Group, Path } from "react-konva";

interface HandleLockProps {
    x: number;
    y: number;
    rotation?: number;
}

export const HandleLock: React.FC<HandleLockProps> = ({ x, y, rotation = 0 }) => {
    const handleWidth = 20;
    const handleHeight = 8;
    const baseWidth = 8;
    const baseHeight = 25;
    const radius = 1;

    return (
        <Group x={x} y={y} rotation={rotation}>
            <Path
                data={`
                    M${-baseWidth/2 + radius},${-baseHeight/2}
                    H${baseWidth/2 - radius}
                    Q${baseWidth/2},${-baseHeight/2} ${baseWidth/2},${-baseHeight/2 + radius}
                    V${baseHeight/2 - radius}
                    Q${baseWidth/2},${baseHeight/2} ${baseWidth/2 - radius},${baseHeight/2}
                    H${-baseWidth/2 + radius}
                    Q${-baseWidth/2},${baseHeight/2} ${-baseWidth/2},${baseHeight/2 - radius}
                    V${-baseHeight/2 + radius}
                    Q${-baseWidth/2},${-baseHeight/2} ${-baseWidth/2 + radius},${-baseHeight/2}
                    Z
                `}
                fill="#D0D0D0"
                stroke="#808080"
                strokeWidth={1}
            />

            <Path
                data={`
                    M${-handleWidth - 5 + radius},${-handleHeight/2}
                    H${5 - radius}
                    Q${5},${-handleHeight/2} ${5},${-handleHeight/2 + radius}
                    V${handleHeight/2 - radius}
                    Q${5},${handleHeight/2} ${5 - radius},${handleHeight/2}
                    H${-handleWidth - 5 + radius}
                    Q${-handleWidth - 5},${handleHeight/2} ${-handleWidth - 5},${handleHeight/2 - radius}
                    V${-handleHeight/2 + radius}
                    Q${-handleWidth - 5},${-handleHeight/2} ${-handleWidth - 5 + radius},${-handleHeight/2}
                    Z
                `}
                fill="#D0D0D0"
                stroke="#808080"
                strokeWidth={1}
            />

            <Path
                data={`
                    M${-handleWidth + 1},${-handleHeight/2 + 1}
                    L${-5},${-handleHeight/2 + 1}
                `}
                stroke="#FFFFFF"
                strokeWidth={1}
                opacity={0.5}
            />
        </Group>
    );
};