"use client";

import { div } from "framer-motion/m";

const FormulasBox = () => {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-white">
      {/* Fila gris */}
      <div className="flex items-center gap-3 bg-baseLight p-4"></div>
      {/* Fila blanca */}
      <div className="border border-t-0 border-baseLightHover rounded-b-xl p-3"></div>
    </div>
  );
};

export default FormulasBox;
