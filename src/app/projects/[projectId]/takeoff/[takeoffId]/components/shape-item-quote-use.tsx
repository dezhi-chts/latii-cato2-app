import React from 'react';
import Image from "next/image";

interface ShapeItemProps {
    item: any,
    onDragStart: (e: React.DragEvent, type: string) => void;
}

const ShapeItemQuoteUse = ({item, onDragStart}: ShapeItemProps) => {

    if (!item) return null;

    return (
        <div className="flex flex-col items-center bg-gray-50 p-2 cursor-move transition-all"
             draggable
             onDragStart={(e) => onDragStart(e, item.type)}
             style={{width:"80px",marginLeft:"25px",paddingTop:"15px",paddingBottom:"15px",boxSizing:"border-box"}}
        >
            {item?.url ? (
                <div
                    className="flex"
                    style={{
                        width: 25, height: 25,
                        transform: item.svgTransform || 'none',
                    }}
                >
                    <Image
                        draggable={false}
                        width={25}
                        height={25}
                        src={item?.url}
                        alt={item?.name}
                    />
                </div>

                // <div
                //   className="shape-svg-container"
                //   style={{
                //     transform: item.svgTransform || 'none',
                //     backgroundImage: `url(${item.url})`,
                //     backgroundSize: 'contain',
                //     backgroundPosition: 'center',
                //     backgroundRepeat: 'no-repeat',
                //       width:25, height:25
                //   }}
                // />
            ) : (
                <svg
                    width="200"
                    height="200"
                    viewBox="0 0 100 100"
                    style={{width: '50px', height: '50px'}}
                    className="shape-svg"
                >
                    {
                        item.style == 'dashed' ?
                            <path strokeDasharray='10 10' d={item.path} fill="none"
                                  stroke="currentColor" strokeWidth="4"/>
                            :
                            <path d={item.path} fill="none"
                                  stroke="currentColor" strokeWidth="2"/>
                    }
                </svg>
            )}
            {/* <div className="mt-1 text-xs  text-gray-800">{item.name}</div> */}
            <style jsx>{`

            `}</style>
        </div>
    );
};

export default ShapeItemQuoteUse;