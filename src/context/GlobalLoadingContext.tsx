"use client";

import { createContext, useContext, useState } from "react";

type GlobalLoadingContextType = {
  globalSpinning: boolean;
  setGlobalSpinning: (value: boolean) => void;
};

const GlobalLoadingContext = createContext<
  GlobalLoadingContextType | undefined
>(undefined);

export const GlobalLoadingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [globalSpinning, setGlobalSpinning] = useState(false);

  return (
    <GlobalLoadingContext.Provider
      value={{ globalSpinning, setGlobalSpinning }}
    >
      {children}
    </GlobalLoadingContext.Provider>
  );
};

export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (!context)
    throw new Error(
      "useGlobalLoading must be used within GlobalLoadingProvider"
    );
  return context;
};
