"use client";

import { Warning } from "@/hooks/usePasswordForm";
import Image from "next/image";

type Props = {
  warnings: Warning[] | null;
  title: string;
  isValid: boolean;
};

const ValidationMessages = ({ warnings, title, isValid }: Props) => {
  return (
    <div className="text-xs font-light ml-1">
      <div className="flex items-center gap-2">
        <Image
          src={`/assets/icons/info-${isValid ? "green" : "orange"}.svg`}
          alt="info icon"
          width={10}
          height={10}
          className="-mt-0.5"
        />
        <p className={`${isValid ? "text-green-500" : "text-dragonOrange"} `}>
          {title}
        </p>
      </div>

      {warnings && (
        <ul className="list-disc ml-9 ">
          {warnings.map((warning, index) => (
            <li
              key={index}
              className={`${
                warning.completed ? "text-green-500" : "text-dragonOrange"
              }`}
            >
              {warning.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ValidationMessages;
