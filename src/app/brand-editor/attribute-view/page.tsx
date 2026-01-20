"use client";
import { useEffect, useState } from "react";
import { Tree, Button, Space, Modal, Form, Select, Input, message, Tooltip, notification, Switch } from "antd";
import { FileOutlined, PlusOutlined, DeleteOutlined, EyeOutlined, SaveOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";

// 动态引入ReactQuill防止SSR错误
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';
import request from "@/lib/http";
import { useSearchParams } from "next/navigation";

const valueTypeOptions = [
	{ label: 'FLOAT', value: 'FLOAT' },
	{ label: 'STRING', value: 'STRING' },
	{ label: 'IMAGE', value: 'IMAGE' },
	{ label: 'HTML', value: 'HTML' },
	{ label: 'STRUCT', value: 'STRUCT' }
];

// 修改点：将原来的 AttributeEditor 拆成复用组件
function AttributeTreeEditor({ treeType, api, saveApi }) {
	const [attributeTree, setAttributeTree] = useState([{}]);
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const [autoExpandParent, setAutoExpandParent] = useState(true);

	useEffect(() => {
		fetchAttributeTree();
	}, []);

	const fetchAttributeTree = async () => {
		setAttributeTree([]);
		request.get(api).then((res) => {
			const treeData = addIconsToTree([res]);
			setAttributeTree(treeData);
			const getAllKeys = (nodes: any) => {
				let keys: any = [];
				nodes.forEach((node: any) => {
					keys.push(node.key);
					if (node.children) keys = keys.concat(getAllKeys(node.children));
				});
				return keys;
			};
			setExpandedKeys(getAllKeys(treeData));
		}).catch(() => {
			message.error("Server error, unable to fetch attribute tree.");
		});
	};

	const addIconsToTree = (attributes: any) => {
		return attributes.map(attribute => ({
			...attribute,
			icon: <FileOutlined />,
			children: attribute.children ? addIconsToTree(attribute.children) : [],
		}));
	};

	const generateDisplayTree = (attributes: any) => {
		return attributes.map(attribute => {
			let label = attribute.title;
			if (attribute.key !== "0-0") {
				label += attribute.isArray ? ` (${attribute.valueType || ''}<-Array)` : ` (${attribute.valueType || ''})`;
			}
			return {
				...attribute,
				title: (
					<Tooltip
						// title={<div dangerouslySetInnerHTML={{__html: attribute.description || ''}}/>}
						title={
							<div>
								<div dangerouslySetInnerHTML={{ __html: attribute.description || "" }} />
								{attribute.detailUrl && (
									<div style={{ marginTop: 4 }}>
										<a
											href={attribute.detailUrl}
											target="_blank"
											rel="noopener noreferrer"
											style={{ color: "#1890ff" }}
										>
											Detail Url
										</a>
									</div>
								)}
								{attribute.imageName && (
									<div style={{ marginTop: 4 }}>
										Image Name: {attribute.imageName}
									</div>
								)}
							</div>
						}
						placement="right"
						overlayStyle={{ maxWidth: 400 }}
					>
						<span>{label}</span>
					</Tooltip>
				),
				children: attribute.children ? generateDisplayTree(attribute.children) : [],
			};
		});
	};

	const hasPendingChanges = (attributes) => {
		return attributes.some(attribute =>
			attribute.isNew || attribute.isModified || (attribute.children && hasPendingChanges(attribute.children))
		);
	};

	const stripIcons = (attributes) => {
		return attributes.map(({ icon, ...rest }) => {
			const clean = { ...rest };
			if (clean.children) {
				clean.children = stripIcons(clean.children);
			}
			return clean;
		});
	};
	const onExpand = (keys: React.Key[]) => {
		setExpandedKeys(keys);
		setAutoExpandParent(false);
	};


	return (
		<div>
			<Tree showIcon autoExpandParent={autoExpandParent} expandedKeys={expandedKeys} onExpand={onExpand} treeData={generateDisplayTree(attributeTree)} />
		</div>
	);
}
export default function AttributeEditor() {
	const api = process.env.NEXT_PUBLIC_PROJECTS_API;
	const searchParams = useSearchParams();
	const treeType = searchParams.get("attribute") || "project";
	const version_id = searchParams.get("version") || "0";
	const apiMap: Record<string, string> = {
		project: `${api}/product_attribute/project/all?version_id=${version_id}`,
		quote: `${api}/product_attribute/quote/all?version_id=${version_id}`,
		item: `${api}/product_attribute/item/all?version_id=${version_id}`,
		unit: `${api}/product_attribute/unit/all?version_id=${version_id}`,
	};

	const titleMap: Record<string, string> = {
		project: "Project Attribute View",
		quote: "Quote Attribute View",
		item: "Item Attribute View",
		unit: "Unit Attribute View",
	};

	return (
		<div
			style={{
				width: "100%",
				padding: 16,
			}}
		>
			<h3 className="mb-2">{titleMap[treeType]}</h3>
			<AttributeTreeEditor
				treeType={treeType}
				api={apiMap[treeType]}
				saveApi={`${api}/product_attribute`}
			/>
		</div>
	);
}
