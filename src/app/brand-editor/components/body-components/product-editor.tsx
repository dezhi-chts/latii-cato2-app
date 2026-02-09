"use client";

import { useState, useEffect } from "react";
import { Select, Tooltip, Button, InputNumber, Popover, TreeSelect, notification, Input } from "antd";
import { InfoCircleOutlined, EyeOutlined, PlusOutlined, FileOutlined, DeleteOutlined } from '@ant-design/icons';
import {
	fetchProductTypesLibrary,
	fetchOperabilityLibrary,
	createProfile,
	updateProfile,
	deleteProfile,
	fetchAllProfileByCompanyId,
	createOption
} from "@/services/productBaseEditorService";
import {
	fetchCompanyByKeycloakUser
} from "@/services/companyService";
import {
	fetchProfileMsgByVersionId,
	fetchProjectAttributesWithOptionsByVersionId,
	fetchQuoteAttributesWithOptionsByVersionId,
	fetchItemAttributesWithOptionsByVersionId,
	fetchUnitAttributesWithOptionsByVersionId,
	baseCheckProfileScript,
	saveProfileScript
} from "@/services/profileEditorService";
import {
	OptionMsgVO
} from "@/app/brand-editor/components/body-components/validators";
import {
	generateOptionMsgFromProfileScript,
	processUnitAttributeTree,
	addSubOption,
	addSiblingOption,
	updateOption,
	getAttributeMsgByAttribute,
	getOptionsByAttributeCode,
	getOptionMsgByOption,
	deleteItem,
	copyItem,
	generateProfileScriptFromProfileOptionMsg,
	findProductTypeWithParent,
	pickProductProductTypeOpen,
	findTopLevelBySection,
	deepCopyWithNewId,
	collectOptionLibraryNodes,
	markLastNodeAtEachLevel,
	getallProductTypeOperabilityMaxMinDataByRuleScript,
	collectOptionCodes
} from "@/app/brand-editor/components/body-components/logics";
import OptionTreeNodeCom from "@/app/brand-editor/components/body-components/option-tree-node";

