"use client";

import React, { useState, useRef, useEffect } from "react";

interface EditableSubTextProps {
  value: string;
  color: string;
  onChange: (value: string) => void;
}

const EditableSubText = ({ value, color, onChange }: EditableSubTextProps) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(20);

  // 根据内容动态计算宽度
  useEffect(() => {
    if (spanRef.current) {
      const width = spanRef.current.offsetWidth;
      setInputWidth(Math.max(20, Math.min(width + 8, 200)));
    }
  }, [inputValue, value]);

  const handleBlur = () => {
    if (inputValue.trim() !== value) {
      onChange(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setInputValue(value);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="pl-[2px] inline-block relative">
      {/* 隐藏的 span 用于测量文本宽度 */}
      <span
        ref={spanRef}
        className="absolute invisible whitespace-pre"
        style={{
          fontSize: "10px",
          padding: "0 4px",
          fontFamily: "inherit",
        }}
      >
        {inputValue || "-"}
      </span>
      <input
        ref={inputRef}
        className="h-[20px] text-center outline-none text-white text-xxs rounded-md border-none cursor-pointer hover:opacity-90 transition-opacity"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onFocus={(e) => e.target.select()}
        style={{
          width: `${inputWidth}px`,
          minWidth: "20px",
          maxWidth: "200px",
          padding: "0 4px",
          backgroundColor: color,
        }}
      />
    </div>
  );
};

export default EditableSubText;
