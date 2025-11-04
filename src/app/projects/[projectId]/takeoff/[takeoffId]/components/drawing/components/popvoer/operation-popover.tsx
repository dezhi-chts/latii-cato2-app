import { Group, Rect, Text } from "react-konva";
import {useSetting} from "../../context/settingContext";

interface OperationPopoverProps {
    popoverInfo: {
        x: number;
        y: number;
        type: 'merge' | 'unmerge';
    };
    onSelect: (type: 'merge' | 'unmerge') => void;
}

export const OperationPopover = ({ popoverInfo, onSelect }: OperationPopoverProps) => {
    const { value } = useSetting();

    if (!popoverInfo) return null;
    const popoverWidth = 100/ value.scale;
    const popoverHeight = 35/ value.scale;
    const buttonHeight = 25/ value.scale;
    const padding = 5/ value.scale;

    const getText = () => {
        return popoverInfo.type === 'merge' ? 'Merge' : 'Un-Merge';
    };

    return (
        <Group>
            <Rect
                x={popoverInfo.x}
                y={popoverInfo.y}
                width={popoverWidth}
                height={popoverHeight}
                fill="white"
                stroke="#ccc"
                cornerRadius={4}
                shadowColor="black"
                shadowBlur={6}
                shadowOpacity={0.1}
            />

            <Group
                x={popoverInfo.x + padding}
                y={popoverInfo.y + padding}
                onClick={() => onSelect(popoverInfo.type)}
            >
                <Text
                    text={getText()}
                    width={popoverWidth - 2 * padding}
                    height={buttonHeight}
                    align="center"
                    fill="#333"
                    verticalAlign="middle"
                    fontSize={14 / value.scale}
                />
            </Group>
        </Group>
    );
};