import React from 'react';
import Image from "next/image";

interface ShapeItemProps {
    item: any,
    onDragStart: (e: React.DragEvent, type: string) => void;
    size: 'normal' | 'large';
}

const ShapeItem = ({item, onDragStart,size}: ShapeItemProps) => {

    if (!item) return null;

    return (
        <div className="flex flex-col items-center mb-2 cursor-move transition-all"
             draggable
             onDragStart={(e) => onDragStart(e, item.type)}
        >
            {item?.url ? (
                <div
                    className="flex bg-gray-50 p-1 rounded"
                    style={{
                        width: size == "large" ? "80px" : "50px",
                        height: size == "large" ? "80px" : "50px",
                        transform: item.svgTransform || 'none',
                    }}
                >
                    <Image
                        draggable={false}
                        width={72}
                        height={72}
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
                <div className="bg-gray-50 p-3 rounded">
                    <svg
                        width="100"
                        height="100"
                        viewBox="0 0 100 100"
                        style={{
                            width: size == "large" ? "40px" : '25px',
                            height: size == "large" ? "40px" : '25px',
                            color: '#222',
                            strokeWidth: 3
                        }}
                    >
                        {
                            item.style == 'dashed' ?
                                <path strokeDasharray='10 10' d={item.path} fill="none"
                                      stroke="currentColor" strokeWidth="3"/>
                                :
                                <path d={item.path} fill="none"
                                      stroke="currentColor" strokeWidth="3"/>
                        }
                    </svg>
                </div>

            )}
            <div className="mt-1 text-xs text-center  text-gray-800">{item.name}</div>
            <style jsx>{`

            `}</style>
        </div>
    );
};

export default ShapeItem;