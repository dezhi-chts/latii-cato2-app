import {Group, Rect,Text} from "react-konva";
import {useSetting} from "../../context/settingContext";

export const MergePopover = ({ popoverInfo, handleMergeSelect }: any) => {
    const { value } = useSetting();

    if (!popoverInfo) return null;
    const popoverWidth = 100/ value.scale;
    const popoverHeight = 35/ value.scale;
    const buttonHeight = 25/ value.scale;
    const padding = 5/ value.scale;

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
                onClick={() => handleMergeSelect('merge')}
            >
                <Text
                    text="Merge"
                    width={popoverWidth - 2 * padding}
                    height={buttonHeight}
                    align="center"
                    fill="#333"
                    verticalAlign="middle"
                    fontSize={14 / value.scale}
                />
            </Group>

            {/*<Group*/}
            {/*    x={popoverInfo.x + padding}*/}
            {/*    y={popoverInfo.y + buttonHeight + 2 * padding}*/}
            {/*    onClick={() => handleMergeSelect('cancelMerge')}*/}
            {/*>*/}
            {/*    <Text*/}
            {/*        text="Un-Merge"*/}
            {/*        width={popoverWidth - 2 * padding}*/}
            {/*        height={buttonHeight}*/}
            {/*        fill="#333"*/}
            {/*        align="center"*/}
            {/*        verticalAlign="middle"*/}
            {/*        fontSize={14}*/}
            {/*    />*/}
            {/*</Group>*/}
        </Group>
    );
};