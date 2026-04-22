"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Flex, Spin, Modal, Select, Radio, Divider, Descriptions, FloatButton, notification } from "antd";
import { DatabaseOutlined, LoadingOutlined, SaveOutlined, ProfileOutlined, FolderViewOutlined, RadiusBottomleftOutlined, PlusOutlined, CopyOutlined, DeleteOutlined, LeftOutlined, PlusCircleOutlined } from '@ant-design/icons';
import LoadingScreen from "@/components/loading-screen";
import OptionTreeNodeCom from "@/app/profile-editor-demo/components/optionTreeNode";
import ViewScriptCom from "@/app/profile-editor-demo/components/viewScript";
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
	generateProfileScriptFromProfileOptionMsg
} from "@/app/profile-editor-demo/logics";
import { OptionMsgVO } from "@/app/profile-editor-demo/validators";

const ProfileEditorCom = () => {

	const searchParams = useSearchParams();
	const profileVersionId = searchParams.get("version") || "1b1cdb63-1c27-49c0-9c64-303d4ee4f13a";

	const [profileMsg, setProfileMsg] = useState<Record<string, any>>({});
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
	const [unitAttributesTree, setUnitAttributesTree] = useState<any[]>([]);
	const [projectMsg, setProjectMsg] = useState<Record<string, any>>({});
	const [quoteMsg, setQuoteMsg] = useState<Record<string, any>>({});
	const [itemMsg, setItemMsg] = useState<Record<string, any>>({});
	const [unitMsg, setUnitMsg] = useState<Record<string, any>>({});

	const [isShowViewScriptDataModal, setIsShowViewScriptDataModal] = useState<boolean>(false);
	const [profileScriptMsg, setProfileScriptMsg] = useState<string>("");

	const [fullLoading, setFullLoading] = useState<boolean>(false);

	useEffect(() => {
		(async () => {
			setFullLoading(true)
			const profileMsg = await fetchProfileMsgByVersionId(profileVersionId);
			if (profileMsg.status == "success") {
				const data = profileMsg?.data;
				setProfileMsg(data);

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
				setFullLoading(false)
				setProjectMsg(projectAttributesWithOptions?.data);
				setQuoteMsg(quoteAttributesWithOptions?.data);
				setItemMsg(itemAttributesWithOptions?.data);
				setUnitMsg(unitAttributesWithOptions?.data);

				generateOptionMsg(data, unitAttributesWithOptions?.data)
			}
		})();
	}, []);

	const generateOptionMsg = (profileMsg: Record<string, any>, unitMsg: Record<string, any>) => {
		let unitAttributesTreeMsg = processUnitAttributeTree(unitMsg?.attribute_tree)
		setUnitAttributesTree([unitAttributesTreeMsg])
		let profileOptionMsg = generateOptionMsgFromProfileScript(profileMsg, unitMsg?.attribute_tree);
		setProfileOptionMsg(profileOptionMsg)
	};

	// 增加子节点
	const addSubOptionHandler = (optionItemMsg: OptionMsgVO) => {
		let newOptionItemMsg = addSubOption(optionItemMsg)
		let newProfileOptionMsg = updateOption(newOptionItemMsg, profileOptionMsg)
		setProfileOptionMsg(newProfileOptionMsg)
	};

	// 增加兄弟节点
	const addSiblingOptionHandler = (optionItemMsg: OptionMsgVO) => {
		let newOptionItemMsg = addSiblingOption(optionItemMsg, profileOptionMsg)
		let newProfileOptionMsg = updateOption(newOptionItemMsg, profileOptionMsg)
		setProfileOptionMsg(newProfileOptionMsg)
	};

	// 删除节点
	const deleteNode = (optionItemMsg: OptionMsgVO) => {
		let newProfileOptionMsg = deleteItem(optionItemMsg, profileOptionMsg)
		setProfileOptionMsg(newProfileOptionMsg)
	};

	// 复制节点
	const copyNode = (optionItemMsg: OptionMsgVO) => {
		let newProfileOptionMsg = copyItem(optionItemMsg, profileOptionMsg)
		setProfileOptionMsg(newProfileOptionMsg)
	};

	// 修改attribute
	const onChangeAttribute = (attributeCode: string, optionItemMsg: OptionMsgVO) => {
		let attributeMsg = getAttributeMsgByAttribute(attributeCode, unitAttributesTree[0]);
		let options = getOptionsByAttributeCode(attributeCode, unitAttributesTree[0]);
		optionItemMsg.attribute = attributeCode
		optionItemMsg.attributeMsg = attributeMsg
		optionItemMsg.options = options
		let newProfileOptionMsg = updateOption(optionItemMsg, profileOptionMsg)
		setProfileOptionMsg(newProfileOptionMsg)
	};

	// 修改option
	const onChangeOption = (optionCode: string, optionItemMsg: OptionMsgVO) => {
		let optionMsg = getOptionMsgByOption(optionCode, optionItemMsg.options)
		optionItemMsg.option = optionCode
		optionItemMsg.optionMsg = optionMsg
		let newProfileOptionMsg = updateOption(optionItemMsg, profileOptionMsg)
		setProfileOptionMsg(newProfileOptionMsg)
	};

	// 展开收起
	const onToggleHandler = (id: string) => {
		const dfs = (node: OptionMsgVO): OptionMsgVO => {
			if (node.id === id) {
				return { ...node, _collapsed: !node._collapsed };
			}
			return {
				...node,
				children: node.children.map(dfs),
			};
		};

		setProfileOptionMsg(dfs(profileOptionMsg));
	};

	// 查看脚本
	const openViewScriptDataModal = () => {
		let scriptMsg: string = generateProfileScriptFromProfileOptionMsg(
			projectMsg?.attribute_tree,
			quoteMsg?.attribute_tree,
			itemMsg?.attribute_tree,
			unitMsg?.attribute_tree,
			profileOptionMsg
		)
		setProfileScriptMsg(scriptMsg)
		setIsShowViewScriptDataModal(true)
	};

	// 关闭查看脚本弹窗
	const closeViewScriptDataModal = () => {
		setIsShowViewScriptDataModal(false)
	};

	// 保存脚本
	const onSaveScript = async () => {
		let scriptMsg: string = generateProfileScriptFromProfileOptionMsg(
			projectMsg?.attribute_tree,
			quoteMsg?.attribute_tree,
			itemMsg?.attribute_tree,
			unitMsg?.attribute_tree,
			profileOptionMsg
		);
		setFullLoading(true)
		let checkReturnMsg: Record<string, any> = await baseCheckProfileScript(scriptMsg);
		if (checkReturnMsg.status == "success") {

			notification.success({
				message: "Success",
				description: "Profile script base check successfully.",
			});

			let saveReturnMsg: Record<string, any> = await saveProfileScript(profileMsg.id, scriptMsg);

			if (saveReturnMsg.status == "success") {
				setFullLoading(false)
				notification.success({
					message: "Success",
					description: "Profile edit successfully..",
				});

				const profileMsg = await fetchProfileMsgByVersionId(profileVersionId);
				if (profileMsg.status == "success") {
					const data = profileMsg?.data;
					setProfileMsg(data);
					generateOptionMsg(data, unitMsg)
				}

			} else {
				setFullLoading(false)
				notification.error({
					message: "Error",
					description: saveReturnMsg?.data?.response?.data?.detail || "Profile edit failed."
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

	return (
		<div
			className="p-4 h-screen text-sm"
		>
			<div>
				<Descriptions bordered size="small" column={5}>
					<Descriptions.Item span={1} label="Profile Version">{profileMsg?.version_msg?.version_name}</Descriptions.Item>
					<Descriptions.Item span={1} label="Project Version">{projectMsg?.version_msg?.version_name}</Descriptions.Item>
					<Descriptions.Item span={1} label="Quote Version">{quoteMsg?.version_msg?.version_name}</Descriptions.Item>
					<Descriptions.Item span={1} label="Item Version">{itemMsg?.version_msg?.version_name}</Descriptions.Item>
					<Descriptions.Item span={1} label="Unit Version">{unitMsg?.version_msg?.version_name}</Descriptions.Item>
				</Descriptions>
			</div>
			<div>
				{
					(unitAttributesTree && unitAttributesTree.length != 0) && <OptionTreeNodeCom
						optionItemMsg={profileOptionMsg}
						attributesTree={unitAttributesTree}
						addSubOptionHandler={addSubOptionHandler}
						addSiblingOptionHandler={addSiblingOptionHandler}
						deleteNode={deleteNode}
						copyNode={copyNode}
						onChangeAttribute={onChangeAttribute}
						onChangeOption={onChangeOption}
						onToggleHandler={onToggleHandler}
					/>
				}
			</div>
			<FloatButton.Group
				trigger="hover"
				icon={<DatabaseOutlined />}
				type="primary"
				style={{
					left: 65,
					right: "auto",
					bottom: 16,
				}}
			>
				<FloatButton
					tooltip={{
						title: "View Script",
						placement: "right"
					}}
					icon={<ProfileOutlined />}
					onClick={openViewScriptDataModal}
				/>
				<FloatButton
					tooltip={{
						title: "Save Script",
						placement: "right"
					}}
					icon={<SaveOutlined />}
					onClick={onSaveScript}
				/>
			</FloatButton.Group>
			<Modal
				title="View Script Data"
				open={isShowViewScriptDataModal}
				onCancel={closeViewScriptDataModal}
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

export default ProfileEditorCom;
