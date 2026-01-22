"use client";

import { Button, Input, Image as AntdImage, notification } from 'antd';
import { useState, useEffect } from "react";
import { SearchOutlined, EyeOutlined, PlusOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons";
import LoadingScreen from "@/components/loading-screen";
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
	findProductTypeWithParent
} from "@/app/brand-editor/components/body-components/logics";


const ParameterBaseEditor = () => {

	const [fullLoading, setFullLoading] = useState<boolean>(false);

	const [companyMsg, setCompanyMsg] = useState<Record<string, any>>({});
	const [productTypesLibrary, setProductTypesLibrary] = useState([]);
	const [operabilityLibrary, setOperabilityLibrary] = useState([]);
	const [productTypesLibrarySearchWord, setProductTypesLibrarySearchWord] = useState("");
	const [operabilityLibrarySearchWord, setOperabilityLibrarySearchWord] = useState("");
	const [allProfile, setAllProfile] = useState<any>([]);
	const [selectedProfile, setSelectedProfile] = useState<any>({});
	const [profileOptionMsg, setProfileOptionMsg] = useState<OptionMsgVO>({
		id: "",
		attribute: null,
		attributeMsg: {},
		attributeIsDisabled: false,
		option: null,
		optionMsg: {},
		options: [],
		optionIsDisabled: false,
		children: [],
		_collapsed: false,
		_isTopLevel: true
	});
	const [projectMsg, setProjectMsg] = useState<Record<string, any>>({});
	const [quoteMsg, setQuoteMsg] = useState<Record<string, any>>({});
	const [itemMsg, setItemMsg] = useState<Record<string, any>>({});
	const [unitMsg, setUnitMsg] = useState<Record<string, any>>({});
	const [unitAttributesTree, setUnitAttributesTree] = useState<any[]>([]);
	const [productTypeMsg, setProductTypeMsg] = useState<any[]>([]);

	useEffect(() => {
		initAllData()
	}, []);

	useEffect(() => {
		if (selectedProfile?.id) {
			getAttribute()
		}
	}, [selectedProfile]);

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
		getProductTypesLibrary()
		getOperabilityLibrary()
	};

	const getAttribute = async () => {
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
		let profileOptionMsg = generateOptionMsgFromProfileScript(profileMsg, unitMsg?.attribute_tree);
		setProfileOptionMsg(profileOptionMsg)
		const productTypeMsg = findProductTypeWithParent(profileOptionMsg)
		setProductTypeMsg(productTypeMsg)
	};

	const getProductTypesLibrary = async () => {
		const res = await fetchProductTypesLibrary();
		if (res.status == "success") {
			const list = (res?.data || []).map((item: any) => ({
				...item,
				isShow: true,
			}));
			setProductTypesLibrary(list || [])
		}
	};

	const getOperabilityLibrary = async () => {
		const res = await fetchOperabilityLibrary();
		if (res.status == "success") {
			const list = (res?.data || []).map((item: any) => ({
				...item,
				isShow: true,
			}));
			setOperabilityLibrary(list || [])
		}
	};

	const handleAddProfile = () => {
		allProfile.push({
			isAdd: true,
			name: ""
		})
		setAllProfile([...allProfile])
	};

	const handleChangeAddProfile = (e: any, index: any) => {
		allProfile[index]["name"] = e.target.value
		setAllProfile([...allProfile])
	};

	const addProfileToDB = async (profile: any, index: any) => {
		if (!profile?.name) {
			notification.warning({
				message: "Warning",
				description: "Name cannot be null"
			});
			return
		}
		const params = {
			company_id: companyMsg?.id,
			name: profile?.name
		}
		const createProfileRes = await createProfile(params)
		if (createProfileRes?.status == "success") {
			notification.success({
				message: "Success",
				description: "Added successfully"
			});
			allProfile[index] = createProfileRes?.data
			setAllProfile([...allProfile])
		} else {
			notification.error({
				message: "Error",
				description: createProfileRes?.data?.response?.data?.detail || "Add failed."
			});
		}
	};

	const editProfileToDB = async (profile: any, index: any) => {
		if (!profile?.name) {
			notification.warning({
				message: "Warning",
				description: "Name cannot be null"
			});
			return
		}
		const res = await updateProfile(profile?.id, profile?.name)
		if (res?.status == "success") {
			notification.success({
				message: "Success",
				description: "Edit successfully"
			});
			allProfile[index] = res?.data
			setAllProfile([...allProfile])
		} else {
			notification.error({
				message: "Error",
				description: res?.data?.response?.data?.detail || "Edit failed."
			});
		}
	};

	const deleteProfileFromDB = async (profile: any, index: any) => {
		if (!profile?.id) {
			notification.success({
				message: "Success",
				description: "Delete successfully"
			});
			allProfile.splice(index, 1)
			setAllProfile([...allProfile])
			return
		}
		const res = await deleteProfile(profile?.id)
		if (res?.status == "success" && res?.data == true) {
			notification.success({
				message: "Success",
				description: "Delete successfully"
			});
			allProfile.splice(index, 1)
			setAllProfile([...allProfile])
		} else {
			notification.error({
				message: "Error",
				description: res?.data?.response?.data?.detail || "Delete failed."
			});
		}
	};

	const changeProductTypesLibrarySearchWord = (e: any) => {
		const value = e?.target?.value
		setProductTypesLibrarySearchWord(value)
		const keyword = value.toLowerCase();
		productTypesLibrary.forEach((item: any) => {
			item.isShow = false;

			if (
				item.product_type_name &&
				item.product_type_name.toLowerCase().includes(keyword)
			) {
				item.isShow = true;
			}
		});
		setProductTypesLibrary([...productTypesLibrary])
	};

	const changeOperabilityLibrarySearchWord = (e: any) => {
		const value = e?.target?.value
		setOperabilityLibrarySearchWord(value)
		const keyword = value.toLowerCase();
		operabilityLibrary.forEach((item: any) => {
			item.isShow = false;

			if (
				item.name &&
				item.name.toLowerCase().includes(keyword)
			) {
				item.isShow = true;
			}
		});
		setOperabilityLibrary([...operabilityLibrary])
	};

	const onSelectProfile = (profile: any) => {
		if (profile?.id !== selectedProfile?.id) {
			setSelectedProfile(profile)
		}
	};

	const onAddToProfile = async (productType: any) => {
		if (!selectedProfile?.id) {
			notification.warning({
				message: "Warning",
				description: "Select profile first"
			});
			return
		}

		let productAttributesId = null
		let productTypeAttributesId = null
		unitAttributesTree[0].children.map((item: any) => {
			if (item.code == "unit$product") {
				productAttributesId = item.id
			}
			if (item.code == "unit$product_type") {
				productTypeAttributesId = item.id
			}
		})
		let productParams = {
			"product_attributes_id": productAttributesId,
			"company_id": companyMsg?.id,
			"code": productType?.product_code,
			"name": productType?.product_name,
			"detail": productType?.product_detail,
			"description": productType?.product_description,
			"other_msg": ""
		}
		let productTypeParams = {
			"product_attributes_id": productTypeAttributesId,
			"company_id": companyMsg?.id,
			"code": productType?.product_type_code,
			"name": productType?.product_type_name,
			"detail": productType?.product_type_detail,
			"description": productType?.product_type_description,
			"other_msg": JSON.stringify({
				"file_key": productType?.product_type_file_key
			})
		}

		let optionItemMsg: any = {}
		profileOptionMsg.children.forEach((item: any) => {
			if (item.attribute == "unit$product" && item.option == productType?.product_code) {
				optionItemMsg = item
			}
		})
		if (optionItemMsg?.id) {
			const [
				createProductTypeOptionRes
			] = await Promise.all([
				createOption(productTypeParams)
			]);
			if (createProductTypeOptionRes.status == "success") {
				let productTypeAttributeMsg = getAttributeMsgByAttribute("unit$product_type", unitAttributesTree[0]);
				let productTypeOptionMsg = createProductTypeOptionRes?.data

				let newOptionItemMsg = addSubOption(optionItemMsg)
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].attribute = "unit$product_type"
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].attributeMsg = productTypeAttributeMsg
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].option = productTypeOptionMsg.code
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].optionMsg = productTypeOptionMsg

				let newProfileOptionMsg = updateOption(newOptionItemMsg, profileOptionMsg)
				setProfileOptionMsg(newProfileOptionMsg)
				const productTypeMsg = findProductTypeWithParent(newProfileOptionMsg)
				setProductTypeMsg(productTypeMsg)
				onSaveScript(newProfileOptionMsg)
			}else{
				notification.error({
					message: "Error",
					description: createProductTypeOptionRes?.data?.response?.data?.detail || "Add failed."
				});
			}
		} else {
			const [
				createProductOptionRes,
				createProductTypeOptionRes
			] = await Promise.all([
				createOption(productParams),
				createOption(productTypeParams)
			]);
			if (createProductOptionRes.status == "success" && createProductTypeOptionRes.status == "success") {
				let productAttributeMsg = getAttributeMsgByAttribute("unit$product", unitAttributesTree[0]);
				let productOptionMsg = createProductOptionRes?.data

				let productTypeAttributeMsg = getAttributeMsgByAttribute("unit$product_type", unitAttributesTree[0]);
				let productTypeOptionMsg = createProductTypeOptionRes?.data

				let newOptionItemMsg = addSubOption(profileOptionMsg)
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].attribute = "unit$product"
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].attributeMsg = productAttributeMsg
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].option = productOptionMsg.code
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].optionMsg = productOptionMsg

				let newOptionItemMsgForProductType = addSubOption(newOptionItemMsg.children[newOptionItemMsg.children.length - 1])
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].attribute = "unit$product_type"
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].attributeMsg = productTypeAttributeMsg
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].option = productTypeOptionMsg.code
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].optionMsg = productTypeOptionMsg

				let newProfileOptionMsg = updateOption(newOptionItemMsg, profileOptionMsg)
				setProfileOptionMsg(newProfileOptionMsg)
				const productTypeMsg = findProductTypeWithParent(newProfileOptionMsg)
				setProductTypeMsg(productTypeMsg)
				onSaveScript(newProfileOptionMsg)
			}else{
				notification.error({
					message: "Error",
					description: createProductOptionRes?.data?.response?.data?.detail || "Add failed."
				});
				notification.error({
					message: "Error",
					description: createProductTypeOptionRes?.data?.response?.data?.detail || "Add failed."
				});
			}
		}
	};

	const onSaveScript = async (profileOptionMsg: OptionMsgVO) => {
		const [
			unitAttributesWithOptions
		] = await Promise.all([
			fetchUnitAttributesWithOptionsByVersionId(selectedProfile?.unit_version_id)
		]);
		setUnitMsg(unitAttributesWithOptions?.data);
		let unitAttributesTreeMsg = processUnitAttributeTree(unitAttributesWithOptions?.data?.attribute_tree)
		setUnitAttributesTree([unitAttributesTreeMsg])

		let scriptMsg: string = generateProfileScriptFromProfileOptionMsg(
			projectMsg?.attribute_tree,
			quoteMsg?.attribute_tree,
			itemMsg?.attribute_tree,
			unitAttributesWithOptions?.data?.attribute_tree,
			profileOptionMsg
		);
		setFullLoading(false)
		let checkReturnMsg: Record<string, any> = await baseCheckProfileScript(scriptMsg);
		if (checkReturnMsg.status == "success") {
			let saveReturnMsg: Record<string, any> = await saveProfileScript(selectedProfile.id, scriptMsg);

			if (saveReturnMsg.status == "success") {
				setFullLoading(false)
				notification.success({
					message: "Success",
					description: "Edit successfully.",
				});
			} else {
				setFullLoading(false)
				notification.error({
					message: "Error",
					description: saveReturnMsg?.data?.response?.data?.detail || "Edit failed."
				});
			}
		} else {
			setFullLoading(false)
			notification.error({
				message: "Error",
				description: checkReturnMsg?.data?.response?.data?.detail || "Profile script base check failed."
			});
		}
	};

	const getFileUrlByAllProductTypeLibrary = (msg: any) => {
		const otherMsg = JSON.parse(msg?.optionMsg?.other_msg)
		let fileUrl = ""
		productTypesLibrary.forEach((item: any) => {
			if (item.product_type_file_key == otherMsg.file_key) {
				fileUrl = item.file_url
			}
		})
		return fileUrl
	};

	return (
		<div
			className="pr-6 flex w-full overflow-x-auto overflow-y-hidden"
			style={{ height: "calc(100vh - 195px)", fontSize: "14px" }}
		>
			<div className="flex flex-nowrap">  {/* 横向排列，不换行 */}
				<div className="w-[350px] h-full border-r border-r-[#EBEDF0] border-t border-t-[#EBEDF0]">
					<div className="w-full h-[30px] flex items-center text-[#717171] border-b border-b-[#EBEDF0] p-5">
						<div>Profile/Line</div>
					</div>
					<div style={{ height: "calc(100% - 45px)" }} className="overflow-y-auto flex flex-col items-center">
						<div className='w-full pl-4 pr-4 mt-2'>
							{
								allProfile.map((item: any, index: any) => {
									let isSelected = item.id === selectedProfile.id;
									const selectedStyle = isSelected
										? {
											background: "#E3EBF8"
										}
										: {

										}
									return (
										(item.isAdd && !item.id)
											? <div
												key={index}
												className='w-full flex p-2 border-b border-b-[#EBEDF0] items-center'
											>
												<Input
													placeholder="Profile/Line"
													value={item.name}
													onChange={(e: any) => { handleChangeAddProfile(e, index) }}
													onBlur={() => { addProfileToDB(item, index) }}
												/>
												<div className='ml-6'>
													<DeleteOutlined onClick={() => { deleteProfileFromDB(item, index) }} style={{ color: "#B1B1B1" }} />
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
												"
												onClick={() => onSelectProfile(item)}
												style={selectedStyle}
											>
												<Input
													placeholder="Profile/Line"
													value={item.name}
													className="
														bg-transparent
														border
														border-transparent
														shadow-none
														group-hover:bg-[#fff]
														group-hover:border-[#D9D9D9]
														focus:border-[#1677FF]
														focus:shadow-none
														transition-colors
													"
													onChange={(e: any) => { handleChangeAddProfile(e, index) }}
													onBlur={() => { editProfileToDB(item, index) }}
												/>

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
													<CopyOutlined disabled className="text-[#B1B1B1] hover:text-[#595959]" />
													<DeleteOutlined onClick={() => { deleteProfileFromDB(item, index) }} className="text-[#B1B1B1] hover:text-[#FF4D4F]" />
												</div>
											</div>
									)
								})
							}
						</div>
						<Button
							className='mt-2'
							size='small'
							type="primary"
							shape="circle"
							icon={<PlusOutlined />}
							onClick={handleAddProfile}
						/>
					</div>
				</div>
				<div className="flex flex-col w-[350px] h-full border-r border-r-[#EBEDF0] border-t border-t-[#EBEDF0]">
					<div className="w-full h-[30px] flex items-center text-[#717171] border-b border-b-[#EBEDF0] p-5 justify-between">
						<div>Types</div>
						<Button size='small' className='text-[#717171] text-[12px]'>Copy & Move to</Button>
					</div>
					<div className='flex flex-col flex-1 p-4 pl-5 pr-5' style={{ height: "calc(100% - 30px)" }}>
						<div className='h-[50%]'>
							{
								!selectedProfile?.id &&
								<div
									style={{ border: "1px dashed #EBEDF0" }}
									className='p-6 pl-10 pr-10 flex items-center justify-center rounded-md text-[#A3A3A3]'
								>
									Please select profile
								</div>
							}
							{
								(selectedProfile?.id && productTypeMsg.length == 0) &&
								<div
									style={{ border: "1px dashed #EBEDF0", fontSize: "12px" }}
									className='p-6 pl-10 pr-10 flex items-center justify-center text-center rounded-md text-[#A3A3A3]'
								>
									Select the window and door types you offer for this profile.
								</div>
							}
							{
								(selectedProfile?.id && productTypeMsg.length != 0) &&
								<div className='text-[12px]'>
									{
										productTypeMsg.map((item: any, index: any) => {
											return <div
												key={item.option}
												className='flex p-2 border-b border-b-[#EBEDF0] items-center cursor-pointer'
											>
												<AntdImage
													src={getFileUrlByAllProductTypeLibrary(item)}
													width={35}
													style={{ borderRadius: "6px" }}
													preview={{
														mask: <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '14px' }}><EyeOutlined /></div>,
													}}
												>

												</AntdImage>
												<div className='ml-2'>
													<div>{item?.optionMsg?.name}</div>
													<div style={{ fontSize: "10px" }} className='text-[#717171]'>{item.parent?.optionMsg?.name}</div>
												</div>
											</div>
										})
									}
								</div>
							}
						</div>
						<div className='text-[12px] mt-4 h-[50%]'>
							<div className='text-[#717171]'>Options</div>
							<div className='mt-2 mb-2'>
								<Input
									placeholder="Single Swing, Hopper"
									prefix={<SearchOutlined className='text-[#DCDCDC]' />}
									value={productTypesLibrarySearchWord}
									onChange={changeProductTypesLibrarySearchWord}
								/>
							</div>
							<div style={{ height: "calc(100% - 50px)" }} className='overflow-y-auto'>
								{
									productTypesLibrary.map((item: any) => {
										return (
											item.isShow
												? <div
													onClick={() => onAddToProfile(item)}
													key={item.product_type_code}
													className='flex p-2 border-b border-b-[#EBEDF0] items-center cursor-pointer'
												>
													<AntdImage
														src={item.file_url}
														width={35}
														style={{ borderRadius: "6px" }}
														preview={{
															mask: <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '14px' }}><EyeOutlined /></div>,
														}}
													>

													</AntdImage>
													<div className='ml-2'>
														<div>{item.product_type_name}</div>
														<div style={{ fontSize: "10px" }} className='text-[#717171]'>{item.product_name}</div>
													</div>
												</div>
												: null
										)
									})
								}
							</div>
						</div>
					</div>
				</div>
				<div className="flex flex-col w-[350px] h-full border-r border-r-[#EBEDF0] border-t border-t-[#EBEDF0]">
					<div className="w-full h-[30px] flex items-center text-[#717171] border-b border-b-[#EBEDF0] p-5">
						<div>Opens</div>
					</div>
					<div className='flex flex-col p-4 pl-5 pr-5' style={{ height: "calc(100% - 30px)" }}>
						<div className='bg-black h-[50%]'>

						</div>
						<div className='text-[12px] mt-4 h-[50%]'>
							<div className='text-[#717171]'>Options</div>
							<div className='mt-2 mb-2'>
								<Input
									placeholder="Please input"
									prefix={<SearchOutlined className='text-[#DCDCDC]' />}
									value={operabilityLibrarySearchWord}
									onChange={changeOperabilityLibrarySearchWord}
								/>
							</div>
							<div style={{ height: "calc(100% - 50px)" }} className='overflow-y-auto'>
								{
									operabilityLibrary.map((item: any) => {
										return (
											item.isShow
												? <div
													key={item.code}
													className='flex p-2 border-b border-b-[#EBEDF0] items-center cursor-pointer'
												>
													<AntdImage
														src={item.file_url}
														width={35}
														style={{ borderRadius: "6px" }}
														preview={{
															mask: <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '14px' }}><EyeOutlined /></div>,
														}}
													>

													</AntdImage>
													<div className='ml-2'>
														<div>{item.name}</div>
													</div>
												</div>
												: null
										)
									})
								}
							</div>
						</div>
					</div>
				</div>
				<div className="w-[350px] h-full border-t border-t-[#EBEDF0]">
					<div className="w-full h-[30px] flex items-center text-[#717171] border-b border-b-[#EBEDF0] p-5">
						<div>Drawing & Shape</div>
					</div>
					<div></div>
				</div>
			</div>
			<LoadingScreen isLoading={fullLoading}></LoadingScreen>
		</div>
	);
};

export default ParameterBaseEditor;
