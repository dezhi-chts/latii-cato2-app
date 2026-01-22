import Image from "next/image";

// 缩放控件
export const ZoomControls = ({
  zoom,
  handleZoomChange,
}: {
  zoom: number;
  handleZoomChange: (zoom: number) => void;
}) => {
  return (
    <div className="flex flex-row">
      <div
        className="w-7 h-6 flex justify-center items-center rounded-tl-xl rounded-bl-xl bg-primaryGray cursor-pointer text-baseGray"
        onClick={() => {
          handleZoomChange(zoom - 0.1);
        }}
      >
        -
      </div>
      <div
        className="w-7 h-6 flex justify-center items-center rounded-tr-xl rounded-br-xl bg-primaryGray cursor-pointer text-baseGray"
        style={{ marginLeft: 1 }}
        onClick={() => handleZoomChange(zoom + 0.1)}
      >
        +
      </div>

      <span
        className="ml-4 flex items-center justify-center rounded-md text-center text-basicDarkGray text-[10px] border border-solid border-primaryN30"
        style={{
          width: 54,
          height: 24,
        }}
      >
        {(zoom * 100).toFixed(0) + "%"}
      </span>
    </div>
  )
}

// 页码切换控件
export const PageControls = ({
  page,
  totalPages,
  handlePageChange,
}: {
  page: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
}) => {
  return (
    <div className="flex gap-3 items-center rounded-lg border border-primaryN30 overflow-hidden px-1">
      <div
        className={`h-full py-2 w-2 flex items-center justify-center ${page === 1 ? "cursor-default opacity-50" : "cursor-pointer"
          }`}
        onClick={() => handlePageChange(page - 1)}
      >
        <Image
          src="/assets/icons/arrow-left-gray.svg"
          alt="arrow left icon"
          width={6}
          height={6}
        />
      </div>
      <p className="text-basicGray text-xxs">Page {page}</p>
      <div
        className={`h-full py-2 w-2 flex items-center justify-center ${page === totalPages
          ? "cursor-default opacity-50"
          : "cursor-pointer"
          }`}
        onClick={() => handlePageChange(page + 1)}
      >
        <Image
          src="/assets/icons/arrow-right-gray.svg"
          alt="arrow right icon"
          width={6}
          height={6}
        />
      </div>
    </div>
  )
}

// 旋转控件
export const RotateControls = ({
  handleRotate,
}: {
  handleRotate: () => void;
}) => {
  return (
    <div
      className={`rounded pl-3 pr-3 py-1 flex items-center cursor-pointer hover:bg-primaryN30 transition-all duration-150 bg-primaryN20 text-basicGray`}
      onClick={() => handleRotate()}
    >
      <p className="text-xs text-center">Rotate</p>
    </div>
  )
}

// 添加矩形框
export const AddRectBoxControls = ({
  handleAddRectBox,
}: any) => {
  return (
    <div
      className={`w-[124px] h-[28px] bg-forumBlue text-white rounded-md flex justify-center items-center gap-2 cursor-pointer transition-all duration-150`}
      onClick={() => handleAddRectBox()}
    >
      <p className="text-xs text-center">Index Box</p>
      <Image
        src={`/assets/icons/add-table-white.svg`}
        alt="add item icon"
        width={14}
        height={14}
      />
    </div>
  )
}

