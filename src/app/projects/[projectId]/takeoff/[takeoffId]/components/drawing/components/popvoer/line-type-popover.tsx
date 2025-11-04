import {Group, Rect, Text} from "react-konva";
import {useSetting} from "../../context/settingContext";

const LineTypePopover = ({ popoverInfo ,handleTypeSelect } :any) => {
    const { value } = useSetting();
    if (!popoverInfo) return null;

    const popoverWidth = 100 / value.scale;
    const popoverHeight = 70 / value.scale;
    const buttonHeight = 25 / value.scale;
    const padding = 5 / value.scale;

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
                onClick={() => handleTypeSelect('straight')}
            >
                {/*<Rect*/}
                {/*    width={popoverWidth - 2 * padding}*/}
                {/*    height={buttonHeight}*/}
                {/*    fill={ popoverInfo.type === 'straight' ? '#f5f5f5' : '' }*/}
                {/*    cornerRadius={4}*/}
                {/*/>*/}
                <Text
                    text="Straight"
                    width={popoverWidth - 2 * padding}
                    height={buttonHeight}
                    align="center"
                    fill={ popoverInfo.type == 'straight' ? '#0A5D88' : '#333' }
                    verticalAlign="middle"
                    fontSize={14 / value.scale}
                />
            </Group>

            <Group
                x={popoverInfo.x + padding}
                y={popoverInfo.y + buttonHeight + 2 * padding}
                onClick={() => handleTypeSelect('circle')}
            >
                {/*<Rect*/}
                {/*    width={popoverWidth - 2 * padding}*/}
                {/*    height={buttonHeight}*/}
                {/*    fill={ popoverInfo.type === 'circle' ? '#f5f5f5' : '' }*/}
                {/*    cornerRadius={4}*/}
                {/*/>*/}
                <Text
                    text="Curve"
                    width={popoverWidth - 2 * padding}
                    height={buttonHeight}
                    fill={ popoverInfo.type == 'circle' ? '#0A5D88' : '#333' }
                    align="center"
                    verticalAlign="middle"
                    fontSize={14  / value.scale}
                />
            </Group>
        </Group>
    );
};

export default LineTypePopover;