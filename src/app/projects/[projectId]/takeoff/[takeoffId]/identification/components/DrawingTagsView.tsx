const DrawingTagsView = ({
  drawingTypeList,
  currentType,
  setCurrentType
}: {
  drawingTypeList: any[],
  currentType: string,
  setCurrentType: (type: string) => void
}) => {
  return (
    <div className="px-14 my-6 flex flex-row gap-3">
      {drawingTypeList.map((item) => {
        const primaryColor = item.color || "#717171";
        const bgColor = primaryColor + "1A";
        const miniBtnColor =
          item.type !== "All" ? primaryColor + "B3" : primaryColor;
        const typeTextColor =
          item.type !== "All" ? primaryColor + "80" : primaryColor;
        return (
          <div
            key={item.type}
            className="px-2 h-[26px] rounded-md flex flex-row items-center cursor-pointer"
            style={{ backgroundColor: bgColor }}
            onClick={() => {
              setCurrentType(item.type);
            }}
          >
            {item.type !== "All" && (
              <span
                className="px-[5px] py-[1px] rounded-md text-xxs text-white"
                style={{ backgroundColor: miniBtnColor }}
              >
                {item.type?.length > 0 ? item.type[0].toUpperCase() : ""}
              </span>
            )}
            <span className="ml-2 text-xxs" style={{ color: typeTextColor }}>
              {item.type}
            </span>
            <span
              className="ml-4 px-[5px] py-[1px] text-xxs bg-white rounded"
              style={{ color: miniBtnColor }}
            >
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default DrawingTagsView;