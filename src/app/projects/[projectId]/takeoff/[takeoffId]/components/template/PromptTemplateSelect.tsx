"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Popover, Spin, Tooltip } from "antd";
import { DownOutlined } from "@ant-design/icons";

export interface PromptTemplateItem {
	id: number;
	name: string;
	is_default?: boolean;
	create_user?: string;
}

interface PromptTemplateSelectProps {
	templates: PromptTemplateItem[];
	selectedTemplateId?: number;
	currentUsername?: string;
	loading?: boolean;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	onChange: (id: number) => void;
	onEditTemplates?: () => void;
}

export const resolvePreferredTemplateId = (
	templates: PromptTemplateItem[],
	currentUsername?: string,
) => {
	if (!Array.isArray(templates) || templates.length === 0) return undefined;

	const myDefaultTemplate = templates.find(
		(template) =>
			template.create_user === currentUsername && Boolean(template.is_default),
	);
	if (myDefaultTemplate?.id) {
		return myDefaultTemplate.id;
	}

	const standardTemplate =
		templates.find((template) => template.id === 1) ||
		templates.find((template) => template.name?.toLowerCase() === "standard template");
	if (standardTemplate?.id) {
		return standardTemplate.id;
	}

	return templates[0]?.id;
};

const PromptTemplateSelect = ({
	templates,
	selectedTemplateId,
	currentUsername,
	loading = false,
	disabled = false,
	placeholder = "Please select a template",
	className = "",
	onChange,
	onEditTemplates,
}: PromptTemplateSelectProps) => {
	const [open, setOpen] = useState(false);

	const OverflowTooltipText = ({
		text,
		className,
	}: {
		text: string;
		className?: string;
	}) => {
		const textRef = useRef<HTMLSpanElement | null>(null);
		const [showTooltip, setShowTooltip] = useState(false);

		useEffect(() => {
			const checkOverflow = () => {
				const element = textRef.current;
				if (!element) return;
				setShowTooltip(element.scrollWidth > element.clientWidth);
			};

			checkOverflow();
			window.addEventListener("resize", checkOverflow);

			const observer = new ResizeObserver(() => {
				checkOverflow();
			});
			if (textRef.current) {
				observer.observe(textRef.current);
			}

			return () => {
				window.removeEventListener("resize", checkOverflow);
				observer.disconnect();
			};
		}, [text]);

		return (
			<Tooltip title={showTooltip ? text : null} placement="topLeft">
				<span ref={textRef} className={className}>
					{text}
				</span>
			</Tooltip>
		);
	};

	const standardTemplate = useMemo(() => {
		if (!templates.length) return null;
		return (
			templates.find((template) => template.id === 1) ||
			templates.find(
				(template) => template.name?.toLowerCase() === "standard template",
			) ||
			null
		);
	}, [templates]);

	const myTemplates = useMemo(() => {
		if (!templates.length) return [];
		return templates.filter(
			(template) =>
				template.id !== standardTemplate?.id &&
				template.create_user === currentUsername,
		);
	}, [templates, currentUsername, standardTemplate]);

	const companyTemplates = useMemo(() => {
		if (!templates.length) return [];
		return templates.filter(
			(template) =>
				template.id !== standardTemplate?.id &&
				template.create_user !== currentUsername,
		);
	}, [templates, currentUsername, standardTemplate]);

	const selectedTemplate = useMemo(() => {
		return templates.find((template) => template.id === selectedTemplateId) || null;
	}, [templates, selectedTemplateId]);

	const handleSelect = (id: number) => {
		onChange(id);
		setOpen(false);
	};

	const renderItem = (template: PromptTemplateItem) => {
		const isSelected = template.id === selectedTemplateId;
		return (
			<div
				key={template.id}
				className={`group px-3 h-[36px] rounded-md cursor-pointer flex justify-between items-center ${isSelected ? "bg-forumBlue-light-active" : "hover:bg-grey-light"
					}`}
				onClick={() => handleSelect(template.id)}
			>
				<OverflowTooltipText
					text={template.name}
					className="text-xs truncate flex-1 min-w-0"
				/>
				{isSelected && <span className="text-xxs text-forumBlue-normal">✅</span>}
			</div>
		);
	};

	const content = (
		<div className="w-[250px] max-h-[360px] py-1 overflow-y-auto">
			{loading ? (
				<div className="h-[100px] flex items-center justify-center">
					<Spin size="small" />
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{standardTemplate && (
						<>
							<div className="text-xs text-forumBlue-normal px-1">
								Standard Template
							</div>
							{renderItem(standardTemplate)}
						</>
					)}
					{myTemplates.length > 0 && (
						<div className="text-xs text-forumBlue-normal px-1 pt-1">
							My Templates
						</div>
					)}
					{myTemplates.map(renderItem)}
					{companyTemplates.length > 0 && (
						<div className="text-xs text-forumBlue-normal px-1 pt-1">
							Company Templates
						</div>
					)}
					{companyTemplates.map(renderItem)}
					{!templates.length && (
						<div className="text-xs text-grey-normal px-2 py-4 text-center">
							No templates found
						</div>
					)}
				</div>
			)}
			{onEditTemplates && (
				<div className="mt-2 pt-2 border-t border-primaryN30">
					<div
						className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-forumBlue-normal hover:bg-primaryN20"
						onClick={() => {
							setOpen(false);
							onEditTemplates();
						}}
					>
						<span>Edit Prompts</span>
						<span className="text-[18px] leading-none">+</span>
					</div>
				</div>
			)}
		</div>
	);

	return (
		<Popover
			trigger="click"
			placement="bottomLeft"
			content={content}
			open={open}
			onOpenChange={(nextOpen) => {
				if (disabled) return;
				setOpen(nextOpen);
			}}
		>
			<div
				className={`h-[32px] px-3 border border-primaryN30 rounded-md bg-white flex items-center justify-between gap-2 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
					} ${className}`}
			>
				<OverflowTooltipText
					text={selectedTemplate?.name || placeholder}
					className="text-xs truncate text-grey-dark flex-1 min-w-0"
				/>
				<DownOutlined className="text-[10px] text-grey-normal" />
			</div>
		</Popover>
	);
};

export default PromptTemplateSelect;
