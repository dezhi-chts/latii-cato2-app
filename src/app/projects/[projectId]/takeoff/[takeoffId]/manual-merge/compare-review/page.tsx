"use client";

import Body from "./components/Body";
import { Header } from "./components/Header";

export type HeaderFile = {
  id: string;
  name: string;
  type: "Architectural Drawing" | "Product List";
  file_extension?: "pdf";
};

const ItemReview = () => {
  return (
    <div>
      <Header />
      <Body />
    </div>
  );
};

export default ItemReview;
