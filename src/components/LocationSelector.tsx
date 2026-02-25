"use client";
import { getFullLocation } from "@/lib/functions";
import { LocationSelectorProps } from "@/types/project";
import { ConfigProvider, Input, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import { State, City } from "country-state-city";

type StateType = {
  name: string;
  isoCode: string;
  countryCode: string;
};

type CityType = {
  name: string;
  countryCode: string;
  stateCode: string;
};

const { Option } = Select;

const LocationSelector = ({
  onClose,
  projectSettings,
  isOpen,
  setIsOpen,
  selectorClassName,
  inputClassName,
  updateProject,
  handleInputChange,
  handleDropdownChange,
  handleOnBlur,
  height,
  style,
}: LocationSelectorProps) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [states, setStates] = useState<StateType[]>([]);
  const [cities, setCities] = useState<CityType[]>([]);

  const noop = () => {};
  const safeUpdateProject = updateProject ?? noop;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (divRef.current && !divRef.current.contains(event.target as Node)) {
        safeUpdateProject();
        if (onClose) onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [safeUpdateProject, onClose]);

  useEffect(() => {
    setStates(State.getStatesOfCountry("US"));
  }, []);

  useEffect(() => {
    if (projectSettings?.state) {
      const found = states.find((s) => s.isoCode === projectSettings?.state);
      if (found) {
        setCities(City.getCitiesOfState("US", found.isoCode));
      }
    } else {
      setCities([]);
    }
  }, [projectSettings?.state, states]);

  return (
    <div className="relative" style={{ ...style }}>
      <Input
        placeholder="State, City, Postal Code, Address"
        className={`${inputClassName} cursor-pointer truncate ... ${
          height === "small" && "text-xs"
        }`}
        value={getFullLocation({
          ...projectSettings,
          state:
            states.find((s) => s.isoCode === projectSettings?.state)?.name ||
            "",
        })}
        readOnly
        onClick={() => {
          if (setIsOpen) setIsOpen(true);
        }}
        size="large"
      />

      <div
        className={`${selectorClassName} ${isOpen ? "" : "hidden"} flex flex-col w-96 rounded-xl border border-primaryN30 py-8 px-5 gap-5 text-xs absolute top-8 shadow-xl z-50 bg-white`}
        ref={divRef}
      >
        <div className="w-full flex gap-2.5 items-center">
          <p className="w-1/4 text-basicGray">
            State <span className="text-accentRed">*</span>
          </p>

          <Select
            className="w-3/4 border-primaryN30 [&_.ant-select-selector]:!rounded-lg text-xs h-6"
            placeholder="Select State"
            value={projectSettings?.state || undefined} // es isoCode
            onChange={(val) => {
              // val es el isoCode seleccionado
              if (!handleDropdownChange) return;
              handleDropdownChange("state")(val);
              handleDropdownChange("city")(""); // reset city
            }}
            getPopupContainer={(triggerNode) =>
              triggerNode.parentElement || document.body
            }
            showSearch
            optionFilterProp="children"
          >
            {states.map((s) => (
              <Option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </Option>
            ))}
          </Select>
        </div>
        <div className="w-full flex gap-2.5 items-center">
          <p className="w-1/4 text-basicGray">
            City <span className="text-accentRed">*</span>
          </p>

          <Select
            className="w-3/4 border-primaryN30 [&_.ant-select-selector]:!rounded-lg "
            placeholder="Select City"
            value={projectSettings?.city || undefined}
            onChange={(val) => {
              if (!handleDropdownChange) return;
              handleDropdownChange("city")(val);
            }}
            disabled={!projectSettings?.state}
            showSearch
            optionFilterProp="children"
            getPopupContainer={(triggerNode) =>
              triggerNode.parentElement || document.body
            }
          >
            {cities.map((c) => (
              <Option key={c.name} value={c.name}>
                {c.name}
              </Option>
            ))}
          </Select>
        </div>
        <div className="w-full flex gap-2.5 items-center">
          <p className="w-1/4 text-basicGray">Postal Code</p>
          <Input
            placeholder="70001, etc."
            className="w-3/4 border-primaryN30 [&.ant-input]:!rounded-lg"
            onChange={(e) => {
              if (!handleInputChange) return;
              handleInputChange("postal_code", e.target.value);
            }}
            onBlur={handleOnBlur}
            value={projectSettings?.postal_code}
          />
        </div>
        <div className="w-full flex gap-2.5 items-center">
          <p className="w-1/4 text-basicGray">Address</p>
          <Input
            placeholder="6002 Westplano Park, etc."
            className="w-3/4 border-primaryN30 [&.ant-input]:!rounded-lg"
            onChange={(e) => {
              if (!handleInputChange) return;
              handleInputChange("address", e.target.value);
            }}
            onBlur={handleOnBlur}
            value={projectSettings?.address}
          />
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
