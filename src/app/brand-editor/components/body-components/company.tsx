"use client";

import { Input, Upload, notification, Button as AntButton, Space } from "antd";
const { TextArea } = Input;
import { GlobalOutlined, EnvironmentOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  fetchCompanyByKeycloakUser,
  updateCompanyLogoByCompanyId,
  updateCompanyByCompanyId,
} from "@/services/companyService";
import LocationSelector from "@/components/LocationSelector";
import Button from "@/components/Button";
import UserTable from "@/app/account-settings/components/UserTable";
import { Contact } from "@/types/user";
import { CONTACTS_TIMEOUT_MS } from "@/app/account-settings/components/TeamMembers";
import { getContactsByCompanyId } from "@/services/contactsService";
import { useUser } from "@/context/UserContext";
import Link from "next/link";

type Location = {
  state: string;
  city: string;
  address: string;
  postal_code: string;
  country: string; // 目前这个字段永远为空
};

type CompanyField = {
  id: number;
  name: string;
  description: string;
  website: string;
  social_media: string;
  photo_url: string;
  location: Location;
};

const defaultCompanyData = {
  id: 0,
  name: "",
  description: "",
  website: "",
  social_media: "",
  photo_url: "",
  location: {
    state: "",
    city: "",
    address: "",
    postal_code: "",
    country: "",
  },
};

