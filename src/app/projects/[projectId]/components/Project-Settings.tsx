import type { ProjectSettings } from "@/types/project";
import { ConfigProvider, DatePicker, Input, Popover, Select } from "antd";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import LocationSelector from "@/components/LocationSelector";
import Image from "next/image";
import request from "@/lib/http";

type ProjectSettingsProps = {
  project: ProjectSettings;
  handleUpdate: (settings: ProjectSettings) => void;
};

export type DealerProjectAward = {
  create_time: string;
  create_user: string;
  dict_label: string;
  dict_type: string;
  dict_value: string;
  id: number;
  status: number;
  update_time: string;
  update_user: string;
};

const ProjectSettings = ({ project, handleUpdate }: ProjectSettingsProps) => {
  const { TextArea } = Input;

  const [settings, setSettings] = useState<ProjectSettings>(project);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [likelihoods, setLikelihoods] = useState<DealerProjectAward[]>([]);

  useEffect(() => {
    setSettings(project);
  }, [project]);

  const handleInputChange =
    <K extends keyof ProjectSettings>(field: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSettings((prev) => ({
        ...prev,
        [field]: event.target.value as ProjectSettings[K],
      }));
    };

  const handleDropdownChange =
    <K extends keyof ProjectSettings>(field: K) =>
    (value: ProjectSettings[K]) => {
      setSettings((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const updateProject = () => {
    handleUpdate(settings);
  };

  // ✅ FIX: ahora actualiza y envía el valor nuevo inmediatamente
  const handleDateChange = (value: Dayjs | null) => {
    const newDate = value ? value.format("YYYY-MM-DD") : "";
    setSettings((prev) => {
      const updated = { ...prev, expected_end_date: newDate };
      handleUpdate(updated);
      return updated;
    });
  };

  return (
    <div className="py-8 flex gap-12">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col w-[300px] gap-2">
          <p>
            Project Name <span className="text-accentRed">*</span>
          </p>
          <Input
            placeholder="Input a recognizable name for you"
            className="rounded-full"
            value={settings?.project_name}
            onChange={handleInputChange("project_name")}
            onBlur={updateProject}
          />
        </div>
        {/*<div className="flex flex-col w-[300px] gap-2">*/}
        {/*  <p>*/}
        {/*    End Customer <span className="text-basicLightGray">(Optional)</span>*/}
        {/*  </p>*/}
        {/*  <Input*/}
        {/*    placeholder="Input your end customer"*/}
        {/*    className="rounded-full"*/}
        {/*    value={settings?.customer || ""}*/}
        {/*    onChange={handleInputChange("customer")}*/}
        {/*    onBlur={updateProject}*/}
        {/*  />*/}
        {/*</div>*/}
      </div>

      {/*<div className="flex flex-col gap-8">*/}
      {/*  <div className="flex flex-col w-[300px] gap-2">*/}
      {/*    <p>*/}
      {/*      Primary Location <span className="text-accentRed">*</span>*/}
      {/*    </p>*/}
      {/*    <LocationSelector*/}
      {/*      onClose={() => setShowLocationSelector(false)}*/}
      {/*      handleInputChange={handleInputChange}*/}
      {/*      handleDropdownChange={handleDropdownChange}*/}
      {/*      updateProject={updateProject}*/}
      {/*      projectSettings={settings}*/}
      {/*      isOpen={showLocationSelector}*/}
      {/*      setIsOpen={setShowLocationSelector}*/}
      {/*      selectorClassName="-top-[60px] py-0 pt-3 pb-3 w-[320px] -left-1"*/}
      {/*    />*/}
      {/*  </div>*/}

      {/*  <div className="flex flex-col w-[300px] gap-2">*/}
      {/*    <p>*/}
      {/*      Client Expected Delivery Date{" "}*/}
      {/*      <span className="text-accentRed">*</span>*/}
      {/*    </p>*/}
      {/*    <DatePicker*/}
      {/*      placeholder="Select a date"*/}
      {/*      className="rounded-full"*/}
      {/*      onChange={handleDateChange}*/}
      {/*      value={*/}
      {/*        settings?.expected_end_date*/}
      {/*          ? dayjs(settings?.expected_end_date)*/}
      {/*          : null*/}
      {/*      }*/}
      {/*    />*/}
      {/*  </div>*/}
      {/*</div>*/}

      <div className="flex flex-col w-[400px] gap-8 ">
        <div className="flex flex-col gap-2 w-full">
          <p>Project Description</p>
          <TextArea
            placeholder="Any additional notes, descriptions for your project"
            className="rounded-xl"
            rows={4}
            value={settings?.project_desc || ""}
            onChange={handleInputChange("project_desc")}
            onBlur={updateProject}
            style={{ resize: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;

export const AwardLikelihoodPopover = () => {
  return (
    <div className="text-xs text-grey-normal w-60">
      <p className="font-semibold">Project Award Likelihood</p>
      <p>
        Select how likely it is that Latii will be awarded this project, based
        on pricing fit, client communication, and whether the project seems
        viable from your perspective.
      </p>
    </div>
  );
};