const ProductEditor = () => {

	const sectionsTooltipDom = <div>
		<div className="text-[10px] text-border text-[#000]">Sections</div>
		<div className="text-[10px] text-[#717171]">
			A section will create a block of content in the item card. Options under the section will be displayed as different lines in dependency order as stablished in the tree.
		</div>
	</div>

	const [fullLoading, setFullLoading] = useState<boolean>(false);

	const [companyMsg, setCompanyMsg] = useState<Record<string, any>>({});

	const [allProfile, setAllProfile] = useState<any>([]);
	const [selectedProfile, setSelectedProfile] = useState<Record<string, any>>({});
	const [allProductType, setAllProductType] = useState<any>([]);
	const [selectedProductType, setSelectedProductType] = useState<Record<string, any>>({});
	const [allOpen, setAllOpen] = useState<any>([]);
	const [selectedOpen, setSelectedOpen] = useState<Record<string, any>>({});

	const [allSection, setAllSection] = useState<any>([]);
	const [selectedSection, setSelectedSection] = useState<Record<string, any>>({});

	const [projectMsg, setProjectMsg] = useState<Record<string, any>>({});
	const [quoteMsg, setQuoteMsg] = useState<Record<string, any>>({});
	const [itemMsg, setItemMsg] = useState<Record<string, any>>({});
	const [unitMsg, setUnitMsg] = useState<Record<string, any>>({});
	const [unitTreeData, setUnitTreeData] = useState<any[]>([]);
	const [unitAttributesTree, setUnitAttributesTree] = useState<any[]>([]);
	const [profileOptionMsg, setProfileOptionMsg] = useState<OptionMsgVO>({
		id: "",
		attribute: null,
		attributeMsg: {},
		attributeIsDisabled: false,
		option: null,
		optionMsg: {},
		options: [],
		have_sections: [],
		belong_section: "",
		optionIsDisabled: false,
		children: [],
		_collapsed: false,
		_isTopLevel: true
	});
	const [sectionTreeData, setSectionTreeData] = useState<OptionMsgVO[]>([]);
	const [setedOptionLibraryList, setSetedOptionLibraryList] = useState<any[]>([]);
	const [allProductTypeOperabilityMaxMinData, setAllProductTypeOperabilityMaxMinData] = useState<Record<string, any>[]>([]);
	const [selectProductTypeOperabilityMaxMinData, setSelectProductTypeOperabilityMaxMinData] = useState<Record<string, any>>({});

	useEffect(() => {
		initAllData()
	}, []);

	const initAllData = async () => {
		const companyRes = await fetchCompanyByKeycloakUser();
		if (companyRes.status == "success") {
			setCompanyMsg(companyRes?.data)
			const profileRes = await fetchAllProfileByCompanyId(
				companyRes?.data?.id
			)
			if (profileRes.status == "success") {
				setAllProfile(profileRes?.data)
			}
		}
	};

	const getAttribute = async (selectedProfile: any) => {
		setFullLoading(false)
		const [
			projectAttributesWithOptions,
			quoteAttributesWithOptions,
			itemAttributesWithOptions,
			unitAttributesWithOptions
		] = await Promise.all([
			fetchProjectAttributesWithOptionsByVersionId(selectedProfile?.project_version_id),
			fetchQuoteAttributesWithOptionsByVersionId(selectedProfile?.quote_version_id),
			fetchItemAttributesWithOptionsByVersionId(selectedProfile?.item_version_id),
			fetchUnitAttributesWithOptionsByVersionId(selectedProfile?.unit_version_id)
		]);
		setFullLoading(false)
		setProjectMsg(projectAttributesWithOptions?.data);
		setQuoteMsg(quoteAttributesWithOptions?.data);
		setItemMsg(itemAttributesWithOptions?.data);
		setUnitMsg(unitAttributesWithOptions?.data);

		generateOptionMsg(selectedProfile, unitAttributesWithOptions?.data)
	};

	const generateOptionMsg = (profileMsg: Record<string, any>, unitMsg: Record<string, any>) => {
		let unitAttributesTreeMsg = processUnitAttributeTree(unitMsg?.attribute_tree)
		setUnitAttributesTree([unitAttributesTreeMsg])

		let setedOptionLibraryList = collectOptionLibraryNodes(unitMsg?.attribute_tree);
		setSetedOptionLibraryList([...setedOptionLibraryList])

		let profileOptionMsg = generateOptionMsgFromProfileScript(profileMsg, unitMsg?.attribute_tree);
		setProfileOptionMsg(profileOptionMsg)
		const allProductType = findProductTypeWithParent(profileOptionMsg)
		setAllProductType(allProductType)

		let unitTreeData = initUnitMsg([unitMsg?.attribute_tree])
		setUnitTreeData(unitTreeData);
	};

	const initUnitMsg = (unitMsg: any[]): any[] => {
		if (!unitMsg || unitMsg.length === 0) return [];

		return unitMsg.map((node) => {
			const newNode = { ...node }; // 克隆节点，避免修改原对象

			// 设置 value
			newNode.value = newNode.code;

			// 设置 disabled
			newNode.disabled = false;
			newNode.icon = newNode.children?.length ? undefined : <FileOutlined />
			if (
				(newNode.code && newNode.code == "unit$profile") ||
				(newNode.code && newNode.code == "unit$product") ||
				(newNode.code && newNode.code == "unit$product_type") ||
				(newNode.code && newNode.code == "unit$operability") ||
				(newNode.valueType != "STRUCT")
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

	const onChangeProfile = (profileValue: string) => {
		const targetProfile = allProfile.find(
			(item: any) => item.profile_code === profileValue
		);

		if (!targetProfile) return;

		setAllOpen([])
		setAllSection([])
		setSelectedProductType({})
		setSelectedOpen({})
		setSelectProductTypeOperabilityMaxMinData({})
		setSelectedSection({})
		setSelectedProfile(targetProfile);
		let allProductTypeOperabilityMaxMinData = getallProductTypeOperabilityMaxMinDataByRuleScript(targetProfile)
		setAllProductTypeOperabilityMaxMinData(allProductTypeOperabilityMaxMinData)
		getAttribute(targetProfile)

	};

	const onChangeProductType = (value: string) => {
		const targetOption = allProductType.find(
			(item: any) => item.option === value
		);

		if (!targetOption) return;
		setAllOpen(targetOption.children)
		setAllSection([])
		setSelectedOpen({})
		setSelectProductTypeOperabilityMaxMinData({})
		setSelectedSection({})
		setSelectedProductType(targetOption);
	};

	const onChangeOpen = (value: string) => {
		const targetOption = allOpen.find(
			(item: any) => item.option === value
		);

		if (!targetOption) return;

		if (targetOption.have_sections && targetOption.have_sections.length != 0) {
			let tempArr: any = []
			targetOption.have_sections.forEach((item: any) => {
				let attributeMsg = getAttributeMsgByAttribute(item, unitMsg?.attribute_tree)
				tempArr.push(attributeMsg)
			})
			setAllSection(tempArr)
		} else {
			setAllSection([])
		}
		setSelectedSection({})
		setSelectedOpen(targetOption);

		let tempSelectProductTypeOperabilityMaxMinData = {}
		const optionsList = collectOptionCodes([unitMsg?.attribute_tree]);
		allProductTypeOperabilityMaxMinData.forEach((item) => {

			const matchedProfileAttr = optionsList.find(
				(o: Record<string, any>) =>
					o.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() ===
					item.profile.split(".")[1]
			);
			let profileCode = matchedProfileAttr ? matchedProfileAttr.option.code : null;

			const matchedProductAttr = optionsList.find(
				(o: Record<string, any>) =>
					o.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() ===
					item.product.split(".")[1]
			);
			let productCode = matchedProductAttr ? matchedProductAttr.option.code : null;

			const matchedProductTypeAttr = optionsList.find(
				(o: Record<string, any>) =>
					o.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() ===
					item.product_type.split(".")[1]
			);
			let productTypeCode = matchedProductTypeAttr ? matchedProductTypeAttr.option.code : null;

			const matchedOperabilityAttr = optionsList.find(
				(o: Record<string, any>) =>
					o.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() ===
					item.operability.split(".")[1]
			);
			let operabilityCode = matchedOperabilityAttr ? matchedOperabilityAttr.option.code : null;

			if (
				selectedProfile.profile_code == profileCode &&
				selectedProductType.parent.option == productCode &&
				selectedProductType.option == productTypeCode &&
				targetOption.option == operabilityCode
			) {
				tempSelectProductTypeOperabilityMaxMinData = item
			}
		})
		setSelectProductTypeOperabilityMaxMinData(tempSelectProductTypeOperabilityMaxMinData)
	};

	const onAddSection = () => {
		allSection.push({
			isAdd: true
		})
		setAllSection([...allSection])
	};

	const onChangeSection = (value: any, index: number, sectionMsg: any) => {
		let attributeMsg = getAttributeMsgByAttribute(value, unitMsg?.attribute_tree)
		allSection[index] = attributeMsg
		setAllSection([...allSection])

		let tempSelectedOpen: any = JSON.parse(JSON.stringify(selectedOpen))
		tempSelectedOpen.have_sections = []
		allSection.forEach((item: any) => {
			if (item.code) {
				tempSelectedOpen.have_sections.push(item.code)
			}
		})
		let newProfileOptionMsg = updateOption(tempSelectedOpen, profileOptionMsg)
		onSaveScript(newProfileOptionMsg)
	};

	const onDeleteSection = (sectionMsg: any, index: number) => {

		if (sectionMsg.isAdd) {
			allSection.splice(index, 1)
			setAllSection([...allSection])
		} else {
			allSection.splice(index, 1)
			setAllSection([...allSection])

			if (sectionMsg.code == selectedSection.code) {
				setSelectedSection({})
			}

			let tempSelectedOpen: any = JSON.parse(JSON.stringify(selectedOpen))
			tempSelectedOpen.have_sections = []
			allSection.forEach((item: any) => {
				if (item.code) {
					tempSelectedOpen.have_sections.push(item.code)
				}
			})

			let selectedOpenChildren: any = []
			tempSelectedOpen.children.forEach((item: any) => {
				if (tempSelectedOpen.have_sections.includes(item.belong_section)) {
					selectedOpenChildren.push(item)
				}
			})
			tempSelectedOpen.children = selectedOpenChildren

			let newProfileOptionMsg = updateOption(tempSelectedOpen, profileOptionMsg)
			onSaveScript(newProfileOptionMsg)
		}
	};

	const onSaveScript = async (profileOptionMsg: OptionMsgVO, isBaseCheck: boolean = false) => {

		allProductTypeOperabilityMaxMinData.forEach((item) => {
			if (
				item.profile == selectProductTypeOperabilityMaxMinData.profile &&
				item.product == selectProductTypeOperabilityMaxMinData.product &&
				item.product_type == selectProductTypeOperabilityMaxMinData.product_type &&
				item.operability == selectProductTypeOperabilityMaxMinData.operability
			) {
				item["maxWidth"] = selectProductTypeOperabilityMaxMinData.maxWidth
				item["minWidth"] = selectProductTypeOperabilityMaxMinData.minWidth
				item["maxHeight"] = selectProductTypeOperabilityMaxMinData.maxHeight
				item["minHeight"] = selectProductTypeOperabilityMaxMinData.minHeight
				item["maxWeight"] = selectProductTypeOperabilityMaxMinData.maxWeight
				item["minWeight"] = selectProductTypeOperabilityMaxMinData.minWeight
			}
		})

		let scriptMsg: string = generateProfileScriptFromProfileOptionMsg(
			projectMsg?.attribute_tree,
			quoteMsg?.attribute_tree,
			itemMsg?.attribute_tree,
			unitMsg?.attribute_tree,
			profileOptionMsg,
			allProductTypeOperabilityMaxMinData
		);
		setFullLoading(false)
		if (isBaseCheck) {
			let checkReturnMsg: Record<string, any> = await baseCheckProfileScript(scriptMsg);
			if (checkReturnMsg.status != "success") {
				setFullLoading(false)
				notification.error({
					message: "Error",
					description: checkReturnMsg?.data?.response?.data?.detail || "Base check failed."
				});
				return
			}
		}

		let saveReturnMsg: Record<string, any> = await saveProfileScript(selectedProfile.id, scriptMsg);

		if (saveReturnMsg.status == "success") {
			setFullLoading(false)
			notification.success({
				message: "Success",
				description: "Edit successfully.",
			});
			allProfile.forEach((item: any, index: any) => {
				if (item.id == saveReturnMsg?.data.id) {
					allProfile[index] = saveReturnMsg?.data
				}
			})
			setAllProfile([...allProfile])
			setSelectedProfile({ ...saveReturnMsg?.data })
			let allProductTypeOperabilityMaxMinData = getallProductTypeOperabilityMaxMinDataByRuleScript({ ...saveReturnMsg?.data })
			setAllProductTypeOperabilityMaxMinData(allProductTypeOperabilityMaxMinData)
			let profileOptionMsg = generateOptionMsgFromProfileScript(saveReturnMsg?.data, unitMsg?.attribute_tree);
			setProfileOptionMsg(profileOptionMsg)
			const allProductType = findProductTypeWithParent(profileOptionMsg)
			setAllProductType([...allProductType])
			if (selectedProductType?.option) {
				allProductType && allProductType.length != 0 && allProductType.forEach((item: any) => {
					if (item.option == selectedProductType.option) {
						setSelectedProductType({ ...item })
						setAllOpen([...item.children])
						if (selectedOpen?.option) {
							item.children.forEach((item2: any) => {
								if (item2?.option == selectedOpen?.option) {
									setSelectedOpen({ ...item2 })

									let tempSelectProductTypeOperabilityMaxMinData = {}
									const optionsList = collectOptionCodes([unitMsg?.attribute_tree]);
									allProductTypeOperabilityMaxMinData.forEach((s) => {

										const matchedProfileAttr = optionsList.find(
											(o: Record<string, any>) =>
												o.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() ===
												s.profile.split(".")[1]
										);
										let profileCode = matchedProfileAttr ? matchedProfileAttr.option.code : null;

										const matchedProductAttr = optionsList.find(
											(o: Record<string, any>) =>
												o.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() ===
												s.product.split(".")[1]
										);
										let productCode = matchedProductAttr ? matchedProductAttr.option.code : null;

										const matchedProductTypeAttr = optionsList.find(
											(o: Record<string, any>) =>
												o.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() ===
												s.product_type.split(".")[1]
										);
										let productTypeCode = matchedProductTypeAttr ? matchedProductTypeAttr.option.code : null;

										const matchedOperabilityAttr = optionsList.find(
											(o: Record<string, any>) =>
												o.classCode.replace(/[\/\-\s.]/g, "_").toLowerCase() ===
												s.operability.split(".")[1]
										);
										let operabilityCode = matchedOperabilityAttr ? matchedOperabilityAttr.option.code : null;

										if (
											selectedProfile.profile_code == profileCode &&
											selectedProductType.parent.option == productCode &&
											selectedProductType.option == productTypeCode &&
											item2.option == operabilityCode
										) {
											tempSelectProductTypeOperabilityMaxMinData = item
										}
									})
									setSelectProductTypeOperabilityMaxMinData(tempSelectProductTypeOperabilityMaxMinData)
								}
							})
						}
					}
				})
			}
		} else {
			setFullLoading(false)
			notification.error({
				message: "Error",
				description: saveReturnMsg?.data?.response?.data?.detail || "Edit failed."
			});
		}
	};

	const onSelectSection = (sectionMsg: any) => {
		if (sectionMsg?.isAdd) {
			return
		}
		setSelectedSection({ ...sectionMsg })
		let sectionTreeData = findTopLevelBySection(sectionMsg.code, selectedOpen.children)
		sectionTreeData.forEach((item) => {
			item._isTopLevel = true
		})
		sectionTreeData = markLastNodeAtEachLevel(sectionTreeData)

		setSectionTreeData([...sectionTreeData])
	};

	const onAddSectionTreeData = () => {
		let subOptionMsgVO = {
			id: crypto.randomUUID(),
			attribute: null,
			attributeMsg: {},
			attributeIsDisabled: false,
			option: null,
			optionMsg: {},
			options: [],
			have_sections: [],
			belong_section: selectedSection.code,
			optionIsDisabled: false,
			children: [],
			_collapsed: false,
			_isTopLevel: true
		};
		sectionTreeData.push(subOptionMsgVO)
		let tempSectionTreeData = markLastNodeAtEachLevel(sectionTreeData)
		setSectionTreeData([...tempSectionTreeData])
	};

	// 增加子节点
	const addSubOptionHandler = (optionItemMsg: OptionMsgVO, $index: number) => {
		let newOptionItemMsg = addSubOption(optionItemMsg)
		let newProfileOptionMsg = updateOption(newOptionItemMsg, sectionTreeData[$index])
		sectionTreeData[$index] = newProfileOptionMsg

		let tempSectionTreeData = markLastNodeAtEachLevel(sectionTreeData)
		setSectionTreeData([...tempSectionTreeData])
	};

	// 增加兄弟节点
	const addSiblingOptionHandler = (optionItemMsg: OptionMsgVO, $index: number) => {
		if (optionItemMsg._isTopLevel) {

			let subOptionMsgVO = {
				id: crypto.randomUUID(),
				attribute: optionItemMsg.attribute,
				attributeMsg: optionItemMsg.attributeMsg,
				attributeIsDisabled: false,
				option: null,
				optionMsg: {},
				options: optionItemMsg.options,
				have_sections: [],
				belong_section: selectedSection.code,
				optionIsDisabled: false,
				children: [],
				_collapsed: false,
				_isTopLevel: true
			};
			const newSectionTreeData = [
				...sectionTreeData.slice(0, $index + 1),
				subOptionMsgVO,
				...sectionTreeData.slice($index + 1)
			];
			let tempSectionTreeData = markLastNodeAtEachLevel(newSectionTreeData)

			setSectionTreeData([...tempSectionTreeData])
			return
		}
		let newOptionItemMsg = addSiblingOption(optionItemMsg, sectionTreeData[$index])
		let newProfileOptionMsg = updateOption(newOptionItemMsg, sectionTreeData[$index])
		sectionTreeData[$index] = newProfileOptionMsg

		let tempSectionTreeData = markLastNodeAtEachLevel(sectionTreeData)
		setSectionTreeData([...tempSectionTreeData])
	};

	// 删除节点
	const deleteNode = (optionItemMsg: OptionMsgVO, $index: number) => {
		if (optionItemMsg._isTopLevel) {
			sectionTreeData.splice($index, 1)
			let tempSectionTreeData = markLastNodeAtEachLevel(sectionTreeData)
			setSectionTreeData([...tempSectionTreeData])
			return
		}
		let newProfileOptionMsg = deleteItem(optionItemMsg, sectionTreeData[$index])
		sectionTreeData[$index] = newProfileOptionMsg

		let tempSectionTreeData = markLastNodeAtEachLevel(sectionTreeData)
		setSectionTreeData([...tempSectionTreeData])
	};

	// 复制节点
	const copyNode = (optionItemMsg: OptionMsgVO, $index: number) => {
		if (optionItemMsg._isTopLevel) {
			const newNode = deepCopyWithNewId(optionItemMsg);
			const newSectionTreeData = [
				...sectionTreeData.slice(0, $index + 1),
				newNode,
				...sectionTreeData.slice($index + 1)
			];
			let tempSectionTreeData = markLastNodeAtEachLevel(newSectionTreeData)
			setSectionTreeData([...tempSectionTreeData])
			return
		}
		let newProfileOptionMsg = copyItem(optionItemMsg, sectionTreeData[$index])
		sectionTreeData[$index] = newProfileOptionMsg

		let tempSectionTreeData = markLastNodeAtEachLevel(sectionTreeData)
		setSectionTreeData([...tempSectionTreeData])
	};

	// 修改attribute
	const onChangeAttribute = (attributeCode: string, optionItemMsg: OptionMsgVO, $index: number) => {
		let attributeMsg = getAttributeMsgByAttribute(attributeCode, unitAttributesTree[0]);
		let options = getOptionsByAttributeCode(attributeCode, unitAttributesTree[0]);
		optionItemMsg.attribute = attributeCode
		optionItemMsg.attributeMsg = attributeMsg
		optionItemMsg.options = options
		let newProfileOptionMsg = updateOption(optionItemMsg, sectionTreeData[$index])
		sectionTreeData[$index] = newProfileOptionMsg
		setSectionTreeData([...sectionTreeData])
	};

	// 修改option
	const onChangeOption = (optionCode: string[], optionItemMsg: OptionMsgVO, $index: number) => {
		let optionMsg: Record<string, any>[] = []
		optionCode.forEach((item: any) => {
			let msg = getOptionMsgByOption(item, optionItemMsg.options)
			optionMsg.push(msg)
		})
		optionItemMsg.option = optionCode
		optionItemMsg.optionMsg = optionMsg
		let newProfileOptionMsg = updateOption(optionItemMsg, sectionTreeData[$index])
		sectionTreeData[$index] = newProfileOptionMsg
		setSectionTreeData([...sectionTreeData])
	};

	// 展开收起
	const onToggleHandler = (id: string, $index: number) => {
		const dfs = (node: OptionMsgVO): OptionMsgVO => {
			if (node.id === id) {
				return { ...node, _collapsed: !node._collapsed };
			}
			return {
				...node,
				children: node.children.map(dfs),
			};
		};
		sectionTreeData[$index] = dfs(sectionTreeData[$index])
		setSectionTreeData([...sectionTreeData])
	};

	const onSaveChange = () => {
		// let oldSectionTreeData = findTopLevelBySection(selectedSection.code, selectedOpen.children)
		let tempSelectedOpen = JSON.parse(JSON.stringify(selectedOpen))
		let selectedOpenChildren: any = []
		tempSelectedOpen.children.forEach((item: any) => {
			if (item.belong_section != selectedSection.code) {
				selectedOpenChildren.push(item)
			}
		})
		tempSelectedOpen.children = selectedOpenChildren
		sectionTreeData.forEach((item: any) => {
			tempSelectedOpen.children.push(item)
		})
		let newProfileOptionMsg = updateOption(tempSelectedOpen, profileOptionMsg)

		onSaveScript(newProfileOptionMsg, true)
	};

	const onChangeConstrains = (value: number, $key: string) => {

		selectProductTypeOperabilityMaxMinData[$key] = value
	
		setSelectProductTypeOperabilityMaxMinData({ ...selectProductTypeOperabilityMaxMinData })
	};

	const onEditConstrains = () => {
		onSaveScript(profileOptionMsg, true)
	};

	return (
		<div className="mt-[-20px] pr-6 h-[calc(100vh-160px)] flex text-[14px]">
			<div className="w-[360px] border border-[#E8E8E8] rounded-md h-full overflow-y-auto">
				<div className="p-4 bg-[#ECF2FA] px-6 pb-6">
					<div className="text-[#427CCE]">Product Editor</div>
					<div className="text-[#717171] text-[10px]">Select the product specifications to start editing</div>
					<div className="text-xs flex items-center mt-4 text-[#717171]">
						<span className="w-[60px]">Profile</span>
						<div className="flex-1 min-w-0">
							<Select
								placeholder="Please select"
								size="small"
								className="w-full placeholder-text-12"
								options={(allProfile || []).map((v: Record<string, any>) => ({
									value: v.profile_code,
									label: `${v.name}`,
								}))}
								onChange={onChangeProfile}
								value={selectedProfile.profile_code}
							>
							</Select>
						</div>
					</div>
					<div className="text-xs flex items-center mt-2 text-[#717171]">
						<span className="w-[60px]">Type</span>
						<div className="flex-1 min-w-0">
							<Select
								placeholder="Please select"
								size="small"
								className="w-full placeholder-text-12"
								options={(allProductType || []).map((v: Record<string, any>) => ({
									value: v.option,
									label: `${v?.optionMsg?.name}`,
								}))}
								onChange={onChangeProductType}
								value={selectedProductType.option}
							>
							</Select>
						</div>
					</div>
					<div className="text-xs flex items-center mt-2 text-[#717171]">
						<span className="w-[60px]">Open</span>
						<div className="flex-1 min-w-0">
							<Select
								placeholder="Please select"
								size="small"
								className="w-full placeholder-text-12"
								options={(allOpen || []).map((v: Record<string, any>) => ({
									value: v.option,
									label: `${v?.optionMsg?.name}`,
								}))}
								onChange={onChangeOpen}
								value={selectedOpen.option}
							>
							</Select>
						</div>
					</div>
				</div>
				<div className="h-[calc(100%-180px)]">
					{
						(
							!selectedProfile?.profile_code ||
							!selectedProductType?.option ||
							!selectedOpen?.option
						) && <div className="text-xs p-6 text-[#a3a3a3]">
							Select the product specifications to see Sections and Constrains.
						</div>
					}
					{
						(
							selectedProfile?.profile_code &&
							selectedProductType?.option &&
							selectedOpen?.option
						) &&
						<div className="h-full text-xs text-[#717171]">
							<div className="p-6 h-[50%] border-b border-[#EBEDF0] overflow-y-auto">
								<div className="flex justify-between items-center">
									<div className="flex items-center">
										<span>Sections</span>
										<Tooltip
											placement="rightTop"
											title={sectionsTooltipDom}
											color="#fff"
											styles={{
												root: {
													minWidth: 300,
													maxWidth: 300,
													fontSize: 10
												}
											}}
										>
											<InfoCircleOutlined className="ml-2 cursor-pointer" />
										</Tooltip>
									</div>
									<Button
										className="text-[#717171] flex flex-row-reverse gap-1"
										icon={<EyeOutlined />}
										size="small"
										disabled={true}
									>
										Preview Card
									</Button>
								</div>
								{
									(!allSection || allSection.length == 0) && <div className="border border-dashed boredr-[#E8E8E8] p-6 flex flex-col justify-center items-center mt-4">
										<div>Create to start specifying your products</div>
										<Button onClick={onAddSection} type="primary" className="mt-3" size="small" icon={<PlusOutlined />}>Section</Button>
									</div>
								}
								{
									(allSection && allSection.length > 0) && <div className="mt-2 text-center">
										{
											allSection.map((item: any, index: any) => {
												let isSelected = item.code === selectedSection.code && item.code;
												const selectedStyle = isSelected
													? {
														background: "#E3EBF8"
													}
													: {

													}
												return (
													<div
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
														style={selectedStyle}
														onClick={() => { onSelectSection(item) }}
													>
														{
															<TreeSelect
																style={{ width: '100%', textAlign: "left" }}
																styles={{
																	popup: { root: { maxHeight: 500, minWidth: 500, overflow: 'auto' } },
																}}
																placeholder="Please select"
																treeDefaultExpandAll
																treeData={unitTreeData}
																treeLine={true}
																treeIcon={true}
																value={item?.code}
																onClick={(e: any) => { e.stopPropagation() }}
																onChange={(value) => { onChangeSection(value, index, item) }}
															/>
														}
														<div className='ml-6 mr-2'>
															<DeleteOutlined onClick={(e: any) => { e.stopPropagation(); onDeleteSection(item, index) }} className="text-[#B1B1B1] hover:text-[#FF4D4F]" />
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
											onClick={onAddSection}
										/>
									</div>
								}
							</div>
							<div className="p-6 h-[50%] overflow-y-auto">
								<div className="flex justify-between items-center mt-2">
									<span>Constrains</span>
									{/* <span>mm</span> */}
									<Button onClick={onEditConstrains} size="small" type="primary">Save</Button>
								</div>
								<div className="flex justify-between items-center mt-2">
									<div className="text-[#000000]">Max Width</div>
									<InputNumber
										size="small"
										placeholder="Input"
										value={selectProductTypeOperabilityMaxMinData?.maxWidth ?? null}
										onChange={(e) => { onChangeConstrains(e, "maxWidth") }}
									/>
								</div>
								<div className="flex justify-between items-center mt-2">
									<div className="text-[#000000]">Min Width</div>
									<InputNumber
										size="small"
										placeholder="Input"
										value={selectProductTypeOperabilityMaxMinData?.minWidth ?? null}
										onChange={(e) => { onChangeConstrains(e, "minWidth") }}
									/>
								</div>
								<div className="flex justify-between items-center mt-2">
									<div className="text-[#000000]">Max Height</div>
									<InputNumber
										size="small"
										placeholder="Input"
										value={selectProductTypeOperabilityMaxMinData?.maxHeight ?? null}
										onChange={(e) => { onChangeConstrains(e, "maxHeight") }}
									/>
								</div>
								<div className="flex justify-between items-center mt-2">
									<div className="text-[#000000]">Min Height</div>
									<InputNumber
										size="small"
										placeholder="Input"
										value={selectProductTypeOperabilityMaxMinData?.minHeight ?? null}
										onChange={(e) => { onChangeConstrains(e, "minHeight") }}
									/>
								</div>
								<div className="flex justify-between items-center mt-2">
									<div className="text-[#000000]">Max Weight</div>
									<InputNumber
										size="small"
										placeholder="Input"
										value={selectProductTypeOperabilityMaxMinData?.maxWeight ?? null}
										onChange={(e) => { onChangeConstrains(e, "maxWeight") }}
									/>
								</div>
								<div className="flex justify-between items-center mt-2">
									<div className="text-[#000000]">Min Height</div>
									<InputNumber
										size="small"
										placeholder="Input"
										value={selectProductTypeOperabilityMaxMinData?.minWeight ?? null}
										onChange={(e) => { onChangeConstrains(e, "minWeight") }}
									/>
								</div>
							</div>
						</div>
					}
				</div>
			</div>
			<div className="flex-1 border border-[#E8E8E8] rounded-md ml-4 h-full overflow-y-auto">
				{
					!selectedSection?.code && <div className="text-xs text-[#a3a3a3] p-6">
						Select the product specifications to see Sections and Constrains.
					</div>
				}
				{
					selectedSection?.code && <div className="h-full">
						<div className="bg-[#F8F8F8] flex justify-between items-center p-6 py-3">
							<div className="flex items-center">
								<span className="text-[#717171]">Sections</span>
								<span className="ml-2 w-[200px] p-4 bg-[#fff] py-2 rounded-md">
									{selectedSection?.title}
								</span>
							</div>
							<Button onClick={onSaveChange} type="primary" size="small">Save Change</Button>
						</div>
						<div className="p-6 overflow-auto w-full h-[calc(100%-65px)]">
							{
								(sectionTreeData && sectionTreeData.length == 0) && <div className="flex items-center justify-center">
									<Button
										onClick={onAddSectionTreeData}
										type="primary"
										size="small"
										icon={<PlusOutlined />}
									>
										Add
									</Button>
								</div>
							}
							{
								(sectionTreeData && sectionTreeData.length != 0) && <div className="w-full h-full overflow-x-auto">
									{
										sectionTreeData.map((item: any, index: any) => {
											return <OptionTreeNodeCom
												key={index}
												optionItemMsg={item}
												setedOptionLibraryList={setedOptionLibraryList}
												addSubOptionHandler={(node: OptionMsgVO) => { addSubOptionHandler(node, index) }}
												addSiblingOptionHandler={(node: OptionMsgVO) => { addSiblingOptionHandler(node, index) }}
												deleteNode={(node: OptionMsgVO) => { deleteNode(node, index) }}
												copyNode={(node: OptionMsgVO) => { copyNode(node, index) }}
												onChangeAttribute={(attributeCode: string, node: OptionMsgVO) => { onChangeAttribute(attributeCode, node, index) }}
												onChangeOption={(optionCode: string[], node: OptionMsgVO) => { onChangeOption(optionCode, node, index) }}
												onToggleHandler={(id: string) => { onToggleHandler(id, index) }}
											/>
										})
									}
								</div>
							}
						</div>
					</div>
				}
			</div>
			<style global jsx>
				{`
					.placeholder-text-12 .ant-select-selection-placeholder {
						font-size: 12px;
					}
				`}
			</style>
		</div>
	);
};

export default ProductEditor;
