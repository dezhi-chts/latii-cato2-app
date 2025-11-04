/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";

const ItemsPanel = ({ options }: any) => {
  return (
    <div className="w-[20%] flex flex-col gap-4 pt-8 pr-4">
      <p className="text-forumBlue text-sm">Page Labeling</p>
      <p className="text-basicGray text-xs mb-3">
        Label pages information to improve AI analysis.
      </p>
      {options.map((option: any, index: number) => {
        return (
          <div
            key={index}
            className="flex flex-col gap-2 bg-primaryN20 p-4 rounded-lg"
          >
            <div className="flex justify-between items-center text-xs text-basicGray">
              <p>{option.id}</p>
              <div
                className="flex gap-2 items-center px-3 py-0.5 rounded-full"
                style={{ backgroundColor: option.backgroundColor }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: option.dotColor }}
                />
                <p>{option.status}</p>
              </div>
            </div>
            <Image
              src={option.url}
              alt="example image"
              width={200}
              height={200}
              className="w-60 h-auto rounded"
            />
          </div>
        );
      })}
    </div>
  );
};

export default ItemsPanel;
