"use client";

import {
	DownloadOutlined,
	FileSearchOutlined,
	InfoCircleOutlined,
} from "@ant-design/icons";
import { Button, Divider, Dropdown, Popover, Tooltip } from "antd";

import { ProjectFileRecord, SummaryStats } from "../types";

interface TakeoffListHeaderProps {
	takeoffName: string;
	files: ProjectFileRecord[];
	selectedFileId: number;
	summaryStats: SummaryStats;
	downloadLoading?: boolean;
	onSelectFile: (fileId: number) => void;
	onResetTakeoff: () => void;
	onDownload: () => void;
}

export default function TakeoffListHeader({
	takeoffName,
	files,
	selectedFileId,
	summaryStats,
	downloadLoading = false,
	onSelectFile,
	onResetTakeoff,
	onDownload,
}: TakeoffListHeaderProps) {
	const fileMenuItems = files.map((file, index) => ({
		key: String(file?.id),
		label: (
			<div className="flex flex-col py-1">
				<span className="text-xs text-grey-dark">
					{file?.file_name || `File ${index + 1}`}
				</span>
				<span className="text-xxs text-grey-normal">
					ID: {file?.id}
					{selectedFileId === file?.id ? " • Current" : ""}
				</span>
			</div>
		),
	}));

	const summaryTooltip = (
		<div className="w-[400px] rounded-2xl bg-white text-ms text-grey-normal">
			<p className="mb-2 font-semibold text-grey-normal">Summary Data</p>
			<ul className="list-disc pl-6">
				<li>
					<span className="font-semibold text-grey-normal">Items:</span> The
					total count of primary labels in your takeoff list (excludes sub-items
					inside systems).
				</li>
				<li>
					<span className="font-semibold text-grey-normal">Products:</span> The
					overall quantity (the sum of quantities across all labels).
				</li>
				<li>
					<span className="font-semibold text-grey-normal">Systems:</span> The
					number of labels that are classified as systems.
				</li>
				<li>
					<span className="font-semibold text-grey-normal">Boxed Items:</span>{" "}
					Items specifically marked within the boxing takeoff section.
				</li>
			</ul>
		</div>
	);

	return (
		<div className="flex min-h-[118px] items-center justify-between border-b border-primaryN30 bg-white px-14">
			<div className="flex items-center gap-6">
				<div className="min-w-[260px] text-base">
					{takeoffName || "Untitled Takeoff"}
				</div>
				<Dropdown
					menu={{
						items: fileMenuItems,
						onClick: ({ key }) => onSelectFile(Number(key)),
					}}
					trigger={["click"]}
				>
					{/* <Button
						className="!h-[32px] !rounded-md !border-primaryN30 !px-3 !text-xs !text-grey-dark"
						icon={<FileSearchOutlined />}
					>
						Files
					</Button> */}
				</Dropdown>
			</div>

			<div className="flex items-center gap-8">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-1 text-sm text-forumBlue-normal">
						<span>Summary</span>
						<Popover title={null} content={summaryTooltip} color="white">
							<InfoCircleOutlined />
						</Popover>
					</div>
					<Divider type="vertical" className="!h-7 !bg-primaryN30" />
				</div>

				<div className="flex items-center gap-10">
					<div className="flex flex-col">
						<span className="text-lg leading-5">
							{summaryStats?.items || 0}
						</span>
						<span className="text-sm text-grey-normal">Items</span>
					</div>
					<div className="flex flex-col">
						<span className="text-lg leading-5">
							{summaryStats?.products || 0}
						</span>
						<span className="text-sm text-grey-normal">Products</span>
					</div>
					<div className="flex flex-col">
						<span className="text-lg leading-5">
							{summaryStats?.systems || 0}
						</span>
						<span className="text-sm text-grey-normal">Systems</span>
					</div>
					<div className="flex flex-col">
						<span className="text-lg leading-5">
							{summaryStats?.boxedItems || 0}
						</span>
						<span className="text-sm text-grey-normal">Boxed Items</span>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<Button
					className="custom-default-btn !w-auto !px-4"
					onClick={onResetTakeoff}
				>
					Reset Takeoff
				</Button>
				<Button
					className="custom-primary-btn !w-auto !px-4"
					icon={<DownloadOutlined />}
					loading={downloadLoading}
					onClick={onDownload}
				>
					Download
				</Button>
			</div>
		</div>
	);
}
