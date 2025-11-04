import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

export interface SettingContextProps {
  line?: "circle" | "straight";
  lock?: "0" | "1";
  lineWidth: number;
  scale: number;
  stagePos: {
    x: number;
    y: number;
  };
  initSize: {
    width: number,
    height: number,
  }
  sizeMultiples: number;
  dragMode: 'drag' | 'select' | 'removeLine' | 'dimension';
  noRenderBase: boolean;
  from: 'design' | 'quote' | 'designForUnit'
}

interface SettingContextType {
  value: SettingContextProps;
  setValue: (value: SettingContextProps | any) => void;
}

const SettingContext = createContext<SettingContextType | undefined>(undefined);

export const SettingContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const valueRef = useRef<SettingContextProps>({
    lock: "0",
    line: "straight",
    lineWidth: 10,
    scale: 1/1.2/1.2,
    stagePos: { x: 0, y: 0 },
    initSize: {
      width: 300,
      height: 300,
    },
    noRenderBase: false,
    sizeMultiples: 5,
    dragMode: 'select',
    from: 'design'
  });

  const [value, setValueState] = useState<SettingContextProps>(
    valueRef.current
  );

  const setValue = useCallback(
    (
      newValue:
        | SettingContextProps
        | ((prev: SettingContextProps) => SettingContextProps)
    ) => {
      if (typeof newValue === "function") {
        setValueState((prev) => {
          const nextValue = newValue(prev);
          valueRef.current = nextValue;
          return nextValue;
        });
      } else {
        valueRef.current = newValue;
        setValueState(newValue);
      }
    },
    []
  );

  return (
    <SettingContext.Provider value={{ value, setValue }}>
      {children}
    </SettingContext.Provider>
  );
};

// 使用上下文的 Hook
export const useSetting = (): SettingContextType => {
  const context = useContext(SettingContext);
  if (!context) {
    throw new Error("useSetting must be used within a SettingContext");
  }
  return context;
};
