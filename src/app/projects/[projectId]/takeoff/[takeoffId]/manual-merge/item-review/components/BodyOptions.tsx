export const BodyOptions = () => {
  const optionsArray = ["Floor Plan", "Elevation", "Schedule", "Key Notes"];

  return (
    <div className="flex gap-4">
      {optionsArray.map((value, index) => {
        const isSelected = index === 0;

        return (
          <div
            key={index}
            className={`flex rounded-md py-1 px-2 gap-2 text-xxs
            ${
              isSelected
                ? "bg-grey-light-hover text-grey-normal"
                : "bg-grey-light text-grey-light-strong"
            }`}
          >
            <p
              className={`rounded-md w-4 h-4 text-white text-center ${isSelected ? "bg-grey-normal" : "bg-grey-light-strong"}`}
            >
              {value.at(0)}
            </p>
            <p>{value}</p>
          </div>
        );
      })}
    </div>
  );
};
