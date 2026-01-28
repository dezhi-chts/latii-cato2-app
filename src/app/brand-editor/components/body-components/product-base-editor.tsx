"use client";

import { Button, Input, Image as AntdImage, notification, Tooltip, Checkbox, Popconfirm, Dropdown, Popover, Modal } from 'antd';
import { useState, useEffect } from "react";
import { SearchOutlined, EyeOutlined, PlusOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons";
import LoadingScreen from "@/components/loading-screen";
import ViewScriptCom from "@/app/profile-editor-demo/components/viewScript";
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
	pickProductProductTypeOpen
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
	const [copyProfileName, setCopyProfileName] = useState("");
	const [copyProfileopenId, setCopyProfileopenId] = useState<any>(null);
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

	const [selectedProductType, setSelectedProductType] = useState<any>({});
	const [operabilityMsg, setOperabilityMsg] = useState<any[]>([]);

	const [isShowViewScriptDataModal, setIsShowViewScriptDataModal] = useState<boolean>(false);
	const [profileScriptMsg, setProfileScriptMsg] = useState<string>("");

	useEffect(() => {
		initAllData()
	}, []);

	useEffect(() => {
		if (selectedProfile?.id) {
			getAttribute()
		} else {
			setProductTypeMsg([])
			setOperabilityMsg([])
		}
	}, [selectedProfile]);

	useEffect(() => {
		if (!productTypeMsg || productTypeMsg.length === 0) return;
		changeProductTypesLibrarySearchWordAndAlreadyExistence(null);
	}, [productTypeMsg]);

	useEffect(() => {
		if (selectedProductType?.option) {
			setOperabilityMsg(selectedProductType.children)
		}
	}, [selectedProductType]);

	useEffect(() => {
		if (!operabilityMsg) return;
		changeOperabilityLibrarySearchWord(null);
	}, [operabilityMsg]);

	const getOpenMsg = (allProductType: any) => {
		if (selectedProductType?.option && allProductType && allProductType.length != 0) {
			allProductType.forEach((item: any) => {
				if (item.option == selectedProductType?.option) {
					setOperabilityMsg([...item.children])
				}
			})
		}
	};

	const initAllData = async () => {
		const companyRes = await fetchCompanyByKeycloakUser();
		if (companyRes.status == "success") {
			setCompanyMsg(companyRes?.data)
			const profileRes = await fetchAllProfileByCompanyId(
				companyRes?.data?.id
			)
			if (profileRes.status == "success") {
				setAllProfile(profileRes?.data)

				if (profileRes?.data.length != 0) {
					const [
						projectAttributesWithOptions,
						quoteAttributesWithOptions,
						itemAttributesWithOptions,
						unitAttributesWithOptions
					] = await Promise.all([
						fetchProjectAttributesWithOptionsByVersionId(profileRes?.data[0]?.project_version_id),
						fetchQuoteAttributesWithOptionsByVersionId(profileRes?.data[0]?.quote_version_id),
						fetchItemAttributesWithOptionsByVersionId(profileRes?.data[0]?.item_version_id),
						fetchUnitAttributesWithOptionsByVersionId(profileRes?.data[0]?.unit_version_id)
					]);
					setProjectMsg(projectAttributesWithOptions?.data);
					setQuoteMsg(quoteAttributesWithOptions?.data);
					setItemMsg(itemAttributesWithOptions?.data);
					setUnitMsg(unitAttributesWithOptions?.data);
				}
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

		if (productTypeMsg && productTypeMsg.length != 0) {
			productTypeMsg.forEach((item: any) => {
				if (item.option == selectedProductType.option) {
					setSelectedProductType(item)
				}
			})
		}
		getOpenMsg(productTypeMsg)
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
			if (selectedProfile.id == res?.data.id) {
				setSelectedProfile({})
			}
		} else {
			notification.error({
				message: "Error",
				description: res?.data?.response?.data?.detail || "Delete failed."
			});
		}
	};

	const changeProductTypesLibrarySearchWordAndAlreadyExistence = (e: any) => {
		let keyword = ""
		if (e) {
			const value = e?.target?.value
			setProductTypesLibrarySearchWord(value)
			keyword = value.toLowerCase();
		} else {
			keyword = productTypesLibrarySearchWord.toLowerCase();
		}
		productTypesLibrary.forEach((item: any) => {
			item.isShow = false;

			if (
				item.product_type_name &&
				item.product_type_name.toLowerCase().includes(keyword)
			) {
				item.isShow = true;
			}
			productTypeMsg.forEach((item1: any) => {
				if (item.product_type_code == item1.option) {

					item.isShow = false;
				}
			})
		});
		setProductTypesLibrary([...productTypesLibrary])
	};

	const changeOperabilityLibrarySearchWord = (e: any) => {
		let keyword = ""
		if (e) {
			const value = e?.target?.value
			setOperabilityLibrarySearchWord(value)
			keyword = value.toLowerCase();
		} else {
			keyword = operabilityLibrarySearchWord.toLowerCase();
		}

		operabilityLibrary.forEach((item: any) => {
			item.isShow = false;

			if (
				item.name &&
				item.name.toLowerCase().includes(keyword)
			) {
				item.isShow = true;
			}

			operabilityMsg.forEach((item1: any) => {
				if (item.code == item1.option) {

					item.isShow = false;
				}
			})
		});
		setOperabilityLibrary([...operabilityLibrary])
	};

	const onSelectProfile = (profile: any) => {
		if (profile?.id !== selectedProfile?.id) {
			setSelectedProfile(profile)
			setSelectedProductType({})
			setOperabilityMsg([])
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

		let allProductOptions = getOptionsByAttributeCode("unit$product", unitAttributesTree[0])
		let allProductTypeOptions = getOptionsByAttributeCode("unit$product_type", unitAttributesTree[0])
		const productOption = allProductOptions.find(
			(item: any) => item.code === productType?.product_code
		);

		const productTypeOption = allProductTypeOptions.find(
			(item: any) => item.code === productType?.product_type_code
		);

		let optionItemMsg: any = {}
		let optionProductTypeItemMsg: any = {}
		profileOptionMsg.children.forEach((item: any) => {
			if (item.attribute == "unit$product" && item.option == productType?.product_code) {
				optionItemMsg = item
			}
			item.children.forEach((item1: any) => {
				if (item1.attribute == "unit$product_type" && item1.option == productType?.product_type_code) {
					optionProductTypeItemMsg = item1
				}
			})
		})

		if (productOption?.code && productTypeOption?.code) {
			let productAttributeMsg = getAttributeMsgByAttribute("unit$product", unitAttributesTree[0]);
			let productOptionMsg = productOption

			let productTypeAttributeMsg = getAttributeMsgByAttribute("unit$product_type", unitAttributesTree[0]);
			let productTypeOptionMsg = productTypeOption

			if (optionItemMsg?.id) {
				let newOptionItemMsgForProductType = addSubOption(optionItemMsg)
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].attribute = "unit$product_type"
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].attributeMsg = productTypeAttributeMsg
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].option = productTypeOptionMsg.code
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].optionMsg = productTypeOptionMsg

				let newProfileOptionMsg = updateOption(newOptionItemMsgForProductType, profileOptionMsg)
				// setProfileOptionMsg(newProfileOptionMsg)
				// const productTypeMsg = findProductTypeWithParent(newProfileOptionMsg)
				// setProductTypeMsg(productTypeMsg)
				onSaveScript(newProfileOptionMsg)
			} else {
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

				let newProfileOptionMsg = updateOption(newOptionItemMsgForProductType, profileOptionMsg)
				// setProfileOptionMsg(newProfileOptionMsg)
				// const productTypeMsg = findProductTypeWithParent(newProfileOptionMsg)
				// setProductTypeMsg(productTypeMsg)
				onSaveScript(newProfileOptionMsg)
			}
		} else if (productOption?.code && !productTypeOption?.code) {
			const [
				createProductTypeOptionRes
			] = await Promise.all([
				createOption(productTypeParams)
			]);
			if (createProductTypeOptionRes.status == "success") {
				let productAttributeMsg = getAttributeMsgByAttribute("unit$product", unitAttributesTree[0]);
				let productOptionMsg = productOption

				let productTypeAttributeMsg = getAttributeMsgByAttribute("unit$product_type", unitAttributesTree[0]);
				let productTypeOptionMsg = createProductTypeOptionRes?.data

				if (optionItemMsg?.id) {
					let newOptionItemMsgForProductType = addSubOption(optionItemMsg)
					newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].attribute = "unit$product_type"
					newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].attributeMsg = productTypeAttributeMsg
					newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].option = productTypeOptionMsg.code
					newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].optionMsg = productTypeOptionMsg

					let newProfileOptionMsg = updateOption(newOptionItemMsgForProductType, profileOptionMsg)
					// setProfileOptionMsg(newProfileOptionMsg)
					// const productTypeMsg = findProductTypeWithParent(newProfileOptionMsg)
					// setProductTypeMsg(productTypeMsg)
					onSaveScript(newProfileOptionMsg)
				} else {
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

					let newProfileOptionMsg = updateOption(newOptionItemMsgForProductType, profileOptionMsg)
					// setProfileOptionMsg(newProfileOptionMsg)
					// const productTypeMsg = findProductTypeWithParent(newProfileOptionMsg)
					// setProductTypeMsg(productTypeMsg)
					onSaveScript(newProfileOptionMsg)
				}
			} else {
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
				// setProfileOptionMsg(newProfileOptionMsg)
				// const productTypeMsg = findProductTypeWithParent(newProfileOptionMsg)
				// setProductTypeMsg(productTypeMsg)
				onSaveScript(newProfileOptionMsg)
			} else {
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

		let scriptMsg: string = generateProfileScriptFromProfileOptionMsg(
			projectMsg?.attribute_tree,
			quoteMsg?.attribute_tree,
			itemMsg?.attribute_tree,
			unitAttributesWithOptions?.data?.attribute_tree,
			profileOptionMsg
		);
		setFullLoading(false)
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
			setSelectedProfile(saveReturnMsg?.data)
			generateOptionMsg(saveReturnMsg?.data, unitAttributesWithOptions?.data)
		} else {
			setFullLoading(false)
			notification.error({
				message: "Error",
				description: saveReturnMsg?.data?.response?.data?.detail || "Edit failed."
			});
		}
		// let checkReturnMsg: Record<string, any> = await baseCheckProfileScript(scriptMsg);
		// if (checkReturnMsg.status == "success") {
		// 	let saveReturnMsg: Record<string, any> = await saveProfileScript(selectedProfile.id, scriptMsg);

		// 	if (saveReturnMsg.status == "success") {
		// 		setFullLoading(false)
		// 		notification.success({
		// 			message: "Success",
		// 			description: "Edit successfully.",
		// 		});
		// 		setSelectedProfile(saveReturnMsg?.data)
		// 		generateOptionMsg(saveReturnMsg?.data, unitAttributesWithOptions?.data)
		// 	} else {
		// 		setFullLoading(false)
		// 		notification.error({
		// 			message: "Error",
		// 			description: saveReturnMsg?.data?.response?.data?.detail || "Edit failed."
		// 		});
		// 	}
		// } else {
		// 	setFullLoading(false)
		// 	notification.error({
		// 		message: "Error",
		// 		description: checkReturnMsg?.data?.response?.data?.detail || "Profile script base check failed."
		// 	});
		// }
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

	const getFileUrlByAllOpenLibrary = (msg: any) => {
		const otherMsg = JSON.parse(msg?.optionMsg?.other_msg)
		let fileUrl = ""
		operabilityLibrary.forEach((item: any) => {
			if (item.file_key == otherMsg.file_key) {
				fileUrl = item.file_url
			}
		})
		return fileUrl
	};

	const onChangeProductTypeSelected = (e: any, msg: any) => {
		productTypeMsg.forEach((item: any) => {
			if (item.id == msg.id) {
				item.isChecked = e.target.checked
			}
		})
		setProductTypeMsg([...productTypeMsg])
	};

	const onDeleteProductType = (msg: any) => {
		let newProfileOptionMsg = deleteItem(msg, profileOptionMsg)
		setProfileOptionMsg(newProfileOptionMsg)
		onSaveScript(newProfileOptionMsg)
		setOperabilityMsg([])
		setSelectedProductType({})
	};

	const onSelectedProductType = (msg: any) => {
		setSelectedProductType(msg)
	};

	const onAddToProductType = async (openMsg: any) => {
		if (!selectedProfile?.id || !selectedProductType?.option) {
			notification.warning({
				message: "Warning",
				description: "Select profile and product type first"
			});
			return
		}
		let openAttributesId = null
		unitAttributesTree[0].children.map((item: any) => {
			if (item.code == "unit$operability") {
				openAttributesId = item.id
			}
		})
		let productParams = {
			"product_attributes_id": openAttributesId,
			"company_id": companyMsg?.id,
			"code": openMsg?.code,
			"name": openMsg?.name,
			"detail": openMsg?.detail,
			"description": openMsg?.description,
			"other_msg": JSON.stringify({
				"file_key": openMsg?.file_key
			})
		}

		let allProductOptions = getOptionsByAttributeCode("unit$operability", unitAttributesTree[0])
		const productOption = allProductOptions.find(
			(item: any) => item.code === openMsg?.code
		);

		let optionItemMsg: any = {}
		profileOptionMsg.children.forEach((item: any) => {
			item.children.forEach((item1: any) => {
				if (item1.attribute == "unit$product_type" && item1.option == selectedProductType?.option) {
					optionItemMsg = item1
				}
			})
		})

		if (productOption?.code) {
			if (optionItemMsg?.id) {
				let attributeMsg = getAttributeMsgByAttribute("unit$operability", unitAttributesTree[0]);
				let newOptionItemMsg = addSubOption(optionItemMsg)
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].attribute = "unit$operability"
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].attributeMsg = attributeMsg
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].option = productOption.code
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].optionMsg = productOption
				let newProfileOptionMsg = updateOption(newOptionItemMsg, profileOptionMsg)

				// const productTypeMsg = findProductTypeWithParent(newProfileOptionMsg)
				// getOpenMsg(productTypeMsg)

				// setProfileOptionMsg(newProfileOptionMsg)
				onSaveScript(newProfileOptionMsg)

			}
		} else {
			if (optionItemMsg?.id) {
				const [
					createOpenOptionRes,
				] = await Promise.all([
					createOption(productParams)
				]);
				if (createOpenOptionRes.status == "success") {
					let attributeMsg = getAttributeMsgByAttribute("unit$operability", unitAttributesTree[0]);
					let openOptionMsg = createOpenOptionRes?.data

					let newOptionItemMsg = addSubOption(optionItemMsg)
					newOptionItemMsg.children[newOptionItemMsg.children.length - 1].attribute = "unit$operability"
					newOptionItemMsg.children[newOptionItemMsg.children.length - 1].attributeMsg = attributeMsg
					newOptionItemMsg.children[newOptionItemMsg.children.length - 1].option = openOptionMsg.code
					newOptionItemMsg.children[newOptionItemMsg.children.length - 1].optionMsg = openOptionMsg
					let newProfileOptionMsg = updateOption(newOptionItemMsg, profileOptionMsg)

					// const productTypeMsg = findProductTypeWithParent(newProfileOptionMsg)
					// getOpenMsg(productTypeMsg)

					// setProfileOptionMsg(newProfileOptionMsg)
					onSaveScript(newProfileOptionMsg)

				} else {
					notification.error({
						message: "Error",
						description: createOpenOptionRes?.data?.response?.data?.detail || "Add failed."
					});
				}
			}
		}
	};

	const onDeleteOpen = (msg: any) => {
		let newProfileOptionMsg = deleteItem(msg, profileOptionMsg)

		const productTypeMsg = findProductTypeWithParent(newProfileOptionMsg)
		getOpenMsg(productTypeMsg)

		setProfileOptionMsg(newProfileOptionMsg)
		onSaveScript(newProfileOptionMsg)
	};

	const onCopyProductTypeToProfile = async (profile: any) => {
		let copyItem: any = []
		productTypeMsg.forEach((item: any) => {
			if (item.isChecked) {
				copyItem.push(item)
			}
		})
		if (copyItem.length == 0) {
			notification.warning({
				message: "Warning",
				description: "Select the product type to copy"
			});
			return
		}

		let profileOptionMsg = generateOptionMsgFromProfileScript(profile, unitMsg?.attribute_tree);
		let alreadyProdyctType: any = []
		let notAlreadyProdyctType: any = []
		copyItem.forEach((item: any) => {
			let itemIsAlready = false
			let itemParentIsAlready = false
			let parentMsg: any = {}
			profileOptionMsg.children.forEach((sProduct: any) => {
				if (item.parent.option == sProduct.option) {
					itemParentIsAlready = true
					parentMsg = sProduct

				}
				sProduct.children.forEach((sProductType: any) => {
					if (item.option == sProductType.option) {
						itemIsAlready = true
					}
				})
			})
			if (itemIsAlready) {
				alreadyProdyctType.push(item.optionMsg.name)
			} else {
				notAlreadyProdyctType.push(item.optionMsg.name)
			}
			if (!itemParentIsAlready && !itemIsAlready) {
				let newOptionItemMsg = addSubOption(profileOptionMsg)
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].attribute = item.parent.attribute
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].attributeMsg = item.parent.attributeMsg
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].option = item.parent.option
				newOptionItemMsg.children[newOptionItemMsg.children.length - 1].optionMsg = item.parent.optionMsg

				let newOptionItemMsgForProductType = addSubOption(newOptionItemMsg.children[newOptionItemMsg.children.length - 1])
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].attribute = item.attribute
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].attributeMsg = item.attributeMsg
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].option = item.option
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].optionMsg = item.optionMsg
				let allOpen = item.children.filter((o: any) => {
					return o.attribute === "unit$operability";
				});
				allOpen.forEach((o: any) => {
					o.children = []
				})
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].children = allOpen

				let newProfileOptionMsg = updateOption(newOptionItemMsgForProductType, profileOptionMsg)
				profileOptionMsg = newProfileOptionMsg
			} else if (itemParentIsAlready && !itemIsAlready) {

				let newOptionItemMsgForProductType = addSubOption(parentMsg)
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].attribute = item.attribute
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].attributeMsg = item.attributeMsg
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].option = item.option
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].optionMsg = item.optionMsg
				let allOpen = item.children.filter((o: any) => {
					return o.attribute === "unit$operability";
				});
				allOpen.forEach((o: any) => {
					o.children = []
				})
				newOptionItemMsgForProductType.children[newOptionItemMsgForProductType.children.length - 1].children = allOpen

				let newProfileOptionMsg = updateOption(newOptionItemMsgForProductType, profileOptionMsg)
				profileOptionMsg = newProfileOptionMsg
			} else if (itemParentIsAlready && itemIsAlready) {

			}
		})
		setFullLoading(false)
		let scriptMsg: string = generateProfileScriptFromProfileOptionMsg(
			projectMsg?.attribute_tree,
			quoteMsg?.attribute_tree,
			itemMsg?.attribute_tree,
			unitMsg?.attribute_tree,
			profileOptionMsg
		);
		let saveReturnMsg: Record<string, any> = await saveProfileScript(profile.id, scriptMsg);

		if (saveReturnMsg.status == "success") {
			setFullLoading(false)
			allProfile.forEach((item: any, index: any) => {
				if (item.id == saveReturnMsg?.data.id) {
					allProfile[index] = saveReturnMsg?.data
				}
			})
			setAllProfile([...allProfile])
			if (saveReturnMsg?.data.id == selectedProfile?.id) {
				setSelectedProfile(saveReturnMsg?.data)
			}
			notification.success({
				message: "Success",
				description: <div>
					{notAlreadyProdyctType.length != 0 && <div>{notAlreadyProdyctType.join(",")} copy successfully.</div>}
					{alreadyProdyctType.length != 0 && <div>{alreadyProdyctType.join(",")} already exists; no copy will be performed.</div>}
				</div>,
			});
		} else {
			setFullLoading(false)
			notification.error({
				message: "Error",
				description: saveReturnMsg?.data?.response?.data?.detail || "Copy failed."
			});
		}
	};

	const onCopyProfile = async (profile: any) => {
		if (!copyProfileName) {
			notification.warning({
				message: "Warning",
				description: "Name cannot be null"
			});
			return
		}
		const params = {
			company_id: companyMsg?.id,
			name: copyProfileName
		}
		const createProfileRes = await createProfile(params)
		if (createProfileRes?.status == "success") {
			let copyProfileOptionMsg = generateOptionMsgFromProfileScript(profile, unitMsg?.attribute_tree);
			let addProfileData = createProfileRes?.data;

			const addProfileOptionMsg: any = pickProductProductTypeOpen(copyProfileOptionMsg)

			if (!addProfileOptionMsg) {
				notification.success({
					message: "Success",
					description: "Copy successfully",
				});
			}

			setFullLoading(false)
			let scriptMsg: string = generateProfileScriptFromProfileOptionMsg(
				projectMsg?.attribute_tree,
				quoteMsg?.attribute_tree,
				itemMsg?.attribute_tree,
				unitMsg?.attribute_tree,
				addProfileOptionMsg
			);
			console.log(addProfileOptionMsg, 'addProfileOptionMsgaddProfileOptionMsg')
			let saveReturnMsg: Record<string, any> = await saveProfileScript(addProfileData.id, scriptMsg);

			if (saveReturnMsg.status == "success") {
				setFullLoading(false)
				allProfile.push(saveReturnMsg?.data)
				setAllProfile([...allProfile])
				notification.success({
					message: "Success",
					description: "Copy successfully",
				});
			} else {
				setFullLoading(false)
				notification.error({
					message: "Error",
					description: saveReturnMsg?.data?.response?.data?.detail || "Copy failed."
				});
			}
		} else {
			notification.error({
				message: "Error",
				description: createProfileRes?.data?.response?.data?.detail || "Copy failed."
			});
		}
	};

	const onViewProfileScript = (scriptMsg: string) => {
		setProfileScriptMsg(scriptMsg)
		setIsShowViewScriptDataModal(true)
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
									const open = copyProfileopenId === item.id;
									return (
										(item.isAdd && !item.id)
											? <div
												key={index}
												className='w-full flex p-2 border-b border-b-[#EBEDF0] items-center'
												onClick={(e) => { e.stopPropagation() }}
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
													cursor-pointer
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
													onClick={(e) => { e.stopPropagation() }}
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
													<Popover
														content={
															<div className="w-[200px]" onClick={(e) => { e.stopPropagation(); }}>
																<Input
																	size="small"
																	placeholder="Enter profile name"
																	value={copyProfileName}
																	onChange={(e) => setCopyProfileName(e.target.value)}
																/>
																<div className="flex justify-end gap-2 mt-2">
																	<Button
																		size="small"
																		onClick={(e) => {
																			e.stopPropagation();
																			setCopyProfileopenId(null)
																		}}
																	>
																		Cancel
																	</Button>
																	<Button
																		size="small"
																		type="primary"
																		onClick={(e) => {
																			e.stopPropagation();
																			setCopyProfileopenId(null);
																			onCopyProfile(item)
																		}}
																	>
																		Confirm
																	</Button>
																</div>
															</div>
														}
														trigger="click"
														open={open}
														placement="bottom"
														onOpenChange={(v: any) => {
															setCopyProfileName("")
															setCopyProfileopenId(v ? item.id : null);
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
														title="Delete the profile"
														description="Are you sure to delete this profile?"
														onConfirm={() => deleteProfileFromDB(item, index)}
														onCancel={() => { }}
														okText="Yes"
														cancelText="No"
													>
														<DeleteOutlined onClick={(e) => { e.stopPropagation() }} className="text-[#B1B1B1] hover:text-[#FF4D4F]" />
													</Popconfirm>
													<EyeOutlined
														onClick={(e) => {
															e.stopPropagation();
															onViewProfileScript(item?.script_msg)
														}}
														className="text-[#B1B1B1] hover:text-[#595959]"
													/>
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

						<Dropdown
							menu={{
								items: [
									{
										key: 'title',
										label: (
											<div className="text-[12px] text-[#999]">
												Move to profile
											</div>
										),
										disabled: true,
									},
									...allProfile
										.filter((item: any) => item.id != selectedProfile.id)
										.map((item: any) => ({
											key: item.id,
											label: item.name,
											onClick: () => {
												onCopyProductTypeToProfile(item)
											},
										})),
								]
							}}
							placement="bottomLeft"
						>
							<Button size='small' className='text-[#717171] text-[12px]'>
								Copy & Move to
							</Button>
						</Dropdown>

					</div>
					<div className='flex-1 p-4 pl-5 pr-5' style={{ height: "calc(100% - 30px)" }}>
						<div className='h-[50%] overflow-y-auto'>
							{
								!selectedProfile?.id &&
								<div
									style={{ border: "1px dashed #EBEDF0", height: "86px", fontSize: "12px" }}
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
											let isSelected = item.option === selectedProductType.option;
											const selectedStyle = isSelected
												? {
													background: "#E3EBF8"
												}
												: {

												}
											return <div
												key={item.option}
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
												onClick={() => onSelectedProductType(item)}
											>
												<div className='flex'>
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
												<div
													className="
														ml-6
														flex
														gap-4
														transition-opacity
														duration-200
														pointer-events-none
														group-hover:pointer-events-auto
													"
												>
													<Popconfirm
														title="Delete the product type"
														description="Are you sure to delete this product type?"
														onConfirm={() => onDeleteProductType(item)}
														onCancel={() => { }}
														okText="Yes"
														cancelText="No"
													>
														<DeleteOutlined onClick={(e) => { e.stopPropagation() }} style={{ fontSize: "14px" }} className="text-[#B1B1B1] hover:text-[#FF4D4F]" />
													</Popconfirm>
													<Checkbox
														style={{
															transform: "scale(0.8)",
															transformOrigin: "left center",
														}}
														checked={item.isChecked}
														onChange={(e) => { onChangeProductTypeSelected(e, item) }}
														onClick={(e) => { e.stopPropagation() }}
													></Checkbox>
												</div>
											</div>
										})
									}
								</div>
							}
						</div>
						<div className='text-[12px] pt-2 h-[50%]'>
							<div className='text-[#717171]'>Options</div>
							<div className='mt-2 mb-2'>
								<Input
									placeholder="Single Swing, Hopper"
									prefix={<SearchOutlined className='text-[#DCDCDC]' />}
									value={productTypesLibrarySearchWord}
									onChange={changeProductTypesLibrarySearchWordAndAlreadyExistence}
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
													<Tooltip placement="right" title={'Click to add'}>
														<div className='ml-2 flex-1'>
															<div>{item.product_type_name}</div>
															<div style={{ fontSize: "10px" }} className='text-[#717171]'>{item.product_name}</div>
														</div>
													</Tooltip>
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
					<div className='p-4 pl-5 pr-5' style={{ height: "calc(100% - 30px)" }}>
						<div className='h-[50%] overflow-y-auto'>
							{
								(!selectedProfile?.id || !selectedProductType?.option) &&
								<div
									style={{ border: "1px dashed #EBEDF0", fontSize: "12px" }}
									className='p-6 pl-10 pr-10 flex text-center items-center justify-center rounded-md text-[#A3A3A3]'
								>
									Please select profile and product type
								</div>
							}
							{
								(selectedProfile?.id && selectedProductType?.option && operabilityMsg.length == 0) &&
								<div
									style={{ border: "1px dashed #EBEDF0", fontSize: "12px" }}
									className='p-6 pl-10 pr-10 flex items-center justify-center text-center rounded-md text-[#A3A3A3]'
								>
									Select the window and door opens you offer for this type.
								</div>
							}
							{
								(selectedProfile?.id && selectedProductType?.option && operabilityMsg.length != 0) &&
								<div className='text-[12px]'>
									{
										operabilityMsg.map((item: any, index: any) => {

											return <div
												key={item.option}
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
												<div className='flex items-center'>
													<AntdImage
														src={getFileUrlByAllOpenLibrary(item)}
														width={35}
														style={{ borderRadius: "6px" }}
														preview={{
															mask: <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '14px' }}><EyeOutlined /></div>,
														}}
													>

													</AntdImage>

													<div className='ml-2'>
														<div>{item?.optionMsg?.name}</div>
													</div>
												</div>
												<div
													className="
														ml-6
														flex
														gap-4
														transition-opacity
														duration-200
														pointer-events-none
														group-hover:pointer-events-auto
													"
												>
													<Popconfirm
														title="Delete the operability"
														description="Are you sure to delete this operability?"
														onConfirm={() => onDeleteOpen(item)}
														onCancel={() => { }}
														okText="Yes"
														cancelText="No"
													>
														<DeleteOutlined onClick={(e) => { e.stopPropagation() }} style={{ fontSize: "14px" }} className="text-[#B1B1B1] hover:text-[#FF4D4F]" />
													</Popconfirm>
												</div>
											</div>
										})
									}
								</div>
							}
						</div>
						<div className='text-[12px] pt-2 h-[50%]'>
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
													onClick={() => onAddToProductType(item)}
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
													<Tooltip placement="right" title={'Click to add'}>
														<div className='ml-2 flex-1'>
															<div>{item.name}</div>
														</div>
													</Tooltip>

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
			<Modal
				title="View Script Data"
				open={isShowViewScriptDataModal}
				onCancel={()=>setIsShowViewScriptDataModal(false)}
				footer={null}
				centered
				maskClosable={false}
				width={'1000px'}
				destroyOnHidden={true}
			>
				<ViewScriptCom scriptMsg={profileScriptMsg}>

				</ViewScriptCom>
			</Modal>
			<LoadingScreen isLoading={fullLoading}></LoadingScreen>
		</div>
	);
};

export default ParameterBaseEditor;
