import { useSetting } from "../../context/settingContext";
import {GroupFrame} from "../../data/groupFrame";
import lineUntil from "../../until/lineUntil";
import { Group, Rect, Text } from "react-konva";


interface MoveControlProps {
    frame: GroupFrame;
    text?: string | number;
    zIndex?: number

}
const IndexShower = ({
                         frame,
                         text = "",
    zIndex,
                     }: MoveControlProps) => {
    const { value } = useSetting();
    const { scale, stagePos } = value;

    const controlWidth = 25 / scale;
    const controlHeight = 15 / scale;

    const location = (() => {
        if ((frame as GroupFrame)?.lines && (frame as GroupFrame)?.lines?.length > 0) {
            const vertices = (frame as GroupFrame).lines.map((line: any) => ({
                x: line.lineInfo?.x1 || 0,
                y: line.lineInfo?.y1 || 0,
            }));

            const center = lineUntil.getCentroid(vertices);

            return {
                x: center.x - controlWidth / 2,
                y: center.y - controlHeight / 2,
            };
        }

        return {
            x: frame.virtualFrame.x + frame.virtualFrame.width / 2 - controlWidth / 2,
            y: frame.virtualFrame.y + frame.virtualFrame.height / 2 - controlHeight / 2,
        };
    })();

    return (
        <Group
            x={location.x}
            y={location.y}
            zIndex={zIndex}
        >
            <Rect
                width={controlWidth}
                height={controlHeight}
                fill="#091E42"
                cornerRadius={5 / value.scale}
            />
            <Text
                width={controlWidth}
                height={controlHeight}
                text={String(text)}
                fill="white"
                fontSize={12 / value.scale}
                fontFamily="Arial"
                align="center"
                verticalAlign="middle"
            />
        </Group>
    );
};

export default IndexShower;
