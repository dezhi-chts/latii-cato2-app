import React from "react";
import { Group, Line } from "react-konva";
import { Direction } from "../data/singleSlidingSash";

interface DirectionIconProps {
  x: number;
  y: number;
  direction: Direction;
  iconSize?: number;
  arrowSize?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

const DirectionIcon: React.FC<DirectionIconProps> = ({
  x,
  y,
  direction,
  iconSize = 20,
  arrowSize = 6,
  strokeColor = "#666",
  strokeWidth = 1,
}) => {
  switch (direction) {
    case "right":
      return (
        <Group>
          <Line
            points={[x - iconSize / 2, y, x + iconSize / 2, y]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Line
            points={[
              x + iconSize / 2 - arrowSize,
              y - arrowSize,
              x + iconSize / 2,
              y,
              x + iconSize / 2 - arrowSize,
              y + arrowSize,
            ]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Group>
      );
    case "left":
      return (
        <Group>
          <Line
            points={[x - iconSize / 2, y, x + iconSize / 2, y]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Line
            points={[
              x - iconSize / 2 + arrowSize,
              y - arrowSize,
              x - iconSize / 2,
              y,
              x - iconSize / 2 + arrowSize,
              y + arrowSize,
            ]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Group>
      );
    case "leftRight":
      return (
        <Group>
          <Line
            points={[x - iconSize / 2, y, x + iconSize / 2, y]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Line
            points={[
              x - iconSize / 2 + arrowSize,
              y - arrowSize,
              x - iconSize / 2,
              y,
              x - iconSize / 2 + arrowSize,
              y + arrowSize,
            ]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Line
            points={[
              x + iconSize / 2 - arrowSize,
              y - arrowSize,
              x + iconSize / 2,
              y,
              x + iconSize / 2 - arrowSize,
              y + arrowSize,
            ]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Group>
      );
    case "fixed":
      return (
        <Group>
          <Line
            points={[x - iconSize / 2, y, x + iconSize / 2, y]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            dash={[2, 2]}
          />
          <Line
            points={[x, y - iconSize / 2, x, y + iconSize / 2]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            dash={[2, 2]}
          />
        </Group>
      );
    case "top":
      return (
        <Group>
          <Line
            points={[x, y - iconSize / 2, x, y + iconSize / 2]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Line
            points={[
              x - arrowSize,
              y - iconSize / 2 + arrowSize,
              x,
              y - iconSize / 2,
              x + arrowSize,
              y - iconSize / 2 + arrowSize,
            ]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Group>
      );

    case "bottom":
      return (
        <Group>
          <Line
            points={[x, y - iconSize / 2, x, y + iconSize / 2]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Line
            points={[
              x - arrowSize,
              y + iconSize / 2 - arrowSize,
              x,
              y + iconSize / 2,
              x + arrowSize,
              y + iconSize / 2 - arrowSize,
            ]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Group>
      );

    case "topBottom":
      return (
        <Group>
          <Line
            points={[x, y - iconSize / 2, x, y + iconSize / 2]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Line
            points={[
              x - arrowSize,
              y - iconSize / 2 + arrowSize,
              x,
              y - iconSize / 2,
              x + arrowSize,
              y - iconSize / 2 + arrowSize,
            ]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Line
            points={[
              x - arrowSize,
              y + iconSize / 2 - arrowSize,
              x,
              y + iconSize / 2,
              x + arrowSize,
              y + iconSize / 2 - arrowSize,
            ]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </Group>
      );

    default:
      return null;
  }
};

export default DirectionIcon;
