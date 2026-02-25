"use client";

import React from "react";
import Button from "@/components/Button";
import { FieldBox } from "./Field-Box";
import { ConfigProvider, Divider } from "antd";
import { useCompany } from "@/context/CompanyContext";
import { updateCompanyByCompanyId } from "@/services/companyService";

const ProjectsSettings = () => {
  const { company, refreshCompany } = useCompany();

  const fieldsCount = company?.project_attributes?.length ?? 0;

  const addField = async () => {
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
      project_attributes: [...(company.project_attributes ?? []), newAttribute],
    };

    await updateCompanyByCompanyId(company.id, updatedCompany);
    await refreshCompany();
  };

  const deleteField = async (uuid: string) => {
    const updatedCompany = {
      ...company,
      project_attributes: (company.project_attributes ?? []).filter(
        (attr: any) => attr.uuid !== uuid
      ),
    };

    await updateCompanyByCompanyId(company.id, updatedCompany);
    await refreshCompany();
  };
  const updateField = async (uuid: string, patch: any) => {
    const updatedCompany = {
      ...company,
      project_attributes: (company.project_attributes ?? []).map((attr: any) =>
        attr.uuid === uuid ? { ...attr, ...patch } : attr
      ),
    };

    await updateCompanyByCompanyId(company.id, updatedCompany);
    await refreshCompany();
  };

  const duplicateField = async (uuid: string) => {
    const attrs = company.project_attributes ?? [];
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
    fieldsCount <= 7
      ? { cols: 1, rows: fieldsCount }
      : fieldsCount <= 10
      ? { cols: 2, rows: 5 }
      : { cols: 2, rows: Math.ceil(fieldsCount / 2) };

  const isWide = fieldsCount > 7;

  return (
    <div className="flex gap-20 mb-10 mt-[-20px]">
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
        {/* LEFT */}
        <div className="w-5/12 flex flex-col gap-8">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <p className="text-baseDark text-base">Project Information</p>
              <p className="text-xs text-basicGray">
                This is the project information requested for all projects. Pick
                up to 10 fields.
              </p>
            </div>

            <Button
              backgroundColor="forumBlue"
              className="rounded-md !px-4 !py-1"
              onClick={addField}
            >
              + Add Field
            </Button>
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
          </div>
        </div>

        <Divider type="vertical" className="h-auto" />

        {/* RIGHT */}
        <div className="w-7/12">
          <div className="flex flex-col gap-1">
            <p className="text-baseDark text-base">Preview</p>
            <p className="text-xs text-basicGray">
              This will be all available information from a project
            </p>
          </div>

          <div
            className={`mt-6 border-primaryN30 border rounded-lg p-6 transition-all
            ${isWide ? "w-5/6 max-w-4xl" : "w-4/6 max-w-2xl"}
          `}
          >
            <div className="flex gap-4 items-center pb-6">
              <p className="text-forumBlue">Create New Project</p>
            </div>

            <div
              className={
                gridConfig.cols === 1 ? "space-y-4" : "columns-2 gap-4"
              }
            >
              {company?.project_attributes?.map((field: any, index: number) => (
                <div
                  key={field.uuid ?? `${field.type}-${field.label}-${index}`}
                  className="w-full break-inside-avoid mb-4"
                >
                  {/* Preview placeholder */}
                  <div className="text-xs text-basicGray">
                    {field.label || "Untitled field"} (type: {field.type})
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end w-full mt-6 max-w-80">
              <Button
                backgroundColor="forumBlue"
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
