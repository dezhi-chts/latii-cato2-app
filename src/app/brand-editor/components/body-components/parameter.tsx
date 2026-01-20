"use client";

import { Card, Button } from "antd";
import { EyeOutlined, EditOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import {
	fetchProductAttributeVersionByAttributeNameCompanyId
} from "@/services/profileEditorService";
import {
	fetchCompanyByKeycloakUser
} from "@/services/companyService";
import AttributeTreeEditor from "@/app/brand-editor/components/body-components/parameter-editor";
import { motion, AnimatePresence } from "framer-motion";

type ParameterItem = {
	type?: string,
	title?: string,
	name?: string,
	versionMsg?: Record<string, any>,
	isEdit?: boolean
};

const Parameter = () => {

	const [companyMsg, setCompanyMsg] = useState<Record<string, any>>({});
	const [parameterMsg, setParameterMsg] = useState<ParameterItem[]>([
		{
			type: "project",
			title: "Project Attribute",
			name: "PROJECT Attribute Tree"
		},
		{
			type: "quote",
			title: "Quote Attribute",
			name: "QUOTE Attribute Tree"
		}, {
			type: "item",
			title: "Item Attribute",
			name: "ITEM Attribute Tree"
		}, {
			type: "unit",
			title: "Unit Attribute",
			name: "UNIT Attribute Tree"
		},
	]);
	const [editParameterMsg, setEditParameterMsg] = useState<ParameterItem>({})

	useEffect(() => {
		getAllAttributeVersionData()
	}, []);

	const getAllAttributeVersionData = async () => {
		const companyRes = await fetchCompanyByKeycloakUser();
		if (companyRes.status == "success") {
			setCompanyMsg(companyRes?.data)
			const [
				projectVersion,
				quoteVersion,
				itemVersion,
				unitVersion
			] = await Promise.all([
				fetchProductAttributeVersionByAttributeNameCompanyId(
					"PROJECT Attribute Tree",
					companyRes?.data.id
				),
				fetchProductAttributeVersionByAttributeNameCompanyId(
					"QUOTE Attribute Tree",
					companyRes?.data.id
				),
				fetchProductAttributeVersionByAttributeNameCompanyId(
					"ITEM Attribute Tree",
					companyRes?.data.id
				), fetchProductAttributeVersionByAttributeNameCompanyId(
					"UNIT Attribute Tree",
					companyRes?.data.id
				)
			]);

			let allAttributeVersions: any = [];
			if (projectVersion?.status == "success" && Array.isArray(projectVersion?.data) && projectVersion?.data.length != 0) {
				allAttributeVersions.push(projectVersion?.data[0])
			}
			if (quoteVersion?.status == "success" && Array.isArray(quoteVersion?.data) && quoteVersion?.data.length != 0) {
				allAttributeVersions.push(quoteVersion?.data[0])
			}
			if (itemVersion?.status == "success" && Array.isArray(itemVersion?.data) && itemVersion?.data.length != 0) {
				allAttributeVersions.push(itemVersion?.data[0])
			}
			if (unitVersion?.status == "success" && Array.isArray(unitVersion?.data) && unitVersion?.data.length != 0) {
				allAttributeVersions.push(unitVersion?.data[0])
			}
			parameterMsg.forEach((item1: ParameterItem) => {
				allAttributeVersions.forEach((item2: Record<string, any>) => {
					if (item1.name == item2.name) {
						item1.versionMsg = item2
					}
				})
			})
			setParameterMsg(parameterMsg)
		}
	};

	const handleViewAttribute = (msg: ParameterItem) => {
		const url = `${window.location.origin}/brand-editor/attribute-view?attribute=${msg.type}&version=${msg?.versionMsg?.id || ""}`
		window.open(url)
	};

	const handleEditAttribute = (msg: ParameterItem) => {
		setEditParameterMsg(msg)
	};

	const handleBackParameter = () => {
		setEditParameterMsg({})
	};

	return (
		<div className="pr-6 pb-6 relative">
			<div className="grid grid-cols-3 gap-4">
				{parameterMsg.map(item => (
					<Card
						key={item.type}
						hoverable
						className="
							relative group
							transition-all duration-300
							hover:-translate-y-1
							hover:shadow-lg
							border border-gray-200
							rounded-xl
							flex flex-col justify-between
						"
						styles={{
							body: {
								padding: 16,
							},
						}}
					>
						{/* 内容区 */}
						<div className="space-y-2">
							<div className="text-[18px] text-gray-800">
								{item.title}
							</div>
						</div>

						{/* hover 显示的底部按钮 */}
						<div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
							<Button
								icon={<EyeOutlined />}
								onClick={() => handleViewAttribute(item)}
							>
								View
							</Button>
							<Button
								type="primary"
								icon={<EditOutlined />}
								onClick={() => handleEditAttribute(item)}
							>
								Edit
							</Button>
						</div>
					</Card>
				))}
			</div>
			<AnimatePresence>
				{editParameterMsg?.name && (
					<motion.div
						key="attribute-editor"
						className="absolute left-0 top-0 bg-white z-10"
						style={{
							height: "calc(100vh - 200px)",
							width: "calc(100% - 24px)"
						}}
						initial={{
							opacity: 0,
							scale: 0.8,          // 缩小
							x: 30,               // 横向偏移
							y: -50,              // 垂直偏移
							rotateX: 20,         // X 轴旋转
							rotateY: 10,         // Y 轴旋转
							rotateZ: -10         // Z 轴旋转
						}}
						animate={{
							opacity: 1,
							scale: 1,
							x: 0,
							y: 0,
							rotateX: 0,
							rotateY: 0,
							rotateZ: 0
						}}
						exit={{
							opacity: 0,
							scale: 0.8,
							x: -30,
							y: -50,
							rotateX: -20,
							rotateY: -10,
							rotateZ: 10
						}}
						transition={{
							type: "spring",
							stiffness: 250,
							damping: 18,
							mass: 1
						}}
					>
						<AttributeTreeEditor
							attribute={editParameterMsg?.type}
							version={editParameterMsg?.versionMsg?.id}
							companyId={companyMsg?.id}
							handleBackParameter={handleBackParameter}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default Parameter;
