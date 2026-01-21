"use client";

import { Menu, Dropdown } from "antd";
import React from "react";

type HeaderOption = {
	id: number;
	text: string;
	isDirectory: boolean,
	children: HeaderOption[]
};

const headerOptions: HeaderOption[] = [
	{
		id: 1,
		text: "Your Company",
		isDirectory: false,
		children: []
	},
	{
		id: 2,
		text: "Libraries",
		isDirectory: true,
		children: [
			{
				id: 2.1,
				text: "Parameters",
				isDirectory: false,
				children: []
			}, {
				id: 2.2,
				text: "Base",
				isDirectory: false,
				children: []
			}, {
				id: 2.3,
				text: "Options",
				isDirectory: false,
				children: []
			}
		]
	}
];

type HeaderProps = {
	selectedOptionId: number;
	setSelectedOptionId: React.Dispatch<React.SetStateAction<number>>;
};

const Header = ({ selectedOptionId, setSelectedOptionId }: HeaderProps) => {

	const handleOptionClick = (id: number) => {
		if (id === selectedOptionId) return;
		setSelectedOptionId(id);
	};

	return (
		<div className="w-full flex flex-col gap-2 border-b-primaryN30 border-b">
			<div className="flex flex-col gap-1.5 pl-10">
				<p className="text-forumBlue" style={{ fontSize: "18px" }}>Brand Management</p>
			</div>

			<div className="flex pl-10 relative" style={{ bottom: "-1px" }}>
				{headerOptions.map((option, index) => {
					let isSelected = option.id === selectedOptionId;
					if (!isSelected){
						if (option.children && option.children.length != 0){
							option.children.forEach((s)=>{
								if(s.id == selectedOptionId){
									isSelected = true
								}
							})
						}
					}
					const conditionalStyle = isSelected
						? {
							color: "#555555",
							borderBottom: "2px solid #555555",
							fontWeight: "border",
						}
						: {
							color: "#A3A3A3"
						}
					const items:any = []
					if (option.children && option.children.length != 0){
						option.children.forEach((s)=>{
							items.push({
								key: s.id,
								label: <div className="text-xs">{s.text}</div>,
							})
						})
					}
					return (
						option.isDirectory ?
						<React.Fragment key={option.id}>
							<Dropdown 
								menu={{ 
									items: items,
									onClick: (key:any) => {
										handleOptionClick(Number(key.key));
									},
									selectedKeys: selectedOptionId ? [selectedOptionId.toString()] : [],
								}} 
								placement="bottomLeft"
							>
								<div
									className="p-4 cursor-pointer text-xs"
									style={conditionalStyle}
									key={option.id}
								>
									{option.text}
								</div>
							</Dropdown>
						</React.Fragment> :
						<div
							className="p-4 cursor-pointer text-xs"
							style={conditionalStyle}
							key={option.id}
							onClick={() => handleOptionClick(option.id)}
						>
							{option.text}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default Header;
