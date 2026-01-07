"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Flex, Select, Radio, Divider } from "antd";
import { FolderViewOutlined, RadiusBottomleftOutlined, PlusOutlined, CopyOutlined, DeleteOutlined, LeftOutlined, PlusCircleOutlined } from '@ant-design/icons';
import {
	fetchProfileMsgByVersionId,
	fetchProjectAttributesWithOptionsByVersionId,
	fetchQuoteAttributesWithOptionsByVersionId,
	fetchItemAttributesWithOptionsByVersionId,
	fetchUnitAttributesWithOptionsByVersionId
} from "@/services/profileEditorService";

const ProfileEditorCom = () => {

	const searchParams = useSearchParams();
	const profileVersionId = searchParams.get("version") || "1b1cdb63-1c27-49c0-9c64-303d4ee4f13a";

	useEffect(() => {
		(async () => {
			const profileMsg = await fetchProfileMsgByVersionId(profileVersionId);
			console.log(profileMsg, 'profileMsg')
			if (profileMsg.status == "success") {
				const data = profileMsg.data;

				// 并发执行四个请求
				const [
					projectAttributesWithOptions,
					quoteAttributesWithOptions,
					itemAttributesWithOptions,
					unitAttributesWithOptions
				] = await Promise.all([
					fetchProjectAttributesWithOptionsByVersionId(data?.project_version_id),
					fetchQuoteAttributesWithOptionsByVersionId(data?.quote_version_id),
					fetchItemAttributesWithOptionsByVersionId(data?.item_version_id),
					fetchUnitAttributesWithOptionsByVersionId(data?.unit_version_id)
				]);

				console.log(projectAttributesWithOptions, quoteAttributesWithOptions, itemAttributesWithOptions, unitAttributesWithOptions);
			}
		})();
	}, [])

	return (
		<div
			className="p-4 h-screen text-sm"
		>
			<div className="flex">
				<div
					className="mt-3"
					style={{
						border: "1px solid #e5e7eb",
						padding: "15px",
						boxSizing: "border-box",
						width: "300px",
						borderRadius: "6px"
					}}
				>
					<div className="flex w-full items-center">
						<span className="w-3/6">Option Type</span>
						<Select className="w-3/6"></Select>
					</div>
					<Divider size="small" />
					<div className="flex mt-2 w-full">
						<span className="w-3/6">Available Option</span>
						<Select className="w-3/6"></Select>
					</div>
				</div>
				<div>
					<div className="flex mt-3">
						<CopyOutlined className="ml-2 cursor-pointer" />
						<DeleteOutlined className="ml-1 cursor-pointer" />
						<LeftOutlined className="ml-1 cursor-pointer" />
					</div>
					<div className="ml-2 flex items-center mt-[25%] flex-col">
						<div
							className="mb-1"
							style={{ borderTop: "1px solid #ccc", height: "1px", width: "100%" }}
						>

						</div>
						<div>
							<PlusCircleOutlined />
							<span className="ml-1">Add sub option</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProfileEditorCom;
