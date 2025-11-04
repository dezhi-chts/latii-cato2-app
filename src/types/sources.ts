export type Category = "documents" | "weblinks" | "videos" | "text";
export type Option = {
  label: string;
  value: Category;
  selected_classname: string;
  unselected_classname: string;
};

export type SourcesProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export type CategoriesRenderProps = {
  selectedCategory: Category;
  handleCategoryChange: (category: Category) => void;
  isOpen: boolean;
};

export type SourcesHeaderProps = {
  handleToggle: () => void;
  isOpen: boolean;
};

export type ModalsRenderProps = {
  isModalOpen: boolean;
  selectedCategory: Category;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data?: any;
};
