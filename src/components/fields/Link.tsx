"use client";

import { Button, Input, Space } from "antd";
import RequiredHint from "./RequiredHint";
import Image from "next/image";
import { useMemo, useState } from "react";

type LinkProps = {
  name: string;
  required: boolean;
  hint_text?: string;
  value?: string;
  onBlur?: () => void;
  onChange?: (e: any) => void;
};

const Weblink = ({
  name,
  required,
  hint_text = "",
  value,
  onBlur,
  onChange,
}: LinkProps) => {
  const [internalValue, setInternalValue] = useState("");

  const currentValue = useMemo(() => {
    if (value !== undefined) return value;
    return internalValue;
  }, [value, internalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }

    onChange?.(e);
  };

  const handleOpenLink = () => {
    if (!currentValue) return;

    const url = currentValue.startsWith("http")
      ? currentValue
      : `https://${currentValue}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        {name} {RequiredHint(required)}
      </p>

      <Space.Compact style={{ width: "100%" }} className="max-w-80">
        <Input
          value={currentValue}
          placeholder={hint_text}
          onBlur={onBlur}
          onChange={handleChange}
        />

        <Button onClick={handleOpenLink} className="px-1">
          <Image
            src="/assets/icons/fields/link_light.svg"
            alt="Link"
            width={24}
            height={24}
          />
        </Button>
      </Space.Compact>
    </div>
  );
};

export default Weblink;
