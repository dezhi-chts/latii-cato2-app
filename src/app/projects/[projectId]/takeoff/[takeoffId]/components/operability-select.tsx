"use client";

import { Select, Tabs } from "antd";
import { useEffect, useState } from "react";
const { TabPane } = Tabs;

const OperabilitySelect = ({ handleSelectChange, index, operability, options }: {
  options?: any[],
  handleSelectChange, index, operability,
}) => {
  const [categories, setCategories] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [showMotorizedSelect, setShowMotorizedSelect] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ds = options || operability?.options
    if(!ds) return
    categorizeOptions(ds);

    const newSelectedValue = ds.find(
      (option) => option.value === operability?.selected_value
    );

    if (newSelectedValue) {
      setSelectedValue(newSelectedValue.text);
    }
  }, [operability]);

  function categorizeOptions(options) {
    const newCategories = {
      singlePaneManual: [],
      singlePaneMotorized: [],
      cornerManual: [],
      cornerMotorized: [],
    };

    options.forEach((option) => {
      const value = option.value.toLowerCase();

      if (value.includes("corner") && value.includes("motorized")) {
        newCategories.cornerMotorized.push(option);
      } else if (value.includes("corner")) {
        newCategories.cornerManual.push(option);
      } else if (value.includes("motorized")) {
        newCategories.singlePaneMotorized.push(option);
      } else {
        newCategories.singlePaneManual.push(option);
      }
    });

    if (
      newCategories.singlePaneMotorized?.length > 0 ||
      newCategories.cornerMotorized?.length > 0
    ) {
      setShowMotorizedSelect(true);
    } else {
      setShowMotorizedSelect(false);
    }

    setCategories(newCategories);
  }

  const renderOptions = (optionsArray) => (
    <div className="flex flex-col gap-2 max-h-72 overflow-auto scrollbar-hidden">
      {optionsArray.map((option) => (
        <p
          key={option.value}
          className="hover:bg-primaryN20 cursor-pointer py-2 px-1 rounded-xl"
          onClick={() => handleValueSelect(option.value, option.text)}
        >
          {option.text}
        </p>
      ))}
    </div>
  );

  const handleValueSelect = (value, text) => {
    console.log(value);
    handleSelectChange(value, index, "operability", true);
    setSelectedValue(text);
    setOpen(false);
  };

  return (
    <div className="w-full">
      {showMotorizedSelect ? (
        <Select
          placeholder="Open"
          open={open}
          className="w-full"
          onDropdownVisibleChange={(visible) => setOpen(visible)}
          value={selectedValue}
          onChange={(value) => setSelectedValue(value)}
          dropdownStyle={{
            minWidth: 500,
          }}
          dropdownRender={(e) =>
            categories ? (
              <div className="p-2 flex gap-2">
                <div className="w-[240px]">
                  <p className="font-bold text-sm">Simple</p>
                  <Tabs defaultActiveKey="1">
                    <TabPane tab="Manual" key="1">
                      {renderOptions(categories.singlePaneManual)}
                    </TabPane>
                    <TabPane tab="Motorized" key="2">
                      {renderOptions(categories.singlePaneMotorized)}
                    </TabPane>
                  </Tabs>
                </div>

                <div className="w-[240px]">
                  <p className="font-bold text-sm">Corner</p>
                  <Tabs defaultActiveKey="1">
                    <TabPane tab="Manual" key="3">
                      {renderOptions(categories.cornerManual)}
                    </TabPane>
                    <TabPane tab="Motorized" key="4">
                      {renderOptions(categories.cornerMotorized)}
                    </TabPane>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div>Loading...</div>
            )
          }
        />
      ) : (
        <Select
          placeholder="Open"
          value={selectedValue}
          onChange={(value) => setSelectedValue(value)}
          open={open}
          onDropdownVisibleChange={(visible) => setOpen(visible)}
          dropdownStyle={{
            minWidth: 250,
          }}
          dropdownRender={() =>
            categories ? (
              <div className="p-2 flex gap-2">
                <div className="w-[240px]">
                  <Tabs defaultActiveKey="1">
                    <TabPane
                      tab={<span className="font-bold">Simple</span>}
                      key="1"
                    >
                      {renderOptions(categories.singlePaneManual)}
                    </TabPane>
                    <TabPane
                      tab={<span className="font-bold">Corner</span>}
                      key="2"
                    >
                      {renderOptions(categories.cornerManual)}
                    </TabPane>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div>Loading...</div>
            )
          }
        />
      )}
    </div>
  );
};

export default OperabilitySelect;
