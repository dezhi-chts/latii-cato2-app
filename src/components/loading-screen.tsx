import React from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

interface SpinnerProps {
  isLoading: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <Spin
      fullscreen
      size="large"
      indicator={<LoadingOutlined spin />}
      className="text-white"
      delay={150}
      tip={<p className="animate-pulse text-xl">Loading...</p>}
    />
  );
};

export default Spinner;
