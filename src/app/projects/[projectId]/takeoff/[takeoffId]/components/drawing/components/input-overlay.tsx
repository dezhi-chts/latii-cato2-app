import React, { useEffect, useRef, useState } from "react";

export interface IInputInfo {
  x: number;
  y: number;
  width?: number;
  height?: number;
  value: number;
  onChange: (value: number) => void;
}

const InputOverlay = ({ x, y, width, height, value, onChange }: IInputInfo) => {
  const [inputValue, setValue] = useState<number>(
    Math.round((value / 25.4) * 100) / 100
  );

  const inputRef = useRef<any>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onKeyDown = (e: any) => {
    if (e.key === "Enter") {
      onChange(inputValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setValue(Number(e.target.value));
  };

  const onInputClose = (event?: any) => {
    event.preventDefault();
    event.stopPropagation();

    onChange(inputValue);
  };

  return (
    <div
      onClick={onInputClose}
      style={{
        position: "absolute",
        backgroundColor: "transparent",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 99999,
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        style={{
          width: width || 110,
          height: height,
          backgroundColor: "#eee",
          borderRadius: 5,
          position: "absolute",
          top: y + "px",
          left: x + "px",
          padding: "4px 8px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", height: 20 }}>
          <input
            type="number"
            ref={inputRef}
            style={{
              width: "calc(100% - 25px)",
              height: 20,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              fontSize: 18,
              color: "#333",
              padding: "0 4px",
              textAlign: "right",
            }}
            value={inputValue}
            onKeyDown={onKeyDown}
            onChange={handleChange}
          />
          <span
            style={{
              fontSize: 18,
              color: "#333",
              marginLeft: 2,
            }}
          >
            in
          </span>
        </div>
        <span
          style={{
            height: 18,
            fontSize: 14,
            color: "#999",
            textAlign: "center",
          }}
        >
          {(inputValue * 25.4).toFixed(0)}mm
        </span>
      </div>
    </div>
  );
};

export default InputOverlay;
