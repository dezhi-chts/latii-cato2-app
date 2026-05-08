import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

type FullscreenLoadingType = "default" | "custom";

interface SpinnerProps {
  isLoading: boolean;
  type?: FullscreenLoadingType;
}

const Spinner: React.FC<SpinnerProps> = ({ isLoading, type = "default" }) => {
  if (!isLoading) return null;

  const isCustomType = type === "custom";

  return (
    <Spin
      fullscreen
      size="default"
      indicator={isCustomType ? <LoadingOutlined spin /> : undefined}
      delay={150}
      tip={<p className="animate-pulse text-sm">Loading...</p>}
    />
  );
};

export default Spinner;
