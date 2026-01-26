"use client";
import { useEffect, useState } from "react";
import { Tree, Button, Space, Modal, Form, Select, Input, message, Tooltip, notification, Switch } from "antd";
import { FileOutlined, PlusOutlined, DeleteOutlined, EyeOutlined, SaveOutlined, LeftOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";

// 动态引入ReactQuill防止SSR错误
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';
import request from "@/lib/http";
import { useRouter, useSearchParams } from "next/navigation";

// 修改点：将原来的 AttributeEditor 拆成复用组件
function AttributeTreeEditor({ treeType, api, saveApi, version_id, companyId }) {
	const router = useRouter();
	const [attributeTree, setAttributeTree] = useState([{}]);
	const [selectedKey, setSelectedKey] = useState(null);
	const [selectedAttribute, setSelectedAttribute] = useState(null);
	const [descriptionInput, setDescriptionInput] = useState("");
	const [valueTypeInput, setValueTypeInput] = useState("STRING");
	const [modalVisible, setModalVisible] = useState(false);
	const [newAttributeName, setNewAttributeName] = useState("");
	const [newAttributeCode, setNewAttributeCode] = useState("");
	const [newAttributeDescription, setNewAttributeDescription] = useState("");
	const [newAttributeValueType, setNewAttributeValueType] = useState("STRING");
	const [newAttributeIsArray, setNewAttributeIsArray] = useState(false);
	const [previewMode, setPreviewMode] = useState(false);
	const [saving, setSaving] = useState(false);
	const [deleteing, setDeleteing] = useState(false);
	const [unitInput, setUnitInput] = useState("");
	const [imageNameInput, setImageNameInput] = useState("");
	const [detailUrlInput, setDetailUrlInput] = useState("");
	const [newAttributeUnit, setNewAttributeUnit] = useState("");
	const [newAttributeImageName, setNewAttributeImageName] = useState("");
	const [newAttributeDetailURL, setNewAttributeDetailURL] = useState("");
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const [autoExpandParent, setAutoExpandParent] = useState(true);
	const [valueTypeOptions, setValueTypeOptions] = useState([]);

	useEffect(() => {
		fetchValueTypeOptions();
		fetchAttributeTree();
	}, []);

	const fetchAttributeTree = async () => {
		setSaving(false);
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

	const fetchValueTypeOptions = async () => {
		let url = `${process.env.NEXT_PUBLIC_PROJECTS_API}/product_attribute/value_type/all`
		request.get(url).then((res: any) => {
			setValueTypeOptions(res)
		}).catch(() => {
			message.error("Server error, unable to fetch value type.");
		});
	};


	const addIconsToTree = (attributes) => {
		return attributes.map(attribute => ({
			...attribute,
			icon: <FileOutlined />,
			children: attribute.children ? addIconsToTree(attribute.children) : [],
		}));
	};

	const onSelect = (keys) => {
		if (keys.length > 0) {
			const selected = findAttribute(attributeTree, keys[0]);
			setSelectedKey(keys[0]);
			setSelectedAttribute(selected);
			setDescriptionInput(selected?.description || "");
			setValueTypeInput(selected?.valueType || "STRING");
			setUnitInput(selected?.unit || "");
			setImageNameInput(selected?.imageName || "");
			setDetailUrlInput(selected?.detailUrl || "");
			setPreviewMode(false);
		}
	};

	const findAttribute = (attributes, key) => {
		for (const attribute of attributes) {
			if (attribute.key === key) return attribute;
			if (attribute.children) {
				const found = findAttribute(attribute.children, key);
				if (found) return found;
			}
		}
		return null;
	};
	const findNodeInTree = (attributes, selectedKey) => {
		for (let attribute of attributes) {
			if (attribute.key === selectedKey) {
				return attribute;
			}
			if (attribute.children) {
				const found = findNodeInTree(attribute.children, selectedKey);
				if (found) return found;
			}
		}
		return null;
	};
	const addAttribute = () => {
		if (!selectedKey) return;
		let isrAdd = false
		const currentNode = findNodeInTree(attributeTree, selectedKey);
		if (!currentNode) {
			message.error('Not find current node.')
			return
		}
		if (currentNode.valueType === 'STRUCT') {
			isrAdd = true
		}
		if (isrAdd)
			setModalVisible(true);
		else
			message.error('Only Struct nodes can add new nodes.')
	};
	const handleAddConfirm = () => {
		const newKey = Date.now().toString();

		// 遍历整棵树，收集所有已有 code
		const collectCodes = (attributes) => {
			let codes = [];
			for (const attr of attributes) {
				if (attr.code) codes.push(attr.code);
				if (attr.children && attr.children.length > 0) {
					codes = codes.concat(collectCodes(attr.children));
				}
			}
			return codes;
		};

		const existingCodes = collectCodes(attributeTree);

		// 检查 code 是否重复
		if (existingCodes.includes(newAttributeCode)) {
			message.error(`Code "${newAttributeCode}" already exists. Please use a unique code.`);
			return;
		}

		const updateTree = (attributes) => attributes.map(attribute => {
			if (attribute.key === selectedKey) {
				const newChild = {
					title: newAttributeName,
					key: newKey,
					description: newAttributeDescription,
					valueType: newAttributeValueType,
					unit: newAttributeValueType === 'FLOAT' ? newAttributeUnit : null,
					icon: <FileOutlined />,
					isNew: true,
					isModified: false,
					id: 0,
					children: [],
					isArray: newAttributeIsArray,
					detailUrl: newAttributeDetailURL,
					version_id: version_id,
					imageName: newAttributeValueType === 'IMAGE' ? newAttributeImageName : "",
					code: `${treeType}$${newAttributeCode}`
				};
				return {
					...attribute,
					children: attribute.children ? [...attribute.children, newChild] : [newChild],
				};
			} else if (attribute.children) {
				return { ...attribute, children: updateTree(attribute.children) };
			}
			return attribute;
		});

		setAttributeTree(updateTree(attributeTree));
		message.success("Attribute added successfully!");
		setNewAttributeName("");
		setNewAttributeCode("");
		setNewAttributeDescription("");
		setNewAttributeValueType("STRING");
		setNewAttributeUnit("")
		setNewAttributeImageName("")
		setNewAttributeDetailURL("")
		setNewAttributeIsArray(false)
		setModalVisible(false);
	};

	const updateAttributeDetails = () => {
		const updateTree = (attributes) => attributes.map(attribute => {
			if (attribute.key === selectedKey) {
				return { ...attribute, description: descriptionInput, valueType: valueTypeInput, isModified: true, unit: valueTypeInput === 'FLOAT' ? unitInput : null, imageName: valueTypeInput === 'IMAGE' ? imageNameInput : "", detailUrl: detailUrlInput };
			} else if (attribute.children) {
				return { ...attribute, children: updateTree(attribute.children) };
			}
			return attribute;
		});
		setAttributeTree(updateTree(attributeTree));
		message.success("Attribute updated successfully!");
	};

	const deleteAttribute = () => {
		if (!selectedAttribute?.isNew) {
			message.warning("This attribute cannot be deleted.");
			return;
		}
		const deleteFromTree = (attributes) => {
			return attributes.filter(attribute => attribute.key !== selectedKey).map(attribute => {
				if (attribute.children) {
					return { ...attribute, children: deleteFromTree(attribute.children) };
				}
				return attribute;
			});
		};
		setAttributeTree(deleteFromTree(attributeTree));
		setSelectedKey(null);
		setSelectedAttribute(null);
		message.success("Attribute deleted successfully!");
	};

	const deleteAttributeFromDb = () => {
		if (!selectedKey) return;
		setDeleteing(true)
		let url = `${process.env.NEXT_PUBLIC_PROJECTS_API}/product_attribute/${Number(selectedKey)}/delete`
		request.delete(url).then((res) => {
			message.success("Delete success");
			fetchAttributeTree();
		}).catch((error) => {
			if (error.response?.data?.detail) {
				message.error(error.response?.data?.detail);
			} else {
				message.error("Delete Failed.");
			}
		}).finally(() => {
			setDeleteing(false)
		})
	};

	const generateDisplayTree = (attributes) => {
		return attributes.map(attribute => {
			let label = attribute.title;
			if (attribute.key !== "0-0") {
				label += attribute.isArray ? ` (${attribute.valueType || ''}<-Array)` : ` (${attribute.valueType || ''})`;
			}
			return {
				...attribute,
				title: (
					<Tooltip
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
			clean.company_id = companyId
			if (clean.children) {
				clean.children = stripIcons(clean.children);
			}
			return clean;
		});
	};

	const saveAttributeTree = () => {
		try {
			const pureData = stripIcons(attributeTree);
			if (pureData.length !== 1) return;
			setSaving(true);
			request.put(saveApi, pureData[0], {}).then((res) => {
				if (res === true) {
					message.success("Attribute tree saved successfully!");
					fetchAttributeTree();
				} else {
					setSaving(false)
					message.error(`Save failed.`);
				}
			}).catch(() => {
				setSaving(false)
				message.error(`Save failed.`);
			});
		} catch (error) {
			setSaving(false)
			message.error(`Save error.`);
		}
	};

	const quillModules = {
		toolbar: {
			container: [
				[{ 'header': [1, 2, false] }],
				['bold', 'italic', 'underline', 'strike'],
				['blockquote', 'code-block'],
				[{ 'list': 'ordered' }, { 'list': 'bullet' }],
				['link', 'image'],
				['clean']
			]
		}
	};
	const onExpand = (keys: React.Key[]) => {
		setExpandedKeys(keys);
		setAutoExpandParent(false);
	};

	const genCode = (name: string) => {
		return name
			.trim()
			.replace(/\s+/g, '_') // 空格变下划线
			.toLowerCase();
	};

	return (
		<div>
			<Space style={{ marginBottom: 8 }}>
				<Button onClick={addAttribute} icon={<PlusOutlined />} disabled={!selectedKey}>Add</Button>
				<Button onClick={deleteAttribute} icon={<DeleteOutlined />} disabled={!selectedAttribute || !selectedAttribute.isNew} danger>Delete</Button>
				<Button onClick={deleteAttributeFromDb} icon={<DeleteOutlined />} disabled={!selectedKey || deleteing} danger>Delete From DB</Button>
				<Button icon={<EyeOutlined />} disabled={!selectedAttribute} onClick={() => setPreviewMode(prev => !prev)}>
					{previewMode ? "Edit Mode" : "Preview Mode"}
				</Button>
				<Button type="primary" icon={<SaveOutlined />} disabled={!hasPendingChanges(attributeTree) || saving} onClick={saveAttributeTree}>Save to db</Button>
			</Space>
			<Tree showIcon autoExpandParent={autoExpandParent} expandedKeys={expandedKeys} onExpand={onExpand} treeData={generateDisplayTree(attributeTree)} onSelect={onSelect} />
			{selectedAttribute && selectedAttribute.key !== "0-0" && (
				<div style={{ marginTop: 16 }}>
					{previewMode ? (
						<div
							style={{ border: "1px solid #eee", padding: 10, minHeight: 100 }}
						>
							<div dangerouslySetInnerHTML={{ __html: descriptionInput }} />
							{detailUrlInput && (
								<div style={{ marginTop: 8 }}>
									<a
										href={detailUrlInput}
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: "#1890ff" }}
									>
										Detail Url
									</a>
								</div>
							)}
						</div>
					) : (
						<>
							<h4>Description:</h4>
							<ReactQuill theme="snow" value={descriptionInput} onChange={setDescriptionInput}
								modules={quillModules} />
							<h4 style={{ marginTop: 16 }}>Value Type:</h4>
							<Select options={valueTypeOptions} value={valueTypeInput} style={{ width: 200 }} onChange={setValueTypeInput} disabled={!selectedAttribute.isNew} />


							{valueTypeInput === "FLOAT" && (
								<>
									<h4 style={{ marginTop: 16 }}>Unit:</h4>
									<Input value={unitInput} onChange={(e) => setUnitInput(e.target.value)} style={{ width: 200 }} />
								</>
							)}
							{valueTypeInput === "IMAGE" && (
								<>
									<h4 style={{ marginTop: 16 }}>Image Name:</h4>
									<Input value={imageNameInput} onChange={(e) => setImageNameInput(e.target.value)} style={{ width: 200 }} />
								</>
							)}
							<div>
								<h4 style={{ marginTop: 16 }}>Detail Url:</h4>
								<Input value={detailUrlInput} onChange={(e) => setDetailUrlInput(e.target.value)} style={{ width: 400 }} />
							</div>
							<Button type="primary" style={{ marginTop: 16 }} onClick={updateAttributeDetails}>Update</Button>
						</>
					)}
				</div>
			)}
			<Modal title="Add New Attribute" open={modalVisible} onOk={handleAddConfirm} onCancel={() => setModalVisible(false)} okButtonProps={{ disabled: !newAttributeName || !newAttributeCode }}>
				<Form layout="vertical">
					<Form.Item label="Attribute Name">
						<Input
							value={newAttributeName}
							onChange={(e) => {
								setNewAttributeName(e.target.value)
								setNewAttributeCode(genCode(e.target.value))
							}}
							placeholder="Please input attribute name"
						/>
					</Form.Item>
					<Form.Item label="Attribute Code">
						<Input value={newAttributeCode} onChange={(e) => setNewAttributeCode(e.target.value)} placeholder="Please input attribute code" />
					</Form.Item>
					<Form.Item label="Description">
						<ReactQuill theme="snow" value={newAttributeDescription} onChange={setNewAttributeDescription} modules={quillModules} />
					</Form.Item>
					<Form.Item label="Value Type">
						<Select options={valueTypeOptions} value={newAttributeValueType} onChange={setNewAttributeValueType} />
					</Form.Item>
					<Form.Item label="Is Array">
						<Switch
							checked={newAttributeIsArray}
							onChange={setNewAttributeIsArray}
							checkedChildren="Yes"
							unCheckedChildren="No"
						/>
					</Form.Item>
					{newAttributeValueType === "FLOAT" && (
						<Form.Item label="Unit">
							<Input value={newAttributeUnit} onChange={(e) => setNewAttributeUnit(e.target.value)} />
						</Form.Item>
					)}
					{newAttributeValueType === "IMAGE" && (
						<Form.Item label="Image Name">
							<Input value={newAttributeImageName} onChange={(e) => setNewAttributeImageName(e.target.value)} />
						</Form.Item>
					)}
					<Form.Item label="Detail Url">
						<Input value={newAttributeDetailURL} onChange={(e) => setNewAttributeDetailURL(e.target.value)} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
export default function AttributeEditor(props: any) {
	const api = process.env.NEXT_PUBLIC_PROJECTS_API;
	const treeType = props?.attribute || "project";
	const version_id = props.version || "0";
	const companyId = props.companyId || null
	const apiMap: Record<string, string> = {
		project: `${api}/product_attribute/project/all?version_id=${version_id}`,
		quote: `${api}/product_attribute/quote/all?version_id=${version_id}`,
		item: `${api}/product_attribute/item/all?version_id=${version_id}`,
		unit: `${api}/product_attribute/unit/all?version_id=${version_id}`,
	};

	const titleMap: Record<string, string> = {
		project: "Project Attribute Editor",
		quote: "Quote Attribute Editor",
		item: "Item Attribute Editor",
		unit: "Unit Attribute Editor",
	};

	return (
		<div
			style={{
				width: "100%",
			}}
		>
			<div 
				className="inline-flex items-center mb-2 cursor-pointer" 
				style={{color: "#014767"}}
				onClick={props.handleBackParameter}
			>
				<LeftOutlined style={{fontSize:"16px"}}/>
				<h4 className="ml-2">Back</h4>
			</div>
			<AttributeTreeEditor
				treeType={treeType}
				api={apiMap[treeType]}
				saveApi={`${api}/product_attribute?version_id=${version_id}`}
				version_id={version_id}
				companyId={companyId}
			/>
		</div>
	);
}
