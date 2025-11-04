import React, { createContext, useContext, useState, useCallback } from "react";
import { useSetting } from "./settingContext";
import {BaseData} from "../../data/baseData";

interface SelectionContextType {
    selectedItems: BaseData[];
    setSelectedItems: (items: ((prev: BaseData[]) => BaseData[]) | BaseData[]) => void;
    toggleSelection: (item: BaseData) => void;
    clearSelection: () => void;
    hasSelectedItem: (id: string) => boolean;
}

const defaultContext: SelectionContextType = {
    selectedItems: [],
    setSelectedItems: () => {},
    toggleSelection: () => {},
    clearSelection: () => {},
    hasSelectedItem: () => false,
};

const SelectionContext = createContext<SelectionContextType>(defaultContext);

export const SelectContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedItems, setSelectedItemsState] = useState<BaseData[]>([]);
    const { value: settingValue } = useSetting(); // 获取setting上下文的值
    
    // 根据dragMode决定是否允许选择
    const setSelectedItems = useCallback((items: BaseData[]) => {
        // 如果dragMode是drag或removeLine或dimension，则不允许选择
        if (settingValue.dragMode === 'removeLine' ||
            settingValue.dragMode === 'dimension') {
            return;
        }
        setSelectedItemsState(items);
    }, [settingValue.dragMode]);
    
    const toggleSelection = useCallback((item: BaseData) => {
        // 如果dragMode是drag或removeLine或dimension，则不允许选择
        if (settingValue.dragMode === 'removeLine' ||
            settingValue.dragMode === 'dimension') {
            return;
        }
        setSelectedItemsState((prevSelectedItems) => {
            const existingItemIndex = prevSelectedItems.findIndex(
                (selectedItem) => selectedItem.id === item.id
            );
            
            if (existingItemIndex !== -1) {
                return prevSelectedItems.filter((_, index) => index !== existingItemIndex);
            } else {
                return [...prevSelectedItems, item];
            }
        });
    }, [settingValue.dragMode]);
    
    const clearSelection = useCallback(() => {
        setSelectedItemsState([]);
    }, []);
    
    const hasSelectedItem = useCallback(
        (id: string) => {
            return selectedItems.some((item) => item.id === id);
        },
        [selectedItems]
    );
    
    return (
        <SelectionContext.Provider
            value={{
                selectedItems,
                setSelectedItems,
                toggleSelection,
                clearSelection,
                hasSelectedItem,
            }}
        >
            {children}
        </SelectionContext.Provider>
    );
};

export const useSelection = () => useContext(SelectionContext);