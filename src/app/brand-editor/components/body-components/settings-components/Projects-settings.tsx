"use client";

import React, { useRef } from "react";
import Button from "@/components/Button";
import { FieldBox } from "./Field-Box";
import { ConfigProvider, Divider, Tooltip } from "antd";
import { useCompany } from "@/context/CompanyContext";
import { updateCompanyByCompanyId } from "@/services/companyService";
import ShortText from "@/components/fields/ShortText";
import Numbers from "@/components/fields/Numbers";
import LongText from "@/components/fields/LongText";
import Selector from "@/components/fields/Selector";
import Radio from "@/components/fields/Radio";
import Switch from "@/components/fields/Switch";
import DateInput from "@/components/fields/DateInput";
import Weblink from "@/components/fields/Link";
import Check from "@/components/fields/Check";
import Location from "@/components/fields/Location";

type FieldOption = {
  label: string;
  value: string;
};

const ProjectsSettings = () => {
  const FIELD_COMPONENTS_BY_NUMBER: Record<
    number,
    (props: any) => React.ReactNode
  > = {
    0: (props) => <ShortText {...props} />,
    1: (props) => <LongText {...props} />,
    2: (props) => <Numbers {...props} />,
    3: (props) => <Selector {...props} />,
    4: (props) => <Check {...props} />,
    5: (props) => <Radio {...props} />,
    6: (props) => <Switch {...props} />,
    7: (props) => <DateInput {...props} />,
    8: (props) => <Weblink {...props} />,
    9: (props) => <Location {...props} />,
  };

  const { company, refreshCompany } = useCompany();

  const scrollDiv = useRef<HTMLDivElement | null>(null);

  const fieldsCount = company?.project_attributes?.length ?? 0;

  const waitForRender = () =>
    new Promise((resolve) => requestAnimationFrame(() => resolve(true)));

  const parseOptionsFromMetadata = (metadata?: string[]): FieldOption[] => {
    const raw = metadata?.[0];
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) return [];

      return parsed.map((opt: any) => ({
        label: String(opt?.label ?? opt?.value ?? ""),
        value: String(opt?.value ?? opt?.label ?? ""),
      }));
    } catch {
      return [];
    }
  };

  const hasMultipleFlag = (metadata?: string[]) => {
    return metadata?.includes("multiple") ?? false;
  };

  const scrollToBottom = () => {
    scrollDiv.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  const addField = async () => {
    if (fieldsCount >= 10) return;

    const newAttribute = {
      type: 0,
      hint: "",
      has_hint_text: false,
      required: true,
      label: "",
      metadata: [],
    };

    const updatedCompany = {
      ...company,
      project_attributes: [
        ...(company?.project_attributes ?? []),
        newAttribute,
      ],
    };

    await updateCompanyByCompanyId(company.id, updatedCompany);
    await refreshCompany();
    await waitForRender();
    scrollToBottom();
  };

  const deleteField = async (uuid: string) => {
    const updatedCompany = {
      ...company,
      project_attributes: (company?.project_attributes ?? []).filter(
        (attr: any) => attr.uuid !== uuid,
      ),
    };

    await updateCompanyByCompanyId(company.id, updatedCompany);
    await refreshCompany();
  };

  const updateField = async (uuid: string, patch: any) => {
    const updatedCompany = {
      ...company,
      project_attributes: (company?.project_attributes ?? []).map(
        (attr: any) => (attr.uuid === uuid ? { ...attr, ...patch } : attr),
      ),
    };

    await updateCompanyByCompanyId(company.id, updatedCompany);
    await refreshCompany();
  };

  const duplicateField = async (uuid: string) => {
    const attrs = company?.project_attributes ?? [];
    const index = attrs.findIndex((a: any) => a.uuid === uuid);
    if (index === -1) return;

    const original = attrs[index];

    const duplicated = {
      ...original,
      uuid: undefined,
    };

    const updatedCompany = {
      ...company,
      project_attributes: [
        ...attrs.slice(0, index + 1),
        duplicated,
        ...attrs.slice(index + 1),
      ],
    };

    await updateCompanyByCompanyId(company.id, updatedCompany);
    await refreshCompany();
  };

  const gridConfig =
    fieldsCount < 7
      ? { cols: 1, rows: fieldsCount }
      : fieldsCount <= 10
        ? { cols: 2, rows: 5 }
        : { cols: 2, rows: Math.ceil(fieldsCount / 2) };

  return (
    <div className="flex gap-20 mb-10 mt-[-20px] zoomed-container">
      <ConfigProvider
        theme={{
          components: {
            Switch: {
              colorPrimary: "#02A960",
              colorPrimaryHover: "#028C50",
            },
          },
        }}
      >
        <div className="w-5/12 flex flex-col gap-8">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <p className="text-grey-dark text-base">Project Information</p>
              <p className="text-xs text-grey-normal">
                This is the project information requested for all projects. Pick
                up to 10 fields.
              </p>
            </div>

            <Tooltip
              title={fieldsCount >= 10 ? "Maximum 10 fields" : ""}
              placement="top"
            >
              <div>
                <Button
                  backgroundColor="forumBlue-normal"
                  className="rounded-md !px-4 !py-1"
                  onClick={addField}
                  disabled={fieldsCount >= 10}
                >
                  + Add Field
                </Button>
              </div>
            </Tooltip>
          </div>

          <div className="overflow-auto max-h-[65vh] scrollbar-hidden">
            <div className="flex flex-col gap-6">
              {company?.project_attributes?.map((field: any, index: number) => (
                <FieldBox
                  key={field.uuid ?? `${field.type}-${field.label}-${index}`}
                  id={index}
                  {...field}
                  onDelete={deleteField}
                  onDuplicate={() => field.uuid && duplicateField(field.uuid)}
                  onChange={(patch: any) =>
                    field.uuid && updateField(field.uuid, patch)
                  }
                />
              ))}
            </div>

            <div ref={scrollDiv} />
          </div>
        </div>

        <Divider type="vertical" className="h-auto" />

        <div className="w-7/12">
          <div className="flex flex-col gap-1">
            <p className="text-grey-dark text-base">Preview</p>
            <p className="text-xs text-grey-normal">
              This will be all available information from a project
            </p>
          </div>

          <div
            className={`mt-6 border-primaryN30 border rounded-lg p-6 transition-all w-fit`}
          >
            <div className="flex gap-4 items-center pb-6">
              <p className="text-forumBlue-normal">Create New Project</p>
            </div>

            <div
              className={
                gridConfig.cols === 1 ? "space-y-4" : "columns-2 gap-4"
              }
            >
              <div className="w-full break-inside-avoid mb-4">
                <ShortText
                  name="Project Name"
                  required
                  hint_text="Input a recognizable name for you."
                />
              </div>

              {company?.project_attributes?.map((field: any, index: number) => {
                const RenderComponent = FIELD_COMPONENTS_BY_NUMBER[field.type];
                if (!RenderComponent) return null;

                const usesSerializedOptions =
                  field.type === 3 || field.type === 4 || field.type === 5;

                const options = usesSerializedOptions
                  ? parseOptionsFromMetadata(field.metadata)
                  : undefined;

                const isRangedDate =
                  field.type === 7 && (field.metadata ?? []).includes("ranged");

                const isMultiple =
                  (field.type === 3 || field.type === 4) &&
                  hasMultipleFlag(field.metadata);

                const props = {
                  name: field.label,
                  required: field.required,
                  hint_text: field.has_hint_text ? field.hint : undefined,
                  options,
                  isMultiple,
                  is_ranged_date: isRangedDate,
                  height: "small",
                };

                return (
                  <div
                    key={field.uuid ?? `${field.type}-${field.label}-${index}`}
                    className="w-[320px] break-inside-avoid mb-4"
                  >
                    {RenderComponent(props)}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end w-full mt-6 max-w-80">
              <Button
                backgroundColor="forumBlue-normal"
                className="rounded-md !px-4 !py-1"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      </ConfigProvider>
    </div>
  );
};

export default ProjectsSettings;
