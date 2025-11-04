/* eslint-disable @typescript-eslint/no-explicit-any */
import { HandleMultipleChanges } from "../../types/item";
import { SectionName } from "./Modal";

export type CardsInfo = {
  name: SectionName;
  size: size;
  options: CardsOptions[];
};

export type CardsOptions = {
  text: string;
  value: string;
  subtitle?: string;
  description?: string;
  details?: string;
  image: string;
  secondaryImage?: string;
  finishes?: {
    amount: number;
    url: string;
  };
  finishes_2?: {
    amount: number;
    url: string;
  };
  is_selected: boolean;
};

export type CardProps = {
  card: CardsOptions;
  toggleSelectedOption: (section: SectionName, option: string) => void;
  section: SectionName;
  selectedValue?: string | undefined | null;
  item?: any;
  handleSelectChange?: any;
  index?: any;
  handleMultipleChanges?: HandleMultipleChanges;
};

export type size = "small" | "large";
