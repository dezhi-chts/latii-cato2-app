"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Flex, Popconfirm, Select, Radio, Divider, Descriptions, TreeSelect, Tooltip } from "antd";
import { DatabaseOutlined, PlusCircleFilled, RightOutlined, SaveOutlined, ProfileOutlined, FolderViewOutlined, RadiusBottomleftOutlined, PlusOutlined, CopyOutlined, DeleteOutlined, LeftOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { OptionMsgVO } from "@/app/profile-editor-demo/validators";

const OptionItemCom = (props: any) => {

	const stringBoxHeight = 153;
	const imageBoxHeight = 153;

	const [optionItemMsg, setOptionItemMsg] = useState<OptionMsgVO>(props.optionItemMsg);
	const [attributesTree, setAttributesTree] = useState<any[]>(props.attributesTree);

	useEffect(() => {
		setOptionItemMsg(props.optionItemMsg)
	}, [props.optionItemMsg]);

	useEffect(() => {
		setAttributesTree(props.attributesTree)
	}, [props.attributesTree]);

	const addSubOptionHandler = () => {
		props.addSubOptionHandler(optionItemMsg)
	};

	const addSiblingOptionHandler = () => {
		props.addSiblingOptionHandler(optionItemMsg)
	};

	const copyNode = () => {
		props.copyNode(optionItemMsg)
	};

	const deleteNode = () => {
		props.deleteNode(optionItemMsg)
	};

	const onChangeAttribute = (attributeCode: string) => {
		props.onChangeAttribute(attributeCode, optionItemMsg)
	};

	const onChangeOption = (optionCode: string) => {
		props.onChangeOption(optionCode, optionItemMsg)
	};

	return (
		<div className="flex">
			<div className="flex flex-col items-center">
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
						<TreeSelect
							className="w-3/6"
							popupMatchSelectWidth={false}
							value={optionItemMsg.attribute || undefined}
							disabled={optionItemMsg.attributeIsDisabled}
							placeholder="Please select"
							treeDefaultExpandAll
							treeData={attributesTree}
							treeLine={true && { showLeafIcon: true }}
							onChange={onChangeAttribute}
						/>
					</div>
					<Divider size="small" />
					<div className="flex mt-2 w-full items-center">
						<span className="w-3/6">Available Option</span>
						<Select
							className="w-3/6"
							popupMatchSelectWidth={false}
							placeholder="Select Option"
							value={optionItemMsg.option}
							disabled={optionItemMsg.optionIsDisabled}
							options={(optionItemMsg.options || []).map((v: Record<string, any>) => ({
								value: v.code,
								label: `${v.name}`,
							}))}
							onChange={onChangeOption}
						>
						</Select>
					</div>
				</div>
				{
					!optionItemMsg._isTopLevel && <div onClick={addSiblingOptionHandler} className="flex items-center cursor-pointer mt-2 text-basicGray">
						<PlusCircleFilled style={{ color: '#918f8f' }} />
						<span className="ml-1">Add sibling option</span>
					</div>
				}
			</div>

			<div className="text-basicGray mt-3 relative flex" style={{ height: `calc(${optionItemMsg?.attributeMsg?.valueType == "IMAGE" ? imageBoxHeight : stringBoxHeight}px - 40px)` }}>
				<div className="flex absolute">
					{
						!optionItemMsg._isTopLevel && <>
							<Tooltip title="Copy" placement="top">
								<CopyOutlined className="ml-2 cursor-pointer" onClick={copyNode} />
							</Tooltip>
							<Tooltip title="Delete" placement="top">
								<Popconfirm
									title="Delete the item"
									description="Are you sure to delete this item?"
									onConfirm={deleteNode}
									okText="Yes"
									cancelText="No"
								>
									<DeleteOutlined className="ml-1 cursor-pointer" />
								</Popconfirm>
							</Tooltip>
						</>
					}
					{
						optionItemMsg.children.length > 0 && <>
							{
								!optionItemMsg._collapsed ? <Tooltip title="Fold" placement="top">
									<LeftOutlined className="ml-1 cursor-pointer" onClick={() => props.onToggleHandler(optionItemMsg.id)} />
								</Tooltip> : <Tooltip title="Unfold" placement="top">
									<RightOutlined className="ml-1 cursor-pointer" onClick={() => props.onToggleHandler(optionItemMsg.id)} />
								</Tooltip>
							}

						</>
					}
				</div>
				<div
					className="ml-2 flex items-center flex-col justify-center"
				>
					{
						(optionItemMsg.children.length > 0 && !optionItemMsg._collapsed) && <div
							className="mb-1"
							style={{ borderTop: "1px solid #ccc", height: "1px", width: "100%" }}
						>

						</div>
					}

					<div
						className="flex items-center cursor-pointer"
						onClick={addSubOptionHandler}
					>
						<PlusCircleFilled style={{ color: '#918f8f' }} />
						<span className="ml-1" style={{ width: "123px" }}>Add sub option</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default OptionItemCom;
