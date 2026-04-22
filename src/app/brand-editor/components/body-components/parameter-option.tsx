"use client";

import { useState, useEffect } from "react";
import { InfoCircleOutlined, PlusOutlined, DeleteOutlined, FileOutlined, CopyOutlined, UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { Tooltip, Button, TreeSelect, notification, Popconfirm, Empty, Input, Upload, Popover, Image as AntdImage } from 'antd';
import LoadingScreen from "@/components/loading-screen";
const { TextArea } = Input;
import {
	fetchCompanyByKeycloakUser
} from "@/services/companyService";
import {
	fetchProductAttributeVersionByAttributeNameCompanyId,
	fetchUnitAttributesByVersionId
} from "@/services/profileEditorService";
import {
	fetchAllOptionLibraryByCompany,
	createOptionLibraryByCompany,
	deleteOptionLibraryByCompany,
	fetchOptionsByProductAttrId,
	createOption,
	updateFileForProductAttrOption,
	updateOptionByOptionId,
	deleteOptionByOptionId,
	copySubOption,
	copyLibraryOption
} from "@/services/productBaseEditorService";

const LibraryOption = () => {

	const optionLibraryTooltipDom = <div>
		<div className="text-[10px] text-border text-[#000]">Option Library</div>
		<div className="text-[10px] text-[#717171]">
			Make sure you use use different names to easily differentiate option names. For example, both handle and frame have color options. Please use “Frame Color” to include color available for frame, and “Handle Color” to include color options available for handles.
			This naming convention will show on the Item Card selector.
		</div>
	</div>

	const [fullLoading, setFullLoading] = useState<boolean>(false);

	const [companyMsg, setCompanyMsg] = useState<Record<string, any>>({});
	const [unitMsg, setUnitMsg] = useState<any[]>([]);
	const [optionLibraryList, setOptionLibraryList] = useState<any[]>([]);
	const [selectedOptionLibrary, setSelectedOptionLibrary] = useState<Record<string, any>>({});
	const [options, setOptions] = useState<any[]>([]);

	const [copySubOptionName, setCopySubOptionName] = useState("");
	const [copySubOptionId, setCopySubOptionId] = useState<any>(null);

	const [copyFromLibraryOptionId, setCopyFromLibraryOptionId] = useState<any>(null);
	const [copyToLibraryOptionId, setCopyToLibraryOptionId] = useState<any>(null);

	useEffect(() => {
		initData()
	}, []);

	const initData = async () => {
		const companyRes = await fetchCompanyByKeycloakUser();
		if (companyRes.status == "success") {
			setCompanyMsg(companyRes?.data)
			const [
				unitVersion,
				optionLibraryRes
			] = await Promise.all([
				fetchProductAttributeVersionByAttributeNameCompanyId(
					"UNIT Attribute Tree",
					companyRes?.data.id
				),
				fetchAllOptionLibraryByCompany(companyRes?.data.id)
			]);
			if (unitVersion?.status == "success" && Array.isArray(unitVersion?.data) && unitVersion?.data.length != 0) {
				const [
					unitAttributes
				] = await Promise.all([
					fetchUnitAttributesByVersionId(unitVersion?.data[0]?.id)
				]);
				if (unitAttributes?.status == "success") {
					let unitTreeData = initUnitMsg([unitAttributes?.data])
					setUnitMsg(unitTreeData);
				}

			}
			if (optionLibraryRes?.status == "success") {
				setOptionLibraryList(optionLibraryRes?.data)
			}
		}
	};

	const initUnitMsg = (unitMsg: any[]): any[] => {
		if (!unitMsg || unitMsg.length === 0) return [];

		return unitMsg.map((node) => {
			const newNode = { ...node }; // 克隆节点，避免修改原对象

			// 设置 value
			newNode.value = newNode.key;

			// 设置 disabled
			newNode.disabled = false;
			newNode.icon = newNode.children?.length ? undefined : <FileOutlined />
			if (
				(newNode.code && newNode.code == "unit$profile") ||
				(newNode.code && newNode.code == "unit$product") ||
				(newNode.code && newNode.code == "unit$product_type") ||
				(newNode.code && newNode.code == "unit$operability") ||
				(newNode.valueType != "STRING" && newNode.valueType != "IMAGE") ||
				newNode.is_set_option_library
			) {
				newNode.disabled = true;
			}

			// 递归 children
			if (newNode.children && newNode.children.length > 0) {
				newNode.children = initUnitMsg(newNode.children);
			}

			return newNode;
		});
	};

	const onSelectUnitAttr = async (value: any, $index: any) => {
		const res = await createOptionLibraryByCompany(value)
		if (res.status == "success") {
			notification.success({
				message: "Success",
				description: "Added successfully"
			});
			const [
				unitAttributes,
				optionLibraryRes
			] = await Promise.all([
				fetchUnitAttributesByVersionId(unitMsg[0]?.children[0]?.version_id),
				fetchAllOptionLibraryByCompany(companyMsg?.id)
			]);
			if (unitAttributes?.status == "success") {
				let unitTreeData = initUnitMsg([unitAttributes?.data])
				setUnitMsg([...unitTreeData]);
			}
			if (optionLibraryRes?.status == "success") {
				setOptionLibraryList([...optionLibraryRes?.data])
			}
		} else {
			notification.error({
				message: "Error",
				description: res?.data?.response?.data?.detail || "Add failed."
			});
		}
	};

	const onAddOptionLibrary = () => {
		optionLibraryList.push({
			isAdd: true
		})
		setOptionLibraryList([...optionLibraryList])
	};

	const onDeleteOptionLibrary = async (optionLibrary: any, $index: any, type: any) => {
		if (type == "add") {
			optionLibraryList.splice($index, 1)
			setOptionLibraryList([...optionLibraryList])
			return
		}
		const res = await deleteOptionLibraryByCompany(optionLibrary.id)
		if (res.status == "success") {
			notification.success({
				message: "Success",
				description: "Delete successfully"
			});
			const [
				unitAttributes,
				optionLibraryRes
			] = await Promise.all([
				fetchUnitAttributesByVersionId(unitMsg[0]?.children[0]?.version_id),
				fetchAllOptionLibraryByCompany(companyMsg?.id)
			]);
			if (unitAttributes?.status == "success") {
				let unitTreeData = initUnitMsg([unitAttributes?.data])
				setUnitMsg([...unitTreeData]);
			}
			if (optionLibraryRes?.status == "success") {
				setOptionLibraryList([...optionLibraryRes?.data])
			}
			if (optionLibrary.id == selectedOptionLibrary.id) {
				setSelectedOptionLibrary({})
				setOptions([])
			}
		} else {
			notification.error({
				message: "Error",
				description: res?.data?.response?.data?.detail || "Delete failed."
			});
		}
	};

	const onSelectOptionLibrary = (optionLibrary: any) => {
		if (optionLibrary?.id !== selectedOptionLibrary?.id) {
			setSelectedOptionLibrary({ ...optionLibrary })
			getOptions(optionLibrary?.id)
		}
	};

	const getOptions = async (productAttributeId: number) => {
		const optionsRes = await fetchOptionsByProductAttrId(productAttributeId);
		if (optionsRes.status === "success") {
			const tempData = optionsRes?.data || [];

			tempData.forEach((item: any) => {
				if (!item?.other_msg) {
					// 如果没有 other_msg，直接赋空对象
					item.other_msg = {};
				} else {
					try {
						item.other_msg = JSON.parse(item.other_msg);
					} catch (err) {
						// 解析失败，也赋空对象
						item.other_msg = {};
					}
				}
			});

			setOptions([...tempData]);
		}
	};


	const onAddOption = async (optionMsg: any, $index: any) => {
		let params = {
			product_attributes_id: selectedOptionLibrary.id,
			company_id: companyMsg.id,
			code: optionMsg.code,
			name: optionMsg.name,
			detail: optionMsg.detail || "",
			description: optionMsg.description || "",
			other_msg: optionMsg.other_msg || ""
		}
		const optionsRes = await createOption(params)
		if (optionsRes.status == "success" && optionsRes?.data && optionsRes?.data?.id) {
			notification.success({
				message: "Success",
				description: "Add successfully"
			});
			let item = optionsRes?.data

			if (!item?.other_msg) {
				// 如果没有 other_msg，直接赋空对象
				item.other_msg = {};
			} else {
				try {
					item.other_msg = JSON.parse(item.other_msg);
				} catch (err) {
					// 解析失败，也赋空对象
					item.other_msg = {};
				}
			}


			options[$index] = item
			setOptions([...options])
		} else {
			notification.error({
				message: "Error",
				description: optionsRes?.data?.response?.data?.detail || "Add failed."
			});
		}
	};

	const onEditOption = async (optionMsg: any, $index: any) => {
		let params = {
			name: optionMsg.name,
			detail: optionMsg.detail || "",
			description: optionMsg.description || "",
			other_msg: optionMsg.other_msg || ""
		}
		const optionsRes = await updateOptionByOptionId(optionMsg?.id, params)
		if (optionsRes.status == "success" && optionsRes?.data && optionsRes?.data?.id) {
			notification.success({
				message: "Success",
				description: "Edit successfully"
			});
			let item = optionsRes?.data
			if (!item?.other_msg) {
				// 如果没有 other_msg，直接赋空对象
				item.other_msg = {};
			} else {
				try {
					item.other_msg = JSON.parse(item.other_msg);
				} catch (err) {
					// 解析失败，也赋空对象
					item.other_msg = {};
				}
			}


			options[$index] = item
			setOptions([...options])
		} else {
			notification.error({
				message: "Error",
				description: optionsRes?.data?.response?.data?.detail || "Edit failed."
			});
		}
	};

	const onAddSubOption = () => {
		options.push({
			isAdd: true,
			other_msg: {}
		})
		setOptions([...options])
	};

	const onChangeSubOption = (value: any, $key: any, option: any, $index: any) => {
		options[$index][$key] = value
		setOptions([...options])
	};

	const nameToCode = (name: string): string => {
		if (typeof name !== "string") {
			throw new Error("Input must be a string");
		}

		// 1. 转小写
		let code = name.toLowerCase();

		// 2. 非字母数字 → 替换为下划线
		code = code.replace(/[^a-z0-9]/g, "_");

		// 3. 连续下划线合并
		code = code.replace(/_+/g, "_");

		// 4. 去掉首尾下划线
		code = code.replace(/^_+|_+$/g, "");

		return code;
	};

	const onBlurSubOption = (optionMsg: any, $index: any) => {
		let option = JSON.parse(JSON.stringify(optionMsg))
		if (!option?.name) {
			return
		}
		if (option?.isAdd) {
			option.code = nameToCode(option?.name)
			if (option.other_msg) {
				option.other_msg = JSON.stringify(option.other_msg)
			}
			onAddOption(option, $index)
		} else {
			if (!option?.code) {
				return
			}
			if (option.other_msg) {
				option.other_msg = JSON.stringify(option.other_msg)
			}
			onEditOption(option, $index)
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

	const uploadFile = async (file: any, option: any, $index: any) => {
		setFullLoading(true)
		const res = await updateFileForProductAttrOption(selectedOptionLibrary.id, file);
		setFullLoading(false)
		if (res.status == "success") {
			let other_msg = options[$index]["other_msg"]
			other_msg["file_key"] = res?.data?.code
			other_msg["file_url"] = res?.data?.file_url
			options[$index]["other_msg"] = other_msg
			notification.success({
				message: "Success",
				description: "Upload successfully"
			});
			if (!options[$index]?.isAdd) {
				onBlurSubOption(options[$index], $index)
			} else {
				setOptions([...options])
			}

		} else {
			notification.error({
				message: "Error",
				description: "Failed to upload file"
			});
		}
	};

	const onDeleteSubOption = async (option: any, $index: any) => {
		if (option?.isAdd) {
			options.splice($index, 1)
			setOptions([...options])
			notification.success({
				message: "Success",
				description: "Delete successfully"
			});
			return
		}
		const res = await deleteOptionByOptionId(option?.id)
		if (res.status == "success") {
			options.splice($index, 1)
			setOptions([...options])
			notification.success({
				message: "Success",
				description: "Delete successfully"
			});
		} else {
			notification.error({
				message: "Error",
				description: res?.data?.response?.data?.detail || "Delete failed."
			});
		}
	};

	const onCopySubOption = async (option: any) => {
		if (!copySubOptionName) {
			notification.warning({
				message: "Warning",
				description: "Name cannot be null"
			});
			return
		}
		const res = await copySubOption(option?.id, copySubOptionName)
		if (res.status == "success" && res?.data?.id) {
			let item = res?.data

			if (!item?.other_msg) {
				// 如果没有 other_msg，直接赋空对象
				item.other_msg = {};
			} else {
				try {
					item.other_msg = JSON.parse(item.other_msg);
				} catch (err) {
					// 解析失败，也赋空对象
					item.other_msg = {};
				}
			}
			options.push(item)
			setOptions([...options])
			notification.success({
				message: "Success",
				description: "Copy successfully"
			});
		} else {
			notification.error({
				message: "Error",
				description: res?.data?.response?.data?.detail || "Copy failed."
			});
		}
	};

	const onCopyLibrary = async (fromLibraryOption: any) => {
		if (!copyToLibraryOptionId) {
			notification.warning({
				message: "Warning",
				description: "Select an attribute to paste into"
			});
			return
		}
		const res = await copyLibraryOption(fromLibraryOption?.id, copyToLibraryOptionId)
		if (res.status == "success" && res?.data) {
			const [
				unitAttributes,
				optionLibraryRes
			] = await Promise.all([
				fetchUnitAttributesByVersionId(unitMsg[0]?.children[0]?.version_id),
				fetchAllOptionLibraryByCompany(companyMsg?.id)
			]);
			if (unitAttributes?.status == "success") {
				let unitTreeData = initUnitMsg([unitAttributes?.data])
				setUnitMsg([...unitTreeData]);
			}
			if (optionLibraryRes?.status == "success") {
				setOptionLibraryList([...optionLibraryRes?.data])
			}
			notification.success({
				message: "Success",
				description: "Copy successfully"
			});
		} else {
			notification.error({
				message: "Error",
				description: res?.data?.response?.data?.detail || "Copy failed."
			});
		}
	};

	return (
		<div className="flex text-[12px] h-[calc(100vh-200px)] pr-4">
			<div
				className="w-[300px] overflow-y-auto border-r border-r-[#EBEDF0] pr-5"
			>
				<div className="text-[#717171] flex items-center">
					<div style={{ lineHeight: "22px" }}>Option Library</div>
					<Tooltip
						placement="rightTop"
						title={optionLibraryTooltipDom}
						color="#fff"
						styles={{
							root: {
								minWidth: 400,
								maxWidth: 400,
								fontSize: 10
							}
						}}
					>
						<InfoCircleOutlined className="ml-2 cursor-pointer" />
					</Tooltip>
				</div>
				<div className="text-center mt-5">
					{
						optionLibraryList && optionLibraryList.map((item: any, index: any) => {
							let isSelected = item.id === selectedOptionLibrary.id;
							const selectedStyle = isSelected
								? {
									background: "#E3EBF8"
								}
								: {

								}
							const open = copyFromLibraryOptionId === item.id;
							return (
								(item.isAdd && !item.id)
									? <div
										key={index}
										className="
											group
											w-full
											flex
											p-2
											pt-3
											pb-3
											border-b
											border-b-[#EBEDF0]
											items-center
											justify-between
											hover:bg-[#E3EBF8]
											transition-colors
											rounded-md
											cursor-pointer
										"
									>
										{
											<TreeSelect
												style={{ width: '100%', textAlign: "left" }}
												styles={{
													popup: { root: { maxHeight: 500, minWidth: 500, overflow: 'auto' } },
												}}
												placeholder="Please select"
												treeDefaultExpandAll
												treeData={unitMsg}
												treeLine={true}
												treeIcon={true}
												value={item?.key}
												onChange={(value) => { onSelectUnitAttr(value, index) }}
											/>
										}
										<div className='ml-6'>
											<DeleteOutlined onClick={() => onDeleteOptionLibrary(item, index, "add")} className="text-[#B1B1B1] hover:text-[#FF4D4F]" />
										</div>
									</div>
									: <div
										key={index}
										className="
											group
											w-full
											flex
											p-2
											pt-3
											pb-3
											border-b
											border-b-[#EBEDF0]
											items-center
											justify-between
											hover:bg-[#E3EBF8]
											transition-colors
											rounded-md
											cursor-pointer
										"
										onClick={() => onSelectOptionLibrary(item)}
										style={selectedStyle}
									>
										<div
											className="
												text-[#000]
												group-hover:text-[#427CCE]
												pl-6
											"
										>
											{item?.name}
										</div>
										<div
											className="
												ml-6
												flex
												gap-4
												opacity-0
												group-hover:opacity-100
												transition-opacity
												duration-200
												pointer-events-none
												group-hover:pointer-events-auto
											"
										>
											<Popover
												zIndex={10}
												content={
													<div className="w-[200px]" onClick={(e) => { e.stopPropagation(); }}>
														<TreeSelect
															style={{ width: '100%', textAlign: "left" }}
															styles={{
																popup: { root: { maxHeight: 500, minWidth: 500, overflow: 'auto' } },
															}}
															placeholder="Please select"
															treeDefaultExpandAll
															treeData={unitMsg}
															treeLine={true}
															treeIcon={true}
															value={copyToLibraryOptionId ? copyToLibraryOptionId.toString() : null}
															onChange={(value) => { setCopyToLibraryOptionId(value) }}
														/>
														<div className="flex justify-end gap-2 mt-2">
															<Button
																size="small"
																onClick={(e) => {
																	e.stopPropagation();
																	setCopyFromLibraryOptionId(null)
																}}
															>
																Cancel
															</Button>
															<Button
																size="small"
																type="primary"
																onClick={(e) => {
																	e.stopPropagation();
																	setCopyFromLibraryOptionId(null);
																	onCopyLibrary(item)
																}}
															>
																Confirm
															</Button>
														</div>
													</div>
												}
												open={open}
												trigger="click"
												placement="bottom"
												onOpenChange={(v: any) => {
													setCopyToLibraryOptionId(null)
													setCopyFromLibraryOptionId(v ? item.id : null);
												}}
											>
												<CopyOutlined
													className="text-[#B1B1B1] hover:text-[#595959] cursor-pointer"
													onClick={(e) => {
														e.stopPropagation();
													}}
												/>
											</Popover>
											<Popconfirm
												title="Delete the option library"
												description="Are you sure to delete this option library?"
												onConfirm={() => onDeleteOptionLibrary(item, index, 'edit')}
												onCancel={() => { }}
												okText="Yes"
												cancelText="No"
											>
												<DeleteOutlined onClick={(e) => { e.stopPropagation() }} className="text-[#B1B1B1] hover:text-[#FF4D4F]" />
											</Popconfirm>
										</div>
									</div>
							)
						})
					}
					<Button
						className='mt-2'
						size='small'
						type="primary"
						shape="circle"
						icon={<PlusOutlined />}
						onClick={onAddOptionLibrary}
					/>
				</div>
			</div>
			<div
				className="flex-1 overflow-y-auto pl-6"
			>
				<div>Sub-Options</div>
				{
					!selectedOptionLibrary?.id && <div className="h-[calc(100%-100px)] flex items-center justify-center">
						<Empty description="Please select option library" />
					</div>
				}
				{
					(selectedOptionLibrary?.id && options.length == 0) && <div
						className="flex h-[calc(100%-100px)] items-center justify-center mt-6"
					>
						<Empty>
							<Button
								type="primary"
								onClick={onAddSubOption}
							>
								Add
							</Button>
						</Empty>
					</div>
				}
				{
					(selectedOptionLibrary?.id && options.length != 0) && <div className="mt-4 text-[12px] flex gap-6 flex-wrap">
						{
							options.map((item: any, index: any) => {
								const open = copySubOptionId === item.id;
								return (
									<div className="flex items-center" key={index}>
										<div
											className="border border-[#E8E8E8] w-[370px] rounded-lg"
										>
											<div
												className="border-b border-b-[#E8E8E8] pl-4 pr-4 pt-4 pb-4 flex items-center"
											>
												<div className="bg-[#F8F8F8] text-[#717171] rounded-md w-[22px] h-[22px] flex items-center justify-center">{index + 1}</div>
												<div className="ml-2 w-[300px]">
													<Input
														placeholder="Please input"
														value={item.name ?? ""}
														onChange={(e) => { onChangeSubOption(e?.target?.value, "name", item, index) }}
														onBlur={() => { onBlurSubOption(item, index) }}
													/>
												</div>
												<div className="ml-4 flex">
													{
														!item?.isAdd && <Popover
															content={
																<div className="w-[200px]">
																	<Input
																		size="small"
																		placeholder="Please input name"
																		value={copySubOptionName}
																		onChange={(e) => setCopySubOptionName(e.target.value)}
																	/>
																	<div className="flex justify-end gap-2 mt-2">
																		<Button
																			size="small"
																			onClick={(e) => {
																				e.stopPropagation();
																				setCopySubOptionId(null)
																			}}
																		>
																			Cancel
																		</Button>
																		<Button
																			size="small"
																			type="primary"
																			onClick={(e) => {
																				e.stopPropagation();
																				setCopySubOptionId(null);
																				onCopySubOption(item)
																			}}
																		>
																			Confirm
																		</Button>
																	</div>
																</div>
															}
															open={open}
															trigger="click"
															placement="bottom"
															onOpenChange={(v: any) => {
																setCopySubOptionName("")
																setCopySubOptionId(v ? item.id : null);
															}}
														>
															<CopyOutlined
																className="text-[#B1B1B1] hover:text-[#595959] cursor-pointer mr-2"
																onClick={(e) => {
																	e.stopPropagation();
																}}
															/>
														</Popover>
													}
													{
														item?.isAdd
															? <DeleteOutlined onClick={(e) => { e.stopPropagation(); onDeleteSubOption(item, index) }} className="text-[#B1B1B1] hover:text-[#FF4D4F]" />
															: <Popconfirm
																title="Delete the sub-option"
																description="Are you sure to delete this sub-option?"
																onConfirm={() => { onDeleteSubOption(item, index) }}
																onCancel={() => { }}
																okText="Yes"
																cancelText="No"
															>
																<DeleteOutlined onClick={(e) => { e.stopPropagation() }} className="text-[#B1B1B1] hover:text-[#FF4D4F]" />
															</Popconfirm>
													}

												</div>
											</div>
											<div
												className="pl-4 pr-4 pt-4 pb-4"
											>
												<div className="">
													<div className="text-[#717171]">Description</div>
													<div className="mt-1">
														<TextArea
															placeholder="Input a recognizable name for you."
															rows={1}
															style={{
																resize: "none"
															}}
															value={item.description ?? ""}
															onChange={(e) => { onChangeSubOption(e?.target?.value, "description", item, index) }}
															onBlur={() => { onBlurSubOption(item, index) }}
														/>
													</div>
												</div>
												<div className="mt-4 flex">
													<div className="w-[110px] flex flex-col items-center">
														<div className="text-[#717171]">Image Reference</div>
														{
															(!item?.other_msg?.file_key) && <div
																className="w-[95px] h-[95px] rounded-md border border-dashed border-[#E8E8E8] mt-1 flex items-center justify-center cursor-pointer"
															>
																<Upload
																	showUploadList={false}
																	beforeUpload={beforeUpload}
																	customRequest={({ file }) => { uploadFile(file, item, index) }}
																>
																	<div className="text-[#717171] text-[10px] relative bottom-1">
																		<span>Click to</span>
																		<span className="text-[#427CCE] ml-1">upload</span>
																	</div>
																</Upload>
															</div>
														}
														{item?.other_msg?.file_key && (
															<div className="w-[95px] h-[95px] mx-auto rounded-md border border-dashed border-[#E8E8E8] overflow-hidden flex items-center justify-center bg-[#fafafa]">
																<AntdImage
																	src={item?.other_msg?.file_url}
																	className="block"
																	style={{
																		maxWidth: "100%",
																		maxHeight: "100%",
																		objectFit: "contain",
																		margin: "auto",
																	}}
																	preview={{
																		mask: (
																			<div
																				className="flex items-center justify-center gap-3 text-white"
																			>
																				<div onClick={(e)=>{e.stopPropagation()}}>
																					<Upload
																						showUploadList={false}
																						beforeUpload={beforeUpload}
																						customRequest={({ file }) => uploadFile(file, item, index)}
																					>
																						<UploadOutlined
																							className="text-white text-[16px] cursor-pointer hover:text-[#427cce]"
																						/>
																					</Upload>
																				</div>
																				<EyeOutlined
																					className="text-[16px] cursor-pointer hover:text-[#427cce]"
																				/>
																			</div>
																		),
																		maskClassName: "rounded-md",
																	}}
																/>
															</div>
														)}
													</div>
													<div className="ml-2 flex-1">
														<div className="text-[#717171]">Hint Text</div>
														<div className="mt-1">
															<TextArea
																placeholder="Input a recognizable name for you."
																style={{
																	height: 95,
																	resize: "none",
																	overflowY: "auto",
																}}
																value={item.detail ?? ""}
																onChange={(e) => { onChangeSubOption(e?.target?.value, "detail", item, index) }}
																onBlur={() => { onBlurSubOption(item, index) }}
															/>
														</div>
													</div>
												</div>
											</div>
										</div>
										{
											(index == options.length - 1) && <Button
												className='ml-3'
												size='small'
												type="primary"
												shape="circle"
												icon={<PlusOutlined />}
												onClick={onAddSubOption}
											/>
										}
									</div>
								)
							})
						}
					</div>
				}
			</div>
			<LoadingScreen isLoading={fullLoading}></LoadingScreen>
		</div>
	);
};

export default LibraryOption;
