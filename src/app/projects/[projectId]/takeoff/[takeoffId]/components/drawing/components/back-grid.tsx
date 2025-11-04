import {Group, Line} from "react-konva";
import {useSetting} from "../context/settingContext";

// Calculate visible area and add buffer for smooth scrolling
export const GridBackground = ({ 
    width, 
    height, 
    cellSize = 20, 
    smallGridStroke = '#f0f0f0',
    largeGridStroke = '#e0e0e0',
    smallGridStrokeWidth = 1,
    largeGridStrokeWidth = 1,
    stageX = 0,  // Add stage position props
    stageY = 0 
}) => {
    const { value } = useSetting();
    const largeGridSize = cellSize * 5;
    
    const bufferFactor = 3;
    const totalWidth = width * bufferFactor;
    const totalHeight = height * bufferFactor;
    
    const offsetX = -(width * (bufferFactor - 1) / 2) + stageX;
    const offsetY = -(height * (bufferFactor - 1) / 2) + stageY;
    
    const lines = [];

    const startX = Math.floor(offsetX / cellSize) * cellSize;
    const startY = Math.floor(offsetY / cellSize) * cellSize;
    const endX = startX + totalWidth + cellSize;
    const endY = startY + totalHeight + cellSize;

    for (let i = startX; i <= endX; i += cellSize) {
        const isLargeGrid = Math.round(i / largeGridSize) * largeGridSize === i;
        lines.push(
            <Line
                key={`v-${i}`}
                points={[i, startY, i, endY]}
                stroke={isLargeGrid ? largeGridStroke : smallGridStroke}
                strokeWidth={isLargeGrid ? largeGridStrokeWidth : smallGridStrokeWidth}
            />
        );
    }

    for (let j = startY; j <= endY; j += cellSize) {
        const isLargeGrid = Math.round(j / largeGridSize) * largeGridSize === j;
        lines.push(
            <Line
                key={`h-${j}`}
                points={[startX, j, endX, j]}
                stroke={isLargeGrid ? largeGridStroke : smallGridStroke}
                strokeWidth={isLargeGrid ? largeGridStrokeWidth : smallGridStrokeWidth}
            />
        );
    }

    return <Group className="back-grid">{lines}</Group>;
};