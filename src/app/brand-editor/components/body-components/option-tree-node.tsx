"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Flex, Select, Radio, Divider, Descriptions, TreeSelect, Tooltip } from "antd";
import { DatabaseOutlined, PlusCircleFilled, SaveOutlined, ProfileOutlined, FolderViewOutlined, RadiusBottomleftOutlined, PlusOutlined, CopyOutlined, DeleteOutlined, LeftOutlined, PlusCircleOutlined } from '@ant-design/icons';
import {
	OptionMsgVO
} from "@/app/brand-editor/components/body-components/validators";
import OptionItemCom from "@/app/brand-editor/components/body-components/option-item";

const OptionTreeNodeCom = (props: any) => {

	const [optionItemMsg, setOptionItemMsg] = useState<OptionMsgVO>(props.optionItemMsg);
	const [setedOptionLibraryList, setSetedOptionLibraryList] = useState<any[]>(props.setedOptionLibraryList);

	useEffect(() => {
		setOptionItemMsg(props.optionItemMsg)
	}, [props.optionItemMsg]);

	useEffect(() => {
		setSetedOptionLibraryList(props.setedOptionLibraryList)
	}, [props.setedOptionLibraryList]);

	const addSubOptionHandler = (node: OptionMsgVO) => {
		props.addSubOptionHandler(node)
	};

	const addSiblingOptionHandler = (node: OptionMsgVO) => {
		props.addSiblingOptionHandler(node)
	};

	const deleteNode = (node: OptionMsgVO) => {
		props.deleteNode(node)
	};

	const copyNode = (node: OptionMsgVO) => {
		props.copyNode(node)
	};

	const onChangeAttribute = (attributeCode: string, node: OptionMsgVO) => {
		props.onChangeAttribute(attributeCode, node)
	};

	const onChangeOption = (optionCode: string[], node: OptionMsgVO) => {
		props.onChangeOption(optionCode, node)
	};

	const onToggleHandler = (id: string) => {
		props.onToggleHandler(id)
	};

	return (
		<div className="flex items-stretch relative">
			{/* 当前节点 */}
			<OptionItemCom
				optionItemMsg={optionItemMsg}
				setedOptionLibraryList={setedOptionLibraryList}
				addSubOptionHandler={addSubOptionHandler}
				addSiblingOptionHandler={addSiblingOptionHandler}
				deleteNode={deleteNode}
				copyNode={copyNode}
				onChangeAttribute={onChangeAttribute}
				onChangeOption={onChangeOption}
				onToggleHandler={onToggleHandler}
			/>

			{/* 子节点 */}
			{optionItemMsg.children?.length > 0 && !optionItemMsg._collapsed && (
				<div className="flex flex-col relative">
					{optionItemMsg.children.map((child) => (
						<OptionTreeNodeCom
							key={child.id}
							optionItemMsg={child}
							setedOptionLibraryList={setedOptionLibraryList}
							addSubOptionHandler={addSubOptionHandler}
							addSiblingOptionHandler={addSiblingOptionHandler}
							deleteNode={deleteNode}
							copyNode={copyNode}
							onChangeAttribute={onChangeAttribute}
							onChangeOption={onChangeOption}
							onToggleHandler={onToggleHandler}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default OptionTreeNodeCom;