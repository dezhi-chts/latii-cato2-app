"use client";

import React, { forwardRef, useCallback } from "react";
import debounce from "lodash/debounce";
import { SelectContextProvider } from "./context/selectContext";
import { SettingContextProvider } from "./context/settingContext";
import WinDrawerContent from "./content";
import { ILine } from "./data/baseFrame";
import { BaseData } from "@/app/projects/[projectId]/takeoff/[takeoffId]/components/drawing/data/baseData";
import {
  ChangeType,
  IElementWrapper,
  IImageData,
  IPointPostion,
} from "./datas";

export interface WindowDrawerProps {
  initialData?: Array<any>;
  onChange?: (data: Array<BaseData>, type: ChangeType) => void;
  onDrop?: (value: any) => void;
  onChangeUnit?: (value: any) => void;
  loading?: () => void;
  onSelectChange?: (elements: any[]) => void;
  getGroupZones?: (value: any) => {};
  from?: "quote" | "design";
}

export interface WindowDrawerRef {
  importData: (data: BaseData) => void;
  exportData: () => any;
  exportImage: () => Promise<IImageData>;
  exportElementImage: (elementId: string) => Promise<IImageData>;
  addElement: (params: {
    id: string;
    category: number;
    type: number;
    open?: string;
    width?: number;
    height?: number;
  }) => void;
  removeElement: () => void;
  selectElementById: (id: string) => void;
  updateElement: (id: string, params: any) => void;
  clearElements: () => void;
  selectElementByUnitId: (id: string) => void;
  // addDivider: (id: string, type: string) => void,
  // setDrawDivider: (bool: boolean) => void,
  setDragMode: (mode: "drag" | "select" | null) => void;
  merge: () => void;
  unmerge: () => void;
  setRemoveLineMode: (enabled: boolean) => void;
  setPoints: (id: string, points: IPointPostion[]) => void;
  getLines: () => { [key: string]: ILine[] };
  updateAreas: (areas: any[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  render: (renderSettings: any) => void;
  clearZones: () => void;
  selectAll: () => void;
  importTemplate: (json: string, refresh: boolean, code: string) => void;
  handleZoom: (type: "in" | "out") => void;
  updateUnit: (id: string, params: any) => void;
  exportUnits: () => void;
  renderUnit: (unitId: string, setMode: any) => void;
  sketchUnit: (unitId: string, setMode: any) => void;
}

const Drawing = forwardRef<WindowDrawerRef, WindowDrawerProps>(
  (
    {
      initialData,
      onChange,
      onSelectChange,
      onDrop,
      loading,
      getGroupZones,
      onChangeUnit,
      from = "design",
      ...props
    },
    ref
  ) => {
    const debouncedOnChange = useCallback(
      debounce((data: Array<any>, type) => {
        onChange?.(data, type);
      }, 300),
      [onChange]
    );

    const handleSelectChange = useCallback(
      (elements: any[]) => {
        onSelectChange?.(elements);
      },
      [onSelectChange]
    );

    // const history = useHistory(initialData);

    // useEffect(() => {
    // if (onChange) {
    // onChange(history.state, "change");
    // }
    // }, [onChange]);

    return (
      <SettingContextProvider>
        <SelectContextProvider>
          {/*<HistoryProvider>*/}
          <WinDrawerContent
            onChange={debouncedOnChange}
            onSelectChange={handleSelectChange}
            onDrop={onDrop}
            loading={loading}
            onChangeUnit={onChangeUnit}
            ref={ref}
            from={from}
            initialData={initialData}
            getGroupZones={getGroupZones}
          />
          {/*</HistoryProvider>*/}
        </SelectContextProvider>
      </SettingContextProvider>
    );
  }
);
Drawing.displayName = "Drawing";

export default Drawing;
