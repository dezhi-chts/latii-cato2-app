"use client";

type HeaderOption = {
  id: number;
  text: string;
};

const headerOptions: HeaderOption[] = [
  { id: 1, text: "Your Company" },
  { id: 2, text: "Base Product" },
  { id: 3, text: "Adds On" },
  { id: 4, text: "Brand Pricing" },
  { id: 5, text: "Quoting Settings" },
];

type HeaderProps = {
  selectedOptionId: number;
  setSelectedOptionId: React.Dispatch<React.SetStateAction<number>>;
};

const Header = ({ selectedOptionId, setSelectedOptionId }: HeaderProps) => {
  const temporalDisable = true; // TODO: Enable when other options are ready

  const handleOptionClick = (id: number) => {
    if (temporalDisable) return;

    if (id === selectedOptionId) return;
    setSelectedOptionId(id);
  };

  return (
    <div className="pl-14 pb-6 w-full flex flex-col gap-4 border-b-primaryN30 border-b">
      <div className="flex flex-col gap-1.5">
        <p className="text-forumBlue text-xl">Brand Management</p>
        <p className="text-basicGray text-xs font-light">
          Build your brand specifications
        </p>
      </div>
      <div className="flex gap-8">
        {headerOptions.map((option, index) => {
          const isSelected = option.id === selectedOptionId;
          const conditionalClassName = isSelected
            ? "text-white bg-forumBlue cursor-default"
            : "text-baseGray bg-white hover:bg-forumBlue/20 cursor-pointer";
          return (
            <div
              className={`${conditionalClassName} ${
                temporalDisable && "pointer-events-none"
              } transition-all ease-in-out duration-150 px-8 py-1 rounded-lg`}
              key={index}
              onClick={() => handleOptionClick(index + 1)}
            >
              {option.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Header;
