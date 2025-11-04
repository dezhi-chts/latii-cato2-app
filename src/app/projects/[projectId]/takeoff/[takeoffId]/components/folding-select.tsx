"use client";

import { Select, Tabs } from "antd";
import { useEffect, useState } from "react";
const { TabPane } = Tabs;

const FoldingSelect = ({ handleSelectChange, index, operability, options }: {
  options?: any[],
  handleSelectChange, index, operability,
}) => {
  const [categories, setCategories] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
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
  }, [operability, options]);

  function categorizeOptions(options) {
    const newCategories = {
      inSwing: [],
      outSwing: [],
    };

    options.forEach((option) => {
      const value = option.value.toLowerCase();

      if (value.includes("inswing")) {
        newCategories.inSwing.push(option);
      } else {
        newCategories.outSwing.push(option);
      }
    });

    setCategories(newCategories);
  }

  const renderOptions = (optionsArray) => {
    const formatCode = (text) => {
      let code = text.split(" - ")[1];
      if (text.split(" - ").length === 3){
        code += ` - ${text.split(" - ")[2]}`
      }
      return code?.replace(/(\d)([+\-*/])(\d)/g, "$1 $2 $3");
    };
    return (
      <div className="flex flex-col gap-2 max-h-72 overflow-auto scrollbar-hidden">
        {optionsArray.map((option) => {
          const formattedCode = formatCode(option.text);
          return (
            <p
              key={option.value}
              className="hover:bg-primaryN20 cursor-pointer p-2 rounded-xl text-center"
              onClick={() => handleValueSelect(option.value, option.text)}
            >
              {formattedCode}
            </p>
          );
        })}
      </div>
    );
  };

  const handleValueSelect = (value, text) => {
    handleSelectChange(value, index, "operability", true);
    setSelectedValue(text);
    setOpen(false);
  };

  return (
    <Select
      placeholder="Open"
      value={selectedValue}
      onDropdownVisibleChange={(visible) => setOpen(visible)}
      open={open}
      onChange={(value) => setSelectedValue(value)}
      dropdownStyle={{
        minWidth: 200,
      }}
      style={{width:"100%"}}
      dropdownRender={() =>
        categories ? (
          <div className="flex gap-2">
            <div className="w-1/2 flex justify-center">
              <Tabs
                defaultActiveKey="1"
                tabBarStyle={{ outlineColor: "black" }}
              >
                <TabPane tab="Inswing" key="1">
                  {renderOptions(categories.inSwing)}
                </TabPane>
              </Tabs>
            </div>
            <div className="w-1/2 flex justify-center">
              <Tabs defaultActiveKey="1">
                <TabPane tab="Outswing" key="1">
                  {renderOptions(categories.outSwing)}
                </TabPane>
              </Tabs>
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )
      }
    />
  );
};

export default FoldingSelect;
