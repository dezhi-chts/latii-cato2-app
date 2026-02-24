"use client";

import { FormulasBoxProps } from "@/types/settings";
import { Input, Switch } from "antd";
import Image from "next/image";

const FormulasBox = (data: FormulasBoxProps) => {
  const onDelete = () => {
    console.log("delete");
  };

  const onDuplicate = () => {
    console.log("duplicate");
  };

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white">
      {/* Fila gris */}
      <div className="flex items-center gap-3 bg-baseLight p-4">
        <span>Label</span>
        <Input value={data.label} readOnly className="w-40" />
        <span>=</span>
        <Input value={data.formula} />
      </div>
      {/* Fila blanca */}
      <div className="border border-t-0 border-baseLightHover rounded-b-xl p-3 flex justify-between">
        <div>
          On Quote
          <Switch />
        </div>
        <div>
          {" "}
          <button
            type="button"
            onClick={onDelete}
            className="items-center justify-center"
          >
            <Image
              src="/assets/icons/delete.svg"
              alt="Delete"
              width={16}
              height={16}
            />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="items-center justify-center"
          >
            <Image
              src="/assets/icons/duplicate.svg"
              alt="Duplicate"
              width={16}
              height={16}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormulasBox;
