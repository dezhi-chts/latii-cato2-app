"use client";

import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useGlobalLoading } from "@/context/GlobalLoadingContext";

export const GlobalSpinner = () => {
  const { globalSpinning } = useGlobalLoading();

  return (
    <Spin
      size="large"
      spinning={globalSpinning}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
      }}
      indicator={<LoadingOutlined style={{ fontSize: 36, color: "blue" }} />}
    />
  );
};
