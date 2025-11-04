import { size } from "./types";

type CardProps = {
  size: size;
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
};

const Card = ({ size, children, isSelected, onClick }: CardProps) => {
  const sizeClass = {
    small: "w-[230px] h-[230px] py-4 px-7",
    large: "w-[340px] h-[460px] py-7 px-5",
  };
  return (
    <div
      className={`${sizeClass[size]} ${
        isSelected
          ? "border-kahuBlue"
          : "border-primaryN30 hover:border-kahuBlue/30"
      } transition-all duration-150 ease-in-out rounded-xl border flex flex-col gap-2.5 items-center justify-center text-center cursor-pointer flex-shrink-0`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
