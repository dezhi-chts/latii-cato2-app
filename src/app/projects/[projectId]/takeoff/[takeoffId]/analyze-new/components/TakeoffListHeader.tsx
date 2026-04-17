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
						{/* <Popover title={null} content={summaryTooltip} color="white">
							<InfoCircleOutlined />
						</Popover> */}
					</div>
					<Divider type="vertical" className="!h-7 !bg-primaryN30" />
				</div>
				<div className="flex items-center gap-10">
					<div className="flex flex-col">
						<span className="text-lg text-center">
							{summaryStats?.unique_labels_quantity ?? 0}
						</span>
						<span className="text-sm text-grey-normal">Unique Labels</span>
					</div>
					<div className="flex flex-col">
						<span className="text-lg text-center">
							{summaryStats?.doors_quantity ?? 0}
						</span>
						<span className="text-sm text-grey-normal">Doors</span>
					</div>
					<div className="flex flex-col">
						<span className="text-lg text-center">
							{summaryStats?.windows_quantity ?? 0}
						</span>
						<span className="text-sm text-grey-normal">Windows</span>
					</div>
					<div className="flex flex-col">
						<span className="text-lg text-center">
							{summaryStats?.system_quantity ?? 0}
						</span>
						<span className="text-sm text-grey-normal">Systems</span>
					</div>
					<div className="flex flex-col">
						<span className="text-lg text-center">
							{summaryStats?.total_units_quantity ?? 0}
						</span>
						<span className="text-sm text-grey-normal">Total Units</span>
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
