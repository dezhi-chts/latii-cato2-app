import React from "react";
import { useSetting } from "../../context/settingContext";

interface RulerProps {
  width: number;
  height: number;
  rulerSize?: number;
  viewportOffset: {
    x: number;
    y: number;
  };
  onSelectAll?: () => void;
}

export const Ruler: React.FC<RulerProps> = ({
  width,
  height,
  rulerSize = 20,
  viewportOffset,
  onSelectAll,
}) => {
  const { value } = useSetting();
  const sizeMultiples = value.sizeMultiples;
  const sizeSpace = 10;

  const getMarks = (length: number, isHorizontal: boolean) => {
    const marks = [];
    const scaledLength = length / value.scale;
    const step = 10 * sizeSpace;

    const offset = isHorizontal
      ? viewportOffset.x / value.scale
      : viewportOffset.y / value.scale;

    const startIndex = Math.floor(offset / step) * step;
    const endIndex = Math.ceil((offset + scaledLength) / step) * step;

    for (let i = startIndex; i <= endIndex; i += step) {
      const position = (i - offset) * value.scale;

      if (position >= -step && position <= length + step) {
        marks.push(
          <React.Fragment key={`mark-${i}`}>
            {/* tick marks */}
            <div
              className={`absolute bg-gray-500 ${
                isHorizontal ? "w-px h-3" : "h-px w-3"
              }`}
              style={{
                [isHorizontal ? "left" : "top"]: `${position}px`,
                [isHorizontal ? "top" : "left"]: rulerSize - 12,
              }}
            />
            <div
              className={`absolute text-xxs text-gray-500 ${
                isHorizontal ? "-translate-x-1/2" : "-translate-y-1/2"
              }`}
              style={{
                [isHorizontal ? "left" : "top"]: `${position}px`,
                [isHorizontal ? "top" : "left"]: 0,
              }}
            >
              {Math.abs((i * sizeMultiples) / 1000) + "m"}
            </div>
          </React.Fragment>
        );

        if (i + step <= endIndex) {
          for (let j = 1; j < 10; j++) {
            const subPosition = (i + j * sizeSpace - offset) * value.scale;
            if (
              subPosition >= -sizeSpace &&
              subPosition <= length + sizeSpace
            ) {
              marks.push(
                <div
                  key={`submark-${i}-${j}`}
                  className={`absolute bg-gray-300 ${
                    isHorizontal ? "w-px h-1.5" : "h-px w-1.5"
                  }`}
                  style={{
                    [isHorizontal ? "left" : "top"]: `${subPosition}px`,
                    [isHorizontal ? "top" : "left"]: rulerSize - 8,
                  }}
                />
              );
            }
          }
        }
      }
    }
    return marks;
  };

  return (
    <>
      <div
        className="absolute left-0 top-0 bg-white border-r border-b border-gray-200 cursor-pointer hover:bg-gray-100"
        style={{ width: rulerSize, height: rulerSize }}
        onClick={onSelectAll}
        title="Select All Elements"
      />
      <div
        className="absolute left-[25px] top-0 bg-white border-b border-gray-200"
        style={{ width: width, height: rulerSize }}
      >
        {getMarks(width + rulerSize, true)}
      </div>

      <div
        className="absolute left-0 top-[25px] bg-white border-r border-gray-200"
        style={{ width: rulerSize, height: height }}
      >
        {getMarks(height + rulerSize, false)}
      </div>
    </>
  );
};
