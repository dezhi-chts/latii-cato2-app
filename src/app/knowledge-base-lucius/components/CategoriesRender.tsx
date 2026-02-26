import { CategoriesRenderProps, Option } from "@/types/sources";
import Image from "next/image";

const options: Option[] = [
  {
    label: "Documents",
    value: "documents",
    selected_classname: "bg-accentPurple text-white",
    unselected_classname:
      "text-accentPurple bg-accentPurple/10 hover:bg-accentPurple/20 ",
  },
  {
    label: "Weblinks",
    value: "weblinks",
    selected_classname: "bg-dragonOrange text-white",
    unselected_classname:
      "text-dragonOrange bg-dragonOrange/10 hover:bg-dragonOrange/20",
  },
  {
    label: "Videos",
    value: "videos",
    selected_classname: "bg-warningW400 text-white",
    unselected_classname:
      "text-warningW400 bg-warningW400/10 hover:bg-warningW400/20",
  },
  {
    label: "Text",
    value: "text",
    selected_classname: "bg-secondary400 text-white",
    unselected_classname:
      "text-secondary400 bg-secondary400/10 hover:bg-secondary400/20",
  },
  {
    label: "All",
    value: "all",
    selected_classname: "bg-grey-normal text-white",
    unselected_classname:
      "text-grey-normal bg-grey-normal/10 hover:bg-grey-normal/20",
  },
];
const CategoriesRender = ({
  selectedCategory,
  handleCategoryChange,
  isOpen,
}: CategoriesRenderProps) => {
  return options.map((option, index) => {
    const isSelected = option.value === selectedCategory;
    const iconPath = `/assets/icons/sources-icons/${option.value}${
      isSelected ? "-white" : ""
    }.svg`;

    return (
      <div
        key={index}
        className={`flex items-center gap-2 rounded-xl flex-none p-2 cursor-pointer 
                ${isOpen ? "w-[calc(50%-0.5rem)]" : "w-9 justify-center"}
                ${
                  isSelected
                    ? option.selected_classname
                    : option.unselected_classname
                }`}
        onClick={() => handleCategoryChange(option.value)}
      >
        <Image
          src={iconPath}
          alt={`${option.label} icon`}
          width={17}
          height={17}
          className="h-4 w-auto"
        />
        {isOpen && <p className="text-xs">{option.label}</p>}
      </div>
    );
  });
};

export default CategoriesRender;
