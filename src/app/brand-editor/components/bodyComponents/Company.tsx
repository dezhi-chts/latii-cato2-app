"use client";

import { Input, Upload, notification, Form, Button } from "antd";
const { TextArea } = Input;
import { CSSProperties, ElementType, ReactNode } from "react";
import { GlobalOutlined } from "@ant-design/icons";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import {
	fetchCompanyByKeycloakUser,
	updateCompanyLogoByCompanyId,
	updateCompanyByCompanyId
} from "@/services/companyService";
import LocationSelector from "@/components/LocationSelector";

// const companyFields: CompanyField[] = [
// 	{
// 		name: "Name",
// 		Component: Input,
// 		isObligatory: true,
// 		placeholder: "Input a recognizable name for you.",
// 		className: "w-[350px]",
// 	},
// 	{
// 		name: "Description",
// 		Component: Input.TextArea,
// 		isObligatory: false,
// 		placeholder: "Any additional notes, descriptions",
// 		className: "w-[350px]",
// 		style: { resize: "none" },
// 		rows: 4,
// 	},
// 	{
// 		name: "Location",
// 		Component: Input,
// 		isObligatory: false,
// 		placeholder: "State, City, Postal Code, Address.",
// 		className: "w-[350px]",
// 		addonAfter: (
// 			<div className="flex items-center justify-center w-4 h-6">
// 				<Image
// 					alt="location"
// 					src="/assets/icons/location.svg"
// 					width={16}
// 					height={16}
// 				/>
// 			</div>
// 		),
// 	},
// 	{
// 		name: "Website",
// 		Component: Input,
// 		isObligatory: false,
// 		placeholder: "Website",
// 		className: "w-[350px]",
// 		addonAfter: (
// 			<div className="flex items-center justify-center w-4 h-6">
// 				<Image
// 					alt="website"
// 					src="/assets/icons/website.svg"
// 					width={16}
// 					height={16}
// 				/>
// 			</div>
// 		),
// 	},
// 	{
// 		name: "Social Media",
// 		Component: Input,
// 		isObligatory: false,
// 		placeholder: "LinkedIn",
// 		className: "w-[350px]",
// 		addonAfter: (
// 			<div className="flex items-center justify-center w-4 h-6">
// 				<Image
// 					alt="Social Media"
// 					src="/assets/icons/website.svg"
// 					width={16}
// 					height={16}
// 				/>
// 			</div>
// 		),
// 	},
// ];

type Location = {
	state: string,
	city: string,
	address: string,
	postal_code: string,
	country: string // 目前这个字段永远为空
};

type CompanyField = {
	id: number;
	name: string,
	description: string
	website: string,
	social_media: string,
	photo_url: string,
	location: Location
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
		country: ""
	}
};

const Company = () => {

	const [companyMsg, setCompanyMsg] = useState<CompanyField>(defaultCompanyData);
	const [showLocationSelector, setShowLocationSelector] = useState(false);

	useEffect(() => {
		getCompanyMsg();
	}, []);

	const getCompanyMsg = async () => {
		const companyRes = await fetchCompanyByKeycloakUser();
		if (companyRes.status == "success") {
			setCompanyMsg(companyRes?.data)
		}
	};

	const beforeUpload = (file: any) => {
		const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
		if (!isJpgOrPng) {
			notification.error({
				message: "Error",
				description: "You can only upload JPG/PNG file"
			});
		}
		return isJpgOrPng
	};

	const uploadFile = async ({ file }: any) => {
		const res = await updateCompanyLogoByCompanyId(companyMsg.id, file);
		if (res.status == "success") {
			setCompanyMsg((prev) => ({
				...prev,
				photo_url: res?.data
			}));
			notification.success({
				message: "Success",
				description: "Upload successfully"
			});
		}else{
			notification.error({
				message: "Error",
				description: "Failed to upload file"
			});
		}
	};

	const handleInputChange = (field: any) => (e: any) => {
		let tempLocation: any = companyMsg.location
		tempLocation[field] = e.target.value
		setCompanyMsg((prev) => ({
			...prev,
			location: tempLocation
		}));
	};

	const handleDropdownChange = (field: any) => (value: any) => {
		let tempLocation: any = companyMsg.location
		tempLocation[field] = value
		setCompanyMsg((prev) => ({
			...prev,
			location: tempLocation
		}));
	};

	const handleCompanyChange = (field: any, value: any) => {
		setCompanyMsg((prev) => ({
			...prev,
			[field]: value
		}));
	};

	const handleSaveChange = async () => {
		const res = await updateCompanyByCompanyId(companyMsg.id, companyMsg);
		if (res.status == "success") {
			getCompanyMsg()
			notification.success({
				message: "Success",
				description: "Save successfully"
			});
		}else{
			notification.error({
				message: "Error",
				description: "Failed to Save"
			});
		}
	};

	return (
		<div className="flex flex-col gap-6">
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
				<p className="text-basicGray" style={{ fontSize: "18px" }}>{companyMsg.name}</p>
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
					<p className="w-2/12">
						Description
					</p>
					<TextArea
						className="w-10/12"
						rows={4}
						placeholder="Any additional notes, descriptions"
						value={companyMsg.description ?? ""}
						size="large"
						onChange={(e: any) => handleCompanyChange("description", e.target.value)}
					/>
				</div>
				<div className="zoomed-container mt-8 flex gap-6 w-[800px] items-center">
					<p className="w-2/12">
						Location
					</p>
					<div className="w-10/12">
						<LocationSelector
							onClose={() => setShowLocationSelector(false)}
							handleInputChange={handleInputChange}
							handleDropdownChange={handleDropdownChange}
							projectSettings={companyMsg.location}
							isOpen={showLocationSelector}
							setIsOpen={setShowLocationSelector}
							height="medium"
						/>
					</div>

				</div>
				<div className="zoomed-container mt-8 flex gap-6 w-[800px] items-center">
					<p className="w-2/12">
						Website
					</p>
					<Input
						className="w-10/12"
						placeholder="Input a recognizable name for you."
						value={companyMsg.website}
						size="large"
						onChange={(e: any) => handleCompanyChange("website", e.target.value)}
					/>
				</div>
				<div className="zoomed-container mt-8 flex gap-6 w-[800px] items-center">
					<p className="w-2/12">
						Social Media
					</p>
					<Input
						className="w-10/12"
						placeholder="Input a recognizable name for you."
						value={companyMsg.social_media}
						size="large"
						onChange={(e: any) => handleCompanyChange("social_media", e.target.value)}
					/>
				</div>
				<div className="zoomed-container mt-8 flex gap-6 w-[800px] items-center justify-start">
					<Button onClick={handleSaveChange} type="primary">Save Change</Button>
				</div>
			</div>
		</div>
	);
};

export default Company;