const Company = () => {
  const [companyMsg, setCompanyMsg] =
    useState<CompanyField>(defaultCompanyData);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [usersData, setUsersData] = useState<Contact[] | null>(null);
  const { company_id = 0, isAdmin } = useUser();

  useEffect(() => {
    getCompanyMsg();
    fetchCompanyContacts();
  }, []);

  const getCompanyMsg = async () => {
    const companyRes = await fetchCompanyByKeycloakUser();
    if (companyRes.status == "success") {
      setCompanyMsg(companyRes?.data);
    }
  };

  const beforeUpload = (file: any) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      notification.error({
        message: "Error",
        description: "You can only upload JPG/PNG file",
      });
    }
    return isJpgOrPng;
  };

  const uploadFile = async ({ file }: any) => {
    const res = await updateCompanyLogoByCompanyId(companyMsg.id, file);
    if (res.status == "success") {
      setCompanyMsg((prev) => ({
        ...prev,
        photo_url: res?.data,
      }));
      notification.success({
        message: "Success",
        description: "Upload successfully",
      });
    } else {
      notification.error({
        message: "Error",
        description: "Failed to upload file",
      });
    }
  };

  const handleInputChange = (field: any) => (e: any) => {
    let tempLocation: any = companyMsg.location;
    tempLocation[field] = e.target.value;
    setCompanyMsg((prev) => ({
      ...prev,
      location: tempLocation,
    }));
  };

  const handleDropdownChange = (field: any) => (value: any) => {
    let tempLocation: any = companyMsg.location;
    tempLocation[field] = value;
    setCompanyMsg((prev) => ({
      ...prev,
      location: tempLocation,
    }));
  };

  const handleCompanyChange = (field: any, value: any) => {
    setCompanyMsg((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChange = async () => {
    const res = await updateCompanyByCompanyId(companyMsg.id, companyMsg);
    if (res.status == "success") {
      getCompanyMsg();
      notification.success({
        message: "Success",
        description: "Save successfully",
      });
    } else {
      notification.error({
        message: "Error",
        description: "Failed to Save",
      });
    }
  };

  const fetchCompanyContacts = async () => {
    try {
      const response = await getContactsByCompanyId({ company_id: company_id });
      const mappedContacts: Contact[] = response.data.map((item: any) => ({
        name: item.name,
        email: item.email,
        phone: item.phone,
        job_title: item.job_title,
        id: item.id,
        note: item.note,
      }));

      setUsersData(mappedContacts);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex gap-28 mr-14">
      <div className="flex flex-col gap-6 h-fit">
        <div className="w-full flex gap-8 items-center">
          <Upload
            showUploadList={false}
            beforeUpload={beforeUpload}
            customRequest={uploadFile}
          >
            <div className="h-28 w-28 flex cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#e8e8e8]">
              {companyMsg?.photo_url ? (
                <div className="relative h-28 w-28 rounded-xl overflow-hidden group cursor-pointer flex items-center justify-center ">
                  <Image
                    src={companyMsg?.photo_url}
                    key={companyMsg?.photo_url}
                    alt="upload photo icon"
                    width={80}
                    height={80}
                    className="w-16 rounded-xl transition-opacity duration-300 group-hover:opacity-80 "
                  />

                  <div
                    className="absolute h-28 w-28 inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "rgba(0,0,0,.3)" }}
                  >
                    <Image
                      src="/assets/icons/picture-2.svg"
                      alt="camera icon"
                      width={26}
                      height={26}
                      className="relative"
                    />
                  </div>
                </div>
              ) : (
                <Image
                  src="/assets/icons/picture-2.svg"
                  alt="upload photo icon"
                  width={26}
                  height={26}
                  className="relative"
                  style={{ bottom: "-6px" }}
                />
              )}
            </div>
          </Upload>
          <p className="text-basicGray" style={{ fontSize: "18px" }}>
            {companyMsg.name}
          </p>
        </div>
        <div className="gap-2 mb-4">
          <div className="zoomed-container mt-8 flex gap-6 w-[800px] items-center">
            <p className="w-2/12">
              Name <span className="text-accentRed">*</span>
            </p>
            <Input
              className="w-10/12"
              placeholder="Input a recognizable name for you."
              value={companyMsg.name}
              size="large"
              onChange={(e: any) => handleCompanyChange("name", e.target.value)}
            />
          </div>
          <div className="zoomed-container mt-8 flex gap-6 w-[800px] items-start">
            <p className="w-2/12">Description</p>
            <TextArea
              className="w-10/12"
              rows={4}
              placeholder="Any additional notes, descriptions"
              value={companyMsg.description ?? ""}
              size="large"
              onChange={(e: any) =>
                handleCompanyChange("description", e.target.value)
              }
            />
          </div>
          <div className="zoomed-container mt-8 flex gap-6 w-[800px] items-center">
            <p className="w-2/12">Location</p>
            <Space.Compact size="large" className="w-10/12">
              <LocationSelector
                style={{ width: "100%" }}
                onClose={() => setShowLocationSelector(false)}
                handleInputChange={handleInputChange}
                handleDropdownChange={handleDropdownChange}
                projectSettings={companyMsg.location}
                isOpen={showLocationSelector}
                setIsOpen={setShowLocationSelector}
                height="medium"
              />
              <Space.Addon className="bg-white">
                <EnvironmentOutlined style={{ color: "#C6C6C6" }} />
              </Space.Addon>
            </Space.Compact>
          </div>
          <div className="zoomed-container mt-8 flex gap-6 w-[800px] items-center">
            <p className="w-2/12">Website</p>
            <Space.Compact size="large" className="w-10/12">
              <Input
                placeholder="Website"
                value={companyMsg.website}
                size="large"
                onChange={(e: any) =>
                  handleCompanyChange("website", e.target.value)
                }
              />
              <Space.Addon className="bg-white">
                <GlobalOutlined style={{ color: "#C6C6C6" }} />
              </Space.Addon>
            </Space.Compact>
          </div>
          <div className="zoomed-container mt-8 flex gap-6 w-[800px] items-center">
            <p className="w-2/12">Social Media</p>
            <Space.Compact size="large" className="w-10/12">
              <Input
                placeholder="Social Media"
                value={companyMsg.social_media}
                size="large"
                onChange={(e: any) =>
                  handleCompanyChange("social_media", e.target.value)
                }
              />
              <Space.Addon className="bg-white">
                <GlobalOutlined style={{ color: "#C6C6C6" }} />
              </Space.Addon>
            </Space.Compact>
          </div>
          <div className="zoomed-container mt-8 flex gap-6 w-[800px] items-center justify-start">
            <AntButton onClick={handleSaveChange} type="primary">
              Save Change
            </AntButton>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[1100px] flex flex-col gap-4 mt-28">
        <div className="flex justify-between w-full">
          <p className="text-forumBlue">Your Team</p>
          {isAdmin && (
            <Link href="/account-settings?tab=team-management">
              <button
                className={`px-6 h-7 bg-forumBlueLightActive text-forumDarkBlue hover:bg-forumBlue hover:text-white text-sm transition-all duration-300 rounded-md`}
              >
                Edit Users
              </button>
            </Link>
          )}
        </div>
        <UserTable
          contacts={usersData || []}
          refreshContacts={fetchCompanyContacts}
          showActions={false}
        />
      </div>
    </div>
  );
};

export default Company;
