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
  updateProject,
  handleInputChange,
  handleDropdownChange,
  height,
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
        onClose();
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
    <div className="relative">
      <Input
        placeholder="State, City, Postal Code, Address"
        className={`rounded-full cursor-pointer truncate ... ${
          height === "small" && "text-xs"
        }`}
        value={getFullLocation({
          ...projectSettings,
          state:
            states.find((s) => s.isoCode === projectSettings?.state)?.name ||
            "",
        })}
        readOnly
        onClick={() => setIsOpen(true)}
      />
      {isOpen && (
        <div
          className={`${selectorClassName} flex flex-col w-96 rounded-xl border border-primaryN30 py-8 px-5 gap-5 text-xs absolute top-8 shadow-xl z-50 bg-white`}
          ref={divRef}
        >
          <ConfigProvider
            theme={{
              components: {
                Select: {
                  borderRadius: 9999,
                  fontSize: 12,
                },
              },
            }}
          >
            <div className="w-full flex gap-2.5 items-center">
              <p className="w-1/4 text-basicGray">
                State <span className="text-accentRed">*</span>
              </p>

              <Select
                className="w-3/4 rounded-xl border-primaryN30 text-xs h-6"
                placeholder="Select State"
                value={projectSettings?.state || undefined} // es isoCode
                onChange={(val) => {
                  // val es el isoCode seleccionado
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
                className="w-3/4 rounded-xl border-primaryN30 text-xs h-6"
                placeholder="Select City"
                value={projectSettings?.city || undefined}
                onChange={(val) => {
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
          </ConfigProvider>
          <div className="w-full flex gap-2.5 items-center">
            <p className="w-1/4 text-basicGray">Postal Code</p>
            <Input
              placeholder="70001, etc."
              className="w-3/4 rounded-xl border-primaryN30 text-xs h-6"
              onChange={handleInputChange("postal_code")}
              defaultValue={projectSettings?.postal_code}
            />
          </div>
          <div className="w-full flex gap-2.5 items-center">
            <p className="w-1/4 text-basicGray">Address</p>
            <Input
              placeholder="6002 Westplano Park, etc."
              className="w-3/4 rounded-xl border-primaryN30 text-xs h-6"
              onChange={handleInputChange("address")}
              defaultValue={projectSettings?.address}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
