import { Radio } from "antd";
import Image from "next/image";
import { Label, Sublabel } from "../../item-review/components/Body";

export const Table = ({ labels }: any) => {
  const FIXED_WIDTH = 180;

  const standardCellClass =
    "border-r border-grey-light-hover h-full flex items-center justify-center";

  return (
    <div className="w-full mt-6 overflow-auto max-h-[50vh]">
      <div className="flex rounded-t-lg text-grey-normal bg-grey-light py-3 text-center min-w-max">
        <div className="w-8 flex-shrink-0 sticky left-0 z-10 bg-grey-light px-2" />
        <div style={{ width: FIXED_WIDTH }}>Label</div>
        <div style={{ width: FIXED_WIDTH }}>Sub-Label</div>
        <div style={{ width: FIXED_WIDTH }}>Category</div>
        <div style={{ width: FIXED_WIDTH }}>Type</div>
        <div style={{ width: FIXED_WIDTH }}>Open</div>
        <div className="w-8 flex-shrink-0 sticky right-0 z-10 bg-grey-light px-2" />
      </div>

      <div>
        {labels.map((label: Label) => {
          return (
            <div key={label.id}>
              <div className="flex text-grey-normal text-center min-w-max h-12 items-center border-b border-grey-light-hover ">
                <div className="w-8 flex-shrink-0 sticky left-0 h-full z-10 px-2  border-l border-r border-grey-light-hover bg-white">
                  <Radio className="h-full" />
                </div>
                <div
                  style={{ width: FIXED_WIDTH }}
                  className={standardCellClass}
                >
                  {label.label}
                </div>
                <div
                  style={{ width: FIXED_WIDTH }}
                  className={standardCellClass}
                >
                  {label.label}
                </div>
                <div
                  style={{ width: FIXED_WIDTH }}
                  className={standardCellClass}
                >
                  {label.category}
                </div>
                <div
                  style={{ width: FIXED_WIDTH }}
                  className={standardCellClass}
                >
                  {label.type}
                </div>
                <div style={{ width: FIXED_WIDTH }}>{label.open}</div>
                <div className="w-8 flex-shrink-0 sticky right-0 bg-white z-10 px-2 border-l border-r border-grey-light-hover h-full flex justify-center items-center">
                  <Image
                    src="/assets/icons/delete-merge-item.svg"
                    alt="Delete"
                    width={12}
                    height={12}
                  />
                </div>
              </div>
              {label.sublabels.map((sublabel: Sublabel, index: number) => {
                return (
                  <div
                    className="flex text-grey-normal text-center min-w-max h-12 items-center border-b border-grey-light-hover "
                    key={index}
                  >
                    <div className="w-8 flex-shrink-0 sticky left-0 bg-white z-10 px-2 border-l border-r border-grey-light-hover h-full"></div>
                    <div
                      style={{ width: FIXED_WIDTH }}
                      className={standardCellClass}
                    />
                    <div
                      style={{ width: FIXED_WIDTH }}
                      className={standardCellClass}
                    >
                      {sublabel.label}
                    </div>
                    <div
                      style={{ width: FIXED_WIDTH }}
                      className={standardCellClass}
                    >
                      {sublabel.category}
                    </div>
                    <div
                      style={{ width: FIXED_WIDTH }}
                      className={standardCellClass}
                    >
                      {sublabel.type}
                    </div>
                    <div style={{ width: FIXED_WIDTH }}>{sublabel.open}</div>
                    <div className="w-8 flex-shrink-0 sticky right-0 bg-white z-10 px-2 border-l border-r border-grey-light-hover h-full flex justify-center items-center">
                      <Image
                        src="/assets/icons/delete-merge-item.svg"
                        alt="Delete"
                        width={12}
                        height={12}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
